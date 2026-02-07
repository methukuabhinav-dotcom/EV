let evData = [];
let selectedCategory = "";
let selectedBrand = "";
let selectedModel = null;

// Load Data
fetch("ev_vehicle_with_extra_10000.json")
    .then(res => res.json())
    .then(data => {
        evData = Array.isArray(data) ? data : data.data;
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
function loadBrands(category) {
    const brandContainer = document.getElementById("brandContainer");
    brandContainer.innerHTML = ""; // Clear previous

    // Filter logic
    const filtered = evData.filter(d => {
        const cat = d.Vehicle_Category;
        if (category === "Car") return ["Sedan", "SUV", "Hatchback"].includes(cat);
        if (category === "Bike") return ["Bike", "Scooter"].includes(cat);
        if (category === "Auto") return cat === "Fleet Van";
        return cat === category;
    });

    const brands = [...new Set(filtered.map(d => d.Brand))];

    if (brands.length === 0) {
        brandContainer.innerHTML = "<p class='text-center text-muted col-12'>No brands available for this category.</p>";
        return;
    }

    // Render Brand Cards
    brands.forEach(b => {
        const col = document.createElement("div");
        col.className = "col-md-3 col-6";
        col.innerHTML = `
      <div class="brand-card option-card p-3" onclick="selectBrand(this, '${b}')">
        <h5>${b}</h5>
        <small class="text-primary">View Models</small>
      </div>
    `;
        brandContainer.appendChild(col);
    });

    // Store filtered data globally for next step
    window.currentFilteredData = filtered;
}

function selectBrand(cardElement, brand) {
    // Highlight selected
    document.querySelectorAll(".brand-card").forEach(el => {
        el.style.borderColor = "#eee";
        el.style.backgroundColor = "white";
    });
    const card = cardElement; // Passed directly
    card.style.borderColor = "#6a5cff";
    card.style.backgroundColor = "#f0f4ff";

    selectedBrand = brand;
    loadModels(brand);
}

function loadModels(brand) {
    const modelSelect = document.getElementById("modelSelect");
    modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
    modelSelect.disabled = false;

    const models = window.currentFilteredData.filter(d => d.Brand === brand);
    const uniqueModels = [...new Set(models.map(d => d.Model))];

    uniqueModels.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.innerText = m;
        modelSelect.appendChild(opt);
    });



    modelSelect.onchange = () => {
        const modelName = modelSelect.value;
        selectedModel = models.find(d => d.Model === modelName);

        // Show Specs Preview immediately
        const preview = document.getElementById("specsPreview");
        preview.style.display = "block";

        // Populate data
        document.getElementById("prev-battery").innerText = selectedModel.Battery_Capacity_kWh + " kWh";
        document.getElementById("prev-range").innerText = selectedModel.Driving_Range_km + " km";
        document.getElementById("prev-charge").innerText = selectedModel.Charging_Time_Hours + " hrs";

        // Price
        let price = Number(selectedModel.Vehicle_Price);
        let subsidy = Number(selectedModel.Government_Subsidy_Amount);
        document.getElementById("prev-price").innerText = "₹" + price.toLocaleString();
        document.getElementById("prev-subsidy").innerText = "- ₹" + subsidy.toLocaleString();
        document.getElementById("prev-net").innerText = "₹" + (price - subsidy).toLocaleString();

        // Enable button to proceed
        document.getElementById("viewSpecsBtn").disabled = false;
        document.getElementById("viewSpecsBtn").innerText = "Proceed to Buy";
        document.getElementById("viewSpecsBtn").onclick = () => showSpecs();
    };
}

// Step 3: Specs
function showSpecs() {
    if (!selectedModel) return;

    document.getElementById("displayModel").innerText = selectedModel.Brand + " " + selectedModel.Model;

    // Format Price
    let price = Number(selectedModel.Vehicle_Price);
    document.getElementById("displayPrice").innerText = "₹" + price.toLocaleString();

    let subsidy = Number(selectedModel.Government_Subsidy_Amount);
    document.getElementById("displaySubsidy").innerText = "₹" + subsidy.toLocaleString();

    let netPrice = price - subsidy;
    document.getElementById("displayNetPrice").innerText = "₹" + netPrice.toLocaleString();

    document.getElementById("specRange").innerText = selectedModel.Driving_Range_km + " km";
    document.getElementById("specBattery").innerText = selectedModel.Battery_Capacity_kWh + " kWh";
    document.getElementById("specCharge").innerText = selectedModel.Charging_Time_Hours + " hrs";

    goToStep(3);
}

// Step 4: Payment
function processPayment() {
    const btn = document.querySelector("#step-4 .btn-primary");
    btn.innerText = "Processing...";
    btn.disabled = true;

    // Generate Dummy Transaction Details
    const txId = "TXN" + Math.floor(Math.random() * 100000000);
    const date = new Date().toLocaleString();

    setTimeout(() => {
        alert(`Payment Successful!\n\nTransaction ID: ${txId}\nStatus: Completed\nDate: ${date}`);

        // Save Purchase to LocalStorage (Dummy)
        const purchase = {
            model: selectedModel.Model,
            brand: selectedModel.Brand,
            price: document.getElementById("displayNetPrice").innerText,
            txId: txId,
            date: date
        };
        localStorage.setItem("lastPurchase", JSON.stringify(purchase));

        window.location.href = "user-dashboard.html";
    }, 2000);
}
