
import requests
import json

def test_sales_prediction():
    url = "http://127.0.0.1:5000/predict_sales?steps=12"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("✅ API Request Successful")
                forecast = data['forecast']
                print(f"Dates: {len(forecast['dates'])}")
                print(f"Values: {len(forecast['values'])}")
                print("First 3 Forecasts:")
                for i in range(3):
                    print(f"  {forecast['dates'][i]}: {forecast['values'][i]:.2f}")
            else:
                print(f"❌ API Error: {data.get('error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Ensure Flask server is running.")

if __name__ == "__main__":
    test_sales_prediction()
