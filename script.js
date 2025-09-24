/* ============================
   script.js — Full Updated Version
   ============================ */

/* ========= GLOBAL STATE ========= */
let parts = [];                // original data from images.json (with deleted & imageValid flags)
let visibleParts = [];         // parts that are not deleted and have valid images (used for rendering)
let activeCustomer = null;     // currently selected customer or null for ALL
const THEME_BG = "#f2dfb8";    // theme color used for highlighted backgrounds

/* ========= DOM ELEMENTS ========= */
const partsContainer = document.getElementById("partsContainer");
const navBar = document.getElementById("navBar");
const searchInput = document.getElementById("searchInput");
const headerTitle = document.getElementById("headerTitle");
const noData = document.getElementById("noData");
const toastElem = document.getElementById("toast");
const zoomPreview = document.getElementById("zoomPreview");
const zoomCanvas = document.getElementById("zoomCanvas");
const zoomCloseBtn = document.getElementById("zoomCloseBtn");
const addPartBtn = document.getElementById("addPartBtn");
const downloadJsonBtn = document.getElementById("downloadJson");
const uploadJsonBtn = document.getElementById("uploadJsonBtn");
const jsonFileInput = document.getElementById("jsonFileInput");

/* Form elements */
const modal = document.getElementById("modal");
const partForm = document.getElementById("partForm");
const cancelBtn = document.getElementById("cancelBtn");
const previewImg = document.getElementById("previewImg");
const imagePathSpan = document.getElementById("imagePath");
const imageFileInput = document.getElementById("imageFile");

/* ========= INITIALIZATION ========= */
document.addEventListener("DOMContentLoaded", init);
function init() {
  bindUI();
  loadInitialData();
}

/* ========= BIND UI HANDLERS ========= */
function bindUI() {
  // nav toggle
  document.getElementById("toggleNav").addEventListener("click", () => {
    navBar.classList.toggle("hide");
    document.querySelector(".main-content").classList.toggle("full");
  });

  // search
  searchInput.addEventListener("input", debounce(() => {
    filterAndRender();
  }, 180));

  // keyboard "/" to focus search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    // Esc closes modals / viewer
    if (e.key === "Escape") {
      closeAllOverlays();
    }
  });

  // add button
  addPartBtn.addEventListener("click", () => openForm(null));

  // export/download
  downloadJsonBtn.addEventListener("click", exportAsImagesJson);

  // upload/load
  uploadJsonBtn.addEventListener("click", () => jsonFileInput.click());
  jsonFileInput.addEventListener("change", handleJsonFileLoad);

  // modal cancel
  cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));

  // image file input
  imageFileInput.addEventListener("change", handleImageFileSelect);

  // form submit (add/edit)
  partForm.addEventListener("submit", handleFormSubmit);

  // zoom close
  zoomCloseBtn.addEventListener("click", closeZoom);
  zoomPreview.addEventListener("click", (e) => {
    if (e.target === zoomPreview) closeZoom();
  });

  // scroll progress
  window.addEventListener("scroll", updateScrollProgress);
}

/* ========= LOAD & VALIDATE DATA ========= */
async function loadInitialData() {
  try {
    const res = await fetch("images.json");
    const data = await res.json();

    // normalize and add flags
    parts = data.map(p => ({
      ...p,
      deleted: p.deleted || false,
      imageValid: false // set after validation
    }));

    // validate images (mark imageValid true/false)
    await validateAllImages(parts);

    // build nav & render
    buildSideNav();
    filterAndRender();

    showToast("Data loaded", "success");
  } catch (err) {
    console.error("Failed to load images.json:", err);
    showToast("Could not load images.json", "error");
    parts = [];
    visibleParts = [];
    buildSideNav();
    filterAndRender();
  }
}

/* Validate every part's image by creating Image objects.
   This returns when all images resolve (load or error). */
function validateAllImages(list) {
  const promises = list.map((p, idx) => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        list[idx].imageValid = true;
        resolve(true);
      };
      img.onerror = () => {
        list[idx].imageValid = false;
        resolve(false);
      };
      // Set src after handlers
      img.src = p["Image Name"] || "";
      // fallback timeout: if still not loaded in 6s mark invalid
      setTimeout(() => {
        if (img.complete === false && list[idx].imageValid !== true) {
          list[idx].imageValid = false;
          resolve(false);
        }
      }, 6000);
    });
  });

  return Promise.all(promises);
}

/* ========= NAV BUILDING ========= */
function buildSideNav() {
  navBar.innerHTML = "";

  // ALL Customers button (always visible)
  const allBtn = document.createElement("button");
  allBtn.className = "nav-item";
  if (!activeCustomer) allBtn.classList.add("active");
  allBtn.innerHTML = `<span class="nav-label">ALL Customers</span><span class="badge">${countAvailableParts()}</span>`;
  allBtn.addEventListener("click", () => {
    activeCustomer = null;
    filterAndRender();
    setActiveNavButton(null);
  });
  navBar.appendChild(allBtn);

  // unique customers with at least one available image and not deleted
  const custMap = {};
  parts.forEach(p => {
    if (!p.deleted && p.imageValid) {
      const name = p["Customer Name"] || "(Unknown)";
      if (!custMap[name]) custMap[name] = [];
      custMap[name].push(p);
    }
  });

  Object.keys(custMap).sort().forEach(name => {
    const arr = custMap[name];
    const btn = document.createElement("div");
    btn.className = "nav-customer";
    if (activeCustomer === name) btn.classList.add("active");

    // thumbnail (first available image)
    const thumb = document.createElement("img");
    thumb.className = "nav-thumb";
    thumb.alt = name;
    thumb.src = arr[0]["Image Name"];
    thumb.loading = "lazy";
    thumb.onerror = () => { thumb.style.display = "none"; };

    const label = document.createElement("span");
    label.className = "nav-label";
    label.textContent = name;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = arr.length;

    btn.appendChild(thumb);
    btn.appendChild(label);
    btn.appendChild(badge);

    btn.addEventListener("click", () => {
      activeCustomer = name;
      filterAndRender();
      setActiveNavButton(name);
      // keep nav visible — do not hide
    });

    navBar.appendChild(btn);
  });

  // if there are no customers show placeholder
  if (Object.keys(custMap).length === 0) {
    const p = document.createElement("p");
    p.className = "nav-empty";
    p.textContent = "No available parts (valid images required).";
    navBar.appendChild(p);
  }
}

/* Helper: set active class on nav (keeps nav visible) */
function setActiveNavButton(customerName) {
  navBar.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
  // find the matching element
  if (!customerName) {
    const allBtn = navBar.querySelector("button.nav-item");
    if (allBtn) allBtn.classList.add("active");
    return;
  }
  const children = Array.from(navBar.children);
  for (const child of children) {
    const label = child.querySelector(".nav-label");
    if (label && label.textContent === customerName) {
      child.classList.add("active");
      break;
    }
  }
}

/* ========= RENDER & FILTER ========= */
function filterAndRender() {
  const q = searchInput.value.trim().toLowerCase();

  // update header title
  headerTitle.textContent = activeCustomer ? `ELKAYEM - ${activeCustomer}` : "ELKAYEM - ALL PARTS";

  // visible parts = not deleted + imageValid
  visibleParts = parts.filter(p => !p.deleted && p.imageValid);

  // filter by customer
  let rendered = visibleParts;
  if (activeCustomer) {
    rendered = rendered.filter(p => p["Customer Name"] === activeCustomer);
  }

  // search filter
  if (q) {
    rendered = rendered.filter(p =>
      (p["Customer Name"] || "").toLowerCase().includes(q) ||
      (p["Model"] || "").toLowerCase().includes(q) ||
      (p["Part Name"] || "").toLowerCase().includes(q) ||
      (p["Part No"] || "").toLowerCase().includes(q)
    );
    showToast(`${rendered.length} results found`, "info");
  }

  renderParts(rendered);
  // rebuild nav badges & thumbs from current image-valid dataset
  buildSideNav();
}

/* ========= RENDER PART CARDS ========= */
function renderParts(list) {
  partsContainer.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    noData.classList.remove("hidden");
    return;
  }
  noData.classList.add("hidden");

  list.forEach(part => {
    // build card but append only if image valid (we prevalidated)
    const card = document.createElement("article");
    card.className = "card";

    // Customer header (centered & highlighted)
    const cust = document.createElement("div");
    cust.className = "card-customer";
    cust.textContent = part["Customer Name"] || "";
    cust.style.background = THEME_BG;
    card.appendChild(cust);

    // Image (fit responsively)
    const imgWrap = document.createElement("div");
    imgWrap.className = "card-image-wrap";
    const img = document.createElement("img");
    img.className = "card-image";
    img.alt = part["Part Name"] || "";
    img.loading = "lazy";
    img.src = part["Image Name"] || "";
    // if image error despite validation, skip card
    img.onerror = () => {
      card.remove();
      // mark invalid and update nav/counts
      part.imageValid = false;
      buildSideNav();
    };
    imgWrap.appendChild(img);
    card.appendChild(imgWrap);

    // Model header (centered highlighted below image)
    const model = document.createElement("div");
    model.className = "card-model";
    model.textContent = part["Model"] || "";
    model.style.background = "#fff7dc";
    card.appendChild(model);

    // Info — show only values (no labels), stacked
    const info = document.createElement("div");
    info.className = "info";
    // use single-line values for readability
    const values = [
      part["Part Name"] || "",
      part["Part No"] || "",
      part["Contribution"] || "",
      part["Classification"] || "",
      part["Segment Wise"] || "",
      part["Component Wt"] || ""
    ];
    values.forEach(val => {
      const p = document.createElement("p");
      p.className = "info-line";
      p.textContent = val;
      info.appendChild(p);
    });
    card.appendChild(info);

    // Actions (Edit / Delete) horizontally aligned
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openForm(part); // open edit form
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn delete-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      softDeletePart(part.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);

    partsContainer.appendChild(card);
  });
}

/* ========= ADD / EDIT FORM ========= */
function openForm(part = null) {
  // reset
  partForm.reset();
  previewImg.src = "";
  imagePathSpan.textContent = "None";
  document.getElementById("partId").value = "";

  if (part) {
    // edit
    document.getElementById("formTitle").textContent = "Edit Part";
    document.getElementById("partId").value = part.id;
    document.getElementById("customerName").value = part["Customer Name"] || "";
    document.getElementById("model").value = part["Model"] || "";
    document.getElementById("partName").value = part["Part Name"] || "";
    document.getElementById("partNumber").value = part["Part No"] || "";
    document.getElementById("contribution").value = part["Contribution"] || "";
    document.getElementById("classification").value = part["Classification"] || "";
    document.getElementById("segmentWise").value = part["Segment Wise"] || "";
    document.getElementById("componentWt").value = part["Component Wt"] || "";
    imagePathSpan.textContent = part["Image Name"] || "None";
    previewImg.src = part["Image Name"] || "";
  } else {
    document.getElementById("formTitle").textContent = "Add Part";
  }

  modal.classList.remove("hidden");
}

/* Handle image file selected in form -> read as data URL and show preview */
function handleImageFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    previewImg.src = ev.target.result;
    imagePathSpan.textContent = ev.target.result; // store data URL
  };
  reader.readAsDataURL(file);
}

/* Submit handler for add/edit form */
function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("partId").value || `ID${Date.now()}`;
  const payload = {
    id,
    "Customer Name": document.getElementById("customerName").value.trim(),
    "Model": document.getElementById("model").value.trim(),
    "Part Name": document.getElementById("partName").value.trim(),
    "Part No": document.getElementById("partNumber").value.trim(),
    "Contribution": document.getElementById("contribution").value.trim(),
    "Classification": document.getElementById("classification").value.trim(),
    "Segment Wise": document.getElementById("segmentWise").value.trim(),
    "Component Wt": document.getElementById("componentWt").value.trim(),
    "Image Name": imagePathSpan.textContent === "None" ? "" : imagePathSpan.textContent,
    deleted: false,
    imageValid: false // will be validated below
  };

  // basic validation
  if (!payload["Customer Name"] || !payload["Part Name"] || !payload["Part No"]) {
    showToast("Customer, Part Name and Part No are required", "warning");
    return;
  }

  // duplicate check: same customer & same part no (not counting the same id)
  const dup = parts.find(p => p.id !== id && p["Customer Name"] === payload["Customer Name"] && p["Part No"] === payload["Part No"] && !p.deleted);
  if (dup) {
    showToast("Duplicate Part No exists for this customer", "error");
    return;
  }

  // determine if update or new
  const idx = parts.findIndex(p => p.id === id);
  if (idx >= 0) {
    // update
    parts[idx] = { ...parts[idx], ...payload };
    // validate image for this item only
    validateAllImages([parts[idx]]).then(() => {
      showToast("Part updated", "success");
      modal.classList.add("hidden");
      filterAndRender();
      buildSideNav();
    });
  } else {
    // new
    parts.push(payload);
    // validate image
    validateAllImages([payload]).then(() => {
      showToast("Part added", "success");
      modal.classList.add("hidden");
      filterAndRender();
      buildSideNav();
    });
  }
}

/* ========= SOFT DELETE ========= */
function softDeletePart(id) {
  const idx = parts.findIndex(p => p.id === id);
  if (idx === -1) return;
  parts[idx].deleted = true;
  showToast("Part deleted (soft)", "warning");
  filterAndRender(); // re-render visible parts
  buildSideNav();
}

/* ========= EXPORT / LOAD (images.json) ========= */
function exportAsImagesJson() {
  // export current full parts array (including deleted & raw fields)
  const dataStr = JSON.stringify(parts.map(p => {
    // remove internal helper keys (imageValid)
    const copy = { ...p };
    delete copy.imageValid;
    return copy;
  }), null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "images.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported images.json", "success");
}

/* Merge loaded JSON into parts array — new items appended; existing ids replaced */
function handleJsonFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const loaded = JSON.parse(ev.target.result);
      if (!Array.isArray(loaded)) throw new Error("JSON must be an array");
      // normalize and merge: if id exists replace, else append
      for (const item of loaded) {
        const norm = { ...item, deleted: item.deleted || false, imageValid: false };
        const idx = parts.findIndex(p => p.id === norm.id);
        if (idx >= 0) parts[idx] = { ...parts[idx], ...norm };
        else parts.push(norm);
      }
      await validateAllImages(parts);
      showToast("images.json loaded", "success");
      filterAndRender();
      buildSideNav();
    } catch (err) {
      console.error("Failed to load JSON", err);
      showToast("Invalid JSON file", "error");
    } finally {
      jsonFileInput.value = "";
    }
  };
  reader.readAsText(file);
}

/* ========= IMAGE ZOOM/VIEWER ========= */
function openZoomWithImageUrl(url, title = "") {
  // draw image to canvas sized to fit viewport while maintaining aspect ratio
  const ctx = zoomCanvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "anonymous"; // try to avoid tainting if possible
  img.onload = () => {
    // compute fit size
    const maxW = Math.floor(window.innerWidth * 0.92);
    const maxH = Math.floor(window.innerHeight * 0.82);
    let w = img.width, h = img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);

    zoomCanvas.width = w;
    zoomCanvas.height = h;
    // center canvas in preview
    zoomCanvas.style.maxWidth = w + "px";
    zoomCanvas.style.maxHeight = h + "px";

    // clear and draw
    ctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    ctx.drawImage(img, 0, 0, w, h);

    // show preview
    zoomPreview.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  img.onerror = () => {
    showToast("Could not open image", "error");
  };
  img.src = url;
}

function openImagePreview(part) {
  if (!part || !part["Image Name"]) {
    showToast("No image available", "warning");
    return;
  }
  openZoomWithImageUrl(part["Image Name"], part["Part Name"]);
}

function closeZoom() {
  zoomPreview.classList.add("hidden");
  document.body.style.overflow = "";
}

/* Close modals and overlays */
function closeAllOverlays() {
  modal.classList.add("hidden");
  closeZoom();
}

/* ========= UTILITIES ========= */
function countAvailableParts() {
  return parts.filter(p => !p.deleted && p.imageValid).length;
}

/* small debounce helper */
function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* toast helper */
let toastTimer = null;
function showToast(msg, type = "info") {
  toastElem.textContent = msg;
  toastElem.className = `toast show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastElem.className = "toast";
  }, 2200);
}

/* update top scroll progress bar */
function updateScrollProgress() {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  const bar = document.getElementById("scrollIndicator");
  if (bar) bar.style.width = pct + "%";

  // shrink header background to white past threshold (keeps existing theme otherwise)
  const header = document.querySelector(".header-bar");
  if (header) {
    if (scrollTop > 50) {
      header.classList.add("scrolled");
      header.style.background = "#fff";
    } else {
      header.classList.remove("scrolled");
      header.style.background = "#f2dfb8";
    }
  }
}
