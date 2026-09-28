import os
import sys
import argparse
import h5py
import numpy as np
import pandas as pd
import tensorflow as tf
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'stage1_detector.h5')
STATS_PATH = os.path.join(BASE_DIR, 'stage1_stats.npz')
DATA_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'TCIR-ALL_2017.h5')

def preprocess_tensor(tensor_4ch, means, stds):
    """Applies channel masking and global standardization using stage1_stats.npz."""
    cleaned = np.zeros_like(tensor_4ch, dtype=np.float32)
    valid_ranges = [(100.0, 350.0), (100.0, 350.0), (0.0, 2.0), (100.0, 350.0)]

    for c in range(4):
        ch_data = tensor_4ch[:, :, c].copy()
        c_min, c_max = valid_ranges[c]

        ch_data[(ch_data < c_min) | (ch_data > c_max)] = np.nan
        ch_data = np.nan_to_num(ch_data, nan=means[c])
        cleaned[:, :, c] = (ch_data - means[c]) / stds[c]

    return cleaned

def convert_and_save_png_to_4ch(image_path):
    """Converts optical RGB/PNG image to 4-channel array, saves .npy to disk, and returns tensor."""
    print("\n[INFO] Converting optical image to 4-channel multi-spectral array...")
    print("[WARNING] Standard photos lack physical IR1, WV, and PMW satellite sensors.")
    print("          Synthetic physical ranges mapped for demonstration.\n")
    
    img = Image.open(image_path).convert('L').resize((201, 201))
    norm = np.array(img, dtype=np.float32) / 255.0
    
    # Map normalized visual pixel intensity to realistic sensor ranges
    ch_ir1 = 300.0 - (norm * 120.0)  # IR1 (Kelvin)
    ch_wv = 210.0 + (norm * 50.0)    # WV  (Kelvin)
    ch_vis = norm                    # VIS (Reflectance)
    ch_pmw = 150.0 + (norm * 130.0)  # PMW (Kelvin)
    
    tensor_4ch = np.stack([ch_ir1, ch_wv, ch_vis, ch_pmw], axis=-1)

    # Save array to disk alongside the image file
    base_path = os.path.splitext(image_path)[0]
    npy_out_path = f"{base_path}_converted.npy"
    np.save(npy_out_path, tensor_4ch)
    print(f" Created and saved array file: '{npy_out_path}' Shape: {tensor_4ch.shape}")

    return tensor_4ch

def run_inference(input_arg):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(STATS_PATH):
        raise FileNotFoundError("Missing 'stage1_detector.h5' or 'stage1_stats.npz'. Train Stage 1 first!")

    model = tf.keras.models.load_model(MODEL_PATH)
    stats = np.load(STATS_PATH)
    means, stds = stats['means'], stats['stds']

    # Case 1: Input is an Optical Image file path (.png, .jpg, .jpeg)
    if os.path.exists(input_arg) and input_arg.lower().endswith(('.png', '.jpg', '.jpeg')):
        sample_tensor = convert_and_save_png_to_4ch(input_arg)

    # Case 2: Input is a NumPy tensor file (.npy)
    elif os.path.exists(input_arg) and input_arg.lower().endswith('.npy'):
        sample_tensor = np.load(input_arg)
        if sample_tensor.ndim == 4 and sample_tensor.shape[0] == 1:
            sample_tensor = sample_tensor[0]
        if sample_tensor.shape != (201, 201, 4):
            raise ValueError(f"Expected shape (201, 201, 4), got {sample_tensor.shape}")
        print(f"Loaded Multi-Spectral NumPy Array: '{input_arg}'")

    # Case 3: Input is an integer index for local TCIR HDF5 dataset
    elif input_arg.isdigit():
        sample_idx = int(input_arg)
        with h5py.File(DATA_PATH, 'r') as f:
            total_samples = f['matrix'].shape[0]
            if sample_idx < 0 or sample_idx >= total_samples:
                raise ValueError(f"Index {sample_idx} out of bounds (0 to {total_samples - 1}).")
            sample_tensor = f['matrix'][sample_idx]
        print(f"Loaded TCIR Satellite Dataset Sample #{sample_idx}")

    # Case 4: Input is an HDF5 file path (.h5)
    elif os.path.exists(input_arg) and input_arg.lower().endswith('.h5'):
        with h5py.File(input_arg, 'r') as f:
            sample_tensor = f['matrix'][0]
        print(f"Loaded HDF5 File: '{input_arg}' (Frame 0)")

    else:
        raise FileNotFoundError(f"Invalid path or index: '{input_arg}'")

    # Preprocess and Predict
    cleaned_tensor = preprocess_tensor(sample_tensor, means, stds)
    input_batch = np.expand_dims(cleaned_tensor, axis=0)
    prob = float(model.predict(input_batch, verbose=0)[0][0])

    prediction = "CYCLONE" if prob >= 0.5 else "NON-CYCLONE"
    confidence = prob * 100 if prob >= 0.5 else (1.0 - prob) * 100

    print("\n" + "=" * 55)
    print(f" Prediction       : {prediction}")
    print(f" Model Output Prob: {prob:.6f}")
    print(f" Confidence       : {confidence:.2f}%")
    print("=" * 55 + "\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Stage 1 Gatekeeper Predictor")
    parser.add_argument('input', type=str, nargs='?', default='0',
                        help="Path to file (.png, .jpg, .npy, .h5) or TCIR sample index")
    args = parser.parse_args()

    run_inference(args.input)