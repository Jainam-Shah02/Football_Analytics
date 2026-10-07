"""
player_service.py
=================
Service layer for Player Analytics and Performance API endpoints.
Provides fast in-memory query, search, filtering, and aggregation
on validated player datasets.

Part of the Football Analytics and AI Prediction project.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import unicodedata
import numpy as np
import pandas as pd

from src.player_data_loader import load_player_match_stats, load_player_season_stats
from src.player_performance import calculate_analytical_performance_score, ROLE_METRIC_WEIGHTS

PROJECT_ROOT = Path(__file__).resolve().parents[1]

def _strip_accents(s: str) -> str:
    if not isinstance(s, str):
        return ""
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()

class PlayerService:
    """
    Singleton-style service class holding loaded player datasets in memory.
    Ensures sub-millisecond response times for player API queries.
    """
    _instance = None
    
    def __init__(self):
        self.df_match = load_player_match_stats()
        self.df_season = load_player_season_stats()
        # Compute performance scores and percentiles once on startup
        self.df_perf = calculate_analytical_performance_score(self.df_season, min_minutes=90)
        self.df_perf["_norm_name"] = self.df_perf["player_name"].apply(_strip_accents)
        
        # Build quick O(1) lookup indices
        self.player_perf_lookup: Dict[int, Dict[str, Any]] = {}
        for _, row in self.df_perf.iterrows():
            pid = int(row["player_id"])
            # Convert series to clean dictionary replacing NaN with None
            d = row.to_dict()
            for k, v in d.items():
                if pd.isna(v):
                    d[k] = None
                elif isinstance(v, (np.integer, np.int64)):
                    d[k] = int(v)
                elif isinstance(v, (np.floating, np.float64)):
                    d[k] = round(float(v), 3)
            self.player_perf_lookup[pid] = d
            
        # Group matches by player_id
        self.player_matches_lookup: Dict[int, List[Dict[str, Any]]] = {}
        # Ensure chronological sorting
        df_sorted_matches = self.df_match.sort_values(by=["match_date", "match_id"]).copy()
        for _, row in df_sorted_matches.iterrows():
            pid = int(row["player_id"])
            if pid not in self.player_matches_lookup:
                self.player_matches_lookup[pid] = []
            d = row.to_dict()
            for k, v in d.items():
                if pd.isna(v):
                    d[k] = None
                elif isinstance(v, (np.integer, np.int64)):
                    d[k] = int(v)
                elif isinstance(v, (np.floating, np.float64)):
                    d[k] = round(float(v), 3)
            self.player_matches_lookup[pid].append(d)

    @classmethod
    def get_instance(cls) -> "PlayerService":
        if cls._instance is None:
            cls._instance = PlayerService()
        return cls._instance

    def get_players(
        self,
        query: Optional[str] = None,
        team: Optional[str] = None,
        role: Optional[str] = None,
        position: Optional[str] = None,
        min_minutes: Optional[int] = None,
        sort_by: str = "performance_score",
        order: str = "desc",
        page: int = 1,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Search and filter players with pagination.
        """
        df = self.df_perf.copy()

        # Apply name search (accent-insensitive & case-insensitive)
        if query and query.strip():
            q = _strip_accents(query.strip())
            df = df[df["_norm_name"].str.contains(q, na=False)]

        # Apply team filter
        if team and team.strip():
            t = team.strip().lower()
            df = df[df["team_name"].str.lower() == t]

        # Apply role filter (FW, MF, DF, GK)
        if role and role.strip():
            r = role.strip().upper()
            df = df[df["role"] == r]

        # Apply position filter
        if position and position.strip():
            p = position.strip().lower()
            df = df[df["primary_position"].str.lower() == p]

        # Apply minimum minutes filter
        if min_minutes is not None and min_minutes > 0:
            df = df[df["minutes_played"] >= min_minutes]

        # Sorting
        ascending = (order.lower() == "asc")
        if sort_by in df.columns:
            df = df.sort_values(by=[sort_by, "minutes_played"], ascending=[ascending, False])
        else:
            df = df.sort_values(by=["performance_score", "minutes_played"], ascending=[False, False])

        total_count = len(df)

        # Pagination
        if limit > 0:
            start_idx = max(0, (page - 1) * limit)
            end_idx = start_idx + limit
            paged_df = df.iloc[start_idx:end_idx]
        else:
            paged_df = df

        summary_fields = [
            "player_id", "player_name", "team_name", "country",
            "primary_position", "role", "matches_played", "starts",
            "minutes_played", "goals", "assists", "xg", "xa",
            "passes_completed", "pass_accuracy", "key_passes",
            "tackles", "interceptions", "performance_score",
            "is_qualified_sample"
        ]

        players_list = []
        for _, row in paged_df.iterrows():
            item = {}
            for col in summary_fields:
                if col in row:
                    val = row[col]
                    if pd.isna(val):
                        item[col] = None
                    elif isinstance(val, (np.integer, np.int64)):
                        item[col] = int(val)
                    elif isinstance(val, (np.floating, np.float64)):
                        item[col] = round(float(val), 2)
                    elif isinstance(val, (bool, np.bool_)):
                        item[col] = bool(val)
                    else:
                        item[col] = val
            players_list.append(item)

        return {
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1,
            "players": players_list
        }

    def get_player_profile(self, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch full player profile, season counting stats, and per-90 rates.
        """
        if player_id not in self.player_perf_lookup:
            return None

        p = self.player_perf_lookup[player_id]

        profile = {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "country": p.get("country"),
            "primary_position": p.get("primary_position"),
            "role": p.get("role"),
            "matches_played": p.get("matches_played"),
            "starts": p.get("starts"),
            "minutes_played": p.get("minutes_played"),
            "performance_score": p.get("performance_score"),
            "is_qualified_sample": p.get("is_qualified_sample"),
            "stats": {
                "goals": p.get("goals"),
                "assists": p.get("assists"),
                "xg": p.get("xg"),
                "xa": p.get("xa"),
                "shots": p.get("shots"),
                "shots_on_target": p.get("shots_on_target"),
                "shot_accuracy": p.get("shot_accuracy"),
                "xg_per_shot": p.get("xg_per_shot"),
                "passes_attempted": p.get("passes_attempted"),
                "passes_completed": p.get("passes_completed"),
                "pass_accuracy": p.get("pass_accuracy"),
                "key_passes": p.get("key_passes"),
                "progressive_passes": p.get("progressive_passes"),
                "carries": p.get("carries"),
                "progressive_carries": p.get("progressive_carries"),
                "dribbles_attempted": p.get("dribbles_attempted"),
                "dribbles_completed": p.get("dribbles_completed"),
                "dribble_success_rate": p.get("dribble_success_rate"),
                "tackles": p.get("tackles"),
                "interceptions": p.get("interceptions"),
                "ball_recoveries": p.get("ball_recoveries"),
                "blocks": p.get("blocks"),
                "clearances": p.get("clearances"),
                "fouls_committed": p.get("fouls_committed"),
                "fouls_won": p.get("fouls_won"),
                "yellow_cards": p.get("yellow_cards"),
                "red_cards": p.get("red_cards"),
            },
            "per90": {
                k: p.get(k) for k in p if k.endswith("_per90")
            }
        }
        return profile

    def get_player_matches(self, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch chronological match-by-match logs for a player.
        """
        if player_id not in self.player_perf_lookup:
            return None

        p = self.player_perf_lookup[player_id]
        matches = self.player_matches_lookup.get(player_id, [])

        return {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "total_matches": len(matches),
            "matches": matches
        }

    def get_player_performance(self, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch performance score, role-specific percentiles, strengths, and weaknesses.
        """
        if player_id not in self.player_perf_lookup:
            return None

        p = self.player_perf_lookup[player_id]
        role = p.get("role", "MF")
        is_qualified = bool(p.get("is_qualified_sample", False))
        mins = int(p.get("minutes_played", 0))

        # Gather percentiles
        percentiles = {}
        strengths = []
        weaknesses = []

        # Human-readable labels for metrics
        metric_labels = {
            "goals_per90": "Goal Scoring Rate",
            "xg_per90": "Expected Goals (xG)",
            "assists_per90": "Assists Rate",
            "xa_per90": "Expected Assists (xA)",
            "shots_per90": "Shooting Volume",
            "shots_on_target_per90": "Shooting Accuracy Rate",
            "key_passes_per90": "Key Passes / Playmaking",
            "passes_per90": "Pass Volume",
            "pass_accuracy": "Pass Accuracy (%)",
            "progressive_passes_per90": "Progressive Passing",
            "carries_per90": "Ball Carrying Volume",
            "progressive_carries_per90": "Progressive Carries",
            "dribbles_per90": "Dribble Volume",
            "dribble_success_rate": "Dribble Success Rate (%)",
            "tackles_per90": "Tackles",
            "interceptions_per90": "Interceptions",
            "recoveries_per90": "Ball Recoveries",
            "blocks_per90": "Shot & Pass Blocks",
            "clearances_per90": "Clearances"
        }

        for k, v in p.items():
            if k.endswith("_percentile") and v is not None:
                base_metric = k.replace("_percentile", "")
                label = metric_labels.get(base_metric, base_metric.replace("_", " ").title())
                val = float(v)
                percentiles[base_metric] = {
                    "percentile": val,
                    "label": label
                }
                if val >= 75.0:
                    strengths.append({
                        "metric": base_metric,
                        "label": label,
                        "percentile": val
                    })
                elif val <= 25.0:
                    weaknesses.append({
                        "metric": base_metric,
                        "label": label,
                        "percentile": val
                    })

        strengths.sort(key=lambda x: x["percentile"], reverse=True)
        weaknesses.sort(key=lambda x: x["percentile"])

        # Role weights used in analytical scoring model
        weights = ROLE_METRIC_WEIGHTS.get(role, ROLE_METRIC_WEIGHTS["MF"])
        model_weights = {metric_labels.get(m, m): round(w * 100, 1) for m, w in weights.items()}

        warning_msg = None
        if not is_qualified:
            warning_msg = f"Player played {mins} mins (< 90 mins threshold). Percentiles are unranked and performance score is dampened."

        return {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "role": role,
            "minutes_played": mins,
            "performance_score": p.get("performance_score"),
            "is_qualified_sample": is_qualified,
            "sample_size_warning": warning_msg,
            "percentiles": percentiles,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "scoring_model_weights": model_weights,
            "model_disclaimer": "This is our project's analytical scoring model (0-100) and is NOT an official StatsBomb rating."
        }

    def get_player_form(self, player_id: int, limit: int = 5) -> Optional[Dict[str, Any]]:
        """
        Fetch recent match performance trend (e.g. Last 5 or Last 10 matches).
        """
        if player_id not in self.player_perf_lookup:
            return None

        p = self.player_perf_lookup[player_id]
        all_matches = self.player_matches_lookup.get(player_id, [])

        if not all_matches:
            return {
                "player_id": p["player_id"],
                "player_name": p["player_name"],
                "team_name": p["team_name"],
                "sample_matches": 0,
                "matches": [],
                "summary": {}
            }

        # Take the most recent 'limit' matches
        recent_matches = all_matches[-limit:] if limit > 0 else all_matches

        # Compute summary metrics over recent window
        total_mins = sum(m.get("minutes_played", 0) for m in recent_matches)
        total_goals = sum(m.get("goals", 0) for m in recent_matches)
        total_assists = sum(m.get("assists", 0) for m in recent_matches)
        total_xg = sum(m.get("xg", 0.0) for m in recent_matches)
        total_xa = sum(m.get("xa", 0.0) for m in recent_matches)
        total_passes = sum(m.get("passes_attempted", 0) for m in recent_matches)
        completed_passes = sum(m.get("passes_completed", 0) for m in recent_matches)
        avg_pass_acc = round((completed_passes / total_passes * 100), 1) if total_passes > 0 else 0.0

        # Form rating: calculate a weighted recent match performance score
        form_points = []
        for m in recent_matches:
            mins = m.get("minutes_played", 0)
            if mins == 0:
                continue
            # Simple per-match impact index
            g = m.get("goals", 0)
            a = m.get("assists", 0)
            xg = m.get("xg", 0.0)
            kp = m.get("key_passes", 0)
            t = m.get("tackles", 0)
            rec = m.get("ball_recoveries", 0)
            match_impact = (g * 25.0) + (a * 15.0) + (xg * 20.0) + (kp * 5.0) + (t * 3.0) + (rec * 1.5)
            # Base participation bonus
            match_score = min(100.0, round(50.0 + match_impact * (mins / 90.0), 1))
            form_points.append(match_score)

        avg_form_score = round(float(np.mean(form_points)), 1) if form_points else 50.0

        # Form timeline
        timeline = []
        for idx, m in enumerate(recent_matches):
            timeline.append({
                "match_number": idx + 1,
                "match_id": m.get("match_id"),
                "date": m.get("match_date"),
                "stage": m.get("stage"),
                "opponent": m.get("opponent"),
                "minutes": m.get("minutes_played"),
                "goals": m.get("goals"),
                "assists": m.get("assists"),
                "xg": m.get("xg"),
                "xa": m.get("xa"),
                "key_passes": m.get("key_passes"),
                "pass_accuracy": m.get("pass_accuracy"),
                "match_score": form_points[idx] if idx < len(form_points) else 50.0
            })

        return {
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team_name": p["team_name"],
            "matches_evaluated": len(recent_matches),
            "recent_form_rating": avg_form_score,
            "summary": {
                "total_minutes": total_mins,
                "avg_minutes": round(total_mins / len(recent_matches), 1) if recent_matches else 0,
                "goals": total_goals,
                "assists": total_assists,
                "xg": round(total_xg, 2),
                "xa": round(total_xa, 2),
                "pass_accuracy": avg_pass_acc
            },
            "timeline": timeline
        }

    def get_filters(self) -> Dict[str, Any]:
        """
        Return available filter dropdown values for the frontend.
        """
        teams = sorted(self.df_season["team_name"].unique().tolist())
        roles = ["FW", "MF", "DF", "GK"]
        positions = sorted(self.df_season["primary_position"].unique().tolist())
        
        return {
            "competition": {
                "id": 43,
                "name": "FIFA World Cup",
                "season": "2022",
                "season_id": 106
            },
            "roles": roles,
            "positions": positions,
            "teams": teams,
            "total_players": len(self.df_season),
            "total_matches": self.df_match["match_id"].nunique()
        }
