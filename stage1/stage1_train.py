import os
import h5py
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_H5 = os.path.join(BASE_DIR, 'data', 'raw', 'TCIR-ALL_2017.h5')
MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'stage1_detector.h5')
STATS_SAVE_PATH = os.path.join(BASE_DIR, 'stage1_stats.npz')

def clean_and_normalize(X):
    """Sanitizes missing satellite values (-9999, NaNs) and computes Z-score stats."""
    print("      Sanitizing sensor noise and applying Z-score normalization...")
    X_clean = np.zeros_like(X, dtype=np.float32)

    # Valid physical bounds for satellite channels
    valid_bounds = [
        (150.0, 350.0), # Ch 0: IR1 (Kelvin)
        (150.0, 350.0), # Ch 1: WV (Kelvin)
        (0.0, 1.0),     # Ch 2: VIS (Reflectance)
        (100.0, 350.0)  # Ch 3: PMW (Kelvin)
    ]

    means, stds = [], []

    for c in range(4):
        ch = X[:, :, :, c].copy()
        c_min, c_max = valid_bounds[c]

        # Mask invalid values (-9999, out-of-bounds, NaNs, Infs)
        invalid_mask = (ch < c_min) | (ch > c_max) | np.isnan(ch) | np.isinf(ch)
        ch[invalid_mask] = np.nan

        # Calculate valid channel mean and std
        ch_mean = float(np.nanmean(ch)) if not np.all(np.isnan(ch)) else 0.0
        ch_std = float(np.nanstd(ch)) if not np.all(np.isnan(ch)) else 1.0
        if ch_std < 1e-5:
            ch_std = 1.0

        means.append(ch_mean)
        stds.append(ch_std)

        # Replace NaNs with channel mean (Z-score becomes 0.0)
        ch = np.nan_to_num(ch, nan=ch_mean)

        # Standardize channel
        X_clean[:, :, :, c] = (ch - ch_mean) / ch_std

    # Absolute guarantee against NaN/Inf gradient leaks
    X_clean = np.nan_to_num(X_clean, nan=0.0, posinf=0.0, neginf=0.0)

    np.savez(STATS_SAVE_PATH, means=means, stds=stds)
    print(f"      Saved normalization stats to '{STATS_SAVE_PATH}'.")
    return X_clean

def load_balanced_data():
    """Extracts a 50/50 balanced dataset exclusively from TCIR-ALL_2017.h5."""
    print("[1/4] Loading balanced dataset directly from TCIR-ALL_2017.h5...")
    with h5py.File(DATA_H5, 'r') as f:
        cols = [col.decode('utf-8').strip().lower() for col in f['info/block0_items'][:]]
        df = pd.DataFrame(f['info/block0_values'][:], columns=cols)
        vmax_col = [c for c in df.columns if 'vmax' in c][0]
        vmax = df[vmax_col].values

        # Distinct threshold: Non-Cyclone (<= 28 kts) vs Cyclone (>= 35 kts)
        neg_indices = np.where(vmax <= 28.0)[0]
        pos_indices = np.where(vmax >= 35.0)[0]

        n_samples = len(neg_indices)
        print(f"      Found {n_samples} non-cyclonic disturbance frames.")

        np.random.seed(42)
        selected_pos_indices = np.random.choice(pos_indices, size=n_samples, replace=False)

        # Sort indices for h5py compliance
        balanced_indices = np.concatenate([neg_indices, selected_pos_indices])
        sorted_indices = np.sort(balanced_indices)

        X_raw = f['matrix'][sorted_indices]
        y_raw = (vmax[sorted_indices] >= 35.0).astype(np.float32).reshape(-1, 1)

    # Shuffle memory arrays after reading
    perm = np.random.permutation(len(sorted_indices))
    X_raw = X_raw[perm]
    y = y_raw[perm]

    print(f"      Balanced Dataset Shape: {X_raw.shape} | Cyclones: {int(np.sum(y))} | Non-Cyclones: {int(len(y) - np.sum(y))}")

    X = clean_and_normalize(X_raw)
    return X, y

def build_stage1_model(input_shape=(201, 201, 4)):
    inputs = layers.Input(shape=input_shape)

    # Block 1
    x = layers.Conv2D(32, (3, 3), padding='same', kernel_initializer='he_normal')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Block 2
    x = layers.Conv2D(64, (3, 3), padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Block 3
    x = layers.Conv2D(128, (3, 3), padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Hybrid Pooling (GAP + GMP)
    gap = layers.GlobalAveragePooling2D()(x)
    gmp = layers.GlobalMaxPooling2D()(x)
    concat = layers.Concatenate()([gap, gmp])

    # Classification Head
    dense = layers.Dense(64, kernel_initializer='he_normal')(concat)
    dense = layers.LeakyReLU(alpha=0.1)(dense)
    dense = layers.Dropout(0.3)(dense)
    outputs = layers.Dense(1, activation='sigmoid')(dense)

    model = models.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=3e-4),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )
    return model

def main():
    X, y = load_balanced_data()

    # Pre-train diagnostic verification
    assert not np.isnan(X).any(), "ERROR: NaN detected in input array X!"
    assert not np.isinf(X).any(), "ERROR: Inf detected in input array X!"
    print(f"      Diagnostic Check Passed: Min={X.min():.2f}, Max={X.max():.2f}, No NaNs.")

    print("[2/4] Splitting balanced dataset into Train and Validation sets...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    model = build_stage1_model(input_shape=X_train.shape[1:])

    cb_list = [
        callbacks.ModelCheckpoint(
            MODEL_SAVE_PATH, monitor='val_auc', mode='max',
            save_best_only=True, verbose=1
        ),
        callbacks.EarlyStopping(
            monitor='val_loss', patience=6, restore_best_weights=True, verbose=1
        )
    ]

    print("[3/4] Training Stage 1 Gatekeeper Model...")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=20,
        batch_size=32,
        callbacks=cb_list,
        shuffle=True
    )

    print(f"\n[SUCCESS] Stage 1 detector model trained and saved to '{MODEL_SAVE_PATH}'.")

if __name__ == '__main__':
    main()