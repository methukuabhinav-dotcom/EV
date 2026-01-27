fetch("EV_Dataset_Cleaned.json")
  .then(res => res.text())
  .then(csv => {
    const rows = csv.split("\n").slice(1);

    let totalSales = 0;
    let totalPrice = 0;
    let count = 0;
    let yearSales = {};

    rows.forEach(row => {
      const cols = row.split(",");

      const units = Number(cols[1]);
      const price = Number(cols[2]);
      const year = cols[5];

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
