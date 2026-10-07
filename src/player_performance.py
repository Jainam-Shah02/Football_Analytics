"""
player_performance.py
=====================
Statistical analysis, role-based percentile rankings, and analytical player performance scoring.
Part of the Football Analytics and AI Prediction project.

Note: All performance scores and percentiles produced by this module represent
our project's analytical models and are NOT official StatsBomb ratings.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

# Role-specific weights for Project Analytical Performance Score (0-100)
ROLE_METRIC_WEIGHTS = {
    "FW": {
        "xg_per90": 0.25,
        "goals_per90": 0.20,
        "xa_per90": 0.15,
        "key_passes_per90": 0.15,
        "shots_on_target_per90": 0.15,
        "dribble_success_rate": 0.10,
    },
    "MF": {
        "pass_accuracy": 0.20,
        "key_passes_per90": 0.15,
        "progressive_passes_per90": 0.15,
        "xa_per90": 0.15,
        "recoveries_per90": 0.15,
        "tackles_per90": 0.10,
        "passes_per90": 0.10,
    },
    "DF": {
        "interceptions_per90": 0.20,
        "tackles_per90": 0.20,
        "clearances_per90": 0.15,
        "blocks_per90": 0.15,
        "recoveries_per90": 0.15,
        "pass_accuracy": 0.15,
    },
    "GK": {
        # Goalkeeper coverage limitation: StatsBomb event data includes passes, clearances,
        # and ball recoveries for goalkeepers.
        "pass_accuracy": 0.35,
        "recoveries_per90": 0.25,
        "clearances_per90": 0.25,
        "passes_per90": 0.15,
    }
}


def calculate_role_percentiles(
    df_season: pd.DataFrame,
    min_minutes: int = 90
) -> pd.DataFrame:
    """
    Compute within-role percentile ranks (0 - 100) for key statistical metrics.
    
    Methodology:
    1. Filter out players with fewer than `min_minutes` (default: 90 minutes)
       to avoid small-sample distortions (e.g. a substitute playing 5 minutes
       with 1 goal having 18 goals/90).
    2. Group qualified players by tactical role ('FW', 'MF', 'DF', 'GK').
    3. Compute empirical percentile rank using standard pandas rank(pct=True) * 100.
    4. For players below the min_minutes threshold, percentiles are set to NaN.
    """
    df_pct = df_season.copy()
    
    # Identify eligible cohort
    is_eligible = df_pct["minutes_played"] >= min_minutes
    df_pct["is_qualified_sample"] = is_eligible
    
    percentile_metrics = [
        "goals_per90",
        "xg_per90",
        "assists_per90",
        "xa_per90",
        "shots_per90",
        "shots_on_target_per90",
        "key_passes_per90",
        "passes_per90",
        "pass_accuracy",
        "progressive_passes_per90",
        "carries_per90",
        "progressive_carries_per90",
        "dribbles_per90",
        "dribble_success_rate",
        "tackles_per90",
        "interceptions_per90",
        "recoveries_per90",
        "blocks_per90",
        "clearances_per90",
    ]
    
    # Create percentile columns
    for metric in percentile_metrics:
        if metric not in df_pct.columns:
            continue
        pct_col = f"{metric}_percentile"
        df_pct[pct_col] = np.nan
        
        # Calculate percentiles within role for eligible cohort
        for role in ["FW", "MF", "DF", "GK"]:
            mask = is_eligible & (df_pct["role"] == role)
            if mask.sum() > 1:
                ranks = df_pct.loc[mask, metric].rank(pct=True, method="average") * 100.0
                df_pct.loc[mask, pct_col] = np.round(ranks, 1)
            elif mask.sum() == 1:
                df_pct.loc[mask, pct_col] = 50.0

    return df_pct


def calculate_analytical_performance_score(
    df_season: pd.DataFrame,
    min_minutes: int = 90
) -> pd.DataFrame:
    """
    Calculate the Project Analytical Performance Score (0 - 100).
    
    Methodology & Formula:
    - Uses role-specific weights applied to the player's within-role percentile rankings.
    - Formula:
        Raw_Score = Sum(Weight_i * Percentile_i) for all metric_i defined in ROLE_METRIC_WEIGHTS[Role]
    - Sample-Size Adjustment:
        For players who played between 0 and min_minutes, confidence dampening is applied:
        Dampened_Score = Raw_Score * (minutes_played / min_minutes)
    - Normalized between 0.0 and 100.0, rounded to 1 decimal place.
    
    DISCLAIMER: This is our project's analytical model and NOT an official StatsBomb rating.
    """
    df_scored = calculate_role_percentiles(df_season, min_minutes=min_minutes)
    
    df_scored["performance_score"] = np.nan
    
    for idx, row in df_scored.iterrows():
        role = row.get("role", "MF")
        weights = ROLE_METRIC_WEIGHTS.get(role, ROLE_METRIC_WEIGHTS["MF"])
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for metric, w in weights.items():
            pct_col = f"{metric}_percentile"
            val = row.get(pct_col)
            if pd.notna(val):
                weighted_sum += float(val) * w
                total_weight += w
                
        if total_weight > 0:
            score = weighted_sum / total_weight
            # Apply confidence dampening for small sample sizes below min_minutes
            mins = float(row.get("minutes_played", 0))
            if mins < min_minutes:
                score = score * (mins / float(min_minutes))
            df_scored.at[idx, "performance_score"] = round(float(np.clip(score, 0.0, 100.0)), 1)
        else:
            df_scored.at[idx, "performance_score"] = 50.0

    # Sort deterministically by performance score descending
    df_scored = df_scored.sort_values(
        by=["performance_score", "minutes_played"],
        ascending=[False, False]
    ).reset_index(drop=True)
    
    return df_scored


def export_all_datasets(
    df_match: pd.DataFrame,
    df_season: pd.DataFrame,
    df_performance: pd.DataFrame,
    output_dir: Optional[Path] = None
) -> Dict[str, Path]:
    """
    Export processed datasets to CSV and multi-sheet Excel workbook:
    - player_match_stats.csv
    - player_season_stats.csv
    - player_statistics.xlsx (with 4 sheets):
        1. Player Season Stats
        2. Player Match Stats
        3. Player Percentiles
        4. Performance Scores
    """
    out_dir = Path(output_dir) if output_dir else PROCESSED_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Export CSVs
    match_csv_path = out_dir / "player_match_stats.csv"
    season_csv_path = out_dir / "player_season_stats.csv"
    
    df_match.to_csv(match_csv_path, index=False, encoding="utf-8")
    df_season.to_csv(season_csv_path, index=False, encoding="utf-8")
    
    # 2. Prepare sheets for Excel export
    excel_path = out_dir / "player_statistics.xlsx"
    
    # Separate percentiles and performance score columns cleanly
    pct_cols = [c for c in df_performance.columns if c.endswith("_percentile")]
    id_cols = [
        "competition_name", "season_name", "player_id", "player_name",
        "team_name", "primary_position", "role", "matches_played", "minutes_played"
    ]
    
    df_percentiles = df_performance[id_cols + pct_cols].copy()
    
    perf_cols = id_cols + ["performance_score"] + [
        "goals", "xg", "assists", "xa", "passes_completed", "pass_accuracy",
        "key_passes", "progressive_passes", "tackles", "interceptions", "ball_recoveries"
    ]
    # Filter only available columns
    available_perf_cols = [c for c in perf_cols if c in df_performance.columns]
    df_scores = df_performance[available_perf_cols].copy()
    
    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        df_season.to_excel(writer, sheet_name="Player Season Stats", index=False)
        # Match sheet can be large, write safely
        df_match.to_excel(writer, sheet_name="Player Match Stats", index=False)
        df_percentiles.to_excel(writer, sheet_name="Player Percentiles", index=False)
        df_scores.to_excel(writer, sheet_name="Performance Scores", index=False)
        
    return {
        "player_match_stats_csv": match_csv_path,
        "player_season_stats_csv": season_csv_path,
        "player_statistics_excel": excel_path
    }
