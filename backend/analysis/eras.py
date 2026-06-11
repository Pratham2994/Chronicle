import duckdb

def get_era_stats(conn: duckdb.DuckDBPyConnection):
    # Create a temporary view to classify rows into Eras based on User's exact academic dates
    conn.execute("""
    CREATE OR REPLACE TEMP VIEW Eras AS
    SELECT 
        *,
        CASE 
            WHEN parsed_ts < '2020-02-06' THEN 'The School Days'
            WHEN parsed_ts >= '2020-02-06' AND parsed_ts <= '2022-10-31' THEN 'Junior College'
            WHEN parsed_ts >= '2022-11-01' AND parsed_ts <= '2023-07-31' THEN 'Freshman Year'
            WHEN parsed_ts >= '2023-08-01' AND parsed_ts <= '2024-06-01' THEN 'Sophomore Year'
            WHEN parsed_ts >= '2024-08-01' AND parsed_ts <= '2025-07-31' THEN 'Junior Year'
            WHEN parsed_ts >= '2025-08-01' AND parsed_ts <= '2026-07-31' THEN 'Senior Year'
            ELSE 'Summer / Gap'
        END AS era_name,
        CASE 
            WHEN parsed_ts < '2020-02-06' THEN 1
            WHEN parsed_ts >= '2020-02-06' AND parsed_ts <= '2022-10-31' THEN 2
            WHEN parsed_ts >= '2022-11-01' AND parsed_ts <= '2023-07-31' THEN 3
            WHEN parsed_ts >= '2023-08-01' AND parsed_ts <= '2024-06-01' THEN 4
            WHEN parsed_ts >= '2024-08-01' AND parsed_ts <= '2025-07-31' THEN 5
            WHEN parsed_ts >= '2025-08-01' AND parsed_ts <= '2026-07-31' THEN 6
            ELSE 7
        END AS era_order
    FROM history
    WHERE parsed_ts IS NOT NULL
    """)

    # 1. Exploration Decay Curve
    decay_query = """
    SELECT 
        era_name, 
        era_order,
        COUNT(DISTINCT master_metadata_album_artist_name) as unique_artists,
        COUNT(*) as total_plays,
        COUNT(DISTINCT master_metadata_album_artist_name) * 1.0 / NULLIF(COUNT(*), 0) as discovery_ratio
    FROM Eras
    WHERE era_name != 'Summer / Gap'
    GROUP BY era_name, era_order
    ORDER BY era_order
    """
    decay_df = conn.execute(decay_query).df()

    # 2. Platform Migration (Mobile vs Desktop)
    platform_query = """
    SELECT 
        era_name,
        era_order,
        SUM(CASE WHEN platform ILIKE '%iOS%' OR platform ILIKE '%Android%' THEN 1 ELSE 0 END) as mobile_plays,
        SUM(CASE WHEN platform ILIKE '%Windows%' OR platform ILIKE '%Mac%' OR platform ILIKE '%web%' THEN 1 ELSE 0 END) as desktop_plays
    FROM Eras
    WHERE era_name != 'Summer / Gap'
    GROUP BY era_name, era_order
    ORDER BY era_order
    """
    platform_df = conn.execute(platform_query).df()

    # 3. Habitual Rut (Variance of daily play counts)
    rut_query = """
    WITH DailyCounts AS (
        SELECT 
            era_name,
            era_order,
            CAST(parsed_ts AS DATE) as play_date,
            COUNT(*) as daily_plays
        FROM Eras
        WHERE era_name != 'Summer / Gap'
        GROUP BY era_name, era_order, play_date
    )
    SELECT 
        era_name,
        era_order,
        STDDEV_POP(daily_plays) as rut_variance
    FROM DailyCounts
    GROUP BY era_name, era_order
    ORDER BY era_order
    """
    rut_df = conn.execute(rut_query).df()
    rut_df = rut_df.fillna(0)

    # 4. Top 3 Artists per Era
    top_artists_query = """
    WITH ArtistEraPlays AS (
        SELECT 
            era_name,
            era_order,
            master_metadata_album_artist_name as artist,
            SUM(ms_played) as ms_played
        FROM Eras
        WHERE master_metadata_album_artist_name IS NOT NULL
          AND era_name != 'Summer / Gap'
        GROUP BY era_name, era_order, artist
    ),
    RankedArtists AS (
        SELECT 
            era_name,
            era_order,
            artist,
            ROW_NUMBER() OVER(PARTITION BY era_name ORDER BY ms_played DESC) as rn
        FROM ArtistEraPlays
    )
    SELECT 
        era_name,
        era_order,
        LIST(artist ORDER BY rn ASC) as top_artists
    FROM RankedArtists
    WHERE rn <= 3
    GROUP BY era_name, era_order
    ORDER BY era_order
    """
    top_artists_df = conn.execute(top_artists_query).df()

    # 5. Top 5 Tracks per Era (with hours)
    top_tracks_query = """
    WITH TrackEraPlays AS (
        SELECT 
            era_name,
            era_order,
            master_metadata_track_name as track_name,
            master_metadata_album_artist_name as artist_name,
            SUM(ms_played) as ms_played
        FROM Eras
        WHERE master_metadata_track_name IS NOT NULL
          AND era_name != 'Summer / Gap'
        GROUP BY era_name, era_order, track_name, artist_name
    ),
    RankedTracks AS (
        SELECT 
            era_name,
            era_order,
            track_name,
            artist_name,
            ms_played,
            ROW_NUMBER() OVER(PARTITION BY era_name ORDER BY ms_played DESC) as rn
        FROM TrackEraPlays
    )
    SELECT * FROM RankedTracks WHERE rn <= 5 ORDER BY era_order, rn
    """
    top_tracks_df = conn.execute(top_tracks_query).df()

    # Loop Obsession Flags
    loop_query = """
    WITH Shifts AS (
        SELECT 
            era_name,
            master_metadata_track_name as track,
            reason_start,
            reason_end,
            LAG(master_metadata_track_name) OVER (ORDER BY parsed_ts) as prev_track
        FROM Eras
        WHERE master_metadata_track_name IS NOT NULL
    )
    SELECT era_name, track, COUNT(*) as loops
    FROM Shifts
    WHERE track = prev_track 
      AND reason_start = 'trackdone' 
      AND reason_end = 'trackdone'
    GROUP BY era_name, track
    HAVING COUNT(*) > 3
    """
    loop_flags_df = conn.execute(loop_query).df()

    # Check if genre_mapping exists before querying it
    genre_exists = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'genre_mapping'").fetchone()[0] > 0
    top_genres_df = None
    if genre_exists:
        top_genres_query = """
        WITH EraGenres AS (
            SELECT 
                e.era_name,
                e.era_order,
                g.genre,
                SUM(e.ms_played) as ms_played
            FROM Eras e
            JOIN genre_mapping g ON e.master_metadata_album_artist_name = g.artist
            WHERE g.genre != 'Unknown' AND e.era_name != 'Summer / Gap'
            GROUP BY e.era_name, e.era_order, g.genre
        ),
        RankedGenres AS (
            SELECT 
                era_name,
                era_order,
                genre,
                ms_played,
                ROW_NUMBER() OVER(PARTITION BY era_name ORDER BY ms_played DESC) as rn
            FROM EraGenres
        )
        SELECT * FROM RankedGenres WHERE rn <= 3 ORDER BY era_order, rn
        """
        top_genres_df = conn.execute(top_genres_query).df()

    # Monthly Sparkline
    sparkline_query = """
    SELECT 
        era_name,
        era_order,
        strftime(parsed_ts, '%Y-%m') as month,
        SUM(ms_played) as ms_played
    FROM Eras
    WHERE era_name != 'Summer / Gap'
    GROUP BY era_name, era_order, month
    ORDER BY era_order, month
    """
    sparkline_df = conn.execute(sparkline_query).df()

    # Top Discovery
    discovery_query = """
    WITH ArtistFirstPlays AS (
        SELECT 
            master_metadata_album_artist_name as artist,
            MIN(parsed_ts) as first_play
        FROM history
        WHERE master_metadata_album_artist_name IS NOT NULL
        GROUP BY artist
    ),
    EraBoundaries AS (
        SELECT era_name, MIN(parsed_ts) as era_start, MAX(parsed_ts) as era_end
        FROM Eras
        WHERE era_name != 'Summer / Gap'
        GROUP BY era_name
    ),
    EraDiscoveries AS (
        SELECT 
            e.era_name,
            e.master_metadata_album_artist_name as artist,
            SUM(e.ms_played) as ms_played
        FROM Eras e
        JOIN ArtistFirstPlays afp ON e.master_metadata_album_artist_name = afp.artist
        JOIN EraBoundaries eb ON e.era_name = eb.era_name
        WHERE afp.first_play >= eb.era_start 
          AND afp.first_play <= eb.era_end
          AND e.era_name != 'Summer / Gap'
        GROUP BY e.era_name, e.master_metadata_album_artist_name
    ),
    RankedDiscoveries AS (
        SELECT 
            era_name,
            artist,
            ms_played,
            ROW_NUMBER() OVER(PARTITION BY era_name ORDER BY ms_played DESC) as rn
        FROM EraDiscoveries
    )
    SELECT era_name, artist, ms_played FROM RankedDiscoveries WHERE rn = 1
    """
    discovery_df = conn.execute(discovery_query).df()

    # Compile the final result
    eras_data = []
    for i in range(len(decay_df)):
        era_name = str(decay_df.iloc[i]['era_name'])
        
        plat_row = platform_df[platform_df['era_name'] == era_name]
        rut_row = rut_df[rut_df['era_name'] == era_name]
        artist_row = top_artists_df[top_artists_df['era_name'] == era_name]
        track_rows = top_tracks_df[top_tracks_df['era_name'] == era_name]
        disc_row = discovery_df[discovery_df['era_name'] == era_name]
        spark_rows = sparkline_df[sparkline_df['era_name'] == era_name]
        
        # Tracks formatting
        top_tracks = []
        for _, tr in track_rows.iterrows():
            track_name = str(tr['track_name'])
            is_loop_obsession = False
            if not loop_flags_df.empty:
                flags = loop_flags_df[(loop_flags_df['era_name'] == era_name) & (loop_flags_df['track'] == track_name)]
                is_loop_obsession = not flags.empty
                
            top_tracks.append({
                "track": track_name,
                "artist": str(tr['artist_name']),
                "hours": round(float(tr['ms_played']) / 3600000, 1),
                "is_loop_obsession": is_loop_obsession
            })

        # Discovery formatting
        top_discovery = None
        if not disc_row.empty:
            top_discovery = {
                "artist": str(disc_row['artist'].values[0]),
                "hours": round(float(disc_row['ms_played'].values[0]) / 3600000, 1)
            }
            
        # Genre formatting
        top_genres = []
        if top_genres_df is not None:
            g_rows = top_genres_df[top_genres_df['era_name'] == era_name]
            for _, gr in g_rows.iterrows():
                top_genres.append({
                    "genre": str(gr['genre']),
                    "hours": round(float(gr['ms_played']) / 3600000, 1)
                })
                
        # Sparkline formatting
        sparkline = []
        for _, sp in spark_rows.iterrows():
            sparkline.append({
                "month": str(sp['month']),
                "hours": round(float(sp['ms_played']) / 3600000, 1)
            })

        mobile = int(plat_row['mobile_plays'].values[0]) if not plat_row.empty else 0
        desktop = int(plat_row['desktop_plays'].values[0]) if not plat_row.empty else 0
        total_platforms = mobile + desktop
        
        if total_platforms == 0:
            mobile_pct, desktop_pct = 0, 0
        else:
            mobile_pct = round((mobile / total_platforms) * 100)
            desktop_pct = round((desktop / total_platforms) * 100)

        rut_variance = float(rut_row['rut_variance'].values[0]) if not rut_row.empty else 0.0
        
        top_artists = list(artist_row['top_artists'].values[0]) if not artist_row.empty else []

        eras_data.append({
            "era_name": era_name,
            "discovery_ratio": round(float(decay_df.iloc[i]['discovery_ratio']), 4),
            "unique_artists": int(decay_df.iloc[i]['unique_artists']),
            "mobile_pct": mobile_pct,
            "desktop_pct": desktop_pct,
            "rut_variance": round(rut_variance, 2),
            "top_artists": top_artists,
            "deep_dive": {
                "top_tracks": top_tracks,
                "top_discovery": top_discovery,
                "top_genres": top_genres,
                "sparkline": sparkline
            }
        })

    return eras_data
