const modal = document.getElementById("modal");
const partForm = document.getElementById("partForm");
const cancelBtn = document.getElementById("cancelBtn");
const previewImg = document.getElementById("previewImg");
const imagePathSpan = document.getElementById("imagePath");
const imageFileInput = document.getElementById("imageFile");

/* ====== OPEN FORM ====== */
export function openForm(part = null) {
  partForm.reset();
  previewImg.src = "";
  imagePathSpan.textContent = "None";
  document.getElementById("partId").value = "";

  // Dynamic width and scroll
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  partForm.style.width = "80vw";
  partForm.style.maxHeight = "80vh";
  partForm.style.overflowY = "auto";

  if (part) {
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

    // Show last two segments of image path
    if (part["Image Name"]) {
      const segments = part["Image Name"].split(/[\\/]/);
      const lastTwo = segments.slice(-2).join("/");
      imagePathSpan.textContent = lastTwo;
      previewImg.src = part["Image Name"];
    } else {
      imagePathSpan.textContent = "None";
    }
  } else {
    document.getElementById("formTitle").textContent = "Add Part";
  }

  modal.classList.remove("hidden");
}

/* ====== IMAGE FILE SELECTION ====== */
imageFileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    previewImg.src = ev.target.result;
    const segments = file.name.split(/[\\/]/);
    const lastTwo = segments.slice(-2).join("/");
    imagePathSpan.textContent = lastTwo;
  };
  reader.readAsDataURL(file);
});

/* ====== SUBMIT FORM ====== */
partForm.addEventListener("submit", e => {
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
    imageValid: false
  };

  if (!payload["Customer Name"] || !payload["Part Name"] || !payload["Part No"]) {
    showToast("Customer, Part Name and Part No are required", "warning");
    return;
  }

  const dup = parts.find(p => p.id !== id && p["Customer Name"] === payload["Customer Name"] && p["Part No"] === payload["Part No"] && !p.deleted);
  if (dup) { showToast("Duplicate Part No exists for this customer", "error"); return; }

  const idx = parts.findIndex(p => p.id === id);
  if (idx >= 0) {
    parts[idx] = { ...parts[idx], ...payload };
    validateAllImages([parts[idx]]).then(() => {
      showToast("Part updated", "success");
      modal.classList.add("hidden");
      filterAndRender();
      buildSideNav();
    });
  } else {
    parts.push(payload);
    validateAllImages([payload]).then(() => {
      showToast("Part added", "success");
      modal.classList.add("hidden");
      filterAndRender();
      buildSideNav();
    });
  }
});

/* ====== CANCEL BUTTON ====== */
cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));

/* ====== CONFIRM BEFORE DELETE ====== */
export function confirmDelete(callback) {
  if (confirm("Are you sure you want to delete this part?")) {
    callback();
  }
}
