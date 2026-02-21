
import requests
import json

url = "http://127.0.0.1:5000/predict_value"

# 1. Test Excellent Case
data_excellent = {
    "brand": "Tata",
    "model": "Nexon EV",
    "vehicle_type": "Car",
    "initial_battery_capacity_kwh": 30.2,
    "current_battery_capacity_kwh": 29.5,
    "battery_health_pct": 98.0,
    "range_km": 300,
    "top_speed_kmph": 120,
    "odometer_km": 15000,
    "warranty_remaining_years": 6,
    "annual_maintenance_cost": 5000,
    "Purchase_Year": 2024,
    "Current_Year": 2025,
    "Purchase_Price_L": 15.0,
    "Resale_Value_L": 18.0, # Intentional high resale to get high score
    "Initial_Mileage": 100,
    "Current_Mileage": 90,
    "Initial_Perf": 9.0,
    "Current_Perf": 8.8
}

try:
    print("Testing Excellent Case...")
    res = requests.post(url, json=data_excellent)
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
except Exception as e:
    print("Error:", e)

print("-" * 30)

# 2. Test Low Case
data_low = {
    "brand": "Tata",
    "model": "Nexon EV",
    "vehicle_type": "Car",
    "initial_battery_capacity_kwh": 30.2,
    "current_battery_capacity_kwh": 20.0,
    "battery_health_pct": 65.0, # Low health
    "range_km": 180,
    "top_speed_kmph": 120,
    "odometer_km": 95000, # High odometer
    "warranty_remaining_years": 0.5, # Low warranty
    "annual_maintenance_cost": 15000,
    "Purchase_Year": 2018,
    "Current_Year": 2025,
    "Purchase_Price_L": 15.0,
    "Resale_Value_L": 14.0, # High asking price for bad condition
    "Initial_Mileage": 100,
    "Current_Mileage": 70,
    "Initial_Perf": 9.0,
    "Current_Perf": 6.0
}

try:
    print("\nTesting Low Case...")
    res = requests.post(url, json=data_low)
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
except Exception as e:
    print("Error:", e)
