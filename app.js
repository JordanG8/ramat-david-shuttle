// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — APP
// ═══════════════════════════════════════════

import { inject } from '@vercel/analytics';
import "./src/styles/styles.css";
import {
  DATA as fallbackDATA,
  OLD_ROUTES as fallbackOLD_ROUTES,
} from "./src/data/fallbackData.js";
import {
  activeTrips,
  activeTripForRoute,
  estimateArrival,
} from "./src/lib/liveEta.js";

// Initialize Vercel Analytics
inject();

let DATA = JSON.parse(JSON.stringify(fallbackDATA));
let OLD_ROUTES = JSON.parse(JSON.stringify(fallbackOLD_ROUTES));

// Make them globally available for admin.js if needed
window.DATA = DATA;
window.OLD_ROUTES = OLD_ROUTES;

// ─── Load Admin Overrides from localStorage ───
(function applyAdminOverrides() {
  try {
    const saved = localStorage.getItem("shuttle_admin_data");
    if (!saved) return;
    const d = JSON.parse(saved);
    if (d.units) DATA.units = d.units;
    if (d.bus_routes) DATA.bus_routes = d.bus_routes;
    if (d.old_routes) {
      OLD_ROUTES = d.old_routes;
      window.OLD_ROUTES = OLD_ROUTES;
    }
  } catch (e) {
    console.warn("Admin override load failed:", e);
  }
})();

// ─── Helpers ───
function esc(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Israeli Railways logo (inline SVG, inherits color via currentColor)
const railwayIcon = `<svg class="railway-icon" viewBox="0 0 1920 1025" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 C97.35 0 194.7 0 295 0 C302.425 14.355 302.425 14.355 310 29 C322.814 51.25 336.242 72.726 352 93 C353.092 94.413 353.092 94.413 354.207 95.855 C358.156 100.879 362.315 105.67 366.629 110.383 C368.529 112.48 370.383 114.603 372.23 116.746 C382.165 128.119 393.054 138.765 405 148 C406.16 148.946 407.318 149.896 408.473 150.848 C416.965 157.819 425.711 164.135 435 170 C435.576 170.367 436.152 170.733 436.746 171.111 C496.272 208.72 565.508 224.561 635 230 C636.276 230.101 637.552 230.201 638.867 230.305 C665.13 232.077 691.533 232.154 717.845 232.201 C721.871 232.209 725.896 232.222 729.921 232.235 C736.851 232.257 743.78 232.275 750.709 232.291 C760.727 232.314 770.745 232.342 780.763 232.371 C797.028 232.419 813.292 232.462 829.556 232.503 C845.33 232.542 861.103 232.584 876.876 232.628 C877.853 232.63 878.83 232.633 879.836 232.636 C884.738 232.65 889.639 232.663 894.541 232.677 C935.027 232.791 975.514 232.897 1016 233 C1017.593 236.013 1019.184 239.028 1020.774 242.042 C1021.221 242.887 1021.667 243.732 1022.127 244.603 C1025.871 251.704 1029.42 258.879 1032.875 266.125 C1033.472 267.371 1034.07 268.616 1034.668 269.861 C1035.874 272.374 1037.078 274.888 1038.28 277.403 C1040.363 281.76 1042.453 286.114 1044.544 290.467 C1045.516 292.491 1046.487 294.516 1047.458 296.541 C1051.312 304.576 1055.185 312.601 1059.063 320.625 C1063.67 330.16 1068.256 339.706 1072.819 349.263 C1076.802 357.6 1080.818 365.92 1084.838 374.239 C1089.394 383.666 1093.932 393.101 1098.458 402.542 C1102.015 409.956 1105.586 417.362 1109.164 424.765 C1111.218 429.016 1113.269 433.268 1115.32 437.52 C1116.416 439.79 1117.512 442.059 1118.609 444.328 C1120.097 447.404 1121.58 450.483 1123.063 453.563 C1123.491 454.447 1123.92 455.331 1124.362 456.243 C1126.592 460.886 1128.679 465.564 1130.65 470.324 C1131.093 471.391 1131.535 472.458 1131.991 473.557 C1132.324 474.363 1132.657 475.169 1133 476 C1087.87 476.034 1042.74 476.066 997.61 476.085 C996.94 476.085 996.27 476.085 995.58 476.086 C981.011 476.092 966.443 476.097 951.875 476.102 C944.729 476.105 937.583 476.107 930.437 476.11 C929.725 476.11 929.014 476.11 928.282 476.111 C905.315 476.119 882.348 476.134 859.382 476.153 C835.742 476.172 812.102 476.184 788.462 476.188 C773.254 476.19 758.046 476.199 742.838 476.216 C732.838 476.227 722.838 476.23 712.838 476.227 C707.089 476.226 701.341 476.228 695.593 476.238 C662.062 476.299 628.639 475.59 595.25 472.25 C594.406 472.168 593.562 472.085 592.693 472 C512.95 464.157 435.204 445.756 324.216 395.208 C322.062 394.034 319.901 392.874 317.738 391.715 C296.989 380.49 277.092 367.843 258 354 C256.8 353.138 256.8 353.138 255.576 352.259 C244.006 343.941 232.881 335.199 222 326 C221.378 325.477 220.755 324.953 220.114 324.414 C208.262 314.439 196.86 304.051 186 293 C182.806 289.794 179.595 286.606 176.383 283.418 C174.63 281.675 172.878 279.931 171.125 278.188 C170.252 277.323 169.38 276.459 168.48 275.568 C163.437 270.544 158.608 265.425 154 260 C153.062 258.917 152.123 257.835 151.184 256.754 C139.495 243.197 128.074 229.472 117.489 215.03 C116.498 213.68 115.504 212.331 114.507 210.985 C72.807 154.693 38.68 92.278 11 28 C10.464 26.761 9.928 25.522 9.393 24.283 C7.815 20.63 6.249 16.972 4.688 13.313 C4.212 12.2 3.737 11.088 3.248 9.942 C2.605 8.418 2.605 8.418 1.949 6.863 C1.571 5.969 1.193 5.075 0.803 4.154 C0 2 0 2 0 0Z" transform="translate(628,0)"/><path d="M0 0 C44.939-0.034 89.879-0.066 134.818-0.085 C135.485-0.085 136.152-0.085 136.84-0.086 C151.347-0.092 165.854-0.097 180.36-0.102 C187.477-0.105 194.593-0.107 201.709-0.11 C202.417-0.11 203.125-0.11 203.855-0.111 C226.724-0.119 249.594-0.134 272.464-0.153 C296.004-0.172 319.544-0.184 343.084-0.188 C358.228-0.19 373.372-0.199 388.516-0.216 C398.474-0.226 408.432-0.23 418.39-0.227 C424.114-0.226 429.838-0.228 435.562-0.238 C511.901-0.376 587.842 6.184 662 25 C663.75 25.441 663.75 25.441 665.535 25.89 C753.6 48.251 837.095 88.733 907 147 C907.58 147.481 908.16 147.961 908.757 148.457 C915.699 154.219 922.445 160.153 929.051 166.297 C930.557 167.695 932.074 169.063 933.64 170.395 C940.156 175.937 946.148 181.997 952.182 188.052 C954.058 189.933 955.94 191.81 957.822 193.686 C963.763 199.623 969.563 205.592 975 212 C976.62 213.776 978.244 215.547 979.875 217.313 C984.796 222.715 989.416 228.312 994 234 C995.045 235.277 996.09 236.553 997.137 237.828 C1003.625 245.745 1009.955 253.737 1016 262 C1016.655 262.882 1016.655 262.882 1017.323 263.781 C1058.166 318.783 1091.338 379.391 1119.063 441.938 C1119.371 442.631 1119.679 443.324 1120 444.038 C1120.89 446.053 1121.776 448.071 1122.66 450.09 C1123.412 451.805 1123.412 451.805 1124.18 453.554 C1126.945 460.307 1129.438 467.168 1132 474 C1034.65 474 937.3 474 837 474 C833.7 467.73 830.4 461.46 827 455 C802.878 410.448 773.29 365.805 734 333 C733.478 332.558 732.955 332.117 732.417 331.662 C670.983 279.896 594.579 255.811 515.625 247.75 C514.811 247.667 513.998 247.584 513.159 247.498 C510.786 247.259 508.413 247.026 506.039 246.797 C505.364 246.73 504.689 246.664 503.993 246.596 C491.093 245.387 478.144 244.792 465.195 244.457 C464.403 244.437 463.61 244.416 462.794 244.394 C433.495 243.659 404.173 243.771 374.867 243.703 C365.871 243.682 356.874 243.655 347.878 243.629 C331.844 243.581 315.81 243.538 299.776 243.497 C284.23 243.458 268.685 243.416 253.14 243.372 C251.695 243.368 251.695 243.368 250.22 243.364 C245.385 243.35 240.55 243.337 235.714 243.323 C195.81 243.21 155.905 243.103 116 243 C113.402 237.673 110.805 232.345 108.208 227.017 C107.328 225.21 106.447 223.403 105.566 221.596 C99.416 208.985 93.311 196.354 87.28 183.686 C84.925 178.745 82.556 173.81 80.188 168.875 C79.693 167.845 79.199 166.815 78.69 165.754 C74.508 157.048 70.309 148.349 66.107 139.652 C59.56 126.099 53.048 112.529 46.541 98.957 C40.71 86.797 34.866 74.643 29 62.5 C23.123 50.333 17.261 38.159 11.426 25.972 C9.966 22.928 8.499 19.888 7.031 16.848 C6.104 14.919 5.177 12.991 4.25 11.063 C3.819 10.174 3.388 9.285 2.944 8.369 C2.361 7.152 2.361 7.152 1.766 5.91 C1.423 5.2 1.08 4.49 0.728 3.758 C0 2 0 2 0 0Z" transform="translate(159,551)"/><path d="M0 0 C64.359-0.309 128.719-0.595 193.079-0.762 C194.031-0.765 194.984-0.767 195.965-0.77 C216.668-0.824 237.371-0.873 258.074-0.919 C268.226-0.942 278.379-0.965 288.531-0.989 C290.047-0.992 290.047-0.992 291.593-0.996 C324.338-1.073 357.083-1.208 389.828-1.373 C423.478-1.543 457.128-1.654 490.779-1.69 C495.533-1.696 500.286-1.702 505.039-1.708 C505.975-1.709 506.91-1.71 507.874-1.711 C522.932-1.733 537.988-1.816 553.045-1.923 C568.184-2.029 583.322-2.069 598.461-2.043 C607.456-2.029 616.447-2.066 625.441-2.174 C631.453-2.242 637.463-2.244 643.475-2.193 C646.9-2.166 650.319-2.167 653.743-2.248 C673.494-2.635 673.494-2.635 679.301 1.729 C683.291 5.889 686.053 10.547 688.687 15.642 C690.919 19.65 693.779 23.164 696.625 26.75 C697.711 28.156 698.796 29.564 699.879 30.973 C700.919 32.315 701.96 33.658 703 35 C703.715 35.928 703.715 35.928 704.445 36.875 C710.883 45.224 717.584 53.298 724.497 61.259 C725.976 62.973 727.44 64.698 728.898 66.43 C741.502 81.367 755.14 95.234 768.938 109.063 C769.619 109.747 770.301 110.431 771.004 111.137 C781.208 121.384 781.208 121.384 792 131 C793.227 132.068 794.452 133.138 795.676 134.211 C846.551 178.531 902.953 213.429 964 242 C964 242.33 964 242.66 964 243 C684.16 243 404.32 243 116 243 C106.774 224.548 106.774 224.548 103.012 216.84 C102.587 215.97 102.161 215.1 101.723 214.204 C100.377 211.449 99.032 208.693 97.688 205.938 C97.224 204.988 96.761 204.039 96.283 203.061 C89.879 189.942 83.515 176.806 77.248 163.621 C74.905 158.701 72.546 153.788 70.188 148.875 C69.694 147.846 69.2 146.815 68.691 145.758 C64.488 137.005 60.264 128.261 56.04 119.517 C51.235 109.573 46.46 99.614 41.699 89.648 C34.189 73.926 26.631 58.227 19.05 42.539 C14.468 33.055 9.909 23.561 5.375 14.054 C4.957 13.179 4.54 12.304 4.109 11.402 C3.748 10.644 3.387 9.886 3.015 9.105 C2.333 7.691 1.617 6.293 0.868 4.912 C0 3 0 3 0 0Z" transform="translate(0,233)"/><path d="M0 0 C279.84 0 559.68 0 848 0 C872.572 50.262 872.572 50.262 879.759 65.394 C882.139 70.393 884.54 75.384 886.938 80.375 C887.949 82.482 888.961 84.589 889.973 86.695 C890.474 87.74 890.976 88.784 891.493 89.86 C892.974 92.946 894.454 96.031 895.934 99.117 C901.592 110.916 907.269 122.705 912.962 134.487 C917.27 143.402 921.553 152.328 925.819 161.263 C929.504 168.977 933.218 176.677 936.938 184.375 C942.866 196.647 948.789 208.922 954.669 221.217 C955.542 223.043 956.417 224.868 957.292 226.693 C958.449 229.106 959.6 231.521 960.75 233.938 C961.086 234.636 961.421 235.334 961.767 236.054 C964 240.77 964 240.77 964 243 C899.626 243.274 835.253 243.529 770.879 243.677 C769.45 243.681 769.45 243.681 767.992 243.684 C747.286 243.732 726.581 243.776 705.875 243.817 C695.721 243.837 685.568 243.858 675.414 243.879 C674.403 243.881 673.393 243.883 672.352 243.885 C639.6 243.953 606.848 244.074 574.096 244.221 C540.44 244.372 506.783 244.47 473.127 244.503 C468.373 244.507 463.619 244.512 458.866 244.518 C457.93 244.519 456.995 244.52 456.031 244.521 C440.969 244.54 425.909 244.614 410.848 244.709 C395.707 244.804 380.566 244.839 365.425 244.816 C356.428 244.804 347.434 244.836 338.438 244.933 C332.426 244.993 326.415 244.995 320.403 244.949 C316.978 244.925 313.557 244.926 310.132 244.998 C290.327 245.342 290.327 245.342 284.757 241.421 C281.004 237.718 278.376 233.558 275.99 228.883 C274.66 226.353 273.001 224.137 271.258 221.879 C270.737 221.16 270.215 220.442 269.678 219.701 C262.962 210.455 255.875 201.588 248.531 192.835 C246.407 190.289 244.331 187.707 242.25 185.125 C238.433 180.449 234.413 175.985 230.328 171.543 C228.393 169.429 226.498 167.293 224.625 165.125 C215.542 154.741 205.99 144.887 196.25 135.125 C195.707 134.579 195.164 134.034 194.604 133.471 C189.119 127.966 183.625 122.519 177.712 117.467 C175.135 115.259 172.671 112.938 170.188 110.625 C165.594 106.387 160.887 102.344 156.016 98.426 C153.804 96.646 151.608 94.854 149.422 93.043 C139.232 84.629 128.731 76.709 118 69 C117.18 68.41 116.359 67.821 115.514 67.213 C103.613 58.697 91.494 50.619 79 43 C78.158 42.486 77.316 41.972 76.448 41.443 C51.717 26.434 26.111 13.393 0 1 C0 0.67 0 0.34 0 0Z" transform="translate(956,551)"/></svg>`;

const chevronSVG = `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const smallChevronSVG = `<svg class="tl-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const arrowSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

// ─── Render Stations ───
function parseTopicNote(noteText) {
  const m = noteText.match(/^([^-]+?)\s*-\s*(.+)$/);
  if (!m) return null;
  const topic = m[1].trim();
  const detail = m[2].trim();
  let icon = null;
  let label = topic;
  if (topic.includes("רכב")) {
    icon = `<span class="material-symbols-rounded">train</span>`;
    label = "רכבת";
  } else if (topic.includes("חדר אוכל") || topic.includes('חד"א')) {
    icon = `<span class="material-symbols-rounded">restaurant</span>`;
    label = 'חד"א';
  }
  return icon ? { icon, topic: label, detail } : null;
}

function renderUnitNotesBlock(unit) {
  const noteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  const notes = [];
  if (unit.notes) notes.push(unit.notes);
  if (unit.notes2) notes.push(unit.notes2);
  if (notes.length === 0) return "";

  const parsed = notes.map(parseTopicNote);
  if (parsed.every((p) => p !== null)) {
    const items = parsed
      .map(
        (p) => `
        <div class="unit-note-item">
          <span class="unit-note-tag">${p.icon}<span>${esc(p.topic)}</span></span>
          <span class="unit-note-detail">${esc(p.detail)}</span>
        </div>`,
      )
      .join("");
    return `<div class="unit-notes-block">${items}</div>`;
  }

  return notes
    .map((n) => `<div class="unit-note">${noteIcon}${esc(n)}</div>`)
    .join("");
}

function renderStationsHtml() {
  return DATA.units
    .map((unit) => {
      const deptCount = unit.departments.length;
      const noteHtml = renderUnitNotesBlock(unit);

      const deptsHtml = unit.departments
        .map((dept) => {
          const isService = dept.type === "תחנת שירות";
          const dotClass = isService ? "service" : "alt";
          const goesTo = dept.goes_to
            ? `<span class="dept-goes-to">${arrowSVG} ${esc(dept.goes_to)}</span>`
            : "";
          return `
        <div class="dept-item">
          <div class="dept-info">
            <span class="dept-dot ${dotClass}"></span>
            <span class="dept-name">${esc(dept.name)}</span>
          </div>
          ${goesTo}
        </div>`;
        })
        .join("");

      const colorStyle = unit.color
        ? `style="border-right:4px solid ${esc(unit.color)}"`
        : "";
      const headerColorStyle = unit.color
        ? `style="border-left-color:${esc(unit.color)}"`
        : "";

      return `
      <div class="unit-card" ${colorStyle}>
        <div class="unit-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="unit-title">
            ${unit.color ? `<span class="unit-color-dot" style="background:${esc(unit.color)}"></span>` : ""}
            ${esc(unit.name)}
            <span class="unit-count">${deptCount}</span>
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
    })
    .join("");
}

// ─── Hub-and-Spoke State ───
const VALID_VIEWS = [
  "home",
  "live",
  "train",
  "tzomet",
  "internal",
  "hada",
  "oncall",
  "info",
];

function getViewFromHash() {
  const hash = window.location.hash.replace("#", "");
  return VALID_VIEWS.includes(hash) ? hash : "home";
}

let currentView = getViewFromHash();
let highlightTime = null;

// ─── Icons ───
const clockSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const mapPinSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const moonSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const infoSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

function renderStopsCard(stops, opts) {
  opts = opts || {};
  // When we know which bus is running — either from a rider report or from the
  // next scheduled departure — each stop carries its own estimated time.
  const ctx = opts.ctx || null;
  const routeKey = opts.routeKey || null;

  const stopsHtml = stops
    .map((stop, i) => {
      const hada = isHadaStop(stop) ? " stop-hada" : "";
      let extraClass = "";
      let meta = "";

      if (ctx && routeKey) {
        const seenIndex = ctx.trip ? ctx.trip.stopIndex : -1;
        if (i === seenIndex) {
          extraClass = " stop-item--here";
          meta = `<span class="stop-here">האוטובוס כאן</span>`;
        } else if (i < seenIndex) {
          extraClass = " stop-item--passed";
        } else {
          const eta = etaForStop(routeKey, ctx, i);
          if (eta) {
            const tone = ctx.isLive
              ? " stop-eta--live"
              : eta.source === "default"
                ? " stop-eta--rough"
                : "";
            meta = `<span class="stop-eta${tone}">${esc(eta.time)}</span>`;
          }
        }
      }

      return `<div class="stop-item${hada}${extraClass}"><span class="stop-num">${i + 1}</span><span class="stop-name">${esc(stop)}</span>${meta}</div>`;
    })
    .join("");

  // Say where the numbers come from, so nobody mistakes a first-week guess
  // for a tracked bus.
  const sample = ctx && routeKey ? etaForStop(routeKey, ctx, stops.length - 1) : null;
  const rough = sample && sample.source === "default";
  const subtitle = ctx
    ? ctx.isLive
      ? `<span class="stops-eta-note stops-eta-note--live">צפי לפי דיווח חי</span>`
      : `<span class="stops-eta-note">צפי ליציאת ${esc(ctx.tripTime)}${rough ? " · הערכה ראשונית" : ""}</span>`
    : "";

  return `
    <div class="card-block stops-block-static">
      <div class="card-block-header static">
        <div class="card-block-title">${mapPinSVG} תחנות עצירה</div>
        ${subtitle}
      </div>
      <div class="stops-list">
        ${stopsHtml}
      </div>
    </div>`;
}

function renderTimeStopsBlock(time, stops, opts) {
  opts = opts || {};
  const passed = isTimePassed(time) ? " trip-passed" : "";
  const reinforce = opts.reinforce ? " stops-block--reinforce" : "";
  const stopsHtml = (stops || [])
    .map((stop, i) => {
      const hada = isHadaStop(stop) ? " stop-hada" : "";
      return `<div class="stop-item${hada}"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`;
    })
    .join("");
  return `
    <div class="card-block stops-block open${passed}${reinforce}" data-time="${esc(time)}">
      <div class="card-block-header static">
        <div class="card-block-title">${mapPinSVG} <span class="block-time">${esc(time)}</span> <span class="estimated-tag">משוער</span></div>
      </div>
      <div class="card-block-body">
        <div class="stops-list">${stopsHtml}</div>
      </div>
    </div>`;
}

const reinforceSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`;

function isTimePassed(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return parseInt(match[1]) * 60 + parseInt(match[2]) < nowMins;
}

function getKavForTime(time, stopKeyword) {
  const toMins = (t) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
  };
  const target = toMins(time);
  if (target < 0) return [];
  const all = OLD_ROUTES.map((r, i) => {
    const m = r.name.match(/^קו\s*(\d+)/);
    if (!m) return null;
    const isReinforcement = r.name.includes("תגבור");
    const matches = r.schedule.some(
      (e) =>
        e.type === "נסיעה" &&
        e.stops &&
        e.stops.some((s) => s.includes(stopKeyword)) &&
        toMins(e.time) === target,
    );
    return matches ? { kavId: `kav${i + 1}`, label: `קו ${m[1]}`, isReinforcement } : null;
  }).filter(Boolean);
  // If both regular and reinforcement lines match, show only the regular ones
  const regular = all.filter((k) => !k.isReinforcement);
  return (regular.length > 0 ? regular : all).map(({ kavId, label }) => ({ kavId, label }));
}

function renderDepartureList(items, extraClass, stopKeyword) {
  return `<div class="departure-list">
    ${items
      .map((d) => {
        const passed = isTimePassed(d.time) ? " dep-time-passed" : "";
        const reinforce = d.note ? "dep-time-item--reinforce" : "";
        return `<span class="dep-time-item ${reinforce} ${passed}">${esc(d.time)}</span>`;
      })
      .join("")}
  </div>`;
}

function renderKavLinks(lines) {
  if (!lines || lines.length === 0) return "";
  return lines
    .map(
      (l) =>
        `<a class="block-kav-link" onclick="navigateTo('info',{activeKav:'${l.kavId}'})">${esc(l.label)}</a>`,
    )
    .join("");
}

function renderDepartureTable(departures, filterReinforcement, split, stopKeyword) {
  if (split) {
    const regular = departures.filter((d) => !d.note);
    const reinforce = departures.filter((d) => !!d.note);
    let html = "";
    if (regular.length > 0) {
      html += `
        <div class="card-block times-block-compact">
          <div class="card-block-header static">
            <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
          </div>
          ${renderDepartureList(regular, "", stopKeyword)}
        </div>`;
    }
    if (reinforce.length > 0) {
      const reinforceOpen = isReinforcementDay() ? " open" : "";
      html += `
        <div class="card-block times-block-compact times-block--reinforce${reinforceOpen}" onclick="this.classList.toggle('open')">
          <div class="card-block-header reinforce-header">
            <div class="card-block-title">${reinforceSVG} שעות נוספות ימים א' וה' <span class="estimated-tag">משוער</span></div>
            <div class="card-block-meta">${smallChevronSVG}</div>
          </div>
          <div class="card-block-body">
            ${renderDepartureList(reinforce, "dep-time-item--reinforce", stopKeyword)}
          </div>
        </div>`;
    }
    return html;
  }

  const filtered = departures.filter((d) => {
    const isReinforcement = !!d.note;
    if (filterReinforcement === "only") return isReinforcement;
    if (filterReinforcement === "none") return !isReinforcement;
    return true;
  });
  if (filtered.length === 0) return '<div class="no-data">אין שעות יציאה</div>';

  return `
    <div class="card-block times-block-compact">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
      </div>
      ${renderDepartureList(filtered, "", stopKeyword)}
    </div>`;
}

function renderDepartureTimesStr(timesStr, stopKeyword) {
  const times = timesStr.split("-");
  return `
    <div class="card-block times-block-compact">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
      </div>
      <div class="departure-list">
        ${times
          .map((t) => {
            const time = t.trim();
            const passed = isTimePassed(time) ? " dep-time-passed" : "";
            return `<span class="dep-time-item${passed}">${esc(time)}</span>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderRouteCard(route, opts) {
  opts = opts || {};
  const titleOverride = opts.title;

  // Match this card to its trackable route so riders can report on it and so
  // the stop list can show estimated arrival times.
  const track = opts.view
    ? findTrackableByKey(opts.view + "|" + (opts.trackName || route.name))
    : null;
  const liveCtx = track ? getLiveContext(track.key, track.times) : null;

  let bodyHtml = "";

  if (route.departure_times) {
    bodyHtml += renderDepartureTable(
      route.departure_times,
      "all",
      opts.splitReinforcement,
      opts.stopKeyword,
    );
  }

  if (route.departure_times_str) {
    bodyHtml += renderDepartureTimesStr(route.departure_times_str, opts.stopKeyword);
  }

  if (route.stops && route.stops.length) {
    bodyHtml += renderStopsCard(route.stops, {
      routeKey: track ? track.key : null,
      ctx: liveCtx,
    });
  }

  if (route.note) {
    bodyHtml += `<div class="route-note">${infoSVG} ${esc(route.note)}</div>`;
  }

  if (route.evening && !opts.hideEvening) {
    bodyHtml += `
      <div class="card-block evening-block">
        <div class="card-block-header static">
          <div class="card-block-title">${moonSVG} ערב <span class="estimated-tag">משוער</span></div>
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
  const liveHtml = track ? renderLiveStrip(track.key, track) : "";

  return `
    <div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">${titleHtml}</div>
      </div>
      ${countdownHtml}
      ${liveHtml}
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
  return d.note && d.note.includes("ראשון");
}

function getAllDepartureTimes(route) {
  const times = [];
  const reinforceDay = isReinforcementDay();
  if (route.departure_times) {
    route.departure_times.forEach((d) => {
      // Skip reinforcement-only times if today isn't Sunday/Thursday
      if (!reinforceDay && isReinforcementTime(d)) return;
      times.push(d.time);
    });
  }
  if (route.departure_times_str) {
    route.departure_times_str.split("-").forEach((t) => times.push(t.trim()));
  }
  if (route.sub_routes) {
    route.sub_routes.forEach((sub) => {
      if (sub.departure_times_str) {
        sub.departure_times_str.split("-").forEach((t) => times.push(t.trim()));
      }
      if (sub.departure_times) {
        sub.departure_times.forEach((d) => {
          if (!reinforceDay && isReinforcementTime(d)) return;
          times.push(d.time);
        });
      }
    });
  }
  return times;
}

function getUpcomingDepartures(route) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const times = getAllDepartureTimes(route);
  return getUpcomingFromTimes(times, nowMins);
}

function getUpcomingFromTimes(times, nowMins) {
  if (nowMins === undefined) {
    const now = new Date();
    nowMins = now.getHours() * 60 + now.getMinutes();
  }
  const parsed = [];
  times.forEach((t) => {
    const match = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    const mins = parseInt(match[1]) * 60 + parseInt(match[2]);
    parsed.push({ time: t, mins });
  });
  parsed.sort((a, b) => a.mins - b.mins);
  const upcoming = [];
  for (const p of parsed) {
    const diff = p.mins - nowMins;
    if (diff >= 0 && diff <= 120) {
      upcoming.push({ time: p.time, minutes: diff });
    }
  }
  return upcoming;
}

function renderCountdownBanner(route) {
  const upcoming = getUpcomingDepartures(route);
  return renderCountdownFromUpcoming(upcoming);
}

function renderCountdownFromNext(next) {
  // Backwards compat wrapper
  if (!next) return "";
  return renderCountdownFromUpcoming([next]);
}

function formatMinutes(mins) {
  if (mins === 0) return "עכשיו!";
  if (mins <= 60) return mins + " דק׳";
  const extraMins = mins - 60;
  if (extraMins === 0) return "שעה";
  return "שעה ו" + extraMins + " דק׳";
}

function renderCountdownFromUpcoming(upcoming) {
  if (!upcoming || upcoming.length === 0) return "";

  const items = upcoming
    .map((dep) => {
      const urgent = dep.minutes <= 5;
      return `<div class="cb-item ${urgent ? "cb-item-urgent" : ""}">
      <div class="cb-item-row">
        <span class="live-dot ${urgent ? "urgent" : ""}"></span>
        <span class="cb-minutes">${formatMinutes(dep.minutes)}</span>
      </div>
      <span class="cb-time">${esc(dep.time)}</span>
    </div>`;
    })
    .join("");

  const anyUrgent = upcoming.some((d) => d.minutes <= 5);
  return `<div class="countdown-banner ${anyUrgent ? "countdown-urgent" : ""}">
    <div class="cb-label-col">
      <span class="cb-label">הקווים הקרובים</span>
      <span class="cb-disclaimer">*זמני היציאה משוערים*</span>
    </div>
    <div class="cb-items">${items}</div>
  </div>`;
}

function formatRouteTitle(name) {
  const arrowLeft = `<svg class="route-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
  if (name.includes(" - ")) {
    const parts = name.split(" - ");
    return `<span class="route-from">${esc(parts[0])}</span>${arrowLeft}<span class="route-to">${esc(parts[1])}</span>`;
  }
  return esc(name);
}

// ─── Home Page Icons ───
const homeSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const backArrowSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

// ─── Get All Upcoming Departures (across all routes) ───
function getAllUpcomingDepartures() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const reinforceDay = isReinforcementDay();
  const entries = [];

  // Helper: parse "HH:MM" to minutes
  function parseTime(t) {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
  }

  // Train: bus_routes[0] = to train, bus_routes[1] = from train
  const toTrain = DATA.bus_routes[0];
  const fromTrain = DATA.bus_routes[1];

  function addRouteEntries(route, view, routeLabel, badgeClass) {
    if (route.departure_times) {
      route.departure_times.forEach((d) => {
        if (!reinforceDay && isReinforcementTime(d)) return;
        const mins = parseTime(d.time);
        if (mins < 0) return;
        const diff = mins - nowMins;
        if (diff >= 0 && diff <= 120) {
          entries.push({
            time: d.time,
            mins,
            diff,
            view,
            routeLabel,
            badgeClass,
          });
        }
      });
    }
    if (route.departure_times_str) {
      route.departure_times_str.split("-").forEach((t) => {
        t = t.trim();
        const mins = parseTime(t);
        if (mins < 0) return;
        const diff = mins - nowMins;
        if (diff >= 0 && diff <= 120) {
          entries.push({ time: t, mins, diff, view, routeLabel, badgeClass });
        }
      });
    }
  }

  addRouteEntries(toTrain, "train", "בסיס ← רכבת כפ״י", "board-badge-train");
  addRouteEntries(fromTrain, "train", "רכבת כפ״י ← בסיס", "board-badge-train");

  // Tzomet: bus_routes[3]
  const tzomet = DATA.bus_routes[3];
  addRouteEntries(tzomet, "tzomet", "צומת ← בסיס", "board-badge-tzomet");

  // Internal: bus_routes[2] has sub_routes
  const internal = DATA.bus_routes[2];
  if (internal.sub_routes) {
    internal.sub_routes.forEach((sub) => {
      const label = sub.name.includes("105") ? "פנים כנף 105" : "פנים כנף 109";
      addRouteEntries(sub, "internal", label, "board-badge-internal");
    });
  }

  // Hada trips from OLD_ROUTES
  const hadaGroups = getHadaTrips();
  for (const key of Object.keys(hadaGroups)) {
    hadaGroups[key].forEach((trip) => {
      const mins = parseTime(trip.time);
      if (mins < 0) return;
      const diff = mins - nowMins;
      if (diff >= 0 && diff <= 120) {
        entries.push({
          time: trip.time,
          mins,
          diff,
          view: "hada",
          routeLabel: 'חד"א',
          badgeClass: "board-badge-hada",
        });
      }
    });
  }

  // Deduplicate by time+view (same time same route)
  const seen = new Set();
  const unique = [];
  for (const e of entries) {
    const key = e.time + "|" + e.routeLabel;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(e);
    }
  }

  unique.sort((a, b) => a.mins - b.mins);
  return unique;
}

// ─── Check if evening on-call is active ───
function isEveningOnCallActive() {
  const now = new Date();
  const h = now.getHours();
  return h >= 18 && h < 22;
}

// ─── Route meta helper ───
function getRouteIcon(view) {
  if (view === "train") return railwayIcon;
  const icons = {
    tzomet: "alt_route",
    internal: "directions_bus",
    hada: "restaurant",
    oncall: "call",
  };
  return `<span class="material-symbols-rounded">${icons[view] || "airport_shuttle"}</span>`;
}

// ─── Render Departure Board ───
// PRESERVED: This section is intentionally kept. The departure board shows
// upcoming shuttle departures in a live-updating board with brand header.
// Temporarily disabled in renderHomePage() — do NOT delete.
function renderDepartureBoard() {
  const departures = getAllUpcomingDepartures().slice(0, 6);

  let html = `<div class="board-section">`;

  // ── App brand ──
  html += `<div class="board-brand">
    <div class="board-brand-title">שאטל 1</div>
    <div class="board-brand-sub">אפליקציית השאטלים של בסיס כנף 1 — רמת דוד</div>
  </div>`;

  // ── Title bar ──
  html += `<div class="board-title-bar">
    <div class="board-title-right">
      <span class="material-symbols-rounded board-title-icon">airport_shuttle</span>
      <span class="board-title-text">לוח יציאות שאטלים</span>
      <span class="estimated-tag board-estimated">זמן משוער</span>
    </div>
    <span class="live-dot${departures.length > 0 ? " urgent" : " dead"}"></span>
  </div>`;

  if (departures.length === 0) {
    html += `<div class="board-empty">
      <span class="material-symbols-rounded board-empty-icon">schedule</span>
      <span class="board-empty-title">אין שאטלים קרובים כרגע</span>
      <span class="board-empty-sub">היציאות הבאות יופיעו כאן כשיהיו שאטלים בשעתיים הקרובות</span>
    </div>`;
  } else {
    // ── Column headers ──
    html += `<div class="board-head">
      <span class="board-col board-col-time">שעה</span>
      <span class="board-col board-col-route">קו</span>
      <span class="board-col board-col-eta">המתנה</span>
    </div>`;

    // ── Departure rows (all equal) ──
    departures.forEach((dep, i) => {
      const isUrgent = dep.diff <= 5;
      const isNow = dep.diff === 0;
      html += `<div class="board-row${isUrgent ? " board-row--urgent" : ""}" onclick="navigateTo('${dep.view}', { highlightTime: '${dep.time}' })">
        <span class="board-cell board-cell-time">${esc(dep.time)}</span>
        <span class="board-cell board-cell-route">
          <span class="board-cell-icon">${getRouteIcon(dep.view)}</span>
          ${esc(dep.routeLabel)}
        </span>
        <span class="board-cell board-cell-eta${isUrgent ? " board-cell-eta--urgent" : ""}">
          ${isNow ? "עכשיו!" : dep.diff + " דק׳"}
        </span>
      </div>`;
    });
  }

  html += `</div>`;
  return html;
}

// ─── Render Nav Buttons ───
function renderNavButtons() {
  const buttons = [
    {
      icon: '<span class="material-symbols-rounded">near_me</span>',
      label: "איפה האוטובוס עכשיו",
      sub: "מעקב ודיווחי נוסעים",
      view: "live",
      btnClass: "nav-btn--live",
    },
    {
      icon: railwayIcon,
      label: "רכבת כפר יהושע",
      sub: "",
      view: "train",
      btnClass: "nav-btn--train",
    },
    {
      icon: '<span class="material-symbols-rounded">alt_route</span>',
      label: "צומת רמת דוד - רחבת היסעים",
      sub: "שאטל מהצומת לבסיס",
      view: "tzomet",
      btnClass: "nav-btn--tzomet",
    },
    {
      icon: '<span class="material-symbols-rounded">directions_bus</span>',
      label: "פיזור למקומות עבודה",
      sub: "הסעות פנים בסיס",
      view: "internal",
      btnClass: "nav-btn--internal",
    },
    {
      icon: '<span class="material-symbols-rounded">restaurant</span>',
      label: 'חד"א',
      sub: "נסיעות לחדר האוכל",
      view: "hada",
      btnClass: "nav-btn--hada",
    },
    {
      icon: '<span class="material-symbols-rounded">call</span>',
      label: "שאטל לפי קריאה",
      sub: "הזמנת נסיעה",
      view: "oncall",
      btnClass: "nav-btn--oncall",
    },
    {
      icon: '<span class="material-symbols-rounded">map</span>',
      label: "מקרא תחנות ומידע",
      sub: "מפה ומידע כללי",
      view: "info",
      btnClass: "nav-btn--info",
    },
  ];

  let html = `<div class="nav-card">`;
  html += `<div class="nav-card-cta">
    <span class="material-symbols-rounded nav-card-title-icon">explore</span>
    <h2 class="nav-card-title">לאן את.ה צריכ.ה להגיע</h2>
  </div>`;
  html += `<div class="nav-buttons">`;
  buttons.forEach((btn) => {
    html += `<div class="nav-btn ${btn.btnClass}" onclick="navigateTo('${btn.view}')">
      <div class="nav-btn-icon-wrap">
        <span class="nav-btn-icon">${btn.icon}</span>
      </div>
      <div class="nav-btn-text">
        <span class="nav-btn-label">${esc(btn.label)}</span>
      </div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

// ─── Render Home Page ───
function renderHomePage() {
  let html = "";
  // NOTE: Departure board temporarily removed per commander request.
  // The feature is fully functional — just uncomment to restore:
  // html += renderDepartureBoard();
  html += renderNavButtons();
  return html;
}

// ─── Render Top Tabs ───
function renderTopTabs() {
  const tabs = [
    { icon: "home", label: "בית", view: "home" },
    { icon: "near_me", label: "מעקב חי", view: "live" },
    { icon: "railway", label: "רכבת", view: "train" },
    { icon: "alt_route", label: "צומת", view: "tzomet" },
    { icon: "directions_bus", label: "פנים כנף", view: "internal" },
    { icon: "restaurant", label: 'חד"א', view: "hada" },
    { icon: "call", label: "לפי קריאה", view: "oncall" },
    { icon: "info", label: "מידע", view: "info" },
  ];

  let html = `<div class="top-tabs">`;
  tabs.forEach((tab) => {
    const active = tab.view === currentView ? " top-tab-active" : "";
    const iconHtml =
      tab.icon === "railway"
        ? `<span class="top-tab-icon">${railwayIcon}</span>`
        : `<span class="material-symbols-rounded top-tab-icon">${tab.icon}</span>`;
    html += `<button class="top-tab${active}" onclick="navigateTo('${tab.view}')">
      ${iconHtml}
      <span class="top-tab-label">${tab.label}</span>
    </button>`;
  });
  html += `</div>`;
  return html;
}

// ─── Render Route Content (for spoke pages) ───
function renderRouteContent(view) {
  let html = "";

  if (view === "train") {
    const toTrain = DATA.bus_routes[0];
    const fromTrain = DATA.bus_routes[1];
    html += renderRouteCard(toTrain, { view: "train", splitReinforcement: true, stopKeyword: "רכבת כפר יהושע" });
    html += renderRouteCard(fromTrain, { view: "train", splitReinforcement: true, stopKeyword: "רכבת כפר יהושע" });
  } else if (view === "tzomet") {
    const tzomet = DATA.bus_routes[3];
    html += renderRouteCard(tzomet, { view: "tzomet", hideEvening: true, splitReinforcement: true, stopKeyword: "צומת רמת דוד" });
  } else if (view === "internal") {
    const internal = DATA.bus_routes[2];
    if (internal.note) {
      const note = internal.note
        .replace(
          "איסוף ממקומות העבודה בשעה בסוף יום בשעה 17:15",
          "איסוף ממקומות העבודה בסוף יום בשעה 17:15",
        )
        .replace(
          "איסוף ממקומות העבודה בשעה בסוף יום 17:15",
          "איסוף ממקומות העבודה בסוף יום בשעה 17:15",
        );
      html += `<div class="route-note top-note">${infoSVG} ${esc(note)}</div>`;
    }
    if (internal.sub_routes) {
      const orderedSubs = [...internal.sub_routes].sort((a, b) => {
        const score = (s) =>
          s.name.includes("מסלול א") || s.name.includes("109")
            ? 0
            : s.name.includes("מסלול ב") || s.name.includes("105")
              ? 1
              : 2;
        return score(a) - score(b);
      });
      orderedSubs.forEach((sub) => {
        const stopKeyword = sub.name.includes("מסלול א")
          ? "גף טיסה 109"
          : sub.name.includes("מסלול ב")
            ? "גף טיסה 105"
            : null;
        html += renderRouteCard(sub, { view: "internal", stopKeyword, splitReinforcement: true });
      });
    }
  } else if (view === "live") {
    html += renderLiveContent();
  } else if (view === "hada") {
    html += renderHadaContent();
  } else if (view === "oncall") {
    html += renderOnCallContent();
  } else if (view === "info") {
    html += renderInfoContent();
  }

  return html;
}

// ─── Line-source helpers ───
function getRouteLinesByStop(keyword) {
  return OLD_ROUTES
    .map((r, i) => {
      const m = r.name.match(/^קו\s*(\d+)/);
      return m ? { kavId: `kav${i + 1}`, label: `קו ${m[1]}` } : null;
    })
    .filter((entry, i) => {
      if (!entry) return false;
      return OLD_ROUTES[i].schedule.some(
        (e) => e.stops && e.stops.some((s) => s.includes(keyword)),
      );
    });
}

// ═══════════════════════════════════════════
// LIVE TRACKING — rider reports & arrival estimates
// ═══════════════════════════════════════════
// Riders report the stop they boarded at; everyone else gets to see where the
// bus is and when it should reach them. Estimates come from src/lib/liveEta.js,
// which learns each route's real pace from the last week of reports.

const LIVE_STATE = {
  model: null,
  live: [],
  // Reports this device just sent. The API caches its response for a few
  // seconds, so without these a rider's own report would blink out of the UI
  // on the next poll and look like it was lost.
  pending: [],
  trips: [],
  totals: { week: 0, today: 0 },
  loaded: false,
  failed: false,
  fetchedAt: 0,
};

// Anonymous per-device id. It never leaves the device except as this opaque
// string, and it exists only so the API can rate-limit and de-duplicate.
function getClientId() {
  try {
    let id = localStorage.getItem("shuttle_client_id");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "c" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("shuttle_client_id", id);
    }
    return id;
  } catch (e) {
    // Private mode with storage blocked: a per-tab id still works.
    if (!window.__shuttleClientId) {
      window.__shuttleClientId = "tmp" + Math.random().toString(36).slice(2);
    }
    return window.__shuttleClientId;
  }
}

function nowMinutesOfDay() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function recomputeActiveTrips() {
  const now = Date.now();
  const age = (r) => r.ageMinutes + (now - (r.receivedAt || now)) / 60000;

  // Drop a pending report once the server echoes it back, or once it is old
  // enough that it no longer matters either way.
  LIVE_STATE.pending = LIVE_STATE.pending.filter((pending) => {
    if (age(pending) > 10) return false;
    return !LIVE_STATE.live.some(
      (r) =>
        r.routeKey === pending.routeKey &&
        r.tripTime === pending.tripTime &&
        r.stopIndex === pending.stopIndex,
    );
  });

  const aged = [...LIVE_STATE.live, ...LIVE_STATE.pending].map((r) => ({
    ...r,
    ageMinutes: age(r),
  }));
  LIVE_STATE.trips = activeTrips(aged, nowMinutesOfDay());
}

async function loadLiveData(opts) {
  const options = opts || {};
  try {
    const res = await fetch("/api/reports", { cache: "no-store" });
    if (!res.ok) throw new Error("API returned " + res.status);
    const payload = await res.json();
    const receivedAt = Date.now();
    LIVE_STATE.model = payload.model || null;
    LIVE_STATE.live = (Array.isArray(payload.live) ? payload.live : []).map((r) => ({
      ...r,
      receivedAt,
    }));
    LIVE_STATE.totals = payload.totals || { week: 0, today: 0 };
    LIVE_STATE.loaded = true;
    LIVE_STATE.failed = false;
  } catch (e) {
    // The schedule is the product; live reports are a bonus. A failure here
    // must never take the timetable down with it.
    console.warn("Live reports unavailable", e);
    LIVE_STATE.failed = true;
    LIVE_STATE.loaded = true;
  }
  LIVE_STATE.fetchedAt = Date.now();
  recomputeActiveTrips();
  // The info tab shows no live data, so leave it alone entirely.
  if (options.rerender !== false && currentView !== "info") {
    renderCurrentView({ preserveScroll: true });
  }
}

// ─── Which routes can be reported on ───
// One entry per card the user actually sees, so a report always names a route
// the rest of the app can match it back to.
let trackableCache = null;

// The registry is rebuilt from DATA/OLD_ROUTES, and every card on screen asks
// for it — memoise it and clear it whenever the underlying data changes.
function invalidateTrackableRoutes() {
  trackableCache = null;
}

function getTrackableRoutes() {
  if (trackableCache) return trackableCache;
  const routes = [];

  const push = (id, view, name, stops, times) => {
    const cleanTimes = Array.from(
      new Set((times || []).map((t) => String(t).trim()).filter((t) => /^\d{1,2}:\d{2}$/.test(t))),
    ).sort((a, b) => timeToMins(a) - timeToMins(b));
    if (!stops || stops.length === 0 || cleanTimes.length === 0) return;
    routes.push({
      id,
      view,
      name,
      // The key is what lands in the database — keep it stable and readable.
      key: view + "|" + name,
      stops,
      times: cleanTimes,
    });
  };

  const busRoutes = DATA.bus_routes || [];
  if (busRoutes[0]) {
    push("train-0", "train", busRoutes[0].name, busRoutes[0].stops, getAllDepartureTimes(busRoutes[0]));
  }
  if (busRoutes[1]) {
    push("train-1", "train", busRoutes[1].name, busRoutes[1].stops, getAllDepartureTimes(busRoutes[1]));
  }
  if (busRoutes[3]) {
    push("tzomet-0", "tzomet", busRoutes[3].name, busRoutes[3].stops, getAllDepartureTimes(busRoutes[3]));
  }
  if (busRoutes[2] && busRoutes[2].sub_routes) {
    busRoutes[2].sub_routes.forEach((sub, i) => {
      push("internal-" + i, "internal", sub.name, sub.stops, getAllDepartureTimes(sub));
    });
  }

  const hadaGroups = getHadaTrips();
  const hadaCards = [
    ...buildHadaCards("מסלול א׳", hadaGroups["109"]),
    ...buildHadaCards("מסלול ב׳", hadaGroups["105"]),
    ...buildHadaCards("מסלול תחזוקה", hadaGroups.maintenance),
  ];
  hadaCards.forEach((card, i) => {
    push("hada-" + i, "hada", 'חד"א · ' + card.title, card.stops, card.times);
  });

  trackableCache = routes;
  return routes;
}

function timeToMins(t) {
  const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 9999;
}

function findTrackableById(id) {
  return getTrackableRoutes().find((r) => r.id === id) || null;
}

function findTrackableByKey(key) {
  return getTrackableRoutes().find((r) => r.key === key) || null;
}

// ─── What to show for a route right now ───
// A reported bus wins; otherwise fall back to the next scheduled departure and
// the learned averages, so a stop still gets a time when nobody has reported.
function getLiveContext(routeKey, times) {
  const live = activeTripForRoute(LIVE_STATE.trips, routeKey);
  if (live) return { trip: live, tripTime: live.tripTime, isLive: true };

  const nowMins = nowMinutesOfDay();
  const next = (times || [])
    .map((t) => ({ time: t, mins: timeToMins(t) }))
    .filter((t) => t.mins >= nowMins && t.mins - nowMins <= 120)
    .sort((a, b) => a.mins - b.mins)[0];
  if (!next) return null;
  return { trip: null, tripTime: next.time, isLive: false };
}

function etaForStop(routeKey, ctx, stopIndex) {
  if (!ctx || !ctx.tripTime) return null;
  return estimateArrival(LIVE_STATE.model, {
    routeKey,
    tripTime: ctx.tripTime,
    stopIndex,
    liveReport: ctx.trip,
    nowMinutes: nowMinutesOfDay(),
  });
}

function formatRelativeMinutes(mins) {
  if (mins === null || mins === undefined) return "";
  if (mins <= -2) return "אמור לחלוף";
  if (mins <= 0) return "עכשיו";
  if (mins === 1) return "בעוד דקה";
  if (mins < 60) return "בעוד " + mins + " דק׳";
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? "בעוד " + hours + " שע׳" : "בעוד " + hours + " שע׳ ו" + rest + " דק׳";
}

function formatAgo(mins) {
  const m = Math.max(0, Math.round(mins));
  if (m === 0) return "ממש עכשיו";
  if (m === 1) return "לפני דקה";
  return "לפני " + m + " דק׳";
}

function confidenceLabel(confidence) {
  if (confidence === "high") return "דיוק גבוה";
  if (confidence === "medium") return "דיוק בינוני";
  if (confidence === "low") return "דיוק נמוך";
  return "הערכה ראשונית";
}

// The stops a rider still cares about: everything ahead of where the bus was
// last seen, minus the ones it should already have cleared.
function upcomingStopRows(route, ctx, limit) {
  const seenIndex = ctx && ctx.trip ? ctx.trip.stopIndex : -1;
  const ahead = route.stops
    .map((stop, i) => ({ stop, i }))
    .filter((s) => s.i > seenIndex)
    .map((s) => ({ ...s, eta: etaForStop(route.key, ctx, s.i) }))
    .filter((s) => s.eta);

  const stillComing = ahead.filter((s) => s.eta.inMinutes >= -1);
  // If every estimate is already in the past the bus is late, not finished —
  // keep showing the stops rather than an empty list.
  const rows = stillComing.length > 0 ? stillComing : ahead;
  return limit ? rows.slice(0, limit) : rows;
}

function renderEtaRows(rows) {
  return rows
    .map(
      (s) => `<div class="live-eta-row">
        <span class="live-eta-stop">${esc(s.stop)}</span>
        <span class="live-eta-time">${esc(s.eta.time)}</span>
        <span class="live-eta-rel">${esc(formatRelativeMinutes(s.eta.inMinutes))}</span>
      </div>`,
    )
    .join("");
}

// ─── Live strip on a route card ───
function renderLiveStrip(routeKey, route) {
  if (!routeKey || !route) return "";
  const trackId = route.id;
  const reportBtn = `<button type="button" class="live-report-btn" onclick="openReportModal('${trackId}')">
      <span class="material-symbols-rounded">campaign</span>
      דיווח: אני על הקו
    </button>`;

  const ctx = getLiveContext(routeKey, route.times);
  if (!ctx || !ctx.isLive) {
    return `<div class="live-strip live-strip--idle">
      <div class="live-strip-main">
        <span class="live-strip-icon material-symbols-rounded">radar</span>
        <div class="live-strip-text">
          <span class="live-strip-title">אין דיווח חי על הקו הזה</span>
          <span class="live-strip-sub">אם את.ה על האוטובוס — דווח.י ותעזור.י לכולם לדעת איפה הוא</span>
        </div>
      </div>
      ${reportBtn}
    </div>`;
  }

  const trip = ctx.trip;
  const remaining = renderEtaRows(upcomingStopRows(route, ctx, 3));

  const delayNote =
    trip && LIVE_STATE.model
      ? (() => {
          const eta = etaForStop(routeKey, ctx, trip.stopIndex + 1);
          if (!eta) return "";
          const d = Math.round(eta.delay);
          if (d >= 3) return `<span class="live-delay live-delay--late">מאחר בכ־${d} דק׳</span>`;
          if (d <= -3) return `<span class="live-delay live-delay--early">מקדים בכ־${Math.abs(d)} דק׳</span>`;
          return `<span class="live-delay live-delay--ontime">בזמן</span>`;
        })()
      : "";

  const reporters =
    trip.reports > 1 ? `<span class="live-reporters">${trip.reports} דיווחים</span>` : "";

  return `<div class="live-strip live-strip--active">
    <div class="live-strip-main">
      <span class="live-dot live-dot--pulse"></span>
      <div class="live-strip-text">
        <span class="live-strip-title">האוטובוס של ${esc(trip.tripTime)} נצפה ב${esc(trip.stopName)}</span>
        <span class="live-strip-sub">${esc(formatAgo(trip.ageMinutes))} ${delayNote ? "· " : ""}${delayNote} ${reporters}</span>
      </div>
    </div>
    ${remaining ? `<div class="live-eta-list">${remaining}</div>` : ""}
    ${reportBtn}
  </div>`;
}

// ─── Report modal ───
// Three taps: which line, which departure, which stop. Defaults are guessed
// from the clock so the common case is usually a single confirm.
const reportDraft = { trackId: null, tripTime: null, stopIndex: null, sending: false };

function openReportModal(trackId) {
  const routes = getTrackableRoutes();
  if (routes.length === 0) return;
  const route = trackId ? findTrackableById(trackId) : null;

  reportDraft.trackId = route ? route.id : null;
  reportDraft.tripTime = null;
  reportDraft.stopIndex = null;
  reportDraft.sending = false;

  if (route) autofillReportDraft(route);

  let overlay = document.getElementById("report-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "report-modal-overlay";
    overlay.className = "report-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeReportModal();
    });
  }
  document.body.classList.add("report-modal-open");
  renderReportModal();
}

// Pick the departure that is most likely the one they are sitting on: the last
// one that has already left within the hour, else the next one out.
function autofillReportDraft(route) {
  const nowMins = nowMinutesOfDay();
  const withMins = route.times.map((t) => ({ time: t, mins: timeToMins(t) }));
  const justLeft = withMins
    .filter((t) => t.mins <= nowMins && nowMins - t.mins <= 60)
    .sort((a, b) => b.mins - a.mins)[0];
  const next = withMins.filter((t) => t.mins > nowMins).sort((a, b) => a.mins - b.mins)[0];
  const pick = justLeft || next;
  if (pick) reportDraft.tripTime = pick.time;
}

function closeReportModal() {
  const overlay = document.getElementById("report-modal-overlay");
  if (!overlay) return;
  document.body.classList.remove("report-modal-open");
  overlay.remove();
}

function clearReportRoute() {
  reportDraft.trackId = null;
  reportDraft.tripTime = null;
  reportDraft.stopIndex = null;
  renderReportModal();
}

function selectReportRoute(trackId) {
  const route = findTrackableById(trackId);
  if (!route) return;
  reportDraft.trackId = trackId;
  reportDraft.tripTime = null;
  reportDraft.stopIndex = null;
  autofillReportDraft(route);
  renderReportModal();
}

function selectReportTrip(time) {
  reportDraft.tripTime = time;
  renderReportModal();
}

function selectReportStop(index) {
  reportDraft.stopIndex = Number(index);
  renderReportModal();
}

function renderReportModal() {
  const overlay = document.getElementById("report-modal-overlay");
  if (!overlay) return;

  const routes = getTrackableRoutes();
  const route = reportDraft.trackId ? findTrackableById(reportDraft.trackId) : null;

  const routeStep = route
    ? `<div class="report-chosen">
        <div class="report-chosen-text">
          <span class="report-chosen-label">הקו שדיווחת עליו</span>
          <span class="report-chosen-value">${esc(route.name)}</span>
        </div>
        <button type="button" class="report-change-btn" onclick="clearReportRoute()">החלפה</button>
      </div>`
    : `<div class="report-step">
        <div class="report-step-title"><span class="report-step-num">1</span>באיזה קו את.ה נוסע.ת?</div>
        <div class="report-options report-options--routes">
          ${routes
            .map(
              (r) =>
                `<button type="button" class="report-option report-option--route" onclick="selectReportRoute('${r.id}')">${esc(r.name)}</button>`,
            )
            .join("")}
        </div>
      </div>`;

  let tripStep = "";
  let stopStep = "";

  if (route) {
    tripStep = `<div class="report-step">
      <div class="report-step-title"><span class="report-step-num">2</span>באיזו יציאה?</div>
      <div class="report-options">
        ${route.times
          .map((t) => {
            const active = t === reportDraft.tripTime ? " report-option--active" : "";
            return `<button type="button" class="report-option report-option--time${active}" onclick="selectReportTrip('${esc(t)}')">${esc(t)}</button>`;
          })
          .join("")}
      </div>
    </div>`;

    stopStep = `<div class="report-step">
      <div class="report-step-title"><span class="report-step-num">3</span>באיזו תחנה עלית?</div>
      <div class="report-options report-options--stops">
        ${route.stops
          .map((stop, i) => {
            const active = i === reportDraft.stopIndex ? " report-option--active" : "";
            return `<button type="button" class="report-option report-option--stop${active}" onclick="selectReportStop(${i})">
              <span class="report-stop-num">${i + 1}</span>${esc(stop)}
            </button>`;
          })
          .join("")}
      </div>
    </div>`;
  }

  const ready = !!(route && reportDraft.tripTime && reportDraft.stopIndex !== null);
  const submitLabel = reportDraft.sending ? "שולח..." : "שליחת דיווח";

  overlay.innerHTML = `
    <div class="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div class="report-modal-head">
        <div>
          <h2 id="report-title" class="report-title">דיווח על האוטובוס</h2>
          <p class="report-subtitle">הדיווח מראה לכולם איפה האוטובוס נמצא, ומשפר את זמני ההגעה המשוערים</p>
        </div>
        <button type="button" class="report-close" onclick="closeReportModal()" aria-label="סגירה">&times;</button>
      </div>
      <div class="report-modal-body">
        ${routeStep}
        ${tripStep}
        ${stopStep}
      </div>
      <div class="report-modal-foot">
        <button type="button" class="report-submit" ${ready && !reportDraft.sending ? "" : "disabled"} onclick="submitReport()">
          ${submitLabel}
        </button>
        <p class="report-privacy">הדיווח אנונימי. דיווחים נשמרים שבוע אחורה ואז נמחקים.</p>
      </div>
    </div>`;
}

async function submitReport() {
  const route = findTrackableById(reportDraft.trackId);
  if (!route || !reportDraft.tripTime || reportDraft.stopIndex === null) return;
  if (reportDraft.sending) return;

  reportDraft.sending = true;
  renderReportModal();

  try {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeKey: route.key,
        tripTime: reportDraft.tripTime,
        stopName: route.stops[reportDraft.stopIndex],
        stopIndex: reportDraft.stopIndex,
        clientId: getClientId(),
      }),
    });

    if (res.status === 429) {
      const payload = await res.json().catch(() => ({}));
      const wait = payload.retryAfterSeconds;
      showToast(
        wait ? `רגע אחד — אפשר לדווח שוב בעוד ${wait} שניות` : "הגעת למכסת הדיווחים להיום",
        "warn",
      );
      reportDraft.sending = false;
      renderReportModal();
      return;
    }
    if (!res.ok) throw new Error("API returned " + res.status);

    closeReportModal();
    showToast("תודה! הדיווח נקלט", "ok");
    // Show the rider their own report immediately instead of waiting for the
    // next poll — the API's shared cache can lag a few seconds behind.
    LIVE_STATE.pending.push({
      routeKey: route.key,
      tripTime: reportDraft.tripTime,
      stopName: route.stops[reportDraft.stopIndex],
      stopIndex: reportDraft.stopIndex,
      ageMinutes: 0,
      receivedAt: Date.now(),
    });
    recomputeActiveTrips();
    renderCurrentView({ preserveScroll: true });
    setTimeout(() => loadLiveData(), 3000);
  } catch (e) {
    console.error("Report failed", e);
    showToast("שליחת הדיווח נכשלה. נסו שוב", "error");
    reportDraft.sending = false;
    renderReportModal();
  }
}

function showToast(message, kind) {
  const existing = document.getElementById("shuttle-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "shuttle-toast";
  toast.className = "shuttle-toast shuttle-toast--" + (kind || "ok");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("shuttle-toast--out"), 2600);
  setTimeout(() => toast.remove(), 3000);
}

// ─── Live view ───
function renderLiveContent() {
  const routes = getTrackableRoutes();
  const byKey = new Map(routes.map((r) => [r.key, r]));
  const trips = LIVE_STATE.trips.filter((t) => byKey.has(t.routeKey));

  let html = `<div class="live-intro">
    <div class="live-intro-head">
      <span class="material-symbols-rounded live-intro-icon">near_me</span>
      <div>
        <h2 class="live-intro-title">איפה האוטובוס עכשיו</h2>
        <p class="live-intro-sub">הנתונים כאן מגיעים מנוסעים שדיווחו מאיזו תחנה הם עלו. ככל שיש יותר דיווחים, זמני ההגעה מדויקים יותר.</p>
      </div>
    </div>
    <button type="button" class="live-cta" onclick="openReportModal(null)">
      <span class="material-symbols-rounded">campaign</span>
      דיווח על נסיעה
    </button>
  </div>`;

  if (LIVE_STATE.failed) {
    html += `<div class="route-note">${infoSVG} לא הצלחנו לטעון דיווחים כרגע. לוחות הזמנים למטה עדיין מעודכנים.</div>`;
    return html;
  }

  if (!LIVE_STATE.loaded) {
    html += `<div class="live-empty">טוען דיווחים...</div>`;
    return html;
  }

  if (trips.length === 0) {
    html += `<div class="live-empty">
      <span class="material-symbols-rounded live-empty-icon">radar</span>
      <p class="live-empty-title">אין כרגע אוטובוס מדווח</p>
      <p class="live-empty-sub">הדיווח הראשון של היום הוא שלך — לוקח שתי לחיצות.</p>
    </div>`;
  }

  trips.forEach((trip) => {
    const route = byKey.get(trip.routeKey);
    const ctx = { trip, tripTime: trip.tripTime, isLive: true };
    const upcoming = upcomingStopRows(route, ctx, 6);
    const rows = renderEtaRows(upcoming);
    const confidence = upcoming.length ? confidenceLabel(upcoming[0].eta.confidence) : "";

    html += `<div class="route-card live-card">
      <div class="route-card-header">
        <div class="route-card-title">${formatRouteTitle(route.name)}</div>
      </div>
      <div class="live-card-status">
        <span class="live-dot live-dot--pulse"></span>
        <div class="live-card-status-text">
          <span class="live-strip-title">יציאת ${esc(trip.tripTime)} · נצפה ב${esc(trip.stopName)}</span>
          <span class="live-strip-sub">${esc(formatAgo(trip.ageMinutes))}${trip.reports > 1 ? " · " + trip.reports + " דיווחים" : ""}${confidence ? " · " + confidence : ""}</span>
        </div>
      </div>
      <div class="route-card-body">
        ${
          rows
            ? `<div class="card-block times-block-compact">
                <div class="card-block-header static">
                  <div class="card-block-title">${clockSVG} צפי הגעה לתחנות הבאות</div>
                </div>
                <div class="live-eta-list">${rows}</div>
              </div>`
            : `<div class="route-note">${infoSVG} האוטובוס בתחנה האחרונה במסלול.</div>`
        }
        <button type="button" class="live-report-btn live-report-btn--wide" onclick="openReportModal('${route.id}')">
          <span class="material-symbols-rounded">campaign</span>
          גם אני על הקו הזה
        </button>
      </div>
    </div>`;
  });

  const totals = LIVE_STATE.totals || { week: 0, today: 0 };
  html += `<div class="live-footnote">
    ${infoSVG}
    <span>${totals.today} דיווחים היום · ${totals.week} בשבוע האחרון. הזמנים משוערים ומבוססים על דיווחי נוסעים — לא על מיקום האוטובוס בפועל.</span>
  </div>`;

  return html;
}

window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.selectReportRoute = selectReportRoute;
window.clearReportRoute = clearReportRoute;
window.selectReportTrip = selectReportTrip;
window.selectReportStop = selectReportStop;
window.submitReport = submitReport;

// ─── Navigate To ───
function navigateTo(view, opts) {
  opts = opts || {};
  currentView = view;
  highlightTime = opts.highlightTime || null;
  if (opts.activeKav) activeOldRoute = opts.activeKav;
  // Update URL hash (pushState for back-button support)
  if (window.location.hash !== "#" + view) {
    history.pushState(null, "", "#" + view);
  }
  renderCurrentView();
}

// Handle browser back/forward navigation
window.addEventListener("popstate", () => {
  const view = getViewFromHash();
  if (view !== currentView) {
    currentView = view;
    highlightTime = null;
    renderCurrentView();
  }
});
window.navigateTo = navigateTo;

// ─── Render Current View (master renderer) ───
// `opts.preserveScroll` keeps the reader where they are. Background refreshes
// (new rider reports arriving) use it; a tab change still jumps to the top.
function renderCurrentView(opts) {
  const preserveScroll = !!(opts && opts.preserveScroll);
  const container = document.getElementById("app-content");
  const nav = document.getElementById("main-nav");

  nav.innerHTML = renderTopTabs();

  if (currentView === "home") {
    container.parentElement.classList.add("content-home");
    container.innerHTML = renderHomePage();
    if (!preserveScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    container.parentElement.classList.remove("content-home");
    container.innerHTML = renderRouteContent(currentView);

    if (currentView === "info") attachOldRouteTabListeners();

    // Highlight specific time if navigating from board
    if (highlightTime) {
      requestAnimationFrame(() => {
        const timeToFind = highlightTime;
        highlightTime = null;
        const block = container.querySelector(`.stops-block[data-time="${timeToFind}"]`);
        if (block) {
          block.classList.add("open", "dep-time-highlight");
          block.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => block.classList.remove("dep-time-highlight"), 3000);
          return;
        }
        const allTimeEls = container.querySelectorAll(
          ".dep-time-item, .dep-chip-time, .block-time, .sched-time",
        );
        for (const el of allTimeEls) {
          if (el.textContent.trim() === timeToFind) {
            el.classList.add("dep-time-highlight");
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => el.classList.remove("dep-time-highlight"), 3000);
            break;
          }
        }
      });
    } else if (!preserveScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

// ─── חד"א (Cafeteria) Direction Data ───
function classifyHadaArea(stops) {
  const s = stops.join(" ");
  if (s.includes("גף מנועים")) return "maintenance";
  if (s.includes("גף טיסה 109") || s.includes("גף טכני 109")) return "109";
  return "105";
}

function getHadaTrips() {
  const groups = { 105: [], 109: [], maintenance: [] };
  OLD_ROUTES.forEach((route) => {
    route.schedule.forEach((entry) => {
      if (entry.type !== "נסיעה" || !entry.stops) return;
      const first = entry.stops[0];
      const last = entry.stops[entry.stops.length - 1];
      if (!isHadaStop(first) && !isHadaStop(last)) return;
      const area = classifyHadaArea(entry.stops);
      groups[area].push({ time: entry.time, stops: entry.stops, routeName: route.name });
    });
  });
  const parseTime = (t) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
  };
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }
  return groups;
}

// ─── Sync destination tabs (train / צומת) from the line schedules ───
// The רכבת and צומת tabs are DERIVED from OLD_ROUTES so they can never drift
// out of sync with the קו 1–5 tables. (חד"א is already derived via getHadaTrips.)
// A time is marked as reinforcement ("תגבור") only if it appears *exclusively*
// on a reinforcement line (קו 5) and on no regular line.
function deriveDeparturesByStops(predicate) {
  const toMin = (t) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
  };
  const regular = new Set();
  const reinforce = new Set();
  OLD_ROUTES.forEach((route) => {
    const isReinforce = /תגבור/.test(route.name);
    route.schedule.forEach((entry) => {
      if (entry.type !== "נסיעה" || !entry.stops || !entry.stops.length) return;
      if (!/^\d{1,2}:\d{2}$/.test(entry.time)) return;
      if (!predicate(entry.stops)) return;
      (isReinforce ? reinforce : regular).add(entry.time);
    });
  });
  const times = Array.from(new Set([...regular, ...reinforce]));
  times.sort((a, b) => toMin(a) - toMin(b));
  return times.map((time) =>
    regular.has(time) ? { time } : { time, note: "תגבור- רק בימי ראשון וחמישי" },
  );
}

function syncDestinationsFromLines() {
  const routes = DATA && DATA.bus_routes;
  if (!Array.isArray(routes)) return;
  const TRAIN = "רכבת כפר יהושע";
  const TZOMET = "צומת רמת דוד";

  if (routes[0]) {
    routes[0].departure_times = deriveDeparturesByStops((stops) =>
      stops[stops.length - 1].includes(TRAIN),
    );
    delete routes[0].departure_times_str;
  }
  if (routes[1]) {
    routes[1].departure_times = deriveDeparturesByStops((stops) =>
      stops[0].includes(TRAIN),
    );
    delete routes[1].departure_times_str;
  }
  if (routes[3]) {
    routes[3].departure_times = deriveDeparturesByStops((stops) =>
      stops.some((s) => s.includes(TZOMET)),
    );
    delete routes[3].departure_times_str;
  }

  // Internal work-area dispersal (105 / 109): the admin panel is the source
  // of truth. Times saved there (departure_times_str or departure_times) are
  // kept as-is so logistics can edit both lines directly. Only when a
  // sub-route has no admin-set times do we fall back to deriving them from
  // the קו 1–5 line tables: trips that depart from רחבת היסעים and stop at
  // the area. Trips departing צומת רמת דוד also count — they reach the רחבה
  // minutes later and continue into the base (this is how the 105 loop gets
  // its morning runs from קו 3/קו 4). Trips that originate elsewhere
  // (רכבת, חד"א) are excluded — their time is the departure from that
  // origin, not from the רחבה, so showing them here is misleading.
  const internal = routes[2];
  if (internal && Array.isArray(internal.sub_routes)) {
    internal.sub_routes.forEach((sub) => {
      const hasAdminTimes =
        (typeof sub.departure_times_str === "string" &&
          sub.departure_times_str.trim() !== "") ||
        (Array.isArray(sub.departure_times) && sub.departure_times.length > 0);
      if (hasAdminTimes) return;
      const kw = /109|מסלול א/.test(sub.name)
        ? "גף טיסה 109"
        : /105|מסלול ב/.test(sub.name)
          ? "גף טיסה 105"
          : null;
      if (!kw) return;
      sub.departure_times = deriveDeparturesByStops(
        (stops) =>
          (stops[0].includes("רחבת היסעים") ||
            stops[0].includes("צומת רמת דוד")) &&
          stops.some((s) => s.includes(kw)),
      );
      delete sub.departure_times_str;
    });
  }
}

// Merge an area's חד"א trips into at most two cards — one per direction
// (אל חד"א / מחד"א) — so each time appears once and near-identical line
// variants collapse into a single readable card per direction.
function buildHadaCards(maslulLabel, trips) {
  if (!trips || trips.length === 0) return [];
  const parseTime = (t) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
  };
  const dirs = { to: [], from: [] };
  trips.forEach((t) => {
    const fromHada = isHadaStop(t.stops[0]);
    const toHada = isHadaStop(t.stops[t.stops.length - 1]);
    // Loops (חד"א→...→חד"א) serve both directions: they return the first
    // round's diners and pick up the next round (סבב ב) on the way back,
    // so they appear under both אל חד"א and מחד"א.
    if (fromHada) dirs.from.push(t);
    if (toHada) dirs.to.push(t);
  });
  const active = [
    ["to", 'אל חד"א'],
    ["from", 'מחד"א'],
  ].filter(([k]) => dirs[k].length);

  return active.map(([k, dirLabel]) => {
    const bucket = dirs[k];
    const times = Array.from(new Set(bucket.map((t) => t.time))).sort(
      (a, b) => parseTime(a) - parseTime(b),
    );
    // representative path = the most complete (longest) variant in the
    // bucket; for אל חד"א prefer a variant that actually starts outside
    // חד"א over a loop, so the shown path matches the direction
    const pool =
      k === "to" && bucket.some((t) => !isHadaStop(t.stops[0]))
        ? bucket.filter((t) => !isHadaStop(t.stops[0]))
        : bucket;
    const stops = pool.reduce(
      (best, t) => (t.stops.length > best.length ? t.stops : best),
      [],
    );
    const title = active.length > 1 ? `${maslulLabel} · ${dirLabel}` : maslulLabel;
    return { title, times, stops };
  });
}

function renderHadaRouteCard(title, times, stops) {
  const upcoming = getUpcomingFromTimes(times);
  const countdown = renderCountdownFromUpcoming(upcoming);
  const timesHtml = renderDepartureTimesStr(times.join("-"));

  const track = findTrackableByKey('hada|חד"א · ' + title);
  const liveCtx = track ? getLiveContext(track.key, track.times) : null;
  const stopsHtml = renderStopsCard(stops, {
    routeKey: track ? track.key : null,
    ctx: liveCtx,
  });
  const liveHtml = track ? renderLiveStrip(track.key, track) : "";

  return `
    <div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">${formatRouteTitle(title)}</div>
      </div>
      ${countdown}
      ${liveHtml}
      <div class="route-card-body">
        ${timesHtml}
        ${stopsHtml}
      </div>
    </div>`;
}

function renderHadaContent() {
  const groups = getHadaTrips();
  const cards = [
    ...buildHadaCards("מסלול א׳", groups["109"]),
    ...buildHadaCards("מסלול ב׳", groups["105"]),
    ...buildHadaCards("מסלול תחזוקה", groups.maintenance),
  ];

  return cards
    .map((c) => renderHadaRouteCard(c.title, c.times, c.stops))
    .join("");
}

// ─── On-Call Shuttle ───
function renderOnCallContent() {
  // Find whichever route carries an evening block rather than assuming a fixed
  // index, so the tab still renders if the routes are reordered/edited.
  const eveningRoute = (DATA.bus_routes || []).find((r) => r && r.evening);
  const evening = eveningRoute ? eveningRoute.evening : null;
  const eveningTime = evening && evening.time ? evening.time : "18:00-22:00";
  const eveningBreak = evening ? evening.break : "";

  return `<div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">שאטל לפי קריאה - ערב</div>
      </div>
      <div class="route-card-body">
        <div class="card-block evening-block">
          <div class="card-block-header static">
            <div class="card-block-title">${moonSVG} שעות פעילות <span class="estimated-tag">משוערות</span></div>
          </div>
          <div class="evening-info">
            <div class="dep-chip dep-chip--evening">
              <span class="dep-chip-time">${esc(eveningTime)}</span>
            </div>
            ${eveningBreak ? `<div class="evening-note">${esc(eveningBreak)}</div>` : ""}
          </div>
        </div>
        <div class="route-note">${infoSVG}   הזמנות שאטל בשעות 18:00 עד 22:00 יבוצעו דרך מבצעים / הטסה מול מוצב מנהלה</div>
      </div>
    </div>`;
}

// ─── Old Routes ───
let activeOldRoute = "kav1";

function renderOldRouteTabsHtml() {
  const tabs = OLD_ROUTES.map((r, i) => {
    const id = `kav${i + 1}`;
    const label = r.name.split(" - ")[0];
    return `<button class="route-tab ${id === activeOldRoute ? "active" : ""}" data-oldroute="${id}">${esc(label)}</button>`;
  }).join("");
  return `<div class="route-tabs" id="oldroute-tabs">${tabs}</div>`;
}

function isHadaStop(name) {
  return name.includes('חד"א') || name.includes('חד"א');
}

function renderScheduleEntry(entry) {
  const timeHtml = `<span class="sched-time">${esc(entry.time)}</span>`;

  if (entry.type === "הפסקה") {
    return `<div class="sched-entry sched-break">
      ${timeHtml}
      <span class="sched-type-badge sched-badge-break">הפסקה</span>
    </div>`;
  }

  if (entry.type === "סוף יום") {
    return `<div class="sched-entry sched-end">
      ${timeHtml}
      <span class="sched-type-badge sched-badge-end">סוף יום</span>
    </div>`;
  }

  if (entry.type === "איסוף") {
    return `<div class="sched-entry sched-pickup">
      ${timeHtml}
      <span class="sched-type-badge sched-badge-pickup">איסוף</span>
      ${entry.description ? `<span class="sched-desc">${esc(entry.description)}</span>` : ""}
    </div>`;
  }

  if (entry.type === "נסיעה" && entry.stops) {
    const stopsHtml = entry.stops
      .map((stop, i) => {
        const hada = isHadaStop(stop) ? " stop-hada" : "";
        return `<div class="stop-item${hada}"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`;
      })
      .join("");

    return `<div class="sched-entry sched-trip" onclick="this.classList.toggle('open')">
      <div class="sched-trip-header">
        ${timeHtml}
        <span class="sched-type-badge sched-badge-trip">נסיעה</span>
        <span class="sched-stop-count">${entry.stops.length} תחנות</span>
        ${smallChevronSVG}
      </div>
      <div class="sched-trip-stops">
        <div class="stops-list">${stopsHtml}</div>
      </div>
    </div>`;
  }

  return "";
}

function renderOldRouteContentHtml() {
  const idx = parseInt(activeOldRoute.replace("kav", "")) - 1;
  const route = OLD_ROUTES[idx];
  if (!route) return "";

  const scheduleHtml = route.schedule
    .map((entry) => renderScheduleEntry(entry))
    .join("");

  return `
    <div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">${esc(route.name)}</div>
      </div>
      <div class="route-card-body">
        <div class="schedule-timeline-note"><span class="estimated-tag">* זמנים משוערים</span></div>
        <div class="schedule-timeline">
          ${scheduleHtml}
        </div>
      </div>
    </div>`;
}

// ─── Info Tab (stations legend + old routes) ───
function renderInfoContent() {
  let html = "";

  // Stations legend
  html += `<div class="info-section">
    <h2 class="info-section-title">מקרא תחנות הכנף</h2>
    <div class="legend">
      <span class="legend-item">
        <span class="badge badge-service"></span>
        תחנת שירות
      </span>
      <span class="legend-item">
        <span class="badge badge-alt"></span>
        תחנה חלופית
      </span>
    </div>
    <div class="stations-grid">${renderStationsHtml()}</div>
  </div>`;

  // Old routes
  html += `<div class="info-section">
    <h2 class="info-section-title">קווי שאטל</h2>
    ${renderOldRouteTabsHtml()}
    <div id="oldroute-content" class="route-content">${renderOldRouteContentHtml()}</div>
  </div>`;

  return html;
}

function attachOldRouteTabListeners() {
  const container = document.getElementById("oldroute-tabs");
  if (!container) return;
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".route-tab");
    if (!btn) return;
    activeOldRoute = btn.dataset.oldroute;
    container
      .querySelectorAll(".route-tab")
      .forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("oldroute-content").innerHTML =
      renderOldRouteContentHtml();
  });
}

// ─── Countdown Timer ───
let countdownTimer = null;
let liveTimer = null;

// How often we ask the server for new rider reports while the app is open.
const LIVE_POLL_MS = 45000;

let trackableDay = new Date().getDay();

function refreshContent() {
  if (currentView === "info") return;
  // Departure lists depend on the day (קו 5 runs Sun/Thu only), so a session
  // left open overnight needs the registry rebuilt.
  const today = new Date().getDay();
  if (today !== trackableDay) {
    trackableDay = today;
    invalidateTrackableRoutes();
  }
  recomputeActiveTrips();
  // A timer tick is a refresh, not a navigation — re-render in place so a
  // reader following the countdown or the live arrival list isn't scrolled
  // back to the top of the page every minute.
  renderCurrentView({ preserveScroll: true });
}

function startCountdownTimer() {
  stopCountdownTimer();
  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  countdownTimer = setTimeout(function tick() {
    refreshContent();
    countdownTimer = setInterval(refreshContent, 60000);
  }, msToNextMinute);
}

function stopCountdownTimer() {
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startLivePolling() {
  stopLivePolling();
  liveTimer = setInterval(() => loadLiveData(), LIVE_POLL_MS);
}

function stopLivePolling() {
  if (liveTimer) {
    clearInterval(liveTimer);
    liveTimer = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    recomputeActiveTrips();
    renderCurrentView();
    startCountdownTimer();
    // Coming back to a backgrounded tab: reports may be minutes stale.
    if (Date.now() - LIVE_STATE.fetchedAt > LIVE_POLL_MS) loadLiveData();
    startLivePolling();
  } else {
    stopCountdownTimer();
    stopLivePolling();
  }
});

window.addEventListener("focus", () => {
  renderCurrentView();
});

// ─── Init ───
document.addEventListener("DOMContentLoaded", async () => {
  const appContent = document.getElementById("app-content");
  if (!appContent) return; // Not the public page

  appContent.innerHTML =
    '<div style="text-align:center; padding: 2rem;">טוען נתונים...</div>';

  try {
    const res = await fetch("/api/data");
    if (res.ok) {
      const dbData = await res.json();
      if (dbData.units && dbData.units.length > 0) {
        DATA.units = dbData.units;
      }
      if (dbData.bus_routes && dbData.bus_routes.length > 0) {
        DATA.bus_routes = dbData.bus_routes;
      }
      if (dbData.old_routes && dbData.old_routes.length > 0) {
        OLD_ROUTES = dbData.old_routes;
        window.OLD_ROUTES = OLD_ROUTES;
      }
    } else {
      throw new Error("API returned " + res.status);
    }
  } catch (e) {
    console.error("Failed to load data from API, using fallback", e);
    const toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#f44336; color:white; padding:10px 20px; border-radius:4px; z-index:9999; font-family:Rubik,sans-serif;";
    toast.textContent = "שגיאה בטעינת נתונים עדכניים. מוצגים נתוני גיבוי.";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
  // Keep the destination tabs (רכבת / צומת) in sync with the line tables
  syncDestinationsFromLines();
  // Routes may have just been replaced by the DB payload.
  invalidateTrackableRoutes();
  // Set the hash to reflect the initial view
  if (!window.location.hash) {
    history.replaceState(null, "", "#home");
  }
  renderCurrentView();
  startCountdownTimer();
  // Reports load in the background — the schedule never waits on them.
  loadLiveData();
  startLivePolling();
  maybeShowInstallPrompt();
});

// ─── PWA Install Prompt ───
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.querySelector("[data-install-action]");
  if (installBtn) updateInstallPromptUI();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  closeInstallPrompt();
});

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isIPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edg|OPR/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  return {
    isIOS: isIOS || isIPadOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isSamsung,
    isMobile: isIOS || isIPadOS || isAndroid,
  };
}

function maybeShowInstallPrompt() {
  if (isStandaloneApp()) return;
  setTimeout(showInstallPrompt, 700);
}

function showInstallPrompt() {
  if (document.getElementById("install-prompt-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "install-prompt-overlay";
  overlay.className = "install-overlay";
  overlay.innerHTML = `
    <div class="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div class="install-icon-wrap">
        <img src="/header.jpg" alt="" class="install-icon" />
      </div>
      <div class="install-headline">
        <span class="install-badge">חדש!</span>
        <h2 id="install-title" class="install-title">שמרו את האפליקציה במסך הבית</h2>
        <p class="install-subtitle">גישה מהירה בלחיצה אחת — בלי לפתוח דפדפן, בלי לחפש קישורים. מ��ש כמו אפליקציה אמיתית.</p>
      </div>
      <div class="install-body" data-install-body></div>
      <div class="install-actions">
        <button type="button" class="install-btn-primary" data-install-action>הוסיפו עכשיו למסך הבית</button>
        <button type="button" class="install-btn-secondary" data-install-dismiss>אולי בפעם אחרת</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay
    .querySelector("[data-install-dismiss]")
    .addEventListener("click", dismissInstallPrompt);
  overlay
    .querySelector("[data-install-action]")
    .addEventListener("click", handleInstallAction);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) dismissInstallPrompt();
  });
  document.body.classList.add("install-modal-open");
  updateInstallPromptUI();
}

function updateInstallPromptUI() {
  const overlay = document.getElementById("install-prompt-overlay");
  if (!overlay) return;
  const body = overlay.querySelector("[data-install-body]");
  const primaryBtn = overlay.querySelector("[data-install-action]");
  const platform = detectPlatform();

  if (deferredInstallPrompt) {
    body.innerHTML = `
      <div class="install-auto">
        <span class="material-symbols-rounded install-auto-icon">auto_awesome</span>
        <span>נתקין עבורכם בלחיצה אחת ⬇</span>
      </div>
    `;
    primaryBtn.textContent = "התקינו עכשיו";
    primaryBtn.dataset.mode = "auto";
    return;
  }

  if (platform.isIOS) {
    const canShare = typeof navigator.share === "function";
    if (canShare) {
      body.innerHTML = `
        <div class="install-auto">
          <span class="material-symbols-rounded install-auto-icon">ios_share</span>
          <span>פתחו את תפריט השיתוף ובחרו <strong>"הוסף למסך הבית"</strong></span>
        </div>
        <p class="install-ios-hint">לחיצה אחת תפתח את התפריט. גללו ובחרו ${plusIcon()} <strong>"הוסף למסך הבית"</strong>.</p>
      `;
      primaryBtn.textContent = "פתחו את תפריט ההתקנה";
      primaryBtn.dataset.mode = "ios-share";
    } else {
      body.innerHTML = `
        <ol class="install-steps">
          <li><span class="install-step-num">1</span><span>לחצו על כפתור השיתוף ${shareIconIOS()} בתחתית הדפדפן (Safari)</span></li>
          <li><span class="install-step-num">2</span><span>גללו ובחרו ${plusIcon()} <strong>"הוסף למסך הבית"</strong> (Add to Home Screen)</span></li>
          <li><span class="install-step-num">3</span><span>אשרו עם <strong>"הוסף"</strong> בפינה הימנית העליונה</span></li>
        </ol>
      `;
      primaryBtn.textContent = "הבנתי, סגרו";
      primaryBtn.dataset.mode = "dismiss";
    }
    return;
  }

  if (platform.isAndroid) {
    body.innerHTML = `
      <ol class="install-steps">
        <li><span class="install-step-num">1</span><span>לחצו על תפריט שלוש הנקודות ⋮ בפינת הדפדפן</span></li>
        <li><span class="install-step-num">2</span><span>בחרו <strong>"הוסף למסך הבית"</strong> או <strong>"התקן אפליקציה"</strong></span></li>
        <li><span class="install-step-num">3</span><span>אשרו <strong>"הוסף"</strong> ותקבלו אייקון על המסך</span></li>
      </ol>
    `;
    primaryBtn.textContent = "הבנתי, סגרו";
    primaryBtn.dataset.mode = "dismiss";
    return;
  }

  body.innerHTML = `
    <ol class="install-steps">
      <li><span class="install-step-num">1</span><span>פתחו את תפריט הדפדפן (⋮ או ⋯)</span></li>
      <li><span class="install-step-num">2</span><span>בחרו <strong>"התקן אפליקציה"</strong> או <strong>"הוסף לקיצורי דרך"</strong></span></li>
      <li><span class="install-step-num">3</span><span>אשרו והאפליקציה תיפתח כחלון עצמאי</span></li>
    </ol>
  `;
  primaryBtn.textContent = "הבנתי, סגרו";
  primaryBtn.dataset.mode = "dismiss";
}

function shareIconIOS() {
  return `<svg class="install-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
}
function plusIcon() {
  return `<svg class="install-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
}

async function handleInstallAction(e) {
  const mode = e.currentTarget.dataset.mode;
  if (mode === "auto" && deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice && choice.outcome === "accepted") {
        closeInstallPrompt();
      } else {
        dismissInstallPrompt();
      }
    } catch (err) {
      console.warn("Install prompt failed", err);
      dismissInstallPrompt();
    }
    return;
  }
  if (mode === "ios-share") {
    try {
      await navigator.share({
        title: document.title,
        text: "שאטל כנף 1 — רמת דוד",
        url: window.location.origin + "/",
      });
    } catch (err) {
      // user cancelled or share unsupported — leave the modal open so they can read steps
    }
    return;
  }
  dismissInstallPrompt();
}

function dismissInstallPrompt() {
  closeInstallPrompt();
}

function closeInstallPrompt() {
  const overlay = document.getElementById("install-prompt-overlay");
  if (!overlay) return;
  overlay.classList.add("install-overlay-closing");
  document.body.classList.remove("install-modal-open");
  setTimeout(() => overlay.remove(), 220);
}
