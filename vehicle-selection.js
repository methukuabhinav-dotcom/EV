let evData = [];
let selectedCategory = "";
let selectedBrand = "";
let selectedModel = null;

// Load Data
// Load Data
fetch("EV_Vehicles_Data_Updated.json")
    .then(res => res.json())
    .then(data => {
        // Direct array in this file
        evData = data.filter(d => !['Tesla', 'Hyundai'].includes(d.Brand));
        console.log("Data loaded:", evData.length);
    });

// Navigation
function goToStep(step) {
    document.querySelectorAll(".step-container").forEach(el => el.classList.remove("active"));
    document.getElementById(`step-${step}`).classList.add("active");
}

// Step 1: Category
function selectCategory(category) {
    selectedCategory = category;
    loadBrands(category);
    goToStep(2);
}

// Data Handling
// Data Handling
// Data Handling
function loadBrands(category) {
    // HTML uses 'brandPills'
    const brandContainer = document.getElementById("brandPills");
    if (!brandContainer) return;

    brandContainer.innerHTML = ""; // Clear previous

    // Filter logic
    const filtered = evData.filter(d => {
        const cat = (d.Vehicle_Category || "").toLowerCase();
        if (category === "Car") return ["sedan", "suv", "hatchback"].includes(cat);
        if (category === "Bike") return cat === "bike";
        if (category === "Scooter") return cat === "scooter";

        return false;
    });

    const brands = [...new Set(filtered.map(d => d.Brand))];

    if (brands.length === 0) {
        brandContainer.innerHTML = "<p class='text-center text-muted col-12'>No brands available for this category.</p>";
        return;
    }

    // Render Brand Pills
    brands.forEach(b => {
        const pill = document.createElement("div");
        pill.className = "brand-pill";
        pill.innerText = b;
        pill.onclick = function () { selectBrand(this, b); };
        brandContainer.appendChild(pill);
    });

    // Store filtered data globally for next step
    window.currentFilteredData = filtered;
}

function selectBrand(cardElement, brand) {
    // Highlight selected
    document.querySelectorAll(".brand-pill").forEach(el => {
        el.classList.remove("active");
    });
    cardElement.classList.add("active");

    selectedBrand = brand;
    loadModels(brand);
}

function loadModels(brand) {
    const modelContainer = document.getElementById("modelContainer");
    const modelCards = document.getElementById("modelCards");

    // Show container
    modelContainer.style.display = "block";
    modelCards.innerHTML = "";

    const models = window.currentFilteredData.filter(d => d.Brand === brand);

    // In many cases, JSON has duplicates if it lists sales per year/region. 
    // We should show unique models OR all variants. 
    // Let's deduce uniqueness by Model Name + Battery Capacity to distinguish variants.
    const uniqueModels = [];
    const seen = new Set();

    models.forEach(m => {
        const key = m.Model + "-" + m.Battery_Capacity_kWh;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueModels.push(m);
        }
    });

    if (uniqueModels.length === 0) {
        modelCards.innerHTML = "<p>No specific models found.</p>";
        return;
    }

    uniqueModels.forEach(m => {
        const col = document.createElement("div");
        col.className = "col-md-4";

        // Calculate effective price
        const price = Number(m.Price_INR) || 0;
        const subsidy = Number(m.Subsidy_Amount_INR) || 0;
        const net = price - subsidy;

        // Image Mapping
        const imageMap = {
            "Ather 450S": "Ather 450S.avif",
            "Ather 450X": "Ather 450X.avif",
            "Atto 3": "Atto 3.avif",
            "BYD Seal": "BYD Seal.avif",
            "Comet EV": "Comet EV.jpg",
            "Nexon EV Max": "Nexon EV Max.avif",
            "Nexon EV Prime": "Nexon EV Prime.avif",
            "Ola S1 Air": "Ola S1 Air.avif",
            "Ola S1 Pro": "Ola S1 Pro.webp",
            "Ola S1 X": "Ola S1 X.avif",
            "Punch EV": "Punch EV.avif",
            "RV300": "RV300.avif",
            "RV400": "RV400.avif",
            "Tiago EV": "Tiago EV.avif",
            "Tigor EV": "Tigor EV.webp",
            "XUV400 EV": "XUV400 EV.jpg",
            "XUV400 Pro": "XUV400 Pro.cms",
            "ZS EV": "ZS EV.avif",
            "e6": "e6.avif",
            "iQube": "iQube.jpg",
            "iQube ST": "iQube ST.avif"
        };

        // Image Resolution
        const imgFile = imageMap[m.Model];
        const imgUrl = imgFile ? `assets/${imgFile}` : `https://placehold.co/600x400?text=${encodeURIComponent(m.Model)}`;

        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0" onclick="selectModel('${m.Model}', '${m.Battery_Capacity_kWh}')" style="cursor:pointer; transition:0.3s; overflow:hidden;">
                <img src="${imgUrl}" class="card-img-top" alt="${m.Model}" style="height:200px; object-fit:cover;">
                <div class="card-body">
                    <h5 class="fw-bold mb-1">${m.Model}</h5>
                    <small class="text-muted">${m.Vehicle_Category}</small>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="badge bg-light text-dark border">🔋 ${m.Battery_Capacity_kWh} kWh</span>
                        <span class="badge bg-light text-dark border">🛣️ ${m.Range_km} km</span>
                    </div>

                    <hr>
                    
                    <div class="d-flex justify-content-between align-items-end">
                        <div class="text-start">
                           <small class="text-muted text-decoration-line-through">₹${(price / 100000).toFixed(2)}L</small>
                           <h5 class="fw-bold text-primary mb-0">₹${(net / 100000).toFixed(2)} Lakhs</h5>
                        </div>
                        <button class="btn btn-outline-primary btn-sm rounded-pill">View >></button>
                    </div>
                </div>
            </div>
        `;
        modelCards.appendChild(col);
    });
}

// Global scope function for onclick
window.selectModel = function (modelName, battery) {
    const models = window.currentFilteredData;
    // Find specific variant
    selectedModel = models.find(d => d.Model === modelName && String(d.Battery_Capacity_kWh) === String(battery));

    if (selectedModel) showSpecs();
};

// Helper to expose functions to window
window.handleCategory = selectCategory;
window.goToStep = goToStep;

// Step 1: Category
function selectCategory(category) {
    selectedCategory = category;
    loadBrands(category);

    // Highlight HTML elements if needed, but mainly go to step 2
    goToStep(2);
}

// ... (loadBrands and selectBrand seem distinct in HTML structure vs JS, but loadBrands logic handles #brandContainer)
// Note: HTML uses #brandPills not #brandContainer. 
// Step 89 HTML Line 294: <div id="brandPills" ...>
// JS Line 31: const brandContainer = document.getElementById("brandContainer");
// Mismatch!

// Let's fix loadBrands internal reference too.

// ...

// Step 3: Specs (Updated IDs)
function showSpecs() {
    if (!selectedModel) return;

    // Helper safely set text
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setText("v-model-name", selectedModel.Model);
    setText("v-brand-name", selectedModel.Brand);

    // Set Image
    const imgEl = document.getElementById("v-image");
    if (imgEl) {
        imgEl.src = `https://placehold.co/600x400?text=${encodeURIComponent(selectedModel.Model)}`;
    }

    // Format Price
    let price = Number(selectedModel.Price_INR) || 0;
    let subsidy = Number(selectedModel.Subsidy_Amount_INR) || 0;
    let netPrice = price - subsidy;

    setText("v-net-price", "₹" + netPrice.toLocaleString());
    setText("v-orig-price", "₹" + price.toLocaleString());

    setText("s-range", (selectedModel.Range_km || "-") + " km");
    setText("s-battery", (selectedModel.Battery_Capacity_kWh || "-") + " kWh");
    setText("s-charge", (selectedModel.Charging_Time_Hours || "-") + " hrs");
    setText("s-speed", (selectedModel.Top_Speed_kmph || "-") + " km/h");

    // Features injection
    const featsContainer = document.getElementById("v-features");
    if (featsContainer) {
        featsContainer.innerHTML = "";
        const feats = [
            // selectedModel.Seating_Capacity + " Seater", // Not in new JSON
            // selectedModel.Braking_System, // Not in new JSON
            // "Boot: " + selectedModel.Boot_Space_Litres + "L", // Not in new JSON
            // "Warranty: " + selectedModel.Battery_Warranty_Years + " Years" // Not in new JSON
            "Top Speed: " + selectedModel.Top_Speed_kmph + " km/h",
            "Range: " + selectedModel.Range_km + " km"
        ];
        feats.forEach(f => {
            if (f && !f.includes("undefined")) {
                const tag = document.createElement("span");
                tag.className = "feature-tag";
                tag.innerText = f;
                featsContainer.appendChild(tag);
            }
        });
    }

    // Savings Calc Init
    if (window.updateCalculator) window.updateCalculator();

    goToStep(3);
}

// Step 4: Buy / Init Purchase
window.initPurchase = function () {
    goToStep(4);
    processPayment();
};

function processPayment() {
    const statusText = document.getElementById("payment-status-text");
    if (statusText) statusText.innerText = "Processing Payment via Razorpay...";

    // Generate Dummy Transaction Details
    const txId = "TXN" + Math.floor(Math.random() * 100000000);
    const date = new Date().toLocaleString();

    setTimeout(() => {
        if (statusText) statusText.innerText = "Payment Successful!";

        alert(`Payment Successful!\n\nTransaction ID: ${txId}\nStatus: Completed\nDate: ${date}`);

        // Save Purchase to LocalStorage (Dummy)
        const purchase = {
            model: selectedModel.Model,
            brand: selectedModel.Brand,
            price: document.getElementById("v-net-price") ? document.getElementById("v-net-price").innerText : "0",
            txId: txId,
            date: date
        };
        localStorage.setItem("lastPurchase", JSON.stringify(purchase));

        window.location.href = "user-dashboard.html";
    }, 2500);
}
