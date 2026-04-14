"""
preprocess.py - Data loading and preprocessing for Traffic Tamer DDoS detector.

Key improvements over v1:
  - 50/50 balanced Normal / DDoS split (was 85/15 -> model biased toward Normal)
  - Temporal "burst" structure: DDoS rows arrive in consecutive blocks so the
    sliding-window sequences the CNN trains on contain coherent temporal patterns.
  - Clearly non-overlapping feature ranges ensure good Z-score separation after scaling.
  - Handles both CICDDoS2019 column format (' Label') and synthetic CSV ('Label').
"""

import os
import glob
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

DATA_DIR   = os.path.join(os.path.dirname(__file__), "..", "data")
SEQ_LENGTH = 20
FEATURES   = [
    "Flow Duration",
    "Total Fwd Packets",
    "Total Length of Fwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Avg Fwd Segment Size",
]


# -- Row generators ------------------------------------------------------------

def _normal_rows(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """Benign traffic: long flows, modest rates, variable segment sizes."""
    return pd.DataFrame({
        "Flow Duration":               rng.uniform(5_000,   200_000, n),
        "Total Fwd Packets":           rng.uniform(1,       50,      n),
        "Total Length of Fwd Packets": rng.uniform(40,      3_000,   n),
        "Flow Bytes/s":                rng.uniform(10,      8_000,   n),
        "Flow Packets/s":              rng.uniform(1,       200,     n),
        "Avg Fwd Segment Size":        rng.uniform(60,      1_500,   n),
        "Label": ["BENIGN"] * n,
    })


def _ddos_rows(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """
    DDoS traffic: very short flows, extremely high packet / byte rates,
    tiny uniform segment sizes.  Feature ranges intentionally do NOT overlap
    with normal traffic so the StandardScaler maps them to clearly different
    Z-score regions.
    """
    return pd.DataFrame({
        "Flow Duration":               rng.uniform(1,         300,         n),
        "Total Fwd Packets":           rng.uniform(200,       5_000,       n),
        "Total Length of Fwd Packets": rng.uniform(50_000,    2_000_000,   n),
        "Flow Bytes/s":                rng.uniform(500_000,   50_000_000,  n),
        "Flow Packets/s":              rng.uniform(50_000,    1_000_000,   n),
        "Avg Fwd Segment Size":        rng.uniform(20,        80,          n),
        "Label": ["DDoS"] * n,
    })


# -- Synthetic data generator --------------------------------------------------

def generate_synthetic_data(total_samples: int = 30_000,
                             ddos_ratio: float = 0.50,
                             seed: int = 42) -> pd.DataFrame:
    """
    Generates balanced synthetic network traffic with temporal burst structure.

    The data is arranged in alternating Normal / DDoS blocks of varying lengths,
    so that a sliding window of 20 rows will see consecutive same-class rows.
    This gives the 1D-CNN coherent temporal patterns to learn - much better
    than randomly shuffling all rows.

    Args:
        total_samples: Total number of flow rows to generate.
        ddos_ratio:    Fraction of DDoS rows (0.5 = perfectly balanced).
        seed:          NumPy random seed for reproducibility.

    Returns:
        DataFrame with FEATURES columns plus 'Label'.
    """
    print(f"Generating balanced synthetic data  "
          f"({int((1-ddos_ratio)*100)}% Normal / {int(ddos_ratio*100)}% DDoS)...")

    rng = np.random.default_rng(seed)

    n_ddos   = int(total_samples * ddos_ratio)
    n_normal = total_samples - n_ddos
    n_bursts = 20   # number of Normal->DDoS alternations

    # Split normal / DDoS rows into n_bursts blocks of varying sizes
    def split_into_blocks(total, n_blocks):
        raw = rng.integers(50, 500, size=n_blocks).astype(float)
        sizes = (raw / raw.sum() * total).astype(int)
        sizes[-1] += total - sizes.sum()   # absorb rounding error
        return sizes

    normal_blocks = split_into_blocks(n_normal, n_bursts)
    ddos_blocks   = split_into_blocks(n_ddos,   n_bursts)

    frames = []
    for nb, db in zip(normal_blocks, ddos_blocks):
        frames.append(_normal_rows(int(nb), rng))
        frames.append(_ddos_rows(int(db),   rng))

    df = pd.concat(frames, ignore_index=True)

    # Save so it can be inspected / reused
    out_path = os.path.join(DATA_DIR, "synthetic_replica.csv")
    df.to_csv(out_path, index=False)

    n_ben = (df["Label"] == "BENIGN").sum()
    n_dos = (df["Label"] == "DDoS").sum()
    print(f"  Saved {len(df):,} rows -> {out_path}")
    print(f"  BENIGN: {n_ben:,}  |  DDoS: {n_dos:,}  "
          f"(ratio {n_dos/len(df)*100:.1f}% DDoS)")

    return df


# -- Sequence builder ----------------------------------------------------------

def create_sequences(X: pd.DataFrame, y: pd.Series,
                     time_steps: int = 20):
    """
    Sliding window over the ordered DataFrame.
    Label = label of the LAST row in the window.
    """
    Xs, ys = [], []
    for i in range(len(X) - time_steps):
        Xs.append(X.iloc[i : i + time_steps].values)
        ys.append(y.iloc[i + time_steps])
    return np.array(Xs), np.array(ys)


# -- Main entry point ----------------------------------------------------------

def load_and_preprocess(force_synthetic: bool = False):
    """
    Load data, scale features, build sequences, split train/test.

    If real CICDDoS2019 CSVs are found in DATA_DIR (and force_synthetic=False),
    they are used.  Otherwise, synthetic data is (re-)generated.

    Returns:
        X_train, X_test, y_train, y_test  (numpy arrays)
    """
    csv_files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    # Filter out the synthetic replica so it doesn't masquerade as real data
    real_csvs = [f for f in csv_files
                 if os.path.basename(f) != "synthetic_replica.csv"]

    if real_csvs and not force_synthetic:
        print(f"Loading real data from {len(real_csvs)} CICDDoS2019 CSV(s)...")
        dfs = []
        for fpath in real_csvs:
            try:
                # CICDDoS2019 uses ' Label' (space-prefixed column name)
                d = pd.read_csv(fpath, usecols=FEATURES + [" Label"],
                                on_bad_lines="skip")
                d.rename(columns={" Label": "Label"}, inplace=True)
            except (ValueError, KeyError):
                # Fallback: column already named 'Label' without space
                d = pd.read_csv(fpath, usecols=FEATURES + ["Label"],
                                on_bad_lines="skip")
            dfs.append(d)
        df = pd.concat(dfs, ignore_index=True)
    else:
        df = generate_synthetic_data()

    # -- Clean ----------------------------------------------------------------─
    df = df.replace([np.inf, -np.inf], np.nan).dropna()

    # -- Label encoding --------------------------------------------------------
    df["BinaryTarget"] = df["Label"].apply(
        lambda x: 0 if str(x).strip().upper() == "BENIGN" else 1
    )

    X = df[FEATURES]
    y = df["BinaryTarget"]

    print(f"  Total clean rows: {len(df):,}  "
          f"(Normal={int((y==0).sum()):,}, DDoS={int((y==1).sum()):,})")

    # -- Scale ----------------------------------------------------------------─
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=FEATURES)

    # Save scaler - predict.py will load this at inference time
    scaler_path = os.path.join(os.path.dirname(__file__), "scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"  Scaler saved -> {scaler_path}")

    # -- Sequences ------------------------------------------------------------─
    print("Building sliding-window sequences (this may take ~30 s)...")
    X_seq, y_seq = create_sequences(X_scaled, y, time_steps=SEQ_LENGTH)
    print(f"  Sequences: {X_seq.shape}   "
          f"(Normal={int((y_seq==0).sum()):,}, DDoS={int((y_seq==1).sum()):,})")

    # -- Train / test split ----------------------------------------------------
    split = int(len(X_seq) * 0.8)
    return X_seq[:split], X_seq[split:], y_seq[:split], y_seq[split:]


# -- CLI helper ----------------------------------------------------------------

if __name__ == "__main__":
    X_tr, X_te, y_tr, y_te = load_and_preprocess(force_synthetic=True)
    print(f"X_train: {X_tr.shape}  y_train: {y_tr.shape}")
    print(f"X_test : {X_te.shape}  y_test : {y_te.shape}")
