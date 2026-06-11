import duckdb
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

def get_skipper_psychology(conn: duckdb.DuckDBPyConnection) -> dict:
    # We will sample 100,000 rows to keep the ML model fast
    df = conn.execute("""
        SELECT 
            EXTRACT(hour FROM parsed_ts) as hour_of_day,
            shuffle,
            platform,
            CASE WHEN reason_end = 'fwdbtn' THEN 1 ELSE 0 END as skipped,
            CASE 
                WHEN platform ILIKE '%iOS%' OR platform ILIKE '%Android%' THEN 'Mobile'
                ELSE 'Desktop' 
            END as platform_type
        FROM history
        WHERE reason_end IS NOT NULL
        USING SAMPLE 100000
    """).df()

    if df.empty or df['skipped'].sum() == 0:
        return {"insight": "[ ERR: INSUFFICIENT TELEMETRY FOR SKIP ANALYSIS ]"}

    X = df[['hour_of_day', 'shuffle', 'platform_type']]
    y = df['skipped']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), ['hour_of_day']),
            ('cat', OneHotEncoder(drop='first'), ['shuffle', 'platform_type'])
        ])

    clf = Pipeline(steps=[('preprocessor', preprocessor),
                          ('classifier', LogisticRegression(class_weight='balanced'))])

    clf.fit(X, y)
    
    model = clf.named_steps['classifier']
    feature_names = (['hour_of_day'] + 
                     clf.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out().tolist())
    
    coefs = dict(zip(feature_names, model.coef_[0]))
    
    driver = max(coefs, key=lambda k: abs(coefs[k]))
    driver_val = coefs[driver]
    
    direction = "more" if driver_val > 0 else "less"
    
    if driver == 'hour_of_day':
        insight = f"Time of day heavily influences your attention span. Historically, you are {direction} likely to skip a song later in the day."
    elif driver == 'shuffle_True':
        insight = f"Shuffle mode changes your behavior. Overall, you are {direction} likely to skip when shuffle is ON."
    elif driver == 'platform_type_Mobile':
        insight = f"Platform context dictates patience. Historically, you are {direction} likely to skip when listening on a Mobile device."
    else:
        insight = "No singular dominant pattern detected. Your skip behavior is generally consistent."

    return {
        "insight": insight,
        "coefficients": coefs
    }

def get_ghost_tracks(conn: duckdb.DuckDBPyConnection) -> list:
    df = conn.execute("""
        WITH track_stats AS (
            SELECT 
                master_metadata_track_name as name,
                master_metadata_album_artist_name as artist,
                COUNT(*) as total_plays,
                SUM(CASE WHEN parsed_ts >= '2024-01-01' THEN 1 ELSE 0 END) as recent_plays
            FROM history
            WHERE master_metadata_track_name IS NOT NULL
            GROUP BY name, artist
        )
        SELECT name, artist, total_plays 
        FROM track_stats
        WHERE recent_plays = 0 AND total_plays > 50
        ORDER BY total_plays DESC
        LIMIT 20
    """).df()
    return df.to_dict(orient='records')

def get_vampire_vs_sunlight(conn: duckdb.DuckDBPyConnection) -> dict:
    df = conn.execute("""
        SELECT 
            SUM(CASE WHEN EXTRACT(hour FROM parsed_ts) >= 23 OR EXTRACT(hour FROM parsed_ts) < 5 THEN 1 ELSE 0 END) as vampire_plays,
            SUM(CASE WHEN EXTRACT(hour FROM parsed_ts) >= 9 AND EXTRACT(hour FROM parsed_ts) < 17 THEN 1 ELSE 0 END) as sunlight_plays
        FROM history
    """).df()
    
    v = int(df['vampire_plays'][0])
    s = int(df['sunlight_plays'][0])
    
    return {
        "vampire_plays": v,
        "sunlight_plays": s,
        "ratio": round(v / max(s, 1), 2)
    }

def get_loop_obsession(conn: duckdb.DuckDBPyConnection) -> dict:
    df = conn.execute("""
        WITH ordered_history AS (
            SELECT 
                master_metadata_track_name as name,
                reason_start,
                reason_end,
                LAG(master_metadata_track_name) OVER (ORDER BY parsed_ts) as prev_track,
                LAG(reason_end) OVER (ORDER BY parsed_ts) as prev_end
            FROM history
            WHERE master_metadata_track_name IS NOT NULL
        )
        SELECT name, COUNT(*) as loop_count
        FROM ordered_history
        WHERE name = prev_track 
          AND reason_start = 'trackdone' 
          AND prev_end = 'trackdone'
        GROUP BY name
        ORDER BY loop_count DESC
        LIMIT 10
    """).df()
    return df.to_dict(orient='records')

def get_binge_listen_curve(conn: duckdb.DuckDBPyConnection) -> dict:
    df = conn.execute("""
        SELECT 
            master_metadata_track_name as name,
            CAST(parsed_ts AS DATE) as play_date,
            COUNT(*) as daily_plays
        FROM history
        WHERE master_metadata_track_name IS NOT NULL
        GROUP BY name, play_date
        ORDER BY daily_plays DESC
        LIMIT 1
    """).df()
    
    if df.empty:
        return {"name": "None", "max_plays_in_24h": 0, "date": ""}
        
    return {
        "name": df['name'][0],
        "max_plays_in_24h": int(df['daily_plays'][0]),
        "date": str(df['play_date'][0])
    }

def get_loyalty_index(conn: duckdb.DuckDBPyConnection) -> dict:
    df = conn.execute("""
        WITH total_ms AS (SELECT SUM(ms_played) as t_ms FROM history),
        top_5_ms AS (
            SELECT SUM(ms_played) as t_ms FROM (
                SELECT master_metadata_album_artist_name, SUM(ms_played) as ms_played
                FROM history
                WHERE master_metadata_album_artist_name IS NOT NULL
                GROUP BY master_metadata_album_artist_name
                ORDER BY ms_played DESC
                LIMIT 5
            )
        )
        SELECT (SELECT t_ms FROM top_5_ms) / (SELECT t_ms FROM total_ms) * 100 as loyalty_percent
    """).df()
    val = float(df['loyalty_percent'][0]) if not df.empty and pd.notnull(df['loyalty_percent'][0]) else 0
    return {"loyalty_percent": round(val, 2)}

def get_one_hit_fixations(conn: duckdb.DuckDBPyConnection) -> list:
    df = conn.execute("""
        SELECT 
            master_metadata_album_artist_name as artist,
            MAX(master_metadata_track_name) as track,
            COUNT(*) as total_plays
        FROM history
        WHERE master_metadata_album_artist_name IS NOT NULL AND master_metadata_track_name IS NOT NULL
        GROUP BY artist
        HAVING COUNT(DISTINCT master_metadata_track_name) = 1 AND COUNT(*) > 20
        ORDER BY total_plays DESC
        LIMIT 5
    """).df()
    return df.to_dict(orient='records')

def get_temporal_splits(conn: duckdb.DuckDBPyConnection) -> dict:
    df = conn.execute("""
        SELECT 
            SUM(CASE WHEN EXTRACT(ISODOW FROM parsed_ts) IN (6, 7) THEN 1 ELSE 0 END) as weekend_plays,
            SUM(CASE WHEN EXTRACT(ISODOW FROM parsed_ts) IN (1,2,3,4,5) THEN 1 ELSE 0 END) as weekday_plays
        FROM history
    """).df()
    wp = int(df['weekend_plays'][0])
    wd = int(df['weekday_plays'][0])
    return {"weekend_plays": wp, "weekday_plays": wd}

def get_incognito_sessions(conn: duckdb.DuckDBPyConnection) -> int:
    df = conn.execute("SELECT COUNT(*) as count FROM history WHERE incognito_mode = true").df()
    return int(df['count'][0]) if not df.empty else 0

def get_short_attention(conn: duckdb.DuckDBPyConnection) -> dict:
    df = conn.execute("""
        SELECT 
            SUM(CASE WHEN reason_end = 'fwdbtn' AND ms_played < 30000 THEN 1 ELSE 0 END) as instant_skips,
            SUM(CASE WHEN reason_end = 'fwdbtn' THEN 1 ELSE 0 END) as total_skips
        FROM history
    """).df()
    i_skips = int(df['instant_skips'][0])
    t_skips = int(df['total_skips'][0])
    ratio = (i_skips / max(t_skips, 1)) * 100 if t_skips > 0 else 0
    return {
        "instant_skips": i_skips,
        "total_skips": t_skips,
        "ratio_percent": round(ratio, 2)
    }
