import requests
import json
import sys

VITE_BASE = "http://localhost:5173"
FLASK_BASE = "http://127.0.0.1:5000"

def test_endpoints():
    print("=" * 60)
    print("PHASE 3 FRONTEND & API INTEGRATION VALIDATION")
    print("=" * 60)

    # 1. Test Vite routes
    routes = [
        "/",
        "/predictor",
        "/simulator",
        "/analytics",
        "/player-analytics",
        "/player-performance"
    ]
    print("\n--- 1. Testing Vite Route Serving ---")
    for r in routes:
        url = f"{VITE_BASE}{r}"
        res = requests.get(url, timeout=5)
        status = res.status_code
        is_html = "<!DOCTYPE html>" in res.text or "<div id=\"root\">" in res.text
        print(f"  {r:25} -> status: {status}, HTML served: {is_html}")
        assert status == 200, f"Route {r} failed with status {status}"

    # 2. Test Player Endpoints
    print("\n--- 2. Testing Specific Target Players ---")
    players = [
        {"id": 5503, "name": "Lionel Messi", "role": "FW", "expected_qual": True},
        {"id": 5469, "name": "Luka Modric", "role": "MF", "expected_qual": True},
        {"id": 33018, "name": "Josko Gvardiol", "role": "DF", "expected_qual": True},
        {"id": 5743, "name": "Paulo Dybala", "role": "FW", "expected_qual": False}
    ]

    for p in players:
        pid = p["id"]
        # Profile
        r_prof = requests.get(f"{FLASK_BASE}/api/player/{pid}").json()
        # Matches
        r_mat = requests.get(f"{FLASK_BASE}/api/player/{pid}/matches").json()
        # Performance
        r_perf = requests.get(f"{FLASK_BASE}/api/player/{pid}/performance").json()
        # Form 5
        r_f5 = requests.get(f"{FLASK_BASE}/api/player/{pid}/form?limit=5").json()
        # Form 10
        r_f10 = requests.get(f"{FLASK_BASE}/api/player/{pid}/form?limit=10").json()

        print(f"\nPlayer: {p['name']} (ID {pid})")
        print(f"  Team: {r_prof.get('team_name')}, Role: {r_prof.get('role')}")
        print(f"  Minutes: {r_prof.get('minutes_played')}, Matches: {r_mat.get('total_matches')}")
        print(f"  Qualified Sample: {r_perf.get('is_qualified_sample')} (expected: {p['expected_qual']})")
        print(f"  Performance Score: {r_perf.get('performance_score')}")
        print(f"  Form Rating (Last 5): {r_f5.get('recent_form_rating')} ({r_f5.get('matches_evaluated')} matches)")
        print(f"  Form Rating (Last 10): {r_f10.get('recent_form_rating')} ({r_f10.get('matches_evaluated')} matches)")
        
        if not p['expected_qual']:
            print(f"  Sample Size Warning: {r_perf.get('sample_size_warning')}")
            assert r_perf.get('is_qualified_sample') is False, "Expected unqualified sample"
            assert r_perf.get('sample_size_warning') is not None, "Expected warning"

    print("\n--- 3. Testing Player Search & Filtering ---")
    r_search = requests.get(f"{FLASK_BASE}/api/players?search=Gvardiol").json()
    assert len(r_search.get("players", [])) >= 1
    found_gvardiol = r_search["players"][0]
    print(f"  Found via search: {found_gvardiol['player_name']} ({found_gvardiol['team_name']})")

    r_filters = requests.get(f"{FLASK_BASE}/api/player-filters").json()
    print(f"  Filter competition: {r_filters.get('competition', {}).get('name')}")
    print(f"  Filter teams count: {len(r_filters.get('teams', []))}")
    print(f"  Filter roles: {r_filters.get('roles')}")

    print("\n============================================================")
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("============================================================")

if __name__ == "__main__":
    test_endpoints()
