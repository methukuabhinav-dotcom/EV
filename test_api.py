import requests
import json

url = 'http://127.0.0.1:5000/predict_health'

# Sample data representing a "Moderate" or "Healthy" battery
data = {
    'vehicle_age_years': 3,
    'total_charge_cycles': 500,
    'avg_depth_of_discharge_percent': 60,
    'avg_charging_time_hours': 4,
    'fast_charging_frequency_percent': 20,
    'avg_battery_temperature_c': 30,
    'max_battery_temperature_c': 40,
    'avg_voltage': 350,
    'internal_resistance_mohm': 25,
    'capacity_retention_percent': 85
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        print("Success!")
        print("Response:", json.dumps(response.json(), indent=2))
    else:
        print(f"Failed with status code: {response.status_code}")
        print("Response:", response.text)
except Exception as e:
    print(f"Error: {e}")
    print("Make sure the backend/main.py server is running!")
