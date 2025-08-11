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
  const toggleBtn = $("toggleNav");

  // Create nav toggle icon
  const navIcon = document.createElement("i");
  navIcon.id = "toggleNavIcon";
  navIcon.className = "fas fa-bars";
  toggleBtn.appendChild(navIcon);

  // --- Setup Zoom Preview Elements with Canvas for 3D rotation ---
  const zoomPreview = document.createElement("div");
  zoomPreview.id = "zoomPreview";
  zoomPreview.classList.add("hidden");
  zoomPreview.setAttribute("tabindex", "-1");
  zoomPreview.style.position = "fixed";
  zoomPreview.style.top = "0";
  zoomPreview.style.left = "0";
  zoomPreview.style.width = "100vw";
  zoomPreview.style.height = "100vh";
  zoomPreview.style.background = "rgba(255, 255, 255, 0.95)"; // glossy white finish
  zoomPreview.style.display = "flex";
  zoomPreview.style.justifyContent = "center";
  zoomPreview.style.alignItems = "center";
  zoomPreview.style.zIndex = "10000";

  // Canvas element for image rotation
  const zoomCanvas = document.createElement("canvas");
  zoomCanvas.id = "zoomCanvas";
  zoomCanvas.style.maxWidth = "90vw";
  zoomCanvas.style.maxHeight = "90vh";
  zoomCanvas.style.cursor = "grab";
  zoomPreview.appendChild(zoomCanvas);

  const zoomCloseBtn = document.createElement("button");
  zoomCloseBtn.id = "zoomCloseBtn";
  zoomCloseBtn.innerHTML = "&times;";
  zoomCloseBtn.setAttribute("aria-label", "Close Zoom Preview");
  zoomCloseBtn.style.position = "absolute";
  zoomCloseBtn.style.top = "20px";
  zoomCloseBtn.style.right = "20px";
  zoomCloseBtn.style.fontSize = "36px";
  zoomCloseBtn.style.background = "none";
  zoomCloseBtn.style.border = "none";
  zoomCloseBtn.style.cursor = "pointer";
  zoomCloseBtn.style.color = "#333";
  zoomPreview.appendChild(zoomCloseBtn);

  document.body.appendChild(zoomPreview);

  // Variables for canvas rotation state
  let ctx, imgObj, rotationY = 0;
  let isDragging = false;
  let lastX = 0;

  // Load image into canvas and draw with 3D rotation effect
  function loadImageToCanvas(src) {
    imgObj = new Image();
    imgObj.onload = () => {
      zoomCanvas.width = imgObj.width;
      zoomCanvas.height = imgObj.height;
      ctx = zoomCanvas.getContext("2d");
      rotationY = 0;
      drawRotatedImage();
    };
    imgObj.src = src;
  }

  // Draw the image with a simple horizontal rotation effect
  function drawRotatedImage() {
    if (!ctx || !imgObj) return;

    const w = zoomCanvas.width;
    const h = zoomCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Save context state
    ctx.save();

    // Move to center
    ctx.translate(w / 2, h / 2);

    // Rotate around Y-axis simulated by scaling X axis (simple effect)
    const angle = rotationY;
    // Limit angle between -PI/3 and PI/3 (~60 deg)
    const maxAngle = Math.PI / 3;
    const clampedAngle = Math.min(maxAngle, Math.max(-maxAngle, angle));

    // Calculate scaleX factor simulating 3D rotation (cosine)
    const scaleX = Math.cos(clampedAngle);

    ctx.scale(scaleX, 1);

    // Draw image centered, flipped if rotation crosses 90 deg
    ctx.drawImage(imgObj, -w / 2, -h / 2, w, h);

    ctx.restore();
  }

  // Mouse and touch event handlers to rotate image on drag
  zoomCanvas.addEventListener("mousedown", e => {
    isDragging = true;
    lastX = e.clientX;
    zoomCanvas.style.cursor = "grabbing";
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      zoomCanvas.style.cursor = "grab";
    }
  });

  window.addEventListener("mousemove", e => {
    if (isDragging) {
      const deltaX = e.clientX - lastX;
      lastX = e.clientX;
      rotationY += deltaX * 0.01; // sensitivity
      drawRotatedImage();
    }
  });

  // Touch support
  zoomCanvas.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
    }
  });

  zoomCanvas.addEventListener("touchend", () => {
    isDragging = false;
  });

  zoomCanvas.addEventListener("touchmove", e => {
    if (isDragging && e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - lastX;
      lastX = touchX;
      rotationY += deltaX * 0.01;
      drawRotatedImage();
      e.preventDefault();
    }
  }, { passive: false });

  // Utility to get full raw.githubusercontent.com URL encoded path
  function getImageURL(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    return `https://raw.githubusercontent.com/7ravichandran96/ElkayemSupplyingParts/main/${encoded}`;
  }

  // Toggle sidebar
  toggleBtn.addEventListener("click", () => {
    const isOpen = !navBar.classList.contains("hide");
    navBar.classList.toggle("hide");
    mainContent.classList.toggle("full");
    toggleBtn.classList.toggle("inverted");
    navIcon.className = isOpen ? "fas fa-bars" : "fas fa-xmark";
    showToast("info", isOpen ? "collapse" : "expand", "", "Customer Name Opened");
  });

  // Toast notification helper
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

(function setHeaderFont() {
  const FONT_NAME = 'ElkayemHeaderFont';
  
  // Example: Google Fonts WOFF2 link — you can replace this URL with your own raw.githubusercontent.com hosted .woff2
  const fontUrl = 'https://fonts.gstatic.com/s/montserrat/v25/JTURjIg1_i6t8kCHKm45_cJD3g3D_w.woff2';
  
  const css = `
    @font-face {
      font-family: '${FONT_NAME}';
      src: url('${fontUrl}') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    #headerTitle {
      font-family: '${FONT_NAME}', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      gap: 8px; /* space between logo and text */
    }

    #headerTitle span img {
      height: 32px; /* adjust logo size */
      vertical-align: middle;
    }
  `;

  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();


  // Fetch JSON data and initialize UI
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

    // ✅ Set default customer to "TVS M GROUP"
    currentCustomer = "TVS M GROUP";
    $("headerTitle").textContent = `ELKAYEM - ${currentCustomer} PARTS`;

    renderUI();
    renderParts(); // ensure filtering applies to TVS M GROUP
    showToast("success", "load", "", "File loaded");

    navBar.classList.add("hide");
    mainContent.classList.add("full");
    toggleBtn.classList.add("inverted");
    navIcon.className = "fas fa-bars";
  })
  .catch(() => {
    showToast("warning", "load", "", "File Loading error");
  });


  // Scroll progress bar and scroll-to-top button logic
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

  // Upload JSON handler
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

  // Export JSON handler
  $("downloadJson").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images.json";
    a.click();
    showToast("success", "export");
  });

  // Add part modal open
  $("addPartBtn").addEventListener("click", () => {
    $("modal").classList.remove("hidden");
    $("partForm").reset();
    $("formTitle").textContent = "Add New Part";
    $("partId").value = "";
    $("previewImg").src = "";
    showToast("info", "open", "", "Add Part Form Opened");
  });

  // Cancel form modal
  $("cancelBtn").addEventListener("click", () => {
    $("modal").classList.add("hidden");
    showToast("warning", "cancel", "", "Form cancelled");
  });

  // Cancel delete modal
  $("cancelDelete").addEventListener("click", () => {
    $("deleteModal").classList.add("hidden");
    showToast("warning", "cancel", "", "Delete cancelled");
  });

  // Confirm delete
  $("confirmDelete").addEventListener("click", () => {
    const part = data.find(p => p.id === deletingId);
    data = data.filter(p => p.id !== deletingId);
    renderUI();
    $("deleteModal").classList.add("hidden");
    showToast("error", "delete", part?.["customer name"]);
  });

  // Form submission add/edit part
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

  // Preview image upload
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

  // Search input
  $("searchInput").addEventListener("input", () => {
    renderParts();
    const query = $("searchInput").value.trim();
    if (query.length > 1) showToast("info", "search", "", `Searched for "${query}"`);
  });

  // Keyboard escape closes modals and zoom preview
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll('.modal, .popup').forEach(modal => {
        if (!modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
        }
      });
      if (!zoomPreview.classList.contains("hidden")) {
        closeZoom();
      }
      showToast("info", "close", "", "Closed modal or preview");
    }
  });

  // Close modals by clicking outside content
  window.addEventListener('click', e => {
    document.querySelectorAll('.modal, .popup').forEach(modal => {
      if (!modal.classList.contains("hidden") && e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });

  // Close buttons for modals and popups
  document.querySelectorAll('.modal, .popup').forEach(modal => {
    if (!modal.querySelector('.modal-close-btn')) {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.className = 'modal-close-btn';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 24px;
        background: none;
        border: none;
        cursor: pointer;
        z-index: 9999;
      `;
      closeBtn.addEventListener('click', () => {
        modal.classList.add("hidden");
      });
      modal.appendChild(closeBtn);
    }
  });

  // Render sidebar nav
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
        $("headerTitle").textContent = name === "ALL" ? "ELKAYEM - ALL PARTS" : `ELKAYEM - ${name} PARTS`;
        renderNav();
        renderParts();
        showToast("info", "view", name, `Now viewing "${name}" parts`);
        // Close sidebar on mobile after selection for better UX
        if (window.innerWidth <= 768) {
          navBar.classList.add("hide");
          mainContent.classList.add("full");
          toggleBtn.classList.add("inverted");
          navIcon.className = "fas fa-bars";
        }
      };
      navBar.appendChild(btn);
    });
  }

  // Render the parts cards list filtered by currentCustomer and search
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
      img.src = getImageURL(p["image name"]);
      img.alt = p["part name"];
      img.onclick = () => openZoom(img.src);

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

    // Bind Edit and Delete buttons
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.onclick = () => editPart(btn.dataset.id);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = () => confirmDelete(btn.dataset.id);
    });
  }

  // Edit a part - open modal with populated data
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
    $("previewImg").src = getImageURL(part["image name"] || "");
    $("modal").classList.remove("hidden");
    showToast("info", "edit", part["part name"], `Editing "${part["part name"]}"`);
  }

  // Confirm delete modal open
  function confirmDelete(id) {
    deletingId = id;
    const part = data.find(p => p.id === id);
    $("deleteText").textContent = `Delete "${part["part name"]}"?`;
    $("deleteModal").classList.remove("hidden");
  }

  // Open zoom preview for image (fullscreen) with canvas 3D rotation
  function openZoom(imgSrc) {
    loadImageToCanvas(imgSrc);
    zoomPreview.classList.remove("hidden");
    zoomCloseBtn.style.display = "block";
    zoomPreview.focus();
    document.body.style.overflow = "hidden"; // disable background scroll
  }

  // Close zoom preview
  function closeZoom() {
    zoomPreview.classList.add("hidden");
    zoomCloseBtn.style.display = "none";
    if (ctx) {
      ctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    }
    imgObj = null;
    document.body.style.overflow = ""; // re-enable scroll
  }

  // Close button event
  zoomCloseBtn.addEventListener("click", e => {
    e.stopPropagation();
    closeZoom();
  });

  // Clicking outside canvas closes zoom preview
  zoomPreview.addEventListener("click", e => {
    if (e.target === zoomPreview) {
      closeZoom();
    }
  });

  // Prevent drag on zoomCanvas default
  zoomCanvas.addEventListener("dragstart", e => e.preventDefault());

  // Initialize UI first time
  function renderUI() {
    renderNav();
    renderParts();
  }

  // Responsive fix: On window resize, automatically hide sidebar on mobile and show on desktop
  function responsiveSidebar() {
    if (window.innerWidth <= 768) {
      navBar.classList.add("hide");
      mainContent.classList.add("full");
      toggleBtn.classList.add("inverted");
      navIcon.className = "fas fa-bars";
    } else {
      navBar.classList.remove("hide");
      mainContent.classList.remove("full");
      toggleBtn.classList.remove("inverted");
      navIcon.className = "fas fa-xmark";
    }
  }

  window.addEventListener("resize", responsiveSidebar);
  responsiveSidebar();

});
