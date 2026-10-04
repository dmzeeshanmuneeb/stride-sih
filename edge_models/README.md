# STRIDE-AI Edge Models

This directory contains the lightweight, quantized versions of the STRIDE-AI deep learning models, optimized specifically for ARM architecture devices (like the Raspberry Pi).

## Available Formats
1. **`stride_anomaly_detector.tflite`**: A quantized TensorFlow Lite model. It is optimized for detecting cyclonic signatures in raw multispectral input arrays with minimal RAM consumption.
2. **`stride_trajectory_predictor.onnx`**: An ONNX formatted sequence-to-sequence model used for calculating the kinematic trajectory and IMD categorization over the forecast horizon.

## Implementation Guide for Raspberry Pi
To run these on a Raspberry Pi serving as an offline node:

1. Install the runtime libraries on the Pi:
```bash
pip install tflite-runtime onnxruntime
```
2. Update the API environment variables to point to this directory so the backend bypasses the heavy `.h5` files and uses the edge models.
3. Hook up the output from your SDR / SatDump pipeline to generate the necessary `.npy` matrices and submit them locally.
