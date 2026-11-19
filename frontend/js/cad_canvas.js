/**
 * Professional Konva.js CAD Floor-Plan Studio (Drive E: Edition)
 * Provides 60fps hardware-accelerated room manipulation, 8-handle resizing,
 * live magnetic grid snapping, architectural door swing arcs, room sq.ft labels,
 * and preset house loading.
 */

class KonvaVastuStudio {
    constructor(containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);
        const rect = container ? container.getBoundingClientRect() : { width: 900, height: 600 };
        this.width = rect.width || 900;
        this.height = (rect.height || 600) - 52; // minus toolbar

        // 1. Initialize Konva Stage
        this.stage = new Konva.Stage({
            container: containerId,
            width: this.width,
            height: this.height
        });

        // 2. Initialize Specialized Layers
        this.gridLayer = new Konva.Layer();
        this.backdropLayer = new Konva.Layer();
        this.shaktiChakraLayer = new Konva.Layer();
        this.boundaryLayer = new Konva.Layer();
        this.roomsLayer = new Konva.Layer();
        this.fixturesLayer = new Konva.Layer();
        this.uiLayer = new Konva.Layer();

        this.stage.add(this.gridLayer);
        this.stage.add(this.backdropLayer);
        this.stage.add(this.shaktiChakraLayer);
        this.stage.add(this.boundaryLayer);
        this.stage.add(this.roomsLayer);
        this.stage.add(this.fixturesLayer);
        this.stage.add(this.uiLayer);

        // Transformer for Resizing & Rotating Selected Room
        this.transformer = new Konva.Transformer({
            nodes: [],
            rotateAnchorOffset: 25,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right'],
            borderStroke: '#1E88E5',
            borderStrokeWidth: 2,
            anchorStroke: '#1E88E5',
            anchorFill: '#FFFFFF',
            anchorSize: 10
        });
        this.uiLayer.add(this.transformer);

        // Core State
        this.plotWidthFeet = 40.0;
        this.plotLengthFeet = 30.0;
        this.boundaryRect = { x: 80, y: 50, width: 640, height: 460 };
        this.rooms = [];
        this.entrances = [];
        this.fixtures = [];

        this.northAngle = 0.0;
        this.currentTool = 'select';
        this.selectedRoomId = null;

        // Overlays State
        this.overlays = {
            zones16: true,
            brahmasthan: true,
            entrances32: true,
            pada81: false,
            devtas45: false,
            marmasthan: false
        };

        // Draw Initial Geometry
        this.drawBackgroundGrid();
        this.loadPreset('3bhk_villa'); // Load fully furnished 3BHK by default
        this.drawBoundary();
        this.drawShaktiChakra();
        this.drawFixtures();

        // Stage Click / Selection Handlers
        this.initStageInteractions();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        const rect = container.getBoundingClientRect();
        this.width = rect.width;
        this.height = Math.max(400, rect.height - 52);
        this.stage.width(this.width);
        this.stage.height(this.height);
        this.drawBackgroundGrid();
        this.drawShaktiChakra();
    }

    drawBackgroundGrid() {
        this.gridLayer.destroyChildren();
        const step = 20;
        // Background color
        this.gridLayer.add(new Konva.Rect({
            x: 0, y: 0,
            width: this.width, height: this.height,
            fill: '#FFFFFF'
        }));

        for (let x = 0; x < this.width; x += step) {
            this.gridLayer.add(new Konva.Line({
                points: [x, 0, x, this.height],
                stroke: x % 100 === 0 ? '#E2DDD3' : '#F4F1EA',
                strokeWidth: x % 100 === 0 ? 1.5 : 1
            }));
        }
        for (let y = 0; y < this.height; y += step) {
            this.gridLayer.add(new Konva.Line({
                points: [0, y, this.width, y],
                stroke: y % 100 === 0 ? '#E2DDD3' : '#F4F1EA',
                strokeWidth: y % 100 === 0 ? 1.5 : 1
            }));
        }
        this.gridLayer.batchDraw();
    }

    setPlotDimensions(lengthFeet, widthFeet) {
        this.plotLengthFeet = lengthFeet;
        this.plotWidthFeet = widthFeet;
        
        // Adjust boundary width and height proportionally
        const baseW = 640;
        const ratio = lengthFeet / (widthFeet || 1);
        let bw = baseW;
        let bh = Math.round(baseW * (lengthFeet / widthFeet));
        if (bh > this.height - 80) {
            bh = this.height - 80;
            bw = Math.round(bh * (widthFeet / lengthFeet));
        }

        const bx = Math.max(40, (this.width - bw) / 2);
        const by = Math.max(40, (this.height - bh) / 2);

        this.boundaryRect = { x: bx, y: by, width: bw, height: bh };
        this.drawBoundary();
        this.drawShaktiChakra();
        window.onCustomPlanChanged && window.onCustomPlanChanged();
    }

    setBackdropImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                this.backdropLayer.destroyChildren();
                const konvaImg = new Konva.Image({
                    x: this.boundaryRect.x,
                    y: this.boundaryRect.y,
                    width: this.boundaryRect.width,
                    height: this.boundaryRect.height,
                    image: img,
                    opacity: 0.45
                });
                this.backdropLayer.add(konvaImg);
                this.backdropLayer.batchDraw();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setBackdropOpacity(val) {
        const children = this.backdropLayer.getChildren();
        if (children && children.length > 0) {
            children[0].opacity(parseFloat(val));
            this.backdropLayer.batchDraw();
        }
    }

    drawBoundary() {
        this.boundaryLayer.destroyChildren();
        const b = this.boundaryRect;
        
        // Outer Wall (Dual-line architectural wall)
        this.boundaryLayer.add(new Konva.Rect({
            x: b.x - 3, y: b.y - 3,
            width: b.width + 6, height: b.height + 6,
            stroke: '#1A1D24',
            strokeWidth: 5,
            fill: 'transparent',
            listening: false
        }));

        // Dimensions labels on outer boundary
        this.boundaryLayer.add(new Konva.Text({
            x: b.x + b.width / 2 - 60,
            y: b.y - 20,
            text: `▲ ${this.plotWidthFeet.toFixed(1)}' Width (North / ઉત્તર)`,
            fontSize: 11,
            fontFamily: 'Plus Jakarta Sans',
            fontStyle: 'bold',
            fill: '#571A2A'
        }));

        this.boundaryLayer.add(new Konva.Text({
            x: b.x + b.width + 8,
            y: b.y + b.height / 2,
            text: `▶ ${this.plotLengthFeet.toFixed(1)}' Length (East / પૂર્વ)`,
            fontSize: 11,
            fontFamily: 'Plus Jakarta Sans',
            fontStyle: 'bold',
            fill: '#571A2A',
            rotation: 90
        }));

        this.boundaryLayer.batchDraw();
    }

    drawShaktiChakra() {
        this.shaktiChakraLayer.destroyChildren();
        const b = this.boundaryRect;
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        const R = Math.max(b.width, b.height) * 0.65;
        const radOffset = (this.northAngle * Math.PI) / 180;

        // 1. 16 Directional Zones Shakti Chakra
        if (this.overlays.zones16) {
            const zones = [
                { id: "N", angle: 0, color: "#1E88E5", label: "N (જળ)" },
                { id: "NNE", angle: 22.5, color: "#03A9F4", label: "NNE" },
                { id: "NE", angle: 45, color: "#00BCD4", label: "NE (ઈશાન)" },
                { id: "ENE", angle: 67.5, color: "#4CAF50", label: "ENE" },
                { id: "E", angle: 90, color: "#8BC34A", label: "E (પૂર્વ)" },
                { id: "ESE", angle: 112.5, color: "#CDDC39", label: "ESE" },
                { id: "SE", angle: 135, color: "#FF9800", label: "SE (અગ્નિ)" },
                { id: "SSE", angle: 157.5, color: "#FF5722", label: "SSE" },
                { id: "S", angle: 180, color: "#E91E63", label: "S (દક્ષિણ)" },
                { id: "SSW", angle: 202.5, color: "#795548", label: "SSW" },
                { id: "SW", angle: 225, color: "#FFC107", label: "SW (નૈઋત્ય)" },
                { id: "WSW", angle: 247.5, color: "#9E9E9E", label: "WSW" },
                { id: "W", angle: 270, color: "#607D8B", label: "W (પશ્ચિમ)" },
                { id: "WNW", angle: 292.5, color: "#B0BEC5", label: "WNW" },
                { id: "NW", angle: 315, color: "#80CBC4", label: "NW (વાયવ્ય)" },
                { id: "NNW", angle: 337.5, color: "#26C6DA", label: "NNW" }
            ];

            zones.forEach(z => {
                const startA = (z.angle - 11.25) + this.northAngle - 90;
                const midA = (z.angle * Math.PI) / 180 + radOffset - Math.PI / 2;

                const wedge = new Konva.Arc({
                    x: cx, y: cy,
                    innerRadius: 0,
                    outerRadius: R,
                    angle: 22.5,
                    rotation: startA,
                    fill: z.color,
                    opacity: 0.11,
                    stroke: z.color,
                    strokeWidth: 1,
                    listening: false
                });
                this.shaktiChakraLayer.add(wedge);

                const lx = cx + (R - 22) * Math.cos(midA);
                const ly = cy + (R - 22) * Math.sin(midA);
                this.shaktiChakraLayer.add(new Konva.Text({
                    x: lx - 18, y: ly - 6,
                    text: z.id,
                    fontSize: 10,
                    fontFamily: 'Plus Jakarta Sans',
                    fontStyle: 'bold',
                    fill: z.color,
                    listening: false
                }));
            });
        }

        // 2. Brahmasthan (Central 1/9th)
        if (this.overlays.brahmasthan) {
            const bw = b.width / 3;
            const bh = b.height / 3;
            const bx = b.x + bw;
            const by = b.y + bh;
            this.shaktiChakraLayer.add(new Konva.Rect({
                x: bx, y: by,
                width: bw, height: bh,
                fill: '#E5C66D',
                opacity: 0.18,
                stroke: '#C5A059',
                strokeWidth: 1.5,
                dash: [5, 4],
                listening: false
            }));
            this.shaktiChakraLayer.add(new Konva.Text({
                x: bx + bw / 2 - 45,
                y: by + bh / 2 - 7,
                text: 'બ્રહ્મસ્થાન (Center)',
                fontSize: 11,
                fontFamily: 'Plus Jakarta Sans',
                fontStyle: 'bold',
                fill: '#571A2A',
                listening: false
            }));
        }

        // 3. Central Brahma Bindu
        this.shaktiChakraLayer.add(new Konva.Circle({
            x: cx, y: cy,
            radius: 5,
            fill: '#C5A059',
            stroke: '#571A2A',
            strokeWidth: 2,
            listening: false
        }));

        this.shaktiChakraLayer.batchDraw();
    }

    loadPreset(presetName) {
        // Clear existing rooms & transformer
        this.transformer.nodes([]);
        this.rooms.forEach(r => r.group && r.group.destroy());
        this.rooms = [];
        this.entrances = [];
        this.fixtures = [];

        const b = this.boundaryRect;

        if (presetName === '3bhk_villa') {
            // 3BHK Luxury Modern Villa - Perfectly Vastu Harmonized
            // 1. Living Room in North / NW
            this.createRoomObject("room_living", "લિવિંગ રૂમ (Living Hall)", "Living Room", b.x + 20, b.y + 20, 290, 220, "#E3F2FD");
            // 2. Modular Kitchen in South-East (Agni)
            this.createRoomObject("room_kitchen", "રસોડું (Modular Kitchen)", "Modular Kitchen", b.x + 330, b.y + 20, 280, 190, "#FBE9E7");
            // 3. Master Bedroom in South-West (Nairutya)
            this.createRoomObject("room_master", "માસ્ટર બેડરૂમ (Master Bed)", "Master Bedroom", b.x + 330, b.y + 230, 280, 210, "#FFF8E1");
            // 4. Bedroom 2 (Children / Guests) in West
            this.createRoomObject("room_bed2", "બાળકોનો બેડરૂમ (Bed 2)", "Master Bedroom", b.x + 20, b.y + 250, 180, 190, "#EDE7F6");
            // 5. Sacred Pooja Mandir in North-East (Ishan)
            this.createRoomObject("room_mandir", "પૂજા ઘર (Mandir)", "Pooja Mandir", b.x + 230, b.y + 20, 90, 90, "#FFF9C4");
            // 6. Toilet & Bath in SSW / WNW
            this.createRoomObject("room_toilet", "ટોયલેટ / બાથ (Toilet)", "Toilet & Bath", b.x + 210, b.y + 250, 110, 190, "#ECEFF1");

            // Entrance at N4 (Kuber / Som - North)
            this.entrances = [{ id: "main_door", name: "Main Entrance (N4 Kuber)", x: b.x + 140, y: b.y }];
            
            // Fixtures: Stove in SE, WC in SSW
            this.fixtures = [
                { type: "stove", name: "Gas Stove (SE)", x: b.x + 480, y: b.y + 50 },
                { type: "wc", name: "WC Commode (SSW)", x: b.x + 265, y: b.y + 360 }
            ];

        } else if (presetName === '2bhk_east') {
            // 2BHK East-Facing Home
            // 1. Living Hall in East/North-East
            this.createRoomObject("room_living", "લિવિંગ હોલ (Living)", "Living Room", b.x + 20, b.y + 20, 320, 220, "#E3F2FD");
            // 2. Kitchen in South-East (Agni)
            this.createRoomObject("room_kitchen", "રસોડું (Kitchen)", "Modular Kitchen", b.x + 360, b.y + 20, 250, 200, "#FBE9E7");
            // 3. Master Bed in South-West
            this.createRoomObject("room_master", "માસ્ટર બેડરૂમ (Master Bed)", "Master Bedroom", b.x + 360, b.y + 240, 250, 200, "#FFF8E1");
            // 4. Mandir in Ishan
            this.createRoomObject("room_mandir", "પૂજા ઘર (Mandir)", "Pooja Mandir", b.x + 20, b.y + 20, 100, 100, "#FFF9C4");
            // 5. Toilet in WNW
            this.createRoomObject("room_toilet", "ટોયલેટ (Toilet)", "Toilet & Bath", b.x + 20, b.y + 260, 140, 180, "#ECEFF1");

            this.entrances = [{ id: "main_door", name: "East Main Entrance (E3 Jayanta)", x: b.x + b.width, y: b.y + 120 }];
            this.fixtures = [
                { type: "stove", name: "Gas Stove", x: b.x + 490, y: b.y + 60 },
                { type: "wc", name: "WC Commode", x: b.x + 80, y: b.y + 350 }
            ];

        } else if (presetName === 'empty_plot') {
            // Blank Plot for Complete Freedom
            this.entrances = [{ id: "main_door", name: "Main Entrance", x: b.x + b.width / 2, y: b.y }];
            this.fixtures = [];
        }

        this.drawFixtures();
        this.roomsLayer.batchDraw();
        window.onCustomPlanChanged && window.onCustomPlanChanged();
    }

    createRoomObject(id, name, category, x, y, width, height, color) {
        const group = new Konva.Group({
            id: id,
            x: x, y: y,
            draggable: true
        });

        // Background Rect
        const rect = new Konva.Rect({
            name: 'roomRect',
            width: width,
            height: height,
            fill: color,
            opacity: 0.9,
            stroke: '#2D323F',
            strokeWidth: 2,
            cornerRadius: 4,
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOpacity: 0.1,
            shadowOffset: { x: 2, y: 2 }
        });

        // Title text
        const titleText = new Konva.Text({
            name: 'roomTitle',
            x: 8, y: height / 2 - 16,
            width: width - 16,
            text: name,
            fontSize: 12,
            fontFamily: 'Plus Jakarta Sans',
            fontStyle: 'bold',
            fill: '#1A1D24',
            align: 'center'
        });

        // Dimension in Feet + sq.ft text
        const sqftFeet = Math.round((width / 16) * (height / 16) * 10) / 10;
        const dimW = Math.round(width / 16);
        const dimH = Math.round(height / 16);
        const subText = new Konva.Text({
            name: 'roomSub',
            x: 8, y: height / 2 + 4,
            width: width - 16,
            text: `${dimW}' x ${dimH}' (${dimW * dimH * 7} sq.ft)`,
            fontSize: 10,
            fontFamily: 'Plus Jakarta Sans',
            fontStyle: 'bold',
            fill: '#571A2A',
            align: 'center'
        });

        group.add(rect);
        group.add(titleText);
        group.add(subText);

        // Snap to grid on drag
        group.on('dragmove', () => {
            const step = 10;
            group.position({
                x: Math.round(group.x() / step) * step,
                y: Math.round(group.y() / step) * step
            });
        });

        group.on('dragend', () => {
            window.onCustomPlanChanged && window.onCustomPlanChanged();
        });

        group.on('transform', () => {
            const currentW = Math.max(60, rect.width() * group.scaleX());
            const currentH = Math.max(60, rect.height() * group.scaleY());
            rect.width(currentW);
            rect.height(currentH);
            group.scaleX(1);
            group.scaleY(1);

            titleText.width(currentW - 16);
            titleText.y(currentH / 2 - 16);
            subText.width(currentW - 16);
            subText.y(currentH / 2 + 4);

            const fw = Math.round(currentW / 16);
            const fh = Math.round(currentH / 16);
            subText.text(`${fw}' x ${fh}' (${fw * fh * 7} sq.ft)`);
        });

        group.on('transformend', () => {
            window.onCustomPlanChanged && window.onCustomPlanChanged();
        });

        this.roomsLayer.add(group);
        this.rooms.push({
            id: id,
            name: name,
            category: category,
            color: color,
            group: group
        });
        this.roomsLayer.batchDraw();
    }

    addQuickRoom(category, name) {
        const colorMap = {
            "Living Room": "#E3F2FD",
            "Modular Kitchen": "#FBE9E7",
            "Master Bedroom": "#FFF8E1",
            "Toilet & Bath": "#ECEFF1",
            "Pooja Mandir": "#FFF9C4",
            "Study Room": "#EDE7F6",
            "Children Bed": "#E8F5E9",
            "Balcony": "#E0F2F1",
            "Dining Room": "#FFF3E0"
        };
        const id = `room_${Date.now()}`;
        const b = this.boundaryRect;
        const rx = b.x + 30 + (this.rooms.length * 20) % 220;
        const ry = b.y + 30 + (this.rooms.length * 20) % 180;
        const rw = category.includes("Mandir") ? 90 : (category.includes("Toilet") ? 120 : 200);
        const rh = category.includes("Mandir") ? 90 : (category.includes("Toilet") ? 140 : 160);

        this.createRoomObject(id, name || category, category, rx, ry, rw, rh, colorMap[category] || "#F5F5F5");
        
        // Select it immediately
        const newRoom = this.rooms[this.rooms.length - 1];
        this.selectRoom(newRoom.group);
        window.onCustomPlanChanged && window.onCustomPlanChanged();
    }

    deleteSelectedRoom() {
        if (this.selectedRoomId) {
            const rObj = this.rooms.find(r => r.id === this.selectedRoomId);
            if (rObj && rObj.group) {
                rObj.group.destroy();
                this.rooms = this.rooms.filter(r => r.id !== this.selectedRoomId);
                this.transformer.nodes([]);
                this.selectedRoomId = null;
                this.uiLayer.batchDraw();
                this.roomsLayer.batchDraw();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
            }
        }
    }

    selectRoom(group) {
        this.selectedRoomId = group.id();
        this.transformer.nodes([group]);
        this.uiLayer.batchDraw();
        const rObj = this.rooms.find(r => r.id === this.selectedRoomId);
        window.onRoomSelected && window.onRoomSelected(rObj);
    }

    drawFixtures() {
        this.fixturesLayer.destroyChildren();

        // Doors with swing arc
        this.entrances.forEach(e => {
            const doorGroup = new Konva.Group({ x: e.x, y: e.y, draggable: true });
            doorGroup.add(new Konva.Circle({ radius: 8, fill: '#2E7D32', stroke: '#FFFFFF', strokeWidth: 2 }));
            // Swing arc
            doorGroup.add(new Konva.Arc({
                x: 0, y: 0,
                innerRadius: 0, outerRadius: 26,
                angle: 90, rotation: 0,
                stroke: '#2E7D32', strokeWidth: 1.5,
                dash: [4, 3]
            }));
            doorGroup.add(new Konva.Text({
                x: 14, y: -6,
                text: `🚪 ${e.name}`,
                fontSize: 10,
                fontFamily: 'Plus Jakarta Sans',
                fontStyle: 'bold',
                fill: '#1B5E20'
            }));
            doorGroup.on('dragend', () => {
                e.x = doorGroup.x();
                e.y = doorGroup.y();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
            });
            this.fixturesLayer.add(doorGroup);
        });

        // Fixtures (Stove, WC, Tank)
        this.fixtures.forEach(f => {
            const fixGroup = new Konva.Group({ x: f.x, y: f.y, draggable: true });
            if (f.type === 'stove') {
                fixGroup.add(new Konva.Circle({ radius: 8, fill: '#D84315' }));
                fixGroup.add(new Konva.Text({ x: 12, y: -5, text: "🔥 Stove", fontSize: 10, fill: '#BF360C', fontStyle: 'bold' }));
            } else if (f.type === 'wc') {
                fixGroup.add(new Konva.Rect({ x: -7, y: -9, width: 14, height: 18, cornerRadius: 4, fill: '#455A64' }));
                fixGroup.add(new Konva.Text({ x: 12, y: -5, text: "🚽 WC", fontSize: 10, fill: '#37474F', fontStyle: 'bold' }));
            } else if (f.type === 'tank') {
                fixGroup.add(new Konva.Circle({ radius: 9, fill: '#0288D1' }));
                fixGroup.add(new Konva.Text({ x: 12, y: -5, text: "💧 Tank", fontSize: 10, fill: '#01579B', fontStyle: 'bold' }));
            }
            fixGroup.on('dragend', () => {
                f.x = fixGroup.x();
                f.y = fixGroup.y();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
            });
            this.fixturesLayer.add(fixGroup);
        });

        this.fixturesLayer.batchDraw();
    }

    initStageInteractions() {
        this.stage.on('click tap', (e) => {
            if (this.currentTool === 'door') {
                const pos = this.stage.getPointerPosition();
                this.entrances = [{ id: `door_${Date.now()}`, name: "Main Entrance", x: pos.x, y: pos.y }];
                this.currentTool = 'select';
                this.drawFixtures();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
                return;
            } else if (this.currentTool === 'stove') {
                const pos = this.stage.getPointerPosition();
                this.fixtures.push({ type: "stove", name: "Gas Stove", x: pos.x, y: pos.y });
                this.currentTool = 'select';
                this.drawFixtures();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
                return;
            } else if (this.currentTool === 'wc') {
                const pos = this.stage.getPointerPosition();
                this.fixtures.push({ type: "wc", name: "WC Commode", x: pos.x, y: pos.y });
                this.currentTool = 'select';
                this.drawFixtures();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
                return;
            } else if (this.currentTool === 'tank') {
                const pos = this.stage.getPointerPosition();
                this.fixtures.push({ type: "tank", name: "Borewell/Tank", x: pos.x, y: pos.y });
                this.currentTool = 'select';
                this.drawFixtures();
                window.onCustomPlanChanged && window.onCustomPlanChanged();
                return;
            }

            // Deselect if clicked on blank grid
            if (e.target === this.stage || e.target.getParent() === this.gridLayer || e.target.getParent() === this.shaktiChakraLayer) {
                this.transformer.nodes([]);
                this.selectedRoomId = null;
                this.uiLayer.batchDraw();
                window.onRoomSelected && window.onRoomSelected(null);
                return;
            }

            // If clicked inside a room
            const group = e.target.findAncestor('Group');
            if (group && this.rooms.some(r => r.id === group.id())) {
                this.selectRoom(group);
            }
        });
    }

    setNorthAngle(angle) {
        this.northAngle = angle;
        this.drawShaktiChakra();
    }

    setOverlay(name, state) {
        if (this.overlays.hasOwnProperty(name)) {
            this.overlays[name] = state;
            this.drawShaktiChakra();
        }
    }

    exportPlanGeometry() {
        const b = this.boundaryRect;
        const boundary = [
            { x: b.x, y: b.y },
            { x: b.x + b.width, y: b.y },
            { x: b.x + b.width, y: b.y + b.height },
            { x: b.x, y: b.y + b.height }
        ];

        const roomsData = this.rooms.map(rObj => {
            const g = rObj.group;
            const rect = g.findOne('.roomRect');
            const w = rect ? rect.width() : 100;
            const h = rect ? rect.height() : 100;
            const x = g.x();
            const y = g.y();
            return {
                id: rObj.id,
                name: rObj.name,
                category: rObj.category,
                polygon: [
                    { x: x, y: y },
                    { x: x + w, y: y },
                    { x: x + w, y: y + h },
                    { x: x, y: y + h }
                ],
                window_count: 1,
                window_facing: ["East"]
            };
        });

        return {
            boundary: boundary,
            rooms: roomsData,
            entrances: this.entrances.map(e => ({ id: e.id, name: e.name, point: { x: e.x, y: e.y } })),
            fixtures: this.fixtures.map(f => ({ type: f.type, name: f.name, point: { x: f.x, y: f.y } }))
        };
    }

    getHighResSnapshot() {
        return this.stage.toDataURL({ pixelRatio: 2 });
    }
}