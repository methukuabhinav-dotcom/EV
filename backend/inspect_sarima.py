
import pickle
import os
import sys
import pandas as pd

# Add backend to path to ensure any custom classes are found if needed
# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
# Data file path
model_path = os.path.join(script_dir, 'sarima_monthly_ev_sales.pkl')

try:
    print(f"Loading model from: {model_path}")
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"Model Type: {type(model)}")
    try:
        print(model.summary())
    except:
        print("No summary method")
        
    # Try forecasting
    try:
        forecast = model.get_forecast(steps=12)
        print("Forecast (12 steps):")
        print(forecast.predicted_mean)
        # print("Conf Int:")
        # print(forecast.conf_int())
    except Exception as e:
        print(f"Forecast failed: {e}")

except Exception as e:
    print(f"Error loading pickle: {e}")
