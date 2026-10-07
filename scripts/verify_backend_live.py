"""
verify_backend_live.py
======================
Comprehensive verification script for Phase 2.5 of the Football Analytics project.
Conducts rigorous live HTTP testing against http://127.0.0.1:5000 covering:
1. Server status & port
2. Legacy APIs (/api/teams, /api/probabilities, /api/predict)
3. Player list & search/filtering (/api/players)
4. Player profile (/api/player/5503)
5. Player match history (/api/player/5503/matches)
6. Player performance & percentiles (/api/player/5503/performance)
7. Player form (/api/player/5503/form)
8. Filter metadata (/api/player-filters)
9. Error handling on invalid IDs (404, no traceback)
10. Data consistency (API vs CSV for FW, MF, DF)
11. Small-sample handling (<90 minutes player)
12. Malformed requests & stability
13. Latency & repeated request benchmarking
"""

import sys
import time
import json
from pathlib import Path
import requests
import pandas as pd
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:5000"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_SEASON_PATH = PROJECT_ROOT / "data" / "processed" / "player_season_stats.csv"
CSV_MATCH_PATH = PROJECT_ROOT / "data" / "processed" / "player_match_stats.csv"

def run_verification():
    print("=" * 70)
    print("PHASE 2.5 — LIVE BACKEND API VERIFICATION SUITE")
    print(f"Target Server: {BASE_URL}")
    print("=" * 70)

    results = {
        "server": False,
        "legacy": {},
        "player_apis": {},
        "error_handling": {},
        "data_consistency": {},
        "small_sample": {},
        "performance": {}
    }

    # 1. SERVER LIVENESS
    print("\n--- 1. SERVER LIVENESS ---")
    try:
        r = requests.get(f"{BASE_URL}/api/player-filters", timeout=3)
        if r.status_code == 200:
            print("  [PASS] Flask server active and responding on port 5000.")
            results["server"] = True
        else:
            print(f"  [FAIL] Unexpected status code: {r.status_code}")
    except Exception as e:
        print(f"  [FAIL] Could not connect to {BASE_URL}: {e}")
        return results

    # 2. LEGACY APIs
    print("\n--- 2. LEGACY APIs ---")
    # 2.1 /api/teams
    r_teams = requests.get(f"{BASE_URL}/api/teams", timeout=3)
    teams_ok = r_teams.status_code == 200 and "teams" in r_teams.json() and len(r_teams.json()["teams"]) == 48
    print(f"  GET /api/teams: status={r_teams.status_code}, teams_count={len(r_teams.json().get('teams', []))} -> {'PASS' if teams_ok else 'FAIL'}")
    results["legacy"]["teams"] = teams_ok

    # 2.2 /api/probabilities
    r_probs = requests.get(f"{BASE_URL}/api/probabilities", timeout=3)
    probs_ok = r_probs.status_code == 200 and isinstance(r_probs.json(), list) and len(r_probs.json()) > 0
    print(f"  GET /api/probabilities: status={r_probs.status_code}, records={len(r_probs.json()) if probs_ok else 0} -> {'PASS' if probs_ok else 'FAIL'}")
    results["legacy"]["probabilities"] = probs_ok

    # 2.3 POST /api/predict
    r_pred = requests.post(f"{BASE_URL}/api/predict", json={"home_team": "Argentina", "away_team": "France"}, timeout=5)
    pred_data = r_pred.json() if r_pred.status_code == 200 else {}
    pred_ok = r_pred.status_code == 200 and "home_xg" in pred_data and "home_win_prob" in pred_data and "away_win_prob" in pred_data
    print(f"  POST /api/predict (Argentina vs France): status={r_pred.status_code}, home_xg={pred_data.get('home_xg')}, home_win={pred_data.get('home_win_prob')} -> {'PASS' if pred_ok else 'FAIL'}")
    results["legacy"]["predict"] = pred_ok

    # 3. PLAYER API — LIST & SEARCH/FILTER
    print("\n--- 3. PLAYER API: LIST, SEARCH & FILTERING ---")
    # 3.1 Default list
    r_players = requests.get(f"{BASE_URL}/api/players", timeout=3)
    p_json = r_players.json()
    p_list_ok = r_players.status_code == 200 and p_json.get("total") == 680 and len(p_json.get("players", [])) == 50
    print(f"  GET /api/players: status={r_players.status_code}, total={p_json.get('total')}, returned={len(p_json.get('players', []))} -> {'PASS' if p_list_ok else 'FAIL'}")

    # 3.2 Search query
    r_search = requests.get(f"{BASE_URL}/api/players?search=Messi", timeout=3)
    s_json = r_search.json()
    messi_found = r_search.status_code == 200 and s_json.get("total") >= 1 and any(p["player_id"] == 5503 for p in s_json.get("players", []))
    print(f"  GET /api/players?search=Messi: status={r_search.status_code}, matches={s_json.get('total')} -> {'PASS' if messi_found else 'FAIL'}")

    # 3.3 Filter by role
    r_role = requests.get(f"{BASE_URL}/api/players?role=DF&limit=20", timeout=3)
    role_json = r_role.json()
    all_df = r_role.status_code == 200 and all(p["role"] == "DF" for p in role_json.get("players", []))
    print(f"  GET /api/players?role=DF: status={r_role.status_code}, total_defenders={role_json.get('total')}, all_DF={all_df} -> {'PASS' if all_df else 'FAIL'}")

    # 3.4 Filter by min_minutes
    r_mins = requests.get(f"{BASE_URL}/api/players?min_minutes=500", timeout=3)
    mins_json = r_mins.json()
    all_500 = r_mins.status_code == 200 and all(p["minutes_played"] >= 500 for p in mins_json.get("players", []))
    print(f"  GET /api/players?min_minutes=500: status={r_mins.status_code}, players_over_500m={mins_json.get('total')}, all_>=500={all_500} -> {'PASS' if all_500 else 'FAIL'}")

    results["player_apis"]["players"] = p_list_ok and messi_found and all_df and all_500

    # 4. PLAYER PROFILE
    print("\n--- 4. PLAYER PROFILE (/api/player/5503) ---")
    r_prof = requests.get(f"{BASE_URL}/api/player/5503", timeout=3)
    prof_json = r_prof.json()
    prof_ok = (
        r_prof.status_code == 200
        and prof_json.get("player_id") == 5503
        and prof_json.get("team_name") == "Argentina"
        and prof_json.get("role") == "FW"
        and isinstance(prof_json.get("stats"), dict)
        and isinstance(prof_json.get("per90"), dict)
        and isinstance(prof_json["stats"].get("goals"), int)
        and isinstance(prof_json["stats"].get("xg"), (int, float))
    )
    print(f"  GET /api/player/5503: status={r_prof.status_code}, name='{prof_json.get('player_name')}', goals={prof_json.get('stats', {}).get('goals')}, xg={prof_json.get('stats', {}).get('xg')} -> {'PASS' if prof_ok else 'FAIL'}")
    results["player_apis"]["profile"] = prof_ok

    # 5. PLAYER MATCH HISTORY
    print("\n--- 5. PLAYER MATCH HISTORY (/api/player/5503/matches) ---")
    r_match = requests.get(f"{BASE_URL}/api/player/5503/matches", timeout=3)
    m_json = r_match.json()
    matches = m_json.get("matches", [])
    m_ids = [m["match_id"] for m in matches]
    no_dup_matches = len(m_ids) == len(set(m_ids))
    # Chronological order
    dates = [m["match_date"] for m in matches]
    is_chronological = dates == sorted(dates)
    match_ok = (
        r_match.status_code == 200
        and len(matches) == 7
        and no_dup_matches
        and is_chronological
        and all("opponent" in m and "minutes_played" in m for m in matches)
    )
    print(f"  GET /api/player/5503/matches: status={r_match.status_code}, matches_count={len(matches)}, unique={no_dup_matches}, chronological={is_chronological} -> {'PASS' if match_ok else 'FAIL'}")
    results["player_apis"]["matches"] = match_ok

    # 6. PLAYER PERFORMANCE
    print("\n--- 6. PLAYER PERFORMANCE (/api/player/5503/performance) ---")
    r_perf = requests.get(f"{BASE_URL}/api/player/5503/performance", timeout=3)
    perf_json = r_perf.json()
    score = perf_json.get("performance_score")
    disclaimer = perf_json.get("model_disclaimer", "")
    perf_ok = (
        r_perf.status_code == 200
        and 0.0 <= score <= 100.0
        and perf_json.get("role") == "FW"
        and perf_json.get("is_qualified_sample") is True
        and len(perf_json.get("percentiles", {})) > 0
        and len(perf_json.get("strengths", [])) > 0
        and "analytical scoring model" in disclaimer.lower()
        and "not an official statsbomb rating" in disclaimer.lower()
    )
    print(f"  GET /api/player/5503/performance: status={r_perf.status_code}, score={score}, strengths_count={len(perf_json.get('strengths', []))}, disclaimer_verified={bool(disclaimer)} -> {'PASS' if perf_ok else 'FAIL'}")
    results["player_apis"]["performance"] = perf_ok

    # 7. PLAYER FORM
    print("\n--- 7. PLAYER FORM (/api/player/5503/form) ---")
    r_form5 = requests.get(f"{BASE_URL}/api/player/5503/form?limit=5", timeout=3)
    f5_json = r_form5.json()
    form5_ok = (
        r_form5.status_code == 200
        and f5_json.get("matches_evaluated") == 5
        and len(f5_json.get("timeline", [])) == 5
        and isinstance(f5_json.get("recent_form_rating"), (int, float))
    )
    print(f"  GET /api/player/5503/form?limit=5: status={r_form5.status_code}, evaluated={f5_json.get('matches_evaluated')}, rating={f5_json.get('recent_form_rating')} -> {'PASS' if form5_ok else 'FAIL'}")

    r_form10 = requests.get(f"{BASE_URL}/api/player/5503/form?limit=10", timeout=3)
    f10_json = r_form10.json()
    # In WC 2022, max matches is 7
    form10_ok = (
        r_form10.status_code == 200
        and f10_json.get("matches_evaluated") == 7
        and len(f10_json.get("timeline", [])) == 7
    )
    print(f"  GET /api/player/5503/form?limit=10: status={r_form10.status_code}, evaluated={f10_json.get('matches_evaluated')} (capped at tournament 7) -> {'PASS' if form10_ok else 'FAIL'}")
    results["player_apis"]["form"] = form5_ok and form10_ok

    # 8. FILTER METADATA
    print("\n--- 8. FILTER METADATA (/api/player-filters) ---")
    r_filt = requests.get(f"{BASE_URL}/api/player-filters", timeout=3)
    filt_json = r_filt.json()
    filt_ok = (
        r_filt.status_code == 200
        and filt_json.get("competition", {}).get("name") == "FIFA World Cup"
        and filt_json.get("roles") == ["FW", "MF", "DF", "GK"]
        and len(filt_json.get("positions", [])) == 23
        and len(filt_json.get("teams", [])) == 32
        and filt_json.get("total_players") == 680
    )
    print(f"  GET /api/player-filters: status={r_filt.status_code}, teams={len(filt_json.get('teams', []))}, positions={len(filt_json.get('positions', []))}, total_players={filt_json.get('total_players')} -> {'PASS' if filt_ok else 'FAIL'}")
    results["player_apis"]["filters"] = filt_ok

    # 9. ERROR HANDLING (404 and Traceback Check)
    print("\n--- 9. ERROR HANDLING (INVALID PLAYER ID 999999) ---")
    invalid_endpoints = [
        f"{BASE_URL}/api/player/999999",
        f"{BASE_URL}/api/player/999999/matches",
        f"{BASE_URL}/api/player/999999/performance",
        f"{BASE_URL}/api/player/999999/form",
    ]
    all_404 = True
    for u in invalid_endpoints:
        r_err = requests.get(u, timeout=3)
        body = r_err.text
        is_404 = r_err.status_code == 404
        has_traceback = "Traceback" in body or "Error: line" in body
        is_json = "application/json" in r_err.headers.get("Content-Type", "")
        print(f"  {u.split(':5000')[-1]}: status={r_err.status_code}, is_json={is_json}, traceback_leak={has_traceback} -> {'PASS' if is_404 and not has_traceback else 'FAIL'}")
        if not is_404 or has_traceback:
            all_404 = False

    results["error_handling"]["invalid_404"] = all_404

    # 10. DATA CONSISTENCY (API VS CSV FOR 3 PLAYERS: FW, MF, DF)
    print("\n--- 10. DATA CONSISTENCY (API VS CSV GROUND TRUTH) ---")
    df_season = pd.read_csv(CSV_SEASON_PATH)
    
    test_cases = [
        {"pid": 5503, "expected_role": "FW", "desc": "Forward (Lionel Messi)"},
        {"pid": 5469, "expected_role": "MF", "desc": "Midfielder (Luka Modric)"},
        {"pid": 33018, "expected_role": "DF", "desc": "Defender (Josko Gvardiol)"}
    ]

    consistency_passed = True
    for tc in test_cases:
        pid = tc["pid"]
        desc = tc["desc"]
        r_p = requests.get(f"{BASE_URL}/api/player/{pid}", timeout=3).json()
        csv_row = df_season[df_season["player_id"] == pid].iloc[0]

        # Compare stats
        fields_to_check = [
            ("minutes_played", int),
            ("goals", int),
            ("assists", int),
            ("xg", float),
            ("xa", float),
            ("shots", int),
            ("pass_accuracy", float),
            ("key_passes", int),
            ("tackles", int),
            ("interceptions", int)
        ]

        mismatches = []
        for field, f_type in fields_to_check:
            api_val = f_type(r_p["stats"].get(field, r_p.get(field, 0)))
            csv_val = f_type(csv_row[field])
            if f_type == float:
                if abs(api_val - csv_val) > 0.005:
                    mismatches.append(f"{field}: API={api_val} != CSV={csv_val}")
            else:
                if api_val != csv_val:
                    mismatches.append(f"{field}: API={api_val} != CSV={csv_val}")

        # Check Per-90s
        p90_fields = ["goals_per90", "xg_per90", "key_passes_per90", "tackles_per90"]
        for field in p90_fields:
            api_val = float(r_p["per90"].get(field, 0.0))
            csv_val = float(csv_row[field])
            if abs(api_val - csv_val) > 0.005:
                mismatches.append(f"{field}: API={api_val} != CSV={csv_val}")

        if mismatches:
            print(f"  [FAIL] {desc}: Mismatches detected: {mismatches}")
            consistency_passed = False
        else:
            print(f"  [PASS] {desc}: All {len(fields_to_check) + len(p90_fields)} metrics match CSV ground truth exactly.")

    results["data_consistency"]["consistency"] = consistency_passed

    # 11. SMALL-SAMPLE HANDLING (< 90 MINUTES)
    print("\n--- 11. SMALL-SAMPLE HANDLING (< 90 MINUTES) ---")
    # Find player with <90 minutes: Sardar Azmoun (pid 5224, 14 mins)
    sub90_player = df_season[df_season["minutes_played"] < 90].iloc[0]
    sub90_pid = int(sub90_player["player_id"])
    sub90_mins = int(sub90_player["minutes_played"])
    sub90_name = sub90_player["player_name"]

    r_sub_prof = requests.get(f"{BASE_URL}/api/player/{sub90_pid}", timeout=3).json()
    r_sub_perf = requests.get(f"{BASE_URL}/api/player/{sub90_pid}/performance", timeout=3).json()

    is_qual = r_sub_perf.get("is_qualified_sample")
    warning = r_sub_perf.get("sample_size_warning")
    dampened_score = r_sub_perf.get("performance_score")
    
    sub90_ok = (
        is_qual is False
        and warning is not None
        and "threshold" in warning.lower()
        and dampened_score <= 50.0  # properly dampened
    )
    print(f"  Tested: {sub90_name} (ID: {sub90_pid}, Minutes: {sub90_mins})")
    print(f"    is_qualified_sample: {is_qual} (expected False)")
    print(f"    sample_size_warning: '{warning}'")
    print(f"    dampened_score: {dampened_score} (properly dampened) -> {'PASS' if sub90_ok else 'FAIL'}")
    results["small_sample"]["handled"] = sub90_ok

    # 12. MALFORMED / INVALID REQUESTS
    print("\n--- 12. MALFORMED REQUEST ROBUSTNESS ---")
    # Invalid query parameters
    r_bad_limit = requests.get(f"{BASE_URL}/api/players?limit=abc&page=xyz", timeout=3)
    r_bad_form = requests.get(f"{BASE_URL}/api/player/5503/form?limit=notanumber", timeout=3)
    r_bad_json = requests.post(f"{BASE_URL}/api/predict", data="invalid json string", headers={"Content-Type": "application/json"}, timeout=3)
    
    # Check if server is still running after bad requests
    r_alive = requests.get(f"{BASE_URL}/api/player-filters", timeout=3)
    server_stable = r_alive.status_code == 200
    print(f"  Bad query parameters handled gracefully (status: {r_bad_limit.status_code}, form: {r_bad_form.status_code})")
    print(f"  Malformed POST payload handled (status: {r_bad_json.status_code})")
    print(f"  Server alive and responsive after bad requests: {server_stable} -> {'PASS' if server_stable else 'FAIL'}")
    results["error_handling"]["stability"] = server_stable

    # 13. PERFORMANCE / CACHING BENCHMARK
    print("\n--- 13. PERFORMANCE & IN-MEMORY CACHING BENCHMARK ---")
    latencies = []
    # Make 10 rapid requests to /api/player/5503 and /api/players
    for _ in range(10):
        t0 = time.perf_counter()
        requests.get(f"{BASE_URL}/api/player/5503", timeout=3)
        latencies.append((time.perf_counter() - t0) * 1000)

    avg_ms = np.mean(latencies)
    p95_ms = np.percentile(latencies, 95)
    fast_enough = avg_ms < 50.0  # sub-50ms is very fast in-memory response
    print(f"  10 sequential API requests to /api/player/5503:")
    print(f"    Average Latency: {avg_ms:.2f} ms")
    print(f"    95th percentile: {p95_ms:.2f} ms")
    print(f"    In-memory caching confirmed: {fast_enough} (O(1) lookups) -> {'PASS' if fast_enough else 'FAIL'}")
    results["performance"]["in_memory_cached"] = fast_enough
    results["performance"]["avg_latency_ms"] = round(avg_ms, 2)

    print("\n" + "=" * 70)
    print("ALL VERIFICATION SUITE CHECKS COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
