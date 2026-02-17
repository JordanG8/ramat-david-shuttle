// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — APP
// ═══════════════════════════════════════════

const DATA = {
  "title": "מקרא תחנות הכנף",
  "legend": {
    "תחנת_שירות": "מחלקה שהיא עצמה תחנה (ירוק)",
    "תחנה_חלופית": "מחלקה שנוסעת לתחנה מסוימת (צהוב)"
  },
  "units": [
    {
      "name": "כללי",
      "departments": [
        { "name": "רחבת היסעים", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "טייסת 109",
      "departments": [
        { "name": "דת\"ק 13", "type": "תחנת שירות" },
        { "name": "דת\"ק 16", "type": "תחנת שירות" },
        { "name": "דת\"ק 12", "type": "תחנת שירות" },
        { "name": "דת\"ק 15", "type": "תחנה חלופית", "goes_to": "גף טיסה 109" },
        { "name": "דת\"ק 8", "type": "תחנת שירות" },
        { "name": "גף טיסה", "type": "תחנת שירות" },
        { "name": "גף טכני", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "טייסת 160",
      "station": "רחבת היסעים",
      "departments": [
        { "name": "גף טיסה", "type": "תחנת שירות" },
        { "name": "גף טכני", "type": "תחנת שירות" },
        { "name": "דת\"ק 2", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "טייסת 105",
      "departments": [
        { "name": "דת\"ק 14", "type": "תחנה חלופית", "goes_to": "דת\"ק 34" },
        { "name": "דת\"ק 9", "type": "תחנת שירות" },
        { "name": "דת\"ק 7", "type": "תחנת שירות" },
        { "name": "גף טיסה", "type": "תחנת שירות" },
        { "name": "גף טכני", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "טייסת 144",
      "departments": [
        { "name": "מפקדה", "type": "תחנה חלופית", "goes_to": "רחבת הסיעים" },
        { "name": "דת\"ק 32", "type": "תחנת שירות" },
        { "name": "בריטניה", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "טייסת 101",
      "station": "רחבת היסעים",
      "departments": [
        { "name": "דת\"ק 5", "type": "תחנת שירות" },
        { "name": "דת\"ק 4", "type": "תחנת שירות" },
        { "name": "דת\"ק 3", "type": "תחנת שירות" },
        { "name": "גף טיסה", "type": "תחנת שירות" },
        { "name": "גף טכני", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "טייסת תעופה",
      "station": "רחבת היסעים",
      "departments": [
        { "name": "דת\"ק 17", "type": "תחנת שירות" },
        { "name": "מפקדה", "type": "תחנת שירות" },
        { "name": "אבטחת מידע", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "אבטחה פיזית", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "כיבוי", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "רציפו\"ת תפקודית", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "מושל\"ם", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "בינוי 302",
      "station": "רחבת היסעים",
      "departments": [
        { "name": "מגדל", "type": "תחנת שירות" },
        { "name": "מפקדה", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "מערכות חשמל", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "משאבים/רכב", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "מערכות מיזוג", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "מש\"ק", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "הנדסה", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "מערכות דס\"ל/דלק 21", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "שירותי קרקע", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "לשכה",
      "departments": [
        { "name": "לשכת כנף 1", "type": "תחנת שירות" },
        { "name": "בטיחות", "type": "תחנת שירות" },
        { "name": "משרד סוציולוגית", "type": "תחנת שירות" }
      ]
    },
    {
      "name": "מנהלה",
      "station": "רחבת היסעים",
      "departments": [
        { "name": "כח אדם חובה/סגל", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "לוגיסטיקה", "type": "תחנת שירות" },
        { "name": "רבנות", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "רס\"ר", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "רפואה", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "פסיכולוגיה", "type": "תחנת שירות" },
        { "name": "שפ\"ו", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" },
        { "name": "תזונה", "type": "תחנה חלופית", "goes_to": "רחבת היסעים" }
      ]
    },
    {
      "name": "טייסת תחזוקה",
      "notes": "רכבות - איסוף מתחנת מערכות, חד\"א - מעבר בכלל התחנות",
      "departments": [
        { "name": "מרכז אחזקה", "type": "תחנת שירות" },
        { "name": "מנועים", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "מערכות", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "מוסכים א/ב", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "אוהד", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "גל\"א", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "אוויוניקה", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "מבנה", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "תקשוב", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "חילוץ", "type": "תחנה חלופית", "goes_to": "רכבות" },
        { "name": "נשמ\"ת", "type": "תחנת שירות" },
        { "name": "מרכז בידונים", "type": "תחנת שירות" }
      ]
    }
  ],
  "bus_routes": [
    {
      "name": "רחבת היסעים - כפר יהושע",
      "description": "תחנות עצירה רחבת היסעים - כפר יהושע",
      "stops": [
        "רחבת היסעים",
        "מערכות (איסוף מרכז של תחנות תחזוקה-מפורט במקרא)",
        "דת\"ק 16",
        "דת\"ק 13",
        "דת\"ק 12",
        "גף טכני 160",
        "דת\"ק 7",
        "דת\"ק 8",
        "דלק 21",
        "נשמ\"ת",
        "גף טכני 109",
        "גף טיסה 109"
      ],
      "departure_times": [
        { "time": "07:20" },
        { "time": "08:20" },
        { "time": "09:20", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "10:20", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "12:30", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "13:35", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "14:30" },
        { "time": "14:50", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "15:30" },
        { "time": "15:50", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "16:30" },
        { "time": "16:50", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "17:15" }
      ]
    },
    {
      "name": "רכבת כפר יהושע - רחבת היסעים",
      "description": "תחנות עצירה רכבת כפר יהושע - רחבת היסעים",
      "stops": [
        "רכבת כפר יהושע",
        "גף טכני 109",
        "גף טיסה 109",
        "נשמ\"ת",
        "דת\"ק 7",
        "דת\"ק 8",
        "דלק 21",
        "גף טכני 160",
        "דת\"ק 12",
        "דת\"ק 13",
        "דת\"ק 16",
        "שירותי קרקע",
        "גף אוהד",
        "גל\"א",
        "גף אוויוניקה",
        "גף מבנה",
        "מרכז אחזקה",
        "מוסכים א/ב",
        "מנועים",
        "חילוץ",
        "רחבת היסעים",
        "קולנוע",
        "דת\"ק 17",
        "דת\"ק 2",
        "גף טיסה 105",
        "גף טכני 105",
        "מתחם בידונים",
        "מגדל",
        "דת\"ק 34",
        "דת\"ק 32",
        "דת\"ק 9",
        "בריטניה",
        "רחבת היסעים"
      ],
      "departure_times": [
        { "time": "07:40" },
        { "time": "08:40" },
        { "time": "09:40", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "10:40", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "13:00", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "14:00", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "14:45" },
        { "time": "15:20", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "16:10" },
        { "time": "16:30", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "17:10" },
        { "time": "17:30", "note": "תגבור- רק בימי ראשון וחמישי" },
        { "time": "18:00" }
      ]
    },
    {
      "name": "פיזור נוסף למקומות העבודה",
      "description": "פיזור נוסף למקומות העבודה",
      "note": "איסוף ממקומות העבודה בשעה בסוף יום בשעה 17:15",
      "sub_routes": [
        {
          "name": "פיזור למקומות עבודה - מסלול 105",
          "departure_times_str": "7:20-7:40-08:30-09:30-10:00-10:15-14:10-14:40-15:10-16:10-16:50-17:15",
          "stops": [
            "קולנוע",
            "דת\"ק 17",
            "דת\"ק 2",
            "גף טיסה 105",
            "גף טכני 105",
            "מתחם בידונים",
            "מגדל",
            "דת\"ק 34",
            "דת\"ק 32",
            "דת\"ק 9",
            "בריטניה",
            "רחבת היסעים"
          ]
        },
        {
          "name": "פיזור למקומות עבודה - מסלול 109",
          "departure_times_str": "7:20-8:20-09:00-10:00-10:30-11:00-12:10-12:40-13:10-14:10-14:40-15:10-15:40-16:10-16:40",
          "stops": [
            "רחבת היסעים",
            "מערכות (איסוף מרכז של תחנות תחזוקה-מפורט במקרא)",
            "דת\"ק 16",
            "דת\"ק 13",
            "דת\"ק 12",
            "גף טכני 160",
            "דת\"ק 7",
            "דת\"ק 8",
            "דלק 21",
            "נשמ\"ת",
            "גף טכני 109",
            "גף טיסה 109",
            "רכבת היסעים"
          ]
        }
      ]
    },
    {
      "name": "שאטל צומת רמת דוד",
      "description": "שאטל צומת רמת דוד",
      "stops": [
        "צומת רמת דוד",
        "רחבת היסעים"
      ],
      "departure_times_str": "8:30-09:00-09:30-10:00-10:30-11:00-12:10-12:40-13:10-14:10-14:40-15:10-15:40-16:10-16:40",
      "evening": {
        "time": "18:00-22:00",
        "break": "הפסקה 20:40-21:00"
      }
    }
  ]
};

// ─── Helpers ───
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const chevronSVG = `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const smallChevronSVG = `<svg class="tl-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const arrowSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

// ─── Render Stations ───
function renderStations() {
  const container = document.getElementById('stations-list');
  container.innerHTML = DATA.units.map(unit => {
    const deptCount = unit.departments.length;
    const stationBadge = unit.station
      ? `<span class="unit-station-badge">${esc(unit.station)}</span>`
      : '';
    const noteHtml = unit.notes
      ? `<div class="unit-note"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${esc(unit.notes)}</div>`
      : '';

    const deptsHtml = unit.departments.map(dept => {
      const isService = dept.type === 'תחנת שירות';
      const dotClass = isService ? 'service' : 'alt';
      const goesTo = dept.goes_to
        ? `<span class="dept-goes-to">${arrowSVG} ${esc(dept.goes_to)}</span>`
        : '';
      return `
        <div class="dept-item">
          <div class="dept-info">
            <span class="dept-dot ${dotClass}"></span>
            <span class="dept-name">${esc(dept.name)}</span>
          </div>
          ${goesTo}
        </div>`;
    }).join('');

    return `
      <div class="unit-card">
        <div class="unit-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="unit-title">
            ${esc(unit.name)}
            <span class="unit-count">${deptCount}</span>
            ${stationBadge}
          </div>
          <div class="unit-meta">
            ${chevronSVG}
          </div>
        </div>
        <div class="unit-body">
          ${noteHtml}
          <div class="dept-list">
            ${deptsHtml}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── Tab Definitions ───
const ROUTE_TABS = [
  { id: "train", label: "רכבת כפר יהושוע" },
  { id: "tzomet", label: "צומת רמת דוד" },
  { id: "internal", label: "פנים כנף" }
];

let activeRoute = "train";

// ─── Render Routes ───
function renderRouteTabs() {
  const container = document.getElementById('route-tabs');
  container.innerHTML = ROUTE_TABS.map(tab =>
    `<button class="route-tab ${tab.id === activeRoute ? 'active' : ''}" data-route="${tab.id}">${esc(tab.label)}</button>`
  ).join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.route-tab');
    if (!btn) return;
    activeRoute = btn.dataset.route;
    container.querySelectorAll('.route-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderRouteContent();
  });
}

// ─── Icons ───
const clockSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const mapPinSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const moonSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const infoSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

function renderStopsCard(stops) {
  const stopsHtml = stops.map((stop, i) =>
    `<div class="stop-item"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`
  ).join('');
  return `
    <div class="card-block stops-block" onclick="this.classList.toggle('open')">
      <div class="card-block-header">
        <div class="card-block-title">${mapPinSVG} תחנות עצירה</div>
        <div class="card-block-meta">
          <span class="stop-count-badge">${stops.length} תחנות</span>
          ${smallChevronSVG}
        </div>
      </div>
      <div class="card-block-body">
        <div class="stops-list">
          ${stopsHtml}
        </div>
      </div>
    </div>`;
}

const reinforceSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`;

function renderDepartureGrid(items, extraClass) {
  return `<div class="departure-grid">
    ${items.map(d => `
      <div class="dep-chip ${extraClass || ''} ${d.note ? 'dep-chip--reinforce' : ''}">
        <span class="dep-chip-time">${esc(d.time)}</span>
        ${d.note ? `<span class="dep-chip-note">${esc(d.note)}</span>` : ''}
      </div>
    `).join('')}
  </div>`;
}

function renderDepartureTable(departures, filterReinforcement, split) {
  if (split) {
    const regular = departures.filter(d => !d.note);
    const reinforce = departures.filter(d => !!d.note);
    let html = '';
    if (regular.length > 0) {
      html += `
        <div class="card-block times-block">
          <div class="card-block-header static">
            <div class="card-block-title">${clockSVG} שעות יציאה</div>
          </div>
          ${renderDepartureGrid(regular)}
        </div>`;
    }
    if (reinforce.length > 0) {
      const reinforceOpen = isReinforcementDay() ? ' open' : '';
      html += `
        <div class="card-block times-block times-block--reinforce${reinforceOpen}" onclick="this.classList.toggle('open')">
          <div class="card-block-header reinforce-header">
            <div class="card-block-title">${reinforceSVG} תגבור ראשון וחמישי</div>
            <div class="card-block-meta">${smallChevronSVG}</div>
          </div>
          <div class="card-block-body">
            ${renderDepartureGrid(reinforce, 'dep-chip--reinforce')}
          </div>
        </div>`;
    }
    return html;
  }

  const filtered = departures.filter(d => {
    const isReinforcement = !!d.note;
    if (filterReinforcement === 'only') return isReinforcement;
    if (filterReinforcement === 'none') return !isReinforcement;
    return true;
  });
  if (filtered.length === 0) return '<div class="no-data">אין שעות יציאה</div>';

  return `
    <div class="card-block times-block">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה</div>
      </div>
      ${renderDepartureGrid(filtered)}
    </div>`;
}

function renderDepartureTimesStr(timesStr) {
  const times = timesStr.split('-');
  return `
    <div class="card-block times-block">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה</div>
      </div>
      <div class="departure-grid">
        ${times.map(t => `
          <div class="dep-chip">
            <span class="dep-chip-time">${esc(t)}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderRouteCard(route, opts) {
  opts = opts || {};
  const filterReinforcement = opts.filterReinforcement || 'all';
  const titleOverride = opts.title;
  const hideStops = opts.hideStops;

  let bodyHtml = '';

  if (route.stops && !hideStops) {
    bodyHtml += renderStopsCard(route.stops);
  }

  if (route.departure_times) {
    bodyHtml += renderDepartureTable(route.departure_times, filterReinforcement, opts.splitReinforcement);
  }

  if (route.departure_times_str) {
    bodyHtml += renderDepartureTimesStr(route.departure_times_str);
  }

  if (route.note) {
    bodyHtml += `<div class="route-note">${infoSVG} ${esc(route.note)}</div>`;
  }

  if (route.evening) {
    bodyHtml += `
      <div class="card-block evening-block">
        <div class="card-block-header static">
          <div class="card-block-title">${moonSVG} ערב</div>
        </div>
        <div class="evening-info">
          <div class="dep-chip dep-chip--evening">
            <span class="dep-chip-time">${esc(route.evening.time)}</span>
          </div>
          <div class="evening-note">${esc(route.evening.break)}</div>
        </div>
      </div>`;
  }

  const name = titleOverride || route.name;
  const titleHtml = formatRouteTitle(name);

  const countdownHtml = renderCountdownBanner(route);

  return `
    <div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">${titleHtml}</div>
      </div>
      ${countdownHtml}
      <div class="route-card-body">
        ${bodyHtml}
      </div>
    </div>`;
}

function isReinforcementDay() {
  const day = new Date().getDay(); // 0=Sun, 4=Thu
  return day === 0 || day === 4;
}

function isReinforcementTime(d) {
  return d.note && d.note.includes('ראשון');
}

function getAllDepartureTimes(route) {
  const times = [];
  const reinforceDay = isReinforcementDay();
  if (route.departure_times) {
    route.departure_times.forEach(d => {
      // Skip reinforcement-only times if today isn't Sunday/Thursday
      if (!reinforceDay && isReinforcementTime(d)) return;
      times.push(d.time);
    });
  }
  if (route.departure_times_str) {
    route.departure_times_str.split('-').forEach(t => times.push(t.trim()));
  }
  if (route.sub_routes) {
    route.sub_routes.forEach(sub => {
      if (sub.departure_times_str) {
        sub.departure_times_str.split('-').forEach(t => times.push(t.trim()));
      }
      if (sub.departure_times) {
        sub.departure_times.forEach(d => {
          if (!reinforceDay && isReinforcementTime(d)) return;
          times.push(d.time);
        });
      }
    });
  }
  return times;
}

function getNextDeparture(route) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const times = getAllDepartureTimes(route);

  // Parse and sort all valid times
  const parsed = [];
  times.forEach(t => {
    const match = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    const mins = parseInt(match[1]) * 60 + parseInt(match[2]);
    parsed.push({ time: t, mins });
  });
  parsed.sort((a, b) => a.mins - b.mins);

  // Find next departure (>= 0 means "right now" counts)
  for (const p of parsed) {
    const diff = p.mins - nowMins;
    if (diff >= 0) return { time: p.time, minutes: diff };
  }

  return null;
}

function renderCountdownBanner(route) {
  const next = getNextDeparture(route);
  if (!next || next.minutes > 60) {
    return '';
  }
  if (next.minutes === 0) {
    return `<div class="countdown-banner countdown-urgent">
      <div class="cb-primary"><span class="live-dot urgent"></span><span class="cb-minutes">עכשיו!</span></div>
      <div class="cb-secondary">יציאה משוערת בשעה ${next.time}</div>
    </div>`;
  }
  const urgent = next.minutes <= 5;
  return `<div class="countdown-banner ${urgent ? 'countdown-urgent' : ''}">
    <div class="cb-primary"><span class="live-dot ${urgent ? 'urgent' : ''}"></span><span class="cb-minutes">${next.minutes} דק׳</span></div>
    <div class="cb-secondary">יציאה משוערת בשעה ${next.time}</div>
  </div>`;
}

function formatRouteTitle(name) {
  const arrowLeft = `<svg class="route-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
  if (name.includes(' - ')) {
    const parts = name.split(' - ');
    return `<span class="route-from">${esc(parts[0])}</span>${arrowLeft}<span class="route-to">${esc(parts[1])}</span>`;
  }
  return esc(name);
}

const phoneSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

function renderCTA() {
  return `<div class="route-cta">
    <span class="route-cta-text">הסתבכת?</span>
    <a href="tel:04-6092400" class="route-cta-link">${phoneSVG} 04-6092400</a>
    <span class="route-cta-sub">התקשר למוצב מנהלה למידע</span>
  </div>`;
}

function renderRouteContent() {
  const container = document.getElementById('route-content');
  let html = '';

  if (activeRoute === 'train') {
    const toTrain = DATA.bus_routes[0];
    const fromTrain = DATA.bus_routes[1];
    html += renderRouteCard(toTrain, { splitReinforcement: true });
    html += renderRouteCard(fromTrain, { splitReinforcement: true });
  }

  else if (activeRoute === 'tzomet') {
    const tzomet = DATA.bus_routes[3];
    html += renderRouteCard(tzomet);
  }

  else if (activeRoute === 'internal') {
    const internal = DATA.bus_routes[2];
    if (internal.note) {
      html += `<div class="route-note top-note">${infoSVG} ${esc(internal.note)}</div>`;
    }
    if (internal.sub_routes) {
      internal.sub_routes.forEach(sub => {
        html += renderRouteCard(sub);
      });
    }
  }

  html += renderCTA();
  container.innerHTML = html;
}

// ─── Tab Navigation ───
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
    });
  });
}

// ─── Countdown Timer ───
let countdownTimer = null;

function startCountdownTimer() {
  stopCountdownTimer();
  renderRouteContent();
  // Sync to the next minute boundary so updates happen right when the clock ticks
  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  countdownTimer = setTimeout(function tick() {
    renderRouteContent();
    // Then repeat every 60s, aligned to the minute
    countdownTimer = setInterval(() => renderRouteContent(), 60000);
  }, msToNextMinute);
}

function stopCountdownTimer() {
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// Re-render immediately when user returns to the tab (fixes stale data after sleep/background)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    startCountdownTimer();
  } else {
    stopCountdownTimer();
  }
});

// Also handle mobile resume / laptop lid open
window.addEventListener('focus', () => {
  renderRouteContent();
});

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  renderStations();
  renderRouteTabs();
  renderRouteContent();
  initTabs();
  startCountdownTimer();
});
