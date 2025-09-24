// Get the side navigation container element
const navBar = document.getElementById("navBar");

// Function to build the side navigation dynamically based on 'parts' data
function buildSideNav() {
  // Clear existing nav content before rebuilding
  navBar.innerHTML = "";

  // ---- ALL Customers Button ----
  // This button shows all customers (no filter)
  const allBtn = document.createElement("button");
  allBtn.className = "nav-item";
  // Highlight ALL Customers button if no active customer is selected
  if (!activeCustomer) allBtn.classList.add("active");
  allBtn.innerHTML = `<span class="nav-label">ALL Customers</span><span class="badge">${countAvailableParts()}</span>`;

  // On click, reset activeCustomer, re-render and scroll to top
  allBtn.addEventListener("click", () => {
    activeCustomer = null;
    filterAndRender();           // Your function to filter & update the main view
    setActiveNavButton(null);    // Highlight "ALL Customers" button as active
    setTimeout(() => {
      scrollToTopOfPage();
    }, 150); // Slight delay for smoother UX
  });
  navBar.appendChild(allBtn);

  // ---- Unique Customers Section ----
  // Create a map of customer names to their valid parts
  const custMap = {};
  parts.forEach(p => {
    // Only include parts that are not deleted and have valid images
    if (!p.deleted && p.imageValid) {
      const name = p["Customer Name"] || "(Unknown)"; // Handle missing names
      if (!custMap[name]) custMap[name] = [];
      custMap[name].push(p);
    }
  });

  // Sort customer names alphabetically
  Object.keys(custMap).sort().forEach(name => {
    const arr = custMap[name];

    // Create nav item container for each customer
    const btn = document.createElement("div");
    btn.className = "nav-customer";

    // Highlight this customer if it matches activeCustomer
    if (activeCustomer === name) btn.classList.add("active");

    // Create thumbnail image element
    const thumb = document.createElement("img");
    thumb.className = "nav-thumb";
    thumb.alt = name;
    thumb.src = arr[0]["Image Name"]; // Use first image as thumbnail
    thumb.loading = "lazy";            // Lazy loading for performance

    // Hide thumbnail if image fails to load (broken link)
    thumb.onerror = () => { thumb.style.display = "none"; };

    // Customer name label
    const label = document.createElement("span");
    label.className = "nav-label";
    label.textContent = name;

    // Badge showing count of parts for this customer
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = arr.length;

    // Append thumbnail, label, and badge to the customer nav item
    btn.appendChild(thumb);
    btn.appendChild(label);
    btn.appendChild(badge);

    // On click: set this customer active, filter data, update nav, scroll top
    btn.addEventListener("click", () => {
      activeCustomer = name;
      filterAndRender();
      setActiveNavButton(name);
      setTimeout(() => {
        scrollToTopOfPage();
      }, 150);
    });

    // Add customer button to nav
    navBar.appendChild(btn);
  });

  // ---- If No Valid Customers ----
  if (Object.keys(custMap).length === 0) {
    // Show a message if no parts with valid images found
    const p = document.createElement("p");
    p.className = "nav-empty";
    p.textContent = "No available parts (valid images required).";
    navBar.appendChild(p);
  }
}

// Function to visually set which nav button is active
function setActiveNavButton(customerName) {
  // Remove 'active' class from all nav items first
  navBar.querySelectorAll(".active").forEach(el => el.classList.remove("active"));

  if (!customerName) {
    // If no customerName given, activate ALL Customers button
    const allBtn = navBar.querySelector("button.nav-item");
    if (allBtn) allBtn.classList.add("active");
    return;
  }

  // Activate the nav item whose label matches the customerName
  Array.from(navBar.children).forEach(child => {
    const label = child.querySelector(".nav-label");
    if (label && label.textContent === customerName) {
      child.classList.add("active");
    }
  });
}

// Scroll smoothly to the top of the page
function scrollToTopOfPage() {
  console.log("Scrolling to top of page...");
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Hamburger menu toggle for mobile navigation
const hamburger = document.getElementById("toggleNav");
const sideNav = document.querySelector(".nav.fixed-nav");
const mainContent = document.querySelector(".main-content");

// On hamburger click, toggle nav visibility and main content shift
hamburger.addEventListener("click", () => {
  sideNav.classList.toggle("open");
  mainContent.classList.toggle("shifted");
});
