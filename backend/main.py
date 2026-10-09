from contextlib import asynccontextmanager, contextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database
import user_profile as profiles
import sample


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the history once, before the first request
    database.init_db(profiles.load()["timezone"])
    yield


app = FastAPI(title="Chronicle API", lifespan=lifespan)

# The app runs on your own machine. Only the local frontend may call it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def history():
    """A connection for one request. Says so plainly when there is no history to read."""
    conn = database.get_db_connection()
    try:
        if not database.has_history(conn):
            raise HTTPException(status_code=409, detail="No listening history is loaded yet.")
        yield conn
    finally:
        conn.close()


class Chapter(BaseModel):
    name: str
    start: str
    end: str


class Profile(BaseModel):
    timezone: str
    mode: str
    chapters: list[Chapter] = []


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/status")
def api_status():
    conn = database.get_db_connection()
    try:
        return database.status(conn)
    finally:
        conn.close()


@app.get("/api/profile")
def api_profile():
    return profiles.load()


@app.put("/api/profile")
def api_save_profile(body: Profile):
    if body.mode not in ("years", "custom"):
        raise HTTPException(status_code=422, detail="Mode must be 'years' or 'custom'.")
    try:
        chapters = profiles.clean_chapters([c.model_dump() for c in body.chapters])
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if body.mode == "custom" and not chapters:
        raise HTTPException(status_code=422, detail="Add at least one chapter.")

    conn = database.get_db_connection()
    try:
        if not database.valid_timezone(conn, body.timezone):
            raise HTTPException(status_code=422, detail=f"'{body.timezone}' is not a time zone.")
        before = profiles.load()
        profile = {"timezone": body.timezone, "mode": body.mode, "chapters": chapters}
        profiles.save(profile)
        if before["timezone"] != body.timezone and database.has_history(conn):
            database.set_timezone(conn, body.timezone)
        return profile
    finally:
        conn.close()


@app.get("/api/core_stats")
def api_core_stats():
    from analysis.core_stats import get_core_stats
    with history() as conn:
        return get_core_stats(conn)


@app.get("/api/behavioral_stats")
def api_behavioral_stats():
    from analysis.behavioral import (
        get_skipper_psychology, get_ghost_tracks,
        get_vampire_vs_sunlight, get_loop_obsession, get_binge_listen_curve,
        get_loyalty_index, get_one_hit_fixations, get_temporal_splits,
        get_incognito_sessions, get_short_attention, get_time_preferences
    )
    with history() as conn:
        return {
            "skipper_psychology": get_skipper_psychology(conn),
            "ghost_tracks": get_ghost_tracks(conn),
            "vampire_vs_sunlight": get_vampire_vs_sunlight(conn),
            "loop_obsession": get_loop_obsession(conn),
            "binge_listen": get_binge_listen_curve(conn),
            "loyalty_index": get_loyalty_index(conn),
            "one_hit_fixations": get_one_hit_fixations(conn),
            "temporal_splits": get_temporal_splits(conn),
            "incognito_sessions": get_incognito_sessions(conn),
            "short_attention": get_short_attention(conn),
            "time_preferences": get_time_preferences(conn)
        }


@app.get("/api/genre_stats")
def api_genre_stats():
    from analysis.genres import fetch_genre_stats
    with history() as conn:
        return fetch_genre_stats(conn)


@app.get("/api/eras")
def api_eras():
    from analysis.eras import get_era_stats
    with history() as conn:
        return get_era_stats(conn, profiles.chapters_for(profiles.load(), conn))


@app.get("/api/geo")
def api_geo():
    from analysis.geo import get_geo_stats
    with history() as conn:
        return get_geo_stats(conn)


def _rebuild():
    try:
        database.rebuild_db(profiles.load()["timezone"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    conn = database.get_db_connection()
    try:
        return database.status(conn)
    finally:
        conn.close()


@app.post("/api/recalibrate")
def api_recalibrate():
    """Throws the database away and reads every file in data/ again."""
    return _rebuild()


@app.post("/api/upload")
async def api_upload(files: list[UploadFile] = File(...)):
    try:
        saved = database.save_uploads([(f.filename or "", await f.read()) for f in files])
    except Exception:
        raise HTTPException(status_code=422, detail="That file could not be read. Is it the zip from Spotify?")
    if not saved:
        raise HTTPException(
            status_code=422,
            detail="No Streaming_History_Audio files in there. Spotify calls the right export 'Extended streaming history'.",
        )
    return _rebuild()


@app.post("/api/sample")
def api_sample():
    """Writes a made-up history, so the app can be tried with no export. Never over real files."""
    if database.audio_files():
        raise HTTPException(status_code=409, detail="There is history in data/ already. The sample would mix with it.")
    sample.write(database.DATA_DIR)
    return _rebuild()
