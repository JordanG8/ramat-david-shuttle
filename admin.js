// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — ADMIN DASHBOARD
// ═══════════════════════════════════════════
// Depends on app.js being loaded first (DATA, OLD_ROUTES globals)

import { inject } from '@vercel/analytics';
import "./src/styles/admin.css";

// Initialize Vercel Analytics
inject();

(function AdminDashboard() {
  "use strict";

  /* ─── Constants ─── */
  var STORAGE_KEY = "shuttle_admin_data";

  /* ─── Helpers ─── */
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function $(id) {
    return document.getElementById(id);
  }

  function timeStr() {
    return new Date().toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
  var dirtyRouteIndices = new Set();
  var csvModeRoutes = new Set();

  /* ─── Per-card UI state for the routes editor (survives re-renders) ─── */
  var routeUI = {};

  function getRouteUI(ri) {
    if (!routeUI[ri]) routeUI[ri] = { open: false, tab: null, subTab: {} };
    return routeUI[ri];
  }

  // ═══════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════

  async function checkAuth() {
    try {
      const res = await fetch("/api/verify");
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async function doLogin(pwd) {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      return res.ok;
    } catch (e) {
      console.error("Login error", e);
      return false;
    }
  }

  async function doLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    }
    location.reload();
  }

  var loginScreen = $("login-screen");
  var dashboard = $("dashboard");

  // Check auth on load
  checkAuth().then((isLoggedIn) => {
    if (isLoggedIn) {
      loginScreen.style.display = "none";
      dashboard.style.display = "flex";
      bootDashboard();
    } else {
      loginScreen.style.display = "flex";
      dashboard.style.display = "none";
    }
  });

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
    if (serverData && serverData.old_routes) {
      editSchedules = clone(serverData.old_routes);
      if (typeof OLD_ROUTES !== "undefined")
        OLD_ROUTES = clone(serverData.old_routes);
    }
    editRoutes.forEach(normalizeRouteTimes);

    initTabs();
    initGlobalSave();
    initHistoryModal();
    renderUnitsTab();
    renderRoutesTab();
    renderSchedulesTab();
    renderDataInfo();
    bindSettingsEvents();
    updateSaveStatus();
    checkForDraft();
  }

  // Replace the working copies with an external payload (draft, restored
  // version, imported file) and repaint every tab.
  function applyDataInto(d) {
    if (d.units) editUnits = clone(d.units);
    if (d.bus_routes) editRoutes = clone(d.bus_routes);
    if (d.old_routes) editSchedules = clone(d.old_routes);
    editRoutes.forEach(normalizeRouteTimes);
    renderUnitsTab();
    renderRoutesTab();
    renderSchedulesTab();
    renderDataInfo();
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

  // ─── Global Publish Button ───
  function initGlobalSave() {
    $("global-save-btn").addEventListener("click", function () {
      var parts = [];
      if (dirtyUnits) parts.push("יחידות ותחנות");
      if (dirtyRoutes) parts.push("קווי שאטל");
      if (dirtySchedules) parts.push("לוחות זמנים");
      if (!parts.length) return;
      publishAll("עדכון: " + parts.join(", "));
    });
    updateSaveStatus();
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

  // ─── Save-status (global button) ───
  function updateSaveStatus() {
    var b = $("global-save-btn");
    if (!b) return;
    var dirty = dirtyUnits || dirtyRoutes || dirtySchedules;
    b.disabled = !dirty;
    if (dirty) {
      b.classList.add("has-changes");
    } else {
      b.classList.remove("has-changes");
    }
  }

  function markDirty(w, ri) {
    if (w === "units") dirtyUnits = true;
    if (w === "routes") {
      dirtyRoutes = true;
      if (ri != null) {
        dirtyRouteIndices.add(ri);
        var card = document.querySelector(
          '#routes-list .route-editor-card[data-ri="' + ri + '"]',
        );
        if (card) card.classList.add("route-dirty");
      }
    }
    if (w === "schedules") dirtySchedules = true;
    updateSaveStatus();
    scheduleDraftSave();
  }

  // ═══════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════

  async function loadStored() {
    try {
      const res = await fetch("/api/data?t=" + new Date().getTime());
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

  function currentPayload() {
    return {
      units: editUnits,
      bus_routes: editRoutes,
      old_routes: editSchedules,
      _saved_at: new Date().toISOString(),
    };
  }

  async function saveToServer(data, label) {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: data, label: label }),
      });
      if (!res.ok) {
        if (res.status === 401) doLogout();
        toast("שגיאה בשמירת הנתונים", "error");
        return false;
      }
      return true;
    } catch (e) {
      console.error("Error saving data", e);
      toast("שגיאה בשמירת הנתונים", "error");
      return false;
    }
  }

  // Publish everything that changed: one write, one history version.
  async function publishAll(label) {
    if (draftTimer) {
      clearTimeout(draftTimer);
      draftTimer = null;
    }
    var ok = await saveToServer(currentPayload(), label);
    if (!ok) return false;
    DATA.units = clone(editUnits);
    DATA.bus_routes = clone(editRoutes);
    if (typeof OLD_ROUTES !== "undefined") OLD_ROUTES = clone(editSchedules);
    dirtyUnits = dirtyRoutes = dirtySchedules = false;
    dirtyRouteIndices.clear();
    document
      .querySelectorAll("#routes-list .route-editor-card.route-dirty")
      .forEach(function (el) {
        el.classList.remove("route-dirty");
      });
    updateSaveStatus();
    setDraftStatus("פורסם " + timeStr(), "published");
    hideDraftBanner();
    toast("השינויים פורסמו בהצלחה!", "success");
    renderDataInfo();
    return true;
  }

  // ═══════════════════════════════════════════
  // DRAFTS — autosaved to the DB while editing
  // ═══════════════════════════════════════════

  var draftTimer = null;
  var DRAFT_DEBOUNCE_MS = 3000;

  function setDraftStatus(text, kind) {
    var el = $("draft-status");
    if (!el) return;
    el.textContent = text || "";
    el.className = "adm-draft-status" + (kind ? " " + kind : "");
  }

  function scheduleDraftSave() {
    if (draftTimer) clearTimeout(draftTimer);
    setDraftStatus("שינויים לא שמורים…", "pending");
    draftTimer = setTimeout(saveDraftNow, DRAFT_DEBOUNCE_MS);
  }

  async function saveDraftNow() {
    draftTimer = null;
    if (!(dirtyUnits || dirtyRoutes || dirtySchedules)) return;
    try {
      var res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentPayload() }),
      });
      if (res.ok) {
        setDraftStatus("טיוטה נשמרה " + timeStr(), "saved");
      } else if (res.status === 401) {
        doLogout();
      } else {
        setDraftStatus("שגיאה בשמירת טיוטה", "error");
      }
    } catch (e) {
      setDraftStatus("שגיאה בשמירת טיוטה", "error");
    }
  }

  async function checkForDraft() {
    try {
      var res = await fetch("/api/draft");
      if (!res.ok) return;
      var body = await res.json();
      if (!body.draft || !body.draft.data) return;
      showDraftBanner(body.draft);
    } catch (e) {
      /* no draft — nothing to do */
    }
  }

  function showDraftBanner(draft) {
    hideDraftBanner();
    var when = draft.saved_at
      ? new Date(draft.saved_at).toLocaleString("he-IL", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";
    var b = document.createElement("div");
    b.id = "draft-banner";
    b.className = "draft-banner";
    b.innerHTML =
      '<span class="material-symbols-rounded draft-banner-icon">edit_note</span>' +
      '<div class="draft-banner-text"><strong>נמצאה טיוטה שטרם פורסמה</strong>' +
      "<span>" +
      (when ? "נשמרה לאחרונה ב־" + esc(when) : "") +
      "</span></div>" +
      '<div class="draft-banner-actions">' +
      '<button class="btn btn-primary btn-sm" id="draft-resume">המשך עריכה</button>' +
      '<button class="btn btn-ghost btn-sm" id="draft-discard">מחק טיוטה</button>' +
      "</div>";
    $("adm-main").prepend(b);
    $("draft-resume").addEventListener("click", function () {
      resumeDraft(draft);
    });
    $("draft-discard").addEventListener("click", discardDraft);
  }

  function hideDraftBanner() {
    var b = $("draft-banner");
    if (b) b.remove();
  }

  function resumeDraft(draft) {
    applyDataInto(draft.data);
    dirtyUnits = dirtyRoutes = dirtySchedules = true;
    updateSaveStatus();
    hideDraftBanner();
    setDraftStatus("טיוטה נטענה — טרם פורסם", "pending");
    toast("הטיוטה נטענה. לחצו ״פרסם שינויים״ כשתסיימו.", "success");
  }

  async function discardDraft() {
    try {
      await fetch("/api/draft", { method: "DELETE" });
    } catch (e) {
      /* best effort */
    }
    hideDraftBanner();
    setDraftStatus("", "");
    toast("הטיוטה נמחקה", "success");
  }

  // ═══════════════════════════════════════════
  // VERSION HISTORY
  // ═══════════════════════════════════════════

  function initHistoryModal() {
    if ($("history-modal")) return;
    var overlay = document.createElement("div");
    overlay.id = "history-modal";
    overlay.className = "adm-modal-overlay";
    overlay.innerHTML =
      '<div class="adm-modal">' +
      '<div class="adm-modal-header">' +
      '<div class="adm-modal-title"><span class="material-symbols-rounded">history</span>היסטוריית גרסאות</div>' +
      '<button class="adm-modal-close" id="history-close" title="סגור">✕</button>' +
      "</div>" +
      '<div class="adm-modal-sub">כל פרסום נשמר כגרסה. שחזור גרסה מחליף מיידית את הנתונים באתר.</div>' +
      '<div class="adm-modal-body" id="history-list"></div>' +
      "</div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeHistory();
    });
    $("history-close").addEventListener("click", closeHistory);
    var btn = $("history-btn");
    if (btn) btn.addEventListener("click", openHistory);
  }

  function closeHistory() {
    $("history-modal").classList.remove("open");
  }

  async function openHistory() {
    $("history-modal").classList.add("open");
    var list = $("history-list");
    list.innerHTML = '<div class="empty-state">טוען גרסאות…</div>';
    try {
      var res = await fetch("/api/history");
      if (res.status === 401) return doLogout();
      if (!res.ok) throw new Error("history " + res.status);
      var body = await res.json();
      renderHistoryList(body.versions || []);
    } catch (e) {
      console.error("Error loading history", e);
      list.innerHTML = '<div class="empty-state">שגיאה בטעינת ההיסטוריה</div>';
    }
  }

  function renderHistoryList(versions) {
    var list = $("history-list");
    if (!versions.length) {
      list.innerHTML =
        '<div class="empty-state">אין עדיין גרסאות שמורות.<br>כל לחיצה על ״פרסם שינויים״ תיצור כאן גרסה שניתן לחזור אליה.</div>';
      return;
    }
    list.innerHTML = versions
      .map(function (v, i) {
        var when = new Date(v.saved_at).toLocaleString("he-IL", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        var counts = "";
        try {
          var s = JSON.parse(v.summary || "");
          counts =
            s.routes + " קווים · " + s.units + " יחידות · " + s.schedules + " לוחות זמנים";
        } catch (e) {
          /* old rows may lack a summary */
        }
        return (
          '<div class="history-item' + (i === 0 ? " current" : "") + '">' +
          '<div class="history-item-info">' +
          '<div class="history-item-top"><span class="history-item-when">' +
          esc(when) +
          "</span>" +
          (i === 0
            ? '<span class="history-current-badge">גרסה נוכחית</span>'
            : "") +
          "</div>" +
          '<div class="history-item-label">' +
          esc(v.label || "פרסום") +
          "</div>" +
          (counts
            ? '<div class="history-item-counts">' + esc(counts) + "</div>"
            : "") +
          "</div>" +
          (i === 0
            ? ""
            : '<button class="btn btn-secondary btn-sm" data-restore="' +
              v.id +
              '">שחזר</button>') +
          "</div>"
        );
      })
      .join("");
    list.querySelectorAll("[data-restore]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        restoreVersion(+btn.getAttribute("data-restore"));
      });
    });
  }

  async function restoreVersion(id) {
    if (!confirm("לשחזר גרסה זו? הנתונים המפורסמים באתר יוחלפו מיידית."))
      return;
    try {
      var res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", id: id }),
      });
      if (res.status === 401) return doLogout();
      if (!res.ok) {
        toast("שגיאה בשחזור הגרסה", "error");
        return;
      }
      var body = await res.json();
      applyDataInto(body.data || {});
      DATA.units = clone(editUnits);
      DATA.bus_routes = clone(editRoutes);
      if (typeof OLD_ROUTES !== "undefined") OLD_ROUTES = clone(editSchedules);
      dirtyUnits = dirtyRoutes = dirtySchedules = false;
      dirtyRouteIndices.clear();
      updateSaveStatus();
      hideDraftBanner();
      setDraftStatus("שוחזר " + timeStr(), "published");
      closeHistory();
      toast("הגרסה שוחזרה ופורסמה!", "success");
    } catch (e) {
      console.error("Error restoring version", e);
      toast("שגיאה בשחזור הגרסה", "error");
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
          '<div class="unit-editor-card">' +
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


  // ═══════════════════════════════════════════
  // ROUTES TAB
  // ═══════════════════════════════════════════
  //
  // Each route is a collapsible card (all closed on load). An open card
  // shows a tab bar that cleanly separates the line's sections:
  //   · simple route:  שעות יציאה | תחנות עצירה | פרטי הקו
  //   · route with sub-routes:  a tab per sub-route + פרטי הקו,
  //     where each sub-route pane has a שעות/תחנות segmented switch.
  // Edits re-render ONLY the affected card, so the page never jumps.

  function routeRef(ri, si) {
    return si >= 0 ? editRoutes[ri].sub_routes[si] : editRoutes[ri];
  }

  function timeToMinutes(t) {
    var m = /(\d{1,2}):(\d{2})/.exec(t || "");
    return m ? +m[1] * 60 + +m[2] : 0;
  }

  function padTime(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m) return t;
    return (m[1].length < 2 ? "0" + m[1] : m[1]) + ":" + m[2];
  }

  // Legacy routes stored their times as a dash-separated string
  // (departure_times_str). Convert those to a departure_times array so every
  // line — including the 105/109 sub-routes — gets the same chip editor.
  function normalizeRouteTimes(route) {
    if (route.departure_times_str !== undefined && !route.departure_times) {
      route.departure_times = String(route.departure_times_str)
        .split("-")
        .map(function (t) {
          return t.trim();
        })
        .filter(Boolean)
        .map(function (t) {
          return { time: padTime(t) };
        });
      delete route.departure_times_str;
    }
    (route.sub_routes || []).forEach(normalizeRouteTimes);
  }

  // Keep a route's departure times in ascending chronological order so a newly
  // set time (e.g. 16:00) automatically lands right after 15:59.
  function sortRouteTimes(ri, si) {
    var ref = routeRef(ri, si);
    var times = ref && ref.departure_times;
    if (!times) return;
    times.sort(function (a, b) {
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  }

  // "פיזור למקומות עבודה - מסלול 105" → "מסלול 105"
  function shortSubName(sr, si) {
    var name = (sr && sr.name) || "";
    var m = /(מסלול.*)$/.exec(name);
    var label = m ? m[1].trim() : name.trim();
    return label || "תת-מסלול " + (si + 1);
  }

  function timesCount(ref) {
    return ref && ref.departure_times ? ref.departure_times.length : 0;
  }

  function stopsCount(ref) {
    return ref && ref.stops ? ref.stops.length : 0;
  }

  // ─── Card skeleton ───

  function buildRouteCardHtml(route, ri) {
    var ui = getRouteUI(ri);
    var hasSub = route.sub_routes && route.sub_routes.length > 0;

    // Sanitize the active tab (sub-routes may have been added/removed).
    if (!ui.tab) ui.tab = hasSub ? "sub-0" : "times";
    if (/^sub-/.test(ui.tab)) {
      var subIdx = +ui.tab.slice(4);
      if (!hasSub) ui.tab = "times";
      else if (subIdx >= route.sub_routes.length) ui.tab = "sub-0";
    } else if (hasSub && ui.tab !== "details") {
      ui.tab = "sub-0";
    }

    var badge = hasSub
      ? route.sub_routes.length + " מסלולים"
      : stopsCount(route) + " תחנות · " + timesCount(route) + " יציאות";

    var header =
      '<div class="route-editor-header" data-r="' + ri + '">' +
      '<div class="route-editor-title"><span class="route-badge">' +
      (ri + 1) +
      '</span><span class="route-card-name">' +
      esc(route.name) +
      "</span></div>" +
      '<div class="route-header-actions"><span class="route-meta-badge">' +
      badge +
      "</span>" +
      chevronSvg +
      "</div></div>";

    var body = "";
    if (ui.open) {
      var pane;
      if (ui.tab === "details") pane = buildDetailsPane(route, ri);
      else if (/^sub-/.test(ui.tab)) pane = buildSubPane(ri, +ui.tab.slice(4));
      else if (ui.tab === "stops") pane = buildStopsPane(ri, -1);
      else pane = buildTimesPane(ri, -1);
      body =
        '<div class="route-editor-body">' +
        buildRouteTabsHtml(route, ri, ui) +
        '<div class="route-tab-pane">' +
        pane +
        "</div></div>";
    }

    return (
      '<div class="route-editor-card' +
      (ui.open ? " open" : "") +
      (dirtyRouteIndices.has(ri) ? " route-dirty" : "") +
      '" data-ri="' +
      ri +
      '">' +
      header +
      body +
      "</div>"
    );
  }

  function buildRouteTabsHtml(route, ri, ui) {
    var hasSub = route.sub_routes && route.sub_routes.length > 0;
    var tabs = [];
    if (hasSub) {
      route.sub_routes.forEach(function (sr, si) {
        tabs.push({
          id: "sub-" + si,
          icon: "alt_route",
          label: shortSubName(sr, si),
        });
      });
    } else {
      tabs.push({
        id: "times",
        icon: "schedule",
        label: "שעות יציאה",
        count: timesCount(route),
      });
      tabs.push({
        id: "stops",
        icon: "location_on",
        label: "תחנות עצירה",
        count: stopsCount(route),
      });
    }
    tabs.push({ id: "details", icon: "tune", label: "פרטי הקו" });

    return (
      '<div class="route-tabbar" role="tablist">' +
      tabs
        .map(function (t) {
          return (
            '<button class="route-tab' +
            (ui.tab === t.id ? " active" : "") +
            '" role="tab" data-act="card-tab" data-r="' +
            ri +
            '" data-tab="' +
            t.id +
            '">' +
            '<span class="material-symbols-rounded">' +
            t.icon +
            "</span><span>" +
            esc(t.label) +
            "</span>" +
            (t.count != null
              ? '<span class="route-tab-count">' + t.count + "</span>"
              : "") +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  // ─── Panes ───

  function buildTimesPane(ri, si) {
    var ref = routeRef(ri, si);
    var times = ref.departure_times || [];
    var sp = si >= 0 ? ' data-s="' + si + '"' : "";
    var csvKey = (si >= 0 ? ri + "-" + si : ri) + "-times";
    var isCsv = csvModeRoutes.has(csvKey);

    var toggleBtn =
      '<button class="csv-toggle-btn" data-act="toggle-csv" data-r="' +
      ri + '"' + sp + ' data-csv-key="' + csvKey + '" title="' +
      (isCsv ? "חזרה לתצוגת שעונים" : "עריכה מהירה כטקסט") + '">' +
      '<span class="material-symbols-rounded">' +
      (isCsv ? "schedule" : "edit_note") +
      "</span></button>";
    var addBtn =
      '<button class="btn btn-secondary btn-sm" data-act="add-tm" data-r="' +
      ri + '"' + sp + ">+ שעה</button>";

    var toolbar =
      '<div class="pane-toolbar">' +
      '<div class="pane-hint">לחיצה על <b>ת</b> מסמנת שעת תגבור (ימי א׳ וה׳ בלבד)</div>' +
      '<div class="pane-actions">' + addBtn + toggleBtn + "</div></div>";

    var content;
    if (isCsv) {
      var csvText = times
        .map(function (t) {
          return t.time + (t.note ? " | " + t.note : "");
        })
        .join("\n");
      content =
        '<textarea class="form-control csv-textarea" data-f="csv-times" data-r="' +
        ri + '"' + sp +
        ' style="direction:ltr;text-align:left" placeholder="שעה אחת בכל שורה...\n07:20\n08:00 | תגבור" rows="' +
        Math.max(4, times.length + 1) + '">' + esc(csvText) + "</textarea>";
    } else if (!times.length) {
      content =
        '<div class="pane-empty"><span class="material-symbols-rounded">schedule</span>אין שעות יציאה עדיין — הוסיפו שעה ראשונה</div>';
    } else {
      content =
        '<div class="times-editor-list">' +
        times
          .map(function (t, ti) {
            var rein = t.note && t.note.indexOf("תגבור") >= 0;
            return (
              '<div class="time-chip' + (rein ? " reinforce" : "") + '">' +
              '<input type="time" value="' + esc(t.time) +
              '" data-f="tv" data-r="' + ri + '"' + sp +
              ' data-t="' + ti + '">' +
              '<button class="time-chip-reinforce-toggle" data-act="tog-rein" data-r="' +
              ri + '"' + sp + ' data-t="' + ti + '" title="תגבור">ת</button>' +
              '<button class="time-chip-del" data-act="del-tm" data-r="' +
              ri + '"' + sp + ' data-t="' + ti + '">✕</button>' +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    }

    var evening = "";
    if (si < 0 && editRoutes[ri].evening) {
      evening =
        '<div class="pane-evening">' +
        '<div class="pane-evening-title"><span class="material-symbols-rounded">dark_mode</span>לוח ערב</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>שעות ערב</label><input class="form-control" value="' +
        esc(editRoutes[ri].evening.time) +
        '" data-f="ret" data-r="' + ri +
        '" style="direction:ltr;text-align:left"></div>' +
        '<div class="form-group"><label>הפסקה</label><input class="form-control" value="' +
        esc(editRoutes[ri].evening["break"] || "") +
        '" data-f="reb" data-r="' + ri +
        '" style="direction:ltr;text-align:left"></div></div></div>';
    }

    return toolbar + content + evening;
  }

  function buildStopsPane(ri, si) {
    var ref = routeRef(ri, si);
    var stops = ref.stops || [];
    var sp = si >= 0 ? ' data-s="' + si + '"' : "";
    var csvKey = ri + "-" + si;
    var isCsv = csvModeRoutes.has(csvKey);

    var toggleBtn =
      '<button class="csv-toggle-btn" data-act="toggle-csv" data-r="' +
      ri + '"' + sp + ' data-csv-key="' + csvKey + '" title="' +
      (isCsv ? "חזרה לתצוגת רשימה" : "עריכה מהירה כטקסט") + '">' +
      '<span class="material-symbols-rounded">' +
      (isCsv ? "list" : "edit_note") +
      "</span></button>";
    var addBtn =
      '<button class="btn btn-secondary btn-sm" data-act="add-stp" data-r="' +
      ri + '"' + sp + ">+ תחנה</button>";

    var toolbar =
      '<div class="pane-toolbar">' +
      '<div class="pane-hint">גררו תחנה כדי לשנות את סדר הנסיעה</div>' +
      '<div class="pane-actions">' + addBtn + toggleBtn + "</div></div>";

    var content;
    if (isCsv) {
      content =
        '<textarea class="form-control csv-textarea" data-f="csv-stops" data-r="' +
        ri + '"' + sp + ' placeholder="תחנה אחת בכל שורה..." rows="' +
        Math.max(4, stops.length + 1) + '">' +
        esc(stops.join("\n")) + "</textarea>";
    } else if (!stops.length) {
      content =
        '<div class="pane-empty"><span class="material-symbols-rounded">location_off</span>אין תחנות עדיין — הוסיפו תחנה ראשונה</div>';
    } else {
      content =
        '<div class="stops-editor-list">' +
        stops
          .map(function (stop, idx) {
            return (
              '<div class="stop-editor-item" draggable="true" data-r="' +
              ri + '"' + sp + ' data-i="' + idx + '">' +
              '<span class="stop-drag-handle material-symbols-rounded" title="גרור לסידור">drag_indicator</span>' +
              '<span class="stop-num-badge">' + (idx + 1) + "</span>" +
              '<input class="form-control" style="flex:1" value="' +
              esc(stop) + '" data-f="stp" data-r="' + ri + '"' + sp +
              ' data-i="' + idx + '">' +
              '<div class="stop-move-btns">' +
              '<button class="stop-move-btn" data-act="stop-up" data-r="' +
              ri + '"' + sp + ' data-i="' + idx + '">▲</button>' +
              '<button class="stop-move-btn" data-act="stop-dn" data-r="' +
              ri + '"' + sp + ' data-i="' + idx + '">▼</button>' +
              "</div>" +
              '<button class="btn btn-danger btn-sm btn-icon" data-act="del-stp" data-r="' +
              ri + '"' + sp + ' data-i="' + idx + '">✕</button>' +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    }

    return toolbar + content;
  }

  function buildDetailsPane(route, ri) {
    var hasSub = route.sub_routes && route.sub_routes.length > 0;
    var html =
      '<div class="form-row">' +
      '<div class="form-group"><label>שם הקו</label><input class="form-control" value="' +
      esc(route.name) + '" data-f="rn" data-r="' + ri + '"></div>' +
      '<div class="form-group"><label>תיאור</label><input class="form-control" value="' +
      esc(route.description || "") + '" data-f="rd" data-r="' + ri +
      '"></div></div>' +
      '<div class="form-row single"><div class="form-group"><label>הערה (מוצגת באתר)</label><input class="form-control" value="' +
      esc(route.note || "") + '" data-f="rno" data-r="' + ri +
      '" placeholder="למשל: איסוף ממקומות העבודה בסוף יום..."></div></div>';
    if (hasSub) {
      html +=
        '<div class="add-item-row"><button class="btn btn-secondary btn-sm" data-act="add-sub" data-r="' +
        ri + '">+ הוסף תת-מסלול</button></div>';
    }
    return html;
  }

  function buildSubPane(ri, si) {
    var ui = getRouteUI(ri);
    var sr = editRoutes[ri].sub_routes[si];
    if (!sr) return "";
    var seg = ui.subTab[si] || "times";

    function segBtn(id, icon, label, count) {
      return (
        '<button class="seg-btn' + (seg === id ? " active" : "") +
        '" data-act="sub-seg" data-r="' + ri + '" data-s="' + si +
        '" data-seg="' + id + '">' +
        '<span class="material-symbols-rounded">' + icon + "</span>" +
        esc(label) +
        '<span class="route-tab-count">' + count + "</span></button>"
      );
    }

    return (
      '<div class="subpane-head">' +
      '<div class="form-group" style="flex:1"><label>שם תת-המסלול</label>' +
      '<input class="form-control" value="' + esc(sr.name) +
      '" data-f="sn" data-r="' + ri + '" data-s="' + si +
      '" placeholder="שם תת-מסלול"></div>' +
      '<button class="btn btn-danger btn-sm btn-icon" data-act="del-sub" data-r="' +
      ri + '" data-s="' + si + '" title="מחק תת-מסלול">✕</button>' +
      "</div>" +
      '<div class="segmented">' +
      segBtn("times", "schedule", "שעות יציאה", timesCount(sr)) +
      segBtn("stops", "location_on", "תחנות עצירה", stopsCount(sr)) +
      "</div>" +
      (seg === "stops" ? buildStopsPane(ri, si) : buildTimesPane(ri, si))
    );
  }

  // ─── Render / targeted re-render ───

  function renderRoutesTab() {
    var c = $("routes-list");
    if (!editRoutes.length) {
      c.innerHTML = '<div class="empty-state">אין קווי שאטל.</div>';
      return;
    }
    c.innerHTML = editRoutes
      .map(function (route, ri) {
        return buildRouteCardHtml(route, ri);
      })
      .join("");
    bindRoutesDelegatedOnce(c);
  }

  // Re-render a single card in place. The rest of the page — including the
  // scroll position and every other open card — is untouched.
  function rerenderCard(ri) {
    var c = $("routes-list");
    var card = c.querySelector('.route-editor-card[data-ri="' + ri + '"]');
    if (!card || !editRoutes[ri]) {
      renderRoutesTab();
      return;
    }
    var tmp = document.createElement("div");
    tmp.innerHTML = buildRouteCardHtml(editRoutes[ri], ri);
    card.replaceWith(tmp.firstElementChild);
  }

  // ─── Bind delegated events ONCE on the routes container ───
  var routesDelegated = false;
  var dragState = null;

  function bindRoutesDelegatedOnce(c) {
    if (routesDelegated) return;
    routesDelegated = true;

    c.addEventListener("input", function (e) {
      var el = e.target,
        f = el.getAttribute("data-f");
      if (!f) return;
      var ri = +el.getAttribute("data-r"),
        si = el.getAttribute("data-s");
      si = si != null ? +si : -1;

      if (f === "rn") {
        editRoutes[ri].name = el.value;
        var nameEl = el
          .closest(".route-editor-card")
          .querySelector(".route-card-name");
        if (nameEl) nameEl.textContent = el.value;
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
      if (f === "tv") {
        var ti = +el.getAttribute("data-t");
        var tref = routeRef(ri, si);
        if (tref.departure_times) tref.departure_times[ti].time = el.value;
      }
      if (f === "csv-stops") {
        var sref = routeRef(ri, si);
        sref.stops = el.value.split("\n").filter(function (l) {
          return l.trim();
        });
      }
      if (f === "csv-times") {
        var lines = el.value.split("\n").filter(function (l) {
          return l.trim();
        });
        routeRef(ri, si).departure_times = lines.map(function (line) {
          var parts = line.split("|");
          var t = { time: padTime(parts[0].trim()) };
          if (parts[1] && parts[1].trim()) t.note = parts[1].trim();
          return t;
        });
      }
      markDirty("routes", ri);
    });

    // When a time input is committed (blur), re-sort the times so they stay
    // chronological — then repaint just this card.
    c.addEventListener("change", function (e) {
      var el = e.target;
      if (el.getAttribute("data-f") !== "tv") return;
      var ri = +el.getAttribute("data-r");
      var si = el.getAttribute("data-s");
      si = si != null ? +si : -1;
      var ref = editRoutes[ri] && routeRef(ri, si);
      if (!ref || !ref.departure_times) return;
      sortRouteTimes(ri, si);
      markDirty("routes", ri);
      rerenderCard(ri);
    });

    c.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      // Ignore actions from other tabs (schedules use the same pattern)
      if (btn && btn.closest("#routes-list")) {
        handleRouteAction(btn);
        return;
      }
      var head = e.target.closest(".route-editor-header");
      if (head && head.closest("#routes-list")) {
        var ri = +head.getAttribute("data-r");
        var ui = getRouteUI(ri);
        ui.open = !ui.open;
        rerenderCard(ri);
      }
    });

    // ─── Drag-to-Reorder Stops ───
    c.addEventListener("dragstart", function (e) {
      var item = e.target.closest(".stop-editor-item[draggable]");
      if (!item) return;
      dragState = {
        ri: +item.getAttribute("data-r"),
        si: item.getAttribute("data-s") != null ? +item.getAttribute("data-s") : -1,
        idx: +item.getAttribute("data-i")
      };
      item.classList.add("stop-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
    });
    c.addEventListener("dragover", function (e) {
      var item = e.target.closest(".stop-editor-item[draggable]");
      if (!item || !dragState) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      var rect = item.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      item.classList.remove("stop-drop-above", "stop-drop-below");
      if (e.clientY < midY) item.classList.add("stop-drop-above");
      else item.classList.add("stop-drop-below");
    });
    c.addEventListener("dragleave", function (e) {
      var item = e.target.closest(".stop-editor-item[draggable]");
      if (item) item.classList.remove("stop-drop-above", "stop-drop-below");
    });
    c.addEventListener("drop", function (e) {
      e.preventDefault();
      var item = e.target.closest(".stop-editor-item[draggable]");
      if (!item || !dragState) return;
      var targetIdx = +item.getAttribute("data-i");
      var targetRi = +item.getAttribute("data-r");
      var targetSi = item.getAttribute("data-s") != null ? +item.getAttribute("data-s") : -1;
      if (targetRi !== dragState.ri || targetSi !== dragState.si) return;
      if (targetIdx === dragState.idx) return;
      var rect = item.getBoundingClientRect();
      var dropAfter = e.clientY > rect.top + rect.height / 2;
      var s = routeRef(dragState.ri, dragState.si).stops;
      var moved = s.splice(dragState.idx, 1)[0];
      var insertAt = targetIdx;
      if (dragState.idx < targetIdx) insertAt--;
      if (dropAfter) insertAt++;
      s.splice(insertAt, 0, moved);
      markDirty("routes", dragState.ri);
      dragState = null;
      rerenderCard(targetRi);
    });
    c.addEventListener("dragend", function () {
      dragState = null;
      c.querySelectorAll(".stop-dragging, .stop-drop-above, .stop-drop-below").forEach(function (el) {
        el.classList.remove("stop-dragging", "stop-drop-above", "stop-drop-below");
      });
    });
  }

  function handleRouteAction(btn) {
    var act = btn.getAttribute("data-act"),
      ri = +btn.getAttribute("data-r");
    var si = btn.getAttribute("data-s");
    si = si != null ? +si : -1;
    var idx = btn.getAttribute("data-i");
    idx = idx != null ? +idx : -1;
    var ti = btn.getAttribute("data-t");
    ti = ti != null ? +ti : -1;
    var ui = getRouteUI(ri);

    if (act === "card-tab") {
      ui.tab = btn.getAttribute("data-tab");
      rerenderCard(ri);
    }
    if (act === "sub-seg" && si >= 0) {
      ui.subTab[si] = btn.getAttribute("data-seg");
      rerenderCard(ri);
    }
    if (act === "toggle-csv") {
      var key = btn.getAttribute("data-csv-key");
      if (csvModeRoutes.has(key)) csvModeRoutes.delete(key);
      else csvModeRoutes.add(key);
      rerenderCard(ri);
    }
    if (act === "add-stp") {
      var ref = routeRef(ri, si);
      if (!ref.stops) ref.stops = [];
      ref.stops.push("תחנה חדשה");
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "del-stp" && idx >= 0) {
      routeRef(ri, si).stops.splice(idx, 1);
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "stop-up" && idx > 0) {
      var s1 = routeRef(ri, si).stops;
      var t1 = s1[idx - 1];
      s1[idx - 1] = s1[idx];
      s1[idx] = t1;
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "stop-dn") {
      var s2 = routeRef(ri, si).stops;
      if (idx >= 0 && idx < s2.length - 1) {
        var t2 = s2[idx + 1];
        s2[idx + 1] = s2[idx];
        s2[idx] = t2;
        markDirty("routes", ri);
        rerenderCard(ri);
      }
    }
    if (act === "add-tm") {
      var tref = routeRef(ri, si);
      if (!tref.departure_times) tref.departure_times = [];
      tref.departure_times.push({ time: "08:00" });
      sortRouteTimes(ri, si);
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "del-tm" && ti >= 0) {
      routeRef(ri, si).departure_times.splice(ti, 1);
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "tog-rein" && ti >= 0) {
      var dt = routeRef(ri, si).departure_times[ti];
      if (dt.note && dt.note.indexOf("תגבור") >= 0) delete dt.note;
      else dt.note = "תגבור- רק בימי ראשון וחמישי";
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "add-sub") {
      if (!editRoutes[ri].sub_routes) editRoutes[ri].sub_routes = [];
      editRoutes[ri].sub_routes.push({
        name: "תת-מסלול חדש",
        departure_times: [],
        stops: [],
      });
      ui.tab = "sub-" + (editRoutes[ri].sub_routes.length - 1);
      markDirty("routes", ri);
      rerenderCard(ri);
    }
    if (act === "del-sub" && si >= 0) {
      if (!confirm("למחוק תת-מסלול זה?")) return;
      editRoutes[ri].sub_routes.splice(si, 1);
      ui.tab = editRoutes[ri].sub_routes.length ? "sub-0" : "details";
      delete ui.subTab[si];
      markDirty("routes", ri);
      rerenderCard(ri);
    }
  }

  // ─── Collapse / Expand All Routes ───
  var routesAllOpen = false;
  $("toggle-all-routes").addEventListener("click", function () {
    routesAllOpen = !routesAllOpen;
    editRoutes.forEach(function (_, ri) {
      getRouteUI(ri).open = routesAllOpen;
    });
    renderRoutesTab();
    var btn = $("toggle-all-routes");
    btn.querySelector(".material-symbols-rounded").textContent = routesAllOpen ? "unfold_less" : "unfold_more";
    btn.querySelector("span:last-child").textContent = routesAllOpen ? "סגור הכל" : "פתח הכל";
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

  var schedulesDelegated = false;

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
    // Header toggles are re-bound each render (elements are recreated).
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

    // Container-level delegated listeners must bind ONCE. The container element
    // persists across renders, so re-binding here would stack handlers and make
    // a single click fire multiple times (duplicating entries).
    if (schedulesDelegated) return;
    schedulesDelegated = true;

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


  // ═══════════════════════════════════════════
  // SETTINGS TAB
  // ═══════════════════════════════════════════

  function bindSettingsEvents() {
    // Change password
    $("change-pwd-btn").addEventListener("click", async function () {
      var n = $("new-pwd").value,
        cn = $("confirm-pwd").value;
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
            newPassword: n,
          }),
        });
        if (res.ok) {
          $("old-pwd").value = $("new-pwd").value = $("confirm-pwd").value = "";
          toast("הסיסמה עודכנה בהצלחה!", "success");
        } else {
          if (res.status === 401) doLogout();
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
          }),
        });
        if (res.ok) {
          localStorage.removeItem(STORAGE_KEY);
          toast("הנתונים אופסו. הדף ירענן כעת...", "success");
          setTimeout(function () {
            location.reload();
          }, 1200);
        } else {
          if (res.status === 401) doLogout();
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
          applyDataInto(d);
          await publishAll("ייבוא מקובץ JSON");
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
