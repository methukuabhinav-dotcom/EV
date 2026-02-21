from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import load_model_and_encoder, preprocess_input, get_recommendation, generate_insight, calculate_risk_level
from value_model import ValueModel
from sales_model import SalesModel
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load Resources
model, label_encoder = load_model_and_encoder()

# Load Value Model
VALUE_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'value_for_money.pkl')
value_model = ValueModel(VALUE_MODEL_PATH)

# Load Sales Model
SALES_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'sarima_monthly_ev_sales.pkl')
sales_model = SalesModel(SALES_MODEL_PATH)



@app.route('/predict_health', methods=['POST'])
def predict_health():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json
        
        # Preprocess using utils
        try:
            input_array = preprocess_input(data)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Predict
        prediction_index = model.predict(input_array)[0]
        
        # Decode label
        if label_encoder:
            prediction_label = label_encoder.inverse_transform([prediction_index])[0]
        else:
            # Fallback if label_encoder failed
            mapping = {0: 'Degraded', 1: 'Healthy', 2: 'Moderate'}
            prediction_label = mapping.get(prediction_index, "Unknown")

        # Extract input values for helpers
        vehicle_age    = float(data.get('vehicle_age_years', 0))
        charge_cycles  = int(float(data.get('total_charge_cycles', 0)))
        max_temp       = float(data.get('max_battery_temperature_c', 0))
        fast_charging  = float(data.get('fast_charging_frequency_percent', 0))
        cap_retention  = float(data.get('capacity_retention_percent', 0))
        resistance     = float(data.get('internal_resistance_mohm', 0))

        recommendation = get_recommendation(prediction_label)
        insight        = generate_insight(prediction_label, vehicle_age, charge_cycles,
                                          max_temp, fast_charging, cap_retention, resistance)
        risk_level     = calculate_risk_level(cap_retention, charge_cycles, max_temp)

        return jsonify({
            'status': 'success',
            'prediction': prediction_label,
            'prediction_index': int(prediction_index),
            'recommendation': recommendation,
            'insight': insight,
            'risk_level': risk_level
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_value', methods=['POST'])
def predict_value():
    if not value_model.model:
        return jsonify({'error': 'Value Model not loaded'}), 500
    
    try:
        data = request.json
        result = value_model.analyze(data)
        
        return jsonify({
            'status': 'success',
            'value_score': result['score'],
            'recommendation': result['recommendation'],
            'insights': result['insights'],
            'fair_price_range': result['fair_price_range']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict_sales', methods=['GET'])
def predict_sales():
    if not sales_model.model:
        return jsonify({'error': 'Sales Model not loaded'}), 500
    
    try:
        steps = int(request.args.get('steps', 12))
        granularity = request.args.get('granularity', 'monthly')
        
        forecast = sales_model.get_forecast(steps, granularity)
        
        return jsonify({
            'status': 'success',
            'forecast': forecast
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online', 
        'health_model_loaded': model is not None,
        'value_model_loaded': value_model.model is not None
    })

if __name__ == '__main__':
    print("Starting Flask Server...")
    # Run on 0.0.0.0 to be accessible, port 5000
    app.run(debug=True, port=5000)
