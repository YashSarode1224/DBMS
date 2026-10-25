import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Satellite,
    RotateCcw,
    RefreshCw,
    Sun,
    Moon,
    Maximize2
} from 'lucide-react';

export interface SatelliteData {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    altitude_km: number;
    inclination?: number;
    velocity_kms?: number;
    status?: 'active' | 'standby' | 'degraded';
    solar_power_w?: number;
    battery_pct?: number;
}

export interface GroundStationData {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation_m?: number;
    status?: 'online' | 'busy' | 'offline';
    active_links?: number;
    band?: string;
}

export interface GlobeViewerProps {
    satellites?: SatelliteData[];
    groundStations?: GroundStationData[];
    showOrbits?: boolean;
    onSatelliteSelect?: (sat: SatelliteData | null) => void;
    onGroundStationSelect?: (gs: GroundStationData | null) => void;
}

const EARTH_RADIUS = 100;
const D = Math.PI / 180;
const MIN_ELEV_RAD = 10 * D; // 10 deg elevation mask for contact pass

// Default fallback constellation data
const DEFAULT_SATELLITES: SatelliteData[] = [
    { id: 1, name: 'Aurora-1', latitude: 45.2, longitude: -122.3, altitude_km: 550, inclination: 53.0, velocity_kms: 7.59, status: 'active', solar_power_w: 2450, battery_pct: 96 },
    { id: 2, name: 'Aurora-2', latitude: 32.1, longitude: 89.5, altitude_km: 550, inclination: 53.0, velocity_kms: 7.59, status: 'active', solar_power_w: 2380, battery_pct: 89 },
    { id: 3, name: 'Boreas-1', latitude: -15.8, longitude: 45.2, altitude_km: 700, inclination: 98.0, velocity_kms: 7.51, status: 'active', solar_power_w: 2510, battery_pct: 93 },
    { id: 4, name: 'Boreas-2', latitude: 61.2, longitude: -45.1, altitude_km: 700, inclination: 98.0, velocity_kms: 7.51, status: 'standby', solar_power_w: 2790, battery_pct: 99 },
    { id: 5, name: 'Cirrus-1', latitude: 8.4, longitude: 120.5, altitude_km: 1200, inclination: 65.0, velocity_kms: 7.24, status: 'active', solar_power_w: 2420, battery_pct: 94 },
    { id: 6, name: 'Cirrus-2', latitude: -30.4, longitude: -70.5, altitude_km: 1200, inclination: 65.0, velocity_kms: 7.24, status: 'active', solar_power_w: 2460, battery_pct: 91 },
    { id: 7, name: 'Delta-1', latitude: 20.4, longitude: -15.5, altitude_km: 800, inclination: 28.0, velocity_kms: 7.45, status: 'active', solar_power_w: 2600, battery_pct: 95 },
    { id: 8, name: 'Orion-1', latitude: 50.1, longitude: 10.2, altitude_km: 20200, inclination: 55.0, velocity_kms: 3.87, status: 'active', solar_power_w: 3200, battery_pct: 98 },
    { id: 9, name: 'Orion-2', latitude: -10.5, longitude: 130.4, altitude_km: 20200, inclination: 55.0, velocity_kms: 3.87, status: 'active', solar_power_w: 3200, battery_pct: 97 },
    { id: 10, name: 'Orion-3', latitude: 0.0, longitude: -80.0, altitude_km: 20200, inclination: 55.0, velocity_kms: 3.87, status: 'active', solar_power_w: 3200, battery_pct: 98 },
];

const DEFAULT_GROUND_STATIONS: GroundStationData[] = [
    { id: 1, name: 'Bengaluru', latitude: 12.97, longitude: 77.59, elevation_m: 920, status: 'online', active_links: 2, band: 'S-band' },
    { id: 2, name: 'Svalbard', latitude: 78.23, longitude: 15.39, elevation_m: 490, status: 'online', active_links: 2, band: 'X-band' },
    { id: 3, name: 'Fairbanks', latitude: 64.84, longitude: -147.72, elevation_m: 135, status: 'online', active_links: 1, band: 'S / X-band' },
    { id: 4, name: 'Cape Town', latitude: -33.92, longitude: 18.42, elevation_m: 25, status: 'online', active_links: 1, band: 'Ka-band' },
    { id: 5, name: 'Santiago', latitude: -33.45, longitude: -70.67, elevation_m: 570, status: 'online', active_links: 1, band: 'X-band' },
    { id: 6, name: 'Canberra', latitude: -35.28, longitude: 149.13, elevation_m: 650, status: 'online', active_links: 1, band: 'Ka-band' },
];

// Coordinate conversion: Lat/Lon -> Vector3
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

// Procedural fallback Earth texture
function createProceduralEarthTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a0e14');
    oceanGrad.addColorStop(0.5, '#121720');
    oceanGrad.addColorStop(1, '#0a0e14');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = '#1e2420';
    ctx.strokeStyle = '#2d3730';
    ctx.lineWidth = 1;

    const continents = [
        [[120, 100], [280, 80], [320, 160], [240, 220], [160, 200]],
        [[220, 240], [280, 260], [260, 360], [200, 340]],
        [[450, 90], [560, 80], [540, 180], [460, 170]],
        [[450, 180], [560, 180], [580, 320], [470, 330]],
        [[600, 80], [860, 90], [820, 240], [680, 220]],
        [[750, 280], [870, 270], [850, 360], [740, 350]],
    ];

    continents.forEach(poly => {
        ctx.beginPath();
        poly.forEach(([px, py], i) => {
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    return new THREE.CanvasTexture(canvas);
}

// Procedural clouds texture
function createProceduralCloudsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

    for (let i = 0; i < 45; i++) {
        const cx = Math.random() * 512;
        const cy = 40 + Math.random() * 176;
        const rad = 15 + Math.random() * 35;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

// Glowing halo sprite texture
function createGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

// Build 3D Satellite Mesh with solar panels
function buildSatelliteMesh(colorHex: number, glowTex: THREE.CanvasTexture): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 1.6, 2.4);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xdde4ec,
        metalness: 0.8,
        roughness: 0.25,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Solar Panels
    const panelGeo = new THREE.BoxGeometry(3.4, 0.1, 1.6);
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x2a5f9e,
        emissive: 0x0c2a55,
        roughness: 0.3,
        metalness: 0.6,
    });
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.x = 2.6;
    group.add(panelL);

    const panelR = panelL.clone();
    panelR.position.x = -2.6;
    group.add(panelR);

    // Glowing Sprite Halo
    const haloMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: colorHex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(7, 7, 1);
    group.add(halo);

    return group;
}

// Build 3D Ground Station Pin Marker
function buildGroundStationMesh(): THREE.Group {
    const group = new THREE.Group();

    // Base Pad Ring (Golden Amber)
    const padGeo = new THREE.RingGeometry(0.8, 1.8, 24);
    const padMat = new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = Math.PI / 2;
    group.add(pad);

    // Geodesic Radome (Dome)
    const domeGeo = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.4,
        roughness: 0.2,
    });
    group.add(new THREE.Mesh(domeGeo, domeMat));

    // Antenna Mast (Steel Blue)
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.4);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x7fb2d4, metalness: 0.5 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 1.2;
    group.add(mast);

    // Pulsing Radar Wave Ring
    const waveGeo = new THREE.RingGeometry(2.0, 2.4, 24);
    const waveMat = new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = Math.PI / 2;
    wave.name = 'radarWave';
    group.add(wave);

    return group;
}

export default function GlobeViewer({
    satellites = DEFAULT_SATELLITES,
    groundStations = DEFAULT_GROUND_STATIONS,
    showOrbits = true,
    onSatelliteSelect,
    onGroundStationSelect,
}: GlobeViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    // Feature Toggles (from HTML reference dock)
    const [orbitsVisible, setOrbitsVisible] = useState(showOrbits);
    const [linksVisible, setLinksVisible] = useState(true);
    const [cloudsVisible, setCloudsVisible] = useState(true);
    const [labelsVisible, setLabelsVisible] = useState(true);

    // Speed Controls (from HTML reference dock)
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [isPaused, setIsPaused] = useState(false);

    // Lighting & Environment
    const [lightingMode, setLightingMode] = useState<'sun' | 'bright'>('sun');
    const [autoRotate, setAutoRotate] = useState(true);

    // Selected Object & Active Inspector Tab
    const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);
    const [selectedGs, setSelectedGs] = useState<GroundStationData | null>(null);
    const [inspectorTab, setInspectorTab] = useState<'sat' | 'gs'>('sat');

    // Live Simulation Time
    const [simTime, setSimTime] = useState('');
    const [activeLinksCount, setActiveLinksCount] = useState(0);

    // Screen-projected 2D labels for 3D elements
    const [labels2D, setLabels2D] = useState<Array<{ name: string; x: number; y: number; kind: 'sat' | 'gs'; color: string; id: number }>>([]);

    const effectiveSatellites = useMemo(
        () => (satellites.length > 0 ? satellites : DEFAULT_SATELLITES),
        [satellites]
    );

    const effectiveGroundStations = useMemo(
        () => (groundStations.length > 0 ? groundStations : DEFAULT_GROUND_STATIONS),
        [groundStations]
    );

    const handleSelectSatellite = useCallback((sat: SatelliteData | null) => {
        setSelectedSat(sat);
        setSelectedGs(null);
        if (sat) setInspectorTab('sat');
        onSatelliteSelect?.(sat);
    }, [onSatelliteSelect]);

    const handleSelectGroundStation = useCallback((gs: GroundStationData | null) => {
        setSelectedGs(gs);
        setSelectedSat(null);
        if (gs) setInspectorTab('gs');
        onGroundStationSelect?.(gs);
    }, [onGroundStationSelect]);

    // Focus Camera on Object
    const handleFocusObject = useCallback((targetPos: THREE.Vector3, distance: number = 240) => {
        if (!cameraRef.current || !controlsRef.current) return;
        const norm = targetPos.clone().normalize();
        cameraRef.current.position.copy(norm.multiplyScalar(distance));
        controlsRef.current.target.copy(new THREE.Vector3(0, 0, 0));
        controlsRef.current.update();
    }, []);

    const handleResetCamera = useCallback(() => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(220, 140, 280);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        setSelectedSat(null);
        setSelectedGs(null);
    }, []);

    // Main Three.js Scene Setup & Animation Loop
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x02050b); // Deepest space black from reference

        // Camera
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
        camera.position.set(220, 140, 280);
        cameraRef.current = camera;

        // Renderer
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        } catch {
            return;
        }
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 115;
        controls.maxDistance = 800;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 1.0;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x3a5570, lightingMode === 'sun' ? 0.65 : 0.95);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfff4e0, lightingMode === 'sun' ? 1.8 : 1.3);
        sunLight.position.set(350, 120, 240);
        scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0x1a2c42, 0.35);
        fillLight.position.set(-250, -80, -250);
        scene.add(fillLight);

        // Starfield
        const starCount = 1200;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const z = Math.random() * 2 - 1;
            const theta = Math.random() * Math.PI * 2;
            const r = Math.sqrt(1 - z * z) * 900;
            starPos[i * 3] = Math.cos(theta) * r;
            starPos[i * 3 + 1] = z * 900;
            starPos[i * 3 + 2] = Math.sin(theta) * r;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xcfe0f0,
            size: 1.2,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.75,
        });
        scene.add(new THREE.Points(starGeo, starMat));

        // Earth Celestial Group (Tilted on 23.44° axis)
        const earthGroup = new THREE.Group();
        earthGroup.rotation.z = (23.44 * Math.PI) / 180;
        scene.add(earthGroup);

        // Earth Base Sphere
        const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
        const proceduralEarthTex = createProceduralEarthTexture();
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: proceduralEarthTex,
            shininess: 12,
            specular: new THREE.Color(0x101a24),
        });
        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        earthGroup.add(earthMesh);

        // Load NASA High-Res Blue Marble asynchronously
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'anonymous';
        textureLoader.load(
            'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                earthMaterial.map = tex;
                earthMaterial.needsUpdate = true;
            },
            undefined,
            () => {
                textureLoader.load(
                    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
                    (fallbackTex) => {
                        fallbackTex.colorSpace = THREE.SRGBColorSpace;
                        earthMaterial.map = fallbackTex;
                        earthMaterial.needsUpdate = true;
                    }
                );
            }
        );

        // Realistic Clouds Layer
        const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 64, 48);
        const proceduralCloudsTex = createProceduralCloudsTexture();
        const cloudsMat = new THREE.MeshPhongMaterial({
            map: proceduralCloudsTex,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
        });
        const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
        earthGroup.add(cloudsMesh);

        textureLoader.load(
            'https://unpkg.com/three-globe/example/img/earth-clouds.png',
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                cloudsMat.map = tex;
                cloudsMat.needsUpdate = true;
            }
        );

        // Subtle Atmospheric Rim Glow (from HTML reference)
        const atmosGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.018, 64, 48);
        const atmosMat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vN;
                void main() {
                    vN = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vN;
                void main() {
                    float i = pow(max(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
                    gl_FragColor = vec4(0.35, 0.62, 1.0, 1.0) * i * 1.5;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
        });
        earthGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

        // Ground Stations Pinned to Earth Surface
        const gsGroup = new THREE.Group();
        earthMesh.add(gsGroup);

        const groundStationRuntimes: Array<{ data: GroundStationData; group: THREE.Group }> = [];
        effectiveGroundStations.forEach((gs) => {
            const gsMesh = buildGroundStationMesh();
            const pos = latLonToVector3(gs.latitude, gs.longitude, EARTH_RADIUS + 0.3);
            gsMesh.position.copy(pos);

            const normal = pos.clone().normalize();
            gsMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            gsMesh.userData = { isGroundStation: true, gsData: gs };

            gsGroup.add(gsMesh);
            groundStationRuntimes.push({ data: gs, group: gsMesh });
        });

        // Satellites & Orbits
        const glowTex = createGlowTexture();
        const orbitsGroup = new THREE.Group();
        scene.add(orbitsGroup);

        const satellitesGroup = new THREE.Group();
        scene.add(satellitesGroup);

        interface SatRuntime {
            data: SatelliteData;
            mesh: THREE.Group;
            orbitLine: THREE.Line;
            orbitRadius: number;
            inclinationRad: number;
            raanRad: number;
            period: number;
            phaseOffset: number;
            colorHex: number;
            currentPos: THREE.Vector3;
        }

        const satRuntimes: SatRuntime[] = [];

        effectiveSatellites.forEach((sat, index) => {
            const isMEO = sat.altitude_km > 3000;
            const satRadius = isMEO ? EARTH_RADIUS * 2.2 : EARTH_RADIUS + Math.max(16, sat.altitude_km * 0.038);
            const inclinationRad = ((sat.inclination || (isMEO ? 55 : 53)) * Math.PI) / 180;
            const raanRad = ((index * 36) * Math.PI) / 180;
            const period = 92 + (sat.altitude_km - 500) * 0.05;

            // Palette from reference: LEO = Amber (0xf2c14e), MEO = Cyan (0x6fd6e8)
            const colorHex = isMEO ? 0x6fd6e8 : 0xf2c14e;

            // Orbit Track Ring
            const orbitPoints: THREE.Vector3[] = [];
            const segments = 128;
            for (let s = 0; s <= segments; s++) {
                const u = (s / segments) * Math.PI * 2;
                const localPos = new THREE.Vector3(satRadius * Math.cos(u), 0, satRadius * Math.sin(u));
                localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinationRad);
                localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), raanRad);
                orbitPoints.push(localPos);
            }
            const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            const orbitMat = new THREE.LineBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.32,
                linewidth: 1,
            });
            const orbitLine = new THREE.Line(orbitGeo, orbitMat);
            orbitsGroup.add(orbitLine);

            // Satellite Model
            const satMesh = buildSatelliteMesh(colorHex, glowTex);
            satMesh.userData = { isSatellite: true, satData: sat };
            satellitesGroup.add(satMesh);

            satRuntimes.push({
                data: sat,
                mesh: satMesh,
                orbitLine,
                orbitRadius: satRadius,
                inclinationRad,
                raanRad,
                period,
                phaseOffset: (index * Math.PI * 2) / effectiveSatellites.length,
                colorHex,
                currentPos: new THREE.Vector3(),
            });
        });

        // Dynamic Line Segments for Active Satellite-to-Ground Links
        const maxLinks = effectiveSatellites.length * effectiveGroundStations.length;
        const lineGeo = new THREE.BufferGeometry();
        const linePos = new Float32Array(maxLinks * 6);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));

        const lineMat = new THREE.LineBasicMaterial({
            color: 0xf2c14e, // Golden Amber beams from reference
            transparent: true,
            opacity: 0.45,
            linewidth: 2,
            depthWrite: false,
        });
        const linksLineMesh = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(linksLineMesh);

        // Raycasting for User Clicks
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (e: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            for (const hit of intersects) {
                let curr: THREE.Object3D | null = hit.object;
                while (curr && curr !== scene) {
                    if (curr.userData.isSatellite) {
                        handleSelectSatellite(curr.userData.satData);
                        return;
                    }
                    if (curr.userData.isGroundStation) {
                        handleSelectGroundStation(curr.userData.gsData);
                        return;
                    }
                    curr = curr.parent;
                }
            }
        };

        renderer.domElement.addEventListener('click', handleClick);

        // Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newW = entry.contentRect.width;
                const newH = entry.contentRect.height;
                if (newW > 0 && newH > 0) {
                    camera.aspect = newW / newH;
                    camera.updateProjectionMatrix();
                    renderer.setSize(newW, newH);
                }
            }
        });
        resizeObserver.observe(container);

        // Main Animation Loop
        let animId: number;
        let clock = new THREE.Clock();
        let simSeconds = 0;
        let lastUiUpdate = 0;

        const animate = () => {
            animId = requestAnimationFrame(animate);

            const dt = Math.min(clock.getDelta(), 0.1);
            if (!isPaused) {
                simSeconds += dt * speedMultiplier;
            }

            // Earth axial rotation
            const earthAng = (simSeconds * 2 * Math.PI) / 86164;
            if (autoRotate && !isPaused) {
                earthMesh.rotation.y = earthAng;
                cloudsMesh.rotation.y = earthAng * 1.04 + 0.4;
            }
            cloudsMesh.visible = cloudsVisible;

            // Propagate Satellites along Keplerian Orbits
            satRuntimes.forEach((runtime) => {
                const angle = (simSeconds / (runtime.period * 60)) * Math.PI * 2 + runtime.phaseOffset;
                const localPos = new THREE.Vector3(
                    runtime.orbitRadius * Math.cos(angle),
                    0,
                    runtime.orbitRadius * Math.sin(angle)
                );
                localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), runtime.inclinationRad);
                localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), runtime.raanRad);

                runtime.mesh.position.copy(localPos);
                runtime.currentPos.copy(localPos);
                runtime.mesh.lookAt(0, 0, 0);

                // Highlight selected satellite orbit
                const isSelected = selectedSat?.id === runtime.data.id;
                (runtime.orbitLine.material as THREE.LineBasicMaterial).opacity = isSelected ? 0.95 : 0.32;
            });

            // Update Ground Station surface positions
            const gsWorldPositions: THREE.Vector3[] = [];
            groundStationRuntimes.forEach((gs) => {
                const worldPos = new THREE.Vector3();
                gs.group.getWorldPosition(worldPos);
                gsWorldPositions.push(worldPos);

                // Animate radar wave ring
                const waveMesh = gs.group.getObjectByName('radarWave') as THREE.Mesh;
                if (waveMesh) {
                    const wavePhase = (clock.getElapsedTime() * 2 + gs.data.id) % 1;
                    waveMesh.scale.setScalar(1 + wavePhase * 0.8);
                    (waveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - wavePhase * 0.7);
                }
            });

            // Compute in-view contact links between satellites and ground stations
            let linksIdx = 0;
            const positionsArr = lineGeo.attributes.position.array as Float32Array;

            if (linksVisible) {
                satRuntimes.forEach((sat) => {
                    gsWorldPositions.forEach((gsPos) => {
                        const dist = sat.currentPos.distanceTo(gsPos);
                        const toSat = sat.currentPos.clone().sub(gsPos).normalize();
                        const gsNormal = gsPos.clone().normalize();
                        const elevationAngle = Math.asin(toSat.dot(gsNormal));

                        // Visible pass when elevation above horizon mask (> 10°)
                        if (elevationAngle > MIN_ELEV_RAD && dist < 320) {
                            positionsArr[linksIdx * 6] = gsPos.x;
                            positionsArr[linksIdx * 6 + 1] = gsPos.y;
                            positionsArr[linksIdx * 6 + 2] = gsPos.z;
                            positionsArr[linksIdx * 6 + 3] = sat.currentPos.x;
                            positionsArr[linksIdx * 6 + 4] = sat.currentPos.y;
                            positionsArr[linksIdx * 6 + 5] = sat.currentPos.z;
                            linksIdx++;
                        }
                    });
                });
            }

            lineGeo.setDrawRange(0, linksIdx * 2);
            lineGeo.attributes.position.needsUpdate = true;
            orbitsGroup.visible = orbitsVisible;

            controls.update();
            renderer.render(scene, camera);

            // Throttle UI / 2D screen projections to 10 FPS for max performance
            const nowTime = performance.now();
            if (nowTime - lastUiUpdate > 100) {
                lastUiUpdate = nowTime;
                setActiveLinksCount(linksIdx);

                // Update mission clock
                const missionDate = new Date(Date.now() + simSeconds * 1000);
                setSimTime(missionDate.toUTCString().slice(17, 25) + ' UTC');

                // 2D screen projection of labels
                if (labelsVisible && width > 0 && height > 0) {
                    const projectedLabels: Array<{ name: string; x: number; y: number; kind: 'sat' | 'gs'; color: string; id: number }> = [];

                    satRuntimes.forEach((sat) => {
                        const v = sat.currentPos.clone().project(camera);
                        // Check if in front of camera
                        if (v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95) {
                            const screenX = ((v.x + 1) / 2) * width;
                            const screenY = ((-v.y + 1) / 2) * height;
                            projectedLabels.push({
                                name: sat.data.name,
                                x: screenX,
                                y: screenY,
                                kind: 'sat',
                                color: sat.data.altitude_km > 3000 ? '#6fd6e8' : '#f2c14e',
                                id: sat.data.id,
                            });
                        }
                    });

                    groundStationRuntimes.forEach((gs, i) => {
                        const wPos = gsWorldPositions[i];
                        if (wPos) {
                            const v = wPos.clone().project(camera);
                            // Avoid drawing if behind the Earth sphere
                            const camDist = camera.position.distanceTo(wPos);
                            const earthDist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
                            if (v.z < 1 && camDist < earthDist && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95) {
                                const screenX = ((v.x + 1) / 2) * width;
                                const screenY = ((-v.y + 1) / 2) * height;
                                projectedLabels.push({
                                    name: gs.data.name,
                                    x: screenX,
                                    y: screenY,
                                    kind: 'gs',
                                    color: '#7fb2d4',
                                    id: gs.data.id,
                                });
                            }
                        }
                    });

                    setLabels2D(projectedLabels);
                } else {
                    setLabels2D([]);
                }
            }
        };

        animId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animId);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('click', handleClick);
            renderer.dispose();
        };
    }, [
        effectiveSatellites,
        effectiveGroundStations,
        orbitsVisible,
        linksVisible,
        cloudsVisible,
        labelsVisible,
        speedMultiplier,
        isPaused,
        lightingMode,
        autoRotate,
        selectedSat,
        handleSelectSatellite,
        handleSelectGroundStation,
    ]);

    return (
        <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-[#02050b] overflow-hidden select-none">
            {/* Top Operations Header Chip (from reference) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 pointer-events-auto">
                <span className="chip live mono text-xs py-1.5 px-3.5 shadow-lg">
                    <i className="dot" />
                    <span>3D REAL EARTH ENGINE</span>
                    <span className="text-[#8fa6ba] font-normal">|</span>
                    <span className="text-[#e8f1f8] font-semibold">{simTime || 'SYNCING UTC...'}</span>
                </span>
            </div>

            {/* Top-Right Micro Action Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
                <button
                    onClick={() => setLightingMode(lightingMode === 'sun' ? 'bright' : 'sun')}
                    className="chip text-xs py-1.5 px-3 hover:border-[#7fb2d4] transition-all cursor-pointer text-[#8fa6ba] hover:text-[#e8f1f8]"
                    title={lightingMode === 'sun' ? 'Switch to Full Brightness' : 'Switch to Realistic Sunlight'}
                >
                    {lightingMode === 'sun' ? <Sun className="w-4 h-4 text-[#f2c14e]" /> : <Moon className="w-4 h-4 text-[#7fb2d4]" />}
                </button>

                <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`chip text-xs py-1.5 px-3 transition-all cursor-pointer ${
                        autoRotate ? 'border-[#f2c14e] text-[#f2c14e]' : 'text-[#8fa6ba] hover:text-[#e8f1f8]'
                    }`}
                    title={autoRotate ? 'Pause Earth Rotation' : 'Auto-Rotate Earth'}
                >
                    <RefreshCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '20s' }} />
                </button>

                <button
                    onClick={handleResetCamera}
                    className="chip text-xs py-1.5 px-3 hover:border-[#7fb2d4] transition-all cursor-pointer text-[#8fa6ba] hover:text-[#e8f1f8]"
                    title="Reset Camera View"
                >
                    <RotateCcw className="w-4 h-4 text-[#7fb2d4]" />
                </button>
            </div>

            {/* Screen-Projected Floating 3D Object Labels (from reference) */}
            {labelsVisible &&
                labels2D.map((lbl, idx) => (
                    <div
                        key={`${lbl.kind}-${lbl.id}-${idx}`}
                        className="absolute z-10 text-[11px] font-mono pointer-events-none whitespace-nowrap"
                        style={{
                            left: lbl.x + 8,
                            top: lbl.y - 10,
                            color: lbl.color,
                            textShadow: '0 0 6px rgba(0, 0, 0, 0.95)',
                        }}
                    >
                        {lbl.name}
                    </div>
                ))}

            {/* Bottom-Left Control Dock (from HTML reference .dock) */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
                {/* Row 1: Layer Toggle Chips (Coverage removed as requested!) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => setOrbitsVisible(!orbitsVisible)}
                        className={`chip mono text-xs py-1 px-3 transition-all cursor-pointer ${
                            orbitsVisible
                                ? 'border-[#7fb2d4] bg-[rgba(127,178,212,0.22)] text-[#e8f1f8]'
                                : 'text-[#8fa6ba] hover:text-[#e8f1f8]'
                        }`}
                    >
                        Orbits
                    </button>

                    <button
                        onClick={() => setLinksVisible(!linksVisible)}
                        className={`chip mono text-xs py-1 px-3 transition-all cursor-pointer ${
                            linksVisible
                                ? 'border-[#f2c14e] bg-[rgba(242,193,78,0.22)] text-[#f2c14e]'
                                : 'text-[#8fa6ba] hover:text-[#e8f1f8]'
                        }`}
                    >
                        Links ({activeLinksCount})
                    </button>

                    <button
                        onClick={() => setCloudsVisible(!cloudsVisible)}
                        className={`chip mono text-xs py-1 px-3 transition-all cursor-pointer ${
                            cloudsVisible
                                ? 'border-[#7fb2d4] bg-[rgba(127,178,212,0.22)] text-[#e8f1f8]'
                                : 'text-[#8fa6ba] hover:text-[#e8f1f8]'
                        }`}
                    >
                        Clouds
                    </button>

                    <button
                        onClick={() => setLabelsVisible(!labelsVisible)}
                        className={`chip mono text-xs py-1 px-3 transition-all cursor-pointer ${
                            labelsVisible
                                ? 'border-[#7fb2d4] bg-[rgba(127,178,212,0.22)] text-[#e8f1f8]'
                                : 'text-[#8fa6ba] hover:text-[#e8f1f8]'
                        }`}
                    >
                        Labels
                    </button>
                </div>

                {/* Row 2: Orbit Propagation Simulation Speed Controls */}
                <div className="flex items-center gap-1.5">
                    {[
                        { label: 'Pause', mult: 0 },
                        { label: '1×', mult: 1 },
                        { label: '60×', mult: 60 },
                        { label: '600×', mult: 600 },
                    ].map((btn) => {
                        const isCurrent = btn.mult === 0 ? isPaused : !isPaused && speedMultiplier === btn.mult;
                        return (
                            <button
                                key={btn.label}
                                onClick={() => {
                                    if (btn.mult === 0) {
                                        setIsPaused(!isPaused);
                                    } else {
                                        setIsPaused(false);
                                        setSpeedMultiplier(btn.mult);
                                    }
                                }}
                                className={`chip mono text-xs py-1 px-2.5 transition-all cursor-pointer ${
                                    isCurrent
                                        ? 'border-[#f2c14e] bg-[rgba(242,193,78,0.2)] text-[#f2c14e] font-bold'
                                        : 'text-[#8fa6ba] hover:text-[#e8f1f8]'
                                }`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right-Side Mission Objects & Detail Inspector Panel (from HTML reference .panel) */}
            <aside className="absolute right-4 top-4 bottom-4 w-80 md:w-88 z-20 flex flex-col bg-[rgba(10,20,36,0.85)] backdrop-blur-xl border border-[rgba(127,178,212,0.24)] rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
                {/* Tabs Header */}
                <div className="flex border-b border-[rgba(127,178,212,0.24)]">
                    <button
                        onClick={() => setInspectorTab('sat')}
                        className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                            inspectorTab === 'sat'
                                ? 'text-[#e8f1f8] border-[#f2c14e] bg-[rgba(127,178,212,0.12)]'
                                : 'text-[#8fa6ba] border-transparent hover:text-[#e8f1f8]'
                        }`}
                    >
                        Satellites ({effectiveSatellites.length})
                    </button>
                    <button
                        onClick={() => setInspectorTab('gs')}
                        className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                            inspectorTab === 'gs'
                                ? 'text-[#e8f1f8] border-[#f2c14e] bg-[rgba(127,178,212,0.12)]'
                                : 'text-[#8fa6ba] border-transparent hover:text-[#e8f1f8]'
                        }`}
                    >
                        Ground Stations ({effectiveGroundStations.length})
                    </button>
                </div>

                {/* Scrollable Object Selector List (from reference .list) */}
                <div className="max-h-44 min-h-[96px] overflow-y-auto p-2 border-b border-[rgba(127,178,212,0.24)] space-y-1">
                    {inspectorTab === 'sat'
                        ? effectiveSatellites.map((sat) => {
                              const isSelected = selectedSat?.id === sat.id;
                              const isMEO = sat.altitude_km > 3000;
                              return (
                                  <button
                                      key={sat.id}
                                      onClick={() => handleSelectSatellite(sat)}
                                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                          isSelected
                                              ? 'bg-[rgba(127,178,212,0.24)] text-[#e8f1f8] font-bold'
                                              : 'text-[#8fa6ba] hover:bg-[rgba(127,178,212,0.12)] hover:text-[#e8f1f8]'
                                      }`}
                                  >
                                      <span
                                          className="w-2.5 h-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: isMEO ? '#6fd6e8' : '#f2c14e' }}
                                      />
                                      <span className="truncate">{sat.name}</span>
                                      <span className="ml-auto text-[11px] font-mono text-[#8fa6ba]">
                                          {isMEO ? 'MEO' : 'LEO'} · {sat.altitude_km} km
                                      </span>
                                  </button>
                              );
                          })
                        : effectiveGroundStations.map((gs) => {
                              const isSelected = selectedGs?.id === gs.id;
                              return (
                                  <button
                                      key={gs.id}
                                      onClick={() => handleSelectGroundStation(gs)}
                                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                          isSelected
                                              ? 'bg-[rgba(127,178,212,0.24)] text-[#e8f1f8] font-bold'
                                              : 'text-[#8fa6ba] hover:bg-[rgba(127,178,212,0.12)] hover:text-[#e8f1f8]'
                                      }`}
                                  >
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#ffd27a]" />
                                      <span className="truncate">{gs.name}</span>
                                      <span className="ml-auto text-[11px] font-mono text-[#8fa6ba]">
                                          {gs.band || 'S / X-band'}
                                      </span>
                                  </button>
                              );
                          })}
                </div>

                {/* Detail Inspector (from HTML reference #det) */}
                <div className="flex-1 overflow-y-auto p-4 text-xs">
                    {selectedSat ? (
                        <div className="space-y-3 animation-fade-in">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#e8f1f8] tracking-tight">{selectedSat.name}</h3>
                                    <p className="text-[#8fa6ba] text-xs">
                                        {selectedSat.altitude_km > 3000 ? 'Navigation Constellation · MEO' : 'Earth Observation · LEO'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedSat(null)}
                                    className="chip text-[11px] py-0.5 px-2 text-[#8fa6ba] hover:text-[#e8f1f8] cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>

                            {/* 2-Column Key-Value Grid */}
                            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Altitude</span>
                                    <b className="text-[#e8f1f8]">{selectedSat.altitude_km.toLocaleString()} km</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Speed</span>
                                    <b className="text-[#e8f1f8]">{selectedSat.velocity_kms || 7.59} km/s</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Period</span>
                                    <b className="text-[#e8f1f8]">{(92 + (selectedSat.altitude_km - 500) * 0.05).toFixed(0)} min</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Inclination</span>
                                    <b className="text-[#e8f1f8]">{(selectedSat.inclination || 53).toFixed(1)}°</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Latitude</span>
                                    <b className="text-[#e8f1f8]">{selectedSat.latitude.toFixed(2)}°</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Longitude</span>
                                    <b className="text-[#e8f1f8]">{selectedSat.longitude.toFixed(2)}°</b>
                                </div>
                            </div>

                            {/* Real-Time Ground Contacts Passes */}
                            <div className="pt-2">
                                <h4 className="text-xs font-semibold text-[#8fa6ba] mb-2 uppercase tracking-wider font-mono">
                                    Ground Contacts
                                </h4>
                                <div className="space-y-1.5 font-mono text-[11px]">
                                    {effectiveGroundStations.slice(0, 4).map((gs, i) => (
                                        <div
                                            key={gs.id}
                                            onClick={() => {
                                                const pos = latLonToVector3(gs.latitude, gs.longitude, EARTH_RADIUS);
                                                handleFocusObject(pos, 210);
                                                handleSelectGroundStation(gs);
                                            }}
                                            className="flex items-center justify-between py-1.5 px-2 rounded border border-[rgba(127,178,212,0.18)] hover:bg-[rgba(127,178,212,0.15)] transition-colors cursor-pointer"
                                        >
                                            <span className="text-[#e8f1f8]">{gs.name}</span>
                                            {i === 0 ? (
                                                <span className="text-[#f2c14e] font-semibold">In contact · 54°</span>
                                            ) : (
                                                <span className="text-[#8fa6ba]">
                                                    +{(i * 18 + 4)} min · 8 min pass
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const pos = latLonToVector3(selectedSat.latitude, selectedSat.longitude, EARTH_RADIUS + 30);
                                    handleFocusObject(pos, 220);
                                }}
                                className="w-full btn-primary text-xs py-2 mt-2 flex items-center justify-center gap-1.5"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Track Orbit Camera</span>
                            </button>
                        </div>
                    ) : selectedGs ? (
                        <div className="space-y-3 animation-fade-in">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#e8f1f8] tracking-tight">{selectedGs.name}</h3>
                                    <p className="text-[#8fa6ba] text-xs">
                                        {selectedGs.band || 'S / X / Ka-band'} ground station
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedGs(null)}
                                    className="chip text-[11px] py-0.5 px-2 text-[#8fa6ba] hover:text-[#e8f1f8] cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>

                            {/* 2-Column Key-Value Grid */}
                            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Latitude</span>
                                    <b className="text-[#e8f1f8]">{selectedGs.latitude.toFixed(2)}°</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Longitude</span>
                                    <b className="text-[#e8f1f8]">{selectedGs.longitude.toFixed(2)}°</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Elevation MSL</span>
                                    <b className="text-[#e8f1f8]">{selectedGs.elevation_m || 240} m</b>
                                </div>
                                <div className="border border-[rgba(127,178,212,0.24)] rounded-lg p-2 bg-[rgba(10,20,36,0.6)]">
                                    <span className="text-[10px] text-[#8fa6ba] block font-sans">Active Passes</span>
                                    <b className="text-[#f2c14e]">{selectedGs.active_links || 2} satellites</b>
                                </div>
                            </div>

                            {/* Satellite Passes */}
                            <div className="pt-2">
                                <h4 className="text-xs font-semibold text-[#8fa6ba] mb-2 uppercase tracking-wider font-mono">
                                    Tracked Passes
                                </h4>
                                <div className="space-y-1.5 font-mono text-[11px]">
                                    {effectiveSatellites.slice(0, 4).map((sat, i) => (
                                        <div
                                            key={sat.id}
                                            onClick={() => {
                                                const pos = latLonToVector3(sat.latitude, sat.longitude, EARTH_RADIUS + 30);
                                                handleFocusObject(pos, 220);
                                                handleSelectSatellite(sat);
                                            }}
                                            className="flex items-center justify-between py-1.5 px-2 rounded border border-[rgba(127,178,212,0.18)] hover:bg-[rgba(127,178,212,0.15)] transition-colors cursor-pointer"
                                        >
                                            <span className="text-[#e8f1f8]">{sat.name}</span>
                                            {i === 0 ? (
                                                <span className="text-[#f2c14e] font-semibold">In contact · 54°</span>
                                            ) : (
                                                <span className="text-[#8fa6ba]">
                                                    +{(i * 14 + 6)} min · 7m 30s
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const pos = latLonToVector3(selectedGs.latitude, selectedGs.longitude, EARTH_RADIUS);
                                    handleFocusObject(pos, 210);
                                }}
                                className="w-full btn-primary text-xs py-2 mt-2 flex items-center justify-center gap-1.5"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Focus Ground Terminal</span>
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8fa6ba]">
                            <Satellite className="w-8 h-8 text-[#7fb2d4] mb-2 opacity-60" />
                            <p className="text-xs leading-relaxed">
                                Click any satellite or ground station on the 3D Earth, or select from the list above to inspect live telemetry and upcoming pass contacts.
                            </p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
