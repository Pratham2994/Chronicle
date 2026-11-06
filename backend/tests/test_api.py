"""End to end through the HTTP API, on a temporary data folder and database.

Run from backend/:  uv run pytest
"""
import io
import json
import zipfile

import pytest
from fastapi.testclient import TestClient

import database
import user_profile
from analysis import genres

GENRES = {"Arijit Singh": "Bollywood", "Pritam": "Bollywood", "The Weeknd": "R&B/Soul", "AP Dhillon": "Worldwide"}


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setattr(database, "DB_PATH", str(tmp_path / "history.duckdb"))
    monkeypatch.setattr(user_profile, "PROFILE_PATH", str(tmp_path / "profile.json"))
    monkeypatch.setattr(genres, "CACHE_FILE", str(tmp_path / "genres.json"))
    # No network in tests: every artist gets a fixed genre, or "Pop"
    monkeypatch.setattr(genres, "fetch_itunes_genre", lambda artist: (artist, GENRES.get(artist, "Pop")))
    import main

    with TestClient(main.app) as c:
        yield c


def play(ts, track="Song", artist="Artist", ms=200_000, **extra):
    return {
        "ts": ts, "platform": "android", "ms_played": ms, "conn_country": "IN",
        "master_metadata_track_name": track, "master_metadata_album_artist_name": artist,
        "reason_start": "clickrow", "reason_end": "trackdone", "shuffle": False, "offline": False,
        "incognito_mode": False, **extra,
    }


def upload(client, name, content):
    return client.post("/api/upload", files=[("files", (name, content, "application/octet-stream"))])


def test_sample_history_numbers(client):
    assert client.get("/api/core_stats").status_code == 409
    status = client.post("/api/sample").json()
    assert status["plays"] == 26540 and status["sample"]
    assert client.put("/api/profile", json={"timezone": "Asia/Kolkata", "mode": "years", "chapters": []}).status_code == 200

    core = client.get("/api/core_stats").json()
    assert core["total_hours"] == 1274.75
    assert [a["name"] for a in core["top_artists"][:2]] == ["The Weeknd", "Arijit Singh"]
    assert [y["year"] for y in core["years"]] == list(range(2018, 2027))

    habits = client.get("/api/behavioral_stats").json()
    coefficients = habits["skipper_psychology"]["coefficients"]
    # sample.py makes shuffle the cause of extra skips, and the model must find it
    assert max(coefficients, key=lambda k: abs(coefficients[k])) == "shuffle_True"
    assert habits["short_attention"]["total_skips"] == 6252

    genre_stats = client.get("/api/genre_stats").json()
    assert genre_stats["top_genres"]
    eras = client.get("/api/eras").json()
    assert len(eras) == 9 and eras[0]["deep_dive"]["top_genres"]
    assert {p["id"] for p in client.get("/api/geo").json()} == {"IN", "JP", "SG", "AE"}


def test_any_chapter_name_works(client):
    client.post("/api/sample")
    chapters = [
        {"name": "School", "start": "2018-01-01", "end": "2020-05-31"},
        {"name": "Summer / Gap", "start": "2020-06-01", "end": "2020-07-31"},
        {"name": "College", "start": "2020-08-01", "end": "9999-12-31"},
    ]
    assert client.put("/api/profile", json={"timezone": "UTC", "mode": "custom", "chapters": chapters}).status_code == 200
    eras = client.get("/api/eras").json()
    assert [e["era_name"] for e in eras] == ["School", "Summer / Gap", "College"]
    assert sum(e["plays"] for e in eras) == 26540


def test_a_broken_file_changes_nothing(client):
    good = json.dumps([play("2024-01-01T10:00:00Z"), play("2024-01-02T10:00:00Z")]).encode()
    assert upload(client, "Streaming_History_Audio_2024.json", good).json()["plays"] == 2

    broken = upload(client, "Streaming_History_Audio_2025.json", b'[{"ts": "2025-01-01T00:00:00Z", "ms_played": 5')
    assert broken.status_code == 422
    assert "Streaming_History_Audio_2025.json" in broken.json()["detail"]
    status = client.get("/api/status").json()
    assert status["plays"] == 2 and status["files"] == ["Streaming_History_Audio_2024.json"]


def test_zip_upload_keeps_only_audio_history_inside_data(client):
    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w") as z:
        z.writestr("Spotify/../../evil/Streaming_History_Audio_2023.json", json.dumps([play("2023-05-01T10:00:00Z")]))
        z.writestr("Spotify/Streaming_History_Video_2023.json", "[]")
        z.writestr("Spotify/ReadMeFirst.pdf", "x")
    status = upload(client, "my_spotify_data.zip", archive.getvalue()).json()
    assert status["files"] == ["Streaming_History_Audio_2023.json"] and status["plays"] == 1


def test_on_repeat_needs_the_song_to_end_and_start_again(client):
    plays = [
        play("2024-01-01T10:00:00Z", track="Loop", reason_end="trackdone"),
        play("2024-01-01T10:04:00Z", track="Loop", reason_start="trackdone", reason_end="trackdone"),
        play("2024-01-01T10:08:00Z", track="Loop", reason_start="trackdone", reason_end="fwdbtn"),
        play("2024-01-01T10:09:00Z", track="Loop", reason_start="clickrow"),
    ]
    upload(client, "Streaming_History_Audio_2024.json", json.dumps(plays).encode())
    loops = client.get("/api/behavioral_stats").json()["loop_obsession"]
    assert loops == [{"name": "Loop", "loop_count": 2, "artist": "Artist"}]
