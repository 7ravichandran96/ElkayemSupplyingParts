/* ========= GLOBAL STATE & DATA ========= */
let parts = [];          // full parts array
let visibleParts = [];   // filtered visible parts
let activeCustomer = null; // currently selected customer
const THEME_BG = "#f2dfb8"; // theme highlight color

/* ========= LOAD & VALIDATE DATA ========= */
async function loadInitialData() {
  try {
    const res = await fetch("images.json");
    const data = await res.json();

    parts = data.map(p => ({
      ...p,
      deleted: p.deleted || false,
      imageValid: false
    }));

    await validateAllImages(parts);

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

/* Validate images */
function validateAllImages(list) {
  const promises = list.map((p, idx) => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { list[idx].imageValid = true; resolve(true); };
      img.onerror = () => { list[idx].imageValid = false; resolve(false); };
      img.src = p["Image Name"] || "";
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
