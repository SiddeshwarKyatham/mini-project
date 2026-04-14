from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "model"))
try:
    from predict import predict_sequence, load_assets
except Exception as e:
    print(f"Warning: could not load prediction module: {e}")

app = Flask(__name__)
CORS(app)  # Allow frontend to access the API

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint for frontend to check if backend is alive."""
    try:
        load_assets()
        return jsonify({"status": "ok", "model": "loaded"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 503

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Expects JSON:
    {
        "sequence": [[feat1, feat2, ...], [feat1, feat2, ...], ...]
    }
    """
    data = request.json
    if not data or 'sequence' not in data:
        return jsonify({"error": "Missing 'sequence' in request body"}), 400
    
    sequence = data['sequence']
    if not isinstance(sequence, list) or len(sequence) != 20:
        return jsonify({"error": "Sequence must be a list of length 20"}), 400
        
    try:
        result = predict_sequence(sequence)
        
        # Calculate max volume to return to frontend for graphing
        # Index 3 in features is Flow Bytes/s, but index 4 is Flow Packets/s
        # Depending on how the frontend uses volume, we can return the average of the window or the latest.
        # Let's say volume is roughly derived from the most recent packet rate
        recent_volume = sequence[-1][4] 
        result['volume'] = recent_volume
        
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")
