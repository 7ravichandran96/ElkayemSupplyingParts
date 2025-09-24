document.addEventListener("DOMContentLoaded", () => {
  const zoomPreview = document.getElementById("zoomPreview");
  const zoomCanvas = document.getElementById("zoomCanvas");
  const zoomCloseBtn = document.getElementById("zoomCloseBtn");
  const ctx = zoomCanvas.getContext("2d");
  const zoomImages = document.querySelectorAll(".zoomable");

  // Draw image covering entire viewport (cover)
  function drawImageOnCanvasCover(img) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    zoomCanvas.width = vw;
    zoomCanvas.height = vh;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const viewportRatio = vw / vh;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > viewportRatio) {
      // Image wider than viewport -> scale by height, crop sides
      drawHeight = vh;
      drawWidth = vh * imgRatio;
      offsetX = -(drawWidth - vw) / 2;
      offsetY = 0;
    } else {
      // Image taller than viewport -> scale by width, crop top/bottom
      drawWidth = vw;
      drawHeight = vw / imgRatio;
      offsetX = 0;
      offsetY = -(drawHeight - vh) / 2;
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  // Show zoom overlay with image
  function showZoom(src) {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      drawImageOnCanvasCover(img);
      zoomPreview.classList.add("active");
      zoomPreview.classList.remove("hidden");
    };
  }

  // Hide zoom overlay
  function hideZoom() {
    zoomPreview.classList.remove("active");
    zoomPreview.classList.add("hidden");
  }

  // Attach click event to all zoomable images
  zoomImages.forEach(img => {
    img.style.cursor = "zoom-in";

    img.addEventListener("click", () => {
      showZoom(img.src);
    });
  });

  // Close zoom on close button click
  zoomCloseBtn.addEventListener("click", hideZoom);

  // Close zoom on overlay click (only if click outside canvas and button)
  zoomPreview.addEventListener("click", (e) => {
    if (e.target === zoomPreview) {
      hideZoom();
    }
  });

  // Close zoom on ESC key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && zoomPreview.classList.contains("active")) {
      hideZoom();
    }
  });

  // Swipe down to close on touch devices
  let touchStartY = 0;
  zoomPreview.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  });
  zoomPreview.addEventListener("touchend", (e) => {
    let touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 50) {
      hideZoom();
    }
  });

  // Optional: redraw on window resize
  window.addEventListener("resize", () => {
    if (zoomPreview.classList.contains("active") && zoomCanvas.width && zoomCanvas.height) {
      const src = zoomCanvas.toDataURL();
      const img = new Image();
      img.src = src;
      img.onload = () => drawImageOnCanvasCover(img);
    }
  });
});
