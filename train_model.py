import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Create models directory if it doesn't exist
if not os.path.exists("models"):
    os.makedirs("models")

def generate_synthetic_data(samples=2000):
    """
    Generate synthetic data for training the comfort prediction model.
    Encapsulates physical comfort rules with some added noise.
    """
    np.random.seed(42)
    
    # Random weather conditions
    temps = np.random.uniform(-10, 45, samples)
    humidity = np.random.uniform(10, 100, samples)
    wind_speeds = np.random.uniform(0, 60, samples)
    rain_probs = np.random.uniform(0, 100, samples)
    uv_indices = np.random.uniform(0, 12, samples)
    
    # Random outfit properties
    temp_ranges = ["very_cold", "cold", "cool", "warm", "hot"]
    outfit_temp_ranges = np.random.choice(temp_ranges, samples)
    rain_suitables = np.random.choice([0, 1], samples)
    uv_protections = np.random.choice([0, 1], samples)
    wind_resistants = np.random.choice([0, 1], samples)
    layering_counts = np.random.randint(1, 4, samples)
    occasion_matches = np.random.choice([0, 1], samples)
    sustainability_scores = np.random.uniform(1, 10, samples)
    
    data = []
    
    for i in range(samples):
        weather_cat = ""
        if temps[i] < 5: weather_cat = "very_cold"
        elif temps[i] < 15: weather_cat = "cold"
        elif temps[i] < 22: weather_cat = "cool"
        elif temps[i] < 30: weather_cat = "warm"
        else: weather_cat = "hot"
        
        # Rule-based base score with noise
        score = 7.5 + np.random.normal(0, 0.4)
        
        # Penalty for temperature mismatch
        range_order = ["very_cold", "cold", "cool", "warm", "hot"]
        dist = abs(range_order.index(weather_cat) - range_order.index(outfit_temp_ranges[i]))
        score -= dist * 2.5
        
        # Rain penalty
        if rain_probs[i] >= 50:
            if rain_suitables[i] == 1:
                score += 1.0
            else:
                score -= 3.0
        
        # UV penalty
        if uv_indices[i] >= 7:
            if uv_protections[i] == 1:
                score += 0.5
            else:
                score -= 1.0
                
        # Wind penalty
        if wind_speeds[i] >= 35:
            if wind_resistants[i] == 1:
                score += 0.5
            else:
                score -= 1.5
                
        # Layering logic
        if weather_cat in ["very_cold", "cold"] and layering_counts[i] < 2:
            score -= 1.5
        if weather_cat == "hot" and layering_counts[i] > 1:
            score -= 2.0

        # Preference Match
        if occasion_matches[i] == 1:
            score += 1.0
        
        # Sustainability bonus
        if sustainability_scores[i] >= 8:
            score += 0.5
            
        # Clamp score
        score = max(1.0, min(10.0, score))
        
        data.append({
            "temp": temps[i],
            "humidity": humidity[i],
            "wind_speed": wind_speeds[i],
            "rain_prob": rain_probs[i],
            "uv_index": uv_indices[i],
            "outfit_temp_range": outfit_temp_ranges[i],
            "is_rain_suitable": rain_suitables[i],
            "is_uv_protection": uv_protections[i],
            "is_wind_resistant": wind_resistants[i],
            "layering_count": layering_counts[i],
            "occasion_match": occasion_matches[i],
            "sustainability_score": sustainability_scores[i],
            "comfort_score": score
        })
        
    return pd.DataFrame(data)

def train():
    print("Generating training data...")
    df = generate_synthetic_data(3000)
    
    # Preprocessing
    le = LabelEncoder()
    df['outfit_temp_range'] = le.fit_transform(df['outfit_temp_range'])
    
    # Save encoder for inference
    joblib.dump(le, 'models/temp_range_encoder.joblib')
    
    X = df.drop("comfort_score", axis=1)
    y = df["comfort_score"]
    
    print("Training Random Forest model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    print(f"Model trained with score: {model.score(X, y):.4f}")
    
    # Save model
    joblib.dump(model, 'models/comfort_model.joblib')
    print("Model saved to models/comfort_model.joblib")

if __name__ == "__main__":
    train()
