import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import {
  Globe,
  Satellite,
  Radio,
  Calendar,
  Bot,
  Database
} from "lucide-react";

interface SatData {
  name: string;
  cls: string;
  alt: number;
  inc: number;
  raan: number;
  u0: number;
  role: string;
}

interface StData {
  name: string;
  lat: number;
  lon: number;
  band: string;
}

interface SatObject extends SatData {
  kind: "sat";
  rd: number;
  col: number;
  n: number;
  v: number;
  per: number;
  g: THREE.Group;
  halo: THREE.Sprite;
  ol: THREE.LineLoop;
  p: THREE.Vector3;
  lab?: HTMLDivElement;
}

interface StObject extends StData {
  kind: "st";
  v: THREE.Vector3;
  col: number;
  m: THREE.Group;
  ring: THREE.Mesh;
  p: THREE.Vector3;
  lab?: HTMLDivElement;
}

type MissionObject = SatObject | StObject;

interface PassContact {
  o: MissionObject;
  now?: boolean;
  el: number;
  t: number;
  dur?: number;
}

const ST_RAW: StData[] = [
  { name: "Bengaluru", lat: 12.97, lon: 77.59, band: "S-band" },
  { name: "Svalbard", lat: 78.23, lon: 15.39, band: "X-band" },
  { name: "Fairbanks", lat: 64.84, lon: -147.72, band: "S / X-band" },
  { name: "Cape Town", lat: -33.92, lon: 18.42, band: "Ka-band" },
  { name: "Santiago", lat: -33.45, lon: -70.67, band: "X-band" },
  { name: "Canberra", lat: -35.28, lon: 149.13, band: "Ka-band" },
];

const SA_RAW: SatData[] = [
  { name: "Aurora-1", cls: "LEO", alt: 550, inc: 53, raan: 0, u0: 0, role: "Imaging" },
  { name: "Aurora-2", cls: "LEO", alt: 550, inc: 53, raan: 70, u0: 180, role: "Imaging" },
  { name: "Boreas-1", cls: "LEO", alt: 700, inc: 98, raan: 30, u0: 40, role: "Earth observation" },
  { name: "Boreas-2", cls: "LEO", alt: 700, inc: 98, raan: 150, u0: 220, role: "Earth observation" },
  { name: "Cirrus-1", cls: "LEO", alt: 1200, inc: 65, raan: 100, u0: 90, role: "Comms relay" },
  { name: "Cirrus-2", cls: "LEO", alt: 1200, inc: 65, raan: 230, u0: 270, role: "Comms relay" },
  { name: "Delta-1", cls: "LEO", alt: 800, inc: 28, raan: 300, u0: 130, role: "Weather" },
  { name: "Orion-1", cls: "MEO", alt: 20200, inc: 55, raan: 0, u0: 0, role: "Navigation" },
  { name: "Orion-2", cls: "MEO", alt: 20200, inc: 55, raan: 120, u0: 120, role: "Navigation" },
  { name: "Orion-3", cls: "MEO", alt: 20200, inc: 55, raan: 240, u0: 240, role: "Navigation" },
];

export default function Dashboard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // UI state for reactive panel
  const [tab, setTab] = useState<0 | 1>(0); // 0 = Satellites, 1 = Ground stations
  const [selectedObj, setSelectedObj] = useState<MissionObject | null>(null);
  const [passesList, setPassesList] = useState<PassContact[]>([]);
  const [clockText, setClockText] = useState("--:--:-- UTC");
  const [speedVal, setSpeedVal] = useState<number>(60);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [toggles, setToggles] = useState({
    orb: true,
    lnk: true,
    cov: true,
    cld: true,
    lbl: true,
  });

  // Keep references for 3D simulation to interact smoothly without re-rendering
  const objsMapRef = useRef<Map<string, MissionObject>>(new Map());
  const selectedRef = useRef<MissionObject | null>(null);
  selectedRef.current = selectedObj;

  const togglesRef = useRef(toggles);
  togglesRef.current = toggles;

  const speedRef = useRef(speedVal);
  speedRef.current = speedVal;

  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  const simTimeRef = useRef(0);
  const pickTargetRef = useRef<((o: MissionObject | null) => void) | null>(null);

  useEffect(() => {
    if (!stageRef.current || !labelsContainerRef.current || !tipRef.current) return;
    const stageEl: HTMLDivElement = stageRef.current;
    const labelsEl: HTMLDivElement = labelsContainerRef.current;
    const tipEl: HTMLDivElement = tipRef.current;

    const D = Math.PI / 180;
    const MU = 398600.4;
    const RE = 6371;
    const MIN = 10 * D;
    const AX = new THREE.Vector3(1, 0, 0);
    const AY = new THREE.Vector3(0, 1, 0);

    function ll2v(la: number, lo: number): [number, number, number] {
      return [
        Math.cos(la) * Math.cos(lo),
        Math.sin(la),
        -Math.cos(la) * Math.sin(lo),
      ];
    }

    // Procedural noise algorithms from HTML specification
    function h(x: number, y: number, z: number): number {
      const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function l(a: number, b: number, t: number): number {
      return a + (b - a) * t;
    }
    function vn(x: number, y: number, z: number): number {
      const xi = Math.floor(x),
        yi = Math.floor(y),
        zi = Math.floor(z);
      const xf = x - xi,
        yf = y - yi,
        zf = z - zi;
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      const w = zf * zf * (3 - 2 * zf);
      return l(
        l(
          l(h(xi, yi, zi), h(xi + 1, yi, zi), u),
          l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u),
          v
        ),
        l(
          l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u),
          l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u),
          v
        ),
        w
      );
    }
    function fbm(x: number, y: number, z: number, o: number): number {
      let s = 0,
        a = 0.5;
      for (let i = 0; i < o; i++) {
        s += a * vn(x, y, z);
        x *= 2.03;
        y *= 2.03;
        z *= 2.03;
        a *= 0.5;
      }
      return s;
    }

    // Ground stations initialized with vector coords
    const ST: StObject[] = ST_RAW.map((a) => {
      const v = new THREE.Vector3().fromArray(ll2v(a.lat * D, a.lon * D));
      return {
        kind: "st",
        ...a,
        v,
        col: 0x9fd0ee,
        m: new THREE.Group(),
        ring: null as unknown as THREE.Mesh,
        p: new THREE.Vector3(),
      };
    });

    // Procedural Earth Texture
    function earthTex(): THREE.CanvasTexture {
      const W = 1024,
        H = 512;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d");
      if (!x) return new THREE.CanvasTexture(c);
      const im = x.createImageData(W, H);
      const d = im.data;
      for (let j = 0; j < H; j++) {
        const la = (0.5 - (j + 0.5) / H) * Math.PI;
        const al = Math.abs(la) / D;
        for (let i = 0; i < W; i++) {
          const lo = ((i + 0.5) / W - 0.5) * 2 * Math.PI;
          const p = ll2v(la, lo);
          let e = fbm(p[0] * 1.7 + 3, p[1] * 1.7, p[2] * 1.7, 6);
          let r = 0,
            g = 0,
            b = 0;
          const k = (j * W + i) * 4;
          for (let q = 0; q < 6; q++) {
            const v = ST[q].v;
            const dd =
              (p[0] - v.x) * (p[0] - v.x) +
              (p[1] - v.y) * (p[1] - v.y) +
              (p[2] - v.z) * (p[2] - v.z);
            e += 0.2 * Math.exp(-dd * 70);
          }
          if (e < 0.5) {
            const t = Math.max(0, (e - 0.3) / 0.2);
            r = 5 + t * 26;
            g = 22 + t * 72;
            b = 58 + t * 92;
          } else {
            const m = fbm(p[0] * 3 + 9, p[1] * 3, p[2] * 3, 4);
            const hg = (e - 0.5) * 4;
            if (m < 0.44 - Math.abs(p[1]) * 0.08) {
              r = 150 + hg * 40;
              g = 126 + hg * 35;
              b = 82 + hg * 25;
            } else {
              r = 36 + hg * 60;
              g = 84 + hg * 50;
              b = 40 + hg * 30;
            }
          }
          if (al > 70 || (al > 60 && e > 0.55)) {
            r = g = b = 228;
          }
          d[k] = r;
          d[k + 1] = g;
          d[k + 2] = b;
          d[k + 3] = 255;
        }
      }
      x.putImageData(im, 0, 0);
      return new THREE.CanvasTexture(c);
    }

    // Procedural Cloud Texture
    function cloudTex(): THREE.CanvasTexture {
      const W = 512,
        H = 256;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d");
      if (!x) return new THREE.CanvasTexture(c);
      const im = x.createImageData(W, H);
      const d = im.data;
      for (let j = 0; j < H; j++) {
        const la = (0.5 - (j + 0.5) / H) * Math.PI;
        for (let i = 0; i < W; i++) {
          const lo = ((i + 0.5) / W - 0.5) * 2 * Math.PI;
          const p = ll2v(la, lo);
          const n = fbm(p[0] * 2.4 + 20, p[1] * 2.4, p[2] * 2.4, 5);
          const a = Math.max(0, Math.min(1, (n - 0.5) * 3.2));
          const k = (j * W + i) * 4;
          d[k] = d[k + 1] = d[k + 2] = 255;
          d[k + 3] = a * 200;
        }
      }
      x.putImageData(im, 0, 0);
      return new THREE.CanvasTexture(c);
    }

    // Radial Halo Glow Texture
    function glowTex(): THREE.CanvasTexture {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d");
      if (!x) return new THREE.CanvasTexture(c);
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }

    // Three.js Renderer Setup
    let R: THREE.WebGLRenderer;
    try {
      R = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      return;
    }
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.setSize(stageEl.clientWidth, stageEl.clientHeight);
    stageEl.replaceChildren(R.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(
      40,
      stageEl.clientWidth / stageEl.clientHeight,
      0.01,
      300
    );

    // Lights
    scene.add(new THREE.AmbientLight(0x3a5570, 0.7));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.3);
    sun.position.set(5, 1.5, 3);
    scene.add(sun);

    // Earth Sphere
    const earth = new THREE.Group();
    scene.add(earth);
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 64),
      new THREE.MeshPhongMaterial({
        map: earthTex(),
        shininess: 10,
        specular: 0x101a24,
      })
    );
    earth.add(earthMesh);

    // Cloud Sphere
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 64, 48),
      new THREE.MeshPhongMaterial({
        map: cloudTex(),
        transparent: true,
        depthWrite: false,
      })
    );
    scene.add(clouds);

    // Atmosphere Glow Shader
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 64, 48),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN;
        void main(){
          vN=normalize(normalMatrix*normal);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
        fragmentShader: `varying vec3 vN;
        void main(){
          float i=pow(max(.72-dot(vN,vec3(0.,0.,1.)),0.),3.);
          gl_FragColor=vec4(.35,.62,1.,1.)*i*1.6;
        }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    scene.add(atmosphere);

    // Starfield Background
    const sp = new Float32Array(2400);
    for (let i = 0; i < 800; i++) {
      const a = Math.random() * 6.283;
      const z = Math.random() * 2 - 1;
      const rr = Math.sqrt(1 - z * z) * 120;
      sp[i * 3] = Math.cos(a) * rr;
      sp[i * 3 + 1] = z * 120;
      sp[i * 3 + 2] = Math.sin(a) * rr;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    scene.add(
      new THREE.Points(
        sg,
        new THREE.PointsMaterial({
          color: 0xcfe0f0,
          size: 0.35,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.8,
        })
      )
    );

    // Simulation Constants
    const base = Date.now();
    let sim = 0;
    const earthAng = (t: number) => (t * 2 * Math.PI) / 86164;

    const glow = glowTex();
    const objs: MissionObject[] = [];
    const proxies: THREE.Mesh[] = [];

    function satPos(s: SatObject, t: number): THREE.Vector3 {
      const u = s.u0 + s.n * t;
      return new THREE.Vector3(s.rd * Math.cos(u), 0, s.rd * Math.sin(u))
        .applyAxisAngle(AX, s.inc)
        .applyAxisAngle(AY, s.raan);
    }

    function stPos(g: StObject, t: number): THREE.Vector3 {
      return g.v.clone().applyAxisAngle(AY, earthAng(t));
    }

    function elev(s: SatObject, g: StObject, t: number): number {
      const S = stPos(g, t);
      const P = satPos(s, t).sub(S);
      return Math.asin(P.dot(S) / P.length());
    }

    const panelMat = new THREE.MeshPhongMaterial({
      color: 0x2a5f9e,
      emissive: 0x0c2a55,
      shininess: 60,
    });
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0xcfd6dd,
      shininess: 40,
    });

    // Initialize Satellites
    const sats: SatObject[] = SA_RAW.map((a) => {
      const incRad = a.inc * D;
      const raanRad = a.raan * D;
      const u0Rad = a.u0 * D;
      const rd = a.alt < 3000 ? 1 + (a.alt / RE) * 1.6 : 2.5;
      const col = a.cls === "LEO" ? 0xf2c14e : 0x6fd6e8;
      const A = RE + a.alt;
      const n = Math.sqrt(MU / (A * A * A));
      const v = Math.sqrt(MU / A);
      const per = (2 * Math.PI) / n / 60;

      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.045), bodyMat));

      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.002, 0.032), panelMat);
      const p2 = p1.clone();
      p1.position.x = 0.055;
      p2.position.x = -0.055;
      g.add(p1, p2);

      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.012, 16), bodyMat);
      dish.rotation.x = Math.PI / 2;
      dish.position.z = 0.03;
      g.add(dish);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glow,
          color: col,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
        })
      );
      g.add(halo);

      const px = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      const satObj: SatObject = {
        kind: "sat",
        ...a,
        inc: incRad,
        raan: raanRad,
        u0: u0Rad,
        rd,
        col,
        n,
        v,
        per,
        g,
        halo,
        ol: null as unknown as THREE.LineLoop,
        p: new THREE.Vector3(),
      };
      px.userData.o = satObj;
      g.add(px);
      proxies.push(px);

      // Orbit line
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 180; k++) {
        const u = (k / 180) * 6.2832;
        pts.push(
          new THREE.Vector3(rd * Math.cos(u), 0, rd * Math.sin(u))
            .applyAxisAngle(AX, incRad)
            .applyAxisAngle(AY, raanRad)
        );
      }
      const ol = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.3,
        })
      );
      satObj.ol = ol;
      scene.add(g, ol);
      objs.push(satObj);
      return satObj;
    });

    // Initialize Ground Stations
    ST.forEach((g) => {
      const m = new THREE.Group();
      m.position.copy(g.v).multiplyScalar(1.002);
      m.quaternion.setFromUnitVectors(AY, g.v);

      m.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(1, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffd27a })
        )
      );

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2, 2.5, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffd27a,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      m.add(ring);

      const px = new THREE.Mesh(
        new THREE.SphereGeometry(4, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      px.userData.o = g;
      m.add(px);
      proxies.push(px);

      earth.add(m);
      g.m = m;
      g.ring = ring;
      objs.push(g);
    });

    // Register objects in ref map for quick lookup
    const map = new Map<string, MissionObject>();
    objs.forEach((o) => map.set(o.name, o));
    objsMapRef.current = map;

    // Coverage Cone
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1, 1, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xf2c14e,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    cone.visible = false;
    scene.add(cone);

    // Links lines
    function mkLines(color: number, opacity: number): THREE.LineSegments {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(360), 3)
      );
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const m = new THREE.LineSegments(geom, mat);
      m.frustumCulled = false;
      scene.add(m);
      return m;
    }
    const lk = mkLines(0xf2c14e, 0.35);
    const lh = mkLines(0xffe08a, 1);

    // Labels
    labelsEl.innerHTML = "";
    objs.forEach((o) => {
      const d = document.createElement("div");
      d.className = "lab mono";
      d.textContent = o.name;
      d.style.color =
        o.kind === "sat"
          ? o.cls === "LEO"
            ? "#f2c14e"
            : "#6fd6e8"
          : "#bfe2f7";
      labelsEl.appendChild(d);
      o.lab = d;
    });

    // Camera variables
    let th = 0.9,
      ph = 1.25,
      dist = 5.2,
      dT = 5.2,
      fly = 0,
      tth = 0,
      tph = 0;
    const tgt = new THREE.Vector3();
    const pan = new THREE.Vector3();

    function wrap(a: number): number {
      while (a > Math.PI) a -= 6.2832;
      while (a < -Math.PI) a += 6.2832;
      return a;
    }

    function calcPasses(target: MissionObject | null): PassContact[] {
      if (!target) return [];
      const src = target.kind === "sat" ? ST : sats;
      const pc: PassContact[] = src.map((o) => {
        const s = target.kind === "sat" ? (target as SatObject) : (o as SatObject);
        const g = target.kind === "sat" ? (o as StObject) : (target as StObject);
        const e = elev(s, g, sim);
        if (e > MIN) return { o, now: true, el: e, t: 0 };
        for (let k = 1; k <= 360; k++) {
          const t = sim + k * 30;
          if (elev(s, g, t) > MIN) {
            let f = t;
            while (elev(s, g, f) > MIN && f < t + 1800) f += 30;
            return { o, t, dur: f - t, el: e };
          }
        }
        return { o, t: 1e12, el: e };
      });
      pc.sort(
        (a, b) => (b.now ? 1 : 0) - (a.now ? 1 : 0) || a.t - b.t
      );
      return pc;
    }

    function pick(o: MissionObject | null) {
      selectedRef.current = o;
      setSelectedObj(o);
      pan.set(0, 0, 0);

      if (o) {
        const p = o.p;
        const n = p.clone().normalize();
        tph = Math.acos(Math.max(-1, Math.min(1, n.y)));
        tth = Math.atan2(n.z, n.x);
        fly = 1.6;
        dT = o.kind === "sat" ? (o.rd > 2 ? 3.2 : 1.15) : 1.7;
        setTab(o.kind === "sat" ? 0 : 1);
      } else {
        dT = 5.2;
        fly = 0;
      }
      setPassesList(calcPasses(o));
    }
    pickTargetRef.current = pick;

    // Pointer events
    const ptrs: Record<number, { x: number; y: number }> = {};
    let down: { x: number; y: number } | null = null;
    const ray = new THREE.Raycaster();
    const mv = new THREE.Vector2();
    const earthSph = new THREE.Sphere(new THREE.Vector3(), 1);

    function hit(cx: number, cy: number): MissionObject | null {
      const r = stageEl.getBoundingClientRect();
      mv.set(
        ((cx - r.left) / r.width) * 2 - 1,
        -((cy - r.top) / r.height) * 2 + 1
      );
      ray.setFromCamera(mv, cam);
      const hs = ray.intersectObjects(proxies, false);
      const pt = new THREE.Vector3();
      const eh = ray.ray.intersectSphere(earthSph, pt);
      const ed = eh ? cam.position.distanceTo(pt) : 1e9;
      for (let i = 0; i < hs.length; i++) {
        if (hs[i].distance < ed + 0.02) {
          return hs[i].object.userData.o as MissionObject;
        }
      }
      return null;
    }

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onPointerDown = (e: PointerEvent) => {
      stageEl.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      down = { x: e.clientX, y: e.clientY };
      stageEl.style.cursor = "grabbing";
      fly = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = ptrs[e.pointerId];
      if (!p) {
        if (e.pointerType === "mouse") {
          const o = hit(e.clientX, e.clientY);
          stageEl.style.cursor = o ? "pointer" : "grab";
          if (o) {
            tipEl.style.display = "block";
            tipEl.style.left = e.clientX + 14 + "px";
            tipEl.style.top = e.clientY + 14 + "px";
            tipEl.textContent =
              o.name +
              (o.kind === "sat"
                ? ` · ${o.cls} ${o.alt} km`
                : ` · ${o.band}`);
          } else {
            tipEl.style.display = "none";
          }
        }
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      const ids = Object.keys(ptrs);
      if (ids.length === 2) {
        const otherId = Number(ids[0]) === e.pointerId ? Number(ids[1]) : Number(ids[0]);
        const q = ptrs[otherId];
        const d0 = Math.hypot(p.x - q.x, p.y - q.y);
        const d1 = Math.hypot(e.clientX - q.x, e.clientY - q.y);
        dT = Math.max(1.1, Math.min(16, (dT * d0) / Math.max(d1, 1)));
      } else if (e.buttons & 2 || e.shiftKey) {
        const m = cam.matrixWorld.elements;
        const k = dist * 0.0016;
        pan.x += (-dx * m[0] + dy * m[4]) * k;
        pan.y += (-dx * m[1] + dy * m[5]) * k;
        pan.z += (-dx * m[2] + dy * m[6]) * k;
      } else {
        th -= dx * 0.006;
        ph = Math.max(0.08, Math.min(3.06, ph - dy * 0.006));
      }
      p.x = e.clientX;
      p.y = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      delete ptrs[e.pointerId];
      stageEl.style.cursor = "grab";
      if (
        down &&
        Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5 &&
        e.type === "pointerup" &&
        !Object.keys(ptrs).length &&
        e.button === 0
      ) {
        const o = hit(e.clientX, e.clientY);
        if (o) {
          pick(o);
        } else {
          pick(null);
        }
      }
      down = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dT = Math.max(1.08, Math.min(16, dT * Math.exp(e.deltaY * 0.001)));
    };

    stageEl.addEventListener("contextmenu", onContextMenu);
    stageEl.addEventListener("pointerdown", onPointerDown);
    stageEl.addEventListener("pointermove", onPointerMove);
    stageEl.addEventListener("pointerup", onPointerUp);
    stageEl.addEventListener("pointercancel", onPointerUp);
    stageEl.addEventListener("wheel", onWheel, { passive: false });

    // Handle Window Resize
    function handleResize() {
      if (!stageEl) return;
      const w = stageEl.clientWidth;
      const h = stageEl.clientHeight;
      R.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let last = performance.now();
    let acc = 0;
    const tmp = new THREE.Vector3();
    const pcz = new THREE.Vector3();
    const cs = new THREE.Ray();

    function occ(P: THREE.Vector3): boolean {
      cs.origin.copy(cam.position);
      cs.direction.copy(P).sub(cam.position);
      const d = cs.direction.length();
      cs.direction.normalize();
      const q = cs.intersectSphere(earthSph, tmp);
      return !!q && cam.position.distanceTo(q) < d - 0.005;
    }

    let reqId = 0;
    function loop(now: number) {
      reqId = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!pausedRef.current) {
        sim += dt * speedRef.current;
        simTimeRef.current = sim;
      }

      const curToggles = togglesRef.current;
      const curSelected = selectedRef.current;

      const ea = earthAng(sim);
      earth.rotation.y = ea;
      clouds.rotation.y = ea * 1.04 + 0.4;
      clouds.visible = !!curToggles.cld;

      sats.forEach((s) => {
        s.p = satPos(s, sim);
        s.g.position.copy(s.p);
        s.g.lookAt(0, 0, 0);
      });
      ST.forEach((g) => {
        g.p = stPos(g, sim);
      });

      // Camera lerp
      const f = curSelected ? curSelected.p : pcz.set(0, 0, 0);
      tgt.lerp(f, curSelected ? 0.12 : 0.08);
      dist += (dT - dist) * 0.07;
      if (fly > 0) {
        fly -= dt;
        th += wrap(tth - th) * 0.06;
        ph += (tph - ph) * 0.06;
      }
      const tp = tgt.clone().add(pan);
      cam.position.set(
        tp.x + dist * Math.sin(ph) * Math.cos(th),
        tp.y + dist * Math.cos(ph),
        tp.z + dist * Math.sin(ph) * Math.sin(th)
      );
      cam.lookAt(tp);
      cam.updateMatrixWorld();
      sun.position.set(5, 1.5, 3);

      // Scale satellites by distance
      sats.forEach((s) => {
        const dc = cam.position.distanceTo(s.p);
        const sc = Math.max(0.8, Math.min(3, dc * 0.5));
        const sel = curSelected === s;
        s.g.scale.setScalar(sc);
        s.halo.scale.setScalar(
          0.08 * (sel ? 2.4 : 1) * (Math.max(0.7, dc * 0.45) / sc)
        );
        s.ol.visible = !!curToggles.orb;
        (s.ol.material as THREE.LineBasicMaterial).opacity = sel
          ? 0.95
          : curSelected && curSelected.kind === "sat"
          ? 0.14
          : 0.3;
      });

      // Ground stations pulsing radar wave
      ST.forEach((g) => {
        const dc = cam.position.distanceTo(g.p);
        const k = Math.max(0.005, Math.min(0.022, dc * 0.0035));
        const sel = curSelected === g;
        g.m.scale.setScalar(k * (sel ? 1.5 : 1));
        const pr = (Math.sin(now / 400 + g.lat) + 1) / 2;
        g.ring.scale.setScalar(1 + pr * 0.5);
        (g.ring.material as THREE.MeshBasicMaterial).opacity = 0.8 - pr * 0.5;
      });

      // Comms links
      const a = (lk.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const b = (lh.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      let na = 0,
        nb = 0;
      if (curToggles.lnk) {
        sats.forEach((s) => {
          ST.forEach((g) => {
            if (elev(s, g, sim) > MIN) {
              const hi =
                curSelected &&
                (curSelected === s || curSelected === g);
              const A = hi ? b : a;
              const n = hi ? nb : na;
              A[n] = g.p.x;
              A[n + 1] = g.p.y;
              A[n + 2] = g.p.z;
              A[n + 3] = s.p.x;
              A[n + 4] = s.p.y;
              A[n + 5] = s.p.z;
              if (hi) nb += 6;
              else na += 6;
            }
          });
        });
      }
      lk.geometry.setDrawRange(0, na / 3);
      lh.geometry.setDrawRange(0, nb / 3);
      (lk.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (lh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // Coverage cone
      cone.visible = !!(
        curSelected &&
        curSelected.kind === "sat" &&
        curToggles.cov
      );
      if (cone.visible && curSelected) {
        const P = curSelected.p;
        const r = P.length();
        const lam = Math.acos(Math.cos(MIN) / r) - MIN;
        const n = P.clone().normalize();
        const hgt = r - Math.cos(lam);
        const rad = Math.sin(lam);
        cone.scale.set(rad, hgt, rad);
        cone.position.copy(n).multiplyScalar(r - hgt / 2);
        cone.quaternion.setFromUnitVectors(AY, n);
      }

      // Screen projected labels
      const w = stageEl.clientWidth;
      const hh = stageEl.clientHeight;
      objs.forEach((o) => {
        const P = o.p;
        let show = curToggles.lbl || curSelected === o;
        if (show) {
          const v = P.clone().project(cam);
          show =
            v.z < 1 &&
            Math.abs(v.x) < 1.05 &&
            Math.abs(v.y) < 1.05 &&
            !occ(P) &&
            (o.kind === "sat" || cam.position.distanceTo(P) < 7);
          if (show && o.lab) {
            o.lab.style.transform = `translate(${((v.x + 1) / 2) * w + 10}px,${
              ((1 - v.y) / 2) * hh
            }px) translateY(-50%)`;
          }
        }
        if (o.lab) {
          o.lab.style.display = show ? "block" : "none";
          o.lab.style.fontWeight = curSelected === o ? "700" : "400";
        }
      });

      // Update UTC clock string
      acc += dt;
      if (acc > 0.5) {
        acc = 0;
        const iso = new Date(base + sim * 1000).toISOString().slice(11, 19);
        setClockText(
          `${iso} UTC ${pausedRef.current ? "· paused" : `· ${speedRef.current}×`}`
        );
      }

      R.render(scene, cam);
    }

    reqId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      stageEl.removeEventListener("contextmenu", onContextMenu);
      stageEl.removeEventListener("pointerdown", onPointerDown);
      stageEl.removeEventListener("pointermove", onPointerMove);
      stageEl.removeEventListener("pointerup", onPointerUp);
      stageEl.removeEventListener("pointercancel", onPointerUp);
      stageEl.removeEventListener("wheel", onWheel);
      R.dispose();
    };
  }, []);

  // Format UTC Contact Time
  const fmtTime = (tSec: number) => {
    const d = new Date(Date.now() + tSec * 1000);
    return d.toISOString().slice(11, 16) + " UTC";
  };

  // Toggle button helper
  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Speed button helper
  const handleSpeed = (val: number) => {
    if (val === 0) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
      setSpeedVal(val);
    }
  };

  // Active object details calculation
  let satMetrics: [string, string][] = [];
  let stationMetrics: [string, string][] = [];

  if (selectedObj) {
    if (selectedObj.kind === "sat") {
      const D = Math.PI / 180;
      const sim = simTimeRef.current;
      const earthAng = (sim * 2 * Math.PI) / 86164;
      const v = selectedObj.p
        .clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), -earthAng);
      const la = Math.asin(v.y / (v.length() || 1)) / D;
      const lo = Math.atan2(-v.z, v.x) / D;

      satMetrics = [
        ["Altitude", `${selectedObj.alt.toLocaleString()} km`],
        ["Speed", `${selectedObj.v.toFixed(2)} km/s`],
        ["Period", `${selectedObj.per.toFixed(0)} min`],
        ["Inclination", `${(selectedObj.inc / D).toFixed(0)}°`],
        ["Latitude", `${la.toFixed(2)}°`],
        ["Longitude", `${lo.toFixed(2)}°`],
      ];
    } else {
      stationMetrics = [
        ["Latitude", `${selectedObj.lat.toFixed(2)}°`],
        ["Longitude", `${selectedObj.lon.toFixed(2)}°`],
        ["Band", selectedObj.band],
        [
          "In view",
          `${passesList.filter((r) => r.now).length} satellites`,
        ],
      ];
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02050b] select-none text-[#e8f1f8] font-sans">
      {/* Three.js Canvas Stage */}
      <div
        id="stage"
        ref={stageRef}
        className="fixed inset-0 touch-none cursor-grab"
      />

      {/* Screen Projected HUD Labels Container */}
      <div
        ref={labelsContainerRef}
        className="pointer-events-none fixed inset-0 z-10"
      />

      {/* Floating Mouseover Tooltip */}
      <div ref={tipRef} className="tip mono" />

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 pointer-events-none">
        {/* Brand */}
        <div className="brand flex items-center gap-2.5 font-bold text-lg pointer-events-auto">
          <span className="logo w-8 h-8 rounded-lg bg-[#7fb2d4] text-[#02050b] grid place-items-center">
            <Globe className="w-5 h-5 text-[#02050b]" />
          </span>
          <span className="tracking-tight text-white font-extrabold text-base">
            Constellation Hub
          </span>
        </div>

        {/* Live Satellite Chip */}
        <span className="chip live mono hidden sm:inline-flex pointer-events-auto text-xs py-1 px-3">
          <i className="dot" />
          <span>10 satellites synced</span>
        </span>

        {/* Space Tech DBMS Command Modules Bar */}
        <div className="hidden lg:flex items-center gap-1.5 ml-3 pointer-events-auto">
          <Link
            to="/satellites"
            className="tg mono text-xs py-1 px-2.5 flex items-center gap-1.5 text-[#8fa6ba] hover:text-[#e8f1f8] hover:border-[#7fb2d4]"
          >
            <Satellite className="w-3.5 h-3.5 text-[#f2c14e]" />
            Fleet Satellites
          </Link>
          <Link
            to="/ground-stations"
            className="tg mono text-xs py-1 px-2.5 flex items-center gap-1.5 text-[#8fa6ba] hover:text-[#e8f1f8] hover:border-[#7fb2d4]"
          >
            <Radio className="w-3.5 h-3.5 text-[#7fb2d4]" />
            Ground Stations
          </Link>
          <Link
            to="/scheduling"
            className="tg mono text-xs py-1 px-2.5 flex items-center gap-1.5 text-[#8fa6ba] hover:text-[#e8f1f8] hover:border-[#7fb2d4]"
          >
            <Calendar className="w-3.5 h-3.5 text-[#f2c14e]" />
            Pass Scheduling
          </Link>
          <Link
            to="/ops-copilot"
            className="tg mono text-xs py-1 px-2.5 flex items-center gap-1.5 text-[#8fa6ba] hover:text-[#e8f1f8] hover:border-[#7fb2d4]"
          >
            <Bot className="w-3.5 h-3.5 text-[#6fd6e8]" />
            Ops Co-Pilot
          </Link>
          <Link
            to="/tle-admin"
            className="tg mono text-xs py-1 px-2.5 flex items-center gap-1.5 text-[#8fa6ba] hover:text-[#e8f1f8] hover:border-[#7fb2d4]"
          >
            <Database className="w-3.5 h-3.5 text-[#7fb2d4]" />
            TLE Ephemeris
          </Link>
        </div>

        <span className="flex-1" />

        {/* Live Mission Clock */}
        <span className="chip mono text-xs py-1 px-3 pointer-events-auto">
          {clockText}
        </span>
      </nav>

      {/* Intro Hero Section */}
      <div className="intro fixed left-4 sm:left-8 top-20 z-20 max-w-[420px] pointer-events-none">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-none tracking-tight text-white drop-shadow-md">
          See every pass before it happens.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#8fa6ba] leading-relaxed max-w-[38ch]">
          Track the whole fleet in 3D. Click any satellite or ground station to inspect it and see its next contact.
        </p>
        <div className="hint mono text-xs mt-3.5 text-[#7fb2d4]">
          Drag to orbit · Scroll to zoom · Right-drag to pan
        </div>
      </div>

      {/* Bottom Controls Dock */}
      <div className="dock fixed left-4 sm:left-8 bottom-4 z-20 flex flex-col gap-2">
        {/* Visibility Toggles */}
        <div className="row flex gap-1.5 flex-wrap">
          <button
            className="tg"
            aria-pressed={toggles.orb}
            onClick={() => handleToggle("orb")}
          >
            Orbits
          </button>
          <button
            className="tg"
            aria-pressed={toggles.lnk}
            onClick={() => handleToggle("lnk")}
          >
            Links
          </button>
          <button
            className="tg"
            aria-pressed={toggles.cov}
            onClick={() => handleToggle("cov")}
          >
            Coverage
          </button>
          <button
            className="tg"
            aria-pressed={toggles.cld}
            onClick={() => handleToggle("cld")}
          >
            Clouds
          </button>
          <button
            className="tg"
            aria-pressed={toggles.lbl}
            onClick={() => handleToggle("lbl")}
          >
            Labels
          </button>
        </div>

        {/* Speed Controls */}
        <div className="row flex gap-1.5 flex-wrap">
          <button
            className="tg"
            aria-pressed={isPaused}
            onClick={() => handleSpeed(0)}
          >
            Pause
          </button>
          <button
            className="tg"
            aria-pressed={!isPaused && speedVal === 1}
            onClick={() => handleSpeed(1)}
          >
            1×
          </button>
          <button
            className="tg"
            aria-pressed={!isPaused && speedVal === 60}
            onClick={() => handleSpeed(60)}
          >
            60×
          </button>
          <button
            className="tg"
            aria-pressed={!isPaused && speedVal === 600}
            onClick={() => handleSpeed(600)}
          >
            600×
          </button>
        </div>
      </div>

      {/* Right Mission Objects Panel */}
      <aside
        className="panel fixed z-20 right-4 sm:right-8 top-20 bottom-4 w-[340px] flex flex-col bg-[rgba(10,20,36,0.72)] backdrop-blur-md border border-[rgba(127,178,212,0.24)] rounded-2xl overflow-hidden shadow-2xl"
        aria-label="Mission objects"
      >
        {/* Tabs */}
        <div className="tabs flex border-b border-[rgba(127,178,212,0.24)]" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 0}
            onClick={() => setTab(0)}
            className="flex-1 py-3 bg-none border-0 text-[#8fa6ba] font-semibold text-sm transition-colors border-b-2"
          >
            Satellites
          </button>
          <button
            role="tab"
            aria-selected={tab === 1}
            onClick={() => setTab(1)}
            className="flex-1 py-3 bg-none border-0 text-[#8fa6ba] font-semibold text-sm transition-colors border-b-2"
          >
            Ground stations
          </button>
        </div>

        {/* Object Selection List */}
        <div className="list overflow-y-auto max-h-[34%] min-h-[96px] p-1.5 border-b border-[rgba(127,178,212,0.24)]">
          {tab === 0
            ? SA_RAW.map((s) => {
                const isSelected =
                  selectedObj &&
                  selectedObj.kind === "sat" &&
                  selectedObj.name === s.name;
                return (
                  <button
                    key={s.name}
                    className={`it ${isSelected ? "on" : ""}`}
                    onClick={() => {
                      const target = objsMapRef.current.get(s.name);
                      if (target && pickTargetRef.current) {
                        pickTargetRef.current(target);
                      }
                    }}
                  >
                    <i
                      style={{
                        backgroundColor: s.cls === "LEO" ? "#f2c14e" : "#6fd6e8",
                      }}
                    />
                    <span className="font-medium text-[#e8f1f8] mr-auto ml-2">
                      {s.name}
                    </span>
                    <span className="text-xs text-[#8fa6ba]">
                      {s.cls} · {s.alt} km
                    </span>
                  </button>
                );
              })
            : ST_RAW.map((g) => {
                const isSelected =
                  selectedObj &&
                  selectedObj.kind === "st" &&
                  selectedObj.name === g.name;
                return (
                  <button
                    key={g.name}
                    className={`it ${isSelected ? "on" : ""}`}
                    onClick={() => {
                      const target = objsMapRef.current.get(g.name);
                      if (target && pickTargetRef.current) {
                        pickTargetRef.current(target);
                      }
                    }}
                  >
                    <i style={{ backgroundColor: "#ffd27a" }} />
                    <span className="font-medium text-[#e8f1f8] mr-auto ml-2">
                      {g.name}
                    </span>
                    <span className="text-xs text-[#8fa6ba]">{g.band}</span>
                  </button>
                );
              })}
        </div>

        {/* Detailed Object Inspector */}
        <div id="det" className="overflow-y-auto p-4 flex-1 text-sm">
          {!selectedObj ? (
            <p className="empty text-[#8fa6ba] leading-relaxed">
              Click a satellite or ground station on the globe, or choose one from the list, to inspect it.
            </p>
          ) : (
            <div>
              <button
                className="x"
                aria-label="Clear selection"
                onClick={() => {
                  if (pickTargetRef.current) pickTargetRef.current(null);
                }}
              >
                Close
              </button>

              <h2 className="text-xl font-bold tracking-tight text-white">
                {selectedObj.name}
              </h2>

              <div className="sub text-[#8fa6ba] text-xs mt-0.5 mb-3">
                {selectedObj.kind === "sat"
                  ? `${selectedObj.role} · ${selectedObj.cls}`
                  : `${selectedObj.band} ground station`}
              </div>

              {/* 2-Column Key Value Grid */}
              <div className="kv mono">
                {(selectedObj.kind === "sat"
                  ? satMetrics
                  : stationMetrics
                ).map(([label, val]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <b>{val}</b>
                  </div>
                ))}
              </div>

              {/* Contacts / Passes Title */}
              <h3 className="text-xs text-[#8fa6ba] font-medium mt-1 mb-2">
                {selectedObj.kind === "sat"
                  ? "Ground contacts"
                  : "Satellite passes"}
              </h3>

              {/* Passes List */}
              <div className="flex flex-col">
                {passesList
                  .slice(0, selectedObj.kind === "sat" ? 6 : 10)
                  .map((pass) => (
                    <div
                      key={pass.o.name}
                      className="ct mono"
                      onClick={() => {
                        if (pickTargetRef.current) {
                          pickTargetRef.current(pass.o);
                        }
                      }}
                    >
                      <span>{pass.o.name}</span>
                      {pass.now ? (
                        <em>In contact · {(pass.el * (180 / Math.PI)).toFixed(0)}°</em>
                      ) : pass.t > 1e11 ? (
                        <span>No pass in 3 h</span>
                      ) : (
                        <span>
                          {fmtTime(pass.t)} · {Math.round((pass.dur || 600) / 60)} min
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
