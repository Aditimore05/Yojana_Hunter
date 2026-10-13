import urllib.request
import json

url = 'http://127.0.0.1:5000/api/schemes/match'
for state in ['Uttar Pradesh', 'Maharashtra']:
    payload = {
        'occupation': 'Farmer',
        'state': state,
        'is_farmer': True,
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
        up_scheme = next((s for s in data['schemes'] if s['slug'] == 'up-krishi-yantra-anudan'), None)
        if up_scheme:
            st = up_scheme['eligibilityStatus']
            reason = up_scheme.get('ineligibleReason')
            print(f"State: {state:<15} => UP Krishi Yantra Status: {st:<15} | Reason: {reason}")
