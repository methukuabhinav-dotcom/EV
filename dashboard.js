
alert("dashboard.js loaded");


fetch("ev_vehicle_with_extra_10000.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("JSON file not found");
    }
    return response.json();
  })
  .then(data => {
    console.log("JSON Loaded", data);

    /* ===============================
       DASHBOARD CALCULATIONS
    =============================== */

    // Total savings (example: subsidy sum)
    const totalSavings = data.reduce(
      (sum, ev) => sum + (ev.Government_Subsidy_Amount || 0),
      0
    );

    // Total CO2 saved
    const totalCO2 = data.reduce(
      (sum, ev) => sum + (ev.CO2_Emissions_Saved_kg || 0),
      0
    );

    // Total distance (driving range sum)
    const totalDistance = data.reduce(
      (sum, ev) => sum + (ev.Driving_Range_km || 0),
      0
    );

    // Battery health (simulated average)
    const avgBatteryHealth = Math.floor(
      data.reduce((sum, ev) => sum + (ev.Battery_Health_Percentage || 85), 0) /
      data.length
    );

    /* ===============================
       UPDATE UI
    =============================== */

    document.getElementById("savings").innerText =
      totalSavings.toLocaleString("en-IN");

    document.getElementById("co2").innerText =
      totalCO2.toLocaleString();

    document.getElementById("distance").innerText =
      totalDistance.toLocaleString();

    document.getElementById("battery").innerText =
      avgBatteryHealth;

    /* ===============================
       CHART.JS – DISTANCE USAGE
    =============================== */

    const labels = data.slice(0, 10).map(ev => ev.Vehicle_ID);
    const distances = data.slice(0, 10).map(ev => ev.Driving_Range_km);

    const ctx = document.getElementById("distanceChart").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Driving Range (km)",
          data: distances
        }]
      },
      options: {
        responsive: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

  })
  .catch(error => {
    console.error("Dashboard Error:", error);
  });
