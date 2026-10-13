import urllib.request
import urllib.parse
import json

base_url = 'http://127.0.0.1:5000/api/schemes/recommendations'

test_cases = [
    ("Farmer in Uttar Pradesh (Demo profile)", {"occupation": "Farmer", "state": "Uttar Pradesh"}),
    ("Farmer in Maharashtra", {"occupation": "Farmer", "state": "Maharashtra"}),
    ("Student in Uttar Pradesh", {"occupation": "Student", "state": "Uttar Pradesh"}),
]

for title, params in test_cases:
    query = urllib.parse.urlencode(params)
    url = f"{base_url}?{query}&limit=10"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"\n========================================================")
        print(f"CASE: {title}")
        print(f"Total evaluated: {data.get('total_evaluated')}, Recs: {data.get('recommendations_count')}")
        print(f"--------------------------------------------------------")
        for i, s in enumerate(data.get('recommendations', [])):
            status = s.get('eligibilityStatus')
            score = s.get('matchScore')
            state = s.get('state')
            reason = s.get('whyMatched') or s.get('ineligibleReason') or ''
            print(f"{i+1}. [{status.upper()}] {s.get('name')} ({state}) - Score: {score}%")
            if s.get('ineligibleReason'):
                print(f"    Ineligible Reason: {s.get('ineligibleReason')}")
            else:
                print(f"    Why: {reason[:90]}...")

