import duckdb
import requests
import json
import os
import concurrent.futures
from urllib.parse import quote_plus
import pandas as pd

CACHE_FILE = "itunes_genre_cache.json"

def fetch_itunes_genre(artist):
    try:
        url = f"https://itunes.apple.com/search?term={quote_plus(artist)}&entity=musicArtist&limit=1"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get('resultCount', 0) > 0:
                return artist, data['results'][0].get('primaryGenreName', 'Unknown')
    except Exception:
        pass
    return artist, 'Unknown'

def build_genre_cache(conn: duckdb.DuckDBPyConnection):
    df = conn.execute("""
        SELECT master_metadata_album_artist_name as artist
        FROM history
        WHERE master_metadata_album_artist_name IS NOT NULL
        GROUP BY artist
        ORDER BY SUM(ms_played) DESC
        LIMIT 300
    """).df()
    
    artists = df['artist'].tolist()
    
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cache = json.load(f)
        except Exception:
            pass

    missing_artists = [a for a in artists if a not in cache]
    
    if missing_artists:
        print(f"Fetching genres for {len(missing_artists)} artists from iTunes API...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = executor.map(fetch_itunes_genre, missing_artists)
            for artist, genre in results:
                cache[artist] = genre
                
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
            
    return cache

def fetch_genre_stats(conn: duckdb.DuckDBPyConnection) -> dict:
    cache = build_genre_cache(conn)
    genre_df = pd.DataFrame(list(cache.items()), columns=['artist', 'genre'])
    
    # We want to register the df so we can query it multiple times cleanly
    conn.register('genre_mapping', genre_df)

    # 1. Top Overall Genres with Artist Examples
    top_overall = conn.execute("""
        WITH TopGenres AS (
            SELECT g.genre, SUM(h.ms_played) as total_ms
            FROM history h
            JOIN genre_mapping g ON h.master_metadata_album_artist_name = g.artist
            WHERE g.genre != 'Unknown'
            GROUP BY g.genre
            ORDER BY total_ms DESC
            LIMIT 10
        ),
        ArtistRanks AS (
            SELECT 
                g.genre, 
                h.master_metadata_album_artist_name as artist,
                SUM(h.ms_played) as artist_ms,
                ROW_NUMBER() OVER(PARTITION BY g.genre ORDER BY SUM(h.ms_played) DESC) as rn
            FROM history h
            JOIN genre_mapping g ON h.master_metadata_album_artist_name = g.artist
            JOIN TopGenres tg ON g.genre = tg.genre
            GROUP BY g.genre, h.master_metadata_album_artist_name
        )
        SELECT 
            tg.genre, 
            tg.total_ms,
            LIST(ar.artist ORDER BY ar.rn ASC) FILTER (WHERE ar.rn <= 3) as top_artists
        FROM TopGenres tg
        JOIN ArtistRanks ar ON tg.genre = ar.genre
        GROUP BY tg.genre, tg.total_ms
        ORDER BY tg.total_ms DESC
    """).df()

    # 2. Vampire Genres
    vampire_genres = conn.execute("""
        SELECT g.genre, SUM(h.ms_played) as ms_played
        FROM history h
        JOIN genre_mapping g ON h.master_metadata_album_artist_name = g.artist
        WHERE g.genre != 'Unknown' 
          AND (EXTRACT(hour FROM h.parsed_ts) >= 23 OR EXTRACT(hour FROM h.parsed_ts) < 5)
        GROUP BY g.genre
        ORDER BY ms_played DESC
        LIMIT 3
    """).df()
    
    # 3. Sunlight Genres
    sunlight_genres = conn.execute("""
        SELECT g.genre, SUM(h.ms_played) as ms_played
        FROM history h
        JOIN genre_mapping g ON h.master_metadata_album_artist_name = g.artist
        WHERE g.genre != 'Unknown' 
          AND (EXTRACT(hour FROM h.parsed_ts) >= 9 AND EXTRACT(hour FROM h.parsed_ts) < 17)
        GROUP BY g.genre
        ORDER BY ms_played DESC
        LIMIT 3
    """).df()
    
    # 4. Global vs Regional Cultural Footprint
    # We heuristically categorize known regional genres vs global english-dominated genres
    regional_keywords = ['bollywood', 'tamil', 'telugu', 'j-pop', 'k-pop', 'latin', 'regional', 'indian', 'french', 'spanish', 'c-pop', 'punjabi']
    
    # Create the column natively in python based on fetched genres
    genre_df['cultural_category'] = genre_df['genre'].apply(
        lambda x: 'Regional/World' if any(k in str(x).lower() for k in regional_keywords) else 'Global/Western'
    )
    conn.register('genre_cultural_mapping', genre_df)
    
    culture_stats = conn.execute("""
        SELECT g.cultural_category, SUM(h.ms_played) as ms_played
        FROM history h
        JOIN genre_cultural_mapping g ON h.master_metadata_album_artist_name = g.artist
        WHERE g.genre != 'Unknown'
        GROUP BY g.cultural_category
    """).df()

    def format_df(df, is_top=False):
        res = []
        for _, row in df.iterrows():
            item = {"genre": row['genre'], "hours": round(row['ms_played' if not is_top else 'total_ms'] / 3600000, 1)}
            if is_top and 'top_artists' in row:
                item['artists'] = list(row['top_artists'])
            res.append(item)
        return res

    return {
        "top_genres": format_df(top_overall, is_top=True) if not top_overall.empty else [],
        "vampire_genres": format_df(vampire_genres) if not vampire_genres.empty else [],
        "sunlight_genres": format_df(sunlight_genres) if not sunlight_genres.empty else [],
        "cultural_split": culture_stats.to_dict('records') if not culture_stats.empty else []
    }
