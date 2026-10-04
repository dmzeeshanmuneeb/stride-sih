# STRIDE-AI Edge Models

This directory contains the lightweight, quantized versions of the STRIDE-AI deep learning models, optimized specifically for ARM architecture devices (like the Raspberry Pi).

## Available Formats
1. **`stride_anomaly_detector.tflite`**: A quantized TensorFlow Lite model. It is optimized for detecting cyclonic signatures in raw multispectral input arrays with minimal RAM consumption.
2. **`stride_trajectory_predictor.onnx`**: An ONNX formatted sequence-to-sequence model used for calculating the kinematic trajectory and IMD categorization over the forecast horizon.

## Environment Requirements
To run these models locally on a Raspberry Pi or any general Python environment, you do not need the full heavy TensorFlow/PyTorch libraries. You only need the lightweight runtimes:

```bash
# Basic requirements
pip install numpy

# Lightweight runtimes for edge inference
pip install tflite-runtime onnxruntime
```

## Data Requirements (Multispectral Numpy Arrays)
The STRIDE-AI models **do not take raw images (PNG/JPG)**. They require scientific multispectral data formatted as multi-dimensional Numpy arrays (`.npy`).

**Expected Input Shape:** `(1, 201, 201, 4)`
- **Batch Size:** 1
- **Spatial Resolution:** 201x201 pixels (representing the bounding box of the anomaly)
- **Channels (4):**
  1. `CH-0`: Infrared (Thermal)
  2. `CH-1`: Water Vapor (WV)
  3. `CH-2`: Visible (VIS)
  4. `CH-3`: Passive Microwave (PMW)

## General Python Usage (Standalone Inference)

Here is a complete, standalone Python script showing how to load the `.tflite` edge model and run inference on a local numpy array:

```python
import numpy as np
import tflite_runtime.interpreter as tflite

# 1. Load the quantized TFLite model
interpreter = tflite.Interpreter(model_path="edge_models/stride_anomaly_detector.tflite")
interpreter.allocate_tensors()

# Get input and output tensors
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# 2. Load and prepare the multispectral data
# The file must be a .npy array extracted from the SDR pipeline
input_data = np.load("sample_multispectral_input.npy")

# Ensure the data matches the expected shape: (1, 201, 201, 4)
if input_data.shape != (1, 201, 201, 4):
    raise ValueError(f"Invalid shape. Expected (1, 201, 201, 4), got {input_data.shape}")

# Ensure data type matches the model's expectation (usually FLOAT32)
input_data = input_data.astype(np.float32)

# 3. Run Inference
interpreter.set_tensor(input_details[0]['index'], input_data)
interpreter.invoke()

# 4. Extract Output
confidence_score = interpreter.get_tensor(output_details[0]['index'])[0][0]

print(f"Anomaly Detection Confidence: {confidence_score * 100:.2f}%")
if confidence_score > 0.5:
    print("WARNING: Active cyclonic signature detected. Initializing trajectory tracking.")
else:
    print("STATUS: Background noise. No cyclonic activity detected.")
```

## Implementation Guide for Raspberry Pi
To run this seamlessly as a backend service on your Pi:

1. Setup the physical SDR (Software Defined Radio) antenna pipeline to capture NOAA/Meteor weather satellite data.
2. Use software like SatDump to decode the radio waves into the 4 required spectral channels.
3. Stack the 4 channels into a Numpy array and save it as `.npy`.
4. Run the python inference script above via a cron job or webhook.
5. The local Next.js frontend (hosted on the Pi via Wi-Fi hotspot) will display the results to local first responders.
