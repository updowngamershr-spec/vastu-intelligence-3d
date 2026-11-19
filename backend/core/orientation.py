"""
Compass Orientation & Geodetic Alignment on Drive E:
Computes True North from Magnetic Compass Bearing and Local Magnetic Declination.
"""

from typing import Dict, Any

def calculate_true_bearing(magnetic_bearing: float, declination: float) -> float:
    """Computes True North bearing using NOAA standard convention."""
    return round((magnetic_bearing + declination) % 360.0, 2)

def evaluate_compass_confidence(sensor_type: str, metal_detected: bool) -> Dict[str, Any]:
    score = 100
    notes = []
    if sensor_type.lower() == "smartphone":
        score -= 20
        notes.append("Smartphone compass subject to local soft-iron distortion.")
    elif sensor_type.lower() == "custom_draw":
        score = 95
        notes.append("Manual geometric alignment with architectural site plan.")
    if metal_detected:
        score -= 30
        notes.append("RCC rebar reinforcement detected. External physical sighting recommended.")
    return {
        "confidence_score": max(score, 15),
        "status": "High" if score >= 80 else ("Moderate" if score >= 50 else "Verification Recommended"),
        "notes": notes
    }
