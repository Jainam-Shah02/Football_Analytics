"""
test_player_api.py
==================
Comprehensive integration and unit test suite for the Flask API endpoints,
covering both legacy endpoints and newly added Player Analytics endpoints.
"""

import sys
import json
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from server.app import app

def run_tests():
    print("=" * 60)
    print("FLASK API TEST SUITE: LEGACY & PLAYER ANALYTICS")
    print("=" * 60)
    
    client = app.test_client()
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name} {details}")
        else:
            print(f"  [FAIL] {name} {details}")
            raise AssertionError(f"Test failed: {name} {details}")

    # --- 1. LEGACY ENDPOINTS INTEGRITY ---
    print("\n--- 1. Testing Legacy Endpoints ---")
    
    # 1.1 /api/teams
    r = client.get("/api/teams")
    assert_test("GET /api/teams status 200", r.status_code == 200)
    teams_data = r.get_json()
    assert_test("GET /api/teams contains 'teams'", "teams" in teams_data)
    assert_test("GET /api/teams returns 48 teams", len(teams_data["teams"]) == 48, f"(found {len(teams_data['teams'])})")
    
    # 1.2 /api/probabilities
    r = client.get("/api/probabilities")
    assert_test("GET /api/probabilities status 200", r.status_code == 200)
    probs_data = r.get_json()
    assert_test("GET /api/probabilities is list", isinstance(probs_data, list))
    assert_test("GET /api/probabilities non-empty", len(probs_data) > 0)
    
    # 1.3 /api/predict
    r = client.post("/api/predict", json={"home_team": "Argentina", "away_team": "France"})
    assert_test("POST /api/predict status 200", r.status_code == 200)
    pred_data = r.get_json()
    assert_test("POST /api/predict contains xG & probabilities", "home_xg" in pred_data and "home_win_prob" in pred_data)
    
    # --- 2. PLAYER ANALYTICS: /api/players ---
    print("\n--- 2. Testing GET /api/players ---")
    
    # 2.1 Default list
    r = client.get("/api/players")
    assert_test("GET /api/players status 200", r.status_code == 200)
    p_data = r.get_json()
    assert_test("GET /api/players has 'total'", p_data.get("total") == 680)
    assert_test("GET /api/players default limit 50", len(p_data.get("players", [])) == 50)
    
    # 2.2 Search by name query
    r = client.get("/api/players?search=Messi")
    assert_test("GET /api/players?search=Messi status 200", r.status_code == 200)
    messi_res = r.get_json()
    assert_test("Found Messi", messi_res.get("total") >= 1)
    top_p = messi_res["players"][0]
    assert_test("Player name contains Messi", "Messi" in top_p["player_name"])
    assert_test("Messi player_id is 5503", top_p["player_id"] == 5503)
    
    # 2.3 Filter by role & min_minutes
    r = client.get("/api/players?role=FW&min_minutes=90")
    assert_test("GET /api/players?role=FW&min_minutes=90 status 200", r.status_code == 200)
    fw_res = r.get_json()
    all_fw = all(p["role"] == "FW" and p["minutes_played"] >= 90 for p in fw_res["players"])
    assert_test("All returned players are qualified FWs", all_fw)

    # --- 3. PLAYER PROFILE: /api/player/<id> ---
    print("\n--- 3. Testing GET /api/player/<id> ---")
    
    # 3.1 Valid player
    r = client.get("/api/player/5503")
    assert_test("GET /api/player/5503 status 200", r.status_code == 200)
    prof = r.get_json()
    assert_test("Profile player_id matches", prof.get("player_id") == 5503)
    assert_test("Profile contains stats", "stats" in prof and prof["stats"]["goals"] == 7)
    assert_test("Profile contains per90 rates", "per90" in prof and "goals_per90" in prof["per90"])
    
    # 3.2 Invalid player
    r = client.get("/api/player/99999999")
    assert_test("GET /api/player/99999999 returns 404", r.status_code == 404)
    assert_test("404 returns error message", "error" in r.get_json())

    # --- 4. PLAYER MATCHES: /api/player/<id>/matches ---
    print("\n--- 4. Testing GET /api/player/<id>/matches ---")
    
    # 4.1 Valid matches
    r = client.get("/api/player/5503/matches")
    assert_test("GET /api/player/5503/matches status 200", r.status_code == 200)
    m_res = r.get_json()
    assert_test("Player matches total is 7", m_res.get("total_matches") == 7)
    m0 = m_res["matches"][0]
    assert_test("Match log contains opponent & date", "opponent" in m0 and "match_date" in m0)
    
    # 4.2 Invalid matches
    r = client.get("/api/player/99999999/matches")
    assert_test("GET /api/player/99999999/matches returns 404", r.status_code == 404)

    # --- 5. PLAYER PERFORMANCE: /api/player/<id>/performance ---
    print("\n--- 5. Testing GET /api/player/<id>/performance ---")
    
    # 5.1 Valid performance
    r = client.get("/api/player/5503/performance")
    assert_test("GET /api/player/5503/performance status 200", r.status_code == 200)
    perf_res = r.get_json()
    assert_test("Contains performance_score", "performance_score" in perf_res and perf_res["performance_score"] == 91.4)
    assert_test("Contains percentiles dict", "percentiles" in perf_res and len(perf_res["percentiles"]) > 0)
    assert_test("Identified strengths", len(perf_res.get("strengths", [])) > 0)
    assert_test("Sample size qualified", perf_res.get("is_qualified_sample") is True)
    
    # 5.2 Invalid performance
    r = client.get("/api/player/99999999/performance")
    assert_test("GET /api/player/99999999/performance returns 404", r.status_code == 404)

    # --- 6. PLAYER FORM: /api/player/<id>/form ---
    print("\n--- 6. Testing GET /api/player/<id>/form ---")
    
    # 6.1 Valid form
    r = client.get("/api/player/5503/form?limit=5")
    assert_test("GET /api/player/5503/form status 200", r.status_code == 200)
    form_res = r.get_json()
    assert_test("Form contains 5 matches evaluated", form_res.get("matches_evaluated") == 5)
    assert_test("Form contains recent_form_rating", "recent_form_rating" in form_res)
    assert_test("Form contains timeline array", len(form_res.get("timeline", [])) == 5)
    
    # 6.2 Invalid form
    r = client.get("/api/player/99999999/form")
    assert_test("GET /api/player/99999999/form returns 404", r.status_code == 404)

    # --- 7. PLAYER FILTERS: /api/player-filters ---
    print("\n--- 7. Testing GET /api/player-filters ---")
    
    r = client.get("/api/player-filters")
    assert_test("GET /api/player-filters status 200", r.status_code == 200)
    filt_res = r.get_json()
    assert_test("Contains competition metadata", filt_res.get("competition", {}).get("name") == "FIFA World Cup")
    assert_test("Contains 4 roles", filt_res.get("roles") == ["FW", "MF", "DF", "GK"])
    assert_test("Contains 32 teams", len(filt_res.get("teams", [])) == 32)
    assert_test("Total players count is 680", filt_res.get("total_players") == 680)

    print("\n" + "=" * 60)
    print(f"API TEST SUITE COMPLETE: {passed}/{total} TESTS PASSED (100% SUCCESS)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
