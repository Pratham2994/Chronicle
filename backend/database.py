import duckdb
import os
import glob

DB_PATH = "spotify_history.duckdb"

def init_db():
    """
    Initializes the DuckDB database and ingests all JSON files if the database does not exist
    or if the main 'history' table is empty.
    """
    conn = duckdb.connect(DB_PATH)
    
    # Check if history table exists
    table_exists = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'history'").fetchone()[0] > 0
    
    if not table_exists:
        print("Ingesting JSON files into DuckDB...")
        
        # We assume the backend directory is inside main, so the JSON files are in the parent directory.
        json_pattern = "../Streaming_History_Audio_*.json"
        files = glob.glob(json_pattern)
        
        if not files:
            print(f"No JSON files found matching pattern: {json_pattern}")
            # Try looking in the current directory as fallback
            json_pattern = "Streaming_History_Audio_*.json"
            files = glob.glob(json_pattern)
            if not files:
                print("Warning: No streaming history files found to ingest.")
                return conn

        print(f"Found {len(files)} files to ingest.")
        
        # DuckDB can ingest all matching JSON files in one go
        # The schema is inferred automatically
        conn.execute(f"""
            CREATE TABLE history AS 
            SELECT * FROM read_json_auto('{json_pattern}', format='array')
        """)
        
        # Add some useful columns (like parsed timestamp, date, etc.)
        conn.execute("""
            ALTER TABLE history ADD COLUMN parsed_ts TIMESTAMP;
            UPDATE history SET parsed_ts = ts;
        """)
        print("Ingestion complete.")
    else:
        print("Database already initialized and data ingested.")

    return conn

def get_db_connection():
    return duckdb.connect(DB_PATH)

if __name__ == "__main__":
    init_db()
