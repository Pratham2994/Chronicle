"""
The part of Chronicle that is about you, not about the data: your time zone, and the
chapters of your life. It is one small JSON file next to the database.
"""
import json
import os
from datetime import date

from database import BACKEND_DIR

PROFILE_PATH = os.path.join(BACKEND_DIR, "profile.json")
DEFAULT = {"timezone": "UTC", "mode": "years", "chapters": []}


def load() -> dict:
    if os.path.exists(PROFILE_PATH):
        try:
            with open(PROFILE_PATH, "r", encoding="utf-8") as f:
                return {**DEFAULT, **json.load(f)}
        except (OSError, ValueError):
            pass
    return dict(DEFAULT)


def save(profile: dict):
    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(profile, f, ensure_ascii=False, indent=2)


def clean_chapters(chapters: list[dict]) -> list[dict]:
    """Checks the chapters someone typed in. Raises ValueError with a message they can read."""
    cleaned = []
    for chapter in chapters:
        name = str(chapter.get("name", "")).strip()
        if not name:
            raise ValueError("Every chapter needs a name.")
        try:
            start = date.fromisoformat(str(chapter.get("start")))
            end = date.fromisoformat(str(chapter.get("end")))
        except ValueError:
            raise ValueError(f"'{name}' needs a start date and an end date.")
        if end < start:
            raise ValueError(f"'{name}' ends before it starts.")
        cleaned.append({"name": name, "start": start.isoformat(), "end": end.isoformat()})

    cleaned.sort(key=lambda c: c["start"])
    names = [c["name"] for c in cleaned]
    if len(set(names)) != len(names):
        raise ValueError("Two chapters have the same name.")
    for before, after in zip(cleaned, cleaned[1:]):
        if after["start"] <= before["end"]:
            raise ValueError(f"'{before['name']}' and '{after['name']}' overlap.")
    return cleaned


def chapters_for(profile: dict, conn) -> list[dict]:
    """Your own chapters if you wrote some. If not, one chapter for each calendar year."""
    if profile.get("mode") == "custom" and profile.get("chapters"):
        return profile["chapters"]
    first, last = conn.execute(
        "SELECT EXTRACT(year FROM min(parsed_ts)), EXTRACT(year FROM max(parsed_ts)) FROM history"
    ).fetchone()
    if first is None:
        return []
    return [
        {"name": str(year), "start": f"{year}-01-01", "end": f"{year}-12-31"}
        for year in range(int(first), int(last) + 1)
    ]
