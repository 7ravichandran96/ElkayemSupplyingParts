/* ========= DOM ELEMENTS ========= */
const partsContainer = document.getElementById("partsContainer");
const headerTitle = document.getElementById("headerTitle");
const noData = document.getElementById("noData");

/* ========= RENDER & FILTER ========= */
function filterAndRender() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  headerTitle.textContent = activeCustomer ? `ELKAYEM - ${activeCustomer}` : "ELKAYEM - ALL PARTS";

  visibleParts = parts.filter(p => !p.deleted && p.imageValid);

  let rendered = visibleParts;
  if (activeCustomer) rendered = rendered.filter(p => p["Customer Name"] === activeCustomer);

  if (q) {
    rendered = rendered.filter(p =>
      (p["Customer Group"] || "").toLowerCase().includes(q) ||
      (p["Customer Name"] || "").toLowerCase().includes(q) ||
      (p["Model"] || "").toLowerCase().includes(q) ||
      (p["Part Name"] || "").toLowerCase().includes(q) ||
      (p["Part No"] || "").toLowerCase().includes(q) ||
      (p["Contribution"] || "").toLowerCase().includes(q) ||
      (p["Classification"] || "").toLowerCase().includes(q) ||
      (p["Segment Wise"] || "").toLowerCase().includes(q) ||
      (p["Component Wt"] || "").toLowerCase().includes(q) ||
      (p["Image Name"] || "").toLowerCase().includes(q)
    );
    showToast(`${rendered.length} results found`, "info");
  }

  renderParts(rendered);
  buildSideNav();
}

/* Render part cards */
function renderParts(list) {
  partsContainer.innerHTML = "";
  if (!Array.isArray(list) || list.length === 0) {
    noData.classList.remove("hidden");
    return;
  }
  noData.classList.add("hidden");

  list.forEach(part => {
    const card = document.createElement("article");
    card.className = "card";

    const cust = document.createElement("div");
    cust.className = "card-customer";
    cust.textContent = part["Customer Name"] || "";
    cust.style.background = THEME_BG;
    card.appendChild(cust);

    const img = document.createElement("img");
    img.className = "card-image";
    img.alt = part["Part Name"] || "";
    img.loading = "lazy";
    img.src = part["Image Name"] || "";
    img.onerror = () => { card.remove(); part.imageValid = false; buildSideNav(); };
    card.appendChild(img);

    const model = document.createElement("div");
    model.className = "card-model";
    model.textContent = part["Model"] || "";
    card.appendChild(model);

    const info = document.createElement("div");
    info.className = "info";
    ["Part Name", "Part No", "Contribution", "Classification", "Segment Wise", "Component Wt"].forEach(key => {
      const p = document.createElement("p");
      p.textContent = part[key] || "";
      info.appendChild(p);
    });
    card.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", e => { e.stopPropagation(); openForm(part); });
    const delBtn = document.createElement("button");
    delBtn.className = "btn delete-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", e => { e.stopPropagation(); softDeletePart(part.id); });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);

    partsContainer.appendChild(card);
  });
}
