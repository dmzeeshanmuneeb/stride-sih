# STRIDE-AI: Satellite Tracking & Regional Intelligence for Disaster Emergencies

STRIDE-AI is a high-precision cyclone intelligence concept designed to complement official forecasting by providing lightweight, locally operable analysis when terrestrial communications are disrupted. It does not replace IMD (India Meteorological Department) warnings, but aims to support local responders with situational awareness during and after landfall.

Currently, STRIDE-AI is deployed as a **cloud-capable server prototype** (FastAPI backend + Next.js frontend). However, **its future scope and real-life vision is edge-deployment**, specifically designed to be ported and run on a Raspberry Pi-class device to act as an offline, disconnected intelligence node in low-lying coastal areas during severe weather events when internet infrastructure collapses.

## 🎯 Target Users
STRIDE-AI is primarily built for:
- **Coastal Disaster Response Teams (NDRF/SDRF)** operating in disconnected environments.
- **Local Authorities & First Responders** in low-lying coastal areas requiring immediate tactical data.
- **Meteorological Backup Operations** acting as a redundancy measure when central uplink connectivity fails.

## 🧠 Core AI Models & Dataset
STRIDE-AI is powered by a multi-stage Deep Learning pipeline trained on the **Tropical Cyclone Information Record (TCIR)** dataset. 
The pipeline expects a 4-channel multispectral tensor `(1, 201, 201, 4)` comprising:
1. **Infrared (Thermal)**
2. **Water Vapor**
3. **Visible**
4. **Passive Microwave (PMW)**

**The AI Pipeline consists of:**
1. **Stage 1 (Anomaly Detection):** A Convolutional Neural Network (CNN) that scans the multispectral input to detect and confirm cyclonic genesis.
2. **Stage 2 (Intensity Regression):** A deep regressor that predicts Maximum Sustained Winds (VMAX) and maps it to official IMD categorization scales (e.g., Severe Cyclonic Storm).
3. **Stage 3 (Trajectory Prediction):** A Sequence-to-Sequence (Seq2Seq) LSTM model that forecasts the physical coordinates (Lat/Lon) of the cyclone over a +72h horizon.

## ⚙️ How It Works (Current Software Architecture)
STRIDE-AI uses a decoupled architecture optimized for scalability and eventual low-resource deployment:

1. **Deep Learning Inference Core (Backend):** Built using Python and FastAPI. The core runs the heavy `.h5` PyTorch/TensorFlow models to process the `.npy` arrays and return predictions via a REST API.
2. **Institutional Web Interface (Frontend):** A Next.js (React) Single Page Application (SPA). It provides a clean, information-dense "mission control" interface featuring an interactive forecast map, trajectory logs, and impact matrices.

## 🔮 Future Scope: The "Edge Node" Vision
In real-life scenarios, coastal regions lose internet access before a cyclone even makes landfall. The future scope of STRIDE-AI is to completely bypass the cloud.

**Proposed Offline Hardware Pipeline (Raspberry Pi):**
1. **VHF/UHF Antenna:** Installed locally at a response camp to capture raw radio frequency waves from passing weather satellites (e.g., NOAA APT).
2. **LNA & SDR (Software Defined Radio):** Amplifies and converts the analog radio waves into a digital baseband signal via a USB dongle.
3. **Decoding & Array Generation:** Software decodes the signal into the required 4-channel Numpy arrays.
4. **Offline Inference (Raspberry Pi):** The lightweight quantized models (`.tflite` / `.onnx`) run directly on the Raspberry Pi without internet access.
5. **Local Network Interface:** The Pi broadcasts a local Wi-Fi hotspot. Responders connect via mobile devices to access the STRIDE-AI dashboard and view the trajectory and alerts completely offline.

*(Note: Dummy edge models and Python usage instructions for this future scope are located in the `edge_models/` directory).*
