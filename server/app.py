import os
import sys
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np

# Add parent directory to path to allow importing from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_loader import load_datasets, build_lookups
from src.prediction import predict_match, get_h2h_score
from src.tournament import simulate_tournament

app = Flask(__name__)
CORS(app)

# Load data on startup
data = load_datasets()
lookups = build_lookups()

df_probs = data["probabilities"]
df_groups = data["groups"]

team_to_elo = lookups["team_to_elo"]
team_to_form = lookups["team_to_form"]
team_to_fifa_rank = lookups["team_to_fifa_rank"]
team_to_fifa_rank_change = lookups["team_to_fifa_rank_change"]

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super(NpEncoder, self).default(obj)

app.json_provider_class.default = NpEncoder().default

@app.route('/api/teams', methods=['GET'])
def get_teams():
    teams = sorted(df_groups["nation"].unique().tolist())
    
    team_data = []
    for team in teams:
        team_data.append({
            "name": team,
            "elo": float(team_to_elo.get(team, 0)),
            "fifa_rank": int(team_to_fifa_rank.get(team, 0)),
            "rank_change": int(team_to_fifa_rank_change.get(team, 0)),
            "form_score": float(team_to_form.get(team, 0))
        })
        
    return jsonify({"teams": team_data})

@app.route('/api/probabilities', methods=['GET'])
def get_probabilities():
    probs = df_probs.copy()
    probs = probs.replace({np.nan: None})
    return jsonify(probs.to_dict(orient='records'))

@app.route('/api/predict', methods=['POST'])
def predict():
    req_data = request.json
    home_team = req_data.get('home_team')
    away_team = req_data.get('away_team')
    
    if not home_team or not away_team:
        return jsonify({"error": "home_team and away_team are required"}), 400
        
    pred = predict_match(home_team, away_team)
    
    # Process score_probs for JSON serialization
    score_probs = pred["score_probs"].head(10).copy()
    
    result = {
        "home_team": home_team,
        "away_team": away_team,
        "home_xg": float(pred["home_xg"]),
        "away_xg": float(pred["away_xg"]),
        "home_win_prob": float(pred["home_win_prob"]),
        "draw_prob": float(pred["draw_prob"]),
        "away_win_prob": float(pred["away_win_prob"]),
        "score_probs": score_probs.to_dict(orient='records'),
        "h2h_home": float(get_h2h_score(home_team, away_team)),
        "h2h_away": float(get_h2h_score(away_team, home_team))
    }
    
    return jsonify(result)

@app.route('/api/simulate', methods=['POST'])
def simulate():
    tournament = simulate_tournament()
    
    # Convert DataFrames to dicts for JSON
    summary = {k: str(v) for k, v in tournament["summary"].items()}
    
    group_tables = tournament["group_tables"].replace({np.nan: None}).to_dict(orient='records')
    group_matches = tournament["group_matches"].replace({np.nan: None}).to_dict(orient='records')
    knockout_results = tournament["knockout_results"].replace({np.nan: None}).to_dict(orient='records')
    
    return jsonify({
        "summary": summary,
        "group_tables": group_tables,
        "group_matches": group_matches,
        "knockout_results": knockout_results
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
