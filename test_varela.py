import os
import requests
from dotenv import load_dotenv

# Load env variables from Next.js local config
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') + '/rest/v1/profiles?select=*'
headers = {
    'apikey': os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    'Authorization': 'Bearer ' + os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

profiles_response = requests.get(url, headers=headers).json()
if isinstance(profiles_response, list):
    varela = next((p for p in profiles_response if p.get('last_name') and 'varela' in p['last_name'].lower()), None)
else:
    print('Raw Error Response:', profiles_response)
    varela = None
print(varela)

if varela and 'id' in varela:
    print(f"Found Varela. ID: {varela['id']}")
    
    stat_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') + f"/rest/v1/performance_stats?select=total_distance,minutes&player_id=eq.{varela['id']}"
    stats = requests.get(stat_url, headers=headers).json()
    
    print(f"Varela Match Rows Found: {len(stats)}")
    for s in stats:
        print(f"   - Distance: {s['total_distance']}m, Minutes: {s['minutes']}")
        
    per_90s = [s['total_distance'] * (90/s['minutes']) for s in stats if s['minutes'] > 0]
    print(f"\nCalculated Per-90 Array: {[round(p, 1) for p in per_90s]}")
    if per_90s:
        print(f"Max Per-90 Historical Target: {round(max(per_90s), 1)}")
        
    total_dist = sum(s['total_distance'] for s in stats)
    avg_dist = total_dist / len(stats) if stats else 0
    print(f"Rolling Average + 5% Target: {round(avg_dist * 1.05, 1)}")
else:
    print("Could not find Varela in profiles array")
