# Vastu Intelligence 3D - Professional Architectural CAD & Vedic Science

An advanced, cloud-ready architectural CAD drafting and Vedic Vastu analysis suite built with FastAPI, Three.js, Konva.js, and Shapely.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 🌟 Key Features

1. **3D Photorealistic House Modeling (Three.js & OrbitControls):**
   - Real-time 3D wall extrusion with customizable cutaway heights (35% Low, 70% Mid, 100% Full).
   - Photorealistic floor materials: Italian marble, teak parquet wood, granite tiles, and pure Makrana white marble.
   - 3D furniture models: Master double bed with nightstands and lamps, modern sectional L-sofa, coffee table, wall-mounted LED TV, modular kitchen counters with gas stoves and sinks, sacred wooden pooja mandir with golden Shikhara dome and glowing diya light, and ceramic WC commodes.
   - Interactive 360° orbital rotation, pan, zoom, and instant camera presets (Isometric 45°, Top-Down 3D Plan, Interior Walkthrough, Front Elevation).

2. **2D Blueprint CAD Drafting (Konva.js):**
   - Drag-and-drop room positioning with 8-anchor transformation handles.
   - Live room dimension badges displaying width, length, and square footage (e.g., `18' x 14' (1764 sq.ft)`).
   - Architectural door swing arcs, windows, gas stoves, WC commodes, and water tank fixtures.
   - True North Compass calibration (-180° to +180°).

3. **Vedic Vastu & Engineering Analysis:**
   - 16-Zone MahaVastu Shakti Chakra overlay.
   - Central Brahmasthan (central 1/9th) and Brahma Bindu detection.
   - 32 Entrance Padas with effects and deities.
   - Classical Ayadi Shadvarga mathematics: Aya (Income), Vyaya (Expense), Yoni, Vara, Nakshatra, and Longevity (Ayu).
   - Environmental engineering metrics: Solar daylight exposure and NBC 2016 cross-ventilation indices.
   - Non-demolition Vedic remedies available in Gujarati (ગુજરાતી), Hindi, Punjabi, and English.

4. **16-Page Master PDF Audit Report:**
   - One-click multi-page comprehensive report generation with embedded vector SVG floor plan diagrams, Shakti Chakra overlays, and MahaVastu area percentage bar charts.

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/vastu-intelligence-3d.git
cd vastu-intelligence-3d

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Open your browser at `http://localhost:8000`.

---

## ☁️ Deploying to Render.com

1. Create a free account on [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `vastu-intelligence-3d`.
4. Render will automatically detect `render.yaml` or set:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**. Your app will be live on a public HTTPS URL (e.g. `https://vastu-intelligence-3d.onrender.com`).
