import os
import h5py
import numpy as np
from PIL import Image

INPUT_DIR = 'data/raw/negatives_src'
OUTPUT_H5 = 'data/raw/negative_data_balanced.h5'
TARGET_SIZE = (201, 201)

def calibrate_to_satellite_channels(img_gray):
    """
    Transforms a 2D grayscale array (0-255) into a 4-channel tensor matching 
    TCIR physical sensor units (IR1, WV, VIS, PMW).
    """
    # Normalize input image to range 0.0 - 1.0
    norm = img_gray.astype(np.float32) / 255.0

    # Channel 0: IR1 (Thermal) -> Inverted scale: Bright clouds = 180K, Dark ocean = 300K
    ch_ir1 = 300.0 - (norm * 120.0)

    # Channel 1: WV (Water Vapor) -> Scale to 210K - 260K
    ch_wv = 210.0 + (norm * 50.0)

    # Channel 2: VIS (Visible Reflectance) -> Scale to 0.0 - 1.0
    ch_vis = norm

    # Channel 3: PMW (Microwave Brightness Temp) -> Scale to 150K - 280K
    ch_pmw = 150.0 + (norm * 130.0)

    # Stack into shape (201, 201, 4)
    return np.stack([ch_ir1, ch_wv, ch_vis, ch_pmw], axis=-1)

def load_and_transform_image(img_path):
    """Loads image, converts to grayscale, resizes, and applies channel calibration."""
    img = Image.open(img_path).convert('L')  # Convert to single-channel Grayscale
    img = img.resize(TARGET_SIZE, Image.Resampling.BILINEAR)
    img_arr = np.array(img)
    
    return calibrate_to_satellite_channels(img_arr)

def augment_tensor(img):
    """Generates 8 spatial rotations and flips per image tensor."""
    augmented = []
    for k in range(4):  # 0°, 90°, 180°, 270° rotations
        rot = np.rot90(img, k, axes=(0, 1))
        augmented.append(rot)
        augmented.append(np.fliplr(rot))
    return augmented

def main():
    valid_exts = ('.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp')
    file_list = sorted([
        os.path.join(INPUT_DIR, f) for f in os.listdir(INPUT_DIR)
        if f.lower().endswith(valid_exts)
    ])

    if not file_list:
        raise FileNotFoundError(f"No images found inside '{INPUT_DIR}'.")

    print(f"[1/3] Converting {len(file_list)} images into 4-channel satellite tensors...")
    raw_negatives = [load_and_transform_image(fp) for fp in file_list]

    print("[2/3] Performing 8-fold geometric augmentation...")
    augmented_list = []
    for sample in raw_negatives:
        augmented_list.extend(augment_tensor(sample))

    X_neg_balanced = np.array(augmented_list, dtype=np.float32)
    print(f"      Calibrated Negative Data Shape: {X_neg_balanced.shape}")

    print(f"[3/3] Saving calibrated dataset to '{OUTPUT_H5}'...")
    os.makedirs('data/raw', exist_ok=True)
    with h5py.File(OUTPUT_H5, 'w') as f_out:
        f_out.create_dataset('matrix', data=X_neg_balanced, compression='gzip')

    print(f"\n[SUCCESS] Saved {len(X_neg_balanced)} calibrated satellite tensors.")

if __name__ == '__main__':
    main()