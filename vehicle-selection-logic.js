/**
 * VEHICLE SELECTION LOGIC
 * Handles dynamic rendering, data filtering, and purchasing.
 */

import { EV_DATA } from './vehicle-data.js';
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

let selectedCategory = '';
let selectedBrand = '';
let selectedModelData = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Reveal first step
    goToStep(1);
    window.handleCategory = handleCategory;
    window.handleBrand = handleBrand;
    window.handleModel = handleModel;
    window.goToStep = goToStep;
    window.initPurchase = initPurchase;
});

function goToStep(step) {
    // Hide all
    document.querySelectorAll('.step-card').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.step-item').forEach(i => i.classList.remove('active'));

    // Show selected
    const target = document.getElementById(`step-${step}`);
    if (target) target.style.display = 'block';

    // Highlight indicator
    for (let i = 1; i <= step; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        if (ind) ind.classList.add('active');
    }
}

function handleCategory(type) {
    selectedCategory = type;
    selectedBrand = '';

    const brands = Object.keys(EV_DATA[type].brands);
    const container = document.getElementById('brandPills');
    container.innerHTML = brands.map(b => `
        <div class="brand-pill" onclick="handleBrand('${b}')">${b}</div>
    `).join('');

    goToStep(2);
}

function handleBrand(brand) {
    selectedBrand = brand;

    // Update active UI
    document.querySelectorAll('.brand-pill').forEach(p => {
        p.classList.toggle('active', p.innerText === brand);
    });

    const models = EV_DATA[selectedCategory].brands[brand];
    const container = document.getElementById('modelCards');
    const wrapper = document.getElementById('modelContainer');

    wrapper.style.display = 'block';
    container.innerHTML = models.map((m, idx) => `
        <div class="col-md-4">
            <div class="card border-0 shadow-sm p-3 h-100 text-start" style="cursor:pointer; border-radius:16px; border: 1.5px solid #f1f5f9; transition:0.3s" onmouseover="this.style.borderColor='#6366f1'" onmouseout="this.style.borderColor='#f1f5f9'" onclick="handleModel(${idx})">
                <div class="fw-bold mb-1" onclick="handleModel(${idx})">${m.model}</div>
                <div class="text-primary fw-bold" onclick="handleModel(${idx})">₹${(m.price - m.subsidy).toLocaleString()}</div>
                <small class="text-muted mt-2 d-block">Range: ${m.range}km</small>
            </div>
        </div>
    `).join('');
}

// ... existing imports replaced by new block below ...

async function handleModel(idx) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        // Guest Logic (Limit to 3 using LocalStorage as fallback or force login)
        // For now, let's force login or use simple localStorage for guests to match the prompt's "User" requirement
        const guestViews = parseInt(localStorage.getItem('guestViewCount') || '0');
        if (guestViews >= 3) {
            alert("Free limit reached! Please login and subscribe to view more.");
            window.location.href = "pricing.html";
            return;
        }
        localStorage.setItem('guestViewCount', guestViews + 1);
    } else {
        // Logged In User Logic (Firestore)
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const viewCount = userData.view_count || 0;
            const subStatus = userData.subscription_status || 'free';

            if (subStatus === 'free' && viewCount >= 3) {
                // Show limit modal
                const modalParams = new URLSearchParams({ msg: "limit_reached" }).toString();
                window.location.href = `pricing.html?${modalParams}`;
                return;
            }

            // Increment count
            await updateDoc(userRef, {
                view_count: increment(1)
            });
        }
    }

    const data = EV_DATA[selectedCategory].brands[selectedBrand][idx];
    selectedModelData = data;

    // Map UI
    document.getElementById('v-model-name').innerText = data.model;
    document.getElementById('v-brand-name').innerText = selectedBrand;
    document.getElementById('v-image').src = data.image || "https://placehold.co/600x400?text=No+Image";
    document.getElementById('v-net-price').innerText = `₹${(data.price - data.subsidy).toLocaleString()}`;
    document.getElementById('v-orig-price').innerText = `₹${data.price.toLocaleString()}`;

    document.getElementById('s-range').innerText = `${data.range} km`;
    document.getElementById('s-battery').innerText = `${data.battery} kWh`;
    document.getElementById('s-charge').innerText = `${data.charging} hrs`;
    document.getElementById('s-speed').innerText = `${data.speed} km/h`;

    const featureHTML = data.features.split(',').map(f => `
        <span class="feature-tag">${f.trim()}</span>
    `).join('');
    document.getElementById('v-features').innerHTML = featureHTML;

    goToStep(3);

    // Initialize Calculator with Defaults
    updateCalculator();
}

function updateCalculator() {
    if (!selectedModelData) return;

    const dist = parseInt(document.getElementById('calc-dist').value);
    const petrolPrice = parseFloat(document.getElementById('calc-petrol').value);
    const mileage = parseFloat(document.getElementById('calc-mileage').value);

    // Update UI labels
    document.getElementById('val-dist').innerText = dist;

    // Monthly Calc
    const days = 30;
    const monthlyDist = dist * days;

    // ICE Cost
    const iceCost = (monthlyDist / mileage) * petrolPrice;

    // EV Cost
    // Cost = Units * Rate (Assume ₹10/unit)
    // Units = (Distance / Range) * BatteryCapacity
    const evUnits = (monthlyDist / selectedModelData.range) * selectedModelData.battery;
    const evCost = evUnits * 10;

    const savingsYearly = (iceCost - evCost) * 12;

    document.getElementById('res-ice').innerText = Math.round(iceCost).toLocaleString();
    document.getElementById('res-ev').innerText = Math.round(evCost).toLocaleString();
    document.getElementById('res-save').innerText = Math.round(savingsYearly).toLocaleString();
}
window.updateCalculator = updateCalculator;

// --- RAZORPAY & PURCHASE TRACKING ---
const RZP_KEY_ID = 'rzp_test_S7Gb21AIbAKorp';

function initPurchase() {
    if (!selectedModelData) return;

    goToStep(4);

    const options = {
        "key": RZP_KEY_ID,
        "amount": (selectedModelData.price - selectedModelData.subsidy) * 100,
        "currency": "INR",
        "name": "Volt EV Store",
        "description": `Booking for ${selectedModelData.model}`,
        "handler": async function (response) {
            await recordPurchase(response.razorpay_payment_id);
        },
        "prefill": {
            "name": sessionStorage.getItem("userName") || "",
            "email": sessionStorage.getItem("userEmail") || ""
        },
        "theme": { "color": "#6366f1" }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

async function recordPurchase(paymentId) {
    try {
        const userEmail = sessionStorage.getItem("userEmail") || "guest@volt.com";
        const userName = sessionStorage.getItem("userName") || "Guest User";

        // 1. Log detailed sale
        await addDoc(collection(db, "sales"), {
            userName: userName,
            userEmail: userEmail,
            model: selectedModelData.model,
            brand: selectedBrand,
            category: selectedCategory,
            amount: (selectedModelData.price - selectedModelData.subsidy),
            paymentId: paymentId,
            timestamp: serverTimestamp()
        });

        // 2. Increment global counter (The "count how many users are buying" requirement)
        const statsRef = doc(db, "site_stats", "dashboard");
        await updateDoc(statsRef, {
            totalSalesCount: increment(1),
            totalRevenue: increment(selectedModelData.price - selectedModelData.subsidy)
        });

        const statusText = document.getElementById('payment-status-text');
        statusText.innerText = "PURCHASE SUCCESSFUL! REDIRECTING...";
        statusText.classList.remove('text-primary');
        statusText.classList.add('text-success');

        setTimeout(() => {
            window.location.href = 'user-dashboard.html';
        }, 2000);

    } catch (err) {
        console.error("Sales Error:", err);
        alert("Payment recorded but database update failed. Our team will contact you.");
    }
}
