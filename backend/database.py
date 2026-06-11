import duckdb
import os
import glob

DB_PATH = "spotify_history.duckdb"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

def get_db_connection():
    return duckdb.connect(DB_PATH)

def init_db():
    conn = get_db_connection()
    table_exists = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'history'").fetchone()[0] > 0
    if not table_exists:
        _ingest_data(conn)
    return conn

def recalibrate_db():
    conn = get_db_connection()
    print("Initiating Recalibration Sequence...")
    conn.execute("DROP TABLE IF EXISTS history")
    conn.execute("DROP TABLE IF EXISTS genre_mapping")
    _ingest_data(conn)
    return True

def _ingest_data(conn):
    print(f"Scanning {DATA_DIR} for Audio telemetry...")
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print("Created data/ directory. Please add Streaming_History_Audio_*.json files.")
        return

    # Strict file matching for audio only
    json_pattern = os.path.join(DATA_DIR, "Streaming_History_Audio_*.json")
    files = glob.glob(json_pattern)
    
    if not files:
        print(f"Warning: No files found matching {json_pattern}")
        return

    print(f"Found {len(files)} telemetry files. Compiling massive dataset into DuckDB...")
    
    # union_by_name handles slight schema variations across years
    conn.execute(f"""
        CREATE TABLE history AS 
        SELECT * FROM read_json_auto('{json_pattern}', format='array', union_by_name=true)
    """)
    
    # Build standard temporal columns
    conn.execute("""
        ALTER TABLE history ADD COLUMN parsed_ts TIMESTAMP;
        UPDATE history SET parsed_ts = ts;
    """)
    print("Ingestion complete. Chronicle Engine ready.")

if __name__ == "__main__":
    init_db()
