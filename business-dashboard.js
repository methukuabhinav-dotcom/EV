import { protectRoute } from "./guard.js";
import { db } from "./firebase-config.js";
import { EV_DATA } from "./vehicle-data.js";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Global State
let currentBrand = sessionStorage.getItem("businessBrand");
let evData = [];
let currentUserData = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    protectRoute('business').then(userData => {
        console.log("Business User Verified:", userData.email);
        currentUserData = userData;

        populateBrandSelect();

        // Auto-set brand from profile if exists
        if (userData.brand && !currentBrand) {
            currentBrand = userData.brand;
            sessionStorage.setItem("businessBrand", currentBrand);
        }

        if (!currentBrand) {
            const modal = new bootstrap.Modal(document.getElementById('brandLoginModal'));
            modal.show();
            
            // Add click listener to brand name to re-open modal
            const brandDisplay = document.getElementById("brandNameDisplay");
            brandDisplay.style.cursor = "pointer";
            brandDisplay.onclick = () => modal.show();
        } else {
            document.getElementById("brandNameDisplay").innerText = currentBrand;
            // Add click listener to brand name to re-open modal
            const brandDisplay = document.getElementById("brandNameDisplay");
            brandDisplay.style.cursor = "pointer";
            brandDisplay.onclick = () => {
                const modal = new bootstrap.Modal(document.getElementById('brandLoginModal'));
                modal.show();
            };

            loadData();
            checkAdStatus();
            renderProfile();
            showSection('analytics');
        }
    });
});

function populateBrandSelect() {
    const brandSelect = document.getElementById("brandSelect");
    if (!brandSelect) return;

    const brands = new Set();
    
    // Extract brands from nested EV_DATA structure
    if (EV_DATA) {
        Object.keys(EV_DATA).forEach(category => {
            if (EV_DATA[category].brands) {
                Object.keys(EV_DATA[category].brands).forEach(brand => {
                    brands.add(brand);
                });
            }
        });
    }

    // Add manually if any missing or from other sources
    ['Tesla', 'Hyundai', 'Kia', 'BMW', 'Mercedes'].forEach(b => brands.add(b));

    const sortedBrands = Array.from(brands).sort();
    
    sortedBrands.forEach(brand => {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });
}


// Mock Login
// Login / Set Brand
window.setBrandSession = async function () {
    const brandSelect = document.getElementById("brandSelect");
    const brand = brandSelect.value;
    
    if (brand) {
        sessionStorage.setItem("businessBrand", brand);
        currentBrand = brand;
        document.getElementById("brandNameDisplay").innerText = brand;
        
        // Setup click-to-change again
        document.getElementById("brandNameDisplay").onclick = () => {
            const modal = new bootstrap.Modal(document.getElementById('brandLoginModal'));
            modal.show();
        };

        // Persist to Firestore
        try {
            const uid = sessionStorage.getItem("uid");
            if (uid) {
                const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
                await setDoc(doc(db, "users", uid), { brand: brand }, { merge: true });
                console.log("Brand saved to profile");
            }
        } catch (e) {
            console.error("Error saving brand:", e);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('brandLoginModal'));
        modal.hide();
        loadData();
        checkAdStatus();
    }
}

// Load EV Data for Analytics
function loadData() {
    fetch("EV_Dataset_Cleaned.json")
        .then(res => res.json())
        .then(data => {
            evData = Array.isArray(data) ? data : data.data;
            processAnalytics();
        });
}

function processAnalytics() {
    // Filter for this brand
    const brandData = evData.filter(d => d.Brand.toLowerCase() === currentBrand.toLowerCase());

    // Mock Metrics based on filtered data count
    const baseCount = brandData.length || 50;
    const views = baseCount * 125;
    const leads = Math.floor(views * 0.08); // 8% conversion
    const engagement = 60 + Math.floor(Math.random() * 20); // 60-80%

    // Update Stats
    document.getElementById("stats-views").innerText = views.toLocaleString();
    document.getElementById("stats-leads").innerText = leads.toLocaleString();
    document.getElementById("stats-engagement").innerText = engagement + "%";

    // Chart 1: Model Interest
    const modelMap = {};
    brandData.forEach(d => {
        modelMap[d.Model] = (modelMap[d.Model] || 0) + (d.Units_Sold_Per_Year || 10);
    });

    const ctx1 = document.getElementById("brandInterestChart");
    new Chart(ctx1, {
        type: "bar",
        data: {
            labels: Object.keys(modelMap),
            datasets: [{
                label: "User Interest (Units)",
                data: Object.values(modelMap),
                backgroundColor: "#6366f1"
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // Chart 2: Demographics (Mock)
    const ctx2 = document.getElementById("demographicsChart");
    new Chart(ctx2, {
        type: "doughnut",
        data: {
            labels: ["18-24", "25-34", "35-50", "50+"],
            datasets: [{
                data: [15, 45, 30, 10],
                backgroundColor: ["#cbd5e1", "#6366f1", "#10b981", "#f59e0b"]
            }]
        },
        options: { responsive: true }
    });
}

// Check Ad Status in Firestore
async function checkAdStatus() {
    if (!currentBrand) {
        console.log("No brand selected, skipping ad check.");
        return;
    }
    
    try {
        // Simple query without orderBy to avoid index requirement
        const q = query(
            collection(db, "ads_requests"),
            where("brand", "==", currentBrand)
        );

        const snap = await getDocs(q);
        
        // Convert to array and sort in-memory (to avoid index error)
        let docs = [];
        snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
        
        // Sort by timestamp desc
        docs.sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
            return timeB - timeA;
        });

        // 1. RENDER HISTORY & DETERMINE PLAN STATUS
        const historyBody = document.getElementById("adHistoryBody");
        const profileAdHistoryBody = document.getElementById("profileAdHistoryBody");
        const activePlansContainer = document.getElementById("active-plans-container");
        const noActivePlansEl = document.getElementById("no-active-plans");

        if (historyBody) historyBody.innerHTML = "";
        if (profileAdHistoryBody) profileAdHistoryBody.innerHTML = "";
        
        let hasActivePlan = false;
        let activePlanInfo = null;

        const now = new Date();

        // A. Check user doc for subscription FIRST
        if (currentUserData && currentUserData.subscription) {
            const sub = currentUserData.subscription;
            if (sub.status === 'active' && sub.expiresAt && (sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt)) > now) {
                hasActivePlan = true;
                activePlanInfo = sub;
            }
        }

        // B. Load historical ads from ads_requests
        docs.forEach(data => {
            const status = data.status || 'expired';
            const expiry = data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate().toLocaleDateString() : new Date(data.expiresAt).toLocaleDateString()) : '-';
            const date = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toLocaleDateString() : new Date(data.timestamp).toLocaleDateString()) : '-';

            const row = `
                <tr>
                    <td>${date}</td>
                    <td>${data.plan ? data.plan.toUpperCase() : 'N/A'}</td>
                    <td>₹${data.amount || 0}</td>
                    <td><span class="badge ${getStatusBadge(status)}">${status.toUpperCase()}</span></td>
                    <td>${expiry}</td>
                </tr>
            `;
            if (historyBody) historyBody.innerHTML += row;

            if (profileAdHistoryBody && data.title) {
                profileAdHistoryBody.innerHTML += `
                    <tr>
                        <td>${date}</td>
                        <td><span class="fw-bold">${data.title}</span></td>
                        <td>${data.plan ? data.plan.toUpperCase() : 'N/A'}</td>
                        <td><span class="badge ${getStatusBadge(status)}">${status.toUpperCase()}</span></td>
                    </tr>
                `;
            }
        });

        // Populate Active Plans in Profile
        if (activePlansContainer) {
            activePlansContainer.innerHTML = "";
            if (hasActivePlan) {
                const expiryDate = (activePlanInfo.expiresAt.toDate ? activePlanInfo.expiresAt.toDate() : new Date(activePlanInfo.expiresAt)).toLocaleDateString();
                activePlansContainer.innerHTML = `
                    <div class="col-md-6">
                        <div class="p-3 border rounded border-primary bg-light">
                            <h6 class="fw-bold text-primary mb-1">${activePlanInfo.plan.toUpperCase()} Plan</h6>
                            <p class="small mb-2 text-muted">Expires: ${expiryDate}</p>
                            <div class="badge bg-success">ACTIVE</div>
                        </div>
                    </div>
                `;
            } else {
                activePlansContainer.innerHTML = `<div class="col-12 text-center py-4 text-muted">No active subscription plans found.</div>`;
            }
        }

        // 2. TOGGLE VIEWS
        const manageSection = document.getElementById("manage-ad-section");
        const createSection = document.getElementById("create-ad-section");
        const statusEl = document.getElementById("stats-ad-status");
        
        // Plan & Publish UI Elements
        const publishActions = document.getElementById("publish-actions");
        const noPlanWarning = document.getElementById("no-plan-warning");

        // Use a separate variable to check for CURRENTLY running AD content
        let activeOrPendingAd = null;
        docs.forEach(data => {
            if (!activeOrPendingAd && (data.status === 'active' || data.status === 'pending') && data.title) {
                activeOrPendingAd = data;
            }
        });

        if (activeOrPendingAd) {
            // == SCENARIO A: Ad is currently running or pending ==
            if (manageSection) manageSection.style.display = "block";
            if (createSection) createSection.style.display = "none";

            if (document.getElementById("manageTitle")) document.getElementById("manageTitle").innerText = activeOrPendingAd.title || "No Title";
            if (document.getElementById("manageDesc")) document.getElementById("manageDesc").innerText = activeOrPendingAd.description || "No Description";
            if (document.getElementById("manageLink")) document.getElementById("manageLink").href = activeOrPendingAd.targetLink || "#";
            if (document.getElementById("manageImage")) document.getElementById("manageImage").src = activeOrPendingAd.imageUrl || "https://via.placeholder.com/400x200?text=No+Image";

            const badge = document.getElementById("manageStatusBadge");
            if (badge) {
                badge.innerText = activeOrPendingAd.status.toUpperCase();
                badge.className = `badge ${getStatusBadge(activeOrPendingAd.status)} p-2`;
            }

            if (statusEl) {
                statusEl.innerText = activeOrPendingAd.status === 'active' ? "ACTIVE ✅" : "PENDING ⏳";
                statusEl.className = activeOrPendingAd.status === 'active' ? "text-success fw-bold" : "text-warning fw-bold";
            }

            sessionStorage.setItem("currentAdId", activeOrPendingAd.id);

        } else {
            // == SCENARIO B: No active ad content ==
            if (manageSection) manageSection.style.display = "none";
            if (createSection) createSection.style.display = "block";
            
            if (statusEl) {
                statusEl.innerText = hasActivePlan ? "Plan Active" : "Inactive";
                statusEl.className = hasActivePlan ? "text-success fw-bold" : "text-secondary";
            }
            sessionStorage.removeItem("currentAdId");

            // Check if they have an active plan (subscription) to determine which UI to show
            if (hasActivePlan) {
                if(publishActions) publishActions.style.display = "block";
                if(noPlanWarning) noPlanWarning.style.display = "none";
            } else {
                if(publishActions) publishActions.style.display = "none";
                if(noPlanWarning) noPlanWarning.style.display = "block";
            }
        }

    } catch (err) {
        console.error("Ad check error:", err);
    }
}

function getStatusBadge(status) {
    if (status === 'active') return 'bg-success';
    if (status === 'pending') return 'bg-warning text-dark';
    return 'bg-secondary';
}

// ================= AD MANAGEMENT FUNCTIONS =================

window.enableEditMode = function () {
    document.getElementById("edit-ad-form").style.display = "block";
    // Pre-fill
    document.getElementById("editTitle").value = document.getElementById("manageTitle").innerText;
    document.getElementById("editDesc").value = document.getElementById("manageDesc").innerText;
    document.getElementById("editLink").value = document.getElementById("manageLink").href;
    document.getElementById("editImage").value = document.getElementById("manageImage").src;
}

window.disableEditMode = function () {
    document.getElementById("edit-ad-form").style.display = "none";
}

window.updateAdContent = async function () {
    const docId = sessionStorage.getItem("currentAdId");
    if (!docId) return;

    const newContent = {
        title: document.getElementById("editTitle").value,
        description: document.getElementById("editDesc").value,
        targetLink: document.getElementById("editLink").value,
        imageUrl: document.getElementById("editImage").value,
        status: 'pending' // Reset to pending for Admin approval
    };

    try {
        await updateDoc(doc(db, "ads_requests", docId), newContent);
        alert("Ad updated! It has been sent for Admin approval.");
        disableEditMode();
        checkAdStatus(); // Refresh UI
    } catch (e) {
        console.error("Update failed", e);
        alert("Update failed. Please try again.");
    }
}

window.cancelAd = async function () {
    const docId = sessionStorage.getItem("currentAdId");
    if (!docId) return;

    if (confirm("Are you sure you want to stop this promotion? This cannot be undone and no refund will be issued automatically.")) {
        try {
            await updateDoc(doc(db, "ads_requests", docId), { status: 'cancelled' });
            alert("Promotion stopped.");
            checkAdStatus();
        } catch (e) {
            console.error("Cancel failed", e);
        }
    }
}

// Submit Ad for Approval (For users with ACTIVE Plan)
window.submitAdForApproval = async function() {
    const adData = {
        title: document.getElementById("adTitle").value.trim(),
        desc: document.getElementById("adDesc").value.trim(),
        image: document.getElementById("adImage").value.trim(),
        link: document.getElementById("adLink").value.trim()
    };

    if (!adData.title || !adData.desc || !adData.link) {
        alert("Please fill in the Ad Title, Description, and Link.");
        return;
    }

    try {
        const uid = sessionStorage.getItem("uid");
        if(!uid) return;

        // Verify sub from current data
        if (!currentUserData || !currentUserData.subscription || currentUserData.subscription.status !== 'active') {
            alert("Your subscription is not active. Please subscribe first.");
            return;
        }

        // Create new Ad Request linked to the user's active sub
        await addDoc(collection(db, "ads_requests"), {
            uid: uid,
            brand: currentBrand,
            plan: currentUserData.subscription.plan,
            amount: 0, 
            status: 'pending',
            timestamp: new Date(),
            expiresAt: currentUserData.subscription.expiresAt,
            title: adData.title,
            description: adData.desc,
            imageUrl: adData.image,
            targetLink: adData.link
        });

        alert("Ad Submitted for Approval!");
        checkAdStatus();
        
        // Switch back to analytics view
        if (typeof showSection === 'function') {
            showSection('analytics');
        } else {
             document.querySelector("button[onclick=\"showSection('analytics')\"]")?.click();
        }

    } catch(err) {
        console.error("Error submitting ad:", err);
        alert("Failed to submit ad.");
    }
};


// Payment Logic
window.initiatePayment = function () {
    const amount = window.selectedAmount;
    const plan = window.selectedPlan;

    if (!amount || !plan) {
        alert("Please select a plan first.");
        return;
    }

    // Optional: Capture Ad Preview data if they filled it out in Advertising section
    const adData = {
        title: document.getElementById("adTitle")?.value.trim() || "",
        desc: document.getElementById("adDesc")?.value.trim() || "",
        image: document.getElementById("adImage")?.value.trim() || "",
        link: document.getElementById("adLink")?.value.trim() || ""
    };

    const options = {
        "key": "rzp_test_S7Gb21AIbAKorp", // Use your Key ID
        "amount": amount * 100,
        "currency": "INR",
        "name": "Volt Analytics Business",
        "description": `Sub Upgrade - ${plan.toUpperCase()} Plan`,
        "image": "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
        "handler": function (response) {
            recordAdRequest(response.razorpay_payment_id, plan, amount, adData);
        },
        "prefill": {
            "name": currentBrand + " Rep",
            "email": currentUserData?.email || "business@voltevs.com"
        },
        "theme": { "color": "#6366f1" }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

async function recordAdRequest(payId, plan, amount, adData) {
    try {
        const uid = sessionStorage.getItem("uid");
        if (!uid) return;

        // Check current expiry for stacking
        let currentExpiry = null;
        if (currentUserData && currentUserData.subscription && currentUserData.subscription.expiresAt) {
            currentExpiry = currentUserData.subscription.expiresAt;
        }

        const expiry = calculateExpiry(plan, currentExpiry);

        // 1. Update User Subscription in 'users' collection
        const userRef = doc(db, "users", uid);
        const subData = {
            plan: plan,
            status: 'active',
            expiresAt: expiry,
            lastRenewal: new Date(),
            paymentId: payId
        };
        await updateDoc(userRef, { subscription: subData });

        // Update local state
        if (!currentUserData) currentUserData = {};
        currentUserData.subscription = subData;

        // 2. Log logic: If they provided ad content during payment, create the request
        if (adData && adData.title && adData.link) {
            await addDoc(collection(db, "ads_requests"), {
                uid: uid,
                brand: currentBrand,
                plan: plan,
                amount: amount,
                status: 'pending',
                timestamp: new Date(),
                expiresAt: expiry,
                title: adData.title,
                description: adData.desc,
                imageUrl: adData.image,
                targetLink: adData.link,
                paymentId: payId
            });
        } else {
             // Just record the payment/plan upgrade in ads_requests for history keeping
             await addDoc(collection(db, "ads_requests"), {
                uid: uid,
                brand: currentBrand,
                plan: plan,
                amount: amount,
                status: 'subscription_upgrade',
                timestamp: new Date(),
                expiresAt: expiry,
                paymentId: payId
            });
        }

        alert("Subscription Updated Successfully! Time has been added to your account.");
        checkAdStatus();
        renderProfile();

        // Switch back to advertising so they can publish
        showSection('advertising');

    } catch (err) {
        console.error("Error recordAdRequest:", err);
        alert("Payment successful but failed to update subscription. Please contact support.");
    }
}

function calculateExpiry(plan, currentExpiry = null) {
    let date = new Date();
    
    // Stacking logic: If existing plan is still active, add to its expiry
    if (currentExpiry) {
        const expDate = currentExpiry.toDate ? currentExpiry.toDate() : new Date(currentExpiry);
        if (expDate > date) {
            date = expDate;
        }
    }

    if (plan === 'monthly') date.setMonth(date.getMonth() + 1);
    else if (plan === 'quarterly') date.setMonth(date.getMonth() + 3);
    else if (plan === 'yearly') date.setFullYear(date.getFullYear() + 1);
    
    return date;
}

// Render Profile Info
function renderProfile() {
    if (!currentUserData) return;

    // Basic Info
    document.getElementById("profile-name").innerText = currentUserData.fullName || "Business User";
    document.getElementById("profile-email").innerText = currentUserData.email || "-";
    document.getElementById("profile-brand").innerText = currentBrand || "-";
    document.getElementById("profile-logins").innerText = currentUserData.loginCount || "0";
    
    if (currentUserData.createdAt) {
        const joinedDate = currentUserData.createdAt.toDate ? currentUserData.createdAt.toDate() : new Date(currentUserData.createdAt);
        document.getElementById("profile-joined").innerText = joinedDate.toLocaleDateString();
    }

    // Avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserData.fullName)}&background=6366f1&color=fff&size=128`;
    document.getElementById("profile-avatar").src = avatarUrl;
}

window.showSection = function(sectionId) {
    if (!sectionId) return;
    
    // Normalize ID
    const cleanId = sectionId.replace('section-', '').toLowerCase();
    const targetId = 'section-' + cleanId;
    
    const sections = ['section-analytics', 'section-advertising', 'section-plans', 'section-profile'];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === targetId) {
                el.style.display = 'block'; 
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.classList.remove('d-none');
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Update Sidebar Navigation UI
    document.querySelectorAll('.nav-link-custom').forEach(el => {
        el.classList.remove('active');
        const onclickAttr = el.getAttribute('onclick');
        if (onclickAttr && onclickAttr.toLowerCase().includes(cleanId)) {
            el.classList.add('active');
        }
    });

    // Load data for specific sections
    try {
        if (cleanId === 'profile') {
            renderProfile();
        }
        
        // Refresh ad status for all dynamic sections
        if (['analytics', 'advertising', 'plans', 'profile'].includes(cleanId)) {
            checkAdStatus(); 
        }
    } catch (e) {
        console.error("Error updating section data:", e);
    }
}
