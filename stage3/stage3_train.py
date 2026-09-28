import os
import numpy as np
import tensorflow as tf

# Import model architecture builder from helper module
try:
    from stage3.trajectory import build_seq2seq_trajectory_model
except ModuleNotFoundError:
    from trajectory import build_seq2seq_trajectory_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'stage3_seq2seq_trajectory.h5')


def generate_meteorological_dataset(num_samples=12000):
    """
    Synthesizes realistic North Indian Ocean cyclone trajectory topologies:
    1. Straight West-Northwest (WNW) tracks (Bay of Bengal towards AP/Odisha).
    2. Recurving Parabolic tracks (West -> North -> North-East towards West Bengal/Bangladesh).
    3. Slow-moving Equatorial / Zonal tracks (towards Tamil Nadu).
    """
    np.random.seed(42)
    X = np.zeros((num_samples, 4, 4), dtype=np.float32)   # Shape: (N, 4_timesteps, 4_features)
    Y = np.zeros((num_samples, 12, 2), dtype=np.float32)  # Shape: (N, 12_forecast_steps, 2_deltas)

    for i in range(num_samples):
        # Determine track category: 50% WNW, 35% Recurving, 15% Straight West
        track_type = np.random.choice(['wnw', 'recurve', 'west'], p=[0.50, 0.35, 0.15])
        
        # Base storm parameters
        vmax_0 = np.random.uniform(35.0, 110.0)  # Initial Vmax in knots
        base_speed = np.random.uniform(7.0, 18.0) # Base forward speed in knots
        
        # Convert base speed to 6h degree displacement (~111 km/deg)
        base_deg_6h = (base_speed * 1.852 * 6.0) / 111.0

        # Base headings in radians (0 = N, pi/2 = E, pi = S, 3pi/2 = W)
        if track_type == 'wnw':
            base_heading = np.radians(np.random.uniform(285, 315))
        elif track_type == 'recurve':
            base_heading = np.radians(np.random.uniform(270, 295))
        else:
            base_heading = np.radians(np.random.uniform(255, 275))

        # --- 1. HISTORICAL SEQUENCE X (t = -18h, -12h, -6h, 0h) ---
        for t in range(4):
            hist_factor = 0.82 + (0.06 * t)
            noise_lat = np.random.normal(0, 0.015)
            noise_lon = np.random.normal(0, 0.015)
            
            dlat = (base_deg_6h * hist_factor * np.cos(base_heading)) + noise_lat
            dlon = (base_deg_6h * hist_factor * np.sin(base_heading)) + noise_lon
            vmax_t = max(25.0, vmax_0 - (3 - t) * np.random.uniform(1.0, 3.0))
            pmin_t = 1013.25 - (vmax_t * 0.72)

            X[i, t] = [dlat, dlon, vmax_t, pmin_t]

        # --- 2. FUTURE TARGET SEQUENCE Y (12 steps: +6h to +72h) ---
        current_heading = base_heading
        
        for step in range(12):
            # Recurvature mechanics: heading shifts clockwise (towards North/North-East) over time
            if track_type == 'recurve' and step >= 3:
                turn_rate = np.radians(np.random.uniform(3.0, 7.0)) # Turning rate per 6h
                current_heading += turn_rate
            elif track_type == 'wnw':
                turn_rate = np.radians(np.random.uniform(-1.0, 1.5))
                current_heading += turn_rate

            # Speed acceleration in higher latitudes
            speed_multiplier = 1.0 + (step * 0.025)
            step_deg = base_deg_6h * speed_multiplier
            
            step_noise_lat = np.random.normal(0, 0.02)
            step_noise_lon = np.random.normal(0, 0.02)

            fut_dlat = (step_deg * np.cos(current_heading)) + step_noise_lat
            fut_dlon = (step_deg * np.sin(current_heading)) + step_noise_lon

            Y[i, step] = [fut_dlat, fut_dlon]

    return X, Y


def train_enhanced_seq2seq():
    print("=" * 60)
    print("STAGE 3: TRAINING ENHANCED SEQ2SEQ TRAJECTORY MODEL")
    print("=" * 60)

    # 1. Synthesize Dataset
    print("\n[1/4] Generating 12,000 meteorological trajectory patterns...")
    X_train, Y_train = generate_meteorological_dataset(num_samples=12000)
    print(f"      Input Tensor Shape  (X): {X_train.shape}")
    print(f"      Target Tensor Shape (Y): {Y_train.shape}")

    # 2. Build Model Architecture
    print("\n[2/4] Building Encoder-Decoder LSTM Architecture...")
    model = build_seq2seq_trajectory_model(input_timesteps=4, feature_dim=4, forecast_steps=12)

    # Compile with Huber Loss (smooth L1 loss, highly robust against trajectory outliers)
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    model.compile(optimizer=optimizer, loss=tf.keras.losses.Huber(), metrics=['mae', 'mse'])

    # 3. Callbacks for High Performance Training
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', 
            patience=5, 
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', 
            factor=0.5, 
            patience=2, 
            min_lr=1e-5,
            verbose=1
        )
    ]

    # 4. Train Model
    print("\n[3/4] Fitting Model with EarlyStopping & ReduceLROnPlateau...")
    history = model.fit(
        X_train, Y_train,
        epochs=25,
        batch_size=64,
        validation_split=0.2,
        callbacks=callbacks,
        verbose=1
    )

    # 5. Save Model
    print("\n[4/4] Saving Weights to File...")
    model.save(MODEL_SAVE_PATH)
    
    val_mae = history.history['val_mae'][-1]
    approx_km_error = val_mae * 111.0
    
    print("\n" + "=" * 60)
    print(f"SUCCESS: Model saved to: {MODEL_SAVE_PATH}")
    print(f"Final Validation MAE: {val_mae:.4f}° (~{approx_km_error:.1f} km mean step error)")
    print("=" * 60)


if __name__ == "__main__":
    train_enhanced_seq2seq()