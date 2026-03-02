
import os
import pickle
import traceback
import numpy as np
import pandas as pd
import warnings

warnings.filterwarnings("ignore")


class ValueModel:
    """
    Dual GradientBoosting model for EV resale value analysis.

    Loaded from pkl bundles that contain:
        - 'model'    : trained GradientBoostingRegressor
        - 'features' : ordered feature list
        - 'le_brand' : fitted LabelEncoder for 'brand'
        - 'le_type'  : fitted LabelEncoder for 'vehicle_type'

    condition_model.pkl → predicts value_for_money_score × 100  (0–100 %)
    price_model.pkl     → predicts Resale_Value_L
    """

    def __init__(self, condition_model_path: str, price_model_path: str):
        self.condition_model_path = condition_model_path
        self.price_model_path     = price_model_path

        self.cond_model   = None
        self.price_model  = None
        self.cond_features  = []
        self.price_features = []
        self.le_brand     = None
        self.le_type      = None

        # public flag kept for legacy compat check in main.py
        self.model = True

        self._load_models()

    # ------------------------------------------------------------------ #
    #  Load                                                               #
    # ------------------------------------------------------------------ #
    def _load_models(self):
        for attr_m, attr_f, path, label in [
            ('cond_model',  'cond_features',  self.condition_model_path, "Condition"),
            ('price_model', 'price_features', self.price_model_path,     "Price"),
        ]:
            if not os.path.exists(path):
                print(f"[WARNING] {label} model not found: {path}")
                continue
            try:
                with open(path, "rb") as f:
                    bundle = pickle.load(f)

                if isinstance(bundle, dict):
                    setattr(self, attr_m, bundle.get("model"))
                    setattr(self, attr_f, bundle.get("features", []))
                    # Share encoders (both bundles carry the same encoders)
                    if self.le_brand is None:
                        self.le_brand = bundle.get("le_brand")
                        self.le_type  = bundle.get("le_type")
                    print(f"[OK] {label} model loaded — features: {bundle.get('features', [])}")
                else:
                    # Legacy: old numpy-array pkl files (feature-name lists)
                    # Fall back to formula-based approach
                    print(f"[INFO] {label} pkl is a legacy feature array; using formula fallback.")
                    setattr(self, attr_m, None)
                    setattr(self, attr_f, list(bundle) if hasattr(bundle, '__iter__') else [])

            except Exception as e:
                traceback.print_exc()
                print(f"[ERROR] {label} model: {e}")

    # ------------------------------------------------------------------ #
    #  Feature builder                                                    #
    # ------------------------------------------------------------------ #
    def _build_features(self, data: dict) -> pd.DataFrame:
        brand        = str(data.get("brand", ""))
        vehicle_type = str(data.get("vehicle_type", "Car"))
        purchase_year = int(data.get("Purchase_Year", 2020))
        current_year  = int(data.get("Current_Year", 2025))
        odometer      = float(data.get("odometer_km", 0))
        initial_mil   = float(data.get("Initial_Mileage", 0))
        current_mil   = float(data.get("Current_Mileage", 0))

        vehicle_age   = max(current_year - purchase_year, 0)
        usage_per_yr  = odometer / vehicle_age if vehicle_age > 0 else odometer
        mileage_drop  = initial_mil - current_mil

        # Encode brand and vehicle_type
        try:
            brand_enc = self.le_brand.transform([brand])[0]
        except Exception:
            brand_enc = 0

        try:
            type_enc = self.le_type.transform([vehicle_type])[0]
        except Exception:
            type_enc = 0

        row = {
            "brand_enc"                : brand_enc,
            "type_enc"                 : type_enc,
            "battery_health_pct"       : float(data.get("battery_health_pct", 0)),
            "range_km"                 : float(data.get("range_km", 0)),
            "top_speed_kmph"           : float(data.get("top_speed_kmph", 0)),
            "odometer_km"              : odometer,
            "warranty_remaining_years" : float(data.get("warranty_remaining_years", 0)),
            "annual_maintenance_cost"  : float(data.get("annual_maintenance_cost", 0)),
            "Purchase_Year"            : purchase_year,
            "Current_Year"             : current_year,
            "Purchase_Price_L"         : float(data.get("Purchase_Price_L", 0)),
            "Initial_Mileage"          : initial_mil,
            "Current_Mileage"          : current_mil,
            "vehicle_age"              : vehicle_age,
            "usage_per_year"           : usage_per_yr,
            "mileage_drop"             : mileage_drop,
        }
        return pd.DataFrame([row])

    # ------------------------------------------------------------------ #
    #  Condition Score (0-100 %)                                          #
    # ------------------------------------------------------------------ #
    def _formula_condition(self, data: dict) -> float:
        """Fallback formula when pkl is legacy numpy array."""
        battery  = float(data.get("battery_health_pct", 0))
        odometer = float(data.get("odometer_km", 0))
        warranty = float(data.get("warranty_remaining_years", 0))
        maint    = float(data.get("annual_maintenance_cost", 0))
        age      = max(int(data.get("Current_Year", 2025)) - int(data.get("Purchase_Year", 2020)), 0)
        init_mil = float(data.get("Initial_Mileage", 0))
        curr_mil = float(data.get("Current_Mileage", 0))
        mileage_drop = max(init_mil - curr_mil, 0)
        range_km = float(data.get("range_km", 0))
        top_speed= float(data.get("top_speed_kmph", 0))

        score = (
              0.35 * (battery / 100)
            + 0.10 * min(range_km / 500, 1.0)
            + 0.05 * min(top_speed / 200, 1.0)
            - 0.20 * min(odometer / 300_000, 1.0)
            + 0.10 * min(warranty / 10, 1.0)
            - 0.05 * min(maint / 100_000, 1.0)
            - 0.10 * min(age / 20, 1.0)
            - 0.05 * min(mileage_drop / 100, 1.0)
        ) * 100 + 23.61
        return round(float(np.clip(score, 0, 100)), 2)

    def compute_condition_score(self, data: dict) -> float:
        if self.cond_model is not None:
            X = self._build_features(data)
            score = float(self.cond_model.predict(X)[0])
            return round(float(np.clip(score, 0, 100)), 2)
        return self._formula_condition(data)

    # ------------------------------------------------------------------ #
    #  Predicted Resale Price                                             #
    # ------------------------------------------------------------------ #
    def _formula_price(self, data: dict, condition_score: float) -> float:
        """Fallback depreciation formula when pkl is legacy numpy array."""
        purchase_price = float(data.get("Purchase_Price_L", 0))
        vehicle_age    = max(int(data.get("Current_Year", 2025)) - int(data.get("Purchase_Year", 2020)), 0)
        odometer       = float(data.get("odometer_km", 0))
        warranty       = float(data.get("warranty_remaining_years", 0))

        odometer_factor  = min(odometer / 200_000, 1.0) * 0.04
        condition_factor = ((100 - condition_score) / 100) * 0.03
        ann_depr         = 0.12 + odometer_factor + condition_factor
        retained         = max((1 - ann_depr) ** vehicle_age, 0)
        warranty_factor  = 1 + min(warranty / 10, 1) * 0.03
        return round(float(purchase_price * retained * warranty_factor * 0.687), 1)

    def predict_resale_price(self, data: dict, condition_score: float = None) -> float:
        if self.price_model is not None:
            X = self._build_features(data)
            return round(float(self.price_model.predict(X)[0]), 1)
        if condition_score is None:
            condition_score = self.compute_condition_score(data)
        return self._formula_price(data, condition_score)

    # ------------------------------------------------------------------ #
    #  Legacy compat                                                      #
    # ------------------------------------------------------------------ #
    def predict(self, data: dict) -> float:
        return self.predict_resale_price(data)

    # ------------------------------------------------------------------ #
    #  Public: analyze                                                    #
    # ------------------------------------------------------------------ #
    def analyze(self, data: dict) -> dict:
        import random

        condition_score  = self.compute_condition_score(data)
        predicted_resale = self.predict_resale_price(data, condition_score)
        user_price       = float(data.get("Resale_Value_L", 0))

        battery_health   = float(data.get("battery_health_pct", 0))
        odometer         = float(data.get("odometer_km", 0))
        warranty         = float(data.get("warranty_remaining_years", 0))
        purchase_year    = int(data.get("Purchase_Year", 2020))
        current_year     = int(data.get("Current_Year", 2025))
        age              = max(current_year - purchase_year, 0)

        # Price difference % (positive → user price is higher → overpriced)
        if predicted_resale > 0:
            price_diff_pct = ((user_price - predicted_resale) / predicted_resale) * 100.0
        else:
            price_diff_pct = 0.0

        # Recommendation thresholds
        if price_diff_pct > 10.0:
            recommendation = "Overpriced"
        elif price_diff_pct >= -10.0:
            recommendation = "Fair Price"
        else:
            recommendation = "Excellent Price"

        # Insights
        insights = []
        if recommendation == "Overpriced":
            reasons = []
            if battery_health < 85:
                reasons.append("battery degradation")
            if odometer > 100_000:
                reasons.append("high accumulated mileage")
            if warranty <= 1:
                reasons.append("limited remaining warranty")
            if age >= 3:
                reasons.append("age-related depreciation")
            if user_price > predicted_resale:
                reasons.append("pricing exceeding expected market value")
            if not reasons:
                reasons = ["overall market depreciation factors"]
            chosen      = random.sample(reasons, min(len(reasons), 2))
            reason_text = " and ".join(chosen)
            insights.append(f"⚠️ The vehicle appears overpriced mainly due to {reason_text}.")

        elif recommendation == "Fair Price":
            parts = [
                f"battery health at {battery_health}%",
                f"{int(odometer):,} km usage",
                f"{int(warranty)} yr warranty remaining",
                f"{age} yr vehicle age",
            ]
            chosen      = random.sample(parts, min(len(parts), 2))
            insights.append(f"👍 Pricing is reasonable considering {' and '.join(chosen)}.")

        else:  # Excellent Price
            parts = []
            if battery_health >= 90:
                parts.append(f"battery health of {battery_health}%")
            if warranty >= 3:
                parts.append(f"{int(warranty)} years warranty remaining")
            if odometer < 60_000:
                parts.append(f"only {int(odometer):,} km driven")
            if not parts:
                parts = ["competitive market pricing"]
            chosen = random.sample(parts, min(len(parts), 2))
            insights.append(f"✅ Great value — {' and '.join(chosen)}.")

        # Fair price range (±10 % of predicted)
        low_price   = predicted_resale * 0.90
        high_price  = predicted_resale * 1.10
        price_range = f"₹{round(low_price):,} - ₹{round(high_price):,}"

        return {
            "condition_score":  condition_score,
            "predicted_resale": predicted_resale,
            "user_price":       user_price,
            "price_diff_pct":   round(price_diff_pct, 2),
            "recommendation":   recommendation,
            "insights":         insights,
            "fair_price_range": price_range,
            # legacy compat
            "score":            condition_score,
        }
