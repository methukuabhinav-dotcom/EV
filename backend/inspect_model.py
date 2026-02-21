
import pickle
import sys
import os
import xgboost

# Add current dir to path to find any dependencies if needed
sys.path.append(os.getcwd())

try:
    with open('value_for_money.pkl', 'rb') as f:
        model = pickle.load(f)
    
    with open('model_features_list.txt', 'w', encoding='utf-8') as f_out:
        f_out.write(f"Type: {type(model)}\n")
        
        if hasattr(model, 'feature_names_in_'):
            f_out.write("Features list:\n")
            for feat in model.feature_names_in_:
                f_out.write(f"{feat}\n")
        else:
            f_out.write("No feature_names_in_ found.\n")
            
except Exception as e:
    with open('model_features_list.txt', 'w', encoding='utf-8') as f_out:
        f_out.write(f"Error loading model: {e}\n")
