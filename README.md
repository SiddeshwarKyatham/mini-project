# Traffic Tamer 🚀 

**A Real-time DDoS Attack Detection Dashboard powered by an AI/CNN engine.**

We transformed a static dashboard into a fully functional, end-to-end intelligent traffic monitoring system using a **1D Convolutional Neural Network (CNN)**.

## 🧠 What Makes This Unique 

We convert network traffic into dynamic **time-series sequences (20-step histories)**, feeding them directly into our deep learning model. This allows the CNN to learn *active attack patterns* and shapes over time, rather than relying on basic static thresholds or fixed rules.

---

## 🏗️ System Architecture

1. **Frontend (React + Vite)**: Displays the real-time Traffic Graph, Alerts, and Mitigation Panel. Captures and simulates sequence data.
2. **Backend (Flask API)**: RESTful bridge for real-time model inference. 
3. **ML Engine (TensorFlow/Keras)**: Evaluates sequences against patterns learned from the **CICDDoS2019 dataset**.

---

## 🏃‍♂️ How to Run

### 1. Start the AI Backend
```bash
cd backend
pip install -r requirements.txt
# (Optional) If you haven't trained the model, do so:
# python model/train.py

python app.py
```
*The Flask API starts on `http://localhost:5000`.*

### 2. Start the Dashboard UI
In a new terminal:
```bash
npm install
npm run dev
```
*The dashboard connects automatically via proxy. You’ll see the badge turn to **SYSTEM ONLINE — LIVE**.*

---

## 🎯 Dataset Info

The Deep Learning model is prepared to train on the official [CICDDoS2019 dataset](https://www.unb.ca/cic/datasets/ddos-2019.html). If the raw CSVs are not provided in `backend/data/`, the pipeline seamlessly auto-generates high-fidelity synthetic data for reliable demo readiness.
