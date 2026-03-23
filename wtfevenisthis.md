# wtf even is this

A shuttle/bus schedule app for an IAF base (Ramat David / כנף 1). Hebrew RTL, mobile-first.

---

## Two separate data sources — don't confuse them

### `DATA.bus_routes` (from DB → `app_data` JSON key)
The main shuttle routes shown in the app tabs:
- `[0]` → רחבת היסעים → רכבת כפר יהושע (train tab, to train)
- `[1]` → רכבת כפר יהושע → רחבת היסעים (train tab, from train)
- `[2]` → פיזור נוסף (internal tab) — has `.sub_routes[]`:
  - "מסלול ב׳" = 105-area, "מסלול א׳" = 109-area
- `[3]` → צומת רמת דוד → רחבת היסעים (tzomet tab)

### `OLD_ROUTES` (from DB → same `app_data`, `old_routes` key)
The full Egged/bus **line schedules** with all stops. These are קו 1–4:
- **קו 1**: serves train station, 105-area, 109-area, חד"א
- **קו 2**: serves train station, 105-area, 109-area, חד"א, צומת רמת דוד
- **קו 3**: serves צומת רמת דוד, 109-area (no train, no 105)
- **קו 4**: serves train station, 105-area, 109-area (no חד"א, no tzomet)

---

## How the חד"א (hada) tab works

`getHadaTrips()` loops through OLD_ROUTES and pulls out individual trips that start or end at "חד"א". Each trip is classified by `classifyHadaArea()`:
- stops include "גף מנועים" → `maintenance` group
- stops include "גף טיסה 109" or "גף טכני 109" → `109` group = **מסלול א׳**
- else → `105` group = **מסלול ב׳**

As of the current data:
- **מסלול א׳** trips all come from קו 1
- **מסלול ב׳** trips all come from קו 2

This is **dynamically derived** at render time from `OLD_ROUTES` — not hardcoded.

---

## Route source labels (the light-blue "מסלול לקוח מתוך קו X" subtitle)

Every route card header shows which OLD_ROUTES bus lines feed that destination.
Computed by `getRouteLinesByStop(keyword)` — scans all OLD_ROUTES for routes that have a stop containing `keyword`.

| View | Stop keyword | OLD_ROUTES lines |
|------|-------------|-----------------|
| Train (both directions) | `רכבת כפר יהושע` | קו 1, 2, 4 |
| Tzomet | `צומת רמת דוד` | קו 2, 3 |
| Internal מסלול א׳ | `גף טיסה 109` | קו 1, 2, 3, 4 |
| Internal מסלול ב׳ | `גף טיסה 105` | קו 1, 2, 4 |
| Hada מסלול א׳ | (from trips) | קו 1 |
| Hada מסלול ב׳ | (from trips) | קו 2 |

Clicking a קו link in the badge calls `navigateTo('info', { activeKav: 'kav2' })` which opens the info tab with that line's full schedule active.

---

## Database

Single Neon Postgres DB. Table: `app_settings`. One row:
- `key = 'app_data'` → giant JSON blob with `units`, `bus_routes`, `old_routes`, `legend`

Credentials are in `.env.local` (never committed). To query directly:
```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.POSTGRES_URL);
const rows = await sql`SELECT value FROM app_settings WHERE key = 'app_data'`;
const data = JSON.parse(rows[0].value);
```

There's also `update_db.js` — runs from a `payload.json` file to push data directly.

---

## App architecture (v1, the one at repo root)

Vanilla JS SPA. Entry: `index.html` → `app.js`. Build tool: Vite.
- `app.js` — all rendering + logic
- `src/data/fallbackData.js` — used if DB fetch fails (keep in sync with DB!)
- `src/styles/styles.css` — all styles
- `api/data.js` — Vercel serverless: GET reads DB, POST writes (JWT auth)
- `admin.html` / `admin.js` — admin panel (same DB)

There's also a **Next.js v2** in `next-app/` subdirectory — ignore if you're touching the v1 files at root.

---

## Hebrew name conventions

- Train station = **כפר יהושע** / **כפ״י** (NOT "רכבת נהריה" or whatever)
- Base entrance = **רחבת היסעים** (NOT "בסיס", NOT "רחבת הסיעים" — the ס comes before the י)
- Cafeteria = **חדר אוכל** (not חד"א in display text)
- Route names: **מסלול א׳** (109-area), **מסלול ב׳** (105-area)
