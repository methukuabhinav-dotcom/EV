fetch("ev_vehicle_with_extra_10000.json")
  .then(res => res.json())
  .then(data => {
    // Ensure we have an array (handle if wrapped in { data: [...] })
    const rows = Array.isArray(data) ? data : data.data;

    let totalSales = 0;
    let totalPrice = 0;
    let count = 0;
    let yearSales = {};

    rows.forEach(row => {
      const units = Number(row.Units_Sold_Per_Year);
      const price = Number(row.Vehicle_Price);
      const year = row.Purchase_Year;

      if (!isNaN(units)) {
        totalSales += units;
        totalPrice += price;
        count++;

        yearSales[year] = (yearSales[year] || 0) + units;
      }
    });

    document.getElementById("totalSales").innerText = totalSales;
    document.getElementById("avgPrice").innerText =
      Math.round(totalPrice / count);

    new Chart(document.getElementById("salesChart"), {
      type: "line",
      data: {
        labels: Object.keys(yearSales),
        datasets: [{
          label: "EV Sales",
          data: Object.values(yearSales),
          borderColor: "blue",
          borderWidth: 3
        }]
      }
    });
  });
