
import requests
import json

url = 'http://127.0.0.1:5000/predict_value'

data = {
    "brand": "Tesla",
    "model": "Model 3",
    "vehicle_type": "Car",
    "initial_battery_capacity_kwh": 75.0,
    "current_battery_capacity_kwh": 70.0,
    "battery_health_pct": 93.3,
    "range_km": 450.0,
    "top_speed_kmph": 225.0,
    "odometer_km": 30000.0,
    "warranty_remaining_years": 4.5,
    "annual_maintenance_cost": 5000.0,
    "Purchase_Year": 2022,
    "Current_Year": 2025,
    "Purchase_Price_L": 45.0,
    "Initial_Mileage": 150.0,
    "Current_Mileage": 140.0,
    "Initial_Perf": 9.0,
    "Current_Perf": 8.5,
    "Resale_Value_L": 30.0
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
