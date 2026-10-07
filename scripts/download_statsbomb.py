import os
import sys
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

BASE_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "statsbomb"

def download_file(url, target_path, retries=3):
    if target_path.exists() and target_path.stat().st_size > 0:
        return True, "already_exists"
    
    target_path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(retries):
        try:
            r = requests.get(url, timeout=30)
            if r.status_code == 200:
                with open(target_path, "w", encoding="utf-8") as f:
                    f.write(r.text)
                return True, "downloaded"
            else:
                return False, f"status_{r.status_code}"
        except Exception as e:
            if attempt == retries - 1:
                return False, str(e)
            time.sleep(1)
    return False, "failed"

def main():
    print(f"StatsBomb raw target directory: {RAW_DIR}")
    
    # 1. Download competitions.json
    comp_url = f"{BASE_URL}/competitions.json"
    comp_file = RAW_DIR / "competitions.json"
    print("Fetching competitions.json...")
    success, msg = download_file(comp_url, comp_file)
    print(f"Competitions: {msg}")
    
    with open(comp_file, "r", encoding="utf-8") as f:
        competitions = json.load(f)
    
    # Find FIFA World Cup 2022 (competition_id=43, season_id=106)
    target_comp = None
    for c in competitions:
        if c.get("competition_id") == 43 and c.get("season_id") == 106:
            target_comp = c
            break
            
    if not target_comp:
        print("FIFA World Cup 2022 not found in competitions.json!")
        return
        
    print(f"Selected: {target_comp['competition_name']} ({target_comp['season_name']})")
    
    # 2. Download matches/43/106.json
    match_url = f"{BASE_URL}/matches/43/106.json"
    match_file = RAW_DIR / "matches" / "43" / "106.json"
    success, msg = download_file(match_url, match_file)
    print(f"Matches file: {msg}")
    
    with open(match_file, "r", encoding="utf-8") as f:
        matches = json.load(f)
    print(f"Total matches in tournament: {len(matches)}")
    
    # 3. Download lineups and events for all matches in tournament
    # Using ThreadPoolExecutor for efficient retrieval
    tasks = []
    print(f"Downloading events and lineups for {len(matches)} matches...")
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        for m in matches:
            mid = m["match_id"]
            # Event
            e_url = f"{BASE_URL}/events/{mid}.json"
            e_file = RAW_DIR / "events" / f"{mid}.json"
            tasks.append(executor.submit(download_file, e_url, e_file))
            
            # Lineup
            l_url = f"{BASE_URL}/lineups/{mid}.json"
            l_file = RAW_DIR / "lineups" / f"{mid}.json"
            tasks.append(executor.submit(download_file, l_url, l_file))
            
        completed = 0
        total = len(tasks)
        for fut in as_completed(tasks):
            completed += 1
            if completed % 20 == 0 or completed == total:
                print(f"Progress: {completed}/{total} files processed ({completed/total*100:.1f}%)")
                
    print("StatsBomb open-data download complete!")
    print(f"Events downloaded: {len(list((RAW_DIR / 'events').glob('*.json')))}")
    print(f"Lineups downloaded: {len(list((RAW_DIR / 'lineups').glob('*.json')))}")

if __name__ == "__main__":
    main()
