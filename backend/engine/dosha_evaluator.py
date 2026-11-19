"""
Intelligent Dosha & Remedial Engine on Drive E:
Supports 16 directional zones, 32 entrances, Brahmasthan, with Gujarati, Hindi, Punjabi, and English.
"""

from typing import List, Dict, Any
from backend.data.vastu_knowledge import DOSHA_RULES, ZONES_16

def evaluate_plan_doshas(
    room_zone_overlaps: List[Dict[str, Any]],
    entrance_eval: Dict[str, Any],
    brahmasthan_status: Dict[str, Any]
) -> Dict[str, Any]:
    findings = []
    zone_lookup = {z['id']: z for z in ZONES_16}

    # 1. Evaluate rooms against DOSHA_RULES
    for item in room_zone_overlaps:
        r_info = item['room']
        r_name = r_info.get('name', 'Room')
        r_cat = r_info.get('category', '')
        overlaps = item.get('overlaps', [])
        if not overlaps:
            continue

        dominant_zone_id = overlaps[0]['zone_id']
        dominant_zone = zone_lookup.get(dominant_zone_id, {})
        matched_rule = False

        for rule in DOSHA_RULES:
            if rule['target_room'].lower() in r_cat.lower() and rule['conflicting_zone'] == dominant_zone_id:
                matched_rule = True
                findings.append({
                    "id": f"FIND_{len(findings)+1:03d}",
                    "rule_id": rule['id'],
                    "category": rule['category'],
                    "room_name": r_name,
                    "room_category": r_cat,
                    "zone_id": dominant_zone_id,
                    "zone_name_en": dominant_zone.get('name_en', dominant_zone_id),
                    "zone_name_hi": dominant_zone.get('name_hi', dominant_zone_id),
                    "zone_name_gu": dominant_zone.get('name_gu', dominant_zone.get('name_hi', dominant_zone_id)),
                    "severity": rule['severity'],
                    "confidence": "Calculated (Geometric Polygon Overlap)",
                    "title_en": rule['title_en'],
                    "title_hi": rule['title_hi'],
                    "title_gu": rule.get('title_gu', rule['title_hi']),
                    "description_en": rule['description_en'],
                    "description_hi": rule['description_hi'],
                    "description_gu": rule.get('description_gu', rule['description_hi']),
                    "source": rule['traditional_source'],
                    "school": rule['school'],
                    "remedy_type": rule['remedy_type'],
                    "remedy_en": rule['remedy_en'],
                    "remedy_hi": rule['remedy_hi'],
                    "remedy_gu": rule.get('remedy_gu', rule['remedy_hi'])
                })
                break

        if not matched_rule:
            taboo = dominant_zone.get('taboo_rooms', [])
            ideal = dominant_zone.get('ideal_rooms', [])
            is_taboo = any(t.lower() in r_cat.lower() for t in taboo)
            is_ideal = any(i.lower() in r_cat.lower() for i in ideal)

            if is_taboo:
                findings.append({
                    "id": f"FIND_{len(findings)+1:03d}",
                    "rule_id": f"GEN_TABOO_{dominant_zone_id}",
                    "category": "Directional Harmony",
                    "room_name": r_name,
                    "room_category": r_cat,
                    "zone_id": dominant_zone_id,
                    "zone_name_en": dominant_zone.get('name_en', dominant_zone_id),
                    "zone_name_hi": dominant_zone.get('name_hi', dominant_zone_id),
                    "zone_name_gu": dominant_zone.get('name_gu', dominant_zone.get('name_hi', dominant_zone_id)),
                    "severity": "Moderate",
                    "confidence": "Spatial Calculation",
                    "title_en": f"Sub-optimal Placement of {r_cat} in {dominant_zone['name_en']}",
                    "title_hi": f"{dominant_zone['name_hi']} में {r_cat} की प्रतिकूल स्थिति",
                    "title_gu": f"{dominant_zone.get('name_gu', dominant_zone['name_hi'])} માં {r_cat} ની પ્રતિકૂળ સ્થિતિ",
                    "description_en": f"{r_cat} in {dominant_zone['name_en']} conflicts with natural zonal attributes.",
                    "description_hi": f"{dominant_zone['name_hi']} में {r_cat} का होना इस दिशा के गुणों को प्रभावित करता है।",
                    "description_gu": f"{dominant_zone.get('name_gu', dominant_zone['name_hi'])} માં {r_cat} હોવાથી આ દિશાના ગુણો પ્રભાવિત થાય છે.",
                    "source": "Standard Classical Guidelines",
                    "school": "General Vastu",
                    "remedy_type": "Elemental Neutralizer",
                    "remedy_en": f"Apply {dominant_zone['element']} element neutralizer and appropriate metal strip.",
                    "remedy_hi": f"{dominant_zone['element_hi']} तत्व को संतुलित करने हेतु उचित धातु की पट्टी का प्रयोग करें।",
                    "remedy_gu": f"{dominant_zone.get('element_gu', dominant_zone['element_hi'])} તત્વ સંતુલન માટે યોગ્ય ધાતુની પટ્ટી વાપરો."
                })
            elif is_ideal:
                findings.append({
                    "id": f"FIND_{len(findings)+1:03d}",
                    "rule_id": f"HARMONY_{dominant_zone_id}",
                    "category": "Auspicious Alignment",
                    "room_name": r_name,
                    "room_category": r_cat,
                    "zone_id": dominant_zone_id,
                    "zone_name_en": dominant_zone.get('name_en', dominant_zone_id),
                    "zone_name_hi": dominant_zone.get('name_hi', dominant_zone_id),
                    "zone_name_gu": dominant_zone.get('name_gu', dominant_zone.get('name_hi', dominant_zone_id)),
                    "severity": "Auspicious",
                    "confidence": "High",
                    "title_en": f"Auspicious Placement of {r_cat} in {dominant_zone['name_en']}",
                    "title_hi": f"{dominant_zone['name_hi']} में {r_cat} का अत्यंत शुभ स्थान",
                    "title_gu": f"{dominant_zone.get('name_gu', dominant_zone['name_hi'])} માં {r_cat} નું અત્યંત શુભ સ્થાન",
                    "description_en": f"Harmonizes with {dominant_zone['deity']} bringing {dominant_zone['attributes_en']}.",
                    "description_hi": f"यह स्थिति {dominant_zone['name_hi']} के स्वामी और पंचतत्व के साथ पूर्णतः अनुकूल है।",
                    "description_gu": f"આ સ્થિતિ પંચતત્વ અને દિશા સ્વામી સાથે પૂર્ણપણે અનુકૂળ છે.",
                    "source": "Mayamatam & Brihat Samhita",
                    "school": "Vedic & MahaVastu",
                    "remedy_type": "None Needed",
                    "remedy_en": "Keep area clean, well illuminated, and unobstructed.",
                    "remedy_hi": "स्थान को स्वच्छ, व्यवस्थित एवं सुगंधित रखें।",
                    "remedy_gu": "જગ્યાને સ્વચ્છ અને પ્રકાશિત રાખો."
                })

    # 2. Evaluate Main Entrance
    if entrance_eval:
        is_ausp = entrance_eval.get('auspicious', False)
        pada_code = entrance_eval.get('pada_code', 'Unknown')
        deity = entrance_eval.get('deity', '')
        if not is_ausp:
            findings.append({
                "id": f"FIND_{len(findings)+1:03d}",
                "rule_id": f"ENT_PADA_{pada_code}",
                "category": "Entrance Pada Defect",
                "room_name": "Main Entrance Portal",
                "room_category": "Main Door",
                "zone_id": entrance_eval.get('direction', 'Entrance'),
                "zone_name_en": f"Entrance Pada {pada_code} ({deity})",
                "zone_name_hi": f"मुख्य द्वार पद {pada_code} ({deity})",
                "zone_name_gu": f"મુખ્ય દ્વાર પદ {pada_code} ({deity})",
                "severity": "High",
                "confidence": "Calculated True North Bearing",
                "title_en": f"Challenging Entrance Pada: {pada_code} ({deity})",
                "title_hi": f"प्रतिकूल मुख्य द्वार पद: {pada_code} ({deity})",
                "title_gu": f"પ્રતિકૂળ મુખ્ય દ્વાર પદ: {pada_code} ({deity})",
                "description_en": f"Door falls in {pada_code} ruled by {deity}. Indication: {entrance_eval.get('effect_en')}.",
                "description_hi": f"मुख्य द्वार {deity} देवता के पद {pada_code} में है। प्रभाव: {entrance_eval.get('effect_hi')}.",
                "description_gu": f"મુખ્ય દ્વાર {deity} દેવતાના પદ {pada_code} માં છે. પ્રભાવ: {entrance_eval.get('effect_gu', entrance_eval.get('effect_hi'))}.",
                "source": "Brihat Samhita Ch. 53 (Dvara Lakshana)",
                "school": "Classical 32 Pada",
                "remedy_type": "Non-Demolition Entrance Treatment",
                "remedy_en": "Install a 4mm Brass threshold strip across doorway sill. Mount consecrated Trisakti (Om, Swastik, Trishul) symbol or Vastu energy pyramid on upper door frame.",
                "remedy_hi": "चौखट की देहरी में पीतल (Brass) की पट्टी स्थापित करें। मुख्य द्वार के ऊपर सिद्ध त्रिशक्ति यंत्र (ॐ, स्वस्तिक, त्रिशूल) लगाएं।",
                "remedy_gu": "ઉંબરામાં પિત્તળ (Brass) ની પટ્ટી લગાવો. મુખ્ય દ્વાર ઉપર ત્રિશક્તિ યંત્ર (ૐ, સ્વસ્તિક, ત્રિશૂલ) સ્થાપિત કરો."
            })
        else:
            findings.append({
                "id": f"FIND_{len(findings)+1:03d}",
                "rule_id": f"ENT_PADA_{pada_code}_AUSP",
                "category": "Auspicious Entrance",
                "room_name": "Main Entrance Portal",
                "room_category": "Main Door",
                "zone_id": entrance_eval.get('direction', 'Entrance'),
                "zone_name_en": f"Royal Entrance Pada {pada_code} ({deity})",
                "zone_name_hi": f"शुभ राजद्वार पद {pada_code} ({deity})",
                "zone_name_gu": f"શુભ રાજદ્વાર પદ {pada_code} ({deity})",
                "severity": "Auspicious",
                "confidence": "High",
                "title_en": f"Highly Auspicious Entrance: {pada_code} ({deity})",
                "title_hi": f"अत्यंत शुभ एवं समृद्धिकारक प्रवेश द्वार: {pada_code} ({deity})",
                "title_gu": f"અત્યંત શુભ અને સમૃદ્ધિદાયક પ્રવેશ દ્વાર: {pada_code} ({deity})",
                "description_en": f"Door brings {entrance_eval.get('effect_en')}.",
                "description_hi": f"द्वार अत्यंत शुभ है जो {entrance_eval.get('effect_hi')} प्रदान करता है।",
                "description_gu": f"દ્વાર અત્યંત શુભ છે જે {entrance_eval.get('effect_gu', entrance_eval.get('effect_hi'))} પ્રદાન કરે છે.",
                "source": "Brihat Samhita & Manasara",
                "school": "Classical 32 Pada",
                "remedy_type": "None Needed",
                "remedy_en": "Keep entrance well illuminated with warm golden light.",
                "remedy_hi": "मुख्य द्वार को सदैव प्रकाशित और सुंदर रखें।",
                "remedy_gu": "મુખ્ય દ્વારને હંમેશા સ્વચ્છ અને પ્રકાશિત રાખો."
            })

    high_count = sum(1 for f in findings if f['severity'] == 'High')
    mod_count = sum(1 for f in findings if f['severity'] == 'Moderate')
    ausp_count = sum(1 for f in findings if f['severity'] == 'Auspicious')
    
    raw_score = 85 - (high_count * 15) - (mod_count * 7) + (ausp_count * 4)
    vastu_index = max(25, min(98, raw_score))

    return {
        "vastu_index": vastu_index,
        "high_priority_count": high_count,
        "moderate_priority_count": mod_count,
        "auspicious_count": ausp_count,
        "total_evaluated": len(findings),
        "findings": findings
    }
