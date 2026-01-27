import { protectRoute } from "./guard.js";
import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 🔐 User Guard (Firebase + Firestore)
protectRoute('user').then(async (userData) => {
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

// 📊 Load CSV data
fetch("EV_Dataset_Cleaned.json")
  .then(res => res.text())
  .then(data => {

    const rows = data.trim().split("\n");
    const headers = rows[0].split(",");

    // ⚠️ Update column names if needed
    const distanceIndex = headers.indexOf("Distance_km");
    const batteryIndex = headers.indexOf("Battery_Health");

    let totalDistance = 0;
    let totalBattery = 0;
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",");

      if (cols.length > 1) {
        totalDistance += Number(cols[distanceIndex]);
        totalBattery += Number(cols[batteryIndex]);
        count++;
      }
    }

    // 🧮 Calculations (matches your screenshot)
    const savings = Math.round(totalDistance * 2); // ₹2 per km
    const co2 = Math.round(totalDistance * 0.076); // kg CO₂
    const battery = Math.round(totalBattery / count);

    // 🖥 Show values (General Stats)
    if (document.getElementById("totalSavings")) document.getElementById("totalSavings").innerText = "₹" + savings;
    // Note: co2Saved might be overwritten by the brand filter logic below, which is fine
    if (document.getElementById("co2Saved")) document.getElementById("co2Saved").innerText = co2 + " kg";
    if (document.getElementById("totalDistance")) document.getElementById("totalDistance").innerText = totalDistance + " km";
    if (document.getElementById("batteryHealth")) document.getElementById("batteryHealth").innerText = battery + "%";
  });


/* =========================================
   BRAND FILTER & CHART LOGIC
   ========================================= */

// Dummy Data for Brands
const brandData = {
  "All": {
    satisfaction: "5.52",
    channel: "Corporate",
    battery: "85 kWh",
    co2: "145M",
    chargingData: [420, 300, 380, 260, 240, 200],
    batteryData: [30, 22, 15, 13, 12, 8]
  },
  "Tesla": {
    satisfaction: "4.9",
    channel: "Direct",
    battery: "100 kWh",
    co2: "50M",
    chargingData: [120, 80, 150, 60, 40, 90],
    batteryData: [50, 10, 20, 5, 5, 10]
  },
  "Tata": {
    satisfaction: "4.5",
    channel: "Dealership",
    battery: "40.5 kWh",
    co2: "35M",
    chargingData: [200, 150, 180, 120, 100, 90],
    batteryData: [15, 30, 25, 10, 10, 10]
  },
  "Hyundai": {
    satisfaction: "4.7",
    channel: "Online/Dealer",
    battery: "72.6 kWh",
    co2: "28M",
    chargingData: [180, 120, 220, 100, 80, 70],
    batteryData: [20, 25, 30, 10, 5, 10]
  },
  "MG": {
    satisfaction: "4.6",
    channel: "Dealership",
    battery: "50.3 kWh",
    co2: "22M",
    chargingData: [160, 140, 190, 110, 90, 80],
    batteryData: [25, 20, 20, 15, 10, 10]
  },
  "Mahindra": {
    satisfaction: "4.4",
    channel: "Dealership",
    battery: "39.4 kWh",
    co2: "30M",
    chargingData: [220, 180, 200, 130, 110, 100],
    batteryData: [10, 35, 25, 15, 5, 10]
  },
  "Ather": {
    satisfaction: "4.6",
    channel: "Experience Center",
    battery: "3.7 kWh",
    co2: "15M",
    chargingData: [0, 300, 0, 0, 100, 0], // Mostly bikes/scooters
    batteryData: [0, 0, 40, 0, 60, 0]
  },
  "BYD": {
    satisfaction: "4.8",
    channel: "Dealership",
    battery: "71.7 kWh",
    co2: "40M",
    chargingData: [150, 0, 250, 100, 0, 50],
    batteryData: [30, 40, 0, 10, 0, 20]
  },
  "Ola": {
    satisfaction: "4.3",
    channel: "Direct Online",
    battery: "4 kWh",
    co2: "18M",
    chargingData: [0, 320, 0, 0, 150, 0],
    batteryData: [0, 0, 30, 0, 70, 0]
  }
};

// Global Chart Instances
let chargingChartInstance = null;
let batteryChartInstance = null;

// Initialize Charts
function initCharts() {
  const ctxCharging = document.getElementById('chargingChart');
  const ctxBattery = document.getElementById('batteryChart');

  if (ctxCharging) {
    chargingChartInstance = new Chart(ctxCharging, {
      type: 'bar',
      data: {
        labels: ['Sedan', 'Bike', 'SUV', 'Fleet Van', 'Scooter', 'Hatchback'],
        datasets: [{
          label: 'Charging Hours',
          data: [], // Will be filled by updateDashboard
          backgroundColor: ['#0d6efd', '#fd7e14', '#6610f2', '#198754', '#d63384', '#6c757d']
        }]
      }
    });
  }

  if (ctxBattery) {
    batteryChartInstance = new Chart(ctxBattery, {
      type: 'pie',
      data: {
        labels: ['Sedan', 'SUV', 'Bike', 'Hatchback', 'Scooter', 'Fleet Van'],
        datasets: [{
          data: [], // Will be filled by updateDashboard
          backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#6c757d', '#d63384', '#198754']
        }]
      }
    });
  }

  // Static Charts (Market Overview)
  if (document.getElementById('brandChart')) {
    new Chart(document.getElementById('brandChart'), {
      type: 'bar',
      data: {
        labels: ['Ather', 'BYD', 'Hyundai', 'Mahindra', 'MG', 'Ola', 'Tata'],
        datasets: [{
          label: 'Count',
          data: [6520, 6000, 6570, 6670, 6640, 6670, 6700],
          backgroundColor: '#0d6efd'
        }]
      },
      options: { indexAxis: 'y' }
    });
  }

  if (document.getElementById('priceChart')) {
    new Chart(document.getElementById('priceChart'), {
      type: 'doughnut',
      data: {
        labels: ['Sedan', 'SUV', 'Bike', 'Hatchback', 'Scooter', 'Fleet Van'],
        datasets: [{
          data: [23, 16, 15, 15, 15, 16],
          backgroundColor: ['#0d6efd', '#6610f2', '#fd7e14', '#6c757d', '#d63384', '#198754']
        }]
      }
    });
  }
}

// Update Dashboard Function
function updateDashboard(brand) {
  const data = brandData[brand] || brandData["All"];

  // Update KPIs
  if (document.getElementById("kpi-satisfaction")) document.getElementById("kpi-satisfaction").innerText = data.satisfaction;
  if (document.getElementById("kpi-channel")) document.getElementById("kpi-channel").innerText = data.channel;
  if (document.getElementById("kpi-battery")) document.getElementById("kpi-battery").innerText = data.battery;
  if (document.getElementById("kpi-co2")) document.getElementById("kpi-co2").innerText = data.co2;

  // Update Charts
  if (chargingChartInstance) {
    chargingChartInstance.data.datasets[0].data = data.chargingData;
    chargingChartInstance.update();
  }

  if (batteryChartInstance) {
    batteryChartInstance.data.datasets[0].data = data.batteryData;
    batteryChartInstance.update();
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

  // Load Saved State
  const savedBrand = localStorage.getItem("selectedBrand") || "All";
  brandFilter.value = savedBrand;

  // Initialize
  initCharts();
  updateDashboard(savedBrand);
} else {
  // Fallback if filter not found (e.g. on other pages)
  initCharts();
}

// 🚪 Logout - handled by inline script in HTML
// document.getElementById("logoutBtn").onclick = ...
