function renderParts(list) {
  partsContainer.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    noData.classList.remove("hidden");
    return;
  }
  noData.classList.add("hidden");

  list.forEach(part => {
    // Skip parts marked as deleted (soft delete)
    if (part.deleted) return;

    const card = document.createElement("article");
    card.className = "card";

    // Customer Group (styled like model)
    const custGroup = document.createElement("div");
    custGroup.className = "card-model";
    custGroup.textContent = part["Customer Group"] || "";
    card.appendChild(custGroup);

    // Customer Name (styled like model)
    const cust = document.createElement("div");
    cust.className = "card-model";
    cust.textContent = part["Customer Name"] || "";
    card.appendChild(cust);

    // Part Image with lazy loading and error handling
    const img = document.createElement("img");
    img.className = "card-image";
    img.src = part["Image Name"] || "";
    img.alt = part["Part Name"] || "";
    img.loading = "lazy";
    img.onerror = () => {
      // Remove the card if image fails to load
      card.remove();
      part.imageValid = false;
      buildSideNav();
    };
    img.addEventListener("click", () => openImagePreview(part));
    card.appendChild(img);

    // Model info
    const model = document.createElement("div");
    model.className = "card-model";
    model.textContent = part["Model"] || "";
    card.appendChild(model);

    // Info container for other fields
    const info = document.createElement("div");
    info.className = "info";

    const keys = ["Part Name", "Part No", "Contribution", "Classification", "Segment Wise", "Component Wt"];

    keys.forEach(key => {
      const p = document.createElement("p");
      if (key === "Segment Wise") p.className = "card-model";
      p.textContent = part[key] || "";
      info.appendChild(p);
    });

    card.appendChild(info);

    // Actions container for buttons
    const actions = document.createElement("div");
    actions.className = "card-actions";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "btn edit-btn";
    editBtn.textContent = "Edit";
    editBtn.style.background = "#38bdf8";
    editBtn.addEventListener("click", e => {
      e.stopPropagation();
      openForm(part); // Populate and show form for editing
    });

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "btn delete-btn";
    delBtn.textContent = "Delete";
    delBtn.style.background = "#ef4444";
    delBtn.addEventListener("click", e => {
      e.stopPropagation();
      confirmDelete(() => {
        part.deleted = true;               // Soft delete flag
        showToast("Deleted", "warning");  // Show notification
        filterAndRender();                 // Re-render list excluding deleted
        buildSideNav();                   // Update navigation counts etc.
      });
    });

    // actions.appendChild(editBtn);
    // actions.appendChild(delBtn);
    card.appendChild(actions);

    partsContainer.appendChild(card);
  });
}
