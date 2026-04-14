import requests
import json
import time

URL = "http://127.0.0.1:5000/api/predict"

def send_prediction(label, sequence):
    print(f"\n--- Testing Scenario: {label} ---")
    
    # Just show the last row as an example of what it looks like
    last_row = [round(x, 2) for x in sequence[-1]]
    print(f"Sample input features (last row before prediction):")
    print(f"   [Duration, Fwd Packets, Total Length, Bytes/s, Packets/s, Avg Seg Size]")
    print(f"   {last_row}")
    
    try:
        resp = requests.post(URL, json={"sequence": sequence}, timeout=5)
        data = resp.json()
        print(f"-> Model Output: {data.get('prediction')} (Confidence: {data.get('confidence')}%)")
        print(f"-> Raw DDoS Probability: {data.get('prob'):.4f} (>0.5 is DDoS)")
    except Exception as e:
        print(f"-> Error: {e}")

# Features: Flow Duration, Total Fwd Packets, Total Length of Fwd Packets, Flow Bytes/s, Flow Packets/s, Avg Fwd Segment Size

# Scenario 1: Standard Benign Web Browsing
# Long duration, very few packets per second, variable segment sizes
browsing_seq = [
    [45000.0, 15.0, 1500.0, 2000.0, 50.0, 100.0] for _ in range(20)
]
send_prediction("Standard Web Browsing (Normal)", browsing_seq)


# Scenario 2: Large File Download (High Volume, but Normal)
# Very long duration, high total length, high bytes/s, high avg segment size, but controlled packet rate
download_seq = [
    [150000.0, 500.0, 750000.0, 5000.0, 3.0, 1500.0] for _ in range(20)
]
send_prediction("Large File Download (High Volume Normal)", download_seq)


# Scenario 3: Aggressive SYN Flood DDoS
# Tiny flow duration, massive packet rate, small uniform segment size
syn_flood_seq = [
    [12.0, 50000.0, 3000000.0, 250000000.0, 400000.0, 60.0] for _ in range(20)
]
send_prediction("Massive SYN Flood Attack (DDoS)", syn_flood_seq)


# Scenario 4: UDP Amplification DDoS
# Short duration, extreme byte/packet rates, uniform packet size
udp_amp_seq = [
    [1.5, 20000.0, 24000000.0, 95000000.0, 80000.0, 1200.0] for _ in range(20)
]
send_prediction("UDP Amplification Attack (DDoS)", udp_amp_seq)
