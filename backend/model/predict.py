import os
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ddos_cnn.keras")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.joblib")

FEATURES = [
    'Flow Duration',
    'Total Fwd Packets',
    'Total Length of Fwd Packets',
    'Flow Bytes/s',
    'Flow Packets/s',
    'Avg Fwd Segment Size'
]

model = None
scaler = None

def load_assets():
    global model, scaler
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train.py first.")
        model = tf.keras.models.load_model(MODEL_PATH)
    
    if scaler is None:
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(f"Scaler not found at {SCALER_PATH}. Run train.py first.")
        scaler = joblib.load(SCALER_PATH)

def predict_sequence(sequence: list[list[float]]) -> dict:
    """
    Predicts if a sequence of network traffic features is Normal or DDoS.
    Expected sequence shape: (20, 6)
    """
    load_assets()
    
    df = pd.DataFrame(sequence, columns=FEATURES)

    # 1. HYBRID HEURISTIC: "Circuit breaker" for extreme volumetric attacks
    # Only evaluate the CURRENT (last) frame, not the entire 20-frame history, 
    # to naturally prevent 20-tick trailing alerts.
    current_packets_s = df['Flow Packets/s'].iloc[-1]
    current_bytes_s = df['Flow Bytes/s'].iloc[-1]
    
    if current_packets_s > 250_000 or current_bytes_s > 50_000_000:
        return {
            "prediction": "DDoS",
            "confidence": 100.0,
            "prob": 1.0
        }

    # 2. Scale features
    scaled_data = scaler.transform(df)

    # 3. Z-SCORE CLAMPING
    # Prevent extreme outliers from saturating the CNN activations.
    # Keep normalized values within a sensible standard-deviation range.
    scaled_data = np.clip(scaled_data, a_min=-5.0, a_max=10.0)
    
    # Reshape for CNN input: (batch_size, time_steps, features) -> (1, 20, 6)
    input_data = np.expand_dims(scaled_data, axis=0)
    
    # Infer
    prob = model.predict(input_data, verbose=0)[0][0]
    
    # Formulate response
    is_ddos = prob > 0.5
    
    # POST-PROCESS SUPPRESSION:
    # If the CNN flags a lingering attack because of GlobalAveragePooling over past frames,
    # but the CURRENT frame is undeniably normal, suppress the alert.
    if is_ddos and current_packets_s < 1000 and current_bytes_s < 100_000:
        is_ddos = False
        prob = 0.01

    confidence = (prob if is_ddos else 1 - prob) * 100
    
    return {
        "prediction": "DDoS" if is_ddos else "Normal",
        "confidence": float(round(confidence, 1)),
        "prob": float(prob)
    }
