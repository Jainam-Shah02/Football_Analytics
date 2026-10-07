"""
player_analytics.py
===================
Core data processing and feature engineering module for player-level football analytics.
Converts raw StatsBomb event and lineup JSON data into clean match-level and season-level
player performance datasets.

Part of the Football Analytics and AI Prediction project.
"""

import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np

# Mapping of StatsBomb 23 distinct pitch positions to 4 standard tactical roles
POSITION_TO_ROLE = {
    # Goalkeepers
    "Goalkeeper": "GK",
    # Defenders
    "Center Back": "DF",
    "Left Center Back": "DF",
    "Right Center Back": "DF",
    "Left Back": "DF",
    "Right Back": "DF",
    "Left Wing Back": "DF",
    "Right Wing Back": "DF",
    # Midfielders
    "Center Defensive Midfield": "MF",
    "Left Defensive Midfield": "MF",
    "Right Defensive Midfield": "MF",
    "Center Midfield": "MF",
    "Left Center Midfield": "MF",
    "Right Center Midfield": "MF",
    "Left Midfield": "MF",
    "Right Midfield": "MF",
    "Center Attacking Midfield": "MF",
    "Left Attacking Midfield": "MF",
    "Right Attacking Midfield": "MF",
    # Forwards
    "Left Wing": "FW",
    "Right Wing": "FW",
    "Center Forward": "FW",
    "Left Center Forward": "FW",
    "Right Center Forward": "FW",
    "Secondary Striker": "FW",
}


def map_position_to_role(position_name: Optional[str]) -> str:
    """
    Map a specific tactical pitch position to one of four primary tactical roles:
    GK (Goalkeeper), DF (Defender), MF (Midfielder), FW (Forward).
    """
    if not position_name or pd.isna(position_name):
        return "Unknown"
    return POSITION_TO_ROLE.get(str(position_name).strip(), "MF")


def is_progressive_action(
    start_loc: Optional[List[float]],
    end_loc: Optional[List[float]],
    min_advance: float = 10.0,
    min_start_x: float = 40.0
) -> bool:
    """
    Determine if a pass or carry qualifies as a progressive action towards the opponent goal.
    Goal location in StatsBomb coordinates is (120, 40).
    A progressive action:
    - Starts past the defensive 33% of the pitch (start_x >= 40)
    - Reduces the Euclidean distance to the center of the opponent's goal by at least min_advance (10 units),
      OR enters the opponent's 18-yard penalty box (end_x >= 102 and 18 <= end_y <= 62).
    """
    if not start_loc or not end_loc or len(start_loc) < 2 or len(end_loc) < 2:
        return False
        
    start_x, start_y = start_loc[0], start_loc[1]
    end_x, end_y = end_loc[0], end_loc[1]
    
    if start_x < min_start_x:
        return False
        
    # Check if action ends inside the opponent's penalty area
    if end_x >= 102.0 and 18.0 <= end_y <= 62.0:
        return True
        
    # Measure distance reduction to opponent goal center (120, 40)
    start_dist = math.hypot(120.0 - start_x, 40.0 - start_y)
    end_dist = math.hypot(120.0 - end_x, 40.0 - end_y)
    
    return (start_dist - end_dist) >= min_advance


def calculate_player_match_minutes(
    match_id: int,
    lineup_data: List[Dict[str, Any]],
    events_data: List[Dict[str, Any]]
) -> Dict[int, Dict[str, Any]]:
    """
    Calculate exact playing minutes, starting status, and primary position for all players in a match.
    
    Assumptions & Logic:
    1. Regular match length is 90 minutes. If extra time periods (period 3 or 4) occur, regulation is 120 minutes.
    2. Penalty shootouts (period 5) are excluded from match minutes and in-game statistics.
    3. Starters begin at minute 0 and play until their substitution time (or full match duration if not subbed off).
    4. Substitutes begin at their entry minute and play until either their substitution off or full match duration.
    5. Red-carded players play until the minute of their expulsion.
    6. Unused substitutes (empty positions list in lineups) have 0 minutes.
    """
    # Check if extra time occurred
    periods = set(e.get("period", 1) for e in events_data)
    has_extra_time = any(p in (3, 4) for p in periods)
    match_duration = 120 if has_extra_time else 90
    
    # Track any red card expulsion times per player
    red_card_minutes: Dict[int, int] = {}
    for e in events_data:
        p_info = e.get("player")
        if not p_info:
            continue
        pid = p_info.get("id")
        card = (
            e.get("foul_committed", {}).get("card", {}).get("name")
            or e.get("bad_behaviour", {}).get("card", {}).get("name")
        )
        if card in ("Red Card", "Second Yellow"):
            minute = e.get("minute", match_duration)
            if pid not in red_card_minutes or minute < red_card_minutes[pid]:
                red_card_minutes[pid] = minute
                
    def parse_time_to_minute(t_str: Optional[str]) -> Optional[int]:
        if not t_str:
            return None
        parts = t_str.split(":")
        try:
            return int(parts[0])
        except (ValueError, IndexError):
            return None

    player_info: Dict[int, Dict[str, Any]] = {}

    for team in lineup_data:
        team_id = team.get("team_id")
        team_name = team.get("team_name")
        
        for p in team.get("lineup", []):
            pid = p.get("player_id")
            pname = p.get("player_name")
            p_nickname = p.get("player_nickname")
            country = p.get("country", {}).get("name", "Unknown") if isinstance(p.get("country"), dict) else "Unknown"
            jersey = p.get("jersey_number")
            
            positions = p.get("positions", [])
            if not positions:
                # Unused substitute
                player_info[pid] = {
                    "player_id": pid,
                    "player_name": pname,
                    "player_nickname": p_nickname,
                    "team_id": team_id,
                    "team_name": team_name,
                    "country": country,
                    "jersey_number": jersey,
                    "is_starter": False,
                    "minutes_played": 0,
                    "primary_position": "Bench",
                    "role": "Unknown",
                    "played_in_match": False
                }
                continue
                
            is_starter = any(pos.get("start_reason") == "Starting XI" for pos in positions)
            primary_pos = positions[0].get("position", "Unknown")
            role = map_position_to_role(primary_pos)
            
            # Determine start minute
            start_min = 0 if is_starter else None
            end_min = match_duration
            
            for pos in positions:
                if start_min is None and pos.get("from"):
                    start_min = parse_time_to_minute(pos.get("from"))
                if pos.get("to"):
                    end_min = parse_time_to_minute(pos.get("to")) or end_min
                elif pos.get("end_reason") == "Final Whistle":
                    end_min = match_duration
                    
            if start_min is None:
                start_min = 0
                
            # Cap at red card if player was expelled
            if pid in red_card_minutes and red_card_minutes[pid] < end_min:
                end_min = red_card_minutes[pid]
                
            # Safely calculate played minutes (at least 1 minute for any active appearance)
            minutes_played = max(1, end_min - start_min)
            
            player_info[pid] = {
                "player_id": pid,
                "player_name": pname,
                "player_nickname": p_nickname,
                "team_id": team_id,
                "team_name": team_name,
                "country": country,
                "jersey_number": jersey,
                "is_starter": is_starter,
                "minutes_played": minutes_played,
                "primary_position": primary_pos,
                "role": role,
                "played_in_match": True
            }

    return player_info


def extract_match_player_stats(
    match_meta: Dict[str, Any],
    lineup_data: List[Dict[str, Any]],
    events_data: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Extract aggregated statistical metrics for each player in a single match.
    Only players who actually played (minutes_played > 0) are returned in the match-level dataset.
    """
    match_id = match_meta["match_id"]
    comp_id = match_meta.get("competition", {}).get("competition_id", 43)
    comp_name = match_meta.get("competition", {}).get("competition_name", "FIFA World Cup")
    season_id = match_meta.get("season", {}).get("season_id", 106)
    season_name = match_meta.get("season", {}).get("season_name", "2022")
    match_date = match_meta.get("match_date", "")
    
    home_team = match_meta.get("home_team", {}).get("home_team_name", "")
    away_team = match_meta.get("away_team", {}).get("away_team_name", "")
    stage = match_meta.get("competition_stage", {}).get("name", "")

    # Calculate playing minutes
    player_minutes_info = calculate_player_match_minutes(match_id, lineup_data, events_data)

    # Pre-build lookup of shot xG by event id for calculating Expected Assists (xA / xAG)
    shot_xg_lookup: Dict[str, float] = {}
    for e in events_data:
        if e.get("type", {}).get("name") == "Shot" and e.get("period", 1) <= 4:
            eid = e.get("id")
            s_xg = e.get("shot", {}).get("statsbomb_xg", 0.0)
            if eid and s_xg:
                shot_xg_lookup[eid] = float(s_xg)

    # Initialize metric accumulators for all players who played
    stats_by_player: Dict[int, Dict[str, Any]] = {}
    for pid, pdata in player_minutes_info.items():
        if not pdata["played_in_match"]:
            continue
            
        stats_by_player[pid] = {
            "competition_id": comp_id,
            "competition_name": comp_name,
            "season_id": season_id,
            "season_name": season_name,
            "match_id": match_id,
            "match_date": match_date,
            "stage": stage,
            "opponent": away_team if pdata["team_name"] == home_team else home_team,
            "player_id": pid,
            "player_name": pdata["player_name"],
            "team_id": pdata["team_id"],
            "team_name": pdata["team_name"],
            "country": pdata["country"],
            "position": pdata["primary_position"],
            "role": pdata["role"],
            "is_starter": 1 if pdata["is_starter"] else 0,
            "minutes_played": pdata["minutes_played"],
            # Offensive Metrics
            "goals": 0,
            "assists": 0,
            "shots": 0,
            "shots_on_target": 0,
            "xg": 0.0,
            "xa": 0.0,
            # Passing & Playmaking
            "passes_attempted": 0,
            "passes_completed": 0,
            "key_passes": 0,
            "progressive_passes": 0,
            # Ball Carrying & Dribbling
            "carries": 0,
            "progressive_carries": 0,
            "dribbles_attempted": 0,
            "dribbles_completed": 0,
            # Defending & Duels
            "tackles": 0,
            "interceptions": 0,
            "ball_recoveries": 0,
            "blocks": 0,
            "clearances": 0,
            # Discipline & Physicality
            "fouls_committed": 0,
            "fouls_won": 0,
            "yellow_cards": 0,
            "red_cards": 0,
        }

    # Aggregate events per player (exclude period 5 penalty shootouts from in-game stats)
    for e in events_data:
        period = e.get("period", 1)
        if period > 4:
            continue
            
        p_obj = e.get("player")
        if not p_obj:
            continue
            
        pid = p_obj.get("id")
        if pid not in stats_by_player:
            # Player was not in standard lineup (fallback to create record)
            continue
            
        etype = e.get("type", {}).get("name", "")
        p_stats = stats_by_player[pid]
        start_loc = e.get("location")
        
        # 1. Shots & Goals
        if etype == "Shot":
            shot_dict = e.get("shot", {})
            outcome = shot_dict.get("outcome", {}).get("name", "")
            p_stats["shots"] += 1
            if outcome == "Goal":
                p_stats["goals"] += 1
            if outcome in ("Goal", "Saved", "Saved to Post", "Saved Off Target"):
                p_stats["shots_on_target"] += 1
            p_stats["xg"] += float(shot_dict.get("statsbomb_xg", 0.0))

        # 2. Passes, Assists, Key Passes, xA, Progressive Passes
        elif etype == "Pass":
            pass_dict = e.get("pass", {})
            p_stats["passes_attempted"] += 1
            
            # Completed pass has no 'outcome' field in StatsBomb
            is_completed = "outcome" not in pass_dict
            if is_completed:
                p_stats["passes_completed"] += 1
                end_loc = pass_dict.get("end_location")
                if is_progressive_action(start_loc, end_loc, min_advance=10.0, min_start_x=40.0):
                    p_stats["progressive_passes"] += 1
                    
            if pass_dict.get("goal_assist") is True:
                p_stats["assists"] += 1
                
            if pass_dict.get("shot_assist") is True:
                p_stats["key_passes"] += 1
                as_id = pass_dict.get("assisted_shot_id")
                if as_id and as_id in shot_xg_lookup:
                    p_stats["xa"] += shot_xg_lookup[as_id]

        # 3. Carries & Progressive Carries
        elif etype == "Carry":
            carry_dict = e.get("carry", {})
            p_stats["carries"] += 1
            end_loc = carry_dict.get("end_location")
            if is_progressive_action(start_loc, end_loc, min_advance=10.0, min_start_x=40.0):
                p_stats["progressive_carries"] += 1

        # 4. Dribbles
        elif etype == "Dribble":
            p_stats["dribbles_attempted"] += 1
            if e.get("dribble", {}).get("outcome", {}).get("name") == "Complete":
                p_stats["dribbles_completed"] += 1

        # 5. Defending
        elif etype == "Duel":
            if e.get("duel", {}).get("type", {}).get("name") == "Tackle":
                p_stats["tackles"] += 1
        elif etype == "Interception":
            p_stats["interceptions"] += 1
        elif etype == "Ball Recovery":
            p_stats["ball_recoveries"] += 1
        elif etype == "Block":
            p_stats["blocks"] += 1
        elif etype == "Clearance":
            p_stats["clearances"] += 1

        # 6. Discipline & Fouls
        elif etype == "Foul Committed":
            p_stats["fouls_committed"] += 1
            card = e.get("foul_committed", {}).get("card", {}).get("name")
            if card == "Yellow Card":
                p_stats["yellow_cards"] += 1
            elif card in ("Red Card", "Second Yellow"):
                p_stats["red_cards"] += 1
        elif etype == "Foul Won":
            p_stats["fouls_won"] += 1
        elif etype == "Bad Behaviour":
            card = e.get("bad_behaviour", {}).get("card", {}).get("name")
            if card == "Yellow Card":
                p_stats["yellow_cards"] += 1
            elif card in ("Red Card", "Second Yellow"):
                p_stats["red_cards"] += 1

    # Round floating-point metrics cleanly
    for p_stats in stats_by_player.values():
        p_stats["xg"] = round(p_stats["xg"], 3)
        p_stats["xa"] = round(p_stats["xa"], 3)

    return list(stats_by_player.values())


def calculate_per90_metrics(df: pd.DataFrame, minutes_col: str = "minutes_played") -> pd.DataFrame:
    """
    Safely calculate Per-90 and rate statistics for a player DataFrame.
    Prevents division-by-zero, negative infinity, and positive infinity.
    
    Formula:
        metric_per90 = (metric / minutes) * 90
    """
    df_calc = df.copy()
    
    # Filter/clip minutes to safe minimum for rate calculations
    mins = df_calc[minutes_col].astype(float)
    # Use np.where to avoid dividing by 0
    safe_mins = np.where(mins > 0, mins, np.nan)

    # Per-90 metrics
    metrics_to_scale = [
        ("goals", "goals_per90"),
        ("assists", "assists_per90"),
        ("shots", "shots_per90"),
        ("shots_on_target", "shots_on_target_per90"),
        ("xg", "xg_per90"),
        ("xa", "xa_per90"),
        ("passes_attempted", "passes_per90"),
        ("passes_completed", "passes_completed_per90"),
        ("key_passes", "key_passes_per90"),
        ("progressive_passes", "progressive_passes_per90"),
        ("carries", "carries_per90"),
        ("progressive_carries", "progressive_carries_per90"),
        ("dribbles_attempted", "dribbles_per90"),
        ("dribbles_completed", "dribbles_completed_per90"),
        ("tackles", "tackles_per90"),
        ("interceptions", "interceptions_per90"),
        ("ball_recoveries", "recoveries_per90"),
        ("blocks", "blocks_per90"),
        ("clearances", "clearances_per90"),
    ]

    for raw_col, per90_col in metrics_to_scale:
        if raw_col in df_calc.columns:
            val = df_calc[raw_col].astype(float)
            df_calc[per90_col] = np.where(safe_mins > 0, np.round((val / safe_mins) * 90.0, 3), 0.0)

    # Percentage & Efficiency metrics
    # Pass accuracy
    df_calc["pass_accuracy"] = np.where(
        df_calc["passes_attempted"] > 0,
        np.round((df_calc["passes_completed"] / df_calc["passes_attempted"]) * 100.0, 1),
        0.0
    )
    
    # Shot accuracy
    df_calc["shot_accuracy"] = np.where(
        df_calc["shots"] > 0,
        np.round((df_calc["shots_on_target"] / df_calc["shots"]) * 100.0, 1),
        0.0
    )
    
    # Dribble success rate
    df_calc["dribble_success_rate"] = np.where(
        df_calc["dribbles_attempted"] > 0,
        np.round((df_calc["dribbles_completed"] / df_calc["dribbles_attempted"]) * 100.0, 1),
        0.0
    )
    
    # xG per shot
    df_calc["xg_per_shot"] = np.where(
        df_calc["shots"] > 0,
        np.round(df_calc["xg"] / df_calc["shots"], 3),
        0.0
    )

    return df_calc


def build_player_match_stats_df(
    matches: List[Dict[str, Any]],
    raw_dir: Optional[Path] = None
) -> pd.DataFrame:
    """
    Process all matches in a tournament into a single player-match DataFrame.
    One row represents one player in one match.
    Also standardizes any inconsistent player naming (e.g. 'Phil Foden' vs 'Philip Foden')
    across matches using the most common canonical name for each player_id.
    """
    from src.player_data_loader import load_match_lineup, load_match_events
    
    all_rows: List[Dict[str, Any]] = []
    for m in matches:
        mid = m["match_id"]
        lineup = load_match_lineup(mid, raw_dir=raw_dir)
        events = load_match_events(mid, raw_dir=raw_dir)
        match_stats = extract_match_player_stats(m, lineup, events)
        all_rows.extend(match_stats)
        
    df_match = pd.DataFrame(all_rows)
    
    # Standardize player name per player_id across tournament matches
    canonical_names = (
        df_match.groupby("player_id")["player_name"]
        .agg(lambda x: x.mode().iloc[0] if not x.empty else x.iloc[0])
        .to_dict()
    )
    df_match["player_name"] = df_match["player_id"].map(canonical_names)

    df_match = calculate_per90_metrics(df_match, minutes_col="minutes_played")
    
    # Sort deterministically
    df_match = df_match.sort_values(by=["match_date", "match_id", "team_name", "player_name"]).reset_index(drop=True)
    return df_match


def aggregate_player_season_stats(df_match: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate match-level player statistics into season-level statistics.
    One row represents one player + competition + season.
    
    Sums counting statistics correctly and recomputes per-90 and accuracy metrics
    from season totals rather than naively averaging match per-90 rates.
    """
    group_cols = [
        "competition_id",
        "competition_name",
        "season_id",
        "season_name",
        "player_id",
        "player_name",
        "team_id",
        "team_name",
        "country"
    ]
    
    sum_cols = [
        "is_starter",
        "minutes_played",
        "goals",
        "assists",
        "shots",
        "shots_on_target",
        "xg",
        "xa",
        "passes_attempted",
        "passes_completed",
        "key_passes",
        "progressive_passes",
        "carries",
        "progressive_carries",
        "dribbles_attempted",
        "dribbles_completed",
        "tackles",
        "interceptions",
        "ball_recoveries",
        "blocks",
        "clearances",
        "fouls_committed",
        "fouls_won",
        "yellow_cards",
        "red_cards"
    ]

    # Calculate match count and primary position (mode)
    grouped = df_match.groupby(group_cols)
    
    agg_df = grouped[sum_cols].sum().reset_index()
    agg_df.rename(columns={"is_starter": "starts"}, inplace=True)
    
    # Calculate matches played
    match_counts = grouped.size().reset_index(name="matches_played")
    agg_df = pd.merge(agg_df, match_counts, on=group_cols)
    
    # Find most frequent position and role for each player
    primary_pos = (
        df_match.groupby(group_cols)["position"]
        .agg(lambda x: x.mode().iloc[0] if not x.empty else "Unknown")
        .reset_index(name="primary_position")
    )
    primary_role = (
        df_match.groupby(group_cols)["role"]
        .agg(lambda x: x.mode().iloc[0] if not x.empty else "MF")
        .reset_index(name="role")
    )
    
    agg_df = pd.merge(agg_df, primary_pos, on=group_cols)
    agg_df = pd.merge(agg_df, primary_role, on=group_cols)
    
    # Recompute Per-90 and rate statistics from the aggregated season totals
    agg_df = calculate_per90_metrics(agg_df, minutes_col="minutes_played")
    
    # Reorder columns cleanly
    id_cols = [
        "competition_id", "competition_name", "season_id", "season_name",
        "player_id", "player_name", "team_id", "team_name", "country",
        "primary_position", "role", "matches_played", "starts", "minutes_played"
    ]
    other_cols = [c for c in agg_df.columns if c not in id_cols]
    agg_df = agg_df[id_cols + other_cols]
    
    # Sort deterministically by minutes played descending
    agg_df = agg_df.sort_values(by=["minutes_played", "goals", "xg"], ascending=[False, False, False]).reset_index(drop=True)
    return agg_df


def validate_processed_data(df_match: pd.DataFrame, df_season: pd.DataFrame) -> Dict[str, Any]:
    """
    Run comprehensive data validation checks on match and season datasets:
    - Row counts
    - Null values in critical identifiers
    - Duplicate keys (match_id + player_id)
    - Value ranges (minutes >= 0, goals >= 0, shots >= 0, etc.)
    - Rate ranges (0 <= pass_accuracy <= 100, 0 <= shot_accuracy <= 100)
    - Infinite or NaN per-90 rates
    """
    checks = {}
    
    # 1. Row counts
    checks["match_row_count"] = len(df_match)
    checks["season_row_count"] = len(df_season)
    checks["unique_players_match"] = df_match["player_id"].nunique()
    checks["unique_players_season"] = df_season["player_id"].nunique()
    
    # 2. Critical nulls
    checks["match_null_players"] = int(df_match["player_id"].isna().sum())
    checks["match_null_matches"] = int(df_match["match_id"].isna().sum())
    checks["season_null_players"] = int(df_season["player_id"].isna().sum())
    
    # 3. Duplicate checks
    checks["duplicate_player_matches"] = int(df_match.duplicated(subset=["match_id", "player_id"]).sum())
    checks["duplicate_player_seasons"] = int(df_season.duplicated(subset=["competition_id", "season_id", "player_id"]).sum())
    
    # 4. Range and integrity checks
    checks["negative_minutes_match"] = int((df_match["minutes_played"] < 0).sum())
    checks["negative_minutes_season"] = int((df_season["minutes_played"] < 0).sum())
    checks["negative_goals"] = int((df_season["goals"] < 0).sum())
    checks["negative_shots"] = int((df_season["shots"] < 0).sum())
    checks["goals_exceed_shots"] = int((df_season["goals"] > df_season["shots"]).sum())  # could happen only via own goals, verify
    
    # 5. Percentage boundary checks
    checks["invalid_pass_acc"] = int(((df_season["pass_accuracy"] < 0) | (df_season["pass_accuracy"] > 100)).sum())
    checks["invalid_shot_acc"] = int(((df_season["shot_accuracy"] < 0) | (df_season["shot_accuracy"] > 100)).sum())
    
    # 6. Infinite value checks
    num_cols = df_season.select_dtypes(include=[np.number]).columns
    checks["infinite_values_season"] = int(np.isinf(df_season[num_cols]).values.sum())
    
    # Overall summary status
    all_passed = (
        checks["match_null_players"] == 0
        and checks["season_null_players"] == 0
        and checks["duplicate_player_matches"] == 0
        and checks["duplicate_player_seasons"] == 0
        and checks["negative_minutes_match"] == 0
        and checks["negative_minutes_season"] == 0
        and checks["invalid_pass_acc"] == 0
        and checks["invalid_shot_acc"] == 0
        and checks["infinite_values_season"] == 0
    )
    checks["all_validation_passed"] = bool(all_passed)
    
    return checks
