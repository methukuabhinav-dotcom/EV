import { protectRoute } from "./guard.js";
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🔐 Admin Guard (Firebase + Firestore)
protectRoute('admin').then(userData => {
  console.log("Admin Verified:", userData.fullName);
  // Optional: Update UI with userData
});

console.log("Admin Dashboard JS Loaded");

let evData = [];
let charts = {};

const powerBIColors = [
  "#118DFF", "#12239E", "#E66C37",
  "#6B007B", "#E044A7", "#744EC2"
];

// Global data for User Analytics
let allUsers = [];
let allSessions = [];

// 🔓 Logout
window.logout = function () {
  import("./auth.js").then(authModule => {
    authModule.handleLogout();
  });
};

// 📂 Load data
fetch("EV_Dataset_Cleaned.json")
  .then(res => res.json())
  .then(data => {
    evData = Array.isArray(data) ? data : data.data;
    loadBrandFilter();
    loadCategoryFilter();
    updateDashboard();
  });

// 🔽 Brand filter
function loadBrandFilter() {
  const select = document.getElementById("brandFilter");
  const brands = [...new Set(evData.map(d => d.Brand))];

  brands.forEach(b => {
    const o = document.createElement("option");
    o.value = b;
    o.textContent = b;
    select.appendChild(o);
  });

  select.addEventListener("change", updateDashboard);
}

// 🔽 Category filter (Industry)
function loadCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  const categories = [...new Set(evData.map(d => d.Vehicle_Category))];

  categories.forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    select.appendChild(o);
  });

  select.addEventListener("change", updateDashboard);
}

// 🔄 Main Dashboard Update
function updateDashboard() {
  const brandVal = document.getElementById("brandFilter").value;
  const catVal = document.getElementById("categoryFilter").value;

  const rows = evData.filter(d => {
    const matchBrand = (brandVal === "All" || d.Brand === brandVal);
    const matchCat = (catVal === "All" || d.Vehicle_Category === catVal);
    return matchBrand && matchCat;
  });

  // ================= KPIs =================
  let distance = 0, co2 = 0, battery = 0;

  rows.forEach(r => {
    distance += (Number(r.Daily_Driving_Distance_km) || 0) * 30;
    co2 += Number(r.CO2_Emissions_Saved_kg) || 0;
    battery += Number(r.Resale_Value_Percentage) || 0;
  });

  document.getElementById("users").innerText = rows.length;
  document.getElementById("distance").innerText = distance.toLocaleString();
  document.getElementById("savings").innerText = (distance * 2).toLocaleString();
  document.getElementById("co2").innerText = Math.round(co2);
  document.getElementById("battery").innerText =
    rows.length ? Math.round(battery / rows.length) : 0;

  // --- Fetch Store Stats ---
  getDoc(doc(db, "site_stats", "dashboard")).then(snap => {
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById("store-sales").innerText = data.totalSalesCount || 0;
      document.getElementById("store-revenue").innerText = (data.totalRevenue || 0).toLocaleString();
    }
  });

  Object.values(charts).forEach(c => c.destroy());

  // ================= Units by Year =================
  const yearMap = {};
  rows.forEach(r => {
    yearMap[r.Purchase_Year] =
      (yearMap[r.Purchase_Year] || 0) + (Number(r.Units_Sold_Per_Year) || 1);
  });

  charts.unitsYear = new Chart(distanceChart, {
    type: "line",
    data: {
      labels: Object.keys(yearMap),
      datasets: [{
        label: "Distance Travelled per Year",
        data: Object.values(yearMap),
        borderColor: powerBIColors[0],
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: chartOptions()
  });

  // ================= Category =================
  const catMap = {};
  rows.forEach(r => {
    catMap[r.Vehicle_Category] =
      (catMap[r.Vehicle_Category] || 0) + 1;
  });

  charts.category = new Chart(categoryChart, {
    type: "doughnut",
    data: {
      labels: Object.keys(catMap),
      datasets: [{
        data: Object.values(catMap),
        backgroundColor: powerBIColors
      }]
    },
    options: chartOptions(true)
  });

  // ================= State =================
  const stateMap = {};
  rows.forEach(r => {
    stateMap[r.State] = (stateMap[r.State] || 0) + 1;
  });

  charts.state = new Chart(stateChart, {
    type: "bar",
    data: {
      labels: Object.keys(stateMap),
      datasets: [{
        label: "Units Sold",
        data: Object.values(stateMap),
        backgroundColor: powerBIColors[0]
      }]
    },
    options: chartOptions()
  });

  // ================= NEW 1️⃣ Units Sold per Year by State =================
  const stateYearMap = {};
  rows.forEach(r => {
    const key = `${r.State}-${r.Purchase_Year}`;
    stateYearMap[key] = (stateYearMap[key] || 0) + 1;
  });

  charts.stateYear = new Chart(stateYearChart, {
    type: "bar",
    data: {
      labels: Object.keys(stateYearMap),
      datasets: [{
        label: "Units Sold",
        data: Object.values(stateYearMap),
        backgroundColor: powerBIColors[1]
      }]
    },
    options: chartOptions()
  });

  // ================= NEW 2️⃣ Vehicle Price by Year =================
  const priceYearMap = {};
  rows.forEach(r => {
    priceYearMap[r.Purchase_Year] =
      (priceYearMap[r.Purchase_Year] || 0) + (Number(r.Vehicle_Price) || 0);
  });

  charts.priceYear = new Chart(priceYearChart, {
    type: "line",
    data: {
      labels: Object.keys(priceYearMap),
      datasets: [{
        label: "Total Vehicle Price",
        data: Object.values(priceYearMap),
        borderColor: powerBIColors[2],
        borderWidth: 3,
        tension: 0.4
      }]
    },
    options: chartOptions()
  });

  // ================= NEW 3️⃣ Revenue by Brand =================
  // Aggregation
  const revMap = {};
  const salesMap = {};

  rows.forEach(r => {
    const b = r.Brand;
    const revenue = (Number(r.Vehicle_Price) || 0) * (Number(r.Units_Sold_Per_Year) || 1);
    const units = Number(r.Units_Sold_Per_Year) || 1;

    revMap[b] = (revMap[b] || 0) + revenue;
    salesMap[b] = (salesMap[b] || 0) + units;
  });

  // Sort by revenue desc for better viz
  const sortedBrands = Object.keys(revMap).sort((a, b) => revMap[b] - revMap[a]);

  charts.revenue = new Chart(document.getElementById("revenueByBrandChart"), {
    type: "bar",
    data: {
      labels: sortedBrands,
      datasets: [{
        label: "Total Revenue (₹)",
        data: sortedBrands.map(b => revMap[b]),
        backgroundColor: powerBIColors[3]
      }]
    },
    options: chartOptions()
  });

  charts.sales = new Chart(document.getElementById("salesByBrandChart"), {
    type: "bar",
    data: {
      labels: sortedBrands,
      datasets: [{
        label: "Units Sold (Customer Interest)",
        data: sortedBrands.map(b => salesMap[b]),
        backgroundColor: powerBIColors[4]
      }]
    },
    options: chartOptions()
  });
}

// ⚙️ Common options
function chartOptions(isPie = false) {
  return {
    responsive: true,
    plugins: {
      legend: { position: isPie ? "right" : "top" }
    },
    scales: isPie ? {} : {
      y: { beginAtZero: true }
    }
  };
}

/* =========================================
   USER ANALYTICS TAB LOGIC
   ========================================= */

window.switchTab = function (tab) {
  const evSection = document.getElementById("ev-insights");
  const userSection = document.getElementById("user-analytics");
  const evTab = document.getElementById("tab-ev");
  const userTab = document.getElementById("tab-users");

  if (tab === 'ev') {
    evSection.style.display = "block";
    userSection.style.display = "none";
    evTab.classList.add("active");
    userTab.classList.remove("active");
    updateDashboard(); // Refresh EV data
  } else if (tab === 'users') {
    evSection.style.display = "none";
    userSection.style.display = "block";
    document.getElementById("ad-manager").style.display = "none";
    evTab.classList.remove("active");
    userTab.classList.add("active");
    document.getElementById("tab-ads").classList.remove("active");
    updateUserAnalytics();
  } else if (tab === 'ads') {
    evSection.style.display = "none";
    userSection.style.display = "none";
    document.getElementById("ad-manager").style.display = "block";

    evTab.classList.remove("active");
    userTab.classList.remove("active");
    document.getElementById("tab-ads").classList.add("active");
    updateAdManager();
  }
}

// Global user charts
let userActivityTrendChart = null;
let userDistChart = null;

// ... [Existing User Analytics Code] ...

// --- AD MANAGER LOGIC ---
import { setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

async function updateAdManager() {
  // 1. Fetch Active Ad
  try {
    const globalAdSnap = await getDoc(doc(db, "site_settings", "global_ad"));
    if (globalAdSnap.exists()) {
      const ad = globalAdSnap.data();
      document.getElementById("activeAdBrand").innerText = ad.brand;
      const pages = ad.targetPages ? ad.targetPages.join(", ") : "All";
      document.getElementById("activeAdDetails").innerText = `Plan: ${ad.plan} | Pages: ${pages} | Expires: ${ad.expiresAt?.toDate().toLocaleDateString()}`;
    } else {
      document.getElementById("activeAdBrand").innerText = "No Active Promo";
      document.getElementById("activeAdDetails").innerText = "-";
    }
  } catch (e) { console.error("Ad fetch error", e); }

  // 2. Fetch Pending Requests
  const q = query(collection(db, "ads_requests"), where("status", "==", "pending"));
  const snap = await getDocs(q);

  // Sort client-side to avoid needing a Firestore Composite Index
  const requests = [];
  snap.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
  requests.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

  const tbody = document.getElementById("adRequestsTable");
  tbody.innerHTML = "";

  requests.forEach(data => {
    const id = data.id;
    tbody.innerHTML += `
      <tr id="row-${id}">
        <td class="ps-4 fw-bold">${data.brand}</td>
        <td><span class="badge bg-info text-dark">${data.plan.toUpperCase()}</span></td>
        <td class="fw-bold text-success">₹${data.amount}</td>
        <td>${data.timestamp?.toDate().toLocaleDateString()}</td>
        <td><span class="badge bg-warning">Pending</span></td>
        <td class="text-end pe-4">
          <button class="btn btn-sm btn-primary" onclick="openAdReview('${id}')">Review & Publish</button>
        </td>
      </tr>
    `;
  });
}

// Open Modal
window.openAdReview = async function (docId) {
  try {
    const docSnap = await getDoc(doc(db, "ads_requests", docId));
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    // Populate Modal
    document.getElementById("reviewAdId").value = docId;
    document.getElementById("reviewAdBrand").value = data.brand;
    document.getElementById("reviewAdPlan").value = data.plan;

    document.getElementById("reviewBrandDisplay").value = data.brand;
    // document.getElementById("reviewPlanDisplay").value = data.plan; // Removed from HTML

    // Content Fields
    document.getElementById("reviewTitle").value = data.title || "";
    document.getElementById("reviewDesc").value = data.description || "";
    document.getElementById("reviewLink").value = data.targetLink || "";
    document.getElementById("reviewImage").value = data.imageUrl || "";
    
    // Update Preview Simulation
    updatePreviewImage(data.imageUrl || "");
    document.getElementById('titlePreviewSim').innerText = data.title || 'Ad Title Here';
    document.getElementById('descPreviewSim').innerText = data.description || 'Your promotional message will appear here for users.';

    // Reset checkboxes
    const checkboxes = ["pageHome", "pageAbout", "pagePricing", "pageDashboard", "pageStore"];
    checkboxes.forEach(id => document.getElementById(id).checked = (id === "pageHome"));

    const modal = new bootstrap.Modal(document.getElementById("adReviewModal"));
    modal.show();
  } catch (e) {
    console.error("Error opening review:", e);
  }
}

// Publish Logic
window.publishAd = async function () {
  const docId = document.getElementById("reviewAdId").value;
  const brand = document.getElementById("reviewAdBrand").value;
  const plan = document.getElementById("reviewAdPlan").value;
  const durationDays = parseInt(document.getElementById("reviewDuration").value) || 30;

  // Collect Selected Pages
  const targetPages = [];
  const pageCheckboxes = [
    { id: "pageHome", value: "Home" },
    { id: "pageAbout", value: "About" },
    { id: "pagePricing", value: "Pricing" },
    { id: "pageDashboard", value: "Dashboard" },
    { id: "pageStore", value: "Store" }
  ];
  pageCheckboxes.forEach(cb => {
    if (document.getElementById(cb.id).checked) targetPages.push(cb.value);
  });

  if (targetPages.length === 0) {
    alert("Please select at least one target page.");
    return;
  }

  // Captured Edited Data
  const adData = {
    title: document.getElementById("reviewTitle").value,
    description: document.getElementById("reviewDesc").value,
    targetLink: document.getElementById("reviewLink").value,
    imageUrl: document.getElementById("reviewImage").value,
    targetPages: targetPages
  };

  if (!confirm(`Confirm publishing this ad for ${brand} on ${targetPages.join(', ')}?`)) return;

  try {
    // 1. Set Global Ad with new content
    await setDoc(doc(db, "site_settings", "global_ad"), {
      brand: brand,
      plan: plan,
      requestId: docId,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      ...adData
    });

    // 2. Update Request Status
    await setDoc(doc(db, "ads_requests", docId), { 
        status: 'active',
        publishedAt: new Date(),
        targetPages: targetPages
    }, { merge: true });

    alert("Ad Activated Successfully!");

    // Close Modal
    const modalEl = document.getElementById('adReviewModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    updateAdManager();
  } catch (e) { console.error(e); }
}

window.removeActiveAd = async function () {
  if (!confirm("Stop current promotion?")) return;
  await deleteDoc(doc(db, "site_settings", "global_ad"));
  alert("Promotion Stopped.");
  updateAdManager();
}

async function updateUserAnalytics() {
  try {
    // 1. Fetch Users
    const usersSnap = await getDocs(collection(db, "users"));
    allUsers = [];
    usersSnap.forEach(doc => allUsers.push(doc.data()));

    // 2. Fetch Sessions
    const sessionsSnap = await getDocs(collection(db, "sessions"));
    allSessions = [];
    sessionsSnap.forEach(doc => allSessions.push(doc.data()));

    // 3. KPIs
    const totalUsersCount = allUsers.length;
    const activeNowCount = allUsers.filter(u => u.status === 'Active').length;
    const totalLoginsTotal = allUsers.reduce((acc, u) => acc + (u.loginCount || 0), 0);

    const completedSessions = allSessions.filter(s => s.duration > 0);
    const totalSessionTimeMs = completedSessions.reduce((acc, s) => acc + s.duration, 0);
    const avgSessionDurationMs = completedSessions.length ? (totalSessionTimeMs / completedSessions.length) : 0;
    const avgDurationMins = Math.round(avgSessionDurationMs / 60000);

    document.getElementById("totalUsers").innerText = totalUsersCount;
    document.getElementById("activeUsers").innerText = activeNowCount;
    document.getElementById("totalLogins").innerText = totalLoginsTotal;
    document.getElementById("avgSessionDuration").innerText = `${avgDurationMins}m`;

    // 4. USER DISTRIBUTION CHART
    if (userDistChart) userDistChart.destroy();
    userDistChart = new Chart(document.getElementById("userDistributionChart"), {
      type: "pie",
      data: {
        labels: ["Active Now", "Inactive"],
        datasets: [{
          data: [activeNowCount, totalUsersCount - activeNowCount],
          backgroundColor: [powerBIColors[0], "#374151"]
        }]
      },
      options: chartOptions(true)
    });

    // 5. USER ACTIVITY TREND CHART
    renderUserTrendChart(allSessions);

    // 6. USER TABLE
    renderUserTable(allUsers, allSessions);
  } catch (error) {
    console.error("Error updating user analytics:", error);
  }
}

function renderUserTrendChart(sessions) {
  const rangeSelect = document.getElementById("userActivityRange");
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");
  if (!rangeSelect) return;

  const mode = rangeSelect.value;
  const now = new Date();
  let startDate, endDate;

  if (mode === 'custom') {
    startDate = new Date(startInput.value);
    endDate = new Date(endInput.value);
    if (isNaN(startDate) || isNaN(endDate)) return;
  } else {
    const days = parseInt(mode) || 7;
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(now.getDate() - (days - 1));

    // Update inputs to match
    startInput.value = startDate.toISOString().split('T')[0];
    endInput.value = endDate.toISOString().split('T')[0];
  }

  const labels = [];
  const data = [];

  // Normalize dates to start/end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  let current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toLocaleDateString('en-GB'); // DD/MM/YYYY
    labels.push(dateKey);

    const count = sessions.filter(s => {
      if (!s.loginTime) return false;
      const logDate = (s.loginTime.toDate ? s.loginTime.toDate() : new Date(s.loginTime)).toLocaleDateString('en-GB');
      return logDate === dateKey;
    }).length;
    data.push(count);

    current.setDate(current.getDate() + 1);
  }

  const ctx = document.getElementById("userActivityChart");
  if (!ctx) return;

  if (userActivityTrendChart) userActivityTrendChart.destroy();
  userActivityTrendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Logins per Day",
        data: data,
        borderColor: "#6a5cff",
        backgroundColor: "rgba(106, 92, 255, 0.1)",
        fill: true,
        tension: 0.4
      }]
    },
    options: chartOptions()
  });
}

// Add event listeners for trend range inputs
document.addEventListener('change', (e) => {
  if (['userActivityRange', 'startDate', 'endDate'].includes(e.target.id)) {
    renderUserTrendChart(allSessions);
  }
});

function renderUserTable(users, sessions) {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  users.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")).forEach(user => {
    const loginCount = user.loginCount || 0;
    const totalDurationMs = user.totalTimeSpent || 0;
    const totalMins = Math.round(totalDurationMs / 60000);

    const lastLoginDate = user.lastLogin ? (user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin)) : null;
    const lastLoginStr = lastLoginDate ? lastLoginDate.toLocaleString() : "Never";

    const isActive = user.status === 'Active';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="ps-4">
        <div class="fw-bold text-white">${user.fullName || "N/A"}</div>
        <small class="text-muted">${user.email}</small>
      </td>
      <td class="text-center">${loginCount}</td>
      <td class="text-center text-primary fw-semibold">${totalMins}m</td>
      <td class="text-center small">${lastLoginStr}</td>
      <td class="text-center">
        <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">${isActive ? 'Active' : 'Inactive'}</span>
      </td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${user.uid}')">View History</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// View history modal function
window.viewUserDetails = async function (uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return;
    const user = userDoc.data();

    const q = query(collection(db, "sessions"), where("uid", "==", uid), orderBy("loginTime", "desc"), limit(50));
    const sessionsSnap = await getDocs(q);
    const logs = [];
    sessionsSnap.forEach(doc => logs.push(doc.data()));

    document.getElementById("modalUserName").innerText = user.fullName || "N/A";
    document.getElementById("modalUserEmail").innerText = user.email;

    const tbody = document.getElementById("modalSessionRows");
    tbody.innerHTML = "";

    logs.forEach(log => {
      const tr = document.createElement("tr");
      const loginDate = log.loginTime ? (log.loginTime.toDate ? log.loginTime.toDate() : new Date(log.loginTime)) : null;
      const logoutDate = log.logoutTime ? (log.logoutTime.toDate ? log.logoutTime.toDate() : new Date(log.logoutTime)) : null;

      const loginStr = loginDate ? loginDate.toLocaleString() : "N/A";
      const logoutStr = logoutDate ? logoutDate.toLocaleString() : (log.status === 'active' ? "<span class='text-success fw-bold'>Active Now</span>" : "<span class='text-danger'>Abruptly Ended</span>");

      let durationStr = "-";
      if (log.duration) {
        const mins = Math.floor(log.duration / 60000);
        const secs = Math.floor((log.duration % 60000) / 1000);
        durationStr = `${mins}m ${secs}s`;
      } else if (log.status === 'active') {
        durationStr = "Ongoing";
      }

      tr.innerHTML = `
        <td class="small">${loginStr}</td>
        <td class="small">${logoutStr}</td>
        <td class="text-center small">${durationStr}</td>
      `;
      tbody.appendChild(tr);
    });

    const modalEl = document.getElementById('userModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  } catch (error) {
    console.error("Error viewing user details:", error);
  }
}

