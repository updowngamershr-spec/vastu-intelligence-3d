"""
High-Resolution Vector SVG Diagram & Bar Chart Engine for Vastu Reports
Generates architectural floor plans with Shakti Chakra, 16-Zone Bar Graphs,
45 Devtas Mandala, 32 Entrance Padas, and Panch Tatva Donut charts.
"""

import math
from typing import List, Dict, Any

def generate_shakti_chakra_svg(
    boundary: List[Dict[str, float]],
    rooms: List[Dict[str, Any]],
    entrances: List[Dict[str, Any]],
    fixtures: List[Dict[str, Any]],
    north_angle: float = 0.0,
    width: int = 700,
    height: int = 500
) -> str:
    """Generates crisp SVG of Floor Plan with 16-Directional Shakti Chakra Overlaid."""
    # Compute bounds & centroid
    xs = [p['x'] for p in boundary] if boundary else [100, 600]
    ys = [p['y'] for p in boundary] if boundary else [80, 420]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    
    R = max(max_x - min_x, max_y - min_y) * 0.75

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="{height}" style="max-height:550px; background:#FFFFFF; border-radius:8px; border:1px solid #E2D9C8; font-family:\'Plus Jakarta Sans\', sans-serif;">']
    
    # 1. Background Grid
    svg.append('<defs>')
    svg.append('<pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#F5F2EB" stroke-width="1"/></pattern>')
    svg.append('</defs>')
    svg.append(f'<rect width="{width}" height="{height}" fill="url(#grid)"/>')

    # 2. 16 Directional Zones Shakti Chakra Wedges
    zones = [
        {"id": "N", "deg": 0, "color": "#1E88E5", "name": "N (Water)"},
        {"id": "NNE", "deg": 22.5, "color": "#03A9F4", "name": "NNE"},
        {"id": "NE", "deg": 45, "color": "#00BCD4", "name": "NE (Ishanya)"},
        {"id": "ENE", "deg": 67.5, "color": "#4CAF50", "name": "ENE"},
        {"id": "E", "deg": 90, "color": "#8BC34A", "name": "E (Air)"},
        {"id": "ESE", "deg": 112.5, "color": "#CDDC39", "name": "ESE"},
        {"id": "SE", "deg": 135, "color": "#FF9800", "name": "SE (Fire)"},
        {"id": "SSE", "deg": 157.5, "color": "#FF5722", "name": "SSE"},
        {"id": "S", "deg": 180, "color": "#E91E63", "name": "S (Earth)"},
        {"id": "SSW", "deg": 202.5, "color": "#795548", "name": "SSW"},
        {"id": "SW", "deg": 225, "color": "#FFC107", "name": "SW (Nairutya)"},
        {"id": "WSW", "deg": 247.5, "color": "#9E9E9E", "name": "WSW"},
        {"id": "W", "deg": 270, "color": "#607D8B", "name": "W (Space)"},
        {"id": "WNW", "deg": 292.5, "color": "#B0BEC5", "name": "WNW"},
        {"id": "NW", "deg": 315, "color": "#80CBC4", "name": "NW (Air)"},
        {"id": "NNW", "deg": 337.5, "color": "#26C6DA", "name": "NNW"}
    ]

    rad_offset = math.radians(north_angle)
    for z in zones:
        start_a = math.radians(z['deg'] - 11.25) + rad_offset - math.pi / 2
        end_a = math.radians(z['deg'] + 11.25) + rad_offset - math.pi / 2
        mid_a = math.radians(z['deg']) + rad_offset - math.pi / 2
        
        x1 = cx + R * math.cos(start_a)
        y1 = cy + R * math.sin(start_a)
        x2 = cx + R * math.cos(end_a)
        y2 = cy + R * math.sin(end_a)
        
        path_d = f"M {cx:.1f} {cy:.1f} L {x1:.1f} {y1:.1f} A {R:.1f} {R:.1f} 0 0 1 {x2:.1f} {y2:.1f} Z"
        svg.append(f'<path d="{path_d}" fill="{z["color"]}" fill-opacity="0.12" stroke="{z["color"]}" stroke-opacity="0.35" stroke-width="1"/>')
        
        # Zone label
        lx = cx + (R - 22) * math.cos(mid_a)
        ly = cy + (R - 22) * math.sin(mid_a)
        svg.append(f'<text x="{lx:.1f}" y="{ly:.1f}" font-size="9" font-weight="700" fill="{z["color"]}" text-anchor="middle" dominant-baseline="middle">{z["id"]}</text>')

    # 3. Brahmasthan (Center 1/9th)
    bw = (max_x - min_x) / 3
    bh = (max_y - min_y) / 3
    bx = min_x + bw
    by = min_y + bh
    svg.append(f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bw:.1f}" height="{bh:.1f}" fill="#E5C66D" fill-opacity="0.25" stroke="#C5A059" stroke-width="1.5" stroke-dasharray="4,4"/>')
    svg.append(f'<text x="{bx+bw/2:.1f}" y="{by+bh/2:.1f}" font-size="11" font-weight="700" fill="#571A2A" text-anchor="middle" dominant-baseline="middle">Brahmasthan (ब्रह्मस्थान)</text>')

    # 4. Rooms
    for r in rooms:
        pts = r.get("polygon", [])
        if len(pts) >= 3:
            pts_str = " ".join([f"{p['x']},{p['y']}" for p in pts])
            color = r.get("color", "#F5F5F5")
            svg.append(f'<polygon points="{pts_str}" fill="{color}" fill-opacity="0.8" stroke="#380E1A" stroke-width="2"/>')
            
            # Label
            rcx = sum(p['x'] for p in pts) / len(pts)
            rcy = sum(p['y'] for p in pts) / len(pts)
            svg.append(f'<text x="{rcx:.1f}" y="{rcy-5:.1f}" font-size="11" font-weight="700" fill="#2A2526" text-anchor="middle">{r.get("name", "Room")}</text>')
            svg.append(f'<text x="{rcx:.1f}" y="{rcy+9:.1f}" font-size="9" fill="#665" text-anchor="middle">({r.get("category", "")})</text>')

    # 5. Outer Boundary Wall
    if boundary and len(boundary) >= 3:
        b_pts_str = " ".join([f"{p['x']},{p['y']}" for p in boundary])
        svg.append(f'<polygon points="{b_pts_str}" fill="none" stroke="#2A2526" stroke-width="4"/>')

    # 6. Doors & Fixtures
    for ent in entrances:
        pt = ent.get("point", {"x": min_x, "y": min_y})
        svg.append(f'<circle cx="{pt["x"]:.1f}" cy="{pt["y"]:.1f}" r="8" fill="#2E7D32" stroke="#FFFFFF" stroke-width="2"/>')
        svg.append(f'<text x="{pt["x"]+12:.1f}" y="{pt["y"]+4:.1f}" font-size="10" font-weight="700" fill="#1B5E20">🚪 {ent.get("name", "Door")}</text>')

    for fix in fixtures:
        pt = fix.get("point", {"x": 0, "y": 0})
        ftype = fix.get("type", "")
        if ftype == "stove":
            svg.append(f'<circle cx="{pt["x"]:.1f}" cy="{pt["y"]:.1f}" r="6" fill="#D84315"/>')
            svg.append(f'<text x="{pt["x"]+8:.1f}" y="{pt["y"]+3:.1f}" font-size="9" fill="#BF360C">🔥 Stove</text>')
        elif ftype == "wc":
            svg.append(f'<rect x="{pt["x"]-5:.1f}" y="{pt["y"]-7:.1f}" width="10" height="14" rx="3" fill="#455A64"/>')
            svg.append(f'<text x="{pt["x"]+8:.1f}" y="{pt["y"]+3:.1f}" font-size="9" fill="#37474F">🚽 WC</text>')
        elif ftype == "tank":
            svg.append(f'<circle cx="{pt["x"]:.1f}" cy="{pt["y"]:.1f}" r="7" fill="#0288D1"/>')
            svg.append(f'<text x="{pt["x"]+8:.1f}" y="{pt["y"]+3:.1f}" font-size="9" fill="#01579B">💧 Water</text>')

    # 7. Centroid & True North Rose
    svg.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="5" fill="#C5A059" stroke="#571A2A" stroke-width="2"/>')
    svg.append(f'<text x="{cx:.1f}" y="{cy+14:.1f}" font-size="9" font-weight="700" fill="#571A2A" text-anchor="middle">Brahma Bindu</text>')

    # Compass Arrow top-right
    rose_x, rose_y = width - 50, 50
    svg.append(f'<g transform="translate({rose_x}, {rose_y}) rotate({north_angle})">')
    svg.append('<circle cx="0" cy="0" r="26" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5"/>')
    svg.append('<polygon points="0,-22 5,0 -5,0" fill="#D32F2F"/>')
    svg.append('<polygon points="0,22 5,0 -5,0" fill="#302B2C"/>')
    svg.append('<text x="0" y="-8" font-size="9" font-weight="700" fill="#D32F2F" text-anchor="middle">N</text>')
    svg.append('</g>')

    svg.append('</svg>')
    return "".join(svg)

def generate_16_zone_bar_chart_svg(room_zone_evals: List[Dict[str, Any]], width: int = 700, height: int = 240) -> str:
    """
    Generates MahaVastu-style 16-Zone Area Distribution Bar Chart.
    Shows zone area percentage vs ideal 6.25% line (extended vs cut).
    """
    # 16 zones in classical order
    zone_order = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    colors = {
        "N": "#1E88E5", "NNE": "#03A9F4", "NE": "#00BCD4", "ENE": "#4CAF50",
        "E": "#8BC34A", "ESE": "#CDDC39", "SE": "#FF9800", "SSE": "#FF5722",
        "S": "#E91E63", "SSW": "#795548", "SW": "#FFC107", "WSW": "#9E9E9E",
        "W": "#607D8B", "WNW": "#B0BEC5", "NW": "#80CBC4", "NNW": "#26C6DA"
    }

    # Aggregate area overlap per zone
    zone_totals = {z: 0.0 for z in zone_order}
    for r in room_zone_evals:
        for ov in r.get("overlaps", []):
            zid = ov.get("zone_id")
            if zid in zone_totals:
                zone_totals[zid] += ov.get("percentage", 0.0)

    # Normalize if needed
    sum_tot = sum(zone_totals.values())
    if sum_tot > 0:
        for z in zone_totals:
            zone_totals[z] = round((zone_totals[z] / sum_tot) * 100.0, 1)
    else:
        for z in zone_totals:
            zone_totals[z] = 6.25

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="{height}" style="max-height:420px; background:#FAF8F5; border-radius:8px; border:1px solid #E2D9C8; font-family:\'Plus Jakarta Sans\', sans-serif;">']
    
    # Title
    svg.append(f'<text x="20" y="24" font-size="13" font-weight="700" fill="#571A2A">16-Directional Zone Strength Bar Graph (MahaVastu Elemental Area %)</text>')
    
    chart_y = 45
    chart_h = 140
    bar_w = 28
    gap = (width - 60) / 16.0

    # Ideal average line at 6.25% (normalized)
    max_val = max(15.0, max(zone_totals.values()) * 1.2)
    ideal_y = chart_y + chart_h - (6.25 / max_val) * chart_h
    svg.append(f'<line x1="30" y1="{ideal_y:.1f}" x2="{width-20}" y2="{ideal_y:.1f}" stroke="#D32F2F" stroke-width="1.5" stroke-dasharray="4,4"/>')
    svg.append(f'<text x="{width-25}" y="{ideal_y-4:.1f}" font-size="9" fill="#D32F2F" text-anchor="end" font-weight="700">Ideal Baseline: 6.25%</text>')

    # Baseline axis
    svg.append(f'<line x1="30" y1="{chart_y+chart_h}" x2="{width-20}" y2="{chart_y+chart_h}" stroke="#302B2C" stroke-width="1.5"/>')

    # Bars
    for i, zid in enumerate(zone_order):
        val = zone_totals[zid]
        bar_h = (val / max_val) * chart_h
        bx = 40 + i * gap
        by = chart_y + chart_h - bar_h
        c = colors.get(zid, "#1E88E5")
        
        # Bar rect
        svg.append(f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bar_w}" height="{bar_h:.1f}" fill="{c}" rx="3"/>')
        # Value text on top
        svg.append(f'<text x="{bx+bar_w/2:.1f}" y="{by-4:.1f}" font-size="8.5" font-weight="700" fill="#302B2C" text-anchor="middle">{val}%</text>')
        # Zone ID below
        svg.append(f'<text x="{bx+bar_w/2:.1f}" y="{chart_y+chart_h+16}" font-size="9" font-weight="700" fill="{c}" text-anchor="middle">{zid}</text>')

    svg.append('</svg>')
    return "".join(svg)

def generate_32_entrance_dial_svg(entrance_eval: Dict[str, Any], width: int = 700, height: int = 380) -> str:
    """Generates complete circular perimeter dial of 32 Entrances with active portal highlighted."""
    cx, cy = width / 2, height / 2
    R = 140
    
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="{height}" style="max-height:550px; background:#FFFFFF; border-radius:8px; border:1px solid #E2D9C8; font-family:\'Plus Jakarta Sans\', sans-serif;">']
    svg.append(f'<text x="20" y="24" font-size="13" font-weight="700" fill="#571A2A">32 Entrance Padas Perimeter Dial & Portal Diagnostic</text>')

    # Outer circle
    svg.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="#FAF8F5" stroke="#C5A059" stroke-width="2"/>')
    svg.append(f'<circle cx="{cx}" cy="{cy}" r="{R-35}" fill="#FFFFFF" stroke="#E2D9C8" stroke-width="1"/>')

    active_code = entrance_eval.get("pada_code", "N3") if entrance_eval else "N3"

    # 32 Entrance Codes
    padas = [
        # North: N1-N8
        ("N1", "Roga", False, 320.625), ("N2", "Naga", False, 331.875), ("N3", "Mukhya", True, 343.125),
        ("N4", "Bhallat", True, 354.375), ("N5", "Soma", True, 5.625), ("N6", "Bhujanga", False, 16.875),
        ("N7", "Aditi", False, 28.125), ("N8", "Diti", False, 39.375),
        # East: E1-E8
        ("E1", "Shikhin", False, 50.625), ("E2", "Parjanya", False, 61.875), ("E3", "Jayanta", True, 73.125),
        ("E4", "Indra", True, 84.375), ("E5", "Surya", False, 95.625), ("E6", "Satya", False, 106.875),
        ("E7", "Bhrisha", False, 118.125), ("E8", "Antariksha", False, 129.375),
        # South: S1-S8
        ("S1", "Anila", False, 140.625), ("S2", "Poosha", False, 151.875), ("S3", "Vitatha", False, 163.125),
        ("S4", "Gruhakshat", True, 174.375), ("S5", "Yama", False, 185.625), ("S6", "Gandharva", False, 196.875),
        ("S7", "Bhringaraj", False, 208.125), ("S8", "Mriga", False, 219.375),
        # West: W1-W8
        ("W1", "Pitri", False, 230.625), ("W2", "Dauvarika", False, 241.875), ("W3", "Sugriva", True, 253.125),
        ("W4", "Pushpadanta", True, 264.375), ("W5", "Varuna", False, 275.625), ("W6", "Asura", False, 286.875),
        ("W7", "Shosha", False, 298.125), ("W8", "Papyakshma", False, 309.375)
    ]

    for code, deity, is_ausp, ang in padas:
        rad = math.radians(ang) - math.pi / 2
        px = cx + (R - 18) * math.cos(rad)
        py = cy + (R - 18) * math.sin(rad)
        color = "#2E7D32" if is_ausp else "#C62828"
        is_active = (code == active_code)
        
        if is_active:
            # Highlight active door
            svg.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="12" fill="#FFC107" stroke="#571A2A" stroke-width="2"/>')
            svg.append(f'<text x="{px:.1f}" y="{py+4:.1f}" font-size="9" font-weight="900" fill="#571A2A" text-anchor="middle">{code}</text>')
        else:
            svg.append(f'<text x="{px:.1f}" y="{py+3:.1f}" font-size="7.5" font-weight="700" fill="{color}" text-anchor="middle">{code}</text>')

    # Center Badge
    active_deity = entrance_eval.get("deity", "N/A") if entrance_eval else "Mukhya"
    active_ausp = entrance_eval.get("auspicious", True) if entrance_eval else True
    badge_col = "#2E7D32" if active_ausp else "#C62828"
    status_txt = "Auspicious Entrance (शुभ द्वार)" if active_ausp else "Challenging Entrance (दोषपूर्ण द्वार)"
    
    svg.append(f'<circle cx="{cx}" cy="{cy}" r="45" fill="#FAF8F5" stroke="{badge_col}" stroke-width="2"/>')
    svg.append(f'<text x="{cx}" y="{cy-12}" font-size="12" font-weight="800" fill="#571A2A" text-anchor="middle">{active_code}</text>')
    svg.append(f'<text x="{cx}" y="{cy+4}" font-size="9" font-weight="600" fill="#555" text-anchor="middle">{active_deity}</text>')
    svg.append(f'<text x="{cx}" y="{cy+18}" font-size="7.5" font-weight="700" fill="{badge_col}" text-anchor="middle">{status_txt}</text>')

    svg.append('</svg>')
    return "".join(svg)
