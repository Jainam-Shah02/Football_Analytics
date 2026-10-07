# Football Analytics & AI

AI-powered football analytics platform for match prediction, tournament simulation, team analytics, and player performance analysis using event-level football data.

---

## Overview

Modern football analysis requires synthesizing team-level tactical trends with granular, event-level player contributions. **Football Analytics & AI** is an end-to-end analytical platform that bridges the gap between match outcome modeling and individual player evaluation.

The platform provides five interconnected analytical modules:

- **Match Prediction**: Head-to-head match outcome probabilities and expected goals (xG) using team Elo ratings and Poisson regression.
- **Tournament Simulation**: Monte Carlo simulation of a 48-team World Cup tournament, modeling group stages and knockout brackets through to the final.
- **Team Analytics**: Global tournament progression probabilities, team power rankings, Elo distributions, and recent form metrics.
- **Player Analytics**: Granular exploration of 680 players from FIFA World Cup 2022, featuring profiles, counting statistics, per-90 rates, and chronological match history.
- **Player Performance**: A role-aware analytical scoring model (0–100 scale), within-role percentile benchmarking, automated strengths/improvement identification, recent form tracking, and radar visualizations.

---

## Key Features

### Match Prediction
- **Outcome Probabilities**: Estimates Home Win, Draw, and Away Win probabilities for any two national teams.
- **Poisson Regression Engine**: Models expected goals (xG) for both home and away sides based on team Elo ratings, tournament weights, and pitch neutrality.
- **Scoreline Distribution**: Calculates and ranks the top 10 most probable exact scorelines (e.g., 1–0, 2–1, 1–1) using bivariate Poisson distributions.
- **Head-to-Head Index**: Evaluates historical head-to-head matchup factors between competing nations.

### Tournament Simulation
- **Monte Carlo Engine**: Simulates the full 48-team tournament structure (12 groups of 4 teams).
- **Group Stage Modeling**: Simulates all group stage fixtures, generating realistic points, goal differences, and standings.
- **Qualification Logic**: Advances top 2 teams from each group plus the 8 best third-placed teams into the Round of 32.
- **Knockout Bracket Progression**: Simulates single-elimination knockout rounds (Round of 32, Round of 16, Quarter-finals, Semi-finals, and Final) to determine the champion and runner-up.

### Team Analytics
- **Global Tournament Odds**: Displays pre-computed stage progression probabilities (Group Stage, R32, R16, QF, SF, Final, and Champion) across participating nations.
- **Team Power Metrics**: Compares Elo ratings, official FIFA rankings, ranking trajectory, and weighted form scores.
- **Interactive Visualization**: Dynamic bar charts and comparative ranking tables with customizable top-N team views.

### Player Analytics
- **Player Profiles**: Comprehensive biographical and tournament metadata (squad number, team, tactical role, primary position, matches, starts, minutes played).
- **Tournament Statistics**: Aggregate totals across all major event dimensions (goals, assists, shots, passes, progressive actions, tackles, interceptions).
- **Per-90 Rate Normalization**: Standardizes volume metrics to a per-90-minute basis for fair cross-player comparisons.
- **Chronological Match History**: Detailed match-by-match logs showing opponents, dates, minutes played, goals, and event contributions.
- **Categorical Breakdowns**: Tabular views segmented into Attacking, Passing, Possession & Progression, Defending, and Discipline.
- **Multi-Dimensional Search & Filtering**: Accent-insensitive player search, role filters (`FW`, `MF`, `DF`, `GK`), team filters (32 nations), and minimum-minutes thresholds.

### Player Performance
- **Analytical Performance Score**: Composite score on a 0–100 scale quantifying overall tournament impact.
- **Role-Aware Benchmarking**: Evaluates players against statistical dimensions aligned with their positional responsibilities (e.g., xG and shooting for forwards; passing accuracy and ball recovery for midfielders; clearances and tackles for defenders).
- **Within-Role Percentiles**: Calculates empirical percentile ranks relative only to peers in the same tactical role.
- **Strengths & Areas for Improvement**: Automatically highlights metrics where a player ranks in the top quartile ($\ge 75\text{th}$ percentile) or bottom quartile ($\le 25\text{th}$ percentile).
- **Recent Form Tracking**: Evaluates performance trends across selectable horizons (**Full Tournament**, **Last 10 Matches**, or **Last 5 Matches**) with match-by-match ratings.
- **Radar Visualizations**: Interactive multi-axis radar chart displaying core role percentiles.
- **Small-Sample Handling**: Enforces a 90-minute qualification threshold. Players with fewer than 90 minutes receive unranked percentiles and proportional confidence dampening on their score.

> [!NOTE]
> This performance score is a project-specific analytical model and is not an official StatsBomb rating.

---

## Player Analytics Data Pipeline

The player analytics system extracts, cleans, and transforms raw event data into structured, consumable API resources:

```
StatsBomb Open Data
        ↓
Raw Match Events & Lineups (64 Matches, 220,000+ Events)
        ↓
Data Cleaning & Validation (Missing values, name standardization, shootout filtering)
        ↓
Player-Match Statistics (1,995 records: minutes, xG, xA, passes, tackles)
        ↓
Player-Season Statistics (680 players: aggregate totals & per-90 metrics)
        ↓
Feature Engineering (xG, xA, progressive passes/carries, conversion rates)
        ↓
Per-90 Normalization (Safe scaling avoiding division-by-zero)
        ↓
Role-Based Percentiles (Within-role empirical rankings for qualified players)
        ↓
Performance Scoring (Role-weighted analytical score with sample dampening)
        ↓
Flask REST API (In-memory cached queries, search, and filtering)
        ↓
React Frontend (Interactive dashboard, radar charts, and form trends)
```

### Pipeline Stages

1. **Raw Ingestion**: Loads competition definitions, match schedules, lineups, and pitch events from StatsBomb Open Data.
2. **Cleaning & Standardization**: Resolves missing fields, standardizes player and team names, and filters penalty shootouts out of open-play metrics.
3. **Player-Match Extraction**: Aggregates pitch actions for each player in each match, computing event-level xG, shot assists (xA), and progressive metrics.
4. **Playing Time Calculation**: Accurately computes minutes played from match period timestamps, substitutions, extra time, and red cards.
5. **Player-Season Aggregation**: Summarizes match logs into season totals and computes per-90 rates (`stat / minutes * 90`).
6. **Role Benchmarking**: Groups players by tactical role (`FW`, `MF`, `DF`, `GK`) and computes within-role percentiles for players meeting the 90-minute threshold.
7. **Analytical Performance Scoring**: Computes weighted scores from role-specific percentiles, applying confidence dampening for small samples.
8. **Export & Caching**: Generates verified CSV datasets, multi-sheet Excel workbooks, and loads indexed lookups into the Flask API.

---

## Dataset

The player analytics and performance modules are built using verified event and lineup data:

| Metric | Verified Value |
|--------|----------------|
| **Competition** | FIFA World Cup |
| **Season** | 2022 |
| **Matches Analyzed** | 64 |
| **Participating Nations** | 32 |
| **Player-Match Records** | 1,995 |
| **Unique Players** | 680 |
| **Raw Event Records** | 220,000+ |

Tournament simulation and match prediction modules utilize an integrated dataset covering the 48 participating nations for the 2026 World Cup, including historical international match results, Elo ratings, and FIFA rankings.

### Data Attribution
All player analytics and event data are derived from the official **StatsBomb Open Data** repository:
- **Repository**: [https://github.com/statsbomb/open-data](https://github.com/statsbomb/open-data)
- **Attribution**: *This project utilizes event and lineup data provided by StatsBomb under the StatsBomb Open Data License.*

---

## Data & Analytical Metrics

The platform processes and exposes the following player metrics:

### Identity & Playing Time
- `competition_name`, `season_name`, `player_id`, `player_name`, `team_name`, `country`
- `primary_position`, `role` (`FW`, `MF`, `DF`, `GK`)
- `matches_played`, `starts`, `minutes_played`

### Attacking
- `goals`, `assists`, `shots`, `shots_on_target`
- `xg` (Expected Goals)
- `xa` (Expected Assists / Shot Assist xG)
- `shot_accuracy` ($\frac{\text{shots\_on\_target}}{\text{shots}}$)
- `xg_per_shot`

### Passing
- `passes_attempted`, `passes_completed`
- `pass_accuracy` ($\frac{\text{passes\_completed}}{\text{passes\_attempted}}$)
- `key_passes` (passes leading directly to a shot attempt)
- `progressive_passes` (completed forward passes advancing play significantly toward goal)

### Possession & Progression
- `carries` (controlled ball carries)
- `progressive_carries` (carries advancing play $\ge 10$ yards toward goal)
- `dribbles_attempted`, `dribbles_completed`
- `dribble_success_rate`

### Defending
- `tackles`, `interceptions`, `ball_recoveries`, `blocks`, `clearances`

### Discipline
- `fouls_committed`, `fouls_won`, `yellow_cards`, `red_cards`

### Derived & Rate Metrics
- **Per-90 Statistics**: `goals_per90`, `xg_per90`, `assists_per90`, `xa_per90`, `shots_per90`, `shots_on_target_per90`, `passes_per90`, `passes_completed_per90`, `key_passes_per90`, `progressive_passes_per90`, `carries_per90`, `progressive_carries_per90`, `dribbles_per90`, `dribbles_completed_per90`, `tackles_per90`, `interceptions_per90`, `recoveries_per90`, `blocks_per90`, `clearances_per90`
- **Percentiles**: Within-role percentile rankings (0–100) for all key per-90 metrics
- **Performance Score**: Project analytical score (0–100)

---

## Performance Model

The **Project Analytical Performance Score** (0–100) evaluates player impact using role-tailored dimensions:

### Role Weights

| Role | Metric | Weight |
|------|--------|--------|
| **Forwards (FW)** | Expected Goals / 90 (`xg_per90`) | 25% |
| | Goals / 90 (`goals_per90`) | 20% |
| | Expected Assists / 90 (`xa_per90`) | 15% |
| | Key Passes / 90 (`key_passes_per90`) | 15% |
| | Shots on Target / 90 (`shots_on_target_per90`) | 15% |
| | Dribble Success Rate (`dribble_success_rate`) | 10% |
| **Midfielders (MF)** | Pass Accuracy (`pass_accuracy`) | 20% |
| | Key Passes / 90 (`key_passes_per90`) | 15% |
| | Progressive Passes / 90 (`progressive_passes_per90`) | 15% |
| | Expected Assists / 90 (`xa_per90`) | 15% |
| | Recoveries / 90 (`recoveries_per90`) | 15% |
| | Tackles / 90 (`tackles_per90`) | 10% |
| | Passes / 90 (`passes_per90`) | 10% |
| **Defenders (DF)** | Interceptions / 90 (`interceptions_per90`) | 20% |
| | Tackles / 90 (`tackles_per90`) | 20% |
| | Clearances / 90 (`clearances_per90`) | 15% |
| | Blocks / 90 (`blocks_per90`) | 15% |
| | Recoveries / 90 (`recoveries_per90`) | 15% |
| | Pass Accuracy (`pass_accuracy`) | 15% |
| **Goalkeepers (GK)** | Pass Accuracy (`pass_accuracy`) | 35% |
| | Recoveries / 90 (`recoveries_per90`) | 25% |
| | Clearances / 90 (`clearances_per90`) | 25% |
| | Passes / 90 (`passes_per90`) | 15% |

### Methodology & Small-Sample Dampening
1. **Percentile Calculation**: For each role group, empirical percentiles are calculated only across players with $\ge 90$ minutes played.
2. **Weighted Aggregation**:
   $$\text{Raw Score} = \sum_{i} w_i \times \text{Percentile}_i$$
3. **Small-Sample Dampening**: For players with fewer than 90 minutes played:
   $$\text{Dampened Score} = \text{Raw Score} \times \left(\frac{\text{minutes\_played}}{90}\right)$$
   Percentiles are marked unranked, and a small-sample indicator is attached to the player profile.

---

## Tech Stack

### Frontend
- **Framework**: React 19 (`react: ^19.2.7`, `react-dom: ^19.2.7`)
- **Build Tool**: Vite 8 (`vite: ^8.1.1`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite: ^4.3.3`, `tailwindcss: ^4.3.3`)
- **Animations**: Framer Motion (`framer-motion: ^12.42.2`)
- **Visualizations**: Recharts (`recharts: ^3.10.0`)
- **Icons**: Lucide React (`lucide-react: ^1.26.0`), React Icons (`react-icons: ^5.7.0`)
- **Routing**: React Router DOM v7 (`react-router-dom: ^7.18.1`)
- **HTTP Client**: Axios (`axios: ^1.18.1`)

### Backend & Analytics
- **Language**: Python 3.12+
- **API Framework**: Flask (`Flask==3.0.3`)
- **CORS Support**: Flask-CORS (`Flask-Cors==4.0.0`)
- **Data Manipulation**: Pandas (`pandas==3.0.3`), NumPy (`numpy==2.4.6`)
- **Statistical Modeling**: SciPy (`scipy>=1.17.1`), Statsmodels (`statsmodels>=0.14.6`), Scikit-Learn (`scikit-learn>=1.9.0`)
- **Workbook Generation**: OpenPyXL (`openpyxl`)
- **Alternative Prototype**: Streamlit (`streamlit>=1.58.0`, via `simulation_app.py`)

---

## Application Routes

The React application implements six dedicated client routes:

| Route | Purpose |
|-------|---------|
| `/` | Landing page providing platform introduction, architecture overview, and navigation entry points |
| `/predictor` | Interactive head-to-head match prediction with xG, outcome probabilities, and likely scoreline distributions |
| `/simulator` | Monte Carlo tournament simulator running group stage and knockout bracket simulations for 48 nations |
| `/analytics` | Global tournament stage progression probabilities and national team power rankings |
| `/player-analytics` | Comprehensive player profiles, tournament counting stats, per-90 metrics, and chronological match logs |
| `/player-performance` | In-depth player performance scoring, role radar visualization, percentile rankings, and recent form trends |

---

## API Documentation

The Flask backend exposes the following REST endpoints:

### Team & Simulation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams` | Returns all 48 participating nations with Elo ratings, FIFA rankings, ranking trajectory, and form scores. |
| `GET` | `/api/probabilities` | Returns tournament stage progression probabilities for participating teams. |
| `POST` | `/api/predict` | Predicts match outcome between `home_team` and `away_team` (expected goals, win/draw/loss probabilities, top 10 scorelines, H2H). |
| `POST` | `/api/simulate` | Executes a complete Monte Carlo tournament simulation and returns group tables, match results, and knockout brackets. |

### Player Analytics & Performance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/players` | Lists and searches players with optional query parameters (`search`, `team`, `role`, `position`, `min_minutes`, `sort_by`, `order`, `page`, `limit`). |
| `GET` | `/api/player/<player_id>` | Returns full player profile, metadata, tournament totals, and per-90 rate metrics. |
| `GET` | `/api/player/<player_id>/matches` | Returns chronological match-by-match logs for a specific player. |
| `GET` | `/api/player/<player_id>/performance` | Returns role-aware performance score (0–100), within-role percentiles, strengths, and weaknesses. |
| `GET` | `/api/player/<player_id>/form` | Returns recent match rating timeline and form score with optional `limit` parameter (e.g., 5 or 10). |
| `GET` | `/api/player-filters` | Returns available filter options (competitions, roles, positions, teams, and total player count). |

---

## Project Structure

```
Football-analytics-and-AI-prediction/
├── client/                              # React frontend application
│   ├── public/                          # Static assets and favicons
│   ├── src/
│   │   ├── components/                  # UI and player analytics components
│   │   │   ├── player/                  # Radar charts, stat tables, selectors
│   │   │   └── ui/                      # Reusable buttons, cards, badges
│   │   ├── pages/                       # Route views (Home, Predictor, Simulator, Analytics, Player views)
│   │   ├── utils/                       # Flag helpers and formatters
│   │   ├── api.js                       # Axios API client functions
│   │   ├── App.jsx                      # Route definitions
│   │   └── main.jsx                     # Application entry point
│   ├── package.json                     # Frontend dependencies and scripts
│   └── vite.config.js                   # Vite build configuration
├── data/
│   ├── processed/                       # Cleaned and generated analytical datasets
│   │   ├── player_match_stats.csv       # Match-level player logs (1,995 rows)
│   │   ├── player_season_stats.csv      # Tournament player totals & per-90s (680 rows)
│   │   ├── player_statistics.xlsx       # Multi-sheet Excel workbook
│   │   └── wc2026_tournament_probabilities.csv # Tournament probability data
│   ├── raw/statsbomb/                   # Raw StatsBomb JSON files (matches, lineups, events)
│   ├── reference/                       # FIFA confederations, knockout fixtures, group stages
│   └── static/                          # Static tournament reference assets
├── notebooks/
│   ├── player_data_pipeline.ipynb       # 20-step reproducible player analytics notebook
│   ├── 0-data_fetch.ipynb               # Raw data fetching
│   ├── 1-data_cleaning.ipynb            # Data cleaning pipeline
│   ├── 2-feature_engineering_ELO.ipynb  # Elo calculation
│   ├── 3-feature_engineering_match_metadata.ipynb
│   ├── 4-model_training.ipynb           # Match outcome models
│   └── 5-tournament_simulation.ipynb    # Simulation models
├── scripts/
│   ├── download_statsbomb.py            # Automated download script for World Cup 2022
│   ├── generate_notebook.py             # Notebook generation and verification script
│   └── verify_backend_live.py           # Backend live test script
├── server/
│   ├── app.py                           # Flask REST API server
│   └── requirements.txt                 # Server-specific requirements
├── src/                                 # Core analytical and service modules
│   ├── data_loader.py                   # Tournament and prediction data loader
│   ├── prediction.py                    # Match outcome and Poisson prediction logic
│   ├── tournament.py                    # Monte Carlo tournament simulation logic
│   ├── player_data_loader.py            # Player dataset loading utilities
│   ├── player_analytics.py              # Event aggregation, playing time, validation
│   ├── player_performance.py            # Role percentiles, performance score, Excel export
│   └── player_service.py                # In-memory service layer for player queries
├── tests/
│   └── test_player_api.py               # Comprehensive Flask API integration test suite
├── pyproject.toml                       # Python project configuration
├── requirements.txt                     # Root Python dependencies
└── simulation_app.py                    # Streamlit prototype interface
```

---

## Installation & Local Setup

### Prerequisites
- **Python**: Version 3.12 or higher
- **Node.js**: Version 18 or higher (Node 20+ recommended)
- **Package Managers**: `pip` (Python) and `npm` (Node)

### Backend Setup

1. Open a terminal in the project root directory:
   ```bash
   cd Football-analytics-and-AI-prediction
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask API server:
   ```bash
   python server/app.py
   ```
   The backend API will run on `http://127.0.0.1:5000/`.

*(Optional)* To run the alternative Streamlit interface:
```bash
streamlit run simulation_app.py
```

### Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
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
   The web application will be available at `http://localhost:5173/` (or the port indicated by Vite).

---

## Testing & Verification

The project includes automated integration tests and frontend build checks.

### Backend API Test Suite
Run the test suite using Python:
```bash
python tests/test_player_api.py
```

**Verified Test Results**:
- **43 / 43 tests passed (100% success rate)**
- **Coverage**:
  - Legacy endpoints integrity (`/api/teams`, `/api/probabilities`, `/api/predict`)
  - Player search, role filtering, and pagination (`/api/players`)
  - Player profile retrieval and per-90 rates (`/api/player/<id>`)
  - Match history log structure and data integrity (`/api/player/<id>/matches`)
  - Analytical performance score, within-role percentiles, strengths (`/api/player/<id>/performance`)
  - Recent form tracking and timeline ratings (`/api/player/<id>/form`)
  - Filter metadata and counts (`/api/player-filters`)
  - Robust 400/404 error handling without traceback leakage

### Frontend Build Verification
Verify the React production build:
```bash
cd client
npm run build
```
**Verified**: The production bundle builds successfully with Vite (`0 errors`).

---

## Analytical Notebook

The complete data pipeline is documented and reproducible in `notebooks/player_data_pipeline.ipynb`.

The notebook contains 20 structured sections:
1. **Project Objective**: Problem definition and analytical scope
2. **Dataset**: StatsBomb Open Data specification (FIFA World Cup 2022)
3. **Import Libraries**: Core dependency loading
4. **Load Raw JSON Data**: Non-destructive data ingestion
5. **Explore Raw Data (EDA)**: Initial exploration of events and lineups
6. **Data Cleaning**: Handling missing values, name standardization, shootout filtering
7. **Extract Player Information**: Player IDs, roles, and squad numbers
8. **Extract Match-Level Statistics**: Player event aggregation per match
9. **Feature Engineering**: xG, xA, progressive passes/carries, shot accuracy
10. **Calculate Playing Time**: Start/sub timestamps, stoppage time, red cards
11. **Calculate Per-90 Statistics**: Rate scaling with safe zero-division handling
12. **Create Player Match Dataset**: Generation of `player_match_stats.csv`
13. **Create Player Season Dataset**: Aggregation into `player_season_stats.csv`
14. **Data Validation**: Strict schema, null checks, and value range enforcement
15. **Percentile Calculation**: Role-grouped empirical percentiles (90-minute threshold)
16. **Performance Score Calculation**: Role-weighted analytical scoring (0–100)
17. **Basic Visual Analysis**: Scatter plots, score distributions, and radar charts
18. **Export CSV Files**: Saving clean CSV datasets
19. **Export Excel File**: Multi-sheet export to `player_statistics.xlsx`
20. **Final Summary**: Pipeline validation metrics and record counts

### Pipeline Reproduction
To re-run the pipeline from scratch:
```bash
# 1. Download raw StatsBomb data for FIFA World Cup 2022
python scripts/download_statsbomb.py

# 2. Execute the pipeline notebook
python scripts/generate_notebook.py
```

---

## Limitations

- **Competition Scope**: The current player analytics dataset is derived exclusively from the FIFA World Cup 2022 tournament.
- **Tournament Sample Size**: International tournaments feature a maximum of 7 matches per team. Sample sizes are naturally smaller and exhibit higher variance than 38-match domestic league seasons.
- **Goalkeeper Event Coverage**: Open event datasets record goalkeeper passes, recoveries, clearances, and goals conceded, but lack granular shot-stopping metrics such as post-shot xG (PSxG) or save locations.
- **Per-90 Volatility**: Players with very few minutes can produce artificially inflated per-90 rates. The platform mitigates this with a strict 90-minute qualification threshold and confidence dampening.
- **Analytical Model Notice**: The Player Performance Score is a project-specific analytical model and should not be confused with official StatsBomb ratings.

---

## Future Improvements

- [ ] Ingestion of domestic league datasets (e.g., Premier League, La Liga) as open event data becomes available
- [ ] Advanced goalkeeper modeling incorporating post-shot xG and save percentage above expected
- [ ] Head-to-head player comparison view with overlay radar charts
- [ ] Machine learning models for player market value and tournament breakout prediction
- [ ] Containerized deployment using Docker and automated CI/CD pipelines

---

## Screenshots

> Screenshots can be added here after the final UI polish.

---

## Attribution

This project uses event-level and lineup data provided by **StatsBomb** under the **StatsBomb Open Data License**.

- **Source Repository**: [https://github.com/statsbomb/open-data](https://github.com/statsbomb/open-data)
- This project processes raw open-data files into structured analytical datasets and does not claim ownership of the underlying StatsBomb data.

---

## License

License information will be added separately.

---

## Security & Configuration

- **Environment Variables**: Sensitive configurations and environment-specific settings should be kept in a `.env` file and excluded from version control.
- **No Hardcoded Secrets**: No private API keys or database credentials are embedded in this repository.
- **Error Handling**: API endpoints implement centralized error handlers to prevent internal server tracebacks from leaking into client responses.
