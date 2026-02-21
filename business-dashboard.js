import { fetchEVData } from "./vehicle-data.js";
import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ==========================================
// 1. MOCK USER & GLOBAL STATE
// ==========================================
const MOCK_USER = {
    uid: "mock-business-user-123",
    fullName: "Business Admin",
    email: "business@voltevs.com",
    photoURL: "https://ui-avatars.com/api/?name=Business+Admin&background=6366f1&color=fff",
    role: "business",
    createdAt: new Date("2024-01-01"),
    loginCount: 42,
    subscription: {
        plan: "yearly",
        status: "active",
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    },
    walletBalance: 15400
};

let currentBrand = sessionStorage.getItem("businessBrand");
let evData = [];
let currentUserData = MOCK_USER;

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Business Dashboard Loaded (JSON-Only Mode)");

    // Initialize UI
    // Initialize UI
    // Brand selection is now handled via Login Modal

    if (!currentBrand) {
        const modal = new bootstrap.Modal(document.getElementById('brandLoginModal'));
        modal.show();
    } else {
        initDashboard();
    }

    // Setup Event Listeners
    setupBrandModalListeners();
});

function initDashboard() {
    document.getElementById("brandNameDisplay").innerText = currentBrand;
    if (document.getElementById("walletBalanceDisplay")) {
        document.getElementById("walletBalanceDisplay").innerText = `₹${currentUserData.walletBalance.toLocaleString()}`;
    }
    loadData(); // Load Analytics from JSON
    renderProfile();
    showSection('analytics');
}

// ==========================================
// 3. BRAND SELECTION LOGIC
// ==========================================
// ==========================================
// 3. AUTHENTICATION LOGIC
// ==========================================

const BRAND_CREDENTIALS = {
    "ather@gmail.com": { password: "ather@123", brand: "Ather" },
    "byd@gmail.com": { password: "byd@123", brand: "BYD" },
    "mg@gmail.com": { password: "mg@123", brand: "MG" },
    "mahindra@gmail.com": { password: "mahindra@123", brand: "Mahindra" },
    "ola@gmail.com": { password: "ola@123", brand: "Ola" },
    "revolt@gmail.com": { password: "revolt@123", brand: "Revolt" },
    "tvs@gmail.com": { password: "tvs@123", brand: "TVS" },
    "tata@gmail.com": { password: "tata@123", brand: "Tata" }
};

window.handleBrandLogin = function () {
    const emailInput = document.getElementById("brandEmail");
    const passwordInput = document.getElementById("brandPassword");
    const errorMsg = document.getElementById("loginError");

    const email = emailInput.value.toLowerCase().trim();
    const password = passwordInput.value.trim();

    if (BRAND_CREDENTIALS[email] && BRAND_CREDENTIALS[email].password === password) {
        // Successful Login
        const brandName = BRAND_CREDENTIALS[email].brand;

        // Save Session
        sessionStorage.setItem("businessBrand", brandName);
        sessionStorage.setItem("businessEmail", email);

        currentBrand = brandName;
        currentUserData = { ...MOCK_USER, email: email, fullName: brandName + " Admin" };

        // Hide Modal
        const modalEl = document.getElementById('brandLoginModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Refresh UI
        initDashboard();

        // Clear form
        emailInput.value = "";
        passwordInput.value = "";
        errorMsg.style.display = "none";

    } else {
        // Invalid Credentials
        errorMsg.style.display = "block";
        passwordInput.value = "";
    }
};

// Removed populateBrandSelect as it's no longer needed

// Helper for Title Case
// toTitleCase and setBrandSession removed
function setupBrandModalListeners() {
    const brandDisplay = document.getElementById("brandNameDisplay");
    if (brandDisplay) {
        brandDisplay.style.cursor = "pointer";
        brandDisplay.onclick = () => {
            new bootstrap.Modal(document.getElementById('brandLoginModal')).show();
        };
    }
}

// ==========================================
// 4. ANALYTICS (Charts & KPIs)
// ==========================================
function loadData() {
    fetch("backend-data/ev_vehicle_with_extra_10000.json")
        .then(res => res.json())
        .then(data => {
            const rawData = Array.isArray(data) ? data : data.data;
            // Basic cleanup
            evData = rawData.filter(d => !['Tesla', 'Hyundai'].includes(d.Brand));
            processAnalytics();
        })
        .catch(err => console.error("Failed to load analytics data:", err));
}

window.togglePaymentUI = function () {
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;

    // Reset styles
    const cardWallet = document.getElementById('cardWallet');
    const cardOnline = document.getElementById('cardOnline');
    const checkWallet = document.getElementById('checkWallet');
    const checkOnline = document.getElementById('checkOnline');

    if (cardWallet) cardWallet.classList.remove('border-primary', 'bg-light');
    if (cardOnline) cardOnline.classList.remove('border-primary', 'bg-light');
    if (checkWallet) checkWallet.classList.add('d-none');
    if (checkOnline) checkOnline.classList.add('d-none');

    // Apply active style
    if (method === 'wallet') {
        if (cardWallet) cardWallet.classList.add('border-primary', 'bg-light');
        if (checkWallet) checkWallet.classList.remove('d-none');
    } else if (method === 'razorpay') {
        if (cardOnline) cardOnline.classList.add('border-primary', 'bg-light');
        if (checkOnline) checkOnline.classList.remove('d-none');
    }
}

function processAnalytics() {
    // Filter for this brand
    const brandData = evData.filter(d => d.Brand.toLowerCase() === currentBrand.toLowerCase());

    if (!brandData.length) {
        console.warn("No data for brand:", currentBrand);
    }

    // Mock Metrics
    const baseCount = brandData.length || 0;
    const views = baseCount * 125; // Simulated multiplier
    const leads = Math.floor(views * 0.08); // 8% conversion
    const engagement = baseCount > 0 ? (60 + Math.floor(Math.random() * 20)) : 0;

    // Update KPIs
    if (document.getElementById("stats-views")) document.getElementById("stats-views").innerText = views.toLocaleString();
    if (document.getElementById("stats-leads")) document.getElementById("stats-leads").innerText = leads.toLocaleString();
    if (document.getElementById("stats-engagement")) document.getElementById("stats-engagement").innerText = engagement + "%";

    // Chart 1: Category Interest
    const categoryMap = {};
    brandData.forEach(d => {
        const category = d.Vehicle_Category || "Unknown";
        categoryMap[category] = (categoryMap[category] || 0) + (Number(d.Units_Sold_Per_Year) || 1);
    });

    renderChart("brandInterestChart", "bar", Object.keys(categoryMap), Object.values(categoryMap), "Units Sold", "#6366f1");

    // Chart 2: Usage Type
    const usageMap = {};
    brandData.forEach(d => {
        const usage = d.Usage_Type || "Unknown";
        usageMap[usage] = (usageMap[usage] || 0) + 1;
    });

    renderChart("demographicsChart", "doughnut", Object.keys(usageMap), Object.values(usageMap), "Distribution", ["#cbd5e1", "#6366f1", "#10b981", "#f59e0b"]);
}

function renderChart(canvasId, type, labels, data, label, colors) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: type === 'doughnut' } }
        }
    });
}

// ==========================================
// 5. BOOKINGS (REAL FIRESTORE DATA)
// ==========================================
async function loadBrandBookings() {
    const tbody = document.getElementById("brandBookingsTable");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading approved bookings...</td></tr>';

    try {
        console.log("Fetching bookings for:", currentBrand);

        // Strategy: Run two queries to handle casing mismatch (e.g. "Revolt" vs "REVOLT")
        // Query 1: Exact match
        const q1 = query(
            collection(db, "sales"),
            where("brand", "==", currentBrand),
            where("sharedWithBusiness", "==", true)
        );

        // Query 2: Uppercase match (if different)
        let q2 = null;
        if (currentBrand.toUpperCase() !== currentBrand) {
            q2 = query(
                collection(db, "sales"),
                where("brand", "==", currentBrand.toUpperCase()),
                where("sharedWithBusiness", "==", true)
            );
        }

        // Execute queries
        const results = await Promise.all([
            getDocs(q1),
            q2 ? getDocs(q2) : Promise.resolve({ forEach: () => { } })
        ]);

        const bookingsMap = new Map(); // Use Map to dedup by ID

        results.forEach(snap => {
            snap.forEach(doc => {
                if (!bookingsMap.has(doc.id)) {
                    const data = doc.data();
                    bookingsMap.set(doc.id, {
                        date: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(),
                        user: data.userName || "Guest",
                        email: data.userEmail || "-", // Added Email
                        model: data.model || "Unknown",
                        price: data.amount || 0,
                        status: "Approved"
                    });
                }
            });
        });

        const bookings = Array.from(bookingsMap.values());

        // Client-side sort to be safe against missing indexes
        bookings.sort((a, b) => b.date - a.date);

        renderBookingsTable(bookings, tbody);

    } catch (e) {
        console.error("Error fetching bookings:", e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading bookings. Ensure Admin has shared them.</td></tr>';
    }
}

function renderBookingsTable(bookings, tbody) {
    tbody.innerHTML = "";
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found.</td></tr>';
        return;
    }

    bookings.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td class="ps-4">${b.date.toLocaleDateString()}</td>
                <td class="fw-bold">${b.user}</td>
                <td class="text-muted small">${b.email}</td>
                <td>${b.model}</td>
                <td class="text-success fw-bold">₹${Number(b.price).toLocaleString()}</td>
                <td><span class="badge bg-success">${b.status}</span></td>
            </tr>
        `;
    });
}


// ==========================================
// 6. ADVERTISING & SUBSCRIPTION
// ==========================================
function checkAdStatus() {
    if (!currentBrand) return;

    // Simulate an active ad if they have a plan
    const hasActivePlan = currentUserData.subscription.status === 'active';
    const statusEl = document.getElementById("stats-ad-status");

    // Update simple status Text
    if (statusEl) {
        statusEl.innerText = hasActivePlan ? "Plan Active" : "Inactive";
        statusEl.className = hasActivePlan ? "text-success fw-bold" : "text-secondary";
    }

    // Load Real Subscription History
    loadSubscriptionHistory();

    // Show/Hide Sections based on "Plan"
    const manageSection = document.getElementById("manage-ad-section");
    const createSection = document.getElementById("create-ad-section");
    const publishActions = document.getElementById("publish-actions");

    // Default to "Create New" view for simplicity in this demo
    if (manageSection) manageSection.style.display = 'none';
    if (createSection) createSection.style.display = 'block';
    if (publishActions) publishActions.style.display = 'block';
}

async function loadSubscriptionHistory() {
    const historyBody = document.getElementById("adHistoryBody");
    if (!historyBody) return;

    try {
        const q = query(
            collection(db, "brand_subscriptions"),
            where("brand", "==", currentBrand)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // MOCK FALLBACK: If using the Mock User and no history exists, show the default mock plan logic
            if (currentUserData.uid === MOCK_USER.uid) {
                const mockDate = new Date();
                mockDate.setFullYear(mockDate.getFullYear() - 1); // Bought 1 year ago (renewed?) or just now
                // Actually, Mock User says "Expires in 1 year". So let's say bought today.
                const today = new Date().toLocaleDateString();
                const expiry = currentUserData.subscription.expiresAt.toLocaleDateString();

                historyBody.innerHTML = `
                    <tr>
                        <td>${today}</td>
                        <td class="fw-bold text-primary">YEARLY</td>
                        <td>₹44,999</td>
                        <td><span class="badge bg-success">PAID</span></td>
                        <td>${expiry}</td>
                    </tr>
                `;
                return;
            }

            historyBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No subscription history found.</td></tr>';
            return;
        }

        const historyItems = [];
        querySnapshot.forEach((doc) => {
            historyItems.push(doc.data());
        });

        // Sort by timestamp descending (Client-side to avoid index requirement)
        historyItems.sort((a, b) => {
            const tA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date(0);
            const tB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date(0);
            return tB - tA;
        });

        historyBody.innerHTML = "";
        historyItems.forEach((data) => {
            const date = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toLocaleDateString() : new Date(data.timestamp).toLocaleDateString()) : "-";
            const expires = data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate().toLocaleDateString() : new Date(data.expiresAt).toLocaleDateString()) : "-";

            historyBody.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td class="fw-bold text-primary">${data.plan ? data.plan.toUpperCase() : 'UNKNOWN'}</td>
                    <td>₹${(data.amount || 0).toLocaleString()}</td>
                    <td><span class="badge bg-success">PAID</span></td>
                    <td>${expires}</td>
                </tr>
            `;
        });

    } catch (e) {
        console.error("Error loading history:", e);
        historyBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading history.</td></tr>';
    }
}

// Mock Ad Submission
// Calculate Ad Total
window.calculateAdTotal = function () {
    const checkboxes = document.querySelectorAll('#create-ad-section input[type="checkbox"]:checked');
    let total = 0;
    checkboxes.forEach(cb => {
        total += parseInt(cb.getAttribute('data-price') || 0);
    });

    const display = document.getElementById("adTotalDisplay");
    if (display) display.innerText = `₹${total.toLocaleString()}`;
    return total;
}

// Submit Ad to Firestore
window.submitAdForApproval = async function () {
    const title = document.getElementById("adTitle").value;
    const link = document.getElementById("adLink").value;
    const desc = document.getElementById("adDesc").value;
    const image = document.getElementById("adImage").value;

    // Get selected pages
    const selectedPages = [];
    const checkboxes = document.querySelectorAll('#create-ad-section input[type="checkbox"]:checked');
    checkboxes.forEach(cb => selectedPages.push(cb.value));

    // Validation
    if (!title || !link || !desc || !image) {
        alert("Please fill in all ad details.");
        return;
    }
    if (selectedPages.length === 0) {
        alert("Please select at least one page for ad placement.");
        return;
    }

    const totalCost = window.calculateAdTotal();

    // Payment Validation (Razorpay Only)
    const paymentMethod = "razorpay";

    try {
        const adData = {
            brand: currentBrand,
            brandEmail: currentUserData.email,
            title: title,
            link: link,
            description: desc,
            imageUrl: image,
            placements: selectedPages,
            amount: totalCost,
            plan: "Custom (Placement)",
            paymentMethod: paymentMethod,
            timestamp: serverTimestamp(),
            userUid: currentUserData.uid
        };

        window.startRazorpayPayment(totalCost, currentUserData.email, async (paymentId) => {
            adData.paymentId = paymentId;
            adData.status = "pending";

            await addDoc(collection(db, "ads_requests"), adData);
            alert(`Payment Successful (ID: ${paymentId})!\nAd request submitted for approval.`);

            // Reset form
            document.getElementById("adTitle").value = "";
            document.getElementById("adLink").value = "";
            document.getElementById("adDesc").value = "";
            document.getElementById("adImage").value = "";
            document.querySelectorAll('#create-ad-section input[type="checkbox"]').forEach(cb => cb.checked = false);
            window.calculateAdTotal(); // Reset total
            showSection('analytics');
        });

    } catch (e) {
        console.error("Error submitting ad:", e);
        alert("Failed to submit ad. Please try again.");
    }
}

window.initiatePayment = function () {
    const selectedPlan = window.selectedPlan || "monthly";
    const amount = window.selectedPlanPrice || 4999;

    window.startRazorpayPayment(amount, currentUserData.email, async (paymentId) => {
        console.log("Plan Payment Successful:", paymentId);

        // Calculate Expiry
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + (selectedPlan === 'monthly' ? 1 : selectedPlan === 'quarterly' ? 3 : 12));

        // Update Local State
        currentUserData.subscription.plan = selectedPlan;
        currentUserData.subscription.status = "active";
        currentUserData.subscription.expiresAt = expiresAt;

        // Save to Firestore
        try {
            await addDoc(collection(db, "brand_subscriptions"), {
                brand: currentBrand,
                email: currentUserData.email,
                plan: selectedPlan,
                amount: amount,
                paymentId: paymentId,
                timestamp: serverTimestamp(),
                expiresAt: expiresAt, // Note: This might need to be converted to Timestamp if strict, but JS Date works often
            });
        } catch (e) {
            console.error("Error saving subscription:", e);
            alert("Warning: Payment succeeded locally, but saving to history failed (Firestore Error).");
        }

        alert(`Payment Successful (ID: ${paymentId})!\nPlan upgraded to ${selectedPlan.toUpperCase()}.`);

        // Refresh UI
        checkAdStatus();
        showSection('plans'); // Stay on plans to see history
    });
}

// ==========================================
// 7. PROFILE & NAVIGATION
// ==========================================
// ==========================================
// 7. PROFILE & NAVIGATION
// ==========================================
function renderProfile() {
    if (!currentUserData) return;
    document.getElementById("profile-name").innerText = currentUserData.fullName;
    document.getElementById("profile-email").innerText = currentUserData.email;
    document.getElementById("profile-brand").innerText = currentBrand;
    document.getElementById("profile-avatar").src = currentUserData.photoURL;

    loadActivePlans();
    loadBrandAds();
}

function loadActivePlans() {
    const container = document.getElementById("active-plans-container");
    if (!container) return;

    // Check custom subscription object
    if (currentUserData.subscription && currentUserData.subscription.status === 'active') {
        const plan = currentUserData.subscription.plan.toUpperCase();
        const expires = currentUserData.subscription.expiresAt.toLocaleDateString();

        container.innerHTML = `
            <div class="col-md-6">
                <div class="card p-3 border-primary bg-light">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="fw-bold mb-0 text-primary">${plan} PLAN</h5>
                        <span class="badge bg-success">ACTIVE</span>
                    </div>
                    <p class="mb-1 text-muted small">Expires on: <strong>${expires}</strong></p>
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="showSection('plans')">Manage / Upgrade</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="col-12 text-center py-4 text-muted" id="no-active-plans">
                No active subscription plans found. <a href="#" onclick="showSection('plans')">Upgrade Now</a>
            </div>
        `;
    }
}

async function loadBrandAds() {
    const tbody = document.querySelector("#section-profile table tbody");
    if (!tbody) return;

    try {
        const q = query(
            collection(db, "ads_requests"),
            where("brand", "==", currentBrand)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No advertisements found.</td></tr>';
            return;
        }

        const ads = [];
        querySnapshot.forEach(doc => ads.push(doc.data()));

        // Sort client-side
        ads.sort((a, b) => {
            const tA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date(0);
            const tB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date(0);
            return tB - tA;
        });

        tbody.innerHTML = "";
        ads.forEach(ad => {
            const date = ad.timestamp ? (ad.timestamp.toDate ? ad.timestamp.toDate().toLocaleDateString() : new Date(ad.timestamp).toLocaleDateString()) : "-";
            const statusBadge = ad.status === 'active' || ad.status === 'approved' ? '<span class="badge bg-success">Active</span>' :
                ad.status === 'rejected' ? '<span class="badge bg-danger">Rejected</span>' :
                    '<span class="badge bg-warning text-dark">Pending</span>';

            tbody.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td class="fw-bold">${ad.title || "Untitled Ad"}</td>
                    <td>${ad.plan}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

    } catch (e) {
        console.error("Error loading brand ads:", e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading advertisements.</td></tr>';
    }
}

window.showSection = function (sectionId) {
    // Normalize ID (handle both 'analytics' and 'section-analytics')
    const cleanId = sectionId.replace('section-', '').toLowerCase();
    const targetId = 'section-' + cleanId;

    // Hide all
    const sections = ['section-analytics', 'section-advertising', 'section-plans', 'section-profile', 'section-bookings'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.classList.add('d-none'); // Ensure bootstrap class is applied
        }
    });

    // Show target
    const target = document.getElementById(targetId);
    if (target) {
        target.style.display = 'block';
        target.classList.remove('d-none');
    }

    // Load Data triggers
    if (cleanId === 'bookings') loadBrandBookings();
    if (cleanId === 'ads' || cleanId === 'advertising') checkAdStatus(); // ensure ad status is fresh
    if (['analytics', 'advertising', 'plans', 'profile'].includes(cleanId)) checkAdStatus();

    // Update Sidebar Active State
    document.querySelectorAll('.nav-link-custom').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('onclick')?.includes(cleanId)) {
            el.classList.add('active');
        }
    });
}

window.logout = function () {
    sessionStorage.clear();
    window.location.href = "login.html"; // Or reload
}
// Razorpay Payment Integration
window.startRazorpayPayment = function (amount, brandEmail, onSuccess) {
    const options = {
        "key": "rzp_test_1DP5mmOlF5G5ag", // Standard Razorpay Test Key
        "amount": amount * 100, // Amount is in currency subunits. Default currency is INR.
        "currency": "INR",
        "name": "EV Analytics",
        "description": "Ad Placement Charges",
        "image": "https://via.placeholder.com/150",
        "handler": function (response) {
            console.log("Payment Successful", response);
            onSuccess(response.razorpay_payment_id);
        },
        "prefill": {
            "name": currentUserData.fullName,
            "email": brandEmail,
            "contact": "9999999999"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
        alert("Payment Failed: " + response.error.description);
    });
    rzp1.open();
}
