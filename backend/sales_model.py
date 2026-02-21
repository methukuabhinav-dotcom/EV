
import os
import pickle
import pandas as pd
import numpy as np
import statsmodels.api as sm

class SalesModel:
    def __init__(self, model_path):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                print(f"Sales Model loaded successfully from {self.model_path}")
            except Exception as e:
                print(f"Error loading Sales Model: {e}")
        else:
            print(f"Sales Model file not found at {self.model_path}")

    def get_forecast(self, steps=12, granularity='monthly'):
        if self.model is None:
            raise ValueError("Sales Model is not loaded.")
        
        try:
            # Adjust steps if yearly (assuming steps means 'number of years' in that case)
            model_steps = steps * 12 if granularity == 'yearly' else steps

            # Get forecast
            forecast_result = self.model.get_forecast(steps=model_steps)
            predicted_mean = forecast_result.predicted_mean
            conf_int = forecast_result.conf_int()
            
            # Aggregate if yearly
            if granularity == 'yearly':
                # Resample to Annual Sum
                # Using 'A' for Annual (calendar year end)
                predicted_mean = predicted_mean.resample('A').sum()
                conf_int = conf_int.resample('A').sum()
                
                # Format dates as Year only
                dates = predicted_mean.index.strftime('%Y').tolist()
            else:
                dates = predicted_mean.index.strftime('%Y-%m-%d').tolist()

            # Prepare result dictionary
            values = predicted_mean.values.tolist()
            lower_ci = conf_int.iloc[:, 0].values.tolist()
            upper_ci = conf_int.iloc[:, 1].values.tolist()
            
            return {
                'dates': dates,
                'values': values,
                'lower_ci': lower_ci,
                'upper_ci': upper_ci
            }
        except Exception as e:
            raise ValueError(f"Forecasting error: {str(e)}")
