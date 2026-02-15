// משתנים גלובליים
let shuttleData = null;
let currentView = "home";
let currentRoute = null;

// טעינת נתונים
async function loadData() {
  try {
    const response = await fetch("shuttle-data.json");
    shuttleData = await response.json();
    initApp();
  } catch (error) {
    console.error("שגיאה בטעינת נתונים:", error);
  }
}

// אתחול האפליקציה
function initApp() {
  updateTime();
  setInterval(updateTime, 1000);
  renderRoutes();
  renderUpcoming();
  renderStops();
  setupSearch();
  setupDestinationPlanner();
}

// עדכון תצוגת שעה
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const timeEl = document.getElementById("currentTime");
  const dateEl = document.getElementById("currentDate");
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

// רינדור כרטיסי קווים
function renderRoutes() {
  const grid = document.getElementById("routesGrid");
  grid.innerHTML = shuttleData.routes
    .map(
      (route) => `
    <div class="route-card" data-route="${route.id}" onclick="showRouteDetail('${route.id}')">
      <div class="route-number">${route.name}</div>
      <div class="route-name">${route.description || ""}</div>
      <div class="route-days">${route.days}</div>
    </div>
  `,
    )
    .join("");
}

// קבלת שם תחנה לפי מזהה
function getStopName(stopId) {
  const stop = shuttleData.stops.find((s) => s.id === stopId);
  return stop ? stop.name : stopId;
}

// המרת מחרוזת זמן לדקות
function parseTime(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  return 0;
}

// קבלת הזמן הנוכחי בדקות
function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// קבלת תג לסוג נסיעה
function getTypeBadge(type) {
  const badges = {
    loop: { class: "badge-loop", text: "מעגל" },
    full_loop: { class: "badge-loop", text: "מעגל מלא" },
    maintenance_train: { class: "badge-train", text: "רכבת" },
    maintenance: { class: "badge-train", text: "תחזוקה" },
    maintenance_short: { class: "badge-train", text: "תחזוקה" },
    pickup: { class: "badge-loop", text: "איסוף" },
    train_reinforcement: { class: "badge-train", text: "תגבור" },
    on_call: { class: "badge-oncall", text: "לפי קריאה" },
    break: { class: "badge-break", text: "הפסקה" },
    end: { class: "badge-break", text: "סיום" },
  };
  return badges[type] || { class: "badge-loop", text: type };
}

// רינדור נסיעות קרובות
function renderUpcoming() {
  const list = document.getElementById("upcomingList");
  const currentMins = getCurrentMinutes();

  let allTrips = [];
  shuttleData.routes.forEach((route) => {
    route.schedule.forEach((trip) => {
      if (trip.type !== "break" && trip.type !== "end") {
        const tripMins = parseTime(trip.time);
        if (tripMins >= currentMins) {
          allTrips.push({ ...trip, routeId: route.id, routeName: route.name });
        }
      }
    });
  });

  allTrips.sort((a, b) => parseTime(a.time) - parseTime(b.time));
  allTrips = allTrips.slice(0, 5);

  document.getElementById("upcomingCount").textContent = allTrips.length;

  if (allTrips.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3>אין נסיעות קרובות</h3>
        <p>הנסיעות יתחדשו מחר בבוקר</p>
      </div>
    `;
    return;
  }

  list.innerHTML = allTrips
    .map((trip) => {
      const badge = getTypeBadge(trip.type);
      const stops = trip.stops
        ? trip.stops.slice(0, 3).map(getStopName).join(" ← ") +
          (trip.stops.length > 3 ? " ..." : "")
        : trip.description || "";

      return `
      <div class="schedule-item fade-in" onclick="showRouteDetail('${trip.routeId}')">
        <div class="schedule-time">${trip.time}</div>
        <div class="schedule-content">
          <div class="schedule-type">
            ${trip.routeName}
            <span class="schedule-type-badge ${badge.class}">${badge.text}</span>
          </div>
          <div class="schedule-stops">${stops}</div>
        </div>
        <span class="schedule-arrow">←</span>
      </div>
    `;
    })
    .join("");
}

// הצגת פרטי קו
function showRouteDetail(routeId) {
  const route = shuttleData.routes.find((r) => r.id === routeId);
  if (!route) return;

  currentRoute = route;
  currentView = "route";

  document.getElementById("homeView").classList.add("hidden");
  document.getElementById("stopsView").classList.add("hidden");
  document.getElementById("routeDetailView").classList.add("active");

  const header = document.getElementById("routeDetailHeader");
  header.dataset.route = route.id;
  document.getElementById("routeDetailNumber").textContent = route.id;
  document.getElementById("routeDetailName").textContent = route.name;
  document.getElementById("routeDetailDays").textContent = route.days;

  const noteEl = document.getElementById("routeDetailNote");
  if (route.note) {
    noteEl.style.display = "flex";
    document.getElementById("routeDetailNoteText").textContent = route.note;
  } else {
    noteEl.style.display = "none";
  }

  renderRouteSchedule(route);
  updateNavItems("home");
}

// רינדור לוח זמנים של קו
function renderRouteSchedule(route) {
  const list = document.getElementById("routeScheduleList");
  const currentMins = getCurrentMinutes();

  document.getElementById("scheduleCount").textContent = route.schedule.length;

  list.innerHTML = route.schedule
    .map((trip) => {
      const badge = getTypeBadge(trip.type);
      const isBreak = trip.type === "break" || trip.type === "end";
      const isOnCall = trip.type === "on_call";
      const tripMins = parseTime(trip.time);
      const isActive =
        !isBreak && tripMins >= currentMins && tripMins <= currentMins + 30;

      let stops = "";
      if (trip.stops) {
        stops = trip.stops.map(getStopName).join(" ← ");
      } else if (trip.description) {
        stops = trip.description;
      } else if (trip.squadron) {
        stops = trip.squadron;
      }

      return `
      <div class="schedule-item ${isBreak ? "break" : ""} ${isOnCall ? "oncall" : ""} ${isActive ? "active" : ""}">
        <div class="schedule-time">${trip.time}</div>
        <div class="schedule-content">
          <div class="schedule-type">
            <span class="schedule-type-badge ${badge.class}">${badge.text}</span>
            ${trip.squadron ? `<span style="color: var(--text-muted); font-size: 12px;">${trip.squadron}</span>` : ""}
          </div>
          <div class="schedule-stops">${stops}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

// חזרה לדף הבית
function showHome() {
  currentView = "home";
  currentRoute = null;
  document.getElementById("homeView").classList.remove("hidden");
  document.getElementById("routeDetailView").classList.remove("active");
  document.getElementById("stopsView").classList.add("hidden");
  updateNavItems("home");
  renderUpcoming();
}

// רינדור רשימת תחנות
function renderStops(filter = "") {
  const grid = document.getElementById("stopsGrid");
  let stops = shuttleData.stops;

  if (filter) {
    const f = filter.toLowerCase();
    stops = stops.filter((s) => s.name.toLowerCase().includes(f));
  }

  document.getElementById("stopsCount").textContent = stops.length;

  grid.innerHTML = stops
    .map((stop) => {
      // מציאת קווים שעוברים בתחנה
      const routes = [];
      shuttleData.routes.forEach((route) => {
        route.schedule.forEach((trip) => {
          if (
            trip.stops &&
            trip.stops.includes(stop.id) &&
            !routes.includes(route.id)
          ) {
            routes.push(route.id);
          }
        });
      });

      return `
      <div class="stop-item">
        <div class="stop-marker ${stop.color || "green"}"></div>
        <div class="stop-info">
          <div class="stop-name">${stop.name}</div>
          ${stop.note ? `<div class="stop-note">${stop.note}</div>` : ""}
        </div>
        <div class="stop-routes">
          ${routes.map((r) => `<span class="stop-route-badge r${r}">${r}</span>`).join("")}
        </div>
      </div>
    `;
    })
    .join("");
}

// החלפת טאבים
function switchTab(tab) {
  updateNavItems(tab);

  if (tab === "home") {
    showHome();
  } else if (tab === "stops") {
    currentView = "stops";
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("routeDetailView").classList.remove("active");
    document.getElementById("stopsView").classList.remove("hidden");
  } else if (tab === "info") {
    alert("מוקד הסעות: 04-6092400\n\nשעות פעילות:\nראשון-חמישי 06:00-22:00");
  }
}

// עדכון פריטי ניווט
function updateNavItems(activeTab) {
  document.querySelectorAll(".nav-item").forEach((item, index) => {
    const tabs = ["home", "stops", "info"];
    item.classList.toggle("active", tabs[index] === activeTab);
  });
}

// הגדרת חיפוש
function setupSearch() {
  const homeSearch = document.getElementById("searchInput");
  const stopsSearch = document.getElementById("stopsSearchInput");

  homeSearch.addEventListener("input", (e) => {
    const value = e.target.value;
    if (value.length > 0) {
      switchTab("stops");
      stopsSearch.value = value;
      renderStops(value);
    }
  });

  stopsSearch.addEventListener("input", (e) => {
    renderStops(e.target.value);
  });
}

// יעד בסיסי והכוונה
function setupDestinationPlanner() {
  const currentSelect = document.getElementById("currentStopSelect");
  const destinationSelect = document.getElementById("destinationStopSelect");
  const planButton = document.getElementById("planRouteBtn");

  if (!currentSelect || !destinationSelect || !planButton) return;

  const sortedStops = [...shuttleData.stops].sort((a, b) =>
    a.name.localeCompare(b.name, "he"),
  );
  const options = sortedStops
    .map((stop) => `<option value="${stop.id}">${stop.name}</option>`)
    .join("");
  currentSelect.innerHTML = options;
  destinationSelect.innerHTML = options;

  const defaultCurrent =
    shuttleData.stops.find((stop) => stop.isHub) || shuttleData.stops[0];
  const defaultDestination =
    shuttleData.stops.find((stop) => stop.id === "hda") || sortedStops[0];

  if (defaultCurrent) currentSelect.value = defaultCurrent.id;
  if (defaultDestination) destinationSelect.value = defaultDestination.id;

  planButton.addEventListener("click", () => {
    const currentStopId = currentSelect.value;
    const destinationStopId = destinationSelect.value;
    renderDestinationInfo(
      destinationStopId,
      currentStopId,
      "routeResult",
      true,
    );
  });

  renderDestinationInfo(
    destinationSelect.value,
    currentSelect.value,
    "routeResult",
    true,
  );
}

function renderDestinationInfo(
  destinationStopId,
  currentStopId,
  targetId,
  isCustom = false,
) {
  const container = document.getElementById(targetId);
  if (!container) return;

  if (!currentStopId || !destinationStopId) {
    container.innerHTML =
      '<div class="direction-meta">בחרו מיקום ויעד לקבלת מסלול.</div>';
    return;
  }

  if (currentStopId === destinationStopId) {
    const destName = getStopName(destinationStopId);
    container.innerHTML = `
      <div class="direction-title">כבר ביעד</div>
      <div class="direction-line">את/ה נמצא/ת ב-${destName}</div>
    `;
    return;
  }

  const suggestion = getBestRouteSuggestion(currentStopId, destinationStopId);
  if (!suggestion) {
    container.innerHTML =
      '<div class="direction-meta">לא נמצאה נסיעה ישירה. נסו לבחור יעד אחר או בדקו בלוח הזמנים.</div>';
    return;
  }

  const routeName = suggestion.route.name || `קו ${suggestion.route.id}`;
  const destName = getStopName(destinationStopId);
  const originName = getStopName(currentStopId);
  const nextText = suggestion.nextTrip
    ? `נסיעה הבאה: ${suggestion.nextTrip.time}`
    : "אין נסיעה קרובה היום";
  const directionLine =
    suggestion.direction === "forward"
      ? `${originName} ← ... ← ${destName}`
      : `${destName} ← ... ← ${originName}`;

  container.innerHTML = `
    <div class="direction-title">${isCustom ? "מסלול מומלץ" : "איך להגיע עכשיו"}</div>
    <div class="direction-line">קו ${suggestion.route.id} • ${routeName}</div>
    <div class="direction-badge">${nextText}</div>
    <div class="direction-meta">כיוון נסיעה: ${directionLine}</div>
  `;
}

function getBestRouteSuggestion(currentStopId, destinationStopId) {
  const candidates = [];
  shuttleData.routes.forEach((route) => {
    route.schedule.forEach((trip) => {
      if (!trip.stops || trip.type === "break" || trip.type === "end") return;
      const fromIndex = trip.stops.indexOf(currentStopId);
      const toIndex = trip.stops.indexOf(destinationStopId);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        candidates.push({
          route,
          trip,
          fromIndex,
          toIndex,
          direction: fromIndex < toIndex ? "forward" : "backward",
        });
      }
    });
  });

  if (candidates.length === 0) return null;

  const currentMins = getCurrentMinutes();
  const upcoming = candidates
    .map((candidate) => {
      const mins = parseTime(candidate.trip.time);
      return { ...candidate, mins };
    })
    .filter((candidate) => candidate.mins >= currentMins)
    .sort((a, b) => a.mins - b.mins);

  const best = upcoming[0] || candidates[0];
  return {
    route: best.route,
    direction: best.direction,
    nextTrip: upcoming[0]?.trip || null,
  };
}

// הפעלה
loadData();
