# STRIDE-AI: Satellite Tracking & Regional Intelligence for Disaster Emergencies

STRIDE-AI is an edge-focused cyclone intelligence concept designed to complement official forecasting by providing lightweight, locally operable analysis when terrestrial communications are disrupted. It does not replace IMD (India Meteorological Department) warnings, but aims to support local responders with situational awareness during and after landfall. 

Built around a Raspberry Pi class device, the prototype explores processing satellite-derived meteorological data and generating simple local intelligence outputs. Future work includes validating offline capabilities, defining precise post-landfall use cases, and aligning with existing official warning dissemination systems.

## 🎯 Target Users
STRIDE-AI is primarily built for:
- **Coastal Disaster Response Teams (NDRF/SDRF)** operating in disconnected environments.
- **Local Authorities & First Responders** in low-lying coastal areas.
- **Meteorological Backup Operations** acting as a redundancy measure when central uplink connectivity fails.

## ⚙️ How It Works (Software Architecture)
STRIDE-AI uses a decoupled architecture optimized for low-resource environments:

1. **Deep Learning Inference Core (Backend):** Built using Python and FastAPI. The core runs a highly optimized Seq2Seq PyTorch/TensorFlow model trained on the TCIR (Tropical Cyclone Information Record) dataset. It ingests multispectral arrays and predicts anomaly confidence, kinematics (VMAX, Heading), and spatio-temporal trajectory coordinates.
2. **Institutional Web Interface (Frontend):** A Next.js (React) Single Page Application (SPA). It provides a clean, information-dense "mission control" interface that can be hosted entirely on a local intranet via the Raspberry Pi.

## 📡 Practical Edge Implementation Guide (Hardware)

To run STRIDE-AI entirely offline as a local coastal node during a disaster, the physical setup requires the following hardware pipeline:

1. **VHF/UHF Antenna:** An omnidirectional antenna (like a QFH or V-Dipole) installed locally to capture raw radio frequency waves from passing weather satellites (e.g., NOAA APT or Meteor M2 LRPT).
2. **LNA (Low Noise Amplifier):** Attached near the antenna to filter out background noise and boost the faint satellite signal.
3. **SDR (Software Defined Radio):** A USB dongle (like RTL-SDR) plugged into the Raspberry Pi. It converts the analog radio waves into a digital baseband signal.
4. **Signal Demodulation & Decoding:** Software on the Pi (e.g., SatDump or wxtoimg) decodes the digital signal into raw image channels (IR, Visible, Water Vapor).
5. **Tensor Conversion:** The channels are cropped, normalized, and converted into Numpy arrays (`.npy`).
6. **STRIDE-AI Inference:** The arrays are fed into the STRIDE-AI Python backend running on the Raspberry Pi.
7. **Offline Web Interface:** The Raspberry Pi acts as a local Wi-Fi hotspot. Responders connect to this hotspot with their tablets/phones and open the local IP (e.g., `192.168.4.1:3000`) to view the institutional dashboard, forecast maps, and trajectory warnings completely offline.

## 📦 Downloadable Edge Models
To ensure the models can run smoothly on ARM architecture (Raspberry Pi), we have provided quantized/lightweight formats of our inference models in the `edge_models/` directory.

You will find:
- `stride_anomaly_detector.tflite` (Quantized for Edge TPU/ARM)
- `stride_trajectory_predictor.onnx`

See the `edge_models/README.md` for specific instructions on initializing the models in an offline environment.
