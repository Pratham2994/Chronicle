# Chronicle

Everything you ever played on Spotify, read on your own computer.

Spotify Wrapped gives you one year and five songs. Spotify also keeps every play you
ever made, and it sends you the whole list if you ask. Chronicle reads that list and
shows what is in it: when you listen, what you skip, what you played to death and then
dropped, and how your taste moved through school, college and after.

## What it shows

| Part | What is in it |
| --- | --- |
| The total | Hours, plays, artists, songs, the longest streak of days, the biggest day |
| The clock | A grid of 7 weekdays by 24 hours, in your own time zone |
| Year by year | Hours for each year, and the artist that owned it |
| The top | Artists and songs ranked by time, and the songs you played with no signal |
| Habits | What goes with a skip, songs left on repeat, the biggest binge, ghosts |
| Genres | Your top genres, what plays after 11 pm, what plays in daylight |
| Chapters | The same numbers for each chapter of your life. You say where the chapters are |
| Places | What you played in each country you opened Spotify in |

Three of those need a word.

**Chapters.** Everyone's school and college run on different years, so no dates are
fixed in the code. With nothing filled in, you get one chapter for each calendar year.
Or you write your own: give the year you were born, the year school ended, and what
came after and for how long. Chronicle drafts the chapters, and you can edit every
name and date.

**Ghosts.** Songs you played more than 50 times and then not once in the last two
years of the history.

**What goes with a skip.** A small logistic regression on up to 100,000 plays, with
three inputs: the hour, shuffle on or off, and phone or desktop. It shows what goes
together with a skip. It does not show the cause.

## Get your history

1. Open your [Spotify privacy settings](https://www.spotify.com/account/privacy/).
2. Request the **Extended streaming history**. Not the account data. That one has only
   the last year.
3. Wait for the email. Spotify says up to 30 days. It is usually a few.

You can try the app before the email comes. The first screen has a button that writes
eight made-up years of listening.

## Run it

You need [uv](https://docs.astral.sh/uv/) and Node.js.

```sh
# terminal 1: the backend
cd backend
uv sync
uv run uvicorn main:app

# terminal 2: the page
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and drop the zip from Spotify on the page. You can also
drop the `Streaming_History_Audio_*.json` files from it. Video and podcast files are
ignored.

## How it works

```
the zip  ->  data/*.json  ->  DuckDB  ->  SQL for each part  ->  FastAPI  ->  the page
```

- **Load.** The audio files are copied into `data/`. DuckDB reads all of them in one
  statement and writes one table in `backend/spotify_history.duckdb`.
- **Local time.** Spotify stores each play in UTC. On load, every play gets a second
  timestamp in your time zone. All hours and dates use that one. Without it, 9 pm in
  Mumbai shows up as the afternoon.
- **Numbers.** Each part of the page is a few SQL queries in `backend/analysis/`.
  Window functions do most of the work: `LAG` finds a song that started again after it
  ended, `ROW_NUMBER` ranks the songs inside each chapter and each country.
- **Genres.** The export has no genres. The top 300 artists are looked up one time in
  the iTunes Search API and kept in a cache file.
- **Chapters and time zone.** Kept in `backend/profile.json`.

```
backend/
  main.py             The API
  database.py         Loading, the time zone, uploads
  user_profile.py     Your chapters and time zone
  sample.py           Writes the made-up history
  analysis/           One file for each part of the page
frontend/src/
  App.jsx             The page, and which part loads when
  sections/           One file for each part
  dialogs/            The chapter editor and the data dialog
```

## Privacy

Chronicle runs on your computer. Your history is not uploaded anywhere.

One thing does leave: the names of your top 300 artists, sent to the iTunes Search API
to get their genres. With no internet, everything works but the genres.

`data/`, the database, the genre cache and `profile.json` are in `.gitignore`.

## Stack

Python, FastAPI, DuckDB, pandas and scikit-learn. React and Vite, with plain CSS.

## Licence

MIT.
