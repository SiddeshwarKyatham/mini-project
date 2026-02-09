Traffic Tamer – DDoS Attack Detection System

Traffic Tamer is an AI-driven DDoS attack detection system that analyzes network traffic using time-series analysis and deep learning (CNN) to identify malicious patterns in real time.
The project is designed with a modern React-based frontend and an ML-powered Python backend, making it both technically strong and portfolio-worthy.

🔍 Problem Statement

Distributed Denial of Service (DDoS) attacks overwhelm systems with malicious traffic, causing service downtime and financial loss. Traditional rule-based detection systems struggle to detect evolving attack patterns.

Traffic Tamer addresses this by leveraging deep learning on traffic time-series data to detect anomalies accurately and efficiently.

✨ Key Features

📊 Time-Series Traffic Analysis

🧠 CNN-based Deep Learning Model for attack detection

⚡ Real-time Traffic Monitoring Dashboard

🚨 Automatic Detection of Malicious Traffic

🌐 Web-based UI for visualization and alerts

🔌 Modular Architecture (Frontend + ML Backend)

🛠️ Tech Stack
Frontend

React (Lovable-generated UI)

TypeScript

Tailwind CSS

Vite

Backend & ML

Python

TensorFlow / Keras

NumPy, Pandas

Scikit-learn

Deployment / Tools

GitHub

REST API (for ML inference)

Browser-based visualization

🧠 How It Works

Network traffic data is collected and converted into time-series format

Data is preprocessed and fed into a CNN model

The model classifies traffic as Normal or DDoS Attack

Results are sent to the frontend for real-time visualization and alerts

📁 Project Structure
traffic-tamer/
│
├── frontend/          # React + UI components
├── backend/           # Python ML logic
├── models/            # Trained CNN models
├── data/              # Traffic datasets
├── public/            # Favicon & static assets
└── README.md

🚀 Future Enhancements

Support for multiple DDoS attack types

Live packet capture integration

Cloud deployment (AWS/GCP)

Alert notifications via email/SMS

Advanced model optimization

👩‍💻 Author

Manogna
B.Tech Student | Cyber Security & AI Enthusiast

📌 Resume One-Liner

Developed an AI-based DDoS attack detection system using time-series analysis and CNNs with a React-based real-time monitoring dashboard.
