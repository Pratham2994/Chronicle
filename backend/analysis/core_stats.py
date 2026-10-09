import duckdb

HOUR_MS = 3600000


def get_core_stats(conn: duckdb.DuckDBPyConnection) -> dict:
    total_ms, plays, tracks, unique_artists = conn.execute("""
        SELECT
            COALESCE(SUM(ms_played), 0),
            COUNT(*),
            COUNT(DISTINCT master_metadata_track_name || ' / ' || master_metadata_album_artist_name),
            COUNT(DISTINCT master_metadata_album_artist_name)
        FROM history
    """).fetchone()
    total_hours = total_ms / HOUR_MS

    # Longest run of days with at least one play
    dates = [row[0] for row in conn.execute("""
        SELECT DISTINCT CAST(parsed_ts AS DATE) as play_date
        FROM history
        WHERE parsed_ts IS NOT NULL
        ORDER BY play_date
    """).fetchall()]

    max_streak = 0
    streak_end = None
    current_streak = 0
    prev_date = None
    for d in dates:
        current_streak = current_streak + 1 if prev_date is not None and (d - prev_date).days == 1 else 1
        if current_streak > max_streak:
            max_streak = current_streak
            streak_end = d
        prev_date = d

    top_artists = [
        {"name": name, "count": count, "hours": round(ms / HOUR_MS, 1)}
        for name, count, ms in conn.execute("""
            SELECT master_metadata_album_artist_name as name, count(*) as count, SUM(ms_played) as ms
            FROM history
            WHERE master_metadata_album_artist_name IS NOT NULL
            GROUP BY name
            ORDER BY ms DESC
            LIMIT 50
        """).fetchall()
    ]

    def track_list(where: str):
        return [
            {"name": name, "artist": artist, "count": count, "hours": round(ms / HOUR_MS, 1)}
            for name, artist, count, ms in conn.execute(f"""
                SELECT
                    master_metadata_track_name as name,
                    master_metadata_album_artist_name as artist,
                    count(*) as count,
                    SUM(ms_played) as ms
                FROM history
                WHERE master_metadata_track_name IS NOT NULL {where}
                GROUP BY name, artist
                ORDER BY ms DESC
                LIMIT 50
            """).fetchall()
        ]

    top_tracks = track_list("")
    # Played with no connection at all: the songs that were saved to the device
    offline_survival_tracks = track_list("AND offline = true")

    # One row for each year, with the artist that owned it
    years = [
        {"year": int(year), "hours": round(ms / HOUR_MS, 1), "plays": count, "top_artist": artist}
        for year, ms, count, artist in conn.execute("""
            WITH per_year AS (
                SELECT EXTRACT(year FROM parsed_ts) as year, SUM(ms_played) as ms, COUNT(*) as plays
                FROM history
                GROUP BY year
            ),
            ranked AS (
                SELECT
                    EXTRACT(year FROM parsed_ts) as year,
                    master_metadata_album_artist_name as artist,
                    ROW_NUMBER() OVER (PARTITION BY EXTRACT(year FROM parsed_ts) ORDER BY SUM(ms_played) DESC) as rn
                FROM history
                WHERE master_metadata_album_artist_name IS NOT NULL
                GROUP BY year, artist
            )
            SELECT p.year, p.ms, p.plays, r.artist
            FROM per_year p
            LEFT JOIN ranked r ON r.year = p.year AND r.rn = 1
            ORDER BY p.year
        """).fetchall()
    ]

    # Hours listened in each hour of each weekday. Row 0 is Monday.
    clock = [[0.0] * 24 for _ in range(7)]
    for dow, hour, ms in conn.execute("""
        SELECT EXTRACT(ISODOW FROM parsed_ts), EXTRACT(hour FROM parsed_ts), SUM(ms_played)
        FROM history
        WHERE parsed_ts IS NOT NULL
        GROUP BY 1, 2
    """).fetchall():
        clock[int(dow) - 1][int(hour)] = round(ms / HOUR_MS, 1)

    busiest = conn.execute("""
        SELECT CAST(parsed_ts AS DATE) as day, SUM(ms_played) as ms
        FROM history
        WHERE parsed_ts IS NOT NULL
        GROUP BY day
        ORDER BY ms DESC
        LIMIT 1
    """).fetchone()

    return {
        "total_hours": round(total_hours, 2),
        "total_days": round(total_hours / 24, 2),
        "total_plays": int(plays),
        "total_tracks": int(tracks),
        "total_artists": int(unique_artists),
        "active_days": len(dates),
        "longest_streak": max_streak,
        "streak_end": str(streak_end) if streak_end else None,
        "busiest_day": {"date": str(busiest[0]), "hours": round(busiest[1] / HOUR_MS, 1)} if busiest else None,
        "top_artists": top_artists,
        "top_tracks": top_tracks,
        "offline_survival_tracks": offline_survival_tracks,
        "years": years,
        "clock": clock,
    }
