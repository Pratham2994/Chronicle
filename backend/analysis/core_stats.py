import duckdb
import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

def get_spotify_client():
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    
    auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    return spotipy.Spotify(auth_manager=auth_manager)

def get_core_stats(conn: duckdb.DuckDBPyConnection) -> dict:
    # Total Playtime
    total_ms_df = conn.execute("SELECT SUM(ms_played) as total_ms FROM history").df()
    total_ms = int(total_ms_df['total_ms'][0]) if not total_ms_df.empty and pd.notnull(total_ms_df['total_ms'][0]) else 0
    total_hours = total_ms / (1000 * 60 * 60)
    total_days = total_hours / 24

    # Calculate Longest Listening Streak
    streak_df = conn.execute("""
        SELECT DISTINCT CAST(parsed_ts AS DATE) as play_date
        FROM history
        WHERE parsed_ts IS NOT NULL
        ORDER BY play_date
    """).df()
    
    max_streak = 0
    current_streak = 0
    prev_date = None
    for d in streak_df['play_date']:
        if prev_date is None:
            current_streak = 1
        else:
            if (d - prev_date).days == 1:
                current_streak += 1
            else:
                current_streak = 1
        max_streak = max(max_streak, current_streak)
        prev_date = d

    # Number of unique artists
    unique_artists = conn.execute("SELECT COUNT(DISTINCT master_metadata_album_artist_name) FROM history WHERE master_metadata_album_artist_name IS NOT NULL").fetchone()[0]

    # Top 50 Artists
    top_artists_df = conn.execute("""
        SELECT master_metadata_album_artist_name as name, count(*) as count 
        FROM history 
        WHERE master_metadata_album_artist_name IS NOT NULL
        GROUP BY name 
        ORDER BY count DESC 
        LIMIT 50
    """).df()
    top_artists = [{"name": row['name'], "count": row['count']} for _, row in top_artists_df.iterrows()]

    # Top 50 Tracks
    top_tracks_df = conn.execute("""
        SELECT master_metadata_track_name as name, count(*) as count 
        FROM history 
        WHERE master_metadata_track_name IS NOT NULL
        GROUP BY name 
        ORDER BY count DESC 
        LIMIT 50
    """).df()
    top_tracks = [{"name": row['name'], "count": row['count']} for _, row in top_tracks_df.iterrows()]
    
    # Offline Survival Pod (offline: true)
    offline_tracks_df = conn.execute("""
        SELECT master_metadata_track_name as name, count(*) as count 
        FROM history 
        WHERE offline = true AND master_metadata_track_name IS NOT NULL
        GROUP BY name 
        ORDER BY count DESC 
        LIMIT 50
    """).df()
    offline_survival_tracks = [{"name": row['name'], "count": row['count']} for _, row in offline_tracks_df.iterrows()]

    # Genres from Top 20 Artists
    genres = {}
    sp = get_spotify_client()
    if sp:
        top_20_artist_names = [a["name"] for a in top_artists[:20]]
        for artist_name in top_20_artist_names:
            try:
                results = sp.search(q='artist:' + artist_name, type='artist', limit=1)
                items = results['artists']['items']
                if items:
                    artist_genres = items[0]['genres']
                    for g in artist_genres:
                        genres[g] = genres.get(g, 0) + 1
            except Exception as e:
                print(f"Error fetching genre for {artist_name}: {e}")
                
    # Sort genres
    top_genres = sorted([{"name": k, "count": v} for k, v in genres.items()], key=lambda x: x["count"], reverse=True)

    return {
        "total_hours": round(total_hours, 2),
        "total_days": round(total_days, 2),
        "total_artists": int(unique_artists),
        "longest_streak": max_streak,
        "top_artists": top_artists,
        "top_tracks": top_tracks,
        "offline_survival_tracks": offline_survival_tracks,
        "top_genres": top_genres
    }
