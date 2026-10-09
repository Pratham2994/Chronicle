import glob
import io
import os
import zipfile

import duckdb

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(BACKEND_DIR)
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(BACKEND_DIR, "spotify_history.duckdb")

# Spotify names every audio file like this. Video and podcast files have other names.
AUDIO_PREFIX = "Streaming_History_Audio_"
SAMPLE_FILE = AUDIO_PREFIX + "sample.json"


def get_db_connection():
    conn = duckdb.connect(DB_PATH)
    # The export is in UTC. With the session in UTC too, a cast never moves a time by accident.
    conn.execute("SET TimeZone='UTC'")
    return conn


def has_history(conn) -> bool:
    return conn.execute(
        "SELECT count(*) FROM information_schema.tables WHERE table_name = 'history'"
    ).fetchone()[0] > 0


def audio_files() -> list[str]:
    return sorted(glob.glob(os.path.join(DATA_DIR, AUDIO_PREFIX + "*.json")))


def valid_timezone(conn, name: str) -> bool:
    return conn.execute("SELECT count(*) FROM pg_timezone_names() WHERE name = ?", [name]).fetchone()[0] > 0


def init_db(timezone: str):
    conn = get_db_connection()
    try:
        if not has_history(conn):
            _ingest_data(conn, timezone)
    finally:
        conn.close()


def rebuild_db(timezone: str):
    conn = get_db_connection()
    try:
        conn.execute("DROP TABLE IF EXISTS history")
        conn.execute("DROP TABLE IF EXISTS genre_mapping")
        _ingest_data(conn, timezone)
    finally:
        conn.close()


def set_timezone(conn, timezone: str):
    """Spotify records each play in UTC. Every hour and every date in the app is local time."""
    conn.execute("UPDATE history SET parsed_ts = timezone(?, CAST(ts AS TIMESTAMPTZ))", [timezone])


def _ingest_data(conn, timezone: str):
    os.makedirs(DATA_DIR, exist_ok=True)
    files = audio_files()
    if not files:
        print(f"No {AUDIO_PREFIX}*.json files in {DATA_DIR}.")
        return

    print(f"Found {len(files)} history files. Loading them into DuckDB...")
    # union_by_name handles the small schema changes between years
    conn.execute(
        "CREATE TABLE history AS SELECT * FROM read_json_auto(?, format='array', union_by_name=true)",
        [files],
    )
    conn.execute("ALTER TABLE history ADD COLUMN parsed_ts TIMESTAMP")
    set_timezone(conn, timezone)
    print("Load complete.")


def status(conn) -> dict:
    files = [os.path.basename(f) for f in audio_files()]
    info = {"has_data": False, "files": files, "sample": files == [SAMPLE_FILE]}
    if has_history(conn):
        plays, first, last = conn.execute(
            "SELECT count(*), CAST(min(parsed_ts) AS DATE), CAST(max(parsed_ts) AS DATE) FROM history"
        ).fetchone()
        info.update({"has_data": plays > 0, "plays": plays, "first": str(first), "last": str(last)})
    return info


def save_uploads(uploads: list[tuple[str, bytes]]) -> list[str]:
    """
    Keeps the audio history files from an upload. An upload can be the JSON files, or the
    zip that Spotify sends. Everything else in the zip is ignored.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    saved = []

    def keep(name: str, content: bytes):
        # Only the file name is used, so a path inside a zip cannot write outside data/.
        base = os.path.basename(name.replace("\\", "/"))
        if base.startswith(AUDIO_PREFIX) and base.endswith(".json") and base != SAMPLE_FILE:
            with open(os.path.join(DATA_DIR, base), "wb") as f:
                f.write(content)
            saved.append(base)

    for name, content in uploads:
        if name.lower().endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                for member in archive.namelist():
                    if AUDIO_PREFIX in member:
                        keep(member, archive.read(member))
        else:
            keep(name, content)

    # Real history replaces the sample. The two are never mixed.
    sample = os.path.join(DATA_DIR, SAMPLE_FILE)
    if saved and os.path.exists(sample):
        os.remove(sample)
    return saved
