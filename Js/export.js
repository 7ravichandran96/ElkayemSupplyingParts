const downloadJsonBtn = document.getElementById("downloadJson");
const uploadJsonBtn = document.getElementById("uploadJsonBtn");
const jsonFileInput = document.getElementById("jsonFileInput");

downloadJsonBtn.addEventListener("click", exportAsImagesJson);
uploadJsonBtn.addEventListener("click", () => jsonFileInput.click());

jsonFileInput.addEventListener("change", handleJsonFileLoad);

function exportAsImagesJson() {
  const dataStr = JSON.stringify(parts.map(p => {
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

function handleJsonFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const loaded = JSON.parse(ev.target.result);
      if (!Array.isArray(loaded)) throw new Error("JSON must be an array");
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
    } finally { jsonFileInput.value = ""; }
  };
  reader.readAsText(file);
}
