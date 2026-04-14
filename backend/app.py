from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import traceback

sys.path.append(os.path.join(os.path.dirname(__file__), "model"))

# predict_sequence / load_assets are set to None if the model isn't available yet.
# The endpoints below check for None and return a clear 503 rather than crashing.
predict_sequence = None
load_assets = None
try:
    from predict import predict_sequence, load_assets  # type: ignore[assignment]
except Exception as e:
    print(f"Warning: could not load prediction module: {e}")

app = Flask(__name__)
CORS(app)  # Allow frontend to access the API

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint for frontend to check if backend is alive."""
    if load_assets is None:
        return jsonify({"status": "error", "message": "Model module not loaded. Run model/train.py first."}), 503
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
        
    if predict_sequence is None:
        return jsonify({"error": "Model not loaded. Run model/train.py first."}), 503

    try:
        result = predict_sequence(sequence)

        # Return the most recent packets/s (index 4) as a volume proxy for the frontend chart
        result['volume'] = round(sequence[-1][4], 2)

        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")
