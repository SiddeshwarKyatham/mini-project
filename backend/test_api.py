"""
Quick test: sends two sample sequences (Normal + DDoS) to the running Flask API
and prints what the 1D-CNN model responds.

Run while app.py is running:
    python test_api.py
"""

import requests
import random

URL = "http://127.0.0.1:5000/api/predict"

def make_sequence(flow_dur_range, fwd_pkts_range, total_len_range,
                  bytes_s_range, pkts_s_range, seg_size_range):
    """Build a 20-step × 6-feature sequence within the given ranges."""
    return [
        [
            random.uniform(*flow_dur_range),
            random.uniform(*fwd_pkts_range),
            random.uniform(*total_len_range),
            random.uniform(*bytes_s_range),
            random.uniform(*pkts_s_range),
            random.uniform(*seg_size_range),
        ]
        for _ in range(20)
    ]

# ── Test 1: NORMAL traffic ───────────────────────────────────────────────────
# Characteristics: long flows, few packets, low rates, large segments
normal_seq = make_sequence(
    flow_dur_range  = (10000, 50000),
    fwd_pkts_range  = (1, 20),
    total_len_range = (100, 1500),
    bytes_s_range   = (100, 5000),
    pkts_s_range    = (10, 500),
    seg_size_range  = (100, 500),
)

# ── Test 2: DDoS traffic ─────────────────────────────────────────────────────
# Characteristics: very short flows, huge packet count, massive rates, tiny segments
ddos_seq = make_sequence(
    flow_dur_range  = (1, 100),
    fwd_pkts_range  = (500, 1000),
    total_len_range = (50000, 100000),
    bytes_s_range   = (500000, 1000000),
    pkts_s_range    = (30000, 50000),
    seg_size_range  = (40, 60),
)

print("=" * 55)
print("  Traffic Tamer — 1D-CNN Model API Test")
print("=" * 55)

for label, seq in [("NORMAL", normal_seq), ("DDoS", ddos_seq)]:
    try:
        resp = requests.post(URL, json={"sequence": seq}, timeout=10)
        data = resp.json()

        print(f"\n[INPUT]  Simulated {label} sequence (20 steps x 6 features)")
        print(f"         Sample row[0]: {[round(v, 2) for v in seq[0]]}")
        print(f"[OUTPUT] HTTP {resp.status_code}")
        print(f"         prediction : {data.get('prediction')}")
        print(f"         confidence : {data.get('confidence')}%")
        print(f"         raw prob   : {round(data.get('prob', 0), 4)}  (>0.5 = DDoS)")
        print(f"         volume     : {data.get('volume')}")

        # Quick verdict
        got = data.get("prediction", "")
        if got == label or (label == "NORMAL" and got == "Normal"):
            print(f"         [PASS] Model CORRECTLY identified this as {got}")
        else:
            print(f"         [WARN] Model said '{got}' -- expected '{label}'")
    except Exception as e:
        print(f"\n[ERROR] Could not reach API: {e}")

print("\n" + "=" * 55)
