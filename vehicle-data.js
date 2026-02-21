/**
 * REAL-TIME EV DATA (2024-2025)
 * Sources: Industry reports, manufacturer sites.
 */

/**
 * REAL-TIME EV DATA (Dynamic Fetch)
 * Sources: ev_vehicle_with_extra_10000.json
 */

export async function fetchEVData() {
    try {
        const response = await fetch('backend-data/EV_Vehicles_Data_Updated.json');
        const rawList = await response.json(); // It's a direct array in this file

        // Structure to match original EV_DATA format
        // { Category: { brands: { BrandName: [Models...] } } }
        const structuredData = {
            Car: { brands: {} },
            Bike: { brands: {} },
            Scooter: { brands: {} }
        };

        // Image Mapping (Model Name -> Filename)
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

        rawList.forEach(item => {
            // 1. Filter out Tesla/Hyundai (Not present in this file but good safety)
            if (['Tesla', 'Hyundai'].includes(item.Brand)) return;

            // 2. Determine Main Category
            let mainCat = null;
            const c = (item.Vehicle_Category || "").toLowerCase();

            if (['sedan', 'suv', 'hatchback'].includes(c)) mainCat = 'Car';
            else if (c === 'bike') mainCat = 'Bike';
            else if (c === 'scooter') mainCat = 'Scooter';

            if (!mainCat) return;

            // 3. Initialize Brand Array if needed
            if (!structuredData[mainCat].brands[item.Brand]) {
                structuredData[mainCat].brands[item.Brand] = [];
            }

            // 4. Map Fields (New JSON Keys)
            const imgFile = imageMap[item.Model];
            const imgSrc = imgFile ? `assets/${imgFile}` : `https://placehold.co/600x400?text=${encodeURIComponent(item.Model)}`;

            const modelObj = {
                model: item.Model,
                image: imgSrc,
                price: Number(item.Price_INR) || 0,
                subsidy: Number(item.Subsidy_Amount_INR) || 0,
                range: Number(item.Range_km) || 0,
                battery: Number(item.Battery_Capacity_kWh) || 0,
                charging: Number(item.Charging_Time_Hours) || 0,
                speed: Number(item.Top_Speed_kmph) || 0,
                // Construct features string since new JSON lacks it
                features: `Top Speed: ${item.Top_Speed_kmph} km/h, Range: ${item.Range_km} km`
            };

            structuredData[mainCat].brands[item.Brand].push(modelObj);
        });

        return structuredData;

    } catch (error) {
        console.error("Failed to load EV Data:", error);
        return {};
    }
}
