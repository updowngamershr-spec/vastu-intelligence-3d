"""
FastAPI Backend Application on Drive E:
Supports custom house plan drawing, Ayadi calculations, 16-page report generation in Gujarati, Hindi, Punjabi, and English.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os

from backend.data.vastu_knowledge import ZONES_16, ENTRANCE_32, DEVTAS_45, DOSHA_RULES
from backend.data.translations import TRANSLATIONS
from backend.core.ayadi_shadvarga import calculate_ayadi_shadvarga
from backend.engine.vastu_calculator import CustomVastuCoordinator
from backend.reports.multi_page_report import generate_multi_page_report

app = FastAPI(
    title="Vastu Intelligence Pro (Drive E: Edition)",
    description="Professional Custom House Vastu & Ayadi Shadvarga Suite",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

coordinator = CustomVastuCoordinator()

class CustomHousePayload(BaseModel):
    id: Optional[str] = "CUSTOM_HOUSE_001"
    name: Optional[str] = "My Custom Dream House"
    client: Optional[str] = "House Owner"
    address: Optional[str] = "India"
    north_angle: float = 0.0
    magnetic_declination: float = 0.0
    length_feet: float = 40.0
    width_feet: float = 30.0
    boundary: List[Dict[str, float]]
    rooms: List[Dict[str, Any]]
    entrances: Optional[List[Dict[str, Any]]] = []
    fixtures: Optional[List[Dict[str, Any]]] = []

class ReportRequest(BaseModel):
    analysis_data: Dict[str, Any]
    language: str = "gu" # "gu", "hi", "pa", "en"

class AyadiRequest(BaseModel):
    length_feet: float
    width_feet: float

@app.get("/api/health")
def health_check():
    return {"status": "active", "drive": "E:\\vastu_intelligence", "version": "3.0.0"}

@app.get("/api/translations")
def get_translations():
    return TRANSLATIONS

@app.get("/api/knowledge-base")
def get_knowledge_base():
    return {
        "zones_16": ZONES_16,
        "entrance_32": ENTRANCE_32,
        "devtas_45": DEVTAS_45,
        "dosha_rules": DOSHA_RULES
    }

@app.post("/api/ayadi")
def compute_ayadi(req: AyadiRequest):
    return calculate_ayadi_shadvarga(req.length_feet, req.width_feet)

@app.post("/api/analyze")
def analyze_custom_house(payload: CustomHousePayload):
    try:
        plan_dict = payload.dict()
        analysis = coordinator.run_full_analysis(plan_dict)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-multi-page-report", response_class=HTMLResponse)
def create_multi_page_report(req: ReportRequest):
    try:
        html_report = generate_multi_page_report(req.analysis_data, lang=req.language)
        return HTMLResponse(content=html_report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
