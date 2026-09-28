import numpy as np
import os
import sys

# Ensure stage3 module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from stage3.trajectory import (
        derive_convective_centroid_motion,
        build_past_sequence_from_motion
    )
except ImportError:
    print("❌ ERROR: Could not import stage3.trajectory! Ensure stage3/trajectory.py exists.")
    sys.exit(1)

def run_verification_tests():
    print("=" * 60)
    print(" 🧪 RUNNING STAGE 3 TRAJECTORY VALIDATION SUITE")
    print("=" * 60)

    # 1. GENERATE SYNTHETIC TEST SATELLITE TENSORS (201x201x4)
    # Image A: Deep cold clouds in North-East quadrant
    img_A = np.full((201, 201, 4), 280.0, dtype=np.float32)
    img_A[20:80, 120:180, 0] = 190.0  # Cold convective patch

    # Image B: Deep cold clouds in South-West quadrant
    img_B = np.full((201, 201, 4), 280.0, dtype=np.float32)
    img_B[120:180, 20:80, 0] = 190.0  # Cold convective patch

    results = []

    # ------------------------------------------------------------------
    # TEST 1: DETERMINISM TEST (Same image must give exact same path)
    # ------------------------------------------------------------------
    h1, s1, c1 = derive_convective_centroid_motion(img_A, vmax=60.0)
    h2, s2, c2 = derive_convective_centroid_motion(img_A, vmax=60.0)

    if h1 == h2 and s1 == s2 and c1 == c2:
        print("✅ TEST 1 PASSED: Determinism Verified (100% Reproducible Output)")
        results.append(True)
    else:
        print("❌ TEST 1 FAILED: Non-deterministic random outputs detected!")
        results.append(False)

    # ------------------------------------------------------------------
    # TEST 2: SPATIAL ROTATION TEST (Flipping image 180° must reverse vector)
    # ------------------------------------------------------------------
    img_A_flipped = np.rot90(img_A, 2)  # Rotate 180 degrees
    h_flipped, _, _ = derive_convective_centroid_motion(img_A_flipped, vmax=60.0)

    # Difference should be ~180 degrees
    heading_diff = abs((h1 - h_flipped + 180) % 360 - 180)
    
    if abs(heading_diff - 180.0) < 2.0:
        print(f"✅ TEST 2 PASSED: Physics Grounding Verified (Heading flipped by {abs(h1 - h_flipped):.1f}° on 180° rotation)")
        results.append(True)
    else:
        print(f"❌ TEST 2 FAILED: Image rotation did not properly update direction! Delta: {heading_diff:.1f}°")
        results.append(False)

    # ------------------------------------------------------------------
    # TEST 3: DYNAMIC VARIABILITY TEST (Different images must give different paths)
    # ------------------------------------------------------------------
    h_B, s_B, _ = derive_convective_centroid_motion(img_B, vmax=60.0)

    if abs(h1 - h_B) > 30.0:
        print(f"✅ TEST 3 PASSED: Dynamic Sensitivity Verified (Image A Heading: {h1:.1f}°, Image B Heading: {h_B:.1f}°)")
        results.append(True)
    else:
        print("❌ TEST 3 FAILED: Model produced nearly identical outputs for distinct cloud shapes!")
        results.append(False)

    # ------------------------------------------------------------------
    # FINAL VERDICT
    # ------------------------------------------------------------------
    print("=" * 60)
    if all(results):
        print(" 🎉 OVERALL STATUS: ALL TESTS PASSED! YOUR MODEL IS WORKING CORRECTLY.")
    else:
        print(" ⚠️ OVERALL STATUS: VERIFICATION FAILED. CHECK LOGS ABOVE.")
    print("=" * 60)

if __name__ == "__main__":
    run_verification_tests()