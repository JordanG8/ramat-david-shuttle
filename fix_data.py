import re

path = 'ramat-david-shuttle/src/data/fallbackData.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Typo in SEQ_K2_1650 (if it exists, let's check other typos)
content = content.replace('צומת הנת דוד', 'צומת רמת דוד')

# Fix 2: Duplicate words in internal.note
content = content.replace(
    'איסוף ממקומות העבודה בשעה בסוף יום בשעה 17:15',
    'איסוף ממקומות העבודה בסוף יום בשעה 17:15'
)

# Fix 3: Sync Tzomet times in DATA.bus_routes[3] to match Line 3/4
# Tab: 08:00-8:30-09:00-09:30-10:00-10:30-11:00-12:10-12:40-13:10-14:10-14:40-15:10-15:40-16:10-16:40
# Line 3: 07:10, 07:40, 08:10, 08:40, 09:10, 09:40
# Line 4: 10:00, 10:30, 11:00, 12:10, 12:30, 13:10
# Corrected Tzomet times:
corrected_tzomet = "07:10-07:40-08:10-08:40-09:10-09:40-10:00-10:30-11:00-12:10-12:30-13:10-14:10-14:40-15:10-15:40-16:10-16:40"
content = re.sub(r'departure_times_str:\s*"08:00-8:30-09:00-09:30-10:00-10:30-11:00-12:10-12:40-13:10-14:10-14:40-15:10-15:40-16:10-16:40"', 
                 f'departure_times_str: "{corrected_tzomet}"', content)

# Fix 4: Remove 17:15 from Base -> Train (DATA.bus_routes[0]) as it's not a train trip in Line 2
# We need to find the departure_times array for the first route.
# It's a bit tricky with regex, but I'll try to target it specifically.
pattern = r'name: "רחבת היסעים - רכבת כפר יהושע",[\s\S]+?departure_times: \[\s*([\s\S]+?)\s*\],'
def remove_1715(match):
    times_block = match.group(1)
    # Remove the last entry if it's 17:15
    new_times_block = re.sub(r',\s*{\s*time:\s*"17:15"\s*}', '', times_block)
    return match.group(0).replace(times_block, new_times_block)

content = re.sub(pattern, remove_1715, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixes applied to fallbackData.js")
