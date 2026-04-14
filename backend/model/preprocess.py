import os
import glob
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
SEQ_LENGTH = 20
FEATURES = [
    'Flow Duration',
    'Total Fwd Packets',
    'Total Length of Fwd Packets',
    'Flow Bytes/s',
    'Flow Packets/s',
    'Avg Fwd Segment Size'
]

def generate_synthetic_data(num_samples=10000):
    """Generates synthetic data if real CICDDoS2019 CSVs aren't found."""
    print("No CSV files found in backend/data. Generating synthetic data...")
    
    # Normal traffic: roughly 85%
    n_normal = int(num_samples * 0.85)
    normal_data = {
        'Flow Duration': np.random.uniform(100, 50000, n_normal),
        'Total Fwd Packets': np.random.uniform(1, 20, n_normal),
        'Total Length of Fwd Packets': np.random.uniform(0, 1500, n_normal),
        'Flow Bytes/s': np.random.uniform(100, 5000, n_normal),
        'Flow Packets/s': np.random.uniform(10, 500, n_normal),
        'Avg Fwd Segment Size': np.random.uniform(0, 500, n_normal),
        'Label': ['BENIGN'] * n_normal
    }
    
    # DDoS traffic: roughly 15% - characterized by high volume, short duration, similar packet sizes
    n_ddos = num_samples - n_normal
    ddos_data = {
        'Flow Duration': np.random.uniform(1, 100, n_ddos), # very short
        'Total Fwd Packets': np.random.uniform(50, 1000, n_ddos), # many packets
        'Total Length of Fwd Packets': np.random.uniform(10000, 100000, n_ddos), # large length
        'Flow Bytes/s': np.random.uniform(50000, 1000000, n_ddos), # huge rate
        'Flow Packets/s': np.random.uniform(5000, 50000, n_ddos), # huge rate
        'Avg Fwd Segment Size': np.random.uniform(40, 60, n_ddos), # consistent small size
        'Label': ['DDoS'] * n_ddos
    }
    
    df_normal = pd.DataFrame(normal_data)
    df_ddos = pd.DataFrame(ddos_data)
    
    # Mix them up in bursts to create realistic sequences
    df = pd.concat([df_normal, df_ddos]).sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Artificially create consecutive sequences of attacks to simulate real attacks
    # by sorting slightly
    return df

def create_sequences(X, y, time_steps=20):
    Xs, ys = [], []
    # Using sliding window
    for i in range(len(X) - time_steps):
        Xs.append(X.iloc[i:(i + time_steps)].values)
        # Label is DDoS if any of the timesteps in the window is DDoS
        # Or you could just take the label of the last step. Let's take the last step.
        ys.append(y.iloc[i + time_steps])
    return np.array(Xs), np.array(ys)

def load_and_preprocess(force_synthetic=False):
    csv_files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    
    if not csv_files or force_synthetic:
        df = generate_synthetic_data()
    else:
        print(f"Loading real data from {len(csv_files)} CSV files...")
        dfs = []
        for file in csv_files:
            # We add error_bad_lines=False or on_bad_lines='skip' for robustness
            d = pd.read_csv(file, usecols=FEATURES + [' Label'], on_bad_lines='skip')
            d.rename(columns={' Label': 'Label'}, inplace=True)
            dfs.append(d)
        df = pd.concat(dfs, ignore_index=True)
    
    # Clean data
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna()
    
    # Map labels: 0 for normal, 1 for DDoS
    df['BinaryTarget'] = df['Label'].apply(lambda x: 0 if x.strip() == 'BENIGN' else 1)
    
    X = df[FEATURES]
    y = df['BinaryTarget']
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled_arr = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled_arr, columns=X.columns)
    
    print("Creating time-series sequences...")
    X_seq, y_seq = create_sequences(X_scaled, y, time_steps=SEQ_LENGTH)
    
    # Split train/test (80/20) - simple split
    split_index = int(len(X_seq) * 0.8)
    X_train, X_test = X_seq[:split_index], X_seq[split_index:]
    y_train, y_test = y_seq[:split_index], y_seq[split_index:]
    
    # Save scaler for future predictions
    joblib.dump(scaler, os.path.join(os.path.dirname(__file__), 'scaler.joblib'))
    
    return X_train, X_test, y_train, y_test

if __name__ == "__main__":
    X_train, X_test, y_train, y_test = load_and_preprocess()
    print(f"X_train shape: {X_train.shape}")
    print(f"y_train shape: {y_train.shape}")
