import { protectRoute } from "./guard.js";
import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🔐 User Guard (Firebase + Firestore)
protectRoute('user', ['Standard Plan', 'Premium Plan']).then(async (userData) => {
  console.log("User Verified:", userData.fullName);
  if (document.getElementById("profileEmail")) document.getElementById("profileEmail").innerText = userData.email;
  if (document.getElementById("profileRole")) document.getElementById("profileRole").innerText = userData.role.toUpperCase();

  // 🔄 SELF-HEAL: Sync Local Storage Subscription to Firestore if missing
  const localSub = localStorage.getItem("userSubscription");
  if (localSub) {
    try {
      const sub = JSON.parse(localSub);
      if (sub.status === 'Paid') {
        const userRef = doc(db, "users", userData.uid);
        // We blindly merge local subscription to server to fix any "Free" status vs "Paid" mismatch
        await setDoc(userRef, {
          subscription_status: 'active',
          plan: sub.plan,
          plan_price: sub.price,
          transaction_id: sub.txId || sub.methodDetails
        }, { merge: true });
        console.log("✅ Subscription Synced to Firestore");
      }
    } catch (e) {
      console.error("Sync Error:", e);
    }
  }
});

// 🔓 Logout
window.logout = function () {
  import("./auth.js").then(authModule => {
    authModule.handleLogout();
  });
};

// 💳 Load Subscription Details
const subData = localStorage.getItem("userSubscription");
if (subData) {
  const sub = JSON.parse(subData);

  // Show section
  const subSection = document.getElementById("subscription-section");
  if (subSection) subSection.style.display = "block";

  // Populate
  if (document.getElementById("sub-plan")) document.getElementById("sub-plan").innerText = sub.plan;
  if (document.getElementById("sub-price")) document.getElementById("sub-price").innerText = sub.price;
  if (document.getElementById("sub-method")) document.getElementById("sub-method").innerText = sub.method;
  if (document.getElementById("sub-txid")) document.getElementById("sub-txid").innerText = sub.txId;
}

// Display User Profile
const userEmail = localStorage.getItem("userEmail") || "User";
const userRole = localStorage.getItem("role") || "Standard";
// Update DOM elements if they exist (we will add them to HTML next)
if (document.getElementById("profileEmail")) document.getElementById("profileEmail").innerText = userEmail;
if (document.getElementById("profileRole")) document.getElementById("profileRole").innerText = userRole.toUpperCase();


// ⏱ Time Tracking
function updateTimeSpent() {
  const loginTime = sessionStorage.getItem("loginTime");
  if (loginTime) {
    const now = Date.now();
    const diff = now - parseInt(loginTime);

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (document.getElementById("timeSpent")) {
      document.getElementById("timeSpent").innerText = `${minutes}m ${seconds}s`;
    }
  }
}
setInterval(updateTimeSpent, 1000);
updateTimeSpent();

// 📊 Load & Process CSV data
let allEVData = [];

// Using an async IIFE to allow await at the top level
(async () => {

  const response = await fetch('backend-data/ev_vehicle_with_extra_10000.json');
  const data = await response.json();

  // Ensure we have an array
  let rawData = Array.isArray(data) ? data : data.data;

  // Filter out Tesla and Hyundai
  allEVData = rawData.filter(d =>
    !['Tesla', 'Hyundai'].includes(d.Brand)
  );

  // Initialize with saved filter or default to All
  const savedBrand = localStorage.getItem("selectedBrand") || "All";
  const brandFilter = document.getElementById("brandFilter");
  if (brandFilter) brandFilter.value = savedBrand;

  initCharts();
  updateDashboard(savedBrand);
})()
  .catch(e => console.error("Failed to load EV data:", e));

/* =========================================
   BRAND FILTER & CHART LOGIC
   ========================================= */

// Initialize Charts
let chargingChartInstance = null;
let batteryChartInstance = null;
let brandChartInstance = null;
let priceChartInstance = null;

function initCharts() {
  const ctxCharging = document.getElementById('chargingChart');
  const ctxBattery = document.getElementById('batteryChart');
  const ctxBrand = document.getElementById('brandChart');
  const ctxPrice = document.getElementById('priceChart');

  if (ctxCharging) {
    chargingChartInstance = new Chart(ctxCharging, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Avg Charging Time (Hours)',
          data: [],
          backgroundColor: ['#0d6efd', '#fd7e14', '#6610f2', '#198754', '#d63384', '#6c757d']
        }]
      }
    });
  }

  if (ctxBattery) {
    batteryChartInstance = new Chart(ctxBattery, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#6c757d', '#d63384', '#198754']
        }]
      }
    });
  }

  if (ctxBrand) {
    brandChartInstance = new Chart(ctxBrand, {
      type: 'bar', // Changed to horizontal bar for readability if many brands
      data: {
        labels: [],
        datasets: [{
          label: 'Vehicle Count',
          data: [],
          backgroundColor: '#0d6efd'
        }]
      },
      options: { indexAxis: 'y' }
    });
  }

  if (ctxPrice) {
    priceChartInstance = new Chart(ctxPrice, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          label: 'Avg Price (Lakhs)',
          data: [],
          backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#6c757d', '#d63384', '#198754']
        }]
      }
    });
  }
}

// Update Dashboard Function
function updateDashboard(brand) {
  if (!allEVData.length) return;

  // Filter Data
  const filteredData = brand === "All"
    ? allEVData
    : allEVData.filter(d => d.Brand === brand);

  if (filteredData.length === 0) {
    console.warn("No data found for brand:", brand);
    return;
  }

  // 1. Calculate KPIs
  let totalEfficiency = 0;
  let maxBattery = 0;
  let totalCO2 = 0;
  let totalDistance = 0;
  let totalBatteryHealth = 0; // Simulated if not present

  // For Mode/Channel calculation
  const channels = {};

  filteredData.forEach(d => {
    totalEfficiency += Number(d.Efficiency_km_per_kWh) || 0;
    const bat = Number(d.Battery_Capacity_kWh) || 0;
    if (bat > maxBattery) maxBattery = bat;

    totalCO2 += Number(d.CO2_Emissions_Saved_kg) || 0;
    totalDistance += Number(d.Driving_Range_km) || 0;

    // Channel isn't in JSON, we can use Region or Usage_Type as proxy or keep simulated
    // Let's use Usage_Type for the KPI text
    const usage = d.Usage_Type || "Unknown";
    channels[usage] = (channels[usage] || 0) + 1;
  });

  const avgEfficiency = (totalEfficiency / filteredData.length).toFixed(2);
  const topUse = Object.keys(channels).reduce((a, b) => channels[a] > channels[b] ? a : b, "N/A");

  // Overall Savings Calculation (Simulated logic from previous code)
  const savings = Math.round(totalDistance * 2); // ₹2 per km
  const avgBatHealth = 85;

  // Update DOM KPIs
  // Re-purposing Satisfaction -> Efficiency
  if (document.getElementById("kpi-satisfaction")) {
    document.getElementById("kpi-satisfaction").innerText = avgEfficiency;
    const label = document.getElementById("kpi-satisfaction").nextElementSibling;
    if (label) label.innerText = "Avg Efficiency (km/kWh)";
  }

  // Re-purposing Channel -> Top Usage Type
  if (document.getElementById("kpi-channel")) {
    document.getElementById("kpi-channel").innerText = topUse;
    const label = document.getElementById("kpi-channel").nextElementSibling;
    if (label) label.innerText = "Top Usage Type";
  }

  if (document.getElementById("kpi-battery")) document.getElementById("kpi-battery").innerText = Math.round(maxBattery) + " kWh";
  if (document.getElementById("kpi-co2")) document.getElementById("kpi-co2").innerText = Math.round(totalCO2).toLocaleString() + " kg";

  // General Stats (Top Cards)
  if (document.getElementById("totalSavings")) document.getElementById("totalSavings").innerText = "₹" + savings.toLocaleString();
  if (document.getElementById("co2Saved")) document.getElementById("co2Saved").innerText = Math.round(totalCO2).toLocaleString() + " kg";
  if (document.getElementById("totalDistance")) document.getElementById("totalDistance").innerText = totalDistance.toLocaleString() + " km";
  if (document.getElementById("batteryHealth")) document.getElementById("batteryHealth").innerText = avgBatHealth + "%";


  // 2. Prepare Chart Data Aggregations

  // By Category
  const categoryStats = {};
  // Structure: { "SUV": { count: 0, totalChargeTime: 0, totalPrice: 0 } }

  // By Brand (for the brand chart)
  const brandCounts = {};

  filteredData.forEach(d => {
    const cat = d.Vehicle_Category || "Unknown";
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, totalChargeTime: 0, totalPrice: 0, totalBattery: 0 };

    categoryStats[cat].count++;
    categoryStats[cat].totalChargeTime += Number(d.Charging_Time_Hours) || 0;
    categoryStats[cat].totalPrice += Number(d.Net_Price_After_Subsidy) || Number(d.Vehicle_Price) || 0;
    categoryStats[cat].totalBattery += Number(d.Battery_Capacity_kWh) || 0;

    // For Global Brand Chart (if needed filtered, but usually this one is static "Market Overview". 
    // However, if we want it to react to filters, it contradicts "Vehicle Count by Brand" logic if the filter is a single brand.
    // Let's implement: If "All", show all brands. If specific brand, show models? 
    // Plan says: "Count of vehicles per Brand". 
    // If we select "Tesla", showing a bar chart of just "Tesla" is boring. 
    // Let's keep Brand Chart showing Global Market Share ALWAYS (using allEVData), 
    // OR if filtered, show Models distribution? 
    // Let's stick to Global Market Share for Brand Chart when "All" is selected, 
    // and maybe Model distribution if a Brand is selected.
    // For simplicity/robustness: The Brand Chart will always show top brands from CURRENT filtered data (which is 1 brand if filtered).
    // Actually, distinct charts usually imply distinct aggregations.
    // Let's make "Vehicle Count by Brand" always show TOP brands from ALL data, to give context.
    const b = d.Brand || "Unknown";
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  });

  const categories = Object.keys(categoryStats);
  const avgChargeTimes = categories.map(c => (categoryStats[c].totalChargeTime / categoryStats[c].count).toFixed(1));
  const countsByCategory = categories.map(c => categoryStats[c].count);
  const avgBatteryCapacity = categories.map(c => parseFloat((categoryStats[c].totalBattery / categoryStats[c].count).toFixed(1)));
  const avgPrices = categories.map(c => Math.round(categoryStats[c].totalPrice / categoryStats[c].count));

  // Update Charging Chart (Bar)
  if (chargingChartInstance) {
    chargingChartInstance.data.labels = categories;
    chargingChartInstance.data.datasets[0].data = avgChargeTimes;
    chargingChartInstance.update();
  }

  // Update Battery Chart (Pie - Avg Battery Capacity by Category in kWh)
  if (batteryChartInstance) {
    batteryChartInstance.data.labels = categories;
    batteryChartInstance.data.datasets[0].data = avgBatteryCapacity;
    batteryChartInstance.data.datasets[0].label = 'Avg Battery Capacity (kWh)';
    batteryChartInstance.update();
  }

  // Update Brand Chart
  // If "All" selected -> Show counts by Brand. 
  // If "Tesla" selected -> Show counts by Model.
  if (brandChartInstance) {
    let labels = [];
    let data = [];

    if (brand === "All") {
      // Aggregate global brand counts
      const bCounts = {};
      allEVData.forEach(d => {
        const b = d.Brand || "Unknown";
        bCounts[b] = (bCounts[b] || 0) + 1;
      });
      labels = Object.keys(bCounts);
      data = Object.values(bCounts);
    } else {
      // Show Models for this brand
      // Strip trailing _NUMBER suffix (e.g. "MG_Hatchback_208" → "MG_Hatchback")
      const mCounts = {};
      filteredData.forEach(d => {
        const m = (d.Model || "Unknown").replace(/_\d+$/, '');
        mCounts[m] = (mCounts[m] || 0) + 1;
      });
      labels = Object.keys(mCounts);
      data = Object.values(mCounts);
      brandChartInstance.data.datasets[0].label = 'Model Count';
    }

    brandChartInstance.data.labels = labels;
    brandChartInstance.data.datasets[0].data = data;
    brandChartInstance.update();
  }

  // Update Price Chart (Doughnut - Avg Price by Category)
  if (priceChartInstance) {
    priceChartInstance.data.labels = categories;
    priceChartInstance.data.datasets[0].data = avgPrices;
    priceChartInstance.update();
  }

  // Update HTML Table
  const tableBody = document.querySelector(".card-body table"); // weak selector, but works for this file structure
  if (tableBody) {
    let html = '<table class="table table-bordered">';
    categories.forEach((cat, i) => {
      html += `<tr><th>${cat}</th><td>₹${avgPrices[i].toLocaleString()}</td></tr>`;
    });
    html += '</table>';
    tableBody.innerHTML = html;
  }
}

// Event Listener for Filter
const brandFilter = document.getElementById("brandFilter");
if (brandFilter) {
  brandFilter.addEventListener("change", function () {
    const selectedBrand = this.value;
    localStorage.setItem("selectedBrand", selectedBrand);
    updateDashboard(selectedBrand);
  });
} else {
  // Fallback if filter not found (e.g. on other pages)
  // initCharts called in fetch
}

// 🚪 Logout - handled by inline script in HTML
// document.getElementById("logoutBtn").onclick = ...
