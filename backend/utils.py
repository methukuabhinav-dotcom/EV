import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# Paths relative to backend directory
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
# Dataset path is two levels up and in backend-data
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend-data', 'dataset.json')

def load_model_and_encoder():
    model = None
    label_encoder = None
    
    # Load Model
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            print(f"Model loaded successfully from {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Model file not found at {MODEL_PATH}")

    # Re-create Label Encoder from CSV/JSON
    if os.path.exists(DATA_PATH):
        try:
            # Try reading as CSV first since we copied it, but if it fails try JSON
            # The file extension is .json but content is CSV based on my previous command
            # But pandas read_csv can read it if format is csv
            try:
                df = pd.read_csv(DATA_PATH)
            except:
                df = pd.read_json(DATA_PATH)
                
            le = LabelEncoder()
            le.fit(df['battery_health_status'])
            label_encoder = le
            print(f"Label Encoder created. Classes: {le.classes_}")
        except Exception as e:
            print(f"Error loading data for LabelEncoder: {e}")
    else:
        print(f"Dataset not found at {DATA_PATH}. Using default mapping.")
        label_encoder = LabelEncoder()
        label_encoder.classes_ = np.array(['Degraded', 'Healthy', 'Moderate'])
        
    return model, label_encoder

def preprocess_input(data):
    features = [
        'vehicle_age_years',
        'total_charge_cycles',
        'avg_depth_of_discharge_percent',
        'avg_charging_time_hours',
        'fast_charging_frequency_percent',
        'avg_battery_temperature_c',
        'max_battery_temperature_c',
        'avg_voltage',
        'internal_resistance_mohm',
        'capacity_retention_percent'
    ]
    
    input_data = []
    for feature in features:
        val = data.get(feature)
        if val is None:
            raise ValueError(f'Missing feature: {feature}')
        input_data.append(float(val))
        
    return np.array(input_data).reshape(1, -1)


# ==============================
# Recommendation Function
# ==============================

def get_recommendation(status):
    status = status.lower()

    if status == "healthy":
        return "Battery is in good condition. Continue normal usage."

    elif status == "moderate":
        return "Battery health is moderate. Avoid overcharging and monitor performance. And also try to replace the battery within 1 year. "

    elif status == "degraded":
        return "Battery health is poor. Replacement is needed, try to replace the battery within 6 months."

    else:
        return "No recommendation available."


# ==============================
# Dynamic Insight Generator
# ==============================

def generate_insight(status, vehicle_age, charge_cycles, max_temp,
                     fast_charging, capacity_retention, resistance):

    status = status.lower()

    if status == "healthy":
        return (f"With only {charge_cycles} charge cycles and stable temperature around "
                f"{max_temp}°C, the battery maintains strong capacity retention "
                f"at {capacity_retention}%, indicating minimal degradation.")

    elif status == "moderate":
        return (f"Increasing charge cycles ({charge_cycles}) and moderate thermal exposure "
                f"near {max_temp}°C are gradually impacting performance, with "
                f"capacity retention at {capacity_retention}%.")

    elif status == "degraded":
        return (f"High thermal stress above {max_temp}°C combined with excessive "
                f"{charge_cycles} charge cycles and reduced capacity retention "
                f"({capacity_retention}%) indicates advanced battery degradation.")

    else:
        return "No detailed insight available."


# ==============================
# Risk Level Function
# ==============================

def calculate_risk_level(capacity_retention, charge_cycles, max_temp):

    if capacity_retention > 90 and charge_cycles < 500 and max_temp < 40:
        return "LOW"

    elif 75 <= capacity_retention <= 90:
        return "MODERATE"

    else:
        return "HIGH"
