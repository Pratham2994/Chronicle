from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import database

app = FastAPI(title="Spotify Extended History API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production this should be the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure database is ready before taking requests
    database.init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Telemetry Engine Online"}

@app.get("/api/core_stats")
def api_core_stats():
    conn = database.get_db_connection()
    try:
        from analysis.core_stats import get_core_stats
        return get_core_stats(conn)
    finally:
        conn.close()

@app.get("/api/behavioral_stats")
def api_behavioral_stats():
    conn = database.get_db_connection()
    try:
        from analysis.behavioral import (
            get_skipper_psychology, get_ghost_tracks, 
            get_vampire_vs_sunlight, get_loop_obsession, get_binge_listen_curve,
            get_loyalty_index, get_one_hit_fixations, get_temporal_splits,
            get_incognito_sessions, get_short_attention, get_time_preferences
        )
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
    finally:
        conn.close()

# Routers will be included here as we build them out
