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
from src.player_service import PlayerService

app = Flask(__name__)
CORS(app)

# Load data on startup
data = load_datasets()
lookups = build_lookups()
player_service = PlayerService.get_instance()

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

# ============================================================================
# PLAYER ANALYTICS & PERFORMANCE ENDPOINTS (Phase 2)
# ============================================================================

@app.route('/api/players', methods=['GET'])
def get_players():
    """
    Search and list players with optional filters and pagination.
    Query Params:
      - search / query: substring match on player name
      - team: exact match on team/nation name
      - role: FW, MF, DF, GK
      - position: specific tactical position
      - min_minutes: minimum minutes played threshold
      - sort_by: column to sort by (default: performance_score)
      - order: asc or desc (default: desc)
      - page: page number (default: 1)
      - limit: items per page (default: 50, -1 for all)
    """
    query = request.args.get('search') or request.args.get('query')
    team = request.args.get('team')
    role = request.args.get('role')
    position = request.args.get('position')
    
    min_mins_raw = request.args.get('min_minutes')
    try:
        min_minutes = int(min_mins_raw) if min_mins_raw is not None else None
    except (ValueError, TypeError):
        min_minutes = None
    
    sort_by = request.args.get('sort_by', 'performance_score')
    order = request.args.get('order', 'desc')
    
    try:
        page = max(1, int(request.args.get('page', 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        limit = int(request.args.get('limit', 50))
    except (ValueError, TypeError):
        limit = 50
    
    result = player_service.get_players(
        query=query,
        team=team,
        role=role,
        position=position,
        min_minutes=min_minutes,
        sort_by=sort_by,
        order=order,
        page=page,
        limit=limit
    )
    return jsonify(result)

@app.route('/api/player/<int:player_id>', methods=['GET'])
def get_player_profile(player_id):
    """
    Fetch comprehensive player profile, career summary, season counting statistics, and per-90 rates.
    """
    profile = player_service.get_player_profile(player_id)
    if profile is None:
        return jsonify({"error": f"Player with ID {player_id} not found"}), 404
    return jsonify(profile)

@app.route('/api/player/<int:player_id>/matches', methods=['GET'])
def get_player_matches(player_id):
    """
    Fetch match-by-match logs and performances for a specific player.
    """
    matches = player_service.get_player_matches(player_id)
    if matches is None:
        return jsonify({"error": f"Player with ID {player_id} not found"}), 404
    return jsonify(matches)

@app.route('/api/player/<int:player_id>/performance', methods=['GET'])
def get_player_performance(player_id):
    """
    Fetch analytical performance score (0-100), within-role percentiles, strengths, and weaknesses.
    """
    perf = player_service.get_player_performance(player_id)
    if perf is None:
        return jsonify({"error": f"Player with ID {player_id} not found"}), 404
    return jsonify(perf)

@app.route('/api/player/<int:player_id>/form', methods=['GET'])
def get_player_form(player_id):
    """
    Fetch recent match performance trend (Last 5 or Last 10 matches).
    Query Param:
      - limit: number of recent matches to evaluate (default: 5)
    """
    limit_raw = request.args.get('limit', 5)
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 5
        
    form = player_service.get_player_form(player_id, limit=limit)
    if form is None:
        return jsonify({"error": f"Player with ID {player_id} not found"}), 404
    return jsonify(form)

@app.route('/api/player-filters', methods=['GET'])
def get_player_filters():
    """
    Return available filter options: competitions, roles, positions, teams, and counts.
    """
    filters = player_service.get_filters()
    return jsonify(filters)

# ============================================================================
# ERROR HANDLERS (No Traceback Leakage)
# ============================================================================

@app.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad request", "details": str(e)}), 400

@app.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def handle_internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
