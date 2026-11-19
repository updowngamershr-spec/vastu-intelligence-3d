"""
High-Precision Geometry & Vastu Polygon Engine on Drive E:
Powered by Shapely and NumPy for exact custom house plan calculations.
"""

import math
from typing import List, Dict, Tuple, Any
from shapely.geometry import Polygon, Point, LineString
import numpy as np

def calculate_centroid(boundary_points: List[Dict[str, float]]) -> Tuple[float, float]:
    """Computes exact geometric center (Brahma Bindu) of any custom convex or concave polygon."""
    if not boundary_points or len(boundary_points) < 3:
        return (400.0, 300.0)
    coords = [(p['x'], p['y']) for p in boundary_points]
    poly = Polygon(coords)
    if not poly.is_valid:
        poly = poly.buffer(0)
    c = poly.centroid
    return (float(c.x), float(c.y))

def create_angular_wedge(cx: float, cy: float, start_deg: float, end_deg: float, radius: float = 3000.0) -> Polygon:
    """
    Creates an angular wedge sector polygon originating from (cx, cy).
    Compass coordinates: 0° is North (up), 90° East (right), 180° South (down), 270° West (left).
    """
    num_steps = 15
    if end_deg < start_deg:
        end_deg += 360.0
    
    angles = np.linspace(start_deg, end_deg, num_steps)
    points = [(cx, cy)]
    for a in angles:
        rad = math.radians(a)
        px = cx + radius * math.sin(rad)
        py = cy - radius * math.cos(rad)
        points.append((px, py))
    points.append((cx, cy))
    return Polygon(points)

def compute_zone_intersections(
    room_polygon_points: List[Dict[str, float]],
    cx: float,
    cy: float,
    north_bearing: float,
    zones_16: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Computes precise percentage area overlap of a custom room polygon across all 16 directional zones.
    """
    if not room_polygon_points or len(room_polygon_points) < 3:
        return []
        
    room_coords = [(p['x'], p['y']) for p in room_polygon_points]
    room_poly = Polygon(room_coords)
    if not room_poly.is_valid:
        room_poly = room_poly.buffer(0)
    
    total_area = room_poly.area
    if total_area <= 0:
        return []
    
    overlaps = []
    
    for z in zones_16:
        calibrated_start = (z['start_deg'] + north_bearing) % 360.0
        calibrated_end = (z['end_deg'] + north_bearing) % 360.0
        
        wedge_poly = create_angular_wedge(cx, cy, calibrated_start, calibrated_end)
        
        try:
            intersection = room_poly.intersection(wedge_poly)
            if not intersection.is_empty:
                overlap_area = intersection.area
                pct = (overlap_area / total_area) * 100.0
                if pct >= 1.0: # Ignore sub-percent fragments
                    overlaps.append({
                        "zone_id": z['id'],
                        "zone_name_en": z['name_en'],
                        "zone_name_hi": z['name_hi'],
                        "zone_name_gu": z.get('name_gu', z['name_hi']),
                        "overlap_area": round(overlap_area, 2),
                        "percentage": round(pct, 1),
                        "element": z['element'],
                        "element_color": z['element_color']
                    })
        except Exception:
            continue
            
    overlaps.sort(key=lambda x: x['percentage'], reverse=True)
    return overlaps

def calculate_brahmasthan(boundary_points: List[Dict[str, float]]) -> Dict[str, Any]:
    """Computes central 1/9th area (Brahmasthan) of custom house boundary."""
    coords = [(p['x'], p['y']) for p in boundary_points]
    poly = Polygon(coords)
    minx, miny, maxx, maxy = poly.bounds
    width = maxx - minx
    height = maxy - miny
    
    bw = width / 3.0
    bh = height / 3.0
    bx1 = minx + (width - bw) / 2.0
    by1 = miny + (height - bh) / 2.0
    bx2 = bx1 + bw
    by2 = by1 + bh
    
    brahma_poly = Polygon([(bx1, by1), (bx2, by1), (bx2, by2), (bx1, by2)])
    clipped = brahma_poly.intersection(poly)
    
    return {
        "box": {"x1": bx1, "y1": by1, "x2": bx2, "y2": by2},
        "area": round(clipped.area if not clipped.is_empty else brahma_poly.area, 2),
        "percentage_of_total": round((brahma_poly.area / max(1, poly.area)) * 100.0, 1)
    }

def calculate_marmasthan_nodes(cx: float, cy: float, bounds: Tuple[float, float, float, float]) -> List[Dict[str, Any]]:
    """Calculates classical diagonal Karna Sutras and intersection nodes."""
    minx, miny, maxx, maxy = bounds
    w = maxx - minx
    h = maxy - miny
    nodes = [
        {"type": "Primary Diagonal NE-SW", "p1": {"x": minx, "y": miny}, "p2": {"x": maxx, "y": maxy}},
        {"type": "Primary Diagonal NW-SE", "p1": {"x": maxx, "y": miny}, "p2": {"x": minx, "y": maxy}},
        {"type": "Brahma Bindu (Epicenter)", "p1": {"x": cx, "y": cy}, "p2": {"x": cx, "y": cy}}
    ]
    step_x = w / 9.0
    step_y = h / 9.0
    for i in [3, 6]:
        for j in [3, 6]:
            nodes.append({
                "type": f"Mahamarma Intersection ({i},{j})",
                "point": {"x": minx + i * step_x, "y": miny + j * step_y}
            })
    return nodes

def calculate_entrance_pada(
    door_point: Dict[str, float],
    cx: float,
    cy: float,
    north_bearing: float,
    entrance_32_list: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Calculates exact 32 entrance pada for any door coordinate placed on custom plan."""
    dx = door_point['x'] - cx
    dy = door_point['y'] - cy
    
    rad = math.atan2(dx, -dy)
    compass_deg = math.degrees(rad)
    if compass_deg < 0:
        compass_deg += 360.0
        
    calibrated_angle = (compass_deg - north_bearing) % 360.0
    step = 360.0 / 32.0 # 11.25 degrees each
    
    if 45.0 <= calibrated_angle < 135.0:
        idx = min(max(int((calibrated_angle - 45.0) / step), 0), 7)
        pada = entrance_32_list[idx] # E1-E8
    elif 135.0 <= calibrated_angle < 225.0:
        idx = min(max(int((calibrated_angle - 135.0) / step), 0), 7)
        pada = entrance_32_list[8 + idx] # S1-S8
    elif 225.0 <= calibrated_angle < 315.0:
        idx = min(max(int((calibrated_angle - 225.0) / step), 0), 7)
        pada = entrance_32_list[16 + idx] # W1-W8
    else:
        norm_ang = (calibrated_angle - 315.0) if calibrated_angle >= 315.0 else (calibrated_angle + 45.0)
        idx = min(max(int(norm_ang / step), 0), 7)
        pada = entrance_32_list[24 + idx] # N1-N8
        
    return {
        "door_point": door_point,
        "calibrated_angle": round(calibrated_angle, 2),
        "pada_code": pada['code'],
        "deity": pada['deity'],
        "direction": pada['direction'],
        "auspicious": pada['auspicious'],
        "effect_en": pada['effect_en'],
        "effect_hi": pada['effect_hi'],
        "effect_gu": pada.get('effect_gu', pada['effect_hi'])
    }
