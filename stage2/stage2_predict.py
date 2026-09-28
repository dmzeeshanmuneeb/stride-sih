import os
import sys
import h5py
import numpy as np
import pandas as pd
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_H5 = os.path.join(BASE_DIR, 'data', 'raw', 'TCIR-ALL_2017.h5')
MODEL_PATH = os.path.join(BASE_DIR, 'stage2_intensity_regressor.h5')
STATS_PATH = os.path.join(BASE_DIR, 'stage2_stats.npz')

def normalize_sample(x_raw, stats_path):
    """Sanitizes sensor noise and normalizes using saved Stage 2 mean/std stats."""
    stats = np.load(stats_path)
    means, stds = stats['means'], stats['stds']
    x_norm = np.zeros_like(x_raw, dtype=np.float32)

    valid_bounds = [
        (150.0, 350.0), # Ch 0: IR1 (Kelvin)
        (150.0, 350.0), # Ch 1: WV (Kelvin)
        (0.0, 1.0),     # Ch 2: VIS (Reflectance)
        (100.0, 350.0)  # Ch 3: PMW (Kelvin)
    ]

    for c in range(4):
        ch = x_raw[:, :, c].copy()
        c_min, c_max = valid_bounds[c]
        invalid_mask = (ch < c_min) | (ch > c_max) | np.isnan(ch) | np.isinf(ch)
        ch[invalid_mask] = means[c]
        x_norm[:, :, c] = (ch - means[c]) / stds[c]

    return np.nan_to_num(x_norm, nan=0.0, posinf=0.0, neginf=0.0)

def map_3class(vmax):
    if vmax < 50.0:
        return "LOW (< 50 kts)"
    elif vmax < 75.0:
        return "MEDIUM (50 - 74 kts)"
    else:
        return "HIGH (>= 75 kts)"

def map_imd_category(vmax):
    if vmax < 34.0:
        return "Depression / Deep Depression"
    elif vmax < 48.0:
        return "Cyclonic Storm (CS)"
    elif vmax < 64.0:
        return "Severe Cyclonic Storm (SCS)"
    elif vmax < 90.0:
        return "Very Severe Cyclonic Storm (VSCS)"
    elif vmax < 120.0:
        return "Extremely Severe Cyclonic Storm (ESCS)"
    else:
        return "Super Cyclonic Storm (SuCS)"

def predict_intensity(sample_idx=0):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at '{MODEL_PATH}'. Train Stage 2 first.")
    if not os.path.exists(STATS_PATH):
        raise FileNotFoundError(f"Normalization stats file not found at '{STATS_PATH}'.")

    print(f"\n--- STAGE 2 CYCLONE INTENSITY PREDICTOR ---")
    print(f"Loading sample matrix index #{sample_idx}...")

    with h5py.File(DATA_H5, 'r') as f:
        x_raw = f['matrix'][sample_idx]
        cols = [col.decode('utf-8').strip().lower() for col in f['info/block0_items'][:]]
        df = pd.DataFrame(f['info/block0_values'][sample_idx:sample_idx+1], columns=cols)
        vmax_col = [c for c in df.columns if 'vmax' in c][0]
        actual_vmax = float(df[vmax_col].values[0])

    # Standardize input matrix
    x_norm = normalize_sample(x_raw, STATS_PATH)
    x_input = np.expand_dims(x_norm, axis=0)

    # Perform inference
    model = tf.keras.models.load_model(MODEL_PATH)
    pred_vmax = float(model.predict(x_input, verbose=0)[0][0])

    # Categorical Mappings
    tier_3class = map_3class(pred_vmax)
    imd_class = map_imd_category(pred_vmax)
    abs_err = abs(pred_vmax - actual_vmax)

    print("\n================ STAGE 2 PREDICTION RESULTS ================")
    print(f" Predicted Maximum Wind Speed (Vmax) : {pred_vmax:.2f} knots")
    print(f" Actual Ground Truth Wind Speed      : {actual_vmax:.2f} knots")
    print(f" Absolute Estimation Error           : {abs_err:.2f} knots")
    print(f" 3-Class Intensity Tier              : {tier_3class}")
    print(f" Official IMD Classification         : {imd_class}")
    print("============================================================\n")

if __name__ == '__main__':
    # Pass index as CLI argument: python stage2/stage2_predict.py 15
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    predict_intensity(idx)