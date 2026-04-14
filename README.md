# 🛡️ Traffic Tamer: AI-Powered DDoS Detection System

![Traffic Tamer Architecture](https://img.shields.io/badge/Status-Active-brightgreen.svg) ![React](https://img.shields.io/badge/React-18.x-blue.svg) ![Python](https://img.shields.io/badge/Python-3.x-yellow.svg) ![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange.svg)

**Traffic Tamer** is a sophisticated, real-time end-to-end DDoS attack detection dashboard. It monitors simulated network traffic and instantly classifies threats using a deep learning **1D Convolutional Neural Network (CNN)**.

By analyzing temporal network patterns through 20-step historical sequences, the AI engine can differentiate between normal user spikes and malicious Distributed Denial of Service (DDoS) streams with high accuracy and confidence.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [How It Works](#-how-it-works)
3. [Technology Stack](#-technology-stack)
4. [Dataset & ML Model Details](#-dataset--ml-model-details)
5. [Project Architecture](#-project-architecture)
6. [Prerequisites](#-prerequisites)
7. [Installation & Setup](#-installation--setup)
8. [Usage](#-usage)

---

## ✨ Key Features

- **Real-Time Data Streaming:** A continuous frontend telemetry generator streams live metrics matching real TCP/UDP network flows.
- **Deep Learning Intelligence:** Rather than static thresholds, Traffic Tamer uses a 1D CNN that looks at sequential time series data to accurately understand attack shapes.
- **Visual Dashboard:** Beautiful, responsive UI built with React, Tailwind CSS, and Recharts showing live network confidence scores and live packet volume.
- **Threat Mitigation Panel:** Log panels that log IP anomalies with automated mitigation strategy recommendations.
- **One-Click Attack Sandbox:** Easily simulate a high-volume DDoS UDP Amplification Attack directly from the UI to watch the model instantly catch and classify it.
- **Self-Contained ML:** Includes generated synthetic replicas derived from CICDDoS2019, complete with pre-trained models. No extra database required.

---

## ⚙️ How It Works

1. **Traffic Generation:** The frontend hook (`useTrafficFeed.ts`) continuously generates 6 core features: `Flow Duration, Total Fwd Packets, Total Length of Fwd Packets, Flow Bytes/s, Flow Packets/s, Avg Fwd Segment Size`.
2. **Sequential Windowing:** It maintains a rolling buffer of 20 historical traffic instances.
3. **API Inference:** It automatically posts this 20-step matrix format to the local Python Flask Backend `/api/predict`.
4. **Machine Learning:** The backend invokes the `ddos_cnn.keras` model, returning `"Normal"` or `"DDoS"` classifications alongside confidence percentages.
5. **Continuous Rendering:** Results instantly reflect on the rich UI, logging entries on the dashboard and alerting the user of attacks.

---

## 💻 Technology Stack

### Frontend
* **Framework:** React + Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Shadcn UI components
* **Icons & Charts:** Lucide-React, Recharts

### Backend
* **Server:** Python / Flask
* **API Routing:** RESTful architecture with Flask-CORS

### Machine Learning
* **Frameworks:** TensorFlow / Keras (Neural Networks)
* **Data Processing:** Pandas, NumPy, Scikit-Learn (StandardScaler)

---

## 🧠 Dataset & ML Model Details

The intelligence uses structures derived from the official [CICDDoS2019 Dataset](https://www.unb.ca/cic/datasets/ddos-2019.html). 

*   **Training Data:** To prevent extremely large repository sizes, we generated a reliable `synthetic_replica.csv` dataset capturing accurate boundaries of Normal and DDoS UDP/TCP traits.
*   **Sequential Learning (CNN):** 1D Convolutions are exceptionally good at discovering local time-series patterns. The dataset is grouped into chunks of `(Batch, 20 time steps, 6 features)` before being passed to Conv1D layers, MaxPooling, and Dense classification layers.
*   **Pre-trained Artifacts Included:** The `backend/model/` directory includes both `scaler.joblib` and `ddos_cnn.keras`. There is no need for manual training to deploy!

---

## 🏗️ Project Architecture

```text
traffic-tamer/
├── backend/                  <- AI Inference Server
│   ├── app.py                <- Flask API Endpoints
│   ├── data/                 <- Training Datasets & generated CSVs
│   └── model/                
│       ├── predict.py        <- Inference Engine logic
│       ├── preprocess.py     <- Feature Engineering / Scaling
│       ├── train.py          <- 1D CNN Architecture & Training pipeline
│       ├── ddos_cnn.keras    <- Pre-trained Model State
│       └── scaler.joblib     <- Pre-fitted scaling statistics
│
└── src/                      <- React Dashboard UI
    ├── components/           <- Charts, Traffic Feed, Architecture SVG, etc.
    ├── hooks/                <- useTrafficFeed (Traffic Simulator & polling)
    ├── lib/                  <- API interface handling
    └── pages/                <- Main Application View
```

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed:
*   [Node.js](https://nodejs.org/en/) (v16.14.0 or above)
*   [npm](https://www.npmjs.com/) (Node Package Manager)
*   [Python](https://www.python.org/) 3.9 to 3.11 (TensorFlow compatibility)
*   [Git](https://git-scm.com/)

---

## 🚀 Installation & Setup

You need to run two servers concurrently: the AI Backend and the Frontend UI.

### 1. Launch the Backend (Flask API)
Open a terminal and set up your python environment.
```bash
git clone https://github.com/SiddeshwarKyatham/mini-project.git
cd mini-project/traffic-tamer/backend

# Optional: Create a virtual environment
python -m venv venv
# Windows: venv\\Scripts\\activate
# Mac/Linux: source venv/bin/activate

# Install AI and Platform dependencies
pip install -r requirements.txt

# Start the inference server
python app.py
```
*The endpoint will boot up correctly on `http://localhost:5000`.*

### 2. Launch the Frontend Dashboard
Open a **new** terminal window:
```bash
cd mini-project/traffic-tamer

# Install Javascript packages
npm install
# or 'npm i --legacy-peer-deps' if encountering dependency bounds

# Launch development dashboard
npm run dev
```

---

## 🕹️ Usage

*   **Access the UI**: Navigate to the `localhost` URL printed by your Vite frontend server (usually `http://localhost:8080` or `5173`).
*   **System Status**: Monitor the top right badge. If the backend is running, it will automatically connect and turn **GREEN (Live Detection - System Online)**.
*   **Launch Attack Sandbox**: Click the red **Launch DDoS Attack** button in the header. You will instantly see traffic volume spike past 90,000 requests/sec, and the Conv1D model will flag the anomaly, triggering alarms.

---
*Created for secure networking environments and AI-driven robust server defense visualization.*
