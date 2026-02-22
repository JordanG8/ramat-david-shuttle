// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — ADMIN DASHBOARD JS
// ═══════════════════════════════════════════

const ADMIN_DATA_KEY     = "shuttle_admin_data";
const ADMIN_PWD_KEY      = "shuttle_admin_pwd_hash";
const ADMIN_SESSION_KEY  = "shuttle_admin_session";
const DEFAULT_PASSWORD   = "admin2024!";
const SALT               = "shuttle-kaf-1-2024";

// ─── Deep-clone the defaults from app.js on first load ───
const DEFAULT_DATA = {
  units:      JSON.parse(JSON.stringify(DATA.units)),
  bus_routes: JSON.parse(JSON.stringify(DATA.bus_routes)),
  old_routes: JSON.parse(JSON.stringify(OLD_ROUTES)),
};

// ─── Working copy (mutated by editors, then saved) ───
let adminData = {
  units:      JSON.parse(JSON.stringify(DEFAULT_DATA.units)),
  bus_routes: JSON.parse(JSON.stringify(DEFAULT_DATA.bus_routes)),
  old_routes: JSON.parse(JSON.stringify(DEFAULT_DATA.old_routes)),
};

// ═══════════════════ AUTH ═══════════════════

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(password + SALT);
  const buf     = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function checkPassword(input) {
  const inputHash   = await hashPassword(input);
  const storedHash  = localStorage.getItem(ADMIN_PWD_KEY);
  if (!storedHash) {
    // First run — accept default password and store its hash
    const defaultHash = await hashPassword(DEFAULT_PASSWORD);
    if (inputHash === defaultHash) {
      localStorage.setItem(ADMIN_PWD_KEY, defaultHash);
      return true;
    }
    return false;
  }
  return inputHash === storedHash;
}

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function setLoggedIn() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
}

function logout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  location.reload();
}

// ═══════════════════ DATA I/O ═══════════════════

function loadAdminData() {
  try {
    const raw = localStorage.getItem(ADMIN_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.units)      adminData.units      = parsed.units;
      if (parsed.bus_routes) adminData.bus_routes = parsed.bus_routes;
      if (parsed.old_routes) adminData.old_routes = parsed.old_routes;
    }
  } catch (e) {
    console.warn("Could not load admin data:", e);
  }
}

function saveAllData() {
  localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData));
  // Patch live DATA/OLD_ROUTES so open main page tab also updates
  DATA.units      = adminData.units;
  DATA.bus_routes = adminData.bus_routes;
  OLD_ROUTES      = adminData.old_routes;
  showToast("השינויים נשמרו בהצלחה", "success");
  updateSaveStatus();
}

function resetToDefaults() {
  if (!confirm("האם אתה בטוח? כל השינויים ימחקו ולא יהיה ניתן לשחזרם.")) return;
  localStorage.removeItem(ADMIN_DATA_KEY);
  adminData = {
    units:      JSON.parse(JSON.stringify(DEFAULT_DATA.units)),
    bus_routes: JSON.parse(JSON.stringify(DEFAULT_DATA.bus_routes)),
    old_routes: JSON.parse(JSON.stringify(DEFAULT_DATA.old_routes)),
  };
  DATA.units      = adminData.units;
  DATA.bus_routes = adminData.bus_routes;
  OLD_ROUTES      = adminData.old_routes;
  renderActiveTab();
  showToast("הנתונים אופסו לברירת מחדל", "success");
  updateSaveStatus();
}

function exportData() {
  const blob = new Blob([JSON.stringify(adminData, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `shuttle-data-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.units && !imported.bus_routes && !imported.old_routes) {
        showToast("קובץ לא תקין", "error");
        return;
      }
      if (imported.units)      adminData.units      = imported.units;
      if (imported.bus_routes) adminData.bus_routes = imported.bus_routes;
      if (imported.old_routes) adminData.old_routes = imported.old_routes;
      saveAllData();
      renderActiveTab();
      showToast("הנתונים יובאו בהצלחה", "success");
    } catch (err) {
      showToast("שגיאה בקריאת הקובץ", "error");
    }
  };
  reader.readAsText(file);
}

function updateSaveStatus() {
  const el  = document.getElementById("save-status");
  const raw = localStorage.getItem(ADMIN_DATA_KEY);
  if (raw) {
    const ts  = JSON.parse(raw).__savedAt;
    el.textContent = ts ? "נשמר: " + new Date(ts).toLocaleTimeString("he-IL") : "נשמר";
    el.style.background = "rgba(46,125,50,.5)";
  } else {
    el.textContent = "לא נשמר";
    el.style.background = "rgba(255,255,255,.15)";
  }
}

function saveWithTimestamp() {
  adminData.__savedAt = Date.now();
  saveAllData();
}

// ═══════════════════ TOAST ═══════════════════

function showToast(msg, type) {
  const c    = document.getElementById("toast-container");
  const div  = document.createElement("div");
  div.className = "toast" + (type ? " " + type : "");
  div.textContent = msg;
  c.appendChild(div);
  setTimeout(() => div.remove(), 2800);
}

// ═══════════════════ TAB ROUTING ═══════════════════

let activeTab = "units";

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".adm-tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.classList.toggle("active", p.id === "tab-" + tab);
  });
  renderActiveTab();
}

function renderActiveTab() {
  if (activeTab === "units")     renderUnitsTab();
  if (activeTab === "routes")    renderRoutesTab();
  if (activeTab === "schedules") renderSchedulesTab();
  if (activeTab === "settings")  renderSettingsInfo();
}

// ═══════════════════ SHARED HELPERS ═══════════════════

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.forEach(c => {
    if (c == null) return;
    e.append(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}

function makeInput(value, placeholder, opts) {
  opts = opts || {};
  const input = document.createElement("input");
  input.type        = opts.type || "text";
  input.className   = "form-control";
  input.value       = value || "";
  input.placeholder = placeholder || "";
  if (opts.style) input.style.cssText = opts.style;
  if (opts.min)   input.min = opts.min;
  if (opts.max)   input.max = opts.max;
  return input;
}

function makeSelect(options, value) {
  const select = document.createElement("select");
  select.className = "form-control";
  options.forEach(([val, label]) => {
    const o = document.createElement("option");
    o.value = val; o.textContent = label;
    if (val === value) o.selected = true;
    select.appendChild(o);
  });
  return select;
}

function iconBtn(title, svgPath, extraClass) {
  const btn = document.createElement("button");
  btn.className = "btn btn-icon btn-sm " + (extraClass || "btn-secondary");
  btn.title     = title;
  btn.type      = "button";
  btn.innerHTML = svgPath;
  return btn;
}

const ICONS = {
  del:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  up:    `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`,
  down:  `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`,
  plus:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  chevD: `<svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
};

// ═══════════════════════════════════════════
//  TAB: UNITS
// ═══════════════════════════════════════════

function renderUnitsTab() {
  const container = document.getElementById("units-list");
  container.innerHTML = "";

  adminData.units.forEach((unit, ui) => {
    container.appendChild(buildUnitCard(unit, ui));
  });
}

function buildUnitCard(unit, ui) {
  const card = document.createElement("div");
  card.className = "unit-editor-card";
  card.style.marginBottom = "10px";

  // ── Header ──
  const header = document.createElement("div");
  header.className = "unit-editor-header";
  header.onclick = () => card.classList.toggle("open");

  const swatch = document.createElement("span");
  swatch.className = "unit-color-swatch";
  swatch.style.background = unit.color || "#274068";

  const nameSpan = document.createElement("span");
  nameSpan.className = "unit-editor-name";
  nameSpan.append(swatch, unit.name);

  const meta = document.createElement("div");
  meta.className = "unit-editor-meta";

  const badge = document.createElement("span");
  badge.className = "dept-count-badge";
  badge.textContent = (unit.departments || []).length + " מחלקות";
  meta.append(badge);
  meta.innerHTML += ICONS.chevD;

  const delBtn = iconBtn("מחק יחידה", ICONS.del, "btn-danger");
  delBtn.style.marginLeft = "6px";
  delBtn.onclick = e => { e.stopPropagation(); deleteUnit(ui); };
  meta.prepend(delBtn);

  header.append(nameSpan, meta);

  // ── Body ──
  const body = document.createElement("div");
  body.className = "unit-editor-body";

  // Top fields row
  const row1 = document.createElement("div");
  row1.className = "form-row";

  const nameGrp  = formGroup("שם היחידה");
  const nameInput = makeInput(unit.name, "שם היחידה");
  nameInput.oninput = () => { unit.name = nameInput.value; nameSpan.childNodes[1].textContent = nameInput.value; };
  nameGrp.appendChild(nameInput);

  const stationGrp   = formGroup("תחנה ראשית");
  const stationInput = makeInput(unit.station || "", "תחנה ראשית (אופציונלי)");
  stationInput.oninput = () => { unit.station = stationInput.value; };
  stationGrp.appendChild(stationInput);

  row1.append(nameGrp, stationGrp);
  body.appendChild(row1);

  // Color row
  const colorRow = document.createElement("div");
  colorRow.className = "form-row";

  const colorGrp  = formGroup("צבע יחידה (במקרא)");
  const colorWrap = document.createElement("div");
  colorWrap.className = "color-picker-wrap";

  const colorInput = document.createElement("input");
  colorInput.type  = "color";
  colorInput.value = unit.color || "#274068";
  colorInput.oninput = () => {
    unit.color = colorInput.value;
    swatch.style.background = colorInput.value;
  };

  const colorPresets = document.createElement("div");
  colorPresets.className = "flex-row";
  const PRESETS = [
    { color: "#274068", label: "כחול" },
    { color: "#2e7d32", label: "ירוק" },
    { color: "#f57f17", label: "כתום" },
    { color: "#e65100", label: "כתום כהה" },
    { color: "#c62828", label: "אדום" },
    { color: "#6a1b9a", label: "סגול" },
    { color: "#0277bd", label: "כחול בהיר" },
    { color: "#00695c", label: "ירוק-כחול" },
  ];
  PRESETS.forEach(p => {
    const dot = document.createElement("span");
    dot.className = "unit-color-swatch";
    dot.style.background = p.color;
    dot.style.cursor = "pointer";
    dot.title = p.label;
    dot.onclick = () => {
      unit.color = p.color;
      colorInput.value = p.color;
      swatch.style.background = p.color;
    };
    colorPresets.appendChild(dot);
  });

  colorWrap.append(colorInput, colorPresets);
  colorGrp.appendChild(colorWrap);

  const notesGrp   = formGroup("הערה 1");
  const notesInput = makeInput(unit.notes || "", "הערה (אופציונלי)");
  notesInput.oninput = () => { unit.notes = notesInput.value; };
  notesGrp.appendChild(notesInput);

  colorRow.append(colorGrp, notesGrp);
  body.appendChild(colorRow);

  const notes2Row = document.createElement("div");
  notes2Row.className = "form-row single";
  const notes2Grp   = formGroup("הערה 2");
  const notes2Input = makeInput(unit.notes2 || "", "הערה נוספת (אופציונלי)");
  notes2Input.oninput = () => { unit.notes2 = notes2Input.value; };
  notes2Grp.appendChild(notes2Input);
  notes2Row.appendChild(notes2Grp);
  body.appendChild(notes2Row);

  // Divider
  const div = document.createElement("hr");
  div.className = "divider";
  body.appendChild(div);

  // Departments
  const deptHeader = document.createElement("div");
  deptHeader.className = "flex-between";
  const deptTitle = document.createElement("div");
  deptTitle.className = "adm-section-title";
  deptTitle.textContent = "מחלקות";
  const addDeptBtn = el("button", { class: "btn btn-secondary btn-sm", type: "button" }, ICONS.plus + " הוסף מחלקה");
  addDeptBtn.onclick = () => {
    unit.departments = unit.departments || [];
    unit.departments.push({ name: "", type: "תחנת שירות" });
    badge.textContent = unit.departments.length + " מחלקות";
    renderDeptList();
  };
  deptHeader.append(deptTitle, addDeptBtn);
  body.appendChild(deptHeader);

  const deptListEl = document.createElement("div");
  deptListEl.className = "dept-editor-list";
  body.appendChild(deptListEl);

  function renderDeptList() {
    deptListEl.innerHTML = "";
    (unit.departments || []).forEach((dept, di) => {
      deptListEl.appendChild(buildDeptRow(dept, di, unit, badge, renderDeptList));
    });
  }
  renderDeptList();

  card.append(header, body);
  return card;
}

function buildDeptRow(dept, di, unit, badge, refresh) {
  const item = document.createElement("div");
  item.className = "dept-editor-item";

  const dot = document.createElement("span");
  dot.className = "dept-type-dot " + (dept.type === "תחנת שירות" ? "service" : "alt");
  item.appendChild(dot);

  const fields = document.createElement("div");
  fields.className = "dept-editor-fields";

  const row1 = document.createElement("div");
  row1.className = "dept-editor-row";

  const nameInput = makeInput(dept.name, "שם מחלקה");
  nameInput.style.flex = "1";
  nameInput.oninput = () => { dept.name = nameInput.value; };

  const typeSelect = makeSelect([
    ["תחנת שירות",  "תחנת שירות (ירוק)"],
    ["תחנה חלופית", "תחנה חלופית (צהוב)"],
  ], dept.type);
  typeSelect.style.width = "170px";
  typeSelect.onchange = () => {
    dept.type = typeSelect.value;
    dot.className = "dept-type-dot " + (dept.type === "תחנת שירות" ? "service" : "alt");
    toggleGoesTo();
  };

  const delBtn = iconBtn("מחק מחלקה", ICONS.del, "btn-danger");
  delBtn.onclick = () => {
    unit.departments.splice(di, 1);
    badge.textContent = unit.departments.length + " מחלקות";
    refresh();
  };

  row1.append(nameInput, typeSelect, delBtn);
  fields.appendChild(row1);

  // Goes-to row (conditional)
  const row2 = document.createElement("div");
  row2.className = "dept-editor-row";
  const goesLabel = document.createElement("span");
  goesLabel.className = "text-muted text-sm";
  goesLabel.textContent = "נוסע אל:";
  const goesInput = makeInput(dept.goes_to || "", "תחנת יעד");
  goesInput.style.flex = "1";
  goesInput.oninput = () => { dept.goes_to = goesInput.value; };
  row2.append(goesLabel, goesInput);
  fields.appendChild(row2);

  function toggleGoesTo() {
    row2.style.display = dept.type === "תחנה חלופית" ? "flex" : "none";
  }
  toggleGoesTo();

  item.appendChild(fields);
  return item;
}

function deleteUnit(ui) {
  if (!confirm("למחוק את היחידה?")) return;
  adminData.units.splice(ui, 1);
  renderUnitsTab();
}

function formGroup(label) {
  const g = document.createElement("div");
  g.className = "form-group";
  const l = document.createElement("label");
  l.textContent = label;
  g.appendChild(l);
  return g;
}

// ═══════════════════════════════════════════
//  TAB: ROUTES
// ═══════════════════════════════════════════

function renderRoutesTab() {
  const container = document.getElementById("routes-list");
  container.innerHTML = "";
  adminData.bus_routes.forEach((route, ri) => {
    container.appendChild(buildRouteCard(route, ri));
  });
}

function buildRouteCard(route, ri) {
  const card = document.createElement("div");
  card.className = "route-editor-card";
  card.style.marginBottom = "12px";

  // Header
  const header = document.createElement("div");
  header.className = "route-editor-header";
  header.onclick = () => card.classList.toggle("open");

  const titleWrap = document.createElement("div");
  titleWrap.className = "route-editor-title";
  const badge = document.createElement("span");
  badge.className = "route-badge";
  badge.textContent = "קו " + (ri + 1);
  const titleSpan = document.createElement("span");
  titleSpan.textContent = route.name;
  titleWrap.append(badge, titleSpan);
  header.append(titleWrap);
  header.innerHTML += ICONS.chevD;

  // Body
  const body = document.createElement("div");
  body.className = "route-editor-body";

  // Name & description
  const metaSection = buildSubSection("פרטי קו");
  const nameRow = document.createElement("div");
  nameRow.className = "form-row";
  const nameGrp = formGroup("שם הקו");
  const nameInput = makeInput(route.name, "שם הקו");
  nameInput.oninput = () => { route.name = nameInput.value; titleSpan.textContent = nameInput.value; };
  nameGrp.appendChild(nameInput);

  const descGrp = formGroup("תיאור");
  const descInput = makeInput(route.description || "", "תיאור (אופציונלי)");
  descInput.oninput = () => { route.description = descInput.value; };
  descGrp.appendChild(descInput);

  nameRow.append(nameGrp, descGrp);
  metaSection.appendChild(nameRow);

  if (route.note !== undefined) {
    const noteGrp = formGroup("הערת קו");
    const noteRow = document.createElement("div");
    noteRow.className = "form-row single";
    const noteInput = makeInput(route.note || "", "הערה");
    noteInput.oninput = () => { route.note = noteInput.value; };
    noteGrp.appendChild(noteInput);
    noteRow.appendChild(noteGrp);
    metaSection.appendChild(noteRow);
  }
  body.appendChild(metaSection);

  // Departure times (departure_times array)
  if (route.departure_times) {
    const timesSection = buildSubSection("שעות יציאה");
    timesSection.appendChild(buildTimesEditor(route.departure_times, () => {}));
    body.appendChild(timesSection);
  }

  // Departure times string
  if (route.departure_times_str !== undefined) {
    const timesSection = buildSubSection("שעות יציאה (מחרוזת)");
    const helpTxt = document.createElement("div");
    helpTxt.className = "text-muted text-sm";
    helpTxt.textContent = "ערכים מופרדים במקף: HH:MM-HH:MM-HH:MM";
    helpTxt.style.marginBottom = "8px";
    timesSection.appendChild(helpTxt);
    const strInput = document.createElement("textarea");
    strInput.className = "form-control";
    strInput.value = route.departure_times_str;
    strInput.rows  = 3;
    strInput.style.direction = "ltr";
    strInput.style.textAlign = "left";
    strInput.oninput = () => { route.departure_times_str = strInput.value.trim(); };
    timesSection.appendChild(strInput);
    body.appendChild(timesSection);
  }

  // Evening hours
  if (route.evening !== undefined) {
    const eveningSection = buildSubSection("שעות ערב");
    const eRow = document.createElement("div");
    eRow.className = "form-row";
    const eTimeGrp = formGroup("שעות פעילות ערב");
    const eTimeInput = makeInput(route.evening ? route.evening.time : "", "18:00-22:00");
    eTimeInput.oninput = () => { if (!route.evening) route.evening = {}; route.evening.time = eTimeInput.value; };
    eTimeGrp.appendChild(eTimeInput);
    const eBreakGrp = formGroup("הפסקה");
    const eBreakInput = makeInput(route.evening ? route.evening.break : "", "הפסקה 20:40-21:00");
    eBreakInput.oninput = () => { if (!route.evening) route.evening = {}; route.evening.break = eBreakInput.value; };
    eBreakGrp.appendChild(eBreakInput);
    eRow.append(eTimeGrp, eBreakGrp);
    eveningSection.appendChild(eRow);
    body.appendChild(eveningSection);
  }

  // Stops
  if (route.stops) {
    const stopsSection = buildSubSection("תחנות עצירה");
    stopsSection.appendChild(buildStopsEditor(route.stops));
    body.appendChild(stopsSection);
  }

  // Sub-routes
  if (route.sub_routes) {
    route.sub_routes.forEach((sub, si) => {
      const subSection = buildSubSection("תת-קו: " + sub.name);
      const subNameGrp = formGroup("שם תת-קו");
      const subNameRow = document.createElement("div");
      subNameRow.className = "form-row single";
      const subNameInput = makeInput(sub.name, "שם");
      subNameInput.oninput = () => { sub.name = subNameInput.value; };
      subNameGrp.appendChild(subNameInput);
      subNameRow.appendChild(subNameGrp);
      subSection.appendChild(subNameRow);

      if (sub.departure_times_str !== undefined) {
        const stHelp = document.createElement("div");
        stHelp.className = "text-muted text-sm";
        stHelp.textContent = "שעות (מקף מפריד):";
        stHelp.style.marginBottom = "4px";
        subSection.appendChild(stHelp);
        const stInput = document.createElement("textarea");
        stInput.className = "form-control";
        stInput.value = sub.departure_times_str;
        stInput.rows  = 2;
        stInput.style.direction = "ltr";
        stInput.style.textAlign = "left";
        stInput.oninput = () => { sub.departure_times_str = stInput.value.trim(); };
        subSection.appendChild(stInput);
      }
      if (sub.departure_times) {
        subSection.appendChild(buildTimesEditor(sub.departure_times, () => {}));
      }
      if (sub.stops) {
        const stopsLbl = document.createElement("div");
        stopsLbl.className = "adm-section-title";
        stopsLbl.style.margin = "10px 0 6px";
        stopsLbl.textContent = "תחנות";
        subSection.appendChild(stopsLbl);
        subSection.appendChild(buildStopsEditor(sub.stops));
      }
      body.appendChild(subSection);
    });
  }

  card.append(header, body);
  return card;
}

function buildSubSection(title) {
  const sec = document.createElement("div");
  sec.className = "route-subsection";
  const hdr = document.createElement("div");
  hdr.className = "route-subsection-header";
  hdr.textContent = title;
  const bdy = document.createElement("div");
  bdy.className = "route-subsection-body";
  sec.append(hdr, bdy);
  // Expose body as the "append" target
  sec.appendChild = (child) => bdy.appendChild(child);
  return sec;
}

// ─── Departure-times chip editor ───
function buildTimesEditor(timesArr, onChange) {
  const wrap = document.createElement("div");

  const chipList = document.createElement("div");
  chipList.className = "times-editor-list";
  wrap.appendChild(chipList);

  function refresh() {
    chipList.innerHTML = "";
    timesArr.forEach((dep, i) => {
      chipList.appendChild(buildTimeChip(dep, i));
    });
  }

  function buildTimeChip(dep, i) {
    const chip = document.createElement("div");
    chip.className = "time-chip" + (dep.note ? " reinforce" : "");

    const timeInput = document.createElement("input");
    timeInput.type  = "time";
    timeInput.value = dep.time || "";
    timeInput.oninput = () => { dep.time = timeInput.value; onChange(); };
    chip.appendChild(timeInput);

    const rBtn = document.createElement("button");
    rBtn.className = "time-chip-reinforce-toggle";
    rBtn.type      = "button";
    rBtn.title     = dep.note ? "הסר תגבור" : "סמן כתגבור (ראשון/חמישי)";
    rBtn.textContent = dep.note ? "תגבור ✓" : "תגבור";
    rBtn.onclick = () => {
      dep.note = dep.note ? "" : "תגבור- רק בימי ראשון וחמישי";
      chip.className = "time-chip" + (dep.note ? " reinforce" : "");
      rBtn.textContent = dep.note ? "תגבור ✓" : "תגבור";
      rBtn.title = dep.note ? "הסר תגבור" : "סמן כתגבור";
      onChange();
    };
    chip.appendChild(rBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "time-chip-del";
    delBtn.type      = "button";
    delBtn.title     = "מחק";
    delBtn.innerHTML = "×";
    delBtn.onclick = () => {
      timesArr.splice(i, 1);
      refresh();
      onChange();
    };
    chip.appendChild(delBtn);

    return chip;
  }

  const addRow = document.createElement("div");
  addRow.className = "add-item-row";
  addRow.style.marginTop = "8px";
  const addBtn = el("button", { class: "btn btn-secondary btn-sm", type: "button" },
    ICONS.plus + " הוסף שעת יציאה");
  addBtn.onclick = () => {
    timesArr.push({ time: "08:00" });
    refresh();
  };
  addRow.appendChild(addBtn);
  wrap.appendChild(addRow);

  refresh();
  return wrap;
}

// ─── Stops editor (add/remove/reorder) ───
function buildStopsEditor(stopsArr) {
  const wrap = document.createElement("div");
  const list = document.createElement("div");
  list.className = "stops-editor-list";
  wrap.appendChild(list);

  function refresh() {
    list.innerHTML = "";
    stopsArr.forEach((stop, i) => {
      list.appendChild(buildStopRow(stop, i));
    });
  }

  function buildStopRow(stop, i) {
    const row = document.createElement("div");
    row.className = "stop-editor-item";

    const num = document.createElement("span");
    num.className   = "stop-num-badge";
    num.textContent = i + 1;

    const input = makeInput(stop, "שם תחנה");
    input.style.flex = "1";
    input.oninput = () => { stopsArr[i] = input.value; };

    const moveBtns = document.createElement("div");
    moveBtns.className = "stop-move-btns";

    const upBtn = document.createElement("button");
    upBtn.className = "stop-move-btn";
    upBtn.type      = "button";
    upBtn.innerHTML = ICONS.up;
    upBtn.disabled  = i === 0;
    upBtn.onclick   = () => {
      [stopsArr[i - 1], stopsArr[i]] = [stopsArr[i], stopsArr[i - 1]];
      refresh();
    };

    const downBtn = document.createElement("button");
    downBtn.className = "stop-move-btn";
    downBtn.type      = "button";
    downBtn.innerHTML = ICONS.down;
    downBtn.disabled  = i === stopsArr.length - 1;
    downBtn.onclick   = () => {
      [stopsArr[i + 1], stopsArr[i]] = [stopsArr[i], stopsArr[i + 1]];
      refresh();
    };
    moveBtns.append(upBtn, downBtn);

    const delBtn = iconBtn("מחק תחנה", ICONS.del, "btn-danger");
    delBtn.onclick = () => { stopsArr.splice(i, 1); refresh(); };

    row.append(num, input, moveBtns, delBtn);
    return row;
  }

  const addRow = document.createElement("div");
  addRow.className = "add-item-row";
  addRow.style.marginTop = "8px";
  const addBtn = el("button", { class: "btn btn-secondary btn-sm", type: "button" },
    ICONS.plus + " הוסף תחנה");
  addBtn.onclick = () => {
    stopsArr.push("");
    refresh();
  };
  addRow.appendChild(addBtn);
  wrap.appendChild(addRow);

  refresh();
  return wrap;
}

// ═══════════════════════════════════════════
//  TAB: SCHEDULES (OLD_ROUTES)
// ═══════════════════════════════════════════

function renderSchedulesTab() {
  const container = document.getElementById("schedules-list");
  container.innerHTML = "";
  adminData.old_routes.forEach((route, ri) => {
    container.appendChild(buildScheduleRouteCard(route, ri));
  });
}

function buildScheduleRouteCard(route, ri) {
  const card = document.createElement("div");
  card.className = "route-editor-card";
  card.style.marginBottom = "12px";

  const header = document.createElement("div");
  header.className = "route-editor-header";
  header.onclick = () => card.classList.toggle("open");

  const titleWrap = document.createElement("div");
  titleWrap.className = "route-editor-title";
  const badge = document.createElement("span");
  badge.className = "route-badge";
  badge.textContent = "קו " + (ri + 1);
  const titleSpan = document.createElement("span");
  titleSpan.textContent = route.name;
  titleWrap.append(badge, titleSpan);
  header.append(titleWrap);
  header.innerHTML += ICONS.chevD;

  const body = document.createElement("div");
  body.className = "route-editor-body";

  // Route name
  const nameRow = document.createElement("div");
  nameRow.className = "form-row single";
  const nameGrp = formGroup("שם הקו");
  const nameInput = makeInput(route.name, "שם");
  nameInput.oninput = () => { route.name = nameInput.value; titleSpan.textContent = nameInput.value; };
  nameGrp.appendChild(nameInput);
  nameRow.appendChild(nameGrp);
  body.appendChild(nameRow);

  // Schedule entries
  const schedHeader = document.createElement("div");
  schedHeader.className = "flex-between";
  schedHeader.style.margin = "4px 0 8px";
  const schedTitle = document.createElement("div");
  schedTitle.className = "adm-section-title";
  schedTitle.textContent = "רשומות לוח זמנים";
  const addEntryBtn = el("button", { class: "btn btn-secondary btn-sm", type: "button" },
    ICONS.plus + " הוסף רשומה");
  addEntryBtn.onclick = () => {
    route.schedule.push({ time: "08:00", type: "נסיעה", stops: [] });
    renderSchedList();
  };
  schedHeader.append(schedTitle, addEntryBtn);
  body.appendChild(schedHeader);

  const schedList = document.createElement("div");
  schedList.className = "sched-editor-list";
  body.appendChild(schedList);

  function renderSchedList() {
    schedList.innerHTML = "";
    route.schedule.forEach((entry, ei) => {
      schedList.appendChild(buildSchedEntryEditor(entry, ei, route.schedule, renderSchedList));
    });
  }
  renderSchedList();

  card.append(header, body);
  return card;
}

function buildSchedEntryEditor(entry, ei, schedArr, refresh) {
  const TYPE_OPTIONS = [
    ["נסיעה",    "נסיעה"],
    ["הפסקה",   "הפסקה"],
    ["איסוף",   "איסוף"],
    ["סוף יום", "סוף יום"],
  ];
  const TYPE_CLASS = { "נסיעה": "trip", "הפסקה": "break", "איסוף": "pickup", "סוף יום": "end" };

  const wrap = document.createElement("div");
  wrap.className = "sched-entry-editor";

  // Header
  const hdr = document.createElement("div");
  hdr.className = "sched-entry-header";
  hdr.onclick = () => wrap.classList.toggle("open");

  const typeTag = document.createElement("span");
  typeTag.className = "sched-type-tag " + (TYPE_CLASS[entry.type] || "trip");
  typeTag.textContent = entry.type;

  const timeDisplay = document.createElement("span");
  timeDisplay.className = "sched-entry-time-display";
  timeDisplay.textContent = entry.time;

  const delBtn = iconBtn("מחק", ICONS.del, "btn-danger");
  delBtn.style.marginRight = "auto";
  delBtn.onclick = e => { e.stopPropagation(); schedArr.splice(ei, 1); refresh(); };

  hdr.append(typeTag, timeDisplay, delBtn);
  hdr.innerHTML += ICONS.chevD;

  // Body
  const entryBody = document.createElement("div");
  entryBody.className = "sched-entry-body";

  const row1 = document.createElement("div");
  row1.className = "form-row";

  const timeGrp = formGroup("זמן");
  const timeInput = makeInput(entry.time, "HH:MM");
  timeInput.oninput = () => { entry.time = timeInput.value; timeDisplay.textContent = timeInput.value; };
  timeGrp.appendChild(timeInput);

  const typeGrp = formGroup("סוג");
  const typeSelect = makeSelect(TYPE_OPTIONS, entry.type);
  typeSelect.onchange = () => {
    entry.type = typeSelect.value;
    typeTag.className = "sched-type-tag " + (TYPE_CLASS[entry.type] || "trip");
    typeTag.textContent = entry.type;
    toggleTypeFields();
  };
  typeGrp.appendChild(typeSelect);

  row1.append(timeGrp, typeGrp);
  entryBody.appendChild(row1);

  // Description (for איסוף)
  const descRow = document.createElement("div");
  descRow.className = "form-row single";
  const descGrp = formGroup("תיאור");
  const descInput = makeInput(entry.description || "", "תיאור");
  descInput.oninput = () => { entry.description = descInput.value; };
  descGrp.appendChild(descInput);
  descRow.appendChild(descGrp);
  entryBody.appendChild(descRow);

  // Stops (for נסיעה)
  const stopsWrap = document.createElement("div");
  const stopsLabel = document.createElement("div");
  stopsLabel.className = "adm-section-title";
  stopsLabel.style.margin = "6px 0 4px";
  stopsLabel.textContent = "תחנות עצירה";
  stopsWrap.appendChild(stopsLabel);
  entry.stops = entry.stops || [];
  stopsWrap.appendChild(buildStopsEditor(entry.stops));
  entryBody.appendChild(stopsWrap);

  function toggleTypeFields() {
    const isTrip   = entry.type === "נסיעה";
    const isPickup = entry.type === "איסוף";
    descRow.style.display  = isPickup ? "grid" : "none";
    stopsWrap.style.display = isTrip ? "block" : "none";
  }
  toggleTypeFields();

  wrap.append(hdr, entryBody);
  return wrap;
}

// ═══════════════════════════════════════════
//  TAB: SETTINGS
// ═══════════════════════════════════════════

function renderSettingsInfo() {
  const info = document.getElementById("data-info");
  const raw  = localStorage.getItem(ADMIN_DATA_KEY);
  if (raw) {
    const d  = JSON.parse(raw);
    const ts = d.__savedAt ? new Date(d.__savedAt).toLocaleString("he-IL") : "לא ידוע";
    info.innerHTML = `
      <strong>נשמר לאחרונה:</strong> ${ts}<br>
      <strong>יחידות:</strong> ${(d.units || []).length} |
      <strong>קווים:</strong> ${(d.bus_routes || []).length} |
      <strong>לוחות זמנים:</strong> ${(d.old_routes || []).length}
    `;
  } else {
    info.textContent = "לא נשמרו עדיין שינויים — מוצגים נתוני ברירת מחדל.";
  }
}

async function handleChangePassword() {
  const oldPwd     = document.getElementById("old-pwd").value;
  const newPwd     = document.getElementById("new-pwd").value;
  const confirmPwd = document.getElementById("confirm-pwd").value;

  if (!oldPwd || !newPwd || !confirmPwd) { showToast("יש למלא את כל השדות", "error"); return; }
  if (newPwd !== confirmPwd)             { showToast("הסיסמאות החדשות אינן תואמות", "error"); return; }
  if (newPwd.length < 6)                 { showToast("הסיסמה החדשה קצרה מדי (מינימום 6 תווים)", "error"); return; }

  const ok = await checkPassword(oldPwd);
  if (!ok) { showToast("הסיסמה הנוכחית שגויה", "error"); return; }

  const newHash = await hashPassword(newPwd);
  localStorage.setItem(ADMIN_PWD_KEY, newHash);
  document.getElementById("old-pwd").value     = "";
  document.getElementById("new-pwd").value     = "";
  document.getElementById("confirm-pwd").value = "";
  showToast("הסיסמה עודכנה בהצלחה", "success");
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

  // ── Login ──
  const loginForm  = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const pwd = document.getElementById("pwd-input").value;
    const ok  = await checkPassword(pwd);
    if (ok) {
      setLoggedIn();
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("dashboard").style.display    = "flex";
      initDashboard();
    } else {
      loginError.classList.add("visible");
      document.getElementById("pwd-input").value = "";
      document.getElementById("pwd-input").focus();
    }
  });

  // Auto-show dashboard if already logged in
  if (isLoggedIn()) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").style.display    = "flex";
    initDashboard();
  }
});

function initDashboard() {
  loadAdminData();
  updateSaveStatus();

  // Sidebar tab switching
  document.querySelectorAll(".adm-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Save buttons
  document.getElementById("save-units-btn")    .addEventListener("click", () => { collectUnitsData(); saveWithTimestamp(); });
  document.getElementById("save-routes-btn")   .addEventListener("click", () => { collectRoutesData(); saveWithTimestamp(); });
  document.getElementById("save-schedules-btn").addEventListener("click", () => { collectSchedulesData(); saveWithTimestamp(); });

  // Settings
  document.getElementById("logout-btn")     .addEventListener("click", logout);
  document.getElementById("reset-btn")      .addEventListener("click", resetToDefaults);
  document.getElementById("export-btn")     .addEventListener("click", exportData);
  document.getElementById("change-pwd-btn") .addEventListener("click", handleChangePassword);

  document.getElementById("import-btn").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });

  // Render first tab
  renderUnitsTab();
}

// ─── Collect helpers (form → adminData sync) ───
// The editors already mutate adminData in place via oninput callbacks,
// so these are no-ops but kept as hooks for future validation passes.
function collectUnitsData()     {}
function collectRoutesData()    {}
function collectSchedulesData() {}
