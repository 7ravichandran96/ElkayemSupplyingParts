const zoomPreview = document.getElementById("zoomPreview");
const zoomCanvas = document.getElementById("zoomCanvas");
const zoomCloseBtn = document.getElementById("zoomCloseBtn");

zoomCloseBtn.addEventListener("click", closeZoom);
zoomPreview.addEventListener("click", (e) => { if (e.target === zoomPreview) closeZoom(); });

function openZoomWithImageUrl(url, title = "") {
  const ctx = zoomCanvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const maxW = Math.floor(window.innerWidth * 0.92);
    const maxH = Math.floor(window.innerHeight * 0.82);
    let w = img.width, h = img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.floor(w * ratio); h = Math.floor(h * ratio);
    zoomCanvas.width = w; zoomCanvas.height = h;
    zoomCanvas.style.maxWidth = w + "px";
    zoomCanvas.style.maxHeight = h + "px";
    ctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    ctx.drawImage(img, 0, 0, w, h);
    zoomPreview.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  img.onerror = () => { showToast("Could not open image", "error"); };
  img.src = url;
}

function openImagePreview(part) {
  if (!part || !part["Image Name"]) { showToast("No image available", "warning"); return; }
  openZoomWithImageUrl(part["Image Name"], part["Part Name"]);
}

function closeZoom() {
  zoomPreview.classList.add("hidden");
  document.body.style.overflow = "";
}

function closeAllOverlays() {
  modal.classList.add("hidden");
  closeZoom();
}
