document.addEventListener("DOMContentLoaded", () => {
  let data = [];
  let currentCustomer = "All";
  let deletingId = null;

  const $ = id => document.getElementById(id);
  const partsContainer = $("partsContainer");
  const noData = $("noData");
  const navBar = $("navBar");
  const mainContent = document.querySelector(".main-content");
  const toast = $("toast");
  const zoomPreview = $("zoomPreview");
  const zoomImage = $("zoomImage");
  const closeZoom = $("closeZoom");
  const toggleBtn = $("toggleNav");

  const navIcon = document.createElement("i");
  navIcon.id = "toggleNavIcon";
  navIcon.className = "fas fa-bars";
  toggleBtn.appendChild(navIcon);

  toggleBtn.addEventListener("click", () => {
    const isOpen = !navBar.classList.contains("hide");
    navBar.classList.toggle("hide");
    mainContent.classList.toggle("full");
    toggleBtn.classList.toggle("inverted");
    navIcon.className = isOpen ? "fas fa-bars" : "fas fa-xmark";
    showToast("info", isOpen ? "collapse" : "expand", "", "Sidebar toggled");
  });

  function showToast(type = "info", action = "", name = "", messageOverride = "") {
    const actionMap = {
      add: "added", update: "updated", delete: "deleted", load: "loaded",
      export: "exported", import: "imported", cancel: "cancelled", submit: "submitted",
      upload: "uploaded", view: "viewed", select: "selected", deselect: "deselected",
      open: "opened", close: "closed", error: "failed", search: "searched",
      collapse: "collapsed", expand: "expanded", edit: "edited", scroll: "scrolled"
    };
    const defaultText = actionMap[action.toLowerCase()] || action;
    const message = messageOverride || (name ? `"${name}" ${defaultText}.` : `Action ${defaultText}.`);
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  fetch("images.json")
    .then(res => {
      if (!res.ok) throw new Error("Not found");
      return res.json();
    })
    .then(json => {
      data = json.map(p => ({
        ...p,
        id: `${p["customer name"]}${p["part number"]}`.replace(/\s+/g, "")
      }));
      renderUI();
      showToast("success", "load", "", "images.json loaded");
      navBar.classList.add("hide");
      mainContent.classList.add("full");
      toggleBtn.classList.add("inverted");
      navIcon.className = "fas fa-bars";
    })
    .catch(() => {
      showToast("warning", "load", "", "images.json not found");
    });

  window.addEventListener("scroll", () => {
    const scroll = window.scrollY;
    const max = document.body.scrollHeight - window.innerHeight;
    $("scrollIndicator").style.width = `${(scroll / max) * 100}%`;
    $("scrollTopBtn").style.display = scroll > 300 ? "block" : "none";
  });

  $("scrollTopBtn").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("info", "scroll", "", "Scrolled to top");
  });

  $("uploadJsonBtn").addEventListener("click", () => $("jsonFileInput").click());
  $("jsonFileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        data = json.map(p => ({
          ...p,
          id: `${p["customer name"]}${p["part number"]}`.replace(/\s+/g, "")
        }));
        renderUI();
        showToast("success", "import");
      } catch {
        showToast("error", "error");
      }
    };
    reader.readAsText(file);
  });

  $("downloadJson").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images.json";
    a.click();
    showToast("success", "export");
  });

  $("addPartBtn").addEventListener("click", () => {
    $("modal").classList.remove("hidden");
    $("partForm").reset();
    $("formTitle").textContent = "Add New Part";
    $("partId").value = "";
    $("previewImg").src = "";
    showToast("info", "open", "", "Add Part Form Opened");
  });

  $("cancelBtn").addEventListener("click", () => {
    $("modal").classList.add("hidden");
    showToast("warning", "cancel", "", "Form cancelled");
  });

  $("cancelDelete").addEventListener("click", () => {
    $("deleteModal").classList.add("hidden");
    showToast("warning", "cancel", "", "Delete cancelled");
  });

  $("confirmDelete").addEventListener("click", () => {
    const part = data.find(p => p.id === deletingId);
    data = data.filter(p => p.id !== deletingId);
    renderUI();
    $("deleteModal").classList.add("hidden");
    showToast("error", "delete", part?.["customer name"]);
  });

  $("partForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = `${$("customerName").value}${$("partNumber").value}`.replace(/\s+/g, "");
    const part = {
      id,
      "customer name": $("customerName").value,
      "Model": $("model").value,
      "Contribution": $("contribution").value,
      "part name": $("partName").value,
      "part number": $("partNumber").value,
      "image name": $("previewImg").src || ""
    };
    const index = data.findIndex(p => p.id === id);
    if (index >= 0) {
      data[index] = part;
      showToast("info", "update", part["customer name"]);
    } else {
      data.push(part);
      showToast("success", "add", part["customer name"]);
    }
    $("modal").classList.add("hidden");
    renderUI();
  });

  $("imageFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("previewImg").src = reader.result;
      showToast("success", "upload", $("partName").value || "Image");
    };
    reader.readAsDataURL(file);
  });

  $("searchInput").addEventListener("input", () => {
    renderParts();
    const query = $("searchInput").value.trim();
    if (query.length > 1) showToast("info", "search", "", `Searched for "${query}"`);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $("modal").classList.add("hidden");
      $("deleteModal").classList.add("hidden");
      zoomPreview.classList.add("hidden");
      zoomImage.style.transform = "none";
      zoomPreview.onmousemove = null;
      showToast("info", "close", "", "Closed modal or preview");
    }
  });

  // ✅ Close button in zoom preview
  closeZoom.addEventListener("click", () => {
    zoomPreview.classList.add("hidden");
    zoomImage.style.transform = "none";
    zoomPreview.onmousemove = null;
    showToast("info", "close", "", "Closed image preview");
  });

  // ✅ Optional: click outside image to close preview
  zoomPreview.addEventListener("click", e => {
    if (e.target === zoomPreview) {
      zoomPreview.classList.add("hidden");
      zoomImage.style.transform = "none";
      zoomPreview.onmousemove = null;
      showToast("info", "close", "", "Closed preview");
    }
  });

  function renderUI() {
    renderNav();
    renderParts();
  }

  function renderNav() {
    const customers = ["All", ...new Set(data.map(p => p["customer name"]))];
    navBar.innerHTML = "";
    customers.forEach(name => {
      const btn = document.createElement("button");
      const icon = document.createElement("i");
      icon.className = "fas fa-user";
      icon.style.marginRight = "6px";
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode(name));
      btn.className = currentCustomer === name ? "active" : "";
      btn.onclick = () => {
        currentCustomer = name;
        $("headerTitle").textContent = name === "Elkayem - All" ? "Elkayem - All Parts" : `Elkayem - ${name} Parts`;
        renderNav();
        renderParts();
        showToast("info", "view", name, `Now viewing "${name}" parts`);
      };
      navBar.appendChild(btn);
    });
  }

  function renderParts() {
    const query = $("searchInput").value.toLowerCase();
    const filtered = data.filter(p => {
      const matchCustomer = currentCustomer === "All" || p["customer name"] === currentCustomer;
      const matchQuery = Object.values(p).some(v => String(v).toLowerCase().includes(query));
      return matchCustomer && matchQuery;
    });

    partsContainer.innerHTML = "";
    noData.classList.toggle("hidden", filtered.length > 0);

    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = p["image name"];
      img.alt = p["part name"];
      img.onclick = () => {
        zoomImage.src = img.src;
        zoomPreview.classList.remove("hidden");

        zoomPreview.onmousemove = e => {
          const rect = zoomPreview.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateY = ((e.clientX - centerX) / centerX) * 40;
          const rotateX = ((centerY - e.clientY) / centerY) * 40;
          zoomImage.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        zoomPreview.onmouseleave = () => {
          zoomImage.style.transform = "none";
        };

        showToast("info", "view", p["part name"], `Previewing "${p["part name"]}"`);
      };

      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = `
        <p>${p["customer name"]}</p>
        <p>${p["Model"]}</p>
        <p>${p["part name"]}</p>
        <p>${p["part number"]}</p>
        <p>${p["Contribution"]}</p>
      `;

      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.innerHTML = `
        <button class="btn edit-btn" data-id="${p.id}">Edit</button>
        <button class="btn delete-btn" data-id="${p.id}">Delete</button>
      `;

      card.append(img, info, actions);
      partsContainer.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.onclick = () => editPart(btn.dataset.id);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = () => confirmDelete(btn.dataset.id);
    });
  }

  function editPart(id) {
    const part = data.find(p => p.id === id);
    if (!part) return;
    $("formTitle").textContent = "Edit Part";
    $("partId").value = part.id;
    $("customerName").value = part["customer name"];
    $("model").value = part["Model"];
    $("contribution").value = part["Contribution"];
    $("partName").value = part["part name"];
    $("partNumber").value = part["part number"];
    $("previewImg").src = part["image name"] || "";
    $("modal").classList.remove("hidden");
    showToast("info", "edit", part["part name"], `Editing "${part["part name"]}"`);
  }

  function confirmDelete(id) {
    deletingId = id;
    const part = data.find(p => p.id === id);
    $("deleteText").textContent = `Delete "${part["part name"]}"?`;
    $("deleteModal").classList.remove("hidden");
  }
});
