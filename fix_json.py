import json

path = 'ramat-david-shuttle/db_data_new.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix 1: Typos in old_routes stops
for route in data.get('old_routes', []):
    for entry in route.get('schedule', []):
        if 'stops' in entry:
            entry['stops'] = [s.replace('צומת הנת דוד', 'צומת רמת דוד') for s in entry['stops']]

# Fix 2: Sync Tzomet times in bus_routes[3]
if len(data.get('bus_routes', [])) > 3:
    data['bus_routes'][3]['departure_times_str'] = "07:10-07:40-08:10-08:40-09:10-09:40-10:00-10:30-11:00-12:10-12:30-13:10-14:10-14:40-15:10-15:40-16:10-16:40"

# Fix 3: Remove 17:15 from Base -> Train (bus_routes[0])
if len(data.get('bus_routes', [])) > 0:
    route = data['bus_routes'][0]
    route['departure_times'] = [t for t in route.get('departure_times', []) if t.get('time') != "17:15"]

# Fix 4: Duplicate words in note
if len(data.get('bus_routes', [])) > 2:
    data['bus_routes'][2]['note'] = data['bus_routes'][2]['note'].replace(
        'איסוף ממקומות העבודה בשעה בסוף יום בשעה 17:15',
        'איסוף ממקומות העבודה בסוף יום בשעה 17:15'
    )

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)

print("Fixes applied to db_data_new.json")
