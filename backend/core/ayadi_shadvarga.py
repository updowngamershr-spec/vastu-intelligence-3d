"""
Ayadi Shadvarga Classical Calculation Engine
Authentic mathematical formulas from Manasara (Ch. 9) and Samarangana Sutradhara (Ch. 12).
Evaluates building dimensional resonance, wealth ratio, directional Yoni, and longevity.
"""

from typing import Dict, Any

YONI_NAMES = {
    1: {"name": "Dhwaja (Flag / Indra)", "direction": "East", "nature": "Highly Auspicious", "score": 100},
    2: {"name": "Dhumra (Smoke)", "direction": "South-East", "nature": "Inauspicious", "score": 20},
    3: {"name": "Simha (Lion)", "direction": "South", "nature": "Auspicious (Bravery & Power)", "score": 90},
    4: {"name": "Svana (Dog)", "direction": "South-West", "nature": "Inauspicious", "score": 15},
    5: {"name": "Vrishabha (Bull)", "direction": "West", "nature": "Highly Auspicious (Wealth & Stability)", "score": 95},
    6: {"name": "Khara (Donkey)", "direction": "North-West", "nature": "Inauspicious", "score": 25},
    7: {"name": "Gaja (Elephant)", "direction": "North", "nature": "Highly Auspicious (Abundance & Wisdom)", "score": 100},
    8: {"name": "Kaka (Crow)", "direction": "North-East", "nature": "Inauspicious", "score": 10}
}

VARA_NAMES = {
    1: {"name": "Ravivara (Sunday)", "planet": "Sun", "nature": "Moderate"},
    2: {"name": "Somavara (Monday)", "planet": "Moon", "nature": "Auspicious"},
    3: {"name": "Mangalavara (Tuesday)", "planet": "Mars", "nature": "Challenging"},
    4: {"name": "Budhavara (Wednesday)", "planet": "Mercury", "nature": "Auspicious"},
    5: {"name": "Guruvara (Thursday)", "planet": "Jupiter", "nature": "Highly Auspicious"},
    6: {"name": "Shukravara (Friday)", "planet": "Venus", "nature": "Highly Auspicious"},
    7: {"name": "Shanivara (Saturday)", "planet": "Saturn", "nature": "Moderate / Slow"}
}

NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
    "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
    "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
    "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati"
]

def calculate_ayadi_shadvarga(length_feet: float, width_feet: float) -> Dict[str, Any]:
    """
    Computes classical Ayadi parameters from building perimeter or area.
    Formula uses Area (A = Length * Width in standard units).
    """
    area = round(length_feet * width_feet, 2)
    A_int = int(round(area))
    if A_int <= 0:
        A_int = 100

    # 1. Aya (Income / Dhana): (Area * 8) % 12 (1 to 12)
    rem_aya = (A_int * 8) % 12
    aya = 12 if rem_aya == 0 else rem_aya

    # 2. Vyaya (Expenditure / Rina): (Area * 9) % 10 (1 to 10)
    rem_vyaya = (A_int * 9) % 10
    vyaya = 10 if rem_vyaya == 0 else rem_vyaya

    # 3. Yoni (Directional Energy): (Area * 3) % 8 (1 to 8)
    rem_yoni = (A_int * 3) % 8
    yoni_num = 8 if rem_yoni == 0 else rem_yoni
    yoni_info = YONI_NAMES.get(yoni_num, YONI_NAMES[1])

    # 4. Vara (Day): (Area * 9) % 7 (1 to 7)
    rem_vara = (A_int * 9) % 7
    vara_num = 7 if rem_vara == 0 else rem_vara
    vara_info = VARA_NAMES.get(vara_num, VARA_NAMES[5])

    # 5. Nakshatra: (Area * 8) % 27 (1 to 27)
    rem_nak = (A_int * 8) % 27
    nak_num = 27 if rem_nak == 0 else rem_nak
    nak_name = NAKSHATRA_NAMES[(nak_num - 1) % 27]

    # 6. Ayu (Longevity in years): (Area * 27) % 100 (1 to 100)
    rem_ayu = (A_int * 27) % 100
    ayu = 100 if rem_ayu == 0 else rem_ayu

    # Harmony Analysis
    wealth_balance = "Positive (Aya > Vyaya - Financial Growth)" if aya > vyaya else ("Challenging (Vyaya >= Aya - Expense Prone)" if vyaya > aya else "Neutral (Aya == Vyaya)")
    is_yoni_auspicious = yoni_num in [1, 3, 5, 7] # Odd Yonis are auspicious
    
    score = 70
    if aya > vyaya: score += 15
    else: score -= 15
    if is_yoni_auspicious: score += 15
    else: score -= 15

    return {
        "dimensions": {"length_feet": length_feet, "width_feet": width_feet, "total_area_sqft": area},
        "aya_income": aya,
        "vyaya_expenditure": vyaya,
        "wealth_verdict": wealth_balance,
        "yoni_number": yoni_num,
        "yoni_name": yoni_info["name"],
        "yoni_direction": yoni_info["direction"],
        "yoni_auspicious": is_yoni_auspicious,
        "vara_day": vara_info["name"],
        "vara_planet": vara_info["planet"],
        "nakshatra": nak_name,
        "nakshatra_number": nak_num,
        "ayu_years": ayu,
        "ayadi_harmony_score": max(20, min(98, score))
    }
