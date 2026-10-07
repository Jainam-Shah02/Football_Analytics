# Football World Cup 2026 Predictions

An interactive web application that predicts match outcomes and simulates the entire 2026 Football World Cup using statistical modeling and machine learning.

## 🌟 Features

- **Match Prediction**: Predict the outcome (Home Win, Draw, Away Win) and expected goals (xG) for any two teams facing off.
- **Tournament Simulation**: Run full Monte Carlo simulations of the 2026 World Cup, starting from the group stages all the way to the final.
- **Team Statistics**: View current Elo ratings, FIFA rankings, ranking changes, and recent form scores for participating nations.
- **Data-Driven Approach**: Utilizes historical match data, head-to-head records, Elo ratings, and FIFA rankings to calculate probabilities.

## 💻 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **Icons & Charts**: Lucide React, React Icons, Recharts
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend & Machine Learning
- **Framework**: Flask (Python 3.12+)
- **Data Processing**: Pandas, NumPy
- **Modeling**: Scikit-Learn, SciPy, Statsmodels
- **Alternative UI**: Streamlit (available for quick prototyping)

## 📁 Project Structure

```
football_WorldCup_2026_predictions/
├── client/                 # React frontend application
├── data/                   # Historical match data and datasets
├── models/                 # Pre-trained ML models (if applicable)
├── notebooks/              # Jupyter notebooks for data exploration
├── server/                 # Flask backend API
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Backend dependencies
├── src/                    # Core Python prediction logic
│   ├── data_loader.py      # Data ingestion and lookup building
│   ├── prediction.py       # Match prediction logic
│   └── tournament.py       # Tournament simulation logic
├── pyproject.toml          # Python project metadata
└── simulation_app.py       # Streamlit alternative interface
```

## 🚀 Getting Started

### Prerequisites
- Python 3.12 or higher
- Node.js (v18+ recommended)
- npm or yarn

### Backend Setup

1. Navigate to the project root directory.
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   # or install from pyproject.toml
   pip install .
   ```
3. Start the Flask server:
   ```bash
   python server/app.py
   ```
   The backend API will run on `http://127.0.0.1:5000/`.

*(Optional)* To run the Streamlit version:
```bash
streamlit run simulation_app.py
```

### Frontend Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173/` (or the port specified by Vite).

## 📡 API Endpoints

### Tournament & Match Simulation Endpoints (Legacy)
- `GET /api/teams`: Fetch all participating teams and their stats (Elo, FIFA rank, form).
- `GET /api/probabilities`: Fetch base probabilities dataset.
- `POST /api/predict`: Predict a match between `home_team` and `away_team`.
- `POST /api/simulate`: Simulate the entire tournament.

### Player Analytics & Performance Endpoints (Phase 2)
- `GET /api/players`: Search and list players with filters (`search`, `team`, `role`, `position`, `min_minutes`) and pagination.
- `GET /api/player/<player_id>`: Detailed player profile, season counting stats, and per-90 metrics.
- `GET /api/player/<player_id>/matches`: Match-by-match log with dates, opponents, minutes, goals, xG, and key actions.
- `GET /api/player/<player_id>/performance`: Analytical performance score (0–100), within-role percentiles, strengths, and weaknesses.
- `GET /api/player/<player_id>/form`: Recent match performance evaluation (Last 5 or Last 10 matches) with timeline ratings.
- `GET /api/player-filters`: Available filter options (competitions, roles, positions, teams, and player counts).

---

## ⚽ Player Analytics & Performance Pipeline (Phase 1)

This project extends beyond team-level simulations to include granular, event-level **Player Analytics & Player Performance Analysis** powered by **StatsBomb Open Data**.

### 📖 Data Source & Attribution
Raw event and lineup data is sourced from the official **StatsBomb Open Data repository**:
- **Repository**: [https://github.com/statsbomb/open-data](https://github.com/statsbomb/open-data)
- **Attribution**: *This project utilizes event and lineup data provided by StatsBomb under the StatsBomb Open Data License.*
- **Selected Tournament**: FIFA World Cup 2022 (`competition_id: 43`, `season_id: 106`), encompassing all 64 tournament matches and over 220,000 granular pitch events.

### 🗂️ Data Architecture
```
data/
├── raw/
│   └── statsbomb/
│       ├── competitions.json       # Official competition registry
│       ├── matches/43/106.json     # All 64 tournament matches
│       ├── lineups/*.json          # Match-specific team rosters & positions
│       └── events/*.json           # Event-level coordinates & actions
└── processed/
    ├── player_match_stats.csv      # Match-level player logs (1,995 rows)
    ├── player_season_stats.csv     # Tournament totals & Per-90 metrics (680 players)
    └── player_statistics.xlsx      # Multi-sheet Excel workbook (4 sheets)
```

### 🧠 Reusable Python Modules (`src/`)
To ensure the analytics pipeline is fully decoupled from the Jupyter environment, all extraction, feature engineering, and scoring logic is implemented in modular Python files:
- [`src/player_data_loader.py`](file:///c:/Users/jssha/OneDrive/Desktop/aiml_project/Football-analytics-and-AI-prediction/src/player_data_loader.py): Loads raw JSON files and processed CSVs.
- [`src/player_analytics.py`](file:///c:/Users/jssha/OneDrive/Desktop/aiml_project/Football-analytics-and-AI-prediction/src/player_analytics.py): Playing time calculation, event aggregation, progressive action detection, per-90 rates, and automated data validation.
- [`src/player_performance.py`](file:///c:/Users/jssha/OneDrive/Desktop/aiml_project/Football-analytics-and-AI-prediction/src/player_performance.py): Within-role percentile rankings, Project Analytical Performance Scoring (0–100), and Excel exports.

### 📓 Jupyter Notebook (`notebooks/player_data_pipeline.ipynb`)
A fully-executable 20-section notebook structured for college mini-project viva explanations:
1. **Project Objective** — Overview of raw event processing into analytical datasets.
2. **Dataset** — StatsBomb Open Data source, format, and competition selection.
3. **Import Libraries** — Loading required packages.
4. **Load Raw JSON Data** — Non-destructive data ingestion.
5. **Explore Raw Data** — Exploratory Data Analysis (EDA) on events and lineups.
6. **Data Cleaning** — Missing values, name standardization, and shootout filtering.
7. **Extract Player Information** — Player IDs, roles, and squad numbers.
8. **Extract Match-Level Player Statistics** — One row per player per match.
9. **Feature Engineering** — xG, xA (shot assist xG), progressive passes/carries, and conversion rates.
10. **Calculate Playing Time** — Start/sub timestamps, injury time, and red cards.
11. **Calculate Per-90 Statistics** — Safe rate scaling avoiding division-by-zero.
12. **Create Player Match Dataset** — Generation of `player_match_stats.csv`.
13. **Create Player Season Dataset** — Aggregated tournament metrics in `player_season_stats.csv`.
14. **Data Validation** — Zero nulls, zero duplicates, and strict range checks.
15. **Percentile Calculation** — Role-grouped percentiles with a 90-minute qualification threshold.
16. **Performance Score Calculation** — Project Analytical Performance Score (0–100).
17. **Basic Visual Analysis** — Visualizations (Scorers vs xG, Score distribution, Messi radar).
18. **Export CSV Files** — Saving verified CSV datasets.
19. **Export Excel File** — Saving multi-sheet `player_statistics.xlsx`.
20. **Final Summary** — Executive summary of processing metrics.

### ⚙️ How to Reproduce the Pipeline
```powershell
# 1. Download raw StatsBomb data for FIFA World Cup 2022
python scripts/download_statsbomb.py

# 2. Generate and execute the Jupyter Notebook
python scripts/generate_notebook.py
python -c "import nbformat; from nbclient import NotebookClient; nb = nbformat.read('notebooks/player_data_pipeline.ipynb', as_version=4); NotebookClient(nb, timeout=600).execute(); nbformat.write(nb, open('notebooks/player_data_pipeline.ipynb', 'w', encoding='utf-8'))"
```
