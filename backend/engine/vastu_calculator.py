"""
Master Coordinator Vastu & Engineering Engine on Drive E:
Coordinates Geometry, Ayadi Shadvarga, 45 Devtas, 32 Entrances, and Environmental Physics for Custom House Plans.
"""

from typing import Dict, Any, List
from backend.core.geometry import (
    calculate_centroid,
    compute_zone_intersections,
    calculate_brahmasthan,
    calculate_marmasthan_nodes,
    calculate_entrance_pada
)
from backend.core.orientation import calculate_true_bearing, evaluate_compass_confidence
from backend.core.ayadi_shadvarga import calculate_ayadi_shadvarga
from backend.core.engineering import (
    calculate_solar_daylight_exposure,
    calculate_cross_ventilation_index,
    check_nbc_safety_clearances
)
from backend.data.vastu_knowledge import ZONES_16, ENTRANCE_32, DEVTAS_45
from backend.engine.dosha_evaluator import evaluate_plan_doshas

class CustomVastuCoordinator:
    def __init__(self):
        pass

    def run_full_analysis(self, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        boundary = plan_data.get("boundary", [])
        rooms = plan_data.get("rooms", [])
        entrances = plan_data.get("entrances", [])
        raw_north = float(plan_data.get("north_angle", 0.0))
        declination = float(plan_data.get("magnetic_declination", 0.0))
        length_ft = float(plan_data.get("length_feet", 40.0))
        width_ft = float(plan_data.get("width_feet", 30.0))

        # 1. Centroid & True North
        cx, cy = calculate_centroid(boundary)
        true_north = calculate_true_bearing(raw_north, declination)
        compass_eval = evaluate_compass_confidence("custom_draw", False)

        # 2. Brahmasthan & Marmasthan
        brahma_data = calculate_brahmasthan(boundary)
        xs = [p['x'] for p in boundary] if boundary else [0, 800]
        ys = [p['y'] for p in boundary] if boundary else [0, 600]
        bounds = (min(xs), min(ys), max(xs), max(ys))
        marma_nodes = calculate_marmasthan_nodes(cx, cy, bounds)

        # 3. Room-by-room zone intersections
        room_zone_evals = []
        for r in rooms:
            poly_pts = r.get("polygon", [])
            overlaps = compute_zone_intersections(poly_pts, cx, cy, true_north, ZONES_16)
            room_zone_evals.append({
                "room": r,
                "overlaps": overlaps,
                "dominant_zone": overlaps[0]['zone_id'] if overlaps else "Unknown",
                "dominant_zone_name": overlaps[0]['zone_name_en'] if overlaps else "Unknown"
            })

        # 4. Main Entrance Evaluation
        entrance_eval = None
        if entrances:
            main_door = entrances[0]
            door_pt = main_door.get("point", {"x": boundary[0]['x'] if boundary else 0, "y": boundary[0]['y'] if boundary else 0})
            entrance_eval = calculate_entrance_pada(door_pt, cx, cy, true_north, ENTRANCE_32)

        # 5. Ayadi Shadvarga Calculations
        ayadi_report = calculate_ayadi_shadvarga(length_ft, width_ft)

        # 6. Dosha Evaluation
        dosha_report = evaluate_plan_doshas(room_zone_evals, entrance_eval, brahma_data)

        # 7. Environmental Engineering (Solar & Ventilation)
        solar_analysis = calculate_solar_daylight_exposure(rooms, north_bearing=true_north)
        vent_analysis = calculate_cross_ventilation_index(rooms)
        nbc_checks = check_nbc_safety_clearances(rooms, length_ft * width_ft)

        return {
            "project_meta": {
                "id": plan_data.get("id", "CUSTOM_HOUSE_001"),
                "name": plan_data.get("name", "Custom House Project"),
                "client": plan_data.get("client", "Self House Owner"),
                "address": plan_data.get("address", "India"),
                "north_angle": raw_north,
                "magnetic_declination": declination,
                "true_north": true_north,
                "length_feet": length_ft,
                "width_feet": width_ft,
                "centroid": {"x": round(cx, 1), "y": round(cy, 1)},
                "bounds": {"min_x": bounds[0], "min_y": bounds[1], "max_x": bounds[2], "max_y": bounds[3]},
                "compass_confidence": compass_eval
            },
            "ayadi_shadvarga": ayadi_report,
            "traditional_vastu": {
                "vastu_index": dosha_report["vastu_index"],
                "high_priority_count": dosha_report["high_priority_count"],
                "moderate_priority_count": dosha_report["moderate_priority_count"],
                "auspicious_count": dosha_report["auspicious_count"],
                "total_findings": dosha_report["total_evaluated"],
                "findings": dosha_report["findings"],
                "room_zone_evals": room_zone_evals,
                "entrance_eval": entrance_eval,
                "brahmasthan": brahma_data,
                "marmasthan_nodes": marma_nodes,
                "zones_16": ZONES_16,
                "devtas_45": DEVTAS_45
            },
            "environmental_engineering": {
                "daylight_efficiency_score": solar_analysis["daylight_efficiency_score"],
                "cross_ventilation_index": vent_analysis["cross_ventilation_index"],
                "solar_diagnostics": solar_analysis,
                "ventilation_diagnostics": vent_analysis,
                "nbc_checks": nbc_checks
            }
        }
