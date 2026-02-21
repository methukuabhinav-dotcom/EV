
import os
import pickle
import traceback
import numpy as np
import pandas as pd
import xgboost

class ValueModel:
    def __init__(self, model_path):
        self.model_path = model_path
        self.model = None
        self.feature_names = None
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                if hasattr(self.model, 'feature_names_in_'):
                    self.feature_names = self.model.feature_names_in_
                else:
                    print("Warning: Model does not have feature_names_in_ attribute.")
                
                print(f"Value Model loaded successfully from {self.model_path}")
            except Exception as e:
                traceback.print_exc()
                print(f"Error loading Value Model: {e}")
        else:
            print(f"Value Model file not found at {self.model_path}")

    def preprocess(self, data):
        """
        Preprocess input data to match model features.
        """
        try:
            # Extract raw inputs
            # Categorical
            brand = data.get('brand', '')
            model_name = data.get('model', '')
            vehicle_type = data.get('vehicle_type', 'Car')
            
            # Numerical
            initial_capacity = float(data.get('initial_battery_capacity_kwh', 0))
            current_capacity = float(data.get('current_battery_capacity_kwh', 0))
            battery_health = float(data.get('battery_health_pct', 0))
            range_km = float(data.get('range_km', 0))
            top_speed = float(data.get('top_speed_kmph', 0))
            odometer = float(data.get('odometer_km', 0))
            warranty = float(data.get('warranty_remaining_years', 0))
            maintenance_cost = float(data.get('annual_maintenance_cost', 0))
            purchase_year = int(data.get('Purchase_Year', 2020))
            current_year = int(data.get('Current_Year', 2025))
            purchase_price = float(data.get('Purchase_Price_L', 0))
            initial_mileage = float(data.get('Initial_Mileage', 0))
            current_mileage = float(data.get('Current_Mileage', 0))
            initial_perf = float(data.get('Initial_Perf', 0))
            current_perf = float(data.get('Current_Perf', 0))
            resale_value = float(data.get('Resale_Value_L', 0))

            # Derived Features
            vehicle_age = current_year - purchase_year
            
            if initial_capacity > 0:
                battery_loss_pct = ((initial_capacity - current_capacity) / initial_capacity) * 100
            else:
                battery_loss_pct = 0
            
            performance_drop = initial_perf - current_perf
            
            if current_capacity > 0:
                battery_efficiency = range_km / current_capacity
            else:
                battery_efficiency = 0

            # Create a dictionary with all base numerical features
            input_dict = {
                'initial_battery_capacity_kwh': initial_capacity,
                'current_battery_capacity_kwh': current_capacity,
                'battery_health_pct': battery_health,
                'range_km': range_km,
                'top_speed_kmph': top_speed,
                'odometer_km': odometer,
                'warranty_remaining_years': warranty,
                'annual_maintenance_cost': maintenance_cost,
                'Purchase_Year': purchase_year,
                'Current_Year': current_year,
                'Purchase_Price_L': purchase_price,
                'Initial_Mileage': initial_mileage,
                'Current_Mileage': current_mileage,
                'Initial_Perf': initial_perf,
                'Current_Perf': current_perf,
                'Resale_Value_L': resale_value,
                # Derived
                'vehicle_age': vehicle_age,
                'battery_loss_pct': battery_loss_pct,
                'performance_drop': performance_drop,
                'battery_efficiency': battery_efficiency
            }

            # Handle One-Hot Encoding
            # We need to construct the DataFrame with exact columns as self.feature_names
            if self.feature_names is None:
                 raise ValueError("Model feature names not available.")

            # Initialize all features to 0.0 with explicit float64 dtype
            # This is required for XGBoost to accept the DataFrame without dtype errors
            final_input = pd.DataFrame(
                np.zeros((1, len(self.feature_names)), dtype=np.float64),
                columns=self.feature_names
            )

            # Fill numerical features
            for col in input_dict:
                if col in final_input.columns:
                    final_input[col] = float(input_dict[col])

            # Set One-Hot Encoded features
            # Format: 'brand_BrandName', 'model_ModelName', 'vehicle_type_Type'
            brand_col = f"brand_{brand}"
            if brand_col in final_input.columns:
                final_input.loc[0, brand_col] = 1
            
            model_col = f"model_{model_name}"
            if model_col in final_input.columns:
                final_input.loc[0, model_col] = 1
                
            type_col = f"vehicle_type_{vehicle_type}"
            if type_col in final_input.columns:
                final_input.loc[0, type_col] = 1
            
            return final_input

        except Exception as e:
            traceback.print_exc()
            raise ValueError(f"Preprocessing error: {str(e)}")

    def predict(self, data):
        if self.model is None:
            raise ValueError("Value Model is not loaded.")
        
        processed_data = self.preprocess(data)
        prediction = self.model.predict(processed_data)[0]
        return float(prediction)

    def analyze(self, data):
        """
        Predict score and generate insights based on specific logic.
        """
        import random
        
        score = self.predict(data)
        
        # Raw inputs for logic
        battery_health_pct = float(data.get('battery_health_pct', 0))
        odometer_km = float(data.get('odometer_km', 0))
        warranty_remaining_years = float(data.get('warranty_remaining_years', 0))
        purchase_year = int(data.get('Purchase_Year', 2020))
        current_year = int(data.get('Current_Year', 2025))
        resale_value = float(data.get('Resale_Value_L', 0))
        purchase_price = float(data.get('Purchase_Price_L', 0))
        
        age = current_year - purchase_year
        recommendation = ""
        insights = []
        price_range = None

        if resale_value > purchase_price:
            recommendation = "Overpriced"
            low_price = purchase_price * 0.50
            high_price = purchase_price * 0.70
            price_range = f"₹{round(low_price):,} - ₹{round(high_price):,}"
            insights.append(f"⚠️ The resale value exceeds the purchase price, indicating the vehicle is overpriced.")
            insights.append("Consider negotiation or look for better deals.")
        else:
            if score > 1.0:
                recommendation = "Excellent Price"
            elif score >= 0.9:
                recommendation = "Fair Price"
            else:
                recommendation = "Overpriced"

            # Insight Generation
            if recommendation == "Excellent Price":
                reasons = []
                if battery_health_pct >= 90:
                    reasons.append(f"battery health at {battery_health_pct}%")
                if warranty_remaining_years >= 5:
                    reasons.append(f"{int(warranty_remaining_years)} years warranty remaining")
                if odometer_km < 40000:
                    reasons.append(f"only {int(odometer_km):,} km driven")
                if age <= 2:
                    reasons.append(f"a relatively new {purchase_year} model")
            
                if reasons:
                    chosen = random.sample(reasons, min(len(reasons), 3))
    
                    if len(chosen) > 1:
                        reason_text = ", ".join(chosen[:-1]) + " and " + chosen[-1]
                    else:
                        reason_text = chosen[0]
    
                    insights.append(f"✅ The vehicle delivers exceptional value with {reason_text}.")
                else:
                    insights.append("✅ The vehicle is priced significantly below market value, offering a great deal.")

            elif recommendation == "Fair Price":
                reasons = [
                    f"battery health at {battery_health_pct}%",
                    f"{int(odometer_km):,} km usage",
                    f"{int(warranty_remaining_years)} years warranty left",
                    f"{age} years vehicle age"
                ]
                # Ensure we don't sample more than available, though list is fixed size 4
                chosen = random.sample(reasons, min(len(reasons), 3))

                if len(chosen) > 1:
                    reason_text = ", ".join(chosen[:-1]) + " and " + chosen[-1]
                else:
                    reason_text = chosen[0]

                insights.append(f"👍 The pricing is reasonable considering {reason_text}.")
            else:  # Overpriced (score-based)
                reasons = []
    
                if battery_health_pct < 80:
                    reasons.append("battery wear over time")
                if odometer_km > 80000:
                    reasons.append("higher accumulated mileage")
                if warranty_remaining_years <= 1:
                    reasons.append("limited remaining warranty")
                if age >= 6:
                    reasons.append("age-related depreciation")
    
                if not reasons:
                    reasons = ["overall market depreciation factors"]
    
                # Select up to 3 reasons
                chosen = random.sample(reasons, min(len(reasons), 3))
    
                # Make sentence read naturally
                if len(chosen) > 1:
                    reason_text = ", ".join(chosen[:-1]) + " and " + chosen[-1]
                else:
                    reason_text = chosen[0]
    
                insights.append(f"The vehicle appears overpriced mainly due to {reason_text}.")

                # Suggested Market Price (60–80% of resale)
                low_price = resale_value * 0.60
                high_price = resale_value * 0.80
            
                price_range = f"₹{round(low_price):,} - ₹{round(high_price):,}"
                insights.append("Consider negotiation or look for better deals.")

        return {
            'score': score,
            'recommendation': recommendation,
            'insights': insights,
            'fair_price_range': price_range
        }
