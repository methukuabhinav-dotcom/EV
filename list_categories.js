const fs = require('fs');
const data = JSON.parse(fs.readFileSync('EV_Vehicles_Data_Updated.json', 'utf8'));
const categories = [...new Set(data.map(d => d.Vehicle_Category))];
console.log(categories);
