// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — ADMIN DASHBOARD
// ═══════════════════════════════════════════
// Depends on app.js being loaded first (DATA, OLD_ROUTES globals)

(function AdminDashboard() {
  "use strict";

  /* ─── Constants ─── */
  var STORAGE_KEY = "shuttle_admin_data";
  var PASSWORD_KEY = "shuttle_admin_pwd";
  var SESSION_KEY = "shuttle_admin_session";
  var DEFAULT_PWD = "admin2024!";

  /* ─── Helpers ─── */
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  function $(id) {
    return document.getElementById(id);
  }

  /* ─── Working copies (edits happen here, saved on demand) ─── */
  var editUnits = clone(DATA.units);
  var editRoutes = clone(DATA.bus_routes);
  var editSchedules = clone(
    typeof OLD_ROUTES !== "undefined" ? OLD_ROUTES : [],
  );

  /* ─── Dirty flags ─── */
  var dirtyUnits = false,
    dirtyRoutes = false,
    dirtySchedules = false;

  // ═══════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════

  function getPassword() {
    return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PWD;
  }
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  async function doLogin(pwd) {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        localStorage.setItem(PASSWORD_KEY, pwd); // Store for subsequent API calls
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login error", e);
      return false;
    }
  }

  function doLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PASSWORD_KEY);
    location.reload();
  }

  var loginScreen = $("login-screen");
  var dashboard = $("dashboard");

  if (isLoggedIn()) {
    loginScreen.style.display = "none";
    dashboard.style.display = "flex";
    bootDashboard();
  }

  $("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var inp = $("pwd-input");
    var btn = $("login-btn");
    btn.disabled = true;
    btn.textContent = "מתחבר...";

    var success = await doLogin(inp.value);

    btn.disabled = false;
    btn.textContent = "כניסה למערכת";

    if (success) {
      loginScreen.style.display = "none";
      dashboard.style.display = "flex";
      bootDashboard();
    } else {
      $("login-error").classList.add("visible");
      inp.value = "";
      inp.focus();
    }
  });

  $("logout-btn").addEventListener("click", doLogout);

  // ═══════════════════════════════════════════
  // DASHBOARD BOOT
  // ═══════════════════════════════════════════

  async function bootDashboard() {
    const serverData = await loadStored();
    if (serverData && serverData.units) {
      editUnits = clone(serverData.units);
      DATA.units = clone(serverData.units);
    }
    if (serverData && serverData.bus_routes) {
      editRoutes = clone(serverData.bus_routes);
      DATA.bus_routes = clone(serverData.bus_routes);
    }
    if (serverData && serverData.schedules) {
      editSchedules = clone(serverData.schedules);
      if (typeof OLD_ROUTES !== "undefined")
        OLD_ROUTES = clone(serverData.schedules);
    }

    initTabs();
    renderUnitsTab();
    renderRoutesTab();
    renderSchedulesTab();
    renderDataInfo();
    bindSettingsEvents();
    updateSaveStatus();
  }

  // ═══════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════

  function initTabs() {
    var btns = document.querySelectorAll(".adm-tab-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.remove("active");
        });
        $("tab-" + btn.getAttribute("data-tab")).classList.add("active");
      });
    });
  }

  // ═══════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════

  function toast(msg, type) {
    var c = $("toast-container");
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      el.style.transition = "all .25s";
      setTimeout(function () {
        el.remove();
      }, 300);
    }, 2500);
  }

  // ─── Save-status badge ───
  function updateSaveStatus() {
    var b = $("save-status");
    if (dirtyUnits || dirtyRoutes || dirtySchedules) {
      b.textContent = "שינויים שלא נשמרו";
      b.style.background = "rgba(239,68,68,.8)";
      b.style.borderColor = "rgba(239,68,68,.4)";
    } else {
      b.textContent = "הכל שמור";
      b.style.background = "rgba(34,197,94,.25)";
      b.style.borderColor = "rgba(34,197,94,.3)";
    }
  }

  function markDirty(w) {
    if (w === "units") dirtyUnits = true;
    if (w === "routes") dirtyRoutes = true;
    if (w === "schedules") dirtySchedules = true;
    updateSaveStatus();
  }

  // ═══════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════

  async function loadStored() {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return {};
    } catch (e) {
      console.error("Error loading data", e);
      return {};
    }
  }

  async function persistUnits() {
    var d = await loadStored();
    d.units = editUnits;
    d._saved_at = new Date().toISOString();
    await saveToServer(d);
    DATA.units = clone(editUnits);
    dirtyUnits = false;
    updateSaveStatus();
  }

  async function persistRoutes() {
    var d = await loadStored();
    d.bus_routes = editRoutes;
    d._saved_at = new Date().toISOString();
    await saveToServer(d);
    DATA.bus_routes = clone(editRoutes);
    dirtyRoutes = false;
    updateSaveStatus();
  }

  async function persistSchedules() {
    var d = await loadStored();
    d.old_routes = editSchedules;
    d._saved_at = new Date().toISOString();
    await saveToServer(d);
    if (typeof OLD_ROUTES !== "undefined") OLD_ROUTES = clone(editSchedules);
    dirtySchedules = false;
    updateSaveStatus();
  }

  async function persistAll() {
    var payload = {
      units: editUnits,
      bus_routes: editRoutes,
      old_routes: editSchedules,
      _saved_at: new Date().toISOString(),
    };
    await saveToServer(payload);
    DATA.units = clone(editUnits);
    DATA.bus_routes = clone(editRoutes);
    if (typeof OLD_ROUTES !== "undefined") OLD_ROUTES = clone(editSchedules);
    dirtyUnits = dirtyRoutes = dirtySchedules = false;
    updateSaveStatus();
  }

  async function saveToServer(data) {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: data, password: getPassword() }),
      });
      if (!res.ok) {
        toast("שגיאה בשמירת הנתונים", "error");
      }
    } catch (e) {
      console.error("Error saving data", e);
      toast("שגיאה בשמירת הנתונים", "error");
    }
  }

  // ═══════════════════════════════════════════
  // UNITS & STATIONS TAB
  // ═══════════════════════════════════════════

  var chevronSvg =
    '<svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

  function renderUnitsTab() {
    var c = $("units-list");
    if (!editUnits.length) {
      c.innerHTML =
        '<div class="empty-state">אין יחידות. לחץ "+ הוסף יחידה" כדי להתחיל.</div>';
      return;
    }

    c.innerHTML = editUnits
      .map(function (unit, ui) {
        var color = unit.color || "#274068";
        var dc = unit.departments ? unit.departments.length : 0;

        var deptsHtml = (unit.departments || [])
          .map(function (dept, di) {
            var isSvc = dept.type === "תחנת שירות";
            return (
              '<div class="dept-editor-item">' +
              '<div class="dept-type-dot ' +
              (isSvc ? "service" : "alt") +
              '"></div>' +
              '<div class="dept-editor-fields">' +
              '<div class="dept-editor-row">' +
              '<input class="form-control" style="flex:1" value="' +
              esc(dept.name) +
              '" data-f="dn" data-u="' +
              ui +
              '" data-d="' +
              di +
              '" placeholder="שם מחלקה">' +
              '<select class="form-control" style="width:140px" data-f="dt" data-u="' +
              ui +
              '" data-d="' +
              di +
              '">' +
              '<option value="תחנת שירות"' +
              (isSvc ? " selected" : "") +
              ">תחנת שירות</option>" +
              '<option value="תחנה חלופית"' +
              (!isSvc ? " selected" : "") +
              ">תחנה חלופית</option>" +
              "</select>" +
              '<input class="form-control" style="width:140px" value="' +
              esc(dept.goes_to || "") +
              '" data-f="dg" data-u="' +
              ui +
              '" data-d="' +
              di +
              '" placeholder="מפנה ל...">' +
              '<button class="btn btn-danger btn-sm btn-icon" data-act="del-dept" data-u="' +
              ui +
              '" data-d="' +
              di +
              '" title="מחק">✕</button>' +
              "</div>" +
              "</div>" +
              "</div>"
            );
          })
          .join("");

        return (
          '<div class="unit-editor-card' +
          (ui === 0 ? " open" : "") +
          '">' +
          '<div class="unit-editor-header">' +
          '<div class="unit-editor-name"><div class="unit-color-swatch" style="background:' +
          esc(color) +
          '"></div><span>' +
          esc(unit.name) +
          "</span></div>" +
          '<div class="unit-editor-meta"><span class="dept-count-badge">' +
          dc +
          " מחלקות</span>" +
          chevronSvg +
          "</div>" +
          "</div>" +
          '<div class="unit-editor-body">' +
          '<div class="form-row">' +
          '<div class="form-group"><label>שם יחידה</label><input class="form-control" value="' +
          esc(unit.name) +
          '" data-f="un" data-u="' +
          ui +
          '"></div>' +
          '<div class="form-group"><label>תחנת ברירת מחדל</label><input class="form-control" value="' +
          esc(unit.station || "") +
          '" data-f="us" data-u="' +
          ui +
          '" placeholder="רחבת היסעים..."></div>' +
          "</div>" +
          '<div class="form-row">' +
          '<div class="form-group"><label>צבע יחידה</label><div class="color-picker-wrap"><input type="color" value="' +
          esc(color) +
          '" data-f="uc" data-u="' +
          ui +
          '"><span class="text-muted text-sm">' +
          esc(color) +
          "</span></div></div>" +
          '<div class="form-group"><label>הערה 1</label><input class="form-control" value="' +
          esc(unit.notes || "") +
          '" data-f="un1" data-u="' +
          ui +
          '" placeholder="הערה..."></div>' +
          "</div>" +
          '<div class="form-row single">' +
          '<div class="form-group"><label>הערה 2</label><input class="form-control" value="' +
          esc(unit.notes2 || "") +
          '" data-f="un2" data-u="' +
          ui +
          '" placeholder="הערה נוספת..."></div>' +
          "</div>" +
          '<hr class="divider">' +
          '<div class="flex-between"><strong class="text-sm">מחלקות (' +
          dc +
          ")</strong></div>" +
          '<div class="dept-editor-list">' +
          deptsHtml +
          "</div>" +
          '<div class="add-item-row">' +
          '<button class="btn btn-secondary btn-sm" data-act="add-dept" data-u="' +
          ui +
          '">+ הוסף מחלקה</button>' +
          '<button class="btn btn-danger btn-sm" data-act="del-unit" data-u="' +
          ui +
          '" style="margin-right:auto">מחק יחידה</button>' +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    bindUnitsEvents(c);
  }

  function bindUnitsEvents(c) {
    // Accordion toggle
    c.querySelectorAll(".unit-editor-header").forEach(function (h) {
      h.addEventListener("click", function () {
        h.parentElement.classList.toggle("open");
      });
    });

    // Live field edits
    c.addEventListener("input", function (e) {
      var el = e.target,
        f = el.getAttribute("data-f");
      if (!f) return;
      var ui = +el.getAttribute("data-u"),
        di = el.getAttribute("data-d");
      di = di != null ? +di : -1;

      if (f === "un") {
        editUnits[ui].name = el.value;
        el
          .closest(".unit-editor-card")
          .querySelector(".unit-editor-name span").textContent = el.value;
      }
      if (f === "us") editUnits[ui].station = el.value || undefined;
      if (f === "uc") {
        editUnits[ui].color = el.value;
        var card = el.closest(".unit-editor-card");
        card.querySelector(".unit-color-swatch").style.background = el.value;
        card.querySelector(".color-picker-wrap .text-muted").textContent =
          el.value;
      }
      if (f === "un1") editUnits[ui].notes = el.value || undefined;
      if (f === "un2") editUnits[ui].notes2 = el.value || undefined;
      if (f === "dn" && di >= 0) editUnits[ui].departments[di].name = el.value;
      if (f === "dg" && di >= 0)
        editUnits[ui].departments[di].goes_to = el.value || undefined;
      markDirty("units");
    });

    c.addEventListener("change", function (e) {
      var el = e.target,
        f = el.getAttribute("data-f");
      if (f === "dt") {
        var ui = +el.getAttribute("data-u"),
          di = +el.getAttribute("data-d");
        editUnits[ui].departments[di].type = el.value;
        el
          .closest(".dept-editor-item")
          .querySelector(".dept-type-dot").className =
          "dept-type-dot " + (el.value === "תחנת שירות" ? "service" : "alt");
        markDirty("units");
      }
      if (f === "uc") markDirty("units");
    });

    // Button actions
    c.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act"),
        ui = +btn.getAttribute("data-u"),
        di = btn.getAttribute("data-d");
      di = di != null ? +di : -1;

      if (act === "add-dept") {
        editUnits[ui].departments.push({
          name: "מחלקה חדשה",
          type: "תחנת שירות",
        });
        markDirty("units");
        renderUnitsTab();
        openUnitCard(ui);
      }
      if (act === "del-dept" && di >= 0) {
        if (!confirm('למחוק את "' + editUnits[ui].departments[di].name + '"?'))
          return;
        editUnits[ui].departments.splice(di, 1);
        markDirty("units");
        renderUnitsTab();
        openUnitCard(ui);
      }
      if (act === "del-unit") {
        if (
          !confirm('למחוק את היחידה "' + editUnits[ui].name + '" וכל המחלקות?')
        )
          return;
        editUnits.splice(ui, 1);
        markDirty("units");
        renderUnitsTab();
      }
    });
  }

  function openUnitCard(ui) {
    var cards = $("units-list").querySelectorAll(".unit-editor-card");
    if (cards[ui]) cards[ui].classList.add("open");
  }

  $("add-unit-btn").addEventListener("click", function () {
    editUnits.push({ name: "יחידה חדשה", color: "#274068", departments: [] });
    markDirty("units");
    renderUnitsTab();
    var cards = $("units-list").querySelectorAll(".unit-editor-card");
    var last = cards[cards.length - 1];
    if (last) {
      last.classList.add("open");
      last.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  $("save-units-btn").addEventListener("click", async function () {
    await persistUnits();
    toast("יחידות ותחנות נשמרו בהצלחה!", "success");
    renderDataInfo();
  });

  // ═══════════════════════════════════════════
  // ROUTES TAB
  // ═══════════════════════════════════════════

  function renderRoutesTab() {
    var c = $("routes-list");
    if (!editRoutes.length) {
      c.innerHTML = '<div class="empty-state">אין קווי שאטל.</div>';
      return;
    }

    c.innerHTML = editRoutes
      .map(function (route, ri) {
        var hasSub = route.sub_routes && route.sub_routes.length > 0;
        var sc = route.stops ? route.stops.length : 0;
        var tc = 0;
        if (route.departure_times) tc = route.departure_times.length;
        else if (route.departure_times_str)
          tc = route.departure_times_str.split("-").length;

        var body = "";
        // Name + description
        body +=
          '<div class="form-row"><div class="form-group"><label>שם הקו</label><input class="form-control" value="' +
          esc(route.name) +
          '" data-f="rn" data-r="' +
          ri +
          '"></div>' +
          '<div class="form-group"><label>תיאור</label><input class="form-control" value="' +
          esc(route.description || "") +
          '" data-f="rd" data-r="' +
          ri +
          '"></div></div>';
        if (route.note != null) {
          body +=
            '<div class="form-row single"><div class="form-group"><label>הערה</label><input class="form-control" value="' +
            esc(route.note) +
            '" data-f="rno" data-r="' +
            ri +
            '"></div></div>';
        }

        if (hasSub) {
          body += route.sub_routes
            .map(function (sr, si) {
              return buildSubRouteHtml(ri, si, sr);
            })
            .join("");
          body +=
            '<div class="add-item-row"><button class="btn btn-secondary btn-sm" data-act="add-sub" data-r="' +
            ri +
            '">+ הוסף תת-מסלול</button></div>';
        } else {
          if (route.stops) body += buildStopsHtml(ri, -1, route.stops);
          if (route.departure_times)
            body += buildTimesHtml(ri, route.departure_times);
          else if (route.departure_times_str !== undefined)
            body += buildTimesStrHtml(ri, -1, route.departure_times_str);
          if (route.evening) {
            body +=
              '<div class="route-subsection mt-12"><div class="route-subsection-header">לוח ערב</div><div class="route-subsection-body">' +
              '<div class="form-row"><div class="form-group"><label>שעות ערב</label><input class="form-control" value="' +
              esc(route.evening.time) +
              '" data-f="ret" data-r="' +
              ri +
              '" style="direction:ltr;text-align:left"></div>' +
              '<div class="form-group"><label>הפסקה</label><input class="form-control" value="' +
              esc(route.evening["break"] || "") +
              '" data-f="reb" data-r="' +
              ri +
              '" style="direction:ltr;text-align:left"></div></div></div></div>';
          }
        }

        var badge = hasSub
          ? route.sub_routes.length + " תת-מסלולים"
          : sc + " תחנות · " + tc + " יציאות";
        return (
          '<div class="route-editor-card' +
          (ri === 0 ? " open" : "") +
          '">' +
          '<div class="route-editor-header"><div class="route-editor-title"><span class="route-badge">' +
          (ri + 1) +
          "</span><span>" +
          esc(route.name) +
          "</span></div>" +
          '<div class="unit-editor-meta"><span class="dept-count-badge">' +
          badge +
          "</span>" +
          chevronSvg +
          "</div></div>" +
          '<div class="route-editor-body">' +
          body +
          "</div></div>"
        );
      })
      .join("");

    bindRoutesEvents(c);
  }

  function buildSubRouteHtml(ri, si, sr) {
    return (
      '<div class="route-subsection mt-8"><div class="route-subsection-header"><span>' +
      esc(sr.name) +
      "</span>" +
      '<button class="btn btn-danger btn-sm btn-icon" data-act="del-sub" data-r="' +
      ri +
      '" data-s="' +
      si +
      '" title="מחק">✕</button></div>' +
      '<div class="route-subsection-body">' +
      '<div class="form-row single"><div class="form-group"><label>שם תת-מסלול</label><input class="form-control" value="' +
      esc(sr.name) +
      '" data-f="sn" data-r="' +
      ri +
      '" data-s="' +
      si +
      '"></div></div>' +
      buildTimesStrHtml(ri, si, sr.departure_times_str || "") +
      buildStopsHtml(ri, si, sr.stops || []) +
      "</div></div>"
    );
  }

  function buildStopsHtml(ri, si, stops) {
    var sp = si >= 0 ? ' data-s="' + si + '"' : "";
    var items = stops
      .map(function (stop, idx) {
        return (
          '<div class="stop-editor-item">' +
          '<span class="stop-num-badge">' +
          (idx + 1) +
          "</span>" +
          '<input class="form-control" style="flex:1" value="' +
          esc(stop) +
          '" data-f="stp" data-r="' +
          ri +
          '"' +
          sp +
          ' data-i="' +
          idx +
          '">' +
          '<div class="stop-move-btns">' +
          '<button class="stop-move-btn" data-act="stop-up" data-r="' +
          ri +
          '"' +
          sp +
          ' data-i="' +
          idx +
          '">▲</button>' +
          '<button class="stop-move-btn" data-act="stop-dn" data-r="' +
          ri +
          '"' +
          sp +
          ' data-i="' +
          idx +
          '">▼</button>' +
          "</div>" +
          '<button class="btn btn-danger btn-sm btn-icon" data-act="del-stp" data-r="' +
          ri +
          '"' +
          sp +
          ' data-i="' +
          idx +
          '">✕</button>' +
          "</div>"
        );
      })
      .join("");
    return (
      '<div class="route-subsection mt-8"><div class="route-subsection-header"><span>תחנות עצירה (' +
      stops.length +
      ")</span>" +
      '<button class="btn btn-secondary btn-sm" data-act="add-stp" data-r="' +
      ri +
      '"' +
      sp +
      ">+ תחנה</button></div>" +
      '<div class="route-subsection-body"><div class="stops-editor-list">' +
      items +
      "</div></div></div>"
    );
  }

  function buildTimesHtml(ri, times) {
    var chips = times
      .map(function (t, ti) {
        var rein = t.note && t.note.indexOf("תגבור") >= 0;
        return (
          '<div class="time-chip' +
          (rein ? " reinforce" : "") +
          '">' +
          '<input type="time" value="' +
          esc(t.time) +
          '" data-f="tv" data-r="' +
          ri +
          '" data-t="' +
          ti +
          '">' +
          '<button class="time-chip-reinforce-toggle" data-act="tog-rein" data-r="' +
          ri +
          '" data-t="' +
          ti +
          '" title="תגבור">ת</button>' +
          '<button class="time-chip-del" data-act="del-tm" data-r="' +
          ri +
          '" data-t="' +
          ti +
          '">✕</button>' +
          "</div>"
        );
      })
      .join("");
    return (
      '<div class="route-subsection mt-8"><div class="route-subsection-header"><span>שעות יציאה (' +
      times.length +
      ")</span>" +
      '<button class="btn btn-secondary btn-sm" data-act="add-tm" data-r="' +
      ri +
      '">+ שעה</button></div>' +
      '<div class="route-subsection-body"><div class="times-editor-list">' +
      chips +
      "</div></div></div>"
    );
  }

  function buildTimesStrHtml(ri, si, str) {
    var sp = si >= 0 ? ' data-s="' + si + '"' : "";
    return (
      '<div class="route-subsection mt-8"><div class="route-subsection-header">שעות יציאה (טקסט)</div>' +
      '<div class="route-subsection-body"><div class="form-group"><label>שעות מופרדות ב-</label>' +
      '<input class="form-control" value="' +
      esc(str) +
      '" data-f="tstr" data-r="' +
      ri +
      '"' +
      sp +
      ' style="direction:ltr;text-align:left" placeholder="7:20-8:20-09:00..."></div></div></div>'
    );
  }

  function routeRef(ri, si) {
    return si >= 0 ? editRoutes[ri].sub_routes[si] : editRoutes[ri];
  }

  function bindRoutesEvents(c) {
    c.querySelectorAll(".route-editor-header").forEach(function (h) {
      h.addEventListener("click", function () {
        h.parentElement.classList.toggle("open");
      });
    });

    c.addEventListener("input", function (e) {
      var el = e.target,
        f = el.getAttribute("data-f");
      if (!f) return;
      var ri = +el.getAttribute("data-r"),
        si = el.getAttribute("data-s");
      si = si != null ? +si : -1;

      if (f === "rn") {
        editRoutes[ri].name = el.value;
        el
          .closest(".route-editor-card")
          .querySelector(".route-editor-title > span:last-child").textContent =
          el.value;
      }
      if (f === "rd") editRoutes[ri].description = el.value || undefined;
      if (f === "rno") editRoutes[ri].note = el.value || undefined;
      if (f === "ret") {
        if (!editRoutes[ri].evening) editRoutes[ri].evening = {};
        editRoutes[ri].evening.time = el.value;
      }
      if (f === "reb") {
        if (!editRoutes[ri].evening) editRoutes[ri].evening = {};
        editRoutes[ri].evening["break"] = el.value;
      }
      if (f === "sn" && si >= 0) editRoutes[ri].sub_routes[si].name = el.value;
      if (f === "stp") {
        var ref = routeRef(ri, si);
        if (ref.stops) ref.stops[+el.getAttribute("data-i")] = el.value;
      }
      if (f === "tstr") {
        routeRef(ri, si).departure_times_str = el.value;
      }
      if (f === "tv") {
        var ti = +el.getAttribute("data-t");
        if (editRoutes[ri].departure_times)
          editRoutes[ri].departure_times[ti].time = el.value;
      }
      markDirty("routes");
    });

    c.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act"),
        ri = +btn.getAttribute("data-r");
      var si = btn.getAttribute("data-s");
      si = si != null ? +si : -1;
      var idx = btn.getAttribute("data-i");
      idx = idx != null ? +idx : -1;
      var ti = btn.getAttribute("data-t");
      ti = ti != null ? +ti : -1;

      if (act === "add-stp") {
        var ref = routeRef(ri, si);
        if (!ref.stops) ref.stops = [];
        ref.stops.push("תחנה חדשה");
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "del-stp" && idx >= 0) {
        routeRef(ri, si).stops.splice(idx, 1);
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "stop-up" && idx > 0) {
        var s = routeRef(ri, si).stops;
        var t = s[idx - 1];
        s[idx - 1] = s[idx];
        s[idx] = t;
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "stop-dn") {
        var s = routeRef(ri, si).stops;
        if (idx < s.length - 1) {
          var t = s[idx + 1];
          s[idx + 1] = s[idx];
          s[idx] = t;
          markDirty("routes");
          renderRoutesTab();
          openRouteCard(ri);
        }
      }
      if (act === "add-tm") {
        if (!editRoutes[ri].departure_times)
          editRoutes[ri].departure_times = [];
        editRoutes[ri].departure_times.push({ time: "08:00" });
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "del-tm" && ti >= 0) {
        editRoutes[ri].departure_times.splice(ti, 1);
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "tog-rein" && ti >= 0) {
        var dt = editRoutes[ri].departure_times[ti];
        if (dt.note && dt.note.indexOf("תגבור") >= 0) delete dt.note;
        else dt.note = "תגבור- רק בימי ראשון וחמישי";
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "add-sub") {
        if (!editRoutes[ri].sub_routes) editRoutes[ri].sub_routes = [];
        editRoutes[ri].sub_routes.push({
          name: "תת-מסלול חדש",
          departure_times_str: "",
          stops: [],
        });
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
      if (act === "del-sub" && si >= 0) {
        if (!confirm("למחוק תת-מסלול זה?")) return;
        editRoutes[ri].sub_routes.splice(si, 1);
        markDirty("routes");
        renderRoutesTab();
        openRouteCard(ri);
      }
    });
  }

  function openRouteCard(ri) {
    var cards = $("routes-list").querySelectorAll(".route-editor-card");
    if (cards[ri]) cards[ri].classList.add("open");
  }

  $("save-routes-btn").addEventListener("click", async function () {
    await persistRoutes();
    toast("קווי שאטל נשמרו בהצלחה!", "success");
    renderDataInfo();
  });

  // ═══════════════════════════════════════════
  // SCHEDULES TAB (OLD_ROUTES)
  // ═══════════════════════════════════════════

  function schedTypeClass(t) {
    if (t === "נסיעה") return "trip";
    if (t === "הפסקה") return "break";
    if (t === "איסוף") return "pickup";
    if (t === "סוף יום") return "end";
    return "trip";
  }

  function renderSchedulesTab() {
    var c = $("schedules-list");
    if (!editSchedules.length) {
      c.innerHTML = '<div class="empty-state">אין לוחות זמנים מפורטים.</div>';
      return;
    }

    c.innerHTML = editSchedules
      .map(function (route, ri) {
        var ec = route.schedule ? route.schedule.length : 0;

        var entries = (route.schedule || [])
          .map(function (entry, ei) {
            var stopsArea = "";
            if (entry.stops && entry.stops.length) {
              stopsArea =
                '<div class="form-group"><label>תחנות (אחת לשורה)</label>' +
                '<textarea class="form-control" data-f="ss" data-r="' +
                ri +
                '" data-e="' +
                ei +
                '" rows="4">' +
                esc(entry.stops.join("\n")) +
                "</textarea></div>";
            }
            var descArea = entry.description
              ? '<div class="form-group"><label>תיאור</label><input class="form-control" value="' +
                esc(entry.description) +
                '" data-f="sd" data-r="' +
                ri +
                '" data-e="' +
                ei +
                '"></div>'
              : "";

            return (
              '<div class="sched-entry-editor">' +
              '<div class="sched-entry-header">' +
              '<span class="sched-type-tag ' +
              schedTypeClass(entry.type) +
              '">' +
              esc(entry.type) +
              "</span>" +
              '<span class="sched-entry-time-display">' +
              esc(entry.time) +
              "</span>" +
              '<svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:auto"><polyline points="6 9 12 15 18 9"/></svg>' +
              '<button class="btn btn-danger btn-sm btn-icon" data-act="del-se" data-r="' +
              ri +
              '" data-e="' +
              ei +
              '" title="מחק">✕</button>' +
              "</div>" +
              '<div class="sched-entry-body">' +
              '<div class="form-row">' +
              '<div class="form-group"><label>שעה</label><input class="form-control" value="' +
              esc(entry.time) +
              '" data-f="st" data-r="' +
              ri +
              '" data-e="' +
              ei +
              '" style="direction:ltr;text-align:left"></div>' +
              '<div class="form-group"><label>סוג</label><select class="form-control" data-f="sy" data-r="' +
              ri +
              '" data-e="' +
              ei +
              '">' +
              '<option value="נסיעה"' +
              (entry.type === "נסיעה" ? " selected" : "") +
              ">נסיעה</option>" +
              '<option value="הפסקה"' +
              (entry.type === "הפסקה" ? " selected" : "") +
              ">הפסקה</option>" +
              '<option value="איסוף"' +
              (entry.type === "איסוף" ? " selected" : "") +
              ">איסוף</option>" +
              '<option value="סוף יום"' +
              (entry.type === "סוף יום" ? " selected" : "") +
              ">סוף יום</option>" +
              "</select></div>" +
              "</div>" +
              descArea +
              stopsArea +
              '<button class="btn btn-secondary btn-sm" data-act="add-ss" data-r="' +
              ri +
              '" data-e="' +
              ei +
              '" style="margin-top:4px">+ הוסף תחנות</button>' +
              "</div>" +
              "</div>"
            );
          })
          .join("");

        return (
          '<div class="route-editor-card">' +
          '<div class="route-editor-header"><div class="route-editor-title"><span class="route-badge">' +
          (ri + 1) +
          "</span><span>" +
          esc(route.name) +
          "</span></div>" +
          '<div class="unit-editor-meta"><span class="dept-count-badge">' +
          ec +
          " רשומות</span>" +
          chevronSvg +
          "</div></div>" +
          '<div class="route-editor-body">' +
          '<div class="form-row">' +
          '<div class="form-group"><label>שם הקו</label><input class="form-control" value="' +
          esc(route.name) +
          '" data-f="srn" data-r="' +
          ri +
          '"></div>' +
          '<div class="form-group"><label>טלפון</label><input class="form-control" value="' +
          esc(route.phone || "") +
          '" data-f="srp" data-r="' +
          ri +
          '" style="direction:ltr;text-align:left"></div>' +
          '</div><hr class="divider">' +
          '<div class="sched-editor-list">' +
          entries +
          "</div>" +
          '<div class="add-item-row"><button class="btn btn-secondary btn-sm" data-act="add-se" data-r="' +
          ri +
          '">+ הוסף רשומה</button></div>' +
          "</div></div>"
        );
      })
      .join("");

    bindSchedulesEvents(c);
  }

  function bindSchedulesEvents(c) {
    c.querySelectorAll(".route-editor-header").forEach(function (h) {
      h.addEventListener("click", function () {
        h.parentElement.classList.toggle("open");
      });
    });
    c.querySelectorAll(".sched-entry-header").forEach(function (h) {
      h.addEventListener("click", function (e) {
        if (e.target.closest("[data-act]")) return;
        h.parentElement.classList.toggle("open");
      });
    });

    c.addEventListener("input", function (e) {
      var el = e.target,
        f = el.getAttribute("data-f");
      if (!f) return;
      var ri = +el.getAttribute("data-r"),
        ei = el.getAttribute("data-e");
      ei = ei != null ? +ei : -1;

      if (f === "srn") {
        editSchedules[ri].name = el.value;
        el
          .closest(".route-editor-card")
          .querySelector(".route-editor-title > span:last-child").textContent =
          el.value;
      }
      if (f === "srp") editSchedules[ri].phone = el.value || "";
      if (f === "st" && ei >= 0) {
        editSchedules[ri].schedule[ei].time = el.value;
        el
          .closest(".sched-entry-editor")
          .querySelector(".sched-entry-time-display").textContent = el.value;
      }
      if (f === "sd" && ei >= 0)
        editSchedules[ri].schedule[ei].description = el.value || undefined;
      if (f === "ss" && ei >= 0)
        editSchedules[ri].schedule[ei].stops = el.value
          .split("\n")
          .filter(function (s) {
            return s.trim();
          });
      markDirty("schedules");
    });

    c.addEventListener("change", function (e) {
      var el = e.target;
      if (el.getAttribute("data-f") === "sy") {
        var ri = +el.getAttribute("data-r"),
          ei = +el.getAttribute("data-e");
        editSchedules[ri].schedule[ei].type = el.value;
        var tag = el
          .closest(".sched-entry-editor")
          .querySelector(".sched-type-tag");
        tag.className = "sched-type-tag " + schedTypeClass(el.value);
        tag.textContent = el.value;
        markDirty("schedules");
      }
    });

    c.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act"),
        ri = +btn.getAttribute("data-r");
      var ei = btn.getAttribute("data-e");
      ei = ei != null ? +ei : -1;

      if (act === "add-se") {
        if (!editSchedules[ri].schedule) editSchedules[ri].schedule = [];
        editSchedules[ri].schedule.push({
          time: "00:00",
          type: "נסיעה",
          stops: [],
        });
        markDirty("schedules");
        renderSchedulesTab();
        openSchedCard(ri);
      }
      if (act === "del-se" && ei >= 0) {
        editSchedules[ri].schedule.splice(ei, 1);
        markDirty("schedules");
        renderSchedulesTab();
        openSchedCard(ri);
      }
      if (act === "add-ss" && ei >= 0) {
        if (!editSchedules[ri].schedule[ei].stops)
          editSchedules[ri].schedule[ei].stops = [];
        editSchedules[ri].schedule[ei].stops.push("תחנה חדשה");
        markDirty("schedules");
        renderSchedulesTab();
        openSchedCard(ri);
      }
    });
  }

  function openSchedCard(ri) {
    var cards = $("schedules-list").querySelectorAll(".route-editor-card");
    if (cards[ri]) cards[ri].classList.add("open");
  }

  $("save-schedules-btn").addEventListener("click", async function () {
    await persistSchedules();
    toast("לוחות זמנים נשמרו בהצלחה!", "success");
    renderDataInfo();
  });

  // ═══════════════════════════════════════════
  // SETTINGS TAB
  // ═══════════════════════════════════════════

  function bindSettingsEvents() {
    // Change password
    $("change-pwd-btn").addEventListener("click", async function () {
      var o = $("old-pwd").value,
        n = $("new-pwd").value,
        cn = $("confirm-pwd").value;
      if (o !== getPassword()) {
        toast("סיסמה נוכחית שגויה", "error");
        return;
      }
      if (!n || n.length < 4) {
        toast("סיסמה חדשה קצרה מדי (מינימום 4 תווים)", "error");
        return;
      }
      if (n !== cn) {
        toast("הסיסמאות אינן תואמות", "error");
        return;
      }

      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "change_password",
            password: o,
            newPassword: n,
          }),
        });
        if (res.ok) {
          localStorage.setItem(PASSWORD_KEY, n);
          $("old-pwd").value = $("new-pwd").value = $("confirm-pwd").value = "";
          toast("הסיסמה עודכנה בהצלחה!", "success");
        } else {
          toast("שגיאה בעדכון הסיסמה", "error");
        }
      } catch (e) {
        console.error("Error changing password", e);
        toast("שגיאה בעדכון הסיסמה", "error");
      }
    });

    // Reset
    $("reset-btn").addEventListener("click", async function () {
      if (!confirm("האם אתה בטוח? כל השינויים יימחקו ולא ניתן לשחזרם.")) return;

      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reset_data",
            password: getPassword(),
          }),
        });
        if (res.ok) {
          localStorage.removeItem(STORAGE_KEY);
          toast("הנתונים אופסו. הדף ירענן כעת...", "success");
          setTimeout(function () {
            location.reload();
          }, 1200);
        } else {
          toast("שגיאה באיפוס הנתונים", "error");
        }
      } catch (e) {
        console.error("Error resetting data", e);
        toast("שגיאה באיפוס הנתונים", "error");
      }
    });

    // Export
    $("export-btn").addEventListener("click", function () {
      var payload = {
        units: editUnits,
        bus_routes: editRoutes,
        old_routes: editSchedules,
        _exported_at: new Date().toISOString(),
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download =
        "shuttle-data-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("נתונים יוצאו בהצלחה!", "success");
    });

    // Import
    var impF = $("import-file");
    $("import-btn").addEventListener("click", function () {
      impF.click();
    });
    impF.addEventListener("change", function () {
      var file = impF.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = async function (e) {
        try {
          var d = JSON.parse(e.target.result);
          if (d.units) editUnits = d.units;
          if (d.bus_routes) editRoutes = d.bus_routes;
          if (d.old_routes) editSchedules = d.old_routes;
          await persistAll();
          renderUnitsTab();
          renderRoutesTab();
          renderSchedulesTab();
          renderDataInfo();
          toast("נתונים יובאו בהצלחה!", "success");
        } catch (err) {
          toast("שגיאה בקריאת הקובץ: " + err.message, "error");
        }
      };
      reader.readAsText(file);
      impF.value = "";
    });
  }

  async function renderDataInfo() {
    var stored = await loadStored();
    var dc = editUnits.reduce(function (s, u) {
      return s + (u.departments ? u.departments.length : 0);
    }, 0);
    var se = editSchedules.reduce(function (s, r) {
      return s + (r.schedule ? r.schedule.length : 0);
    }, 0);
    var has = stored && stored.units && stored.units.length > 0;

    $("data-info").innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      "<div><strong>יחידות:</strong> " +
      editUnits.length +
      "</div>" +
      "<div><strong>מחלקות:</strong> " +
      dc +
      "</div>" +
      "<div><strong>קווי שאטל:</strong> " +
      editRoutes.length +
      "</div>" +
      "<div><strong>לוחות זמנים:</strong> " +
      editSchedules.length +
      " (" +
      se +
      " רשומות)</div>" +
      "<div><strong>נתונים מותאמים:</strong> " +
      (has ? "כן" : "לא — ברירת מחדל") +
      "</div>" +
      (stored && stored._saved_at
        ? "<div><strong>עדכון אחרון:</strong> " +
          new Date(stored._saved_at).toLocaleString("he-IL") +
          "</div>"
        : "") +
      "</div>";
  }
})();
