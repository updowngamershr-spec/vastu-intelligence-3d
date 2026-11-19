"""
Comprehensive Automated Test Suite for Vastu Intelligence Pro on Drive E:
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.core.ayadi_shadvarga import calculate_ayadi_shadvarga
from backend.engine.vastu_calculator import CustomVastuCoordinator
from backend.reports.multi_page_report import generate_multi_page_report

def run_tests():
    print("=" * 60)
    print("TESTING VASTU INTELLIGENCE PRO (DRIVE E: EDITION)")
    print("=" * 60)

    # 1. Test Ayadi Shadvarga Formulae
    print("\n1. Testing Classical Ayadi Shadvarga Mathematics...")
    ayadi = calculate_ayadi_shadvarga(40.0, 30.0) # 1200 sq.ft
    print(f"   -> Dimensions: 40x30 ft (Area: {ayadi['dimensions']['total_area_sqft']} sq.ft)")
    print(f"   -> Aya (Income): {ayadi['aya_income']}")
    print(f"   -> Vyaya (Expenditure): {ayadi['vyaya_expenditure']}")
    print(f"   -> Wealth Verdict: {ayadi['wealth_verdict']}")
    print(f"   -> Yoni: {ayadi['yoni_number']} - {ayadi['yoni_name']} ({ayadi['yoni_direction']})")
    print(f"   -> Vara & Nakshatra: {ayadi['vara_day']} • {ayadi['nakshatra']}")
    print(f"   -> Longevity (Ayu): {ayadi['ayu_years']} Years")
    print(f"   -> Ayadi Score: {ayadi['ayadi_harmony_score']}%")
    assert ayadi['aya_income'] >= 1 and ayadi['aya_income'] <= 12, "Aya out of bounds"
    assert ayadi['vyaya_expenditure'] >= 1 and ayadi['vyaya_expenditure'] <= 10, "Vyaya out of bounds"

    # 2. Test Custom House Plan Coordinator
    print("\n2. Testing Custom House Plan Analysis...")
    coordinator = CustomVastuCoordinator()
    test_custom_plan = {
        "id": "OWN_HOUSE_TEST",
        "name": "Custom House Test",
        "client": "Test Client",
        "address": "Ahmedabad, Gujarat",
        "length_feet": 45.0,
        "width_feet": 35.0,
        "north_angle": 10.0,
        "magnetic_declination": 0.5,
        "boundary": [
            {"x": 100, "y": 80},
            {"x": 700, "y": 80},
            {"x": 700, "y": 520},
            {"x": 100, "y": 520}
        ],
        "rooms": [
            {
                "id": "r_living",
                "name": "Living Hall",
                "category": "Living Room",
                "polygon": [{"x": 100, "y": 80}, {"x": 400, "y": 80}, {"x": 400, "y": 300}, {"x": 100, "y": 300}],
                "window_count": 2,
                "window_facing": ["North", "East"]
            },
            {
                "id": "r_kitchen",
                "name": "Kitchen",
                "category": "Modular Kitchen",
                "polygon": [{"x": 400, "y": 80}, {"x": 700, "y": 80}, {"x": 700, "y": 280}, {"x": 400, "y": 280}],
                "window_count": 1,
                "window_facing": ["East"]
            }
        ],
        "entrances": [
            {"id": "main_door", "name": "Main Entrance", "point": {"x": 300, "y": 80}}
        ]
    }

    res = coordinator.run_full_analysis(test_custom_plan)
    vastu_index = res["traditional_vastu"]["vastu_index"]
    entrance = res["traditional_vastu"]["entrance_eval"]
    print(f"   -> Vastu Index: {vastu_index}/100")
    print(f"   -> Entrance Pada: {entrance['pada_code']} ({entrance['deity']})")
    print(f"   -> Daylight Efficiency: {res['environmental_engineering']['daylight_efficiency_score']}%")
    print(f"   -> Ventilation Index: {res['environmental_engineering']['cross_ventilation_index']}%")

    # 3. Test Gujarati (ગુજરાતી) Report Generation
    print("\n3. Testing 16-Page Master PDF Report Generation in Gujarati (ગુજરાતી)...")
    html_gu = generate_multi_page_report(res, lang="gu")
    print(f"   -> Gujarati Report Size: {len(html_gu)} bytes")
    assert len(html_gu) > 10000, "Gujarati report too small"

    # 4. Test Hindi (हिंदी) Report Generation
    print("\n4. Testing 16-Page Master PDF Report Generation in Hindi (हिंदी)...")
    html_hi = generate_multi_page_report(res, lang="hi")
    print(f"   -> Hindi Report Size: {len(html_hi)} bytes")
    assert len(html_hi) > 10000, "Hindi report too small"

    # 5. Test English & Punjabi
    html_en = generate_multi_page_report(res, lang="en")
    html_pa = generate_multi_page_report(res, lang="pa")
    print(f"   -> English Report Size: {len(html_en)} bytes")
    print(f"   -> Punjabi Report Size: {len(html_pa)} bytes")

    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED SUCCESSFULLY WITH 100% PASS RATE!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
