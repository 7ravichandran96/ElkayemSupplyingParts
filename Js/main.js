/* ========= DOM ELEMENTS ========= */
const addPartBtn = document.getElementById("addPartBtn");
const searchInput = document.getElementById("searchInput");

/* ========= INITIALIZATION ========= */
document.addEventListener("DOMContentLoaded", init);

function init() {
  bindUI();
  loadInitialData();
}

/* ========= BIND UI HANDLERS ========= */
function bindUI() {
  document.getElementById("toggleNav").addEventListener("click", () => {
    document.getElementById("navBar").classList.toggle("hide");
    document.querySelector(".main-content").classList.toggle("full");
  });

  searchInput.addEventListener("input", debounce(filterAndRender, 180));

  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement !== searchInput) { e.preventDefault(); searchInput.focus(); }
    if (e.key === "Escape") closeAllOverlays();
  });

  addPartBtn.addEventListener("click", () => openForm(null));

  window.addEventListener("scroll", updateScrollProgress);
}

/* ========= UTILITIES ========= */
function softDeletePart(id) {
  const idx = parts.findIndex(p => p.id === id);
  if (idx === -1) return;
  parts[idx].deleted = true;
  showToast("Part deleted (soft)", "warning");
  filterAndRender();
  buildSideNav();
}

function countAvailableParts() {
  return parts.filter(p => !p.deleted && p.imageValid).length;
}

let toastTimer = null;
function showToast(msg, type = "info") {
  const toastElem = document.getElementById("toast");
  toastElem.textContent = msg;
  toastElem.className = `toast show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastElem.className = "toast"; }, 2200);
}

function debounce(fn, wait = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

function updateScrollProgress() {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  const bar = document.getElementById("scrollIndicator");
  if (bar) bar.style.width = pct + "%";

  const header = document.querySelector(".header-bar");
  if (header) { header.style.background = scrollTop > 50 ? "#fff" : "#f2dfb8"; }
}
