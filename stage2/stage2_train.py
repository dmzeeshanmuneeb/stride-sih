import os
import h5py
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_H5 = os.path.join(BASE_DIR, 'data', 'raw', 'TCIR-ALL_2017.h5')
MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'stage2_intensity_regressor.h5')
STATS_SAVE_PATH = os.path.join(BASE_DIR, 'stage2_stats.npz')

def clean_and_normalize(X):
    """Sanitizes missing satellite values (-9999, NaNs) and computes Z-score stats."""
    print("      Sanitizing sensor noise and applying Z-score normalization...")
    X_clean = np.zeros_like(X, dtype=np.float32)

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

        invalid_mask = (ch < c_min) | (ch > c_max) | np.isnan(ch) | np.isinf(ch)
        ch[invalid_mask] = np.nan

        ch_mean = float(np.nanmean(ch)) if not np.all(np.isnan(ch)) else 0.0
        ch_std = float(np.nanstd(ch)) if not np.all(np.isnan(ch)) else 1.0
        if ch_std < 1e-5:
            ch_std = 1.0

        means.append(ch_mean)
        stds.append(ch_std)

        ch = np.nan_to_num(ch, nan=ch_mean)
        X_clean[:, :, :, c] = (ch - ch_mean) / ch_std

    X_clean = np.nan_to_num(X_clean, nan=0.0, posinf=0.0, neginf=0.0)
    np.savez(STATS_SAVE_PATH, means=means, stds=stds)
    print(f"      Saved Stage 2 normalization stats to '{STATS_SAVE_PATH}'.")
    return X_clean

def load_cyclone_intensity_data():
    """Extracts active cyclone frames (Vmax >= 35 kts) for intensity learning."""
    print("[1/4] Extracting cyclone intensity samples from TCIR-ALL_2017.h5...")
    with h5py.File(DATA_H5, 'r') as f:
        cols = [col.decode('utf-8').strip().lower() for col in f['info/block0_items'][:]]
        df = pd.DataFrame(f['info/block0_values'][:], columns=cols)
        vmax_col = [c for c in df.columns if 'vmax' in c][0]
        vmax = df[vmax_col].values

        cyclone_indices = np.where(vmax >= 35.0)[0]
        sorted_indices = np.sort(cyclone_indices)

        X_raw = f['matrix'][sorted_indices]
        vmax_selected = vmax[sorted_indices].astype(np.float32).reshape(-1, 1)

    perm = np.random.permutation(len(sorted_indices))
    X_raw = X_raw[perm]
    y = vmax_selected[perm]

    print(f"      Extracted {len(y)} cyclone frames | Min Vmax: {y.min():.1f} kts | Max Vmax: {y.max():.1f} kts")

    X = clean_and_normalize(X_raw)
    return X, y

def build_stage2_regressor(input_shape=(201, 201, 4)):
    inputs = layers.Input(shape=input_shape)

    # Rotational and Spatial Data Augmentation for Satellite Symmetry
    aug = layers.RandomFlip("horizontal_and_vertical")(inputs)
    aug = layers.RandomRotation(0.25)(aug)

    # Block 1
    x = layers.Conv2D(32, (3, 3), padding='same', kernel_initializer='he_normal')(aug)
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

    # Block 4
    x = layers.Conv2D(256, (3, 3), padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Feature Fusion
    gap = layers.GlobalAveragePooling2D()(x)
    gmp = layers.GlobalMaxPooling2D()(x)
    concat = layers.Concatenate()([gap, gmp])

    # Dense Regressor
    dense = layers.Dense(128, kernel_initializer='he_normal')(concat)
    dense = layers.LeakyReLU(alpha=0.1)(dense)
    dense = layers.Dropout(0.3)(dense)
    outputs = layers.Dense(1, activation='linear')(dense)

    model = models.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=4e-4),
        loss=tf.keras.losses.Huber(delta=5.0), # Robust loss function
        metrics=['mae', tf.keras.metrics.RootMeanSquaredError(name='rmse')]
    )
    return model

def classify_vmax(v_array):
    """Maps continuous Vmax values into Low, Medium, High categories."""
    categories = []
    for v in v_array.flatten():
        if v < 50.0:
            categories.append(0) # LOW
        elif v < 75.0:
            categories.append(1) # MEDIUM
        else:
            categories.append(2) # HIGH
    return np.array(categories)

def main():
    X, y = load_cyclone_intensity_data()

    print("[2/4] Splitting dataset into Train and Validation sets...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    model = build_stage2_regressor(input_shape=X_train.shape[1:])

    cb_list = [
        callbacks.ModelCheckpoint(
            MODEL_SAVE_PATH, monitor='val_mae', mode='min',
            save_best_only=True, verbose=1
        ),
        callbacks.EarlyStopping(
            monitor='val_loss', patience=10, restore_best_weights=True, verbose=1
        )
    ]

    print("[3/4] Training High-Precision Stage 2 Regressor...")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=35,
        batch_size=32,
        callbacks=cb_list,
        shuffle=True
    )

    # Evaluate mapped 3-Class Categorical Accuracy
    print("\n[4/4] Evaluating mapped 3-Class (Low / Medium / High) Accuracy...")
    val_preds = model.predict(X_val)
    
    y_val_cat = classify_vmax(y_val)
    pred_cat = classify_vmax(val_preds)
    
    cat_accuracy = np.mean(y_val_cat == pred_cat) * 100.0
    val_mae = np.mean(np.abs(y_val.flatten() - val_preds.flatten()))

    print(f"      Validation MAE: {val_mae:.2f} knots")
    print(f"      Mapped 3-Class Accuracy (Low/Med/High): {cat_accuracy:.2f}%")
    print(f"\n[SUCCESS] Stage 2 model saved to '{MODEL_SAVE_PATH}'.")

if __name__ == '__main__':
    main()