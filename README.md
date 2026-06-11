# CHRONICLE 

**A Telemetry Engine for Spotify Extended History.**

![Chronicle Aesthetic](https://img.shields.io/badge/Aesthetic-Data_Documentary-e5ff00?style=for-the-badge&labelColor=000) ![Stack](https://img.shields.io/badge/Stack-React_|_FastAPI_|_DuckDB-00f0ff?style=for-the-badge&labelColor=000)

Standard Spotify Wrapped is a surface-level summary of your year. **Chronicle** is an analytical deep dive into your entire lifetime of listening data. It parses millions of rows of raw Spotify JSON telemetry to calculate the psychology, spatial geography, and chronological evolution of your sonic identity.

Designed with an aggressive "Data-Documentary" aesthetic. No generic SaaS dashboards. No purple gradients. Just raw numbers, brutalist typography, and heavy, mechanical interactions.

---

## ⚡ Features & Analytics

### 1. Telemetry Core (Behavioral Psychology)
Chronicle doesn't just rank your top songs; it reverse-engineers your listening behavior using DuckDB analytics.
* **The Binge Listen Curve**: Calculates how many hours you fixated on a single track in a 24-hour window.
* **The Skipper Profile**: Analyzes your skip rate compared to track completion rates.
* **Loyalty Index**: Measures exactly what percentage of your lifetime playtime belongs to your Top 5 artists.
* **Vampire / Sunlight Ratio**: Cross-references timestamps to determine if you are a nocturnal or diurnal listener.
* **Longest Streak**: Computes your absolute longest consecutive daily listening streak.

### 2. Eras & Evolution (Chronological Journey)
Your life sliced into distinct academic and cultural chapters. *Note: The chronological boundaries are currently calibrated approximately for a 2004 birth year (School -> Junior College -> Engineering).*
* Calculates shifts in Genre Taxonomy over time.
* Highlights the exact tracks and artists that defined the transition between phases of your life.
* Uses heavily physics-based Framer Motion accordions to represent the weight of time passing.

### 3. Geo-Soundtrack (Spatial Analytics)
A complete D3.js interactive physics simulation of your geographical listening history.
* Parses `conn_country` telemetry to map exactly what you were listening to in different parts of the world.
* Click any geographic node to open the **Data Inspector**, revealing location-specific Circadian Shifts, Local Top Tracks, and Exploration Density.

---

## ⚙️ How It Works: The Recalibration Engine

Chronicle is built to be a **Drop and Load** engine. 

You do not need to edit any code to analyze your own data. The FastAPI backend utilizes **DuckDB**—a high-performance analytical database designed to crunch millions of rows instantly. 

When you trigger the `[ RECALIBRATE ENGINE ]` lock in the frontend, Chronicle:
1. Obliterates the current database schema.
2. Scans the `/data` folder for all `Streaming_History_Audio_*.json` files.
3. Automatically ignores junk data (like video history or playlists).
4. Compiles years of JSON telemetry into a highly optimized binary `.duckdb` file.
5. Performs machine-learning style aggregations on the fly and rehydrates the React frontend.

---

## 🚀 Installation & Usage

### Step 1: Obtain Your Raw Data
1. Go to your Spotify Account Privacy Settings.
2. Request your **Extended Streaming History** (Note: This can take Spotify up to 30 days to email to you).
3. Download the ZIP and extract the `Streaming_History_Audio_XXXX.json` files.

### Step 2: Set Up the Engine
1. Clone this repository.
2. Create a folder named `data/` at the absolute root of the project.
3. Drop all your `Streaming_History_Audio_*.json` files into the `data/` folder.

```bash
Chronicle/
├── backend/
├── frontend/
└── data/
    ├── Streaming_History_Audio_2019.json
    ├── Streaming_History_Audio_2020.json
    └── ...
```

### Step 3: Boot the Backend (FastAPI + DuckDB)
Open a terminal in the `backend/` directory:
```bash
# Create a virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows

# Install dependencies (DuckDB, FastAPI, Uvicorn, etc.)
pip install -r requirements.txt

# Start the Telemetry Engine
uvicorn main:app --reload
```

### Step 4: Boot the Frontend (React + Vite)
Open a new terminal in the `frontend/` directory:
```bash
# Install Node dependencies
npm install

# Start the development server
npm run dev
```

### Step 5: Recalibrate
1. Open the frontend in your browser (usually `http://localhost:5173`).
2. Open the right-side Navigation menu.
3. Click the yellow **[ RECALIBRATE ENGINE ]** button.
4. Confirm the Terminal Warning modal.
5. Wait while Chronicle compiles your lifetime history. The app will automatically hard-refresh once the data is ready!

---

## 🛠️ Technology Stack
* **Frontend**: React, Vite, TailwindCSS, Framer Motion, D3.js (Force-directed graphs).
* **Backend**: Python, FastAPI, Uvicorn.
* **Database**: DuckDB (in-memory analytical SQL engine).
* **Design System**: Strictly CSS variables, brutalist mono-spaced typography, extreme contrast (`#e5ff00`, `#00f0ff`, `#9d00ff`).

---

*Powered by Raw JSON. Designed with Conviction.*
