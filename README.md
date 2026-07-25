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

- `GET /api/teams`: Fetch all participating teams and their stats (Elo, FIFA rank, form).
- `GET /api/probabilities`: Fetch base probabilities dataset.
- `POST /api/predict`: Predict a match between `home_team` and `away_team`.
- `POST /api/simulate`: Simulate the entire tournament.
