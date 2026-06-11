import duckdb

def get_geo_stats(conn: duckdb.DuckDBPyConnection):
    # 1. Base country stats
    country_query = """
    WITH CountryBase AS (
        SELECT 
            conn_country as country,
            SUM(ms_played) as ms_played,
            MIN(strftime(parsed_ts, '%Y-%m')) as first_visit,
            MAX(strftime(parsed_ts, '%Y-%m')) as last_visit,
            COUNT(DISTINCT master_metadata_album_artist_name) as unique_artists,
            SUM(CASE WHEN platform ILIKE '%iOS%' OR platform ILIKE '%Android%' THEN 1 ELSE 0 END) as mobile_plays,
            SUM(CASE WHEN platform ILIKE '%Windows%' OR platform ILIKE '%Mac%' OR platform ILIKE '%web%' THEN 1 ELSE 0 END) as desktop_plays,
            SUM(CASE WHEN (EXTRACT(hour FROM parsed_ts) >= 23 OR EXTRACT(hour FROM parsed_ts) < 5) THEN ms_played ELSE 0 END) as vampire_ms,
            SUM(CASE WHEN (EXTRACT(hour FROM parsed_ts) >= 9 AND EXTRACT(hour FROM parsed_ts) < 17) THEN ms_played ELSE 0 END) as sunlight_ms
        FROM history
        WHERE conn_country IS NOT NULL AND conn_country != 'ZZ' AND length(conn_country) = 2
        GROUP BY conn_country
    )
    SELECT * FROM CountryBase ORDER BY ms_played DESC
    """
    country_df = conn.execute(country_query).df()

    # 2. Top Artists per country
    artists_query = """
    WITH CountryArtists AS (
        SELECT 
            conn_country as country,
            master_metadata_album_artist_name as artist,
            SUM(ms_played) as ms_played
        FROM history
        WHERE conn_country IS NOT NULL AND conn_country != 'ZZ' AND length(conn_country) = 2
          AND master_metadata_album_artist_name IS NOT NULL
        GROUP BY conn_country, artist
    ),
    RankedArtists AS (
        SELECT 
            country,
            artist,
            ROW_NUMBER() OVER(PARTITION BY country ORDER BY ms_played DESC) as rn
        FROM CountryArtists
    )
    SELECT country, LIST(artist ORDER BY rn ASC) as top_artists
    FROM RankedArtists
    WHERE rn <= 3
    GROUP BY country
    """
    artists_df = conn.execute(artists_query).df()

    # 3. Top Genres per country
    genre_exists = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'genre_mapping'").fetchone()[0] > 0
    genres_df = None
    if genre_exists:
        genres_query = """
        WITH CountryGenres AS (
            SELECT 
                h.conn_country as country,
                g.genre,
                SUM(h.ms_played) as ms_played
            FROM history h
            JOIN genre_mapping g ON h.master_metadata_album_artist_name = g.artist
            WHERE h.conn_country IS NOT NULL AND h.conn_country != 'ZZ' AND length(h.conn_country) = 2
              AND g.genre != 'Unknown'
            GROUP BY h.conn_country, g.genre
        ),
        RankedGenres AS (
            SELECT 
                country,
                genre,
                ROW_NUMBER() OVER(PARTITION BY country ORDER BY ms_played DESC) as rn
            FROM CountryGenres
        )
        SELECT country, LIST(genre ORDER BY rn ASC) as top_genres
        FROM RankedGenres
        WHERE rn <= 3
        GROUP BY country
        """
        genres_df = conn.execute(genres_query).df()

    # 4. Top 3 Tracks per country
    tracks_query = """
    WITH CountryTracks AS (
        SELECT 
            conn_country as country,
            master_metadata_track_name as track,
            master_metadata_album_artist_name as artist,
            SUM(ms_played) as ms_played
        FROM history
        WHERE conn_country IS NOT NULL AND conn_country != 'ZZ' AND length(conn_country) = 2
          AND master_metadata_track_name IS NOT NULL
        GROUP BY conn_country, track, artist
    ),
    RankedTracks AS (
        SELECT 
            country,
            track,
            artist,
            ms_played,
            ROW_NUMBER() OVER(PARTITION BY country ORDER BY ms_played DESC) as rn
        FROM CountryTracks
    )
    SELECT country, track, artist, ms_played FROM RankedTracks WHERE rn <= 3 ORDER BY country, rn
    """
    tracks_df = conn.execute(tracks_query).df()

    # Combine
    geo_data = []
    for _, row in country_df.iterrows():
        country = str(row['country'])
        hours = round(float(row['ms_played']) / 3600000, 1)
        
        # Skip anomalous countries
        if hours < 1:
            continue
            
        art_row = artists_df[artists_df['country'] == country]
        top_artists = list(art_row['top_artists'].values[0]) if not art_row.empty else []
        
        top_genres = []
        if genres_df is not None:
            gen_row = genres_df[genres_df['country'] == country]
            top_genres = list(gen_row['top_genres'].values[0]) if not gen_row.empty else []
            
        track_rows = tracks_df[tracks_df['country'] == country]
        top_tracks = []
        for _, tr in track_rows.iterrows():
            top_tracks.append({
                "track": str(tr['track']),
                "artist": str(tr['artist']),
                "hours": round(float(tr['ms_played']) / 3600000, 1)
            })
            
        first_visit = str(row['first_visit']) if row['first_visit'] else None
        last_visit = str(row['last_visit']) if row['last_visit'] else None

        mobile = int(row['mobile_plays'])
        desktop = int(row['desktop_plays'])
        total_plat = mobile + desktop
        mobile_pct = round((mobile / total_plat) * 100) if total_plat > 0 else 0
        desktop_pct = round((desktop / total_plat) * 100) if total_plat > 0 else 0

        vampire = round(float(row['vampire_ms']) / 3600000, 1)
        sunlight = round(float(row['sunlight_ms']) / 3600000, 1)

        geo_data.append({
            "id": country,
            "hours": hours,
            "first_visit": first_visit,
            "last_visit": last_visit,
            "unique_artists": int(row['unique_artists']),
            "mobile_pct": mobile_pct,
            "desktop_pct": desktop_pct,
            "vampire_hours": vampire,
            "sunlight_hours": sunlight,
            "top_artists": top_artists,
            "top_genres": top_genres,
            "top_tracks": top_tracks
        })

    return geo_data
