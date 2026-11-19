/**
 * Vastu Intelligence 3D - Main Application Studio Controller (Drive E: Edition)
 * Integrates:
 * 1. 2D Architectural CAD Studio (Konva.js)
 * 2. 3D Photorealistic House Engine with OrbitControls (Three.js)
 * 3. Classical Ayadi Shadvarga & 16-Zone MahaVastu Calculation Engine
 * 4. Master 16-Page Multi-Page PDF Report with High-Res SVG Charts & Floor Plans
 */

let studio = null;
let threeViewer = null;
let currentAnalysis = null;
let activeMode = '2D'; // '2D' or '3D'

let customPlanMeta = {
    id: "CUSTOM_HOUSE_001",
    name: "મારું સ્વપ્નનું ઘર (My Custom House)",
    client: "House Owner",
    address: "India",
    north_angle: 0.0,
    magnetic_declination: 0.4,
    length_feet: 40.0,
    width_feet: 30.0
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Konva 2D CAD Studio
    studio = new KonvaVastuStudio('customCanvasContainer');
    window.studio = studio;

    // 2. Initialize Three.js 3D House Viewer
    threeViewer = new ThreeVastuViewer('threeContainer');
    window.threeViewer = threeViewer;

    // Callback on room move, resize, fixture placement
    window.onCustomPlanChanged = () => {
        triggerAnalysis();
        if (activeMode === '3D') {
            update3DHouse();
        }
    };

    window.onRoomSelected = (room) => {
        const inspectorSection = document.getElementById('roomInspectorSection');
        const nameInput = document.getElementById('editRoomName');
        if (room) {
            inspectorSection.style.display = 'block';
            nameInput.value = room.name;
        } else {
            inspectorSection.style.display = 'none';
        }
    };

    // 3. Load i18n Translations
    await i18n.loadTranslations();

    // 4. Setup Event Listeners
    setupEventListeners();

    // 5. Initial Analysis & 3D Render
    triggerAnalysis();
    update3DHouse();
});

function setupEventListeners() {
    // 1. View Mode Switcher: 2D Blueprint vs 3D Realistic House
    const btn2D = document.getElementById('btnView2D');
    const btn3D = document.getElementById('btnView3D');
    const container2D = document.getElementById('customCanvasContainer');
    const container3D = document.getElementById('threeContainer');
    const toolbar2D = document.getElementById('toolbar2D');
    const toolbar3D = document.getElementById('toolbar3D');

    btn2D?.addEventListener('click', () => {
        activeMode = '2D';
        btn2D.classList.add('active');
        btn3D.classList.remove('active');
        container2D.style.display = 'block';
        container3D.style.display = 'none';
        toolbar2D.style.display = 'flex';
        toolbar3D.style.display = 'none';
        studio.handleResize();
    });

    btn3D?.addEventListener('click', () => {
        activeMode = '3D';
        btn3D.classList.add('active');
        btn2D.classList.remove('active');
        container3D.style.display = 'block';
        container2D.style.display = 'none';
        toolbar3D.style.display = 'flex';
        toolbar2D.style.display = 'none';
        update3DHouse();
        threeViewer.handleResize();
    });

    // 2. House Preset Selector
    const presetSelect = document.getElementById('planPresetSelect');
    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            studio.loadPreset(e.target.value);
            update3DHouse();
        });
    }

    // 3. 3D Camera Angles
    document.getElementById('btnCamIso')?.addEventListener('click', () => {
        set3DCamBtnActive('btnCamIso');
        threeViewer.setCameraPreset('iso');
    });
    document.getElementById('btnCamTop')?.addEventListener('click', () => {
        set3DCamBtnActive('btnCamTop');
        threeViewer.setCameraPreset('top');
    });
    document.getElementById('btnCamWalk')?.addEventListener('click', () => {
        set3DCamBtnActive('btnCamWalk');
        threeViewer.setCameraPreset('walk');
    });
    document.getElementById('btnCamFront')?.addEventListener('click', () => {
        set3DCamBtnActive('btnCamFront');
        threeViewer.setCameraPreset('front');
    });

    // 4. 3D Wall Cutaway Heights
    document.getElementById('btnWallLow')?.addEventListener('click', () => {
        setWallBtnActive('btnWallLow');
        threeViewer.setWallCutaway(0.35);
    });
    document.getElementById('btnWallMid')?.addEventListener('click', () => {
        setWallBtnActive('btnWallMid');
        threeViewer.setWallCutaway(0.70);
    });
    document.getElementById('btnWallFull')?.addEventListener('click', () => {
        setWallBtnActive('btnWallFull');
        threeViewer.setWallCutaway(1.0);
    });

    // 5. 3D Shakti Chakra Toggle
    let chakraVisible = true;
    document.getElementById('btnToggle3DChakra')?.addEventListener('click', () => {
        chakraVisible = !chakraVisible;
        threeViewer.toggleChakra(chakraVisible);
    });

    // 6. Language Switcher
    const langSel = document.getElementById('langSelect');
    if (langSel) {
        langSel.addEventListener('change', (e) => {
            i18n.setLanguage(e.target.value);
            if (currentAnalysis) updateInspector(currentAnalysis);
        });
    }

    // 7. True North Compass Slider
    const compassSlider = document.getElementById('northSlider');
    const angleDisplay = document.getElementById('angleDisplay');
    const needle = document.getElementById('compassNeedle');
    if (compassSlider) {
        compassSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            angleDisplay.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)}°`;
            needle.style.transform = `rotate(${val}deg)`;
            studio.setNorthAngle(val);
            customPlanMeta.north_angle = val;
            if (activeMode === '3D') {
                update3DHouse();
            }
            triggerAnalysis();
        });
    }

    // 8. Custom Plot Dimensions (Length & Width)
    const lenInput = document.getElementById('inputLength');
    const widInput = document.getElementById('inputWidth');
    const onDimChange = () => {
        const l = parseFloat(lenInput.value) || 40.0;
        const w = parseFloat(widInput.value) || 30.0;
        customPlanMeta.length_feet = l;
        customPlanMeta.width_feet = w;
        
        const areaSqft = l * w;
        const areaGaj = (areaSqft / 9).toFixed(1);
        const indicator = document.getElementById('plotAreaIndicator');
        if (indicator) {
            indicator.textContent = `Total Builtup Area: ${areaSqft} Sq.Ft (${areaGaj} Sq.Yards / વાર)`;
        }

        studio.setPlotDimensions(l, w);
        if (activeMode === '3D') {
            update3DHouse();
        }
        triggerAnalysis();
    };
    lenInput?.addEventListener('input', onDimChange);
    widInput?.addEventListener('input', onDimChange);

    // 9. Quick Add Room buttons
    document.getElementById('btnAddLiving')?.addEventListener('click', () => studio.addQuickRoom("Living Room", "લિવિંગ હોલ (Living)"));
    document.getElementById('btnAddKitchen')?.addEventListener('click', () => studio.addQuickRoom("Modular Kitchen", "રસોડું (Kitchen)"));
    document.getElementById('btnAddBed')?.addEventListener('click', () => studio.addQuickRoom("Master Bedroom", "માસ્ટર બેડરૂમ (Master Bed)"));
    document.getElementById('btnAddBed2')?.addEventListener('click', () => studio.addQuickRoom("Master Bedroom", "બાળકોનો રૂમ (Bed 2)"));
    document.getElementById('btnAddMandir')?.addEventListener('click', () => studio.addQuickRoom("Pooja Mandir", "પૂજા ઘર (Mandir)"));
    document.getElementById('btnAddToilet')?.addEventListener('click', () => studio.addQuickRoom("Toilet & Bath", "ટોયલેટ (Toilet)"));
    document.getElementById('btnAddBalcony')?.addEventListener('click', () => studio.addQuickRoom("Balcony", "ગેલેરી (Balcony)"));
    document.getElementById('btnAddDining')?.addEventListener('click', () => studio.addQuickRoom("Dining Room", "ડાઇનિંગ રૂમ (Dining)"));

    // 10. CAD Tool switching (Door, Stove, WC, Tank)
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tool = btn.getAttribute('data-tool');
            studio.currentTool = tool;
        });
    });

    // 11. Room Name editing
    const roomNameInput = document.getElementById('editRoomName');
    if (roomNameInput) {
        roomNameInput.addEventListener('input', (e) => {
            if (studio.selectedRoomId) {
                const room = studio.rooms.find(r => r.id === studio.selectedRoomId);
                if (room) {
                    room.name = e.target.value;
                    const titleNode = room.group.findOne('.roomTitle');
                    if (titleNode) titleNode.text(e.target.value);
                    studio.roomsLayer.batchDraw();
                    triggerAnalysis();
                }
            }
        });
    }

    // 12. Delete selected room
    document.getElementById('btnDeleteRoom')?.addEventListener('click', () => {
        studio.deleteSelectedRoom();
        document.getElementById('roomInspectorSection').style.display = 'none';
        if (activeMode === '3D') update3DHouse();
    });

    // 13. Backdrop Image Upload for tracing
    const fileInput = document.getElementById('backdropInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                studio.setBackdropImage(e.target.files[0]);
            }
        });
    }

    // 14. Opacity Slider
    const opacitySlider = document.getElementById('opacitySlider');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            studio.setBackdropOpacity(e.target.value);
        });
    }

    // 15. Overlays Checkboxes
    const overlayMap = {
        'chk16Zones': 'zones16',
        'chkBrahmasthan': 'brahmasthan',
        'chk32Entrances': 'entrances32',
        'chk81Pada': 'pada81',
        'chk45Devtas': 'devtas45',
        'chkMarmasthan': 'marmasthan'
    };
    Object.keys(overlayMap).forEach(id => {
        const el = document.getElementById(id);
        el?.addEventListener('change', (e) => {
            studio.setOverlay(overlayMap[id], e.target.checked);
        });
    });

    // 16. Right Inspector Tabs
    document.querySelectorAll('.inspector-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.inspector-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.querySelectorAll('.tab-view').forEach(v => v.style.display = 'none');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.style.display = 'block';
        });
    });

    // 17. Master 16-Page PDF Report Modal
    document.getElementById('btnExportReport')?.addEventListener('click', async () => {
        await openMultiPageReportModal();
    });
    document.getElementById('btnCloseReport')?.addEventListener('click', () => {
        document.getElementById('reportModalMask').style.display = 'none';
    });
    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
        const iframe = document.getElementById('reportFrame');
        iframe?.contentWindow?.print();
    });
}

function set3DCamBtnActive(btnId) {
    ['btnCamIso', 'btnCamTop', 'btnCamWalk', 'btnCamFront'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
    });
    document.getElementById(btnId)?.classList.add('active');
}

function setWallBtnActive(btnId) {
    ['btnWallLow', 'btnWallMid', 'btnWallFull'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
    });
    document.getElementById(btnId)?.classList.add('active');
}

function update3DHouse() {
    if (!threeViewer || !studio) return;
    const geom = studio.exportPlanGeometry();
    threeViewer.build3DHouse(geom, customPlanMeta.north_angle);
}

async function triggerAnalysis() {
    try {
        const geom = studio.exportPlanGeometry();
        const payload = {
            id: customPlanMeta.id,
            name: customPlanMeta.name,
            client: customPlanMeta.client,
            address: customPlanMeta.address,
            north_angle: customPlanMeta.north_angle,
            magnetic_declination: customPlanMeta.magnetic_declination,
            length_feet: customPlanMeta.length_feet,
            width_feet: customPlanMeta.width_feet,
            boundary: geom.boundary,
            rooms: geom.rooms,
            entrances: geom.entrances,
            fixtures: geom.fixtures
        };

        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        currentAnalysis = await res.json();
        updateInspector(currentAnalysis);
    } catch (e) {
        console.error("Analysis calculation failed:", e);
    }
}

function updateInspector(data) {
    const trad = data.traditional_vastu || {};
    const ayadi = data.ayadi_shadvarga || {};
    const eng = data.environmental_engineering || {};
    const lang = i18n.currentLang;

    // Badges
    document.getElementById('statVastuIndex').textContent = `${trad.vastu_index || 88}/100`;
    document.getElementById('statAyadi').textContent = `${ayadi.ayadi_harmony_score || 92}%`;
    document.getElementById('statSolar').textContent = `${eng.daylight_efficiency_score || 85}%`;
    document.getElementById('statVent').textContent = `${eng.cross_ventilation_index || 80}%`;

    // Ayadi Detailed Summary Box
    const ayadiBox = document.getElementById('ayadiSummaryBox');
    if (ayadiBox) {
        ayadiBox.innerHTML = `
            <div style="font-size:11.5px; line-height:1.6; color:#2A2526;">
                <strong>Dimensions:</strong> ${data.project_meta.length_feet} ft × ${data.project_meta.width_feet} ft (${ayadi.dimensions.total_area_sqft} sq.ft)<br>
                <strong>Aya (આવક / Income):</strong> <span style="color:#2E7D32; font-weight:700;">${ayadi.aya_income}</span> | 
                <strong>Vyaya (વ્યય / Expense):</strong> <span style="color:#C62828; font-weight:700;">${ayadi.vyaya_expenditure}</span><br>
                <strong>Yoni (યોનિ):</strong> ${ayadi.yoni_number} - ${ayadi.yoni_name} (${ayadi.yoni_direction})<br>
                <strong>Vara & Nakshatra:</strong> ${ayadi.vara_day} • ${ayadi.nakshatra}<br>
                <strong>Longevity (આયુષ્ય):</strong> <span style="color:#2E7D32; font-weight:700;">${ayadi.ayu_years} Years</span>
            </div>
        `;
    }

    // Doshas & Remedies
    const findingsList = document.getElementById('findingsContainer');
    findingsList.innerHTML = '';
    const findings = trad.findings || [];
    if (findings.length === 0) {
        findingsList.innerHTML = `
            <div class="finding-card severity-good">
                <div class="finding-badge badge-good">Auspicious Harmony</div>
                <div class="finding-title">કોઈ ગંભીર વાસ્તુ દોષ નથી (Perfect Harmony)</div>
                <div class="finding-desc">મકાનના મુખ્ય કક્ષો અને ઊર્જા ક્ષેત્રો સંપૂર્ણ સુમેળમાં સ્થાપિત છે.</div>
            </div>
        `;
    } else {
        findings.forEach(f => {
            const title = f[`title_${lang}`] || f.title_gu || f.title_hi || f.title_en;
            const desc = f[`description_${lang}`] || f.description_gu || f.description_hi || f.description_en;
            const remedy = f[`remedy_${lang}`] || f.remedy_gu || f.remedy_hi || f.remedy_en;

            const sevClass = f.severity.toLowerCase().includes('high') ? 'severity-high' : 
                            (f.severity.toLowerCase().includes('moderate') ? 'severity-moderate' : 'severity-good');
            const badgeClass = f.severity.toLowerCase().includes('high') ? 'badge-high' : 
                            (f.severity.toLowerCase().includes('moderate') ? 'badge-mod' : 'badge-good');

            const card = document.createElement('div');
            card.className = `finding-card ${sevClass}`;
            card.innerHTML = `
                <div class="finding-badge ${badgeClass}">${f.severity} Priority</div>
                <div class="finding-title">${title}</div>
                <div class="finding-desc">${desc}</div>
                <div class="remedy-box">
                    <strong>💡 ${i18n.t('rep_remedy_studio')}:</strong> ${remedy}
                </div>
                <div style="font-size:9.5px; color:#888; margin-top:4px;">પ્રમાણ / Source: ${f.source}</div>
            `;
            findingsList.appendChild(card);
        });
    }

    // Rooms list
    const roomsContainer = document.getElementById('roomsContainer');
    roomsContainer.innerHTML = '';
    (trad.room_zone_evals || []).forEach(item => {
        const r = item.room;
        const overlaps = item.overlaps || [];
        const overlapStr = overlaps.slice(0, 2).map(o => `${o.zone_id} (${o.percentage}%)`).join(', ');

        const row = document.createElement('div');
        row.style.cssText = 'padding:8px; border-bottom:1px solid #EEE; font-size:11.5px;';
        row.innerHTML = `
            <div style="font-weight:700; color:#571A2A;">${r.name}</div>
            <div style="color:#555;">દિશા / Zone: <span style="color:#1E88E5; font-weight:700;">${item.dominant_zone_name}</span></div>
            <div style="color:#777; font-size:10px;">Overlaps: ${overlapStr || '100%'}</div>
        `;
        roomsContainer.appendChild(row);
    });
}

async function openMultiPageReportModal() {
    if (!currentAnalysis) return;
    try {
        const geom = studio.exportPlanGeometry();
        currentAnalysis.project_meta.boundary = geom.boundary;
        currentAnalysis.project_meta.fixtures = geom.fixtures;

        const res = await fetch('/api/generate-multi-page-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysis_data: currentAnalysis,
                language: i18n.currentLang
            })
        });
        const html = await res.text();
        const frame = document.getElementById('reportFrame');
        frame.srcdoc = html;
        document.getElementById('reportModalMask').style.display = 'flex';
    } catch (e) {
        console.error("Report generation failed:", e);
    }
}