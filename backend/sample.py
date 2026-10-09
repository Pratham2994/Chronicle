"""
Writes a made-up listening history in Spotify's own export format, so Chronicle can be
tried before the real export arrives. The same seed gives the same history each time.

    uv run python sample.py
"""
import json
import os
import random
from datetime import datetime, timedelta, timezone

from database import DATA_DIR, SAMPLE_FILE

# (artist, songs, the years this artist is in rotation, how loud in the mix)
ARTISTS = [
    ("Alan Walker", ["Faded", "Alone", "Darkside"], (2018, 2020), 9),
    ("Marshmello", ["Happier", "Silence"], (2018, 2020), 6),
    ("Martin Garrix", ["Animals", "Scared to Be Lonely"], (2018, 2020), 6),
    ("Arijit Singh", ["Kesariya", "Tum Hi Ho", "Channa Mereya", "Agar Tum Saath Ho"], (2018, 2026), 6),
    ("Pritam", ["Ilahi", "Kabira", "Shayad"], (2018, 2026), 6),
    ("A.R. Rahman", ["Kun Faya Kun", "Jai Ho", "Tere Bina"], (2018, 2026), 5),
    ("Linkin Park", ["Numb", "In the End", "Faint"], (2019, 2022), 9),
    ("Imagine Dragons", ["Believer", "Demons", "Radioactive"], (2019, 2022), 8),
    ("Coldplay", ["Yellow", "Fix You", "Viva La Vida", "A Sky Full of Stars"], (2019, 2026), 6),
    ("Arctic Monkeys", ["Do I Wanna Know?", "505", "R U Mine?"], (2020, 2023), 7),
    ("Eminem", ["Lose Yourself", "Mockingbird", "Without Me"], (2020, 2024), 7),
    ("The Weeknd", ["Blinding Lights", "Starboy", "Save Your Tears", "Die For You"], (2020, 2026), 9),
    ("Travis Scott", ["SICKO MODE", "goosebumps", "HIGHEST IN THE ROOM"], (2022, 2025), 8),
    ("Kendrick Lamar", ["HUMBLE.", "Money Trees", "Not Like Us"], (2022, 2026), 8),
    ("Drake", ["God's Plan", "One Dance", "Passionfruit"], (2022, 2025), 5),
    ("AP Dhillon", ["Brown Munde", "Excuses", "Insane"], (2021, 2024), 7),
    ("Diljit Dosanjh", ["Lover", "G.O.A.T.", "Born to Shine"], (2022, 2026), 6),
    ("Seedhe Maut", ["Namastute", "Nanchaku", "101"], (2023, 2026), 7),
    ("YOASOBI", ["Idol", "Yoru ni Kakeru", "Gunjou"], (2023, 2026), 8),
    ("Kenshi Yonezu", ["KICK BACK", "Lemon"], (2023, 2026), 5),
    ("Daft Punk", ["Get Lucky", "One More Time", "Instant Crush"], (2021, 2026), 5),
    ("Tame Impala", ["The Less I Know The Better", "Let It Happen"], (2024, 2026), 6),
    ("Anuv Jain", ["Baarishein", "Husn", "Alag Aasmaan"], (2024, 2026), 7),
    ("Prateek Kuhad", ["cold/mess", "Kasoor"], (2024, 2026), 5),
    ("Hans Zimmer", ["Time", "Cornfield Chase"], (2021, 2026), 3),
    # One song each, played far too much
    ("Gotye", ["Somebody That I Used To Know"], (2019, 2021), 2),
    ("Passenger", ["Let Her Go"], (2020, 2023), 2),
]

# A few trips away from home: (first day, last day, country)
TRIPS = [
    (datetime(2023, 5, 20), datetime(2023, 5, 29), "AE"),
    (datetime(2024, 12, 14), datetime(2024, 12, 23), "SG"),
    (datetime(2025, 10, 3), datetime(2025, 10, 16), "JP"),
]

# How likely a session starts in each local hour. Late evening wins, 4 am is close to empty.
HOURS = [5, 3, 1, 0.3, 0.2, 0.3, 1, 2, 3, 3, 3, 3, 3, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 7]
HOME_OFFSET = timedelta(hours=5, minutes=30)


def build(seed: int = 7) -> list[dict]:
    rng = random.Random(seed)
    plays = []
    day = datetime(2018, 6, 1)
    last = datetime(2026, 9, 30)

    while day <= last:
        year = day.year
        pool = [a for a in ARTISTS if a[2][0] <= year <= a[2][1]]
        weights = [a[3] for a in pool]
        country = next((c for start, end, c in TRIPS if start <= day <= end), "IN")
        # More listening on weekends, and a quiet day now and then
        busy = 0.9 if day.weekday() >= 5 else 0.8

        if rng.random() < busy:
            for _ in range(rng.choice([1, 1, 2, 2, 3])):
                hour = rng.choices(range(24), HOURS)[0]
                moment = day + timedelta(hours=hour, minutes=rng.randrange(60))
                phone = rng.random() < (0.85 if year < 2022 or country != "IN" else 0.45)
                platform = ("android" if year < 2023 else "ios") if phone else "windows"
                shuffle = rng.random() < 0.4
                offline = phone and rng.random() < 0.06
                private = rng.random() < 0.01
                previous = None

                for _ in range(rng.randint(2, 9)):
                    artist, songs, _, _ = rng.choices(pool, weights)[0]
                    song = rng.choice(songs)
                    # Sometimes one song goes on repeat
                    repeats = rng.randint(4, 12) if rng.random() < 0.012 else 1
                    for _ in range(repeats):
                        length = rng.randint(170, 260) * 1000
                        skipped = repeats == 1 and rng.random() < (0.34 if shuffle else 0.2)
                        played = rng.randint(2, 70) * 1000 if skipped else length
                        moment += timedelta(milliseconds=played)
                        plays.append({
                            "ts": (moment - HOME_OFFSET).replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "platform": platform,
                            "ms_played": played,
                            "conn_country": country,
                            "master_metadata_track_name": song,
                            "master_metadata_album_artist_name": artist,
                            "master_metadata_album_album_name": song,
                            "reason_start": "trackdone" if previous == "trackdone" else "clickrow",
                            "reason_end": "fwdbtn" if skipped else "trackdone",
                            "shuffle": shuffle,
                            "skipped": skipped,
                            "offline": offline,
                            "incognito_mode": private,
                        })
                        previous = plays[-1]["reason_end"]
        day += timedelta(days=1)

    return plays


def write(folder: str = DATA_DIR) -> str:
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, SAMPLE_FILE)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(build(), f, ensure_ascii=False)
    return path


if __name__ == "__main__":
    print("Wrote", write())
