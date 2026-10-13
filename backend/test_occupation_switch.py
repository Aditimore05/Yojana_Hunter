import urllib.request
import json

url = 'http://127.0.0.1:5000/api/schemes/match'

farmer_schemes = ['pm-kisan', 'pmfby', 'pm-kmy', 'kisan-credit-card', 'soil-health-card']

for occ in ['Farmer', 'Student']:
    payload = {
        'occupation': occ,
        'state': 'Uttar Pradesh',
        'is_farmer': (occ == 'Farmer'),
        'is_student': (occ == 'Student'),
        'age': 24,
        'annualIncome': 180000,
        'education': '10th Pass',
        'category': 'OBC'
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"\n=== OCCUPATION: {occ} ===")
        for slug in farmer_schemes:
            scheme = next((s for s in data['schemes'] if s['slug'] == slug), None)
            if scheme:
                st = scheme['eligibilityStatus']
                reason = scheme.get('ineligibleReason') or scheme.get('whyMatched', '')[:60]
                print(f"  {scheme['name'][:35]:<35} | Status: {st:<12} | Note: {reason}")
