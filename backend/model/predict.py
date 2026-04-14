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
    
    # sequence should be a list of 20 time steps, each with 6 features
    df = pd.DataFrame(sequence, columns=FEATURES)
    
    # Scale features
    scaled_data = scaler.transform(df)
    
    # Reshape for CNN input: (batch_size, time_steps, features) -> (1, 20, 6)
    input_data = np.expand_dims(scaled_data, axis=0)
    
    # Infer
    prob = model.predict(input_data, verbose=0)[0][0]
    
    # Formulate response
    is_ddos = prob > 0.5
    confidence = (prob if is_ddos else 1 - prob) * 100
    
    return {
        "prediction": "DDoS" if is_ddos else "Normal",
        "confidence": float(round(confidence, 1)),
        "prob": float(prob)
    }
