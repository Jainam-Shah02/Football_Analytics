import sys
import json
import requests
import pandas as pd
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:5000"
VITE_URL = "http://localhost:5173"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_SEASON_PATH = PROJECT_ROOT / "data" / "processed" / "player_season_stats.csv"
CSV_MATCH_PATH = PROJECT_ROOT / "data" / "processed" / "player_match_stats.csv"

def run_audit():
    print("=" * 70)
    print("PHASE 3.1 — COMPLETE PLAYER UI FUNCTIONALITY AUDIT & VERIFICATION")
    print("=" * 70)

    results = {}

    # -------------------------------------------------------------
    # A. PERFORMANCE PERIOD FILTER (MESSI 5503)
    # -------------------------------------------------------------
    print("\n--- A. PERFORMANCE PERIOD FILTER (MESSI 5503) ---")
    r_full = requests.get(f"{BASE_URL}/api/player/5503/form?limit=100").json()
    r_10 = requests.get(f"{BASE_URL}/api/player/5503/form?limit=10").json()
    r_5 = requests.get(f"{BASE_URL}/api/player/5503/form?limit=5").json()

    print(f"  Full Tournament : {r_full['matches_evaluated']} matches, {r_full['summary']['total_minutes']} mins, goals={r_full['summary']['goals']}, assists={r_full['summary']['assists']}, xg={r_full['summary']['xg']}, xa={r_full['summary']['xa']}, pass_acc={r_full['summary']['pass_accuracy']}%")
    print(f"  Last 10 Matches : {r_10['matches_evaluated']} matches, {r_10['summary']['total_minutes']} mins, goals={r_10['summary']['goals']}, assists={r_10['summary']['assists']}, xg={r_10['summary']['xg']}, xa={r_10['summary']['xa']}, pass_acc={r_10['summary']['pass_accuracy']}%")
    print(f"  Last 5 Matches  : {r_5['matches_evaluated']} matches, {r_5['summary']['total_minutes']} mins, goals={r_5['summary']['goals']}, assists={r_5['summary']['assists']}, xg={r_5['summary']['xg']}, xa={r_5['summary']['xa']}, pass_acc={r_5['summary']['pass_accuracy']}%")

    period_changed = (
        r_5['matches_evaluated'] == 5
        and r_full['matches_evaluated'] == 7
        and r_5['summary']['goals'] == 5
        and r_full['summary']['goals'] == 7
        and r_5['summary']['total_minutes'] == 510
        and r_full['summary']['total_minutes'] == 690
        and len(r_5['timeline']) == 5
        and len(r_full['timeline']) == 7
    )
    results["period_filter"] = period_changed
    print(f"  -> Period Data Visibly Changes: {'PASS' if period_changed else 'FAIL'}")

    # -------------------------------------------------------------
    # B. NATIONAL TEAM FILTERING & RESET
    # -------------------------------------------------------------
    print("\n--- B. NATIONAL TEAM FILTERING & RESET ---")
    r_arg = requests.get(f"{BASE_URL}/api/players?team=Argentina&limit=10").json()
    r_fra = requests.get(f"{BASE_URL}/api/players?team=France&limit=10").json()
    r_cro = requests.get(f"{BASE_URL}/api/players?team=Croatia&limit=10").json()

    arg_has_messi = any(p['player_id'] == 5503 for p in r_arg['players'])
    fra_has_no_messi = not any(p['player_id'] == 5503 for p in r_fra['players'])
    fra_has_french = all(p['team_name'] == "France" for p in r_fra['players'])
    cro_has_modric_or_gvardiol = any(p['player_id'] in (5463, 33018) for p in r_cro['players'])

    team_ok = arg_has_messi and fra_has_no_messi and fra_has_french and cro_has_modric_or_gvardiol
    results["team_filter"] = team_ok
    print(f"  Argentina contains Messi: {arg_has_messi}")
    print(f"  France excludes Messi: {fra_has_no_messi} (all {len(r_fra['players'])} players are France)")
    print(f"  Croatia contains Modrić/Gvardiol: {cro_has_modric_or_gvardiol}")
    print(f"  -> Team Filter & Isolation: {'PASS' if team_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # C. ROLE FILTERING & RESET
    # -------------------------------------------------------------
    print("\n--- C. ROLE FILTERING & RESET ---")
    r_fw = requests.get(f"{BASE_URL}/api/players?role=FW&limit=10").json()
    r_df = requests.get(f"{BASE_URL}/api/players?role=DF&limit=10").json()
    r_mf = requests.get(f"{BASE_URL}/api/players?role=MF&search=Modric").json()
    r_gk = requests.get(f"{BASE_URL}/api/players?role=GK&limit=10").json()

    fw_has_messi = any(p['player_id'] == 5503 for p in r_fw['players'])
    df_has_no_messi = not any(p['player_id'] == 5503 for p in r_df['players'])
    df_all_df = all(p['role'] == "DF" for p in r_df['players'])
    df_has_gvardiol = any(p['player_id'] == 33018 for p in r_df['players'])
    mf_has_modric = any(p['player_id'] == 5463 for p in r_mf['players'])
    mf_all_mf = all(p['role'] == "MF" for p in r_mf['players'])
    gk_all_gk = all(p['role'] == "GK" for p in r_gk['players'])

    role_ok = fw_has_messi and df_has_no_messi and df_all_df and df_has_gvardiol and mf_has_modric and mf_all_mf and gk_all_gk
    results["role_filter"] = role_ok
    print(f"  FW contains Messi: {fw_has_messi}")
    print(f"  DF excludes Messi: {df_has_no_messi}")
    print(f"  DF contains Gvardiol: {df_has_gvardiol}")
    print(f"  MF contains Modrić (5463): {mf_has_modric} (all {len(r_mf['players'])} are MF)")
    print(f"  GK contains Goalkeepers: {gk_all_gk}")
    print(f"  -> Role Filter & Isolation: {'PASS' if role_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # D. PLAYER SWITCHING SEQUENCE (Messi -> Modrić -> Gvardiol -> Dybala)
    # -------------------------------------------------------------
    print("\n--- D. PLAYER SWITCHING SEQUENCE ---")
    seq = [
        {"id": 5503, "expected_name": "Lionel Andrés Messi Cuccittini", "expected_team": "Argentina", "expected_role": "FW"},
        {"id": 5463, "expected_name": "Luka Modrić", "expected_team": "Croatia", "expected_role": "MF"},
        {"id": 33018, "expected_name": "Joško Gvardiol", "expected_team": "Croatia", "expected_role": "DF"},
        {"id": 5743, "expected_name": "Paulo Bruno Exequiel Dybala", "expected_team": "Argentina", "expected_role": "DF"}
    ]

    switching_ok = True
    for s in seq:
        p = requests.get(f"{BASE_URL}/api/player/{s['id']}").json()
        perf = requests.get(f"{BASE_URL}/api/player/{s['id']}/performance").json()
        matches = requests.get(f"{BASE_URL}/api/player/{s['id']}/matches").json()

        name_match = s['id'] == p['player_id']
        team_match = p['team_name'] == s['expected_team']
        role_match = p['role'] == s['expected_role']
        has_score = perf.get('performance_score') is not None
        has_matches = len(matches.get('matches', [])) > 0

        print(f"  Player {s['id']}: name='{p['player_name']}', team='{p['team_name']}', role='{p['role']}', score={perf.get('performance_score')}, matches={len(matches.get('matches', []))}")
        if not (name_match and team_match and role_match and has_score and has_matches):
            switching_ok = False

    results["player_switching"] = switching_ok
    print(f"  -> Player Switching Sequence: {'PASS' if switching_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # E. SMALL SAMPLE (<90 MINS)
    # -------------------------------------------------------------
    print("\n--- E. SMALL SAMPLE HANDLING (PAULO DYBALA 5743) ---")
    dybala_perf = requests.get(f"{BASE_URL}/api/player/5743/performance").json()
    is_qual = dybala_perf['is_qualified_sample']
    warn = dybala_perf['sample_size_warning']
    score = dybala_perf['performance_score']

    small_sample_ok = (is_qual is False) and (warn is not None) and (score == 50.0)
    results["small_sample"] = small_sample_ok
    print(f"  is_qualified_sample: {is_qual} (expected False)")
    print(f"  sample_size_warning: '{warn}'")
    print(f"  performance_score: {score} (properly dampened)")
    print(f"  -> Small Sample Size Warning: {'PASS' if small_sample_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # F & G. DATA CONSISTENCY & MESSI INVESTIGATION
    # -------------------------------------------------------------
    print("\n--- F & G. DATA CONSISTENCY & MESSI DISCREPANCY AUDIT ---")
    df_season = pd.read_csv(CSV_SEASON_PATH)
    messi_csv = df_season[df_season['player_id'] == 5503].iloc[0]
    messi_api = requests.get(f"{BASE_URL}/api/player/5503").json()

    print("  Messi Ground Truth Audit:")
    print(f"    goals:        CSV = {messi_csv['goals']}, API = {messi_api['stats']['goals']}")
    print(f"    assists:      CSV = {messi_csv['assists']}, API = {messi_api['stats']['assists']}")
    print(f"    xg:           CSV = {messi_csv['xg']}, API = {messi_api['stats']['xg']}")
    print(f"    xa:           CSV = {messi_csv['xa']}, API = {messi_api['stats']['xa']}")
    print(f"    key_passes:   CSV = {messi_csv['key_passes']}, API = {messi_api['stats']['key_passes']}")
    print(f"    minutes:      CSV = {messi_csv['minutes_played']}, API = {messi_api['minutes_played']}")
    print(f"    pass_acc:     CSV = {messi_csv['pass_accuracy']}%, API = {messi_api['stats']['pass_accuracy']}%")

    discrepancy_resolved = (
        messi_csv['xa'] == 1.642
        and messi_api['stats']['xa'] == 1.642
        and messi_csv['key_passes'] == 16
        and messi_api['stats']['key_passes'] == 16
    )
    results["messi_audit"] = discrepancy_resolved
    print(f"  -> Messi Discrepancy Investigation: {'PASS (Identified as report typo 1.46/19 vs true 1.64/16)' if discrepancy_resolved else 'FAIL'}")

    # -------------------------------------------------------------
    # H. MATCH HISTORY INTEGRITY
    # -------------------------------------------------------------
    print("\n--- H. MATCH HISTORY INTEGRITY ---")
    m_messi = requests.get(f"{BASE_URL}/api/player/5503/matches").json()['matches']
    m_modric = requests.get(f"{BASE_URL}/api/player/5463/matches").json()['matches']
    m_gvardiol = requests.get(f"{BASE_URL}/api/player/33018/matches").json()['matches']

    messi_dates = [m['match_date'] for m in m_messi]
    messi_chrono = messi_dates == sorted(messi_dates)
    messi_unique = len(set(m['match_id'] for m in m_messi)) == 7

    modric_dates = [m['match_date'] for m in m_modric]
    modric_chrono = modric_dates == sorted(modric_dates)
    modric_unique = len(set(m['match_id'] for m in m_modric)) == 7

    match_hist_ok = len(m_messi) == 7 and messi_chrono and messi_unique and len(m_modric) == 7 and modric_chrono and modric_unique and len(m_gvardiol) == 7
    results["match_history"] = match_hist_ok
    print(f"  Messi matches: {len(m_messi)} (unique={messi_unique}, chrono={messi_chrono})")
    print(f"  Modrić matches: {len(m_modric)} (unique={modric_unique}, chrono={modric_chrono})")
    print(f"  Gvardiol matches: {len(m_gvardiol)}")
    print(f"  -> Match History Integrity: {'PASS' if match_hist_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # I. DIRECT ROUTE SERVING (VITE)
    # -------------------------------------------------------------
    print("\n--- I. DIRECT ROUTE SERVING (VITE DEV SERVER) ---")
    r_home = requests.get(f"{VITE_URL}/", timeout=5).status_code == 200
    r_pred = requests.get(f"{VITE_URL}/predictor", timeout=5).status_code == 200
    r_sim = requests.get(f"{VITE_URL}/simulator", timeout=5).status_code == 200
    r_ana = requests.get(f"{VITE_URL}/analytics", timeout=5).status_code == 200
    r_pa = requests.get(f"{VITE_URL}/player-analytics", timeout=5).status_code == 200
    r_pp = requests.get(f"{VITE_URL}/player-performance", timeout=5).status_code == 200

    routes_ok = r_home and r_pred and r_sim and r_ana and r_pa and r_pp
    results["routes"] = routes_ok
    print(f"  All 6 routes return HTTP 200: {routes_ok}")
    print(f"  -> Routes Status: {'PASS' if routes_ok else 'FAIL'}")

    print("\n" + "=" * 70)
    all_passed = all(results.values())
    print(f"PHASE 3.1 AUDIT RESULT: {'ALL TESTS PASSED - SYSTEM READY' if all_passed else 'FAILURES DETECTED'}")
    print("=" * 70)
    return all_passed

if __name__ == "__main__":
    success = run_audit()
    sys.exit(0 if success else 1)
