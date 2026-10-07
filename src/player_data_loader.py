"""
player_data_loader.py
=====================
Module for loading raw StatsBomb Open Data JSON files and processed player datasets.
Part of the Football Analytics and AI Prediction project.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw" / "statsbomb"
PROCESSED_DIR = DATA_DIR / "processed"


def get_available_competitions(raw_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    """
    Load competitions.json from StatsBomb raw data directory.
    
    Returns:
        List of competition metadata dictionaries.
    """
    base_dir = Path(raw_dir) if raw_dir else RAW_DIR
    comp_file = base_dir / "competitions.json"
    
    if not comp_file.exists():
        raise FileNotFoundError(f"competitions.json not found at {comp_file}")
        
    with open(comp_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_competition_matches(
    competition_id: int = 43,
    season_id: int = 106,
    raw_dir: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """
    Load matches JSON for a specific competition and season.
    
    Args:
        competition_id: StatsBomb competition ID (default 43 = FIFA World Cup)
        season_id: StatsBomb season ID (default 106 = 2022)
        raw_dir: Path to raw statsbomb directory
        
    Returns:
        List of match dictionaries.
    """
    base_dir = Path(raw_dir) if raw_dir else RAW_DIR
    match_file = base_dir / "matches" / str(competition_id) / f"{season_id}.json"
    
    if not match_file.exists():
        raise FileNotFoundError(f"Matches file not found at {match_file}")
        
    with open(match_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_match_lineup(
    match_id: int,
    raw_dir: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """
    Load lineup JSON for a given match ID.
    
    Args:
        match_id: StatsBomb match identifier.
        raw_dir: Path to raw statsbomb directory.
        
    Returns:
        List containing lineups for both teams.
    """
    base_dir = Path(raw_dir) if raw_dir else RAW_DIR
    lineup_file = base_dir / "lineups" / f"{match_id}.json"
    
    if not lineup_file.exists():
        raise FileNotFoundError(f"Lineup file not found for match {match_id} at {lineup_file}")
        
    with open(lineup_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_match_events(
    match_id: int,
    raw_dir: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """
    Load events JSON for a given match ID.
    
    Args:
        match_id: StatsBomb match identifier.
        raw_dir: Path to raw statsbomb directory.
        
    Returns:
        List of event dictionaries for the match.
    """
    base_dir = Path(raw_dir) if raw_dir else RAW_DIR
    event_file = base_dir / "events" / f"{match_id}.json"
    
    if not event_file.exists():
        raise FileNotFoundError(f"Events file not found for match {match_id} at {event_file}")
        
    with open(event_file, "r", encoding="utf-8") as f:
        return json.load(f)


def load_player_match_stats(processed_dir: Optional[Path] = None) -> pd.DataFrame:
    """
    Load processed player match statistics CSV into a DataFrame.
    """
    base_dir = Path(processed_dir) if processed_dir else PROCESSED_DIR
    csv_file = base_dir / "player_match_stats.csv"
    if not csv_file.exists():
        raise FileNotFoundError(f"player_match_stats.csv not found at {csv_file}")
    return pd.read_csv(csv_file)


def load_player_season_stats(processed_dir: Optional[Path] = None) -> pd.DataFrame:
    """
    Load processed player season statistics CSV into a DataFrame.
    """
    base_dir = Path(processed_dir) if processed_dir else PROCESSED_DIR
    csv_file = base_dir / "player_season_stats.csv"
    if not csv_file.exists():
        raise FileNotFoundError(f"player_season_stats.csv not found at {csv_file}")
    return pd.read_csv(csv_file)
