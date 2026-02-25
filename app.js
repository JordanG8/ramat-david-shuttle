// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — APP
// ═══════════════════════════════════════════

import "./src/styles/styles.css";
import {
  DATA as fallbackDATA,
  OLD_ROUTES as fallbackOLD_ROUTES,
} from "./src/data/fallbackData.js";

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
function renderStationsHtml() {
  return DATA.units
    .map((unit) => {
      const deptCount = unit.departments.length;
      const noteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      let noteHtml = unit.notes
        ? `<div class="unit-note">${noteIcon}${esc(unit.notes)}</div>`
        : "";
      if (unit.notes2) {
        noteHtml += `<div class="unit-note">${noteIcon}${esc(unit.notes2)}</div>`;
      }

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
let currentView = "home"; // "home" | "train" | "tzomet" | "internal" | "hada" | "oncall" | "info"
let highlightTime = null;

// ─── Icons ───
const clockSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const mapPinSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const moonSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const infoSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

function renderStopsCard(stops) {
  const stopsHtml = stops
    .map(
      (stop, i) =>
        `<div class="stop-item"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`,
    )
    .join("");
  return `
    <div class="card-block stops-block-static">
      <div class="card-block-header static">
        <div class="card-block-title">${mapPinSVG} תחנות עצירה</div>
      </div>
      <div class="stops-list">
        ${stopsHtml}
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

function renderDepartureList(items, extraClass) {
  return `<div class="departure-list">
    ${items
      .map((d) => {
        const passed = isTimePassed(d.time) ? " dep-time-passed" : "";
        return `<span class="dep-time-item ${extraClass || ""} ${d.note ? "dep-time-item--reinforce" : ""}${passed}">${esc(d.time)}</span>`;
      })
      .join("")}
  </div>`;
}

function renderDepartureTable(departures, filterReinforcement, split) {
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
          ${renderDepartureList(regular)}
        </div>`;
    }
    if (reinforce.length > 0) {
      const reinforceOpen = isReinforcementDay() ? " open" : "";
      html += `
        <div class="card-block times-block-compact times-block--reinforce${reinforceOpen}" onclick="this.classList.toggle('open')">
          <div class="card-block-header reinforce-header">
            <div class="card-block-title">${reinforceSVG} תגבור ראשון וחמישי <span class="estimated-tag">משוער</span></div>
            <div class="card-block-meta">${smallChevronSVG}</div>
          </div>
          <div class="card-block-body">
            ${renderDepartureList(reinforce, "dep-time-item--reinforce")}
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
      ${renderDepartureList(filtered)}
    </div>`;
}

function renderDepartureTimesStr(timesStr) {
  const times = timesStr.split("-");
  return `
    <div class="card-block times-block-compact">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
      </div>
      <div class="departure-list">
        ${times
          .map((t) => {
            const passed = isTimePassed(t.trim()) ? " dep-time-passed" : "";
            return `<span class="dep-time-item${passed}">${esc(t)}</span>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderRouteCard(route, opts) {
  opts = opts || {};
  const filterReinforcement = opts.filterReinforcement || "all";
  const titleOverride = opts.title;
  const hideStops = opts.hideStops;

  let bodyHtml = "";

  if (route.departure_times) {
    bodyHtml += renderDepartureTable(
      route.departure_times,
      filterReinforcement,
      opts.splitReinforcement,
    );
  }

  if (route.departure_times_str) {
    bodyHtml += renderDepartureTimesStr(route.departure_times_str);
  }

  if (route.stops && !hideStops) {
    bodyHtml += renderStopsCard(route.stops);
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

  addRouteEntries(toTrain, "train", "בסיס ← רכבת", "board-badge-train");
  addRouteEntries(fromTrain, "train", "רכבת ← בסיס", "board-badge-train");

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
    tzomet:   "alt_route",
    internal: "directions_bus",
    hada:     "restaurant",
    oncall:   "call",
  };
  return `<span class="material-symbols-rounded">${icons[view] || "airport_shuttle"}</span>`;
}

// ─── Render Departure Board ───
function renderDepartureBoard() {
  const departures = getAllUpcomingDepartures().slice(0, 6);

  let html = `<div class="board-section">`;

  // ── Title bar ──
  html += `<div class="board-title-bar">
    <div class="board-title-right">
      <span class="material-symbols-rounded board-title-icon">airport_shuttle</span>
      <span class="board-title-text">לוח יציאות שאטלים</span>
      <span class="estimated-tag board-estimated">זמן משוער</span>
    </div>
    <span class="live-dot${departures.length > 0 ? ' urgent' : ' dead'}"></span>
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
      html += `<div class="board-row${isUrgent ? ' board-row--urgent' : ''}" onclick="navigateTo('${dep.view}', { highlightTime: '${dep.time}' })">
        <span class="board-cell board-cell-time">${esc(dep.time)}</span>
        <span class="board-cell board-cell-route">
          <span class="board-cell-icon">${getRouteIcon(dep.view)}</span>
          ${esc(dep.routeLabel)}
        </span>
        <span class="board-cell board-cell-eta${isUrgent ? ' board-cell-eta--urgent' : ''}">
          ${isNow ? 'עכשיו!' : dep.diff + ' דק׳'}
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
      icon: railwayIcon,
      label: "בסיס - רכבת כפר יהושע",
      sub: "נסיעות לרכבת הגלילים",
      view: "train",
      iconClass: "nav-btn-icon-wrap--train",
    },
    {
      icon: '<span class="material-symbols-rounded">alt_route</span>',
      label: "צומת רמת דוד - בסיס",
      sub: "שאטל מהצומת לבסיס",
      view: "tzomet",
      iconClass: "nav-btn-icon-wrap--tzomet",
    },
    {
      icon: '<span class="material-symbols-rounded">directions_bus</span>',
      label: "פיזור למקומות עבודה",
      sub: "הסעות פנים בסיס",
      view: "internal",
      iconClass: "nav-btn-icon-wrap--internal",
    },
    {
      icon: '<span class="material-symbols-rounded">restaurant</span>',
      label: 'חד"א',
      sub: "נסיעות לחדר האוכל",
      view: "hada",
      iconClass: "nav-btn-icon-wrap--hada",
    },
    {
      icon: '<span class="material-symbols-rounded">call</span>',
      label: "שאטל לפי קריאה",
      sub: "הזמנת נסיעה",
      view: "oncall",
      iconClass: "nav-btn-icon-wrap--oncall",
    },
    {
      icon: '<span class="material-symbols-rounded">map</span>',
      label: "מקרא תחנות ומידע",
      sub: "מפה ומידע כללי",
      view: "info",
      iconClass: "nav-btn-icon-wrap--info",
    },
  ];

  let html = `<div class="nav-card">`;
  html += `<div class="nav-card-brand">
    <div class="nav-card-brand-text">
      <div class="nav-card-brand-title">אפליקציית השאטלים</div>
      <div class="nav-card-brand-sub">בסיס כנף 1 — רמת דוד</div>
    </div>
  </div>`;
  html += `<div class="nav-card-cta">
    <span class="material-symbols-rounded nav-card-title-icon">explore</span>
    <h2 class="nav-card-title">לאן את.ה צריך להגיע?</h2>
  </div>`;
  html += `<div class="nav-buttons">`;
  buttons.forEach((btn) => {
    html += `<div class="nav-btn" onclick="navigateTo('${btn.view}')">
      <div class="nav-btn-icon-wrap ${btn.iconClass}">
        <span class="nav-btn-icon">${btn.icon}</span>
      </div>
      <div class="nav-btn-text">
        <span class="nav-btn-label">${esc(btn.label)}</span>
        <span class="nav-btn-sub">${esc(btn.sub)}</span>
      </div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

// ─── Render Home Page ───
function renderHomePage() {
  let html = "";
  html += renderDepartureBoard();
  html += renderNavButtons();
  return html;
}

// ─── Render Top Tabs ───
function renderTopTabs() {
  const tabs = [
    { icon: "home", label: "בית", view: "home" },
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
    const iconHtml = tab.icon === "railway"
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
    html += renderRouteCard(toTrain, { splitReinforcement: true });
    html += renderRouteCard(fromTrain, { splitReinforcement: true });
  } else if (view === "tzomet") {
    const tzomet = DATA.bus_routes[3];
    html += renderRouteCard(tzomet, { hideEvening: true });
  } else if (view === "internal") {
    const internal = DATA.bus_routes[2];
    if (internal.note) {
      html += `<div class="route-note top-note">${infoSVG} ${esc(internal.note)}</div>`;
    }
    if (internal.sub_routes) {
      internal.sub_routes.forEach((sub) => {
        html += renderRouteCard(sub);
      });
    }
  } else if (view === "hada") {
    html += renderHadaContent();
  } else if (view === "oncall") {
    html += renderOnCallContent();
  } else if (view === "info") {
    html += renderInfoContent();
  }

  return html;
}

// ─── Navigate To ───
function navigateTo(view, opts) {
  opts = opts || {};
  currentView = view;
  highlightTime = opts.highlightTime || null;
  renderCurrentView();
}
window.navigateTo = navigateTo;

// ─── Render Current View (master renderer) ───
function renderCurrentView() {
  const container = document.getElementById("app-content");
  const nav = document.getElementById("main-nav");

  nav.innerHTML = renderTopTabs();

  if (currentView === "home") {
    container.parentElement.classList.add("content-home");
    container.innerHTML = renderHomePage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    container.parentElement.classList.remove("content-home");
    container.innerHTML = renderRouteContent(currentView);

    if (currentView === "info") attachOldRouteTabListeners();

    // Highlight specific time if navigating from board
    if (highlightTime) {
      requestAnimationFrame(() => {
        const timeToFind = highlightTime;
        highlightTime = null;
        // Find dep-time-item or dep-chip-time matching the time
        const allTimeEls = container.querySelectorAll(
          ".dep-time-item, .dep-chip-time, .card-block-title, .sched-time",
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
    } else {
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
      groups[area].push({ time: entry.time, stops: entry.stops });
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

function renderHadaCard(title, trips) {
  if (trips.length === 0) return "";

  const upcoming = getUpcomingFromTimes(trips.map((t) => t.time));
  const countdown = renderCountdownFromUpcoming(upcoming);

  let html = `<div class="route-card">
    <div class="route-card-header">
      <div class="route-card-title">${title}</div>
    </div>
    ${countdown}
    <div class="route-card-body">`;

  trips.forEach((trip) => {
    const passed = isTimePassed(trip.time) ? " trip-passed" : "";
    const stopsHtml = trip.stops
      .map((stop, i) => {
        const hada = isHadaStop(stop) ? " stop-hada" : "";
        return `<div class="stop-item${hada}"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`;
      })
      .join("");
    html += `
      <div class="card-block stops-block${passed}" onclick="this.classList.toggle('open')">
        <div class="card-block-header">
          <div class="card-block-title">${mapPinSVG} ${esc(trip.time)} <span class="estimated-tag">משוער</span></div>
          <div class="card-block-meta">
            <span class="stop-count-badge">${trip.stops.length} תחנות</span>
            ${smallChevronSVG}
          </div>
        </div>
        <div class="card-block-body">
          <div class="stops-list">${stopsHtml}</div>
        </div>
      </div>`;
  });

  html += `</div></div>`;
  return html;
}

function renderHadaContent() {
  const groups = getHadaTrips();
  let html = "";

  html += renderHadaCard('חד"א - כיוון 105', groups["105"]);
  html += renderHadaCard('חד"א - כיוון 109', groups["109"]);
  html += renderHadaCard('חד"א - טייסת תחזוקה', groups.maintenance);

  return html;
}

// ─── On-Call Shuttle ───
function renderOnCallContent() {
  let html = "";
  const tzomet = DATA.bus_routes[3];

  // Evening hours from tzomet route
  if (tzomet.evening) {
    html += `<div class="route-card">
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
              <span class="dep-chip-time">${esc(tzomet.evening.time)}</span>
            </div>
            <div class="evening-note">${esc(tzomet.evening.break)}</div>
          </div>
        </div>
        <div class="route-note">${infoSVG}   הזמנת שאטל - מבצעים/הטסה בתיאום מול מוצב מנהלה</div>
      </div>
    </div>`;
  }

  return html;
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

    return `<div class="sched-entry sched-trip">
      <div class="sched-trip-header" onclick="this.parentElement.classList.toggle('open')">
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
        תחנת שירות - תחנה ששאטל עוצר בה
      </span>
      <span class="legend-item">
        <span class="badge badge-alt"></span>
        תחנה חלופית - תחנה שממנה נדרש להגיע לתחנת שירות
      </span>
    </div>
    <div class="stations-grid">${renderStationsHtml()}</div>
  </div>`;

  // Old routes
  html += `<div class="info-section">
    <h2 class="info-section-title">קויי שאטל</h2>
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

function refreshContent() {
  if (currentView === "info") return;
  renderCurrentView();
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

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    renderCurrentView();
    startCountdownTimer();
  } else {
    stopCountdownTimer();
  }
});

window.addEventListener("focus", () => {
  renderCurrentView();
});

// ─── Init ───
document.addEventListener("DOMContentLoaded", async () => {
  const appContent = document.getElementById("app-content");
  if (!appContent) return; // Not the public page

  appContent.innerHTML = '<div style="text-align:center; padding: 2rem;">טוען נתונים...</div>';

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
    toast.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#f44336; color:white; padding:10px 20px; border-radius:4px; z-index:9999; font-family:Rubik,sans-serif;";
    toast.textContent = "שגיאה בטעינת נתונים עדכניים. מוצגים נתוני גיבוי.";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
  renderCurrentView();
  startCountdownTimer();
});
