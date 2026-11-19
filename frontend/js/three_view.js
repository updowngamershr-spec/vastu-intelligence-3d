/**
 * Professional 3D Architectural & Vastu House Studio (Drive E: Edition)
 * Powered by Three.js & OrbitControls.
 * Features:
 * - Extruded 3D walls with dynamic cutaway height (Low / Medium / Full).
 * - Photorealistic floor materials (Italian Marble, Teak Wood, Granite, Pure Makrana).
 * - 3D Furniture Models (Beds, L-Sofa, Coffee Table, TV Wall, Kitchen Counters, Stoves, Mandir with Diya Light, WC, Dining).
 * - 3D Doors & Glass Windows.
 * - 3D Vastu Shakti Chakra Ring & Brahmasthan grid.
 * - Dynamic Directional Sunlight with soft shadows.
 * - 360° Orbit, Pan, Zoom, and Instant Camera Presets (Isometric, Top-Down, Eye-Level).
 */

class ThreeVastuViewer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.houseGroup = null;
        this.chakraGroup = null;
        this.sunLight = null;
        this.animFrameId = null;

        this.wallCutawayRatio = 0.75; // Default cutaway height (75%)
        this.baseWallHeight = 90;
        this.currentPlanData = null;
        this.currentNorthAngle = 0.0;

        if (this.container) {
            this.init();
        }
    }

    init() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 550;

        // 1. Scene - Sleek Architectural Viewport with High Contrast
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1E222D); // Deep Slate Navy Architectural Theme

        // 2. Camera (Crisp Isometric Perspective)
        this.camera = new THREE.PerspectiveCamera(40, width / height, 1, 5000);
        this.camera.position.set(360, 320, 460);

        // 3. Renderer with High-DPI & Antialiasing
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // 4. Orbit Controls (360 degree rotation, pan, zoom)
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't flip below ground
        this.controls.minDistance = 80;
        this.controls.maxDistance = 1400;
        this.controls.target.set(0, 30, 0);

        // 5. Lighting
        this.setupLighting();

        // 6. Ground & Landscape
        this.setupGround();

        // 7. House & Chakra Groups
        this.houseGroup = new THREE.Group();
        this.scene.add(this.houseGroup);

        this.chakraGroup = new THREE.Group();
        this.scene.add(this.chakraGroup);

        // 8. Start Render Loop
        this.animate = this.animate.bind(this);
        this.animate();

        window.addEventListener('resize', () => this.handleResize());
    }

    setupLighting() {
        // Soft Ambient Light
        const ambient = new THREE.AmbientLight(0xFFFFFF, 0.68);
        this.scene.add(ambient);

        // Directional Sun Light (Morning East-South-East light)
        this.sunLight = new THREE.DirectionalLight(0xFFF9E6, 0.95);
        this.sunLight.position.set(380, 650, 280);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 50;
        this.sunLight.shadow.camera.far = 1800;
        const d = 550;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0004;
        this.scene.add(this.sunLight);

        // Hemisphere Sky/Earth reflection
        const hemi = new THREE.HemisphereLight(0xEDF2F7, 0x4A2E18, 0.32);
        this.scene.add(hemi);
    }

    setupGround() {
        // Ground Plane (Dark Modern Architectural Platform)
        const groundGeo = new THREE.PlaneGeometry(3500, 3500);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x181C26,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 3D Architectural Grid Helper
        const grid = new THREE.GridHelper(2400, 48, 0xC5A059, 0x2B3242);
        grid.position.y = 0;
        this.scene.add(grid);

        // Circular Vastu Patio Platform
        const patioGeo = new THREE.RingGeometry(360, 540, 64);
        const patioMat = new THREE.MeshBasicMaterial({
            color: 0xC5A059,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.25
        });
        const patio = new THREE.Mesh(patioGeo, patioMat);
        patio.rotation.x = -Math.PI / 2;
        patio.position.y = 0.5;
        this.scene.add(patio);
    }

    build3DHouse(planData, northAngle = 0) {
        this.currentPlanData = planData;
        this.currentNorthAngle = northAngle;

        // Clear previous 3D house
        while (this.houseGroup.children.length > 0) {
            const obj = this.houseGroup.children[0];
            this.houseGroup.remove(obj);
        }

        const boundary = planData.boundary || [];
        const rooms = planData.rooms || [];
        const entrances = planData.entrances || [];
        const fixtures = planData.fixtures || [];

        if (boundary.length < 3) return;

        // Calculate center and bounding box
        const xs = boundary.map(p => p.x);
        const ys = boundary.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const width = maxX - minX;
        const depth = maxY - minY;

        const effectiveWallH = this.baseWallHeight * this.wallCutawayRatio;
        const extWallThick = 8;
        const intWallThick = 5;

        // Materials
        const extWallMat = new THREE.MeshStandardMaterial({
            color: 0xFCFAF7, // Crisp warm stucco
            roughness: 0.5,
            metalness: 0.05
        });

        const intWallMat = new THREE.MeshStandardMaterial({
            color: 0xF0ECE1,
            roughness: 0.65
        });

        const plinthMat = new THREE.MeshStandardMaterial({
            color: 0x571A2A, // Luxurious Deep Maroon plinth foundation
            roughness: 0.4
        });

        const halfW = width / 2;
        const halfD = depth / 2;

        // 1. Raised Foundation Plinth
        const plinthGeo = new THREE.BoxGeometry(width + 24, 7, depth + 24);
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(0, 3.5, 0);
        plinth.receiveShadow = true;
        this.houseGroup.add(plinth);

        // 2. Exterior Perimeter Walls (North, South, West, East)
        const wallN = this.createWallBox(width + extWallThick, effectiveWallH, extWallThick, extWallMat);
        wallN.position.set(0, effectiveWallH / 2 + 7, -halfD);
        this.houseGroup.add(wallN);

        const wallS = this.createWallBox(width + extWallThick, effectiveWallH, extWallThick, extWallMat);
        wallS.position.set(0, effectiveWallH / 2 + 7, halfD);
        this.houseGroup.add(wallS);

        const wallW = this.createWallBox(extWallThick, effectiveWallH, depth, extWallMat);
        wallW.position.set(-halfW, effectiveWallH / 2 + 7, 0);
        this.houseGroup.add(wallW);

        const wallE = this.createWallBox(extWallThick, effectiveWallH, depth, extWallMat);
        wallE.position.set(halfW, effectiveWallH / 2 + 7, 0);
        this.houseGroup.add(wallE);

        // 3. Exterior Windows
        this.addExteriorWindows(halfW, halfD, effectiveWallH);

        // 4. Build Rooms with 3D Floors, Interior Walls & Realistic Furniture
        rooms.forEach((r) => {
            const poly = r.polygon || [];
            if (poly.length < 3) return;

            const rxs = poly.map(p => p.x - cx);
            const rzs = poly.map(p => p.y - cy);
            const rMinX = Math.min(...rxs), rMaxX = Math.max(...rxs);
            const rMinZ = Math.min(...rzs), rMaxZ = Math.max(...rzs);
            const rw = Math.max(20, rMaxX - rMinX);
            const rd = Math.max(20, rMaxZ - rMinZ);
            const rcx = (rMinX + rMaxX) / 2;
            const rcz = (rMinZ + rMaxZ) / 2;

            // Room Floor Mesh
            const floorMat = this.getRoomFloorMaterial(r.category);
            const floorGeo = new THREE.BoxGeometry(rw - 2, 2.5, rd - 2);
            const floorMesh = new THREE.Mesh(floorGeo, floorMat);
            floorMesh.position.set(rcx, 7 + 1.25, rcz);
            floorMesh.receiveShadow = true;
            this.houseGroup.add(floorMesh);

            // Interior Partition Walls (South & East internal edges)
            this.buildInteriorWalls(rcx, rcz, rw, rd, effectiveWallH * 0.95, intWallMat, intWallThick);

            // Room 3D Furniture
            this.add3DFurniture(r.category, rcx, rcz, rw, rd);
        });

        // 5. Main Entrances & Portals
        entrances.forEach(e => {
            const ex = (e.point ? e.point.x : (e.x || 0)) - cx;
            const ez = (e.point ? e.point.y : (e.y || 0)) - cy;

            // Door Frame
            const frameH = Math.min(68, effectiveWallH - 4);
            const doorFrameGeo = new THREE.BoxGeometry(26, frameH, 7);
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x4A1E29, roughness: 0.35 });
            const doorFrame = new THREE.Mesh(doorFrameGeo, doorMat);
            doorFrame.position.set(ex, frameH / 2 + 7, ez);
            this.houseGroup.add(doorFrame);

            // Open Wooden Door Leaf
            const doorLeafGeo = new THREE.BoxGeometry(22, frameH - 4, 3);
            const doorLeafMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.4 });
            const doorLeaf = new THREE.Mesh(doorLeafGeo, doorLeafMat);
            doorLeaf.position.set(ex + 10, frameH / 2 + 7, ez - 10);
            doorLeaf.rotation.y = Math.PI / 4;
            this.houseGroup.add(doorLeaf);

            // Golden Vastu Threshold (Dehleez)
            const threshGeo = new THREE.BoxGeometry(30, 3, 10);
            const threshMat = new THREE.MeshStandardMaterial({ color: 0xE5C66D, metalness: 0.85, roughness: 0.2 });
            const thresh = new THREE.Mesh(threshGeo, threshMat);
            thresh.position.set(ex, 8.5, ez);
            this.houseGroup.add(thresh);
        });

        // 6. Build 3D Vastu Shakti Chakra Ring & Energy Grid
        this.build3DShaktiChakra(width, depth, northAngle);

        this.controls.target.set(0, effectiveWallH / 2, 0);
    }

    createWallBox(w, h, d, mat) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    buildInteriorWalls(rcx, rcz, rw, rd, wallH, mat, t = 5) {
        // Southern interior edge wall with doorway gap
        const sWallW = Math.max(10, rw - 26);
        const sWall = this.createWallBox(sWallW, wallH, t, mat);
        sWall.position.set(rcx - 13, wallH / 2 + 7, rcz + rd / 2);
        this.houseGroup.add(sWall);

        // Eastern interior edge wall
        const eWall = this.createWallBox(t, wallH, rd, mat);
        eWall.position.set(rcx + rw / 2, wallH / 2 + 7, rcz);
        this.houseGroup.add(eWall);
    }

    addExteriorWindows(halfW, halfD, wallH) {
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x81D4FA,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.65
        });
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x2A2526, roughness: 0.5 });

        // Add 2 East Windows
        [-halfD * 0.4, halfD * 0.4].forEach(zPos => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(4, 28, 38), glassMat);
            win.position.set(halfW, wallH * 0.55 + 7, zPos);
            this.houseGroup.add(win);
        });

        // Add 2 North Windows
        [-halfW * 0.4, halfW * 0.4].forEach(xPos => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(38, 28, 4), glassMat);
            win.position.set(xPos, wallH * 0.55 + 7, -halfD);
            this.houseGroup.add(win);
        });
    }

    getRoomFloorMaterial(category) {
        let color = 0xF8F5EF;
        let rough = 0.4;
        let metal = 0.1;

        if (category.includes("Living")) {
            // Elegant polished cream Italian marble
            color = 0xF6F2EB;
            rough = 0.22;
            metal = 0.15;
        } else if (category.includes("Kitchen")) {
            // Ceramic quartz granite tiles
            color = 0xEDE7E3;
            rough = 0.32;
        } else if (category.includes("Bed")) {
            // Warm teak/parquet wood flooring
            color = 0xD7C4B7;
            rough = 0.65;
        } else if (category.includes("Toilet")) {
            // Slate / Anti-skid ceramic tiles
            color = 0xCFD8DC;
            rough = 0.5;
        } else if (category.includes("Mandir")) {
            // Pure white Makrana marble with high gloss
            color = 0xFFFFFF;
            rough = 0.12;
            metal = 0.25;
        } else if (category.includes("Balcony")) {
            // Terracotta outdoor stone
            color = 0xD7CCC8;
            rough = 0.85;
        } else if (category.includes("Dining")) {
            color = 0xF5EBE1;
            rough = 0.28;
        }

        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: rough,
            metalness: metal
        });
    }

    add3DFurniture(category, x, z, rw, rd) {
        const grp = new THREE.Group();
        grp.position.set(x, 8.5, z);

        if (category.includes("Bed")) {
            // 3D Master Bed Setup
            const bedW = Math.min(68, rw * 0.55);
            const bedL = Math.min(84, rd * 0.68);

            // Bedframe (Rich Teak Wood)
            const frameGeo = new THREE.BoxGeometry(bedW, 11, bedL);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, roughness: 0.5 });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.y = 5.5;
            frame.castShadow = true;
            grp.add(frame);

            // Plush White Mattress
            const mattGeo = new THREE.BoxGeometry(bedW - 4, 9, bedL - 4);
            const mattMat = new THREE.MeshStandardMaterial({ color: 0xFAFAFA, roughness: 0.85 });
            const matt = new THREE.Mesh(mattGeo, mattMat);
            matt.position.y = 13.5;
            matt.castShadow = true;
            grp.add(matt);

            // Carved Wood Headboard
            const hbGeo = new THREE.BoxGeometry(bedW + 6, 28, 5);
            const hb = new THREE.Mesh(hbGeo, frameMat);
            hb.position.set(0, 18, -bedL / 2);
            hb.castShadow = true;
            grp.add(hb);

            // Gold Pillows
            const pilGeo = new THREE.BoxGeometry(bedW * 0.38, 4.5, 14);
            const pilMat = new THREE.MeshStandardMaterial({ color: 0xE5C66D });
            const p1 = new THREE.Mesh(pilGeo, pilMat);
            p1.position.set(-bedW * 0.22, 19, -bedL / 2 + 10);
            const p2 = new THREE.Mesh(pilGeo, pilMat);
            p2.position.set(bedW * 0.22, 19, -bedL / 2 + 10);
            grp.add(p1);
            grp.add(p2);

            // Nightstands with bedside lamps
            [-bedW / 2 - 10, bedW / 2 + 10].forEach(sideX => {
                const nsGeo = new THREE.BoxGeometry(14, 14, 14);
                const ns = new THREE.Mesh(nsGeo, frameMat);
                ns.position.set(sideX, 7, -bedL / 2 + 10);
                grp.add(ns);

                const lampGeo = new THREE.CylinderGeometry(4, 6, 8, 12);
                const lampMat = new THREE.MeshStandardMaterial({ color: 0xFFF9C4, emissive: 0xFFE082, emissiveIntensity: 0.4 });
                const lamp = new THREE.Mesh(lampGeo, lampMat);
                lamp.position.set(sideX, 18, -bedL / 2 + 10);
                grp.add(lamp);
            });

        } else if (category.includes("Kitchen")) {
            // Modular Kitchen Counter + Gas Stove + Sink
            const cw = Math.min(rw * 0.88, 115);
            const ch = 28;
            const cd = 22;

            // Main Granite Countertop
            const counterGeo = new THREE.BoxGeometry(cw, ch, cd);
            const counterMat = new THREE.MeshStandardMaterial({ color: 0x2A2526, roughness: 0.2 }); // Jet Black granite
            const counter = new THREE.Mesh(counterGeo, counterMat);
            counter.position.set(0, ch / 2, -rd / 2 + cd / 2 + 6);
            counter.castShadow = true;
            grp.add(counter);

            // 3-Burner Gas Stove (Agni)
            const stoveGeo = new THREE.BoxGeometry(26, 3, 14);
            const stoveMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, metalness: 0.9, roughness: 0.2 });
            const stove = new THREE.Mesh(stoveGeo, stoveMat);
            stove.position.set(15, ch + 1.5, -rd / 2 + cd / 2 + 6);
            grp.add(stove);

            // Burner flame caps
            [-7, 0, 7].forEach(bx => {
                const burner = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1, 12), new THREE.MeshStandardMaterial({ color: 0xF57C00 }));
                burner.position.set(15 + bx, ch + 3.2, -rd / 2 + cd / 2 + 6);
                grp.add(burner);
            });

            // Stainless Steel Sink
            const sinkGeo = new THREE.BoxGeometry(22, 2, 14);
            const sinkMat = new THREE.MeshStandardMaterial({ color: 0x78909C, metalness: 0.85 });
            const sink = new THREE.Mesh(sinkGeo, sinkMat);
            sink.position.set(-cw / 2 + 22, ch + 1.2, -rd / 2 + cd / 2 + 6);
            grp.add(sink);

            // Chrome Faucet
            const faucetGeo = new THREE.CylinderGeometry(1, 1, 8, 8);
            const faucetMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, metalness: 0.95 });
            const faucet = new THREE.Mesh(faucetGeo, faucetMat);
            faucet.position.set(-cw / 2 + 22, ch + 5, -rd / 2 + cd / 2 + 1);
            grp.add(faucet);

        } else if (category.includes("Living")) {
            // Modern Sectional L-Sofa + Coffee Table + TV Wall
            const sofaMat = new THREE.MeshStandardMaterial({ color: 0x283593, roughness: 0.75 }); // Royal Navy Fabric
            
            // 3-Seater Couch
            const s1Geo = new THREE.BoxGeometry(85, 18, 30);
            const s1 = new THREE.Mesh(s1Geo, sofaMat);
            s1.position.set(0, 9, 22);
            s1.castShadow = true;
            grp.add(s1);

            // Sofa backrest
            const brGeo = new THREE.BoxGeometry(85, 16, 9);
            const br = new THREE.Mesh(brGeo, sofaMat);
            br.position.set(0, 24, 33);
            grp.add(br);

            // Sectional L-Lounge Extension
            const s2Geo = new THREE.BoxGeometry(30, 18, 45);
            const s2 = new THREE.Mesh(s2Geo, sofaMat);
            s2.position.set(38, 9, -6);
            grp.add(s2);

            // Wooden Coffee Table
            const ctGeo = new THREE.BoxGeometry(48, 11, 26);
            const ctMat = new THREE.MeshStandardMaterial({ color: 0x571A2A, roughness: 0.35 });
            const ct = new THREE.Mesh(ctGeo, ctMat);
            ct.position.set(-6, 5.5, -12);
            ct.castShadow = true;
            grp.add(ct);

            // Wall Mounted LED TV Screen on opposite wall
            const tvGeo = new THREE.BoxGeometry(60, 34, 3);
            const tvMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
            const tv = new THREE.Mesh(tvGeo, tvMat);
            tv.position.set(0, 42, -rd / 2 + 5);
            grp.add(tv);

        } else if (category.includes("Toilet")) {
            // Ceramic WC Commode & Vanity Sink
            const wcBaseGeo = new THREE.CylinderGeometry(7, 9, 15, 16);
            const wcMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.1 });
            const wcBase = new THREE.Mesh(wcBaseGeo, wcMat);
            wcBase.position.set(0, 7.5, 0);
            wcBase.castShadow = true;
            grp.add(wcBase);

            const cistGeo = new THREE.BoxGeometry(18, 20, 9);
            const cist = new THREE.Mesh(cistGeo, wcMat);
            cist.position.set(0, 18, -10);
            grp.add(cist);

            // Vanity Wash Basin
            const basinGeo = new THREE.BoxGeometry(22, 6, 16);
            const basin = new THREE.Mesh(basinGeo, wcMat);
            basin.position.set(rw / 2 - 20, 25, 0);
            grp.add(basin);

        } else if (category.includes("Mandir")) {
            // Sacred Pooja Mandir with Golden Shikhara & Diya Light
            const altarGeo = new THREE.BoxGeometry(34, 32, 22);
            const altarMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.4 });
            const altar = new THREE.Mesh(altarGeo, altarMat);
            altar.position.set(0, 16, 0);
            altar.castShadow = true;
            grp.add(altar);

            // Golden Sanctum Shikhara Dome
            const domeGeo = new THREE.ConeGeometry(13, 20, 16);
            const domeMat = new THREE.MeshStandardMaterial({ color: 0xE5C66D, metalness: 0.9, roughness: 0.15 });
            const dome = new THREE.Mesh(domeGeo, domeMat);
            dome.position.set(0, 42, 0);
            grp.add(dome);

            // Golden Kalash Finial
            const kalashGeo = new THREE.SphereGeometry(3, 12, 12);
            const kalash = new THREE.Mesh(kalashGeo, domeMat);
            kalash.position.set(0, 53, 0);
            grp.add(kalash);

            // Warm Divine Diya Light Glow
            const diyaLight = new THREE.PointLight(0xFFD54F, 1.4, 140);
            diyaLight.position.set(0, 26, 12);
            grp.add(diyaLight);
        }

        this.houseGroup.add(grp);
    }

    build3DShaktiChakra(houseW, houseD, northAngle) {
        // Clear previous chakra
        while (this.chakraGroup.children.length > 0) {
            this.chakraGroup.remove(this.chakraGroup.children[0]);
        }

        const R = Math.max(houseW, houseD) * 0.82;
        const radOffset = (northAngle * Math.PI) / 180;

        // 1. Outer Golden Ring
        const ringGeo = new THREE.RingGeometry(R - 4, R + 18, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xC5A059,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = 1.2;
        this.chakraGroup.add(ringMesh);

        // 2. 16-Zone Energy Radial Rays
        const zoneColors = [
            0x1E88E5, 0x03A9F4, 0x00BCD4, 0x4CAF50, // N, NNE, NE, ENE
            0x8BC34A, 0xCDDC39, 0xFF9800, 0xFF5722, // E, ESE, SE, SSE
            0xE91E63, 0x795548, 0xFFC107, 0x9E9E9E, // S, SSW, SW, WSW
            0x607D8B, 0xB0BEC5, 0x80CBC4, 0x26C6DA  // W, WNW, NW, NNW
        ];

        for (let i = 0; i < 16; i++) {
            const angle = (i * 22.5 * Math.PI) / 180 + radOffset - Math.PI / 2;
            const points = [
                new THREE.Vector3(0, 1.5, 0),
                new THREE.Vector3(R * Math.cos(angle), 1.5, R * Math.sin(angle))
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: zoneColors[i % zoneColors.length],
                linewidth: 2,
                transparent: true,
                opacity: 0.55
            });
            const line = new THREE.Line(lineGeo, lineMat);
            this.chakraGroup.add(line);
        }

        // 3. 3D True North Indicator Arrow
        const northRad = (northAngle * Math.PI) / 180;
        const arrowGeo = new THREE.ConeGeometry(12, 45, 16);
        const arrowMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.3 });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(
            (R + 32) * Math.sin(northRad),
            14,
            -(R + 32) * Math.cos(northRad)
        );
        arrow.rotation.z = -Math.PI / 2;
        arrow.rotation.y = -northRad;
        this.chakraGroup.add(arrow);
    }

    setCameraPreset(mode) {
        if (!this.camera || !this.controls) return;

        if (mode === 'iso') {
            // Isometric 45 Degree Angle
            this.camera.position.set(450, 480, 580);
            this.controls.target.set(0, 35, 0);
        } else if (mode === 'top') {
            // Direct Top-Down 2D/3D Plan View
            this.camera.position.set(0, 780, 0);
            this.controls.target.set(0, 0, 0);
        } else if (mode === 'walk') {
            // Eye-Level Interior Walkthrough Perspective
            this.camera.position.set(0, 36, 120);
            this.controls.target.set(0, 36, -60);
        } else if (mode === 'front') {
            // Front Elevation
            this.camera.position.set(0, 80, 600);
            this.controls.target.set(0, 40, 0);
        }
        this.controls.update();
    }

    setWallCutaway(ratio) {
        this.wallCutawayRatio = ratio;
        if (this.currentPlanData) {
            this.build3DHouse(this.currentPlanData, this.currentNorthAngle);
        }
    }

    setSunAngle(degrees) {
        if (!this.sunLight) return;
        const rad = (degrees * Math.PI) / 180;
        const dist = 750;
        this.sunLight.position.set(dist * Math.cos(rad), 650, dist * Math.sin(rad));
    }

    toggleChakra(visible) {
        if (this.chakraGroup) {
            this.chakraGroup.visible = visible;
        }
    }

    animate() {
        this.animFrameId = requestAnimationFrame(this.animate);
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    handleResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    get3DSnapshotDataURL() {
        if (!this.renderer) return "";
        this.renderer.render(this.scene, this.camera);
        return this.renderer.domElement.toDataURL("image/png");
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}