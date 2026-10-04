/* ============================================
   OKTAFIYA'S BIRTHDAY UNIVERSE — SCRIPT
   Three.js Interactive 3D Solar System Experience
   ============================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ===== GLOBAL STATE =====
let scene, camera, renderer, composer, controls;
let sun, planets = [], oktafiyaPlanet, birthdayCake;
let characters = [];
let starField, shootingStars = [];
let raycaster, mouse;
let clock;
let isSceneReady = false;
let currentView = 'landing'; // 'landing' | 'solar-system' | 'planet-zoom' | 'surprise'
let planetsVisited = new Set();
let musicPlaying = false;
let audioCtx = null;
let musicInterval = null;
let secretStarClicks = 0;
let secretStar = null;
let hiddenCrystal = null;
let focusedTarget = null;
let currentPlanetIndex = 0;
let pointerDownPos = { x: 0, y: 0 };
let typingTimeouts = [];

// Camera animation state
let cameraAnim = {
  active: false,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  endTarget: new THREE.Vector3(),
  progress: 0,
  duration: 1.8,
  onComplete: null
};

// Character speech state
let speechTimer = null;

// ===== PLANET DATA =====
const PLANET_DATA = [
  {
    name: 'Mercury', icon: '☿', radius: 0.45, distance: 8.5, speed: 0.015,
    color: 0xe8be99, emissive: 0x3a2210, rotSpeed: 0.01,
    fact: 'Planet terkecil dan terdekat dengan Matahari dalam tata surya!',
    message: 'Meskipun kecil, setiap langkah dan senyumanmu membawa kehangatan yang begitu besar bagi orang-orang di sekitarmu. ☿✨'
  },
  {
    name: 'Venus', icon: '♀', radius: 0.65, distance: 11.5, speed: 0.012,
    color: 0xfbd0b5, emissive: 0x4a2a15, rotSpeed: 0.008,
    fact: 'Objek alami paling terang di langit malam setelah Bulan!',
    message: 'Seperti Venus yang selalu bersinar paling indah di langit malam, teruslah pancarkan kebaikan dan pesonamu! ♀💫'
  },
  {
    name: 'Earth', icon: '🌎', radius: 0.7, distance: 15, speed: 0.01,
    color: 0x72c4e8, emissive: 0x122a3a, rotSpeed: 0.012,
    fact: 'Satu-satunya rumah kehidupan kita dengan samudra dan atmosfer yang sejuk!',
    message: 'Seperti Bumi yang selalu penuh warna dan petualangan seru, semoga hari-harimu selalu asyik bareng teman-teman terbaik! 🌎✨'
  },
  {
    name: 'Mars', icon: '♂', radius: 0.5, distance: 18.5, speed: 0.008,
    color: 0xf59a9a, emissive: 0x3a1212, rotSpeed: 0.011,
    fact: 'Planet Merah dengan gunung berapi tertinggi di seluruh tata surya!',
    message: 'Keep chasing your dreams, Oktafiya! Meskipun perjalanannya terasa jauh dan menantang, kamu pasti bisa mencapainya! 🔴✨'
  },
  {
    name: 'Jupiter', icon: '🪐', radius: 1.4, distance: 24.5, speed: 0.005,
    color: 0xf3d6a7, emissive: 0x3a2812, rotSpeed: 0.02,
    fact: 'Raksasa gas terbesar — bisa memuat lebih dari 1.300 Bumi di dalamnya!',
    message: 'Semoga kesuksesan, rezeki, dan kebahagiaanmu selalu seluas dan sebesar Jupiter! 🪐✨'
  },
  {
    name: 'Saturn', icon: '🪐', radius: 1.15, distance: 30.5, speed: 0.004,
    color: 0xf8dfae, emissive: 0x3a2c14, rotSpeed: 0.018, hasRing: true,
    fact: 'Terkenal dengan cincin es spektakuler yang melingkar anggun!',
    message: 'Semoga setiap perjalanan hidupmu dihiasi lingkaran kenangan yang seru dan membanggakan! 💫✨'
  },
  {
    name: 'Uranus', icon: '🔵', radius: 0.85, distance: 36.5, speed: 0.003,
    color: 0xaee1f5, emissive: 0x10323a, rotSpeed: 0.013,
    fact: 'Planet es yang berputar miring hampir menyentuh bidang orbitnya!',
    message: 'Tetaplah unik, percaya diri, dan bangga dengan potensimu. Semangat terus! 🚀✨'
  },
  {
    name: 'Neptune', icon: '🟣', radius: 0.8, distance: 42, speed: 0.002,
    color: 0xbfbbf8, emissive: 0x1a1542, rotSpeed: 0.014,
    fact: 'Planet terjauh dengan badai angin kosmik yang sangat misterius dan megah!',
    message: 'Semoga ketenangan dan kesuksesan selalu menyertai setiap langkah perjalanan masa depanmu. 🌊✨'
  }
];

const OKTAFIYA_DATA = {
  name: 'Oktafiya', icon: '🌟', radius: 1.05, distance: 48, speed: 0.0022,
  color: 0xf8a4c8, emissive: 0x4a1838, rotSpeed: 0.006,
  fact: 'Planet paling bersinar dan istimewa di galaksi ini, dibuat khusus untuk Oktafiya!',
  message: 'This planet belongs to Oktafiya Sri Handayani! Selamat ulang tahun, semoga makin sukses, makin hebat, dan impianmu terkabul! 🎂🎉✨'
};

const SPEECH_MESSAGES = [
  "psst... it's Oktafiya's birthday! 👀",
  "Don't forget to make a wish! ⭐",
  "Ada kue ulang tahun melayang di sana! 🎂",
  "Happy Birthday Oktafiya! 🎉",
  "Meow! Semesta ini lucu banget! 🐱",
  "Sudah coba klik bintang rahasia? 🌟",
  "Lihat! Ada bintang jatuh lewat! ✨",
  "Kamu adalah orang yang hebat, Oktafiya! 🚀",
  "Klik tombol Surprise untuk pesta kembang api! 🎁"
];

// ===== INITIALIZATION =====
function init() {
  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2(-999, -999);

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0815, 0.0028);

  // Camera
  const isPortrait = window.innerWidth < window.innerHeight;
  const initialFov = isPortrait ? Math.min(74, 58 / Math.max(window.innerWidth / window.innerHeight, 0.65)) : 58;
  camera = new THREE.PerspectiveCamera(initialFov, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, isPortrait ? 48 : 42, isPortrait ? 100 : 92);

  // Renderer
  const canvas = document.getElementById('universe-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Postprocessing (Glow Bloom)
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.65, 0.45, 0.82
  );
  composer.addPass(bloomPass);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 4;
  controls.maxDistance = 140;
  controls.enabled = false;
  controls.target.set(0, 0, 0);

  // Lighting
  createLighting();

  // Celestial objects
  createStarField();
  createSun();
  createPlanets();
  createOktafiyaPlanet();
  createOrbits();
  createBirthdayCake();
  createCharacters();
  createSecretStar();
  createHiddenCrystal();

  // Events
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', onPointerUp);

  setupUI();
  setupPasscode();

  // Start Animation Loop
  animate();
}

// ===== LIGHTING =====
function createLighting() {
  const ambient = new THREE.AmbientLight(0x28183c, 0.7);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0xffecd0, 2.8, 250);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const fillLight1 = new THREE.DirectionalLight(0xd4c2ff, 0.35);
  fillLight1.position.set(60, 40, 60);
  scene.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0xfcd5e5, 0.25);
  fillLight2.position.set(-60, -30, -50);
  scene.add(fillLight2);
}

// ===== STARFIELD PARTICLES =====
function createStarField() {
  const count = 3500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const starColors = [
    new THREE.Color(0xffe066),
    new THREE.Color(0xfcd5e5),
    new THREE.Color(0xe2d5ff),
    new THREE.Color(0xd4eef7),
    new THREE.Color(0xffffff)
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 140 + Math.random() * 220;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const c = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  starField = new THREE.Points(geom, mat);
  scene.add(starField);
}

// ===== SUN =====
function createSun() {
  const geom = new THREE.SphereGeometry(3.2, 32, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffe270,
    transparent: true,
    opacity: 0.96
  });
  sun = new THREE.Mesh(geom, mat);
  sun.userData = { type: 'sun', name: 'Matahari ☀️ (Klik aku!)' };
  scene.add(sun);

  // Outer glow sprite
  const glowCanvas = createGlowTexture(256, '#ffe270', '#ff9900');
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.55
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(16, 16, 1);
  sun.add(glow);
}

// ===== STANDARD PLANETS =====
function createPlanets() {
  PLANET_DATA.forEach((data, index) => {
    const group = new THREE.Group();

    // Planet mesh
    const geom = new THREE.SphereGeometry(data.radius, 28, 28);
    const mat = new THREE.MeshPhongMaterial({
      color: data.color,
      emissive: data.emissive,
      emissiveIntensity: 0.35,
      shininess: 35,
      specular: 0x333333
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData = { type: 'planet', index, ...data };
    group.add(mesh);

    // Saturn Ring
    if (data.hasRing) {
      const ringGeom = new THREE.RingGeometry(data.radius * 1.45, data.radius * 2.3, 40);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf5e4c3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2.4;
      group.add(ring);
    }

    // Gentle halo glow
    const glowCanvas = createGlowTexture(64, `#${data.color.toString(16).padStart(6, '0')}`, '#000000');
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.18
    }));
    glowSprite.scale.set(data.radius * 5.2, data.radius * 5.2, 1);
    group.add(glowSprite);

    // Position
    const angle = (index / PLANET_DATA.length) * Math.PI * 2 + index * 0.4;
    group.position.x = Math.cos(angle) * data.distance;
    group.position.z = Math.sin(angle) * data.distance;
    group.position.y = 0;

    group.userData = { angle, ...data };
    scene.add(group);
    planets.push({ group, mesh, data, angle });
  });
}

// ===== OKTAFIYA SPECIAL PLANET =====
function createOktafiyaPlanet() {
  const data = OKTAFIYA_DATA;
  const group = new THREE.Group();

  // Gradient sphere
  const geom = new THREE.SphereGeometry(data.radius, 32, 32);
  const posAttr = geom.attributes.position;
  const colorsArr = new Float32Array(posAttr.count * 3);
  const pink = new THREE.Color(0xfba5c8);
  const lavender = new THREE.Color(0xc9b0ff);

  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const t = (y / data.radius + 1) / 2;
    const c = pink.clone().lerp(lavender, t);
    colorsArr[i * 3] = c.r;
    colorsArr[i * 3 + 1] = c.g;
    colorsArr[i * 3 + 2] = c.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3));

  const mat = new THREE.MeshPhongMaterial({
    vertexColors: true,
    emissive: 0x3d142d,
    emissiveIntensity: 0.45,
    shininess: 65,
    specular: 0x555555
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.userData = { type: 'oktafiya', ...data };
  group.add(mesh);

  // Cosmic Star Ring
  const cosmicStarRing = new THREE.Group();
  const ringCount = 10;
  for (let i = 0; i < ringCount; i++) {
    const starSprite = createStarSprite();
    const a = (i / ringCount) * Math.PI * 2;
    const r = data.radius * 2.2;
    starSprite.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    starSprite.scale.set(0.32, 0.32, 0.32);
    cosmicStarRing.add(starSprite);
  }
  cosmicStarRing.rotation.x = Math.PI / 4;
  group.add(cosmicStarRing);

  // Orbiting mini stars
  const miniStarGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const starSprite = createStarSprite();
    const a = (i / 6) * Math.PI * 2;
    const r = data.radius * 2.8;
    starSprite.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 1.5, Math.sin(a) * r);
    starSprite.scale.set(0.28, 0.28, 0.28);
    miniStarGroup.add(starSprite);
  }
  group.add(miniStarGroup);

  // Rich soft aura
  const glowCanvas = createGlowTexture(128, '#f8a4c8', '#a878e0');
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.35
  }));
  glowSprite.scale.set(7.5, 7.5, 1);
  group.add(glowSprite);

  // Floating Cute Label Sprite
  const labelCanvas = createTextCanvas('This planet belongs to Oktafiya ✨', 'rgba(255, 235, 245, 0.95)');
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
  labelSprite.position.y = data.radius + 1.8;
  labelSprite.scale.set(5.5, 1.4, 1);
  group.add(labelSprite);

  // Initial orbit position
  const angle = 1.1;
  group.position.x = Math.cos(angle) * data.distance;
  group.position.z = Math.sin(angle) * data.distance;
  group.position.y = 0;

  group.userData = { angle, cosmicStarRing, miniStarGroup, ...data };
  scene.add(group);
  oktafiyaPlanet = { group, mesh, data, angle };
}

// ===== ORBIT LINES =====
function createOrbits() {
  const allPlanets = [...PLANET_DATA, OKTAFIYA_DATA];
  allPlanets.forEach(data => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(a) * data.distance,
        0,
        Math.sin(a) * data.distance
      ));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x42325c,
      transparent: true,
      opacity: 0.28
    });
    const line = new THREE.Line(geom, mat);
    scene.add(line);
  });
}

// ===== BIRTHDAY CAKE OBJECT =====
function createBirthdayCake() {
  const group = new THREE.Group();

  // Bottom Tier
  const bottomGeom = new THREE.CylinderGeometry(1.3, 1.4, 0.9, 28);
  const bottomMat = new THREE.MeshPhongMaterial({ color: 0xfcd5e5, emissive: 0x2e1224, emissiveIntensity: 0.25 });
  const bottom = new THREE.Mesh(bottomGeom, bottomMat);
  group.add(bottom);

  // Top Tier
  const topGeom = new THREE.CylinderGeometry(0.95, 1.05, 0.8, 28);
  const topMat = new THREE.MeshPhongMaterial({ color: 0xe5d8ff, emissive: 0x201235, emissiveIntensity: 0.25 });
  const top = new THREE.Mesh(topGeom, topMat);
  top.position.y = 0.85;
  group.add(top);

  // Frosting border
  const frostGeom = new THREE.TorusGeometry(1.02, 0.09, 8, 28);
  const frostMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x222222 });
  const frost = new THREE.Mesh(frostGeom, frostMat);
  frost.position.y = 1.25;
  frost.rotation.x = Math.PI / 2;
  group.add(frost);

  // Candles & Flames
  const candleColors = [0xf8a4c8, 0xa8d8ea, 0xffe066, 0xb5b3f0, 0xf5a6a6];
  for (let i = 0; i < 5; i++) {
    const candleGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 8);
    const candleMat = new THREE.MeshPhongMaterial({ color: candleColors[i] });
    const candle = new THREE.Mesh(candleGeom, candleMat);
    const a = (i / 5) * Math.PI * 2;
    candle.position.set(Math.cos(a) * 0.55, 1.5, Math.sin(a) * 0.55);
    group.add(candle);

    // Flame
    const flameGeom = new THREE.SphereGeometry(0.09, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(Math.cos(a) * 0.55, 1.85, Math.sin(a) * 0.55);
    flame.userData = { isFlame: true, baseY: 1.85 };
    group.add(flame);
  }

  // Cute Sprinkles
  for (let i = 0; i < 22; i++) {
    const spGeom = new THREE.SphereGeometry(0.045, 6, 6);
    const spMat = new THREE.MeshBasicMaterial({
      color: [0xf8a4c8, 0xa8d8ea, 0xffe066, 0xb5e8d5, 0xf5a6a6][i % 5]
    });
    const sprinkle = new THREE.Mesh(spGeom, spMat);
    const a = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.55;
    const y = 0.9 + Math.random() * 0.35;
    sprinkle.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    group.add(sprinkle);
  }

  // Aura glow
  const glowCanvas = createGlowTexture(64, '#ffe066', '#ff8800');
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.25
  }));
  glowSprite.scale.set(6, 6, 1);
  glowSprite.position.y = 1.2;
  group.add(glowSprite);

  // Position in space between orbits
  group.position.set(19, 1.5, -16);
  group.userData = { type: 'cake', name: 'Birthday Cake 🎂 (Klik aku!)', candlesLit: true, radius: 1.5 };
  scene.add(group);
  birthdayCake = group;
}

// ===== CUTE SPACE CHARACTERS =====
function createCharacters() {
  // 1. Astronaut Cat 🐱🚀
  const cat = createAstronautCat();
  cat.position.set(24, 6, 12);
  cat.userData = { type: 'character', name: 'Astronaut Cat 🐱', charType: 'cat', basePos: new THREE.Vector3(24, 6, 12), time: 0 };
  scene.add(cat);
  characters.push(cat);

  // 2. Cute Alien 👽
  const alien = createCuteAlien();
  alien.position.set(-22, 4, -20);
  alien.userData = { type: 'character', name: 'Cute Alien 👽', charType: 'alien', basePos: new THREE.Vector3(-22, 4, -20), time: 1.5 };
  scene.add(alien);
  characters.push(alien);

  // 3. Tiny Astronaut
  const astro = createTinyAstronaut();
  astro.position.set(-12, -3, 32);
  astro.userData = { type: 'character', name: 'Tiny Astronaut 🧑‍🚀', charType: 'astronaut', basePos: new THREE.Vector3(-12, -3, 32), time: 3 };
  scene.add(astro);
  characters.push(astro);

  // 4. Star Character ⭐
  const starChar = createStarCharacter();
  starChar.position.set(36, -4, -8);
  starChar.userData = { type: 'character', name: 'Star Buddy ⭐', charType: 'star', basePos: new THREE.Vector3(36, -4, -8), time: 4.5 };
  scene.add(starChar);
  characters.push(starChar);
}

function createAstronautCat() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshPhongMaterial({ color: 0xffffff }));
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshPhongMaterial({ color: 0xfbd0b5 }));
  head.position.y = 0.75;
  group.add(head);

  const earGeom = new THREE.ConeGeometry(0.14, 0.24, 8);
  const earMat = new THREE.MeshPhongMaterial({ color: 0xfbd0b5 });
  const earL = new THREE.Mesh(earGeom, earMat);
  earL.position.set(-0.22, 1.1, 0);
  earL.rotation.z = 0.3;
  group.add(earL);

  const earR = new THREE.Mesh(earGeom, earMat);
  earR.position.set(0.22, 1.1, 0);
  earR.rotation.z = -0.3;
  group.add(earR);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI),
    new THREE.MeshPhongMaterial({ color: 0x4896c2, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  visor.position.y = 0.75;
  visor.rotation.y = Math.PI;
  group.add(visor);
  group.scale.set(0.9, 0.9, 0.9);
  return group;
}

function createCuteAlien() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshPhongMaterial({ color: 0xb5e8d5 }));
  group.add(body);

  [-0.16, 0.16].forEach(x => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eyeWhite.position.set(x, 0.16, 0.38);
    group.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    pupil.position.set(x, 0.16, 0.48);
    group.add(pupil);
  });

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8), new THREE.MeshPhongMaterial({ color: 0xb5e8d5 }));
  antenna.position.y = 0.65;
  group.add(antenna);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  ball.position.y = 0.92;
  group.add(ball);
  group.scale.set(0.85, 0.85, 0.85);
  return group;
}

function createTinyAstronaut() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.75, 12), new THREE.MeshPhongMaterial({ color: 0xf4f4f4 }));
  group.add(body);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
  helmet.position.y = 0.6;
  group.add(helmet);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0xffd54f, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  visor.position.set(0, 0.6, 0.12);
  group.add(visor);
  group.scale.set(0.8, 0.8, 0.8);
  return group;
}

function createStarCharacter() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const outerR = 0.55, innerR = 0.28, points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 });
  const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({ color: 0xffe066, emissive: 0x443000, emissiveIntensity: 0.4 }));
  group.add(mesh);

  [-0.11, 0.11].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
    eye.position.set(x, 0.06, 0.14);
    group.add(eye);
  });
  group.scale.set(0.85, 0.85, 0.85);
  return group;
}

// ===== EASTER EGGS =====
function createSecretStar() {
  const geom = new THREE.SphereGeometry(0.65, 14, 14);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffeb66 });
  secretStar = new THREE.Mesh(geom, mat);
  secretStar.position.set(65, 32, -45);
  secretStar.userData = { type: 'secretStar', name: 'Bintang Misterius ⭐ (Klik 3x!)' };

  const glowCanvas = createGlowTexture(64, '#ffe066', '#ff8800');
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.4
  }));
  glowSprite.scale.set(4.5, 4.5, 1);
  secretStar.add(glowSprite);
  scene.add(secretStar);
}

function createHiddenCrystal() {
  const crystalGeom = new THREE.OctahedronGeometry(0.55, 0);
  const crystalMat = new THREE.MeshPhongMaterial({
    color: 0x70e6d2,
    emissive: 0x124840,
    emissiveIntensity: 0.6,
    shininess: 90,
    specular: 0xffffff
  });
  const crystalMesh = new THREE.Mesh(crystalGeom, crystalMat);
  crystalMesh.position.set(21, 0.8, 21);
  crystalMesh.userData = { type: 'hiddenCrystal', name: 'Kristal Kosmik Langka 💎' };

  const glowCanvas = createGlowTexture(64, '#70e6d2', '#206080');
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.4
  }));
  glowSprite.scale.set(3.5, 3.5, 1);
  crystalMesh.add(glowSprite);

  scene.add(crystalMesh);
  hiddenCrystal = crystalMesh;
}

// ===== TEXTURE HELPERS =====
function createGlowTexture(size, colorInner, colorOuter) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, colorInner);
  grad.addColorStop(0.35, colorInner + '90');
  grad.addColorStop(1, colorOuter + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function createStarSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffe066';
  const cx = 32, cy = 32, spikes = 5, outerR = 17, innerR = 8;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
}

function createTextCanvas(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = color || 'rgba(255,255,255,0.95)';
  ctx.font = '700 28px Quicksand, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  return canvas;
}

// ===== PASSCODE / LOCK SCREEN LOGIC =====
function setupPasscode() {
  const input = document.getElementById('passcode-input');
  const btnUnlock = document.getElementById('btn-unlock');
  const errorMsg = document.getElementById('passcode-error');

  if (!input || !btnUnlock) return;

  // Auto-format slash on typing digits
  input.addEventListener('input', (e) => {
    if (errorMsg) errorMsg.classList.add('hidden');
    let val = input.value.replace(/[^0-9/]/g, '');

    // Auto insert '/' if typing without slashes
    if (val.length === 2 && !val.includes('/') && e.inputType !== 'deleteContentBackward') {
      val = val + '/';
    } else if (val.length === 5 && val.split('/').length === 2 && e.inputType !== 'deleteContentBackward') {
      val = val + '/';
    }
    input.value = val;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      checkPasscode();
    }
  });

  btnUnlock.addEventListener('click', checkPasscode);

  function checkPasscode() {
    const rawVal = input.value.trim();
    const cleaned = rawVal.replace(/\s+/g, '');
    const validCodes = ['05/10/2026', '05-10-2026', '05102026', '5/10/2026'];

    if (validCodes.includes(cleaned)) {
      playSound('sparkle');
      if (errorMsg) errorMsg.classList.add('hidden');

      // Hide passcode screen
      const passScreen = document.getElementById('passcode-screen');
      if (passScreen) {
        passScreen.classList.add('unlocked');
        setTimeout(() => {
          passScreen.style.display = 'none';
        }, 800);
      }

      // Show loading screen
      const loader = document.getElementById('loading-screen');
      if (loader) {
        loader.classList.remove('hidden');

        // Loading duration, then display landing page
        setTimeout(() => {
          loader.classList.add('fade-out');
          setTimeout(() => {
            loader.style.display = 'none';
            isSceneReady = true;
          }, 800);
        }, 1600);
      }
    } else {
      playSound('click');
      if (errorMsg) errorMsg.classList.remove('hidden');
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
      input.focus();
    }
  }
}

// ===== UI SETUP =====
function setupUI() {
  // Enter button
  document.getElementById('btn-enter').addEventListener('click', enterUniverse);

  // Top navigation buttons
  document.getElementById('btn-home').addEventListener('click', goHome);
  document.getElementById('btn-guide').addEventListener('click', openGuide);
  document.getElementById('btn-planets-list').addEventListener('click', togglePlanetDrawer);
  document.getElementById('btn-birthday').addEventListener('click', () => {
    if (oktafiyaPlanet) zoomToOktafiya(oktafiyaPlanet.mesh);
    else showBirthdayMessage();
  });
  document.getElementById('btn-surprise').addEventListener('click', showSurprise);
  document.getElementById('btn-music').addEventListener('click', toggleMusic);

  // Guide card buttons
  document.getElementById('guide-card-close').addEventListener('click', closeGuide);
  document.getElementById('btn-guide-start').addEventListener('click', closeGuide);

  // Planet card buttons
  document.getElementById('planet-card-close').addEventListener('click', closePlanetCard);
  document.getElementById('btn-planet-back').addEventListener('click', closePlanetCard);
  document.getElementById('btn-planet-next').addEventListener('click', nextPlanet);

  // Birthday card buttons
  document.getElementById('birthday-card-close').addEventListener('click', () => {
    document.getElementById('birthday-card').classList.add('hidden');
    focusedTarget = null;
    controls.enabled = true;
  });
  document.getElementById('btn-bday-back').addEventListener('click', () => {
    document.getElementById('birthday-card').classList.add('hidden');
    goHome();
  });
  document.getElementById('btn-bday-surprise').addEventListener('click', () => {
    document.getElementById('birthday-card').classList.add('hidden');
    showSurprise();
  });

  // Cake card buttons
  document.getElementById('cake-card-close').addEventListener('click', () => {
    document.getElementById('cake-card').classList.add('hidden');
    focusedTarget = null;
    controls.enabled = true;
  });
  document.getElementById('btn-cake-back').addEventListener('click', () => {
    document.getElementById('cake-card').classList.add('hidden');
    goHome();
  });
  document.getElementById('btn-blow').addEventListener('click', blowCandles);

  // Surprise overlay
  document.getElementById('btn-surprise-close').addEventListener('click', closeSurprise);

  // Hint banner
  document.getElementById('btn-hint-close').addEventListener('click', () => {
    document.getElementById('hint').classList.add('hidden');
  });

  // Drawer buttons
  document.getElementById('drawer-close').addEventListener('click', () => {
    document.getElementById('planet-drawer').classList.add('hidden');
  });

  document.querySelectorAll('.drawer-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      document.getElementById('planet-drawer').classList.add('hidden');
      navigateToTarget(target);
    });
  });
}

// ===== CAMERA HELPERS =====
function getHomeCameraPos() {
  const isPortrait = window.innerWidth < window.innerHeight;
  return isPortrait
    ? new THREE.Vector3(0, 36, 76)
    : new THREE.Vector3(0, 26, 60);
}

// ===== ENTER UNIVERSE =====
function enterUniverse() {
  playSound('whoosh');
  initAudio();

  const landing = document.getElementById('landing-page');
  landing.classList.add('fly-away');
  setTimeout(() => { landing.style.display = 'none'; }, 950);

  currentView = 'solar-system';

  animateCamera(
    getHomeCameraPos(),
    new THREE.Vector3(0, 0, 0),
    2.5,
    () => {
      controls.enabled = true;
      document.getElementById('ui-overlay').classList.remove('hidden');
      const hint = document.getElementById('hint');
      hint.classList.remove('hidden');
      setTimeout(() => { hint.classList.add('hidden'); }, 7000);
      startSpeechBubbles();
    }
  );
}

// ===== CAMERA ANIMATION =====
function animateCamera(targetPos, targetLookAt, duration, onComplete) {
  cameraAnim.active = true;
  cameraAnim.startPos.copy(camera.position);
  cameraAnim.endPos.copy(targetPos);
  cameraAnim.startTarget.copy(controls.target);
  cameraAnim.endTarget.copy(targetLookAt);
  cameraAnim.progress = 0;
  cameraAnim.duration = duration || 1.8;
  cameraAnim.onComplete = onComplete || null;
  controls.enabled = false;
}

function updateCameraAnimation(dt) {
  if (!cameraAnim.active) return;
  cameraAnim.progress += dt / cameraAnim.duration;
  if (cameraAnim.progress >= 1) {
    cameraAnim.progress = 1;
    cameraAnim.active = false;
    camera.position.copy(cameraAnim.endPos);
    controls.target.copy(cameraAnim.endTarget);
    if (cameraAnim.onComplete) cameraAnim.onComplete();
    return;
  }
  const t = easeInOutCubic(cameraAnim.progress);
  camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, t);
  controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, t);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== NAVIGATION HELPERS =====
function goHome() {
  playSound('click');
  hideAllCards();
  focusedTarget = null;
  currentView = 'solar-system';
  animateCamera(
    getHomeCameraPos(),
    new THREE.Vector3(0, 0, 0),
    1.8,
    () => { controls.enabled = true; }
  );
}

function openGuide() {
  playSound('click');
  hideAllCards();
  document.getElementById('guide-card').classList.remove('hidden');
}

function closeGuide() {
  playSound('click');
  document.getElementById('guide-card').classList.add('hidden');
  if (currentView === 'solar-system') controls.enabled = true;
}

function togglePlanetDrawer() {
  playSound('click');
  const drawer = document.getElementById('planet-drawer');
  drawer.classList.toggle('hidden');
}

function navigateToTarget(targetName) {
  playSound('sparkle');
  if (targetName === 'Sun') {
    sunBurst();
    animateCamera(new THREE.Vector3(0, 10, 15), new THREE.Vector3(0, 0, 0), 1.5);
  } else if (targetName === 'Oktafiya') {
    if (oktafiyaPlanet) zoomToOktafiya(oktafiyaPlanet.mesh);
  } else if (targetName === 'Cake') {
    zoomToCake();
  } else {
    const found = planets.find(p => p.data.name.toLowerCase() === targetName.toLowerCase());
    if (found) {
      currentPlanetIndex = found.data.index;
      zoomToPlanet(found.mesh, found.data);
    }
  }
}

function nextPlanet() {
  currentPlanetIndex = (currentPlanetIndex + 1) % PLANET_DATA.length;
  const p = planets[currentPlanetIndex];
  if (p) zoomToPlanet(p.mesh, p.data);
}

// ===== POINTER & RAYCASTING =====
function onPointerMove(event) {
  // Disable hover label on touch devices to avoid stuck tooltips
  if (event.pointerType === 'touch') return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (currentView === 'landing' || currentView === 'surprise') return;

  raycaster.setFromCamera(mouse, camera);
  const clickables = getClickableObjects();
  const intersects = raycaster.intersectObjects(clickables, true);

  const label = document.getElementById('planet-label');
  const labelText = document.getElementById('label-text');

  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    const obj = findUserDataParent(intersects[0].object);
    if (obj && obj.userData && obj.userData.name) {
      label.classList.remove('hidden');
      labelText.textContent = obj.userData.name;
      label.style.left = Math.min(event.clientX + 14, window.innerWidth - 180) + 'px';
      label.style.top = Math.max(event.clientY - 25, 20) + 'px';
      return;
    }
  }

  document.body.style.cursor = 'default';
  label.classList.add('hidden');
}

function onPointerUp(event) {
  if (currentView === 'landing' || currentView === 'surprise') return;

  // Ignore drag gestures - allow higher tolerance on touch devices
  const isTouch = event.pointerType === 'touch';
  const maxTapDist = isTouch ? 18 : 8;
  const dist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
  if (dist > maxTapDist) return;

  const mouseClick = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouseClick, camera);
  const clickables = getClickableObjects();
  const intersects = raycaster.intersectObjects(clickables, true);

  if (intersects.length === 0) return;

  const hit = intersects[0].object;
  const parentObj = findUserDataParent(hit);
  if (!parentObj) return;

  const ud = parentObj.userData;

  if (ud.type === 'planet') {
    playSound('sparkle');
    currentPlanetIndex = ud.index;
    zoomToPlanet(parentObj, ud);
  } else if (ud.type === 'oktafiya') {
    playSound('sparkle');
    zoomToOktafiya(parentObj);
  } else if (ud.type === 'cake') {
    playSound('sparkle');
    zoomToCake();
  } else if (ud.type === 'sun') {
    playSound('burst');
    sunBurst();
    showToast('☀️ Matahari bersinar penuh kehangatan ');
  } else if (ud.type === 'character') {
    playSound('sparkle');
    showCharacterSpeech(parentObj);
  } else if (ud.type === 'secretStar') {
    secretStarClicks++;
    playSound('sparkle');
    if (secretStarClicks >= 3) {
      showToast('⭐ Kamu menemukan Bintang Rahasia! Semoga semua impian Oktafiya tercapai! ✨');
      spawnGlobalConfetti(30);
      secretStarClicks = 0;
    } else {
      showToast(`⭐ Bintang berkelap-kelip (${secretStarClicks}/3 klik) ✨`);
    }
  } else if (ud.type === 'hiddenCrystal') {
    playSound('sparkle');
    showToast('💎 Wih, kamu menemukan Kristal Kosmik Langka! Happy Birthday! 🎉✨');
    spawnGlobalConfetti(25);
  }
}

function getClickableObjects() {
  const objects = [sun];
  planets.forEach(p => objects.push(p.mesh));
  if (oktafiyaPlanet) objects.push(oktafiyaPlanet.mesh);
  if (birthdayCake) objects.push(birthdayCake);
  if (secretStar) objects.push(secretStar);
  if (hiddenCrystal) objects.push(hiddenCrystal);
  characters.forEach(c => objects.push(c));
  return objects;
}

function findUserDataParent(obj) {
  let current = obj;
  while (current) {
    if (current.userData && current.userData.type) return current;
    current = current.parent;
  }
  return null;
}

// ===== ZOOM ACTIONS =====
function zoomToPlanet(planetMesh, data) {
  hideAllCards();
  currentView = 'planet-zoom';
  focusedTarget = { object: planetMesh, radius: data.radius };

  const worldPos = new THREE.Vector3();
  planetMesh.getWorldPosition(worldPos);

  const isPortrait = window.innerWidth < window.innerHeight;
  const offsetMult = isPortrait ? 1.3 : 1.0;
  const offset = (data.radius * 4.5 + 2.8) * offsetMult;
  const camPos = new THREE.Vector3(
    worldPos.x + offset,
    worldPos.y + offset * (isPortrait ? 0.55 : 0.4),
    worldPos.z + offset
  );

  animateCamera(camPos, worldPos, 1.4, () => {
    showPlanetCard(data);
    planetsVisited.add(data.name);
    updateCounter();
    controls.enabled = true;
  });
}

function zoomToOktafiya(planetMesh) {
  hideAllCards();
  currentView = 'planet-zoom';
  focusedTarget = { object: planetMesh, radius: OKTAFIYA_DATA.radius };

  const worldPos = new THREE.Vector3();
  planetMesh.getWorldPosition(worldPos);

  const isPortrait = window.innerWidth < window.innerHeight;
  const offsetMult = isPortrait ? 1.3 : 1.0;
  const offset = (OKTAFIYA_DATA.radius * 4.8 + 3.2) * offsetMult;
  const camPos = new THREE.Vector3(
    worldPos.x + offset,
    worldPos.y + offset * (isPortrait ? 0.5 : 0.35),
    worldPos.z + offset
  );

  animateCamera(camPos, worldPos, 1.4, () => {
    showBirthdayMessage();
    planetsVisited.add('Oktafiya');
    updateCounter();
    controls.enabled = true;
  });
}

function zoomToCake() {
  hideAllCards();
  currentView = 'planet-zoom';
  focusedTarget = { object: birthdayCake, radius: 1.5 };

  const pos = birthdayCake.position.clone();
  const camPos = new THREE.Vector3(pos.x + 5.5, pos.y + 3.2, pos.z + 5.5);

  animateCamera(camPos, pos, 1.4, () => {
    document.getElementById('cake-card').classList.remove('hidden');
    controls.enabled = true;
  });
}

function showPlanetCard(data) {
  const card = document.getElementById('planet-card');
  document.getElementById('card-icon').textContent = data.icon;
  document.getElementById('card-title').textContent = data.name;
  document.getElementById('card-fact').textContent = data.fact;
  document.getElementById('card-message').textContent = data.message;
  card.classList.remove('hidden');
}

function closePlanetCard() {
  playSound('click');
  document.getElementById('planet-card').classList.add('hidden');
  goHome();
}

function hideAllCards() {
  document.getElementById('planet-card').classList.add('hidden');
  document.getElementById('birthday-card').classList.add('hidden');
  document.getElementById('cake-card').classList.add('hidden');
  document.getElementById('guide-card').classList.add('hidden');
  document.getElementById('planet-drawer').classList.add('hidden');
  document.getElementById('planet-label').classList.add('hidden');
}

function updateCounter() {
  const count = planetsVisited.size;
  const counterEl = document.getElementById('counter-text');
  counterEl.textContent = `Planet dikunjungi: ${count}/9 🪐`;

  if (count >= 5 && !document.getElementById('btn-surprise').classList.contains('highlight-ready')) {
    document.getElementById('btn-surprise').classList.add('highlight-ready');
    showToast('🎁 Tombol Surprise di atas kini siap dibuka!');
  }
}

// ===== BIRTHDAY MESSAGE WITH TYPING =====
function showBirthdayMessage() {
  playSound('sparkle');
  hideAllCards();
  const card = document.getElementById('birthday-card');
  card.classList.remove('hidden');

  // Cancel any active typing timeouts
  typingTimeouts.forEach(t => clearTimeout(t));
  typingTimeouts = [];

  const title = 'Happy Birthday, Oktafiya Sri Handayani! 🎂🎉✨';
  const msg1 = 'Selamat ulang tahun ya! Semoga panjang umur, sehat selalu, makin sukses belajarnya dan karirnya, serta selalu dikelilingi sahabat-sahabat terbaik.';
  const msg2 = 'Semoga semua cita-cita dan rencana hebatmu di tahun ini tercapai dengan lancar. Tetap jadi teman yang seru, keren, dan membanggakan! 🚀🌟✨';

  typeText('bday-title', title, 35, () => {
    typeText('bday-msg-1', msg1, 25, () => {
      typeText('bday-msg-2', msg2, 25, null);
    });
  });
}

function typeText(elementId, text, delay, onFinished) {
  const el = document.getElementById(elementId);
  el.textContent = '';
  let i = 0;
  function step() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      const t = setTimeout(step, delay);
      typingTimeouts.push(t);
    } else if (onFinished) {
      onFinished();
    }
  }
  step();
}

// ===== BLOW CANDLES =====
function blowCandles() {
  if (!birthdayCake.userData.candlesLit) return;
  playSound('whoosh');
  playSound('sparkle');
  birthdayCake.userData.candlesLit = false;

  // Hide flames
  birthdayCake.children.forEach(child => {
    if (child.userData && child.userData.isFlame) {
      child.visible = false;
    }
  });

  const wish = document.getElementById('cake-wish');
  wish.classList.remove('hidden');
  document.getElementById('btn-blow').style.display = 'none';

  spawnGlobalConfetti(60);
  showToast('✨ Make a wish, Oktafiya! Permohonanmu telah dikirim ke semesta! ⭐');
}

// ===== SUN BURST PARTICLES =====
function sunBurst() {
  const burstGroup = new THREE.Group();
  const count = 36;
  const parts = [];

  for (let i = 0; i < count; i++) {
    const geom = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: [0xffe066, 0xffaa33, 0xff6633, 0xf8a4c8][i % 4],
      transparent: true,
      opacity: 1
    });
    const p = new THREE.Mesh(geom, mat);
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize();
    p.userData = { dir, speed: 7 + Math.random() * 12, life: 1 };
    burstGroup.add(p);
    parts.push(p);
  }
  scene.add(burstGroup);

  const startTime = clock.getElapsedTime();
  function animateBurst() {
    const elapsed = clock.getElapsedTime() - startTime;
    let alive = false;
    parts.forEach(p => {
      if (p.userData.life > 0) {
        alive = true;
        p.userData.life -= 0.022;
        p.position.addScaledVector(p.userData.dir, p.userData.speed * 0.016);
        p.userData.speed *= 0.95;
        p.material.opacity = Math.max(0, p.userData.life);
        p.scale.setScalar(p.userData.life);
      }
    });
    if (alive && elapsed < 2.5) {
      requestAnimationFrame(animateBurst);
    } else {
      scene.remove(burstGroup);
    }
  }
  animateBurst();
}

// ===== FINAL SURPRISE =====
function showSurprise() {
  playSound('sparkle');
  hideAllCards();
  currentView = 'surprise';
  focusedTarget = null;
  controls.enabled = false;

  animateCamera(
    new THREE.Vector3(0, 55, 95),
    new THREE.Vector3(0, 0, 0),
    2.2,
    () => {
      if (starField) {
        starField.material.opacity = 1;
        starField.material.size = 1.3;
      }
      document.getElementById('surprise-overlay').classList.remove('hidden');
      spawnGlobalConfetti(100);
    }
  );
}

function closeSurprise() {
  playSound('click');
  document.getElementById('surprise-overlay').classList.add('hidden');
  currentView = 'solar-system';

  if (starField) {
    starField.material.opacity = 0.85;
    starField.material.size = 0.9;
  }

  animateCamera(
    getHomeCameraPos(),
    new THREE.Vector3(0, 0, 0),
    1.8,
    () => { controls.enabled = true; }
  );
}

// ===== GLOBAL CONFETTI =====
function spawnGlobalConfetti(count = 50) {
  const container = document.getElementById('global-confetti');
  if (!container) return;

  const colors = ['#f8a4c8', '#c9b1ff', '#a8d8ea', '#ffe066', '#b5e8d5', '#f5a6a6', '#fcd5c0', '#ffffff'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 8;
    piece.style.width = size + 'px';
    piece.style.height = (size * (Math.random() > 0.4 ? 1.4 : 1)) + 'px';
    piece.style.animationDuration = (2.2 + Math.random() * 2.8) + 's';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    container.appendChild(piece);

    setTimeout(() => { piece.remove(); }, 5000);
  }
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => { toast.classList.add('hidden'); }, 3200);
}

// ===== CHARACTER SPEECH BUBBLES =====
function startSpeechBubbles() {
  scheduleNextSpeech();
}

function scheduleNextSpeech() {
  const delay = 9000 + Math.random() * 10000;
  speechTimer = setTimeout(() => {
    if (currentView === 'solar-system') {
      showRandomCharacterSpeech();
    }
    scheduleNextSpeech();
  }, delay);
}

function showRandomCharacterSpeech() {
  if (characters.length === 0) return;
  const char = characters[Math.floor(Math.random() * characters.length)];
  showCharacterSpeech(char);
}

function showCharacterSpeech(charObj) {
  const msg = SPEECH_MESSAGES[Math.floor(Math.random() * SPEECH_MESSAGES.length)];
  const bubble = document.getElementById('speech-bubble');
  document.getElementById('speech-text').textContent = msg;

  const worldPos = new THREE.Vector3();
  charObj.getWorldPosition(worldPos);

  const screenPos = worldPos.clone().project(camera);
  if (screenPos.z > 1) return; // Behind camera

  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

  const maxRight = Math.max(window.innerWidth - 220, 20);
  const maxBottom = Math.max(window.innerHeight - 80, 20);
  bubble.style.left = Math.min(Math.max(x, 15), maxRight) + 'px';
  bubble.style.top = Math.min(Math.max(y - 65, 20), maxBottom) + 'px';
  bubble.classList.remove('hidden');

  setTimeout(() => { bubble.classList.add('hidden'); }, 4200);
}

// ===== SHOOTING STARS =====
function createShootingStar() {
  const start = new THREE.Vector3(
    (Math.random() - 0.5) * 180,
    40 + Math.random() * 40,
    (Math.random() - 0.5) * 180
  );
  const dir = new THREE.Vector3(
    (Math.random() - 0.5) * 1.5,
    -1.2,
    (Math.random() - 0.5) * 1.5
  ).normalize();

  const points = [start.clone(), start.clone().addScaledVector(dir, 3.5)];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xffe066,
    transparent: true,
    opacity: 0.85
  });
  const line = new THREE.Line(geom, mat);
  line.userData = { dir, speed: 70 + Math.random() * 40, life: 1 };
  scene.add(line);
  shootingStars.push(line);
}

function updateShootingStars(dt) {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];
    star.userData.life -= dt * 0.55;
    star.position.addScaledVector(star.userData.dir, star.userData.speed * dt);
    star.material.opacity = Math.max(0, star.userData.life);

    if (star.userData.life <= 0) {
      scene.remove(star);
      star.geometry.dispose();
      star.material.dispose();
      shootingStars.splice(i, 1);
    }
  }
}

// ===== WEB AUDIO ENGINE =====
function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) { }
}

function playSound(type) {
  try {
    initAudio();
    if (!audioCtx) return;

    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'sparkle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'whoosh') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.45);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'burst') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.2);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) { }
}

// ===== CUTE DREAMY MUSIC BOX =====
function toggleMusic() {
  const btn = document.getElementById('btn-music');
  const icon = document.getElementById('music-icon');

  if (musicPlaying) {
    stopMusic();
    icon.textContent = '🔇';
    btn.classList.remove('active');
  } else {
    startMusic();
    icon.textContent = '🔊';
    btn.classList.add('active');
  }
  musicPlaying = !musicPlaying;
}

function startMusic() {
  initAudio();
  if (!audioCtx) return;

  // Dreamy celestial melody scale (G Major Pentatonic / Lullaby)
  const notes = [
    392.00, 440.00, 493.88, 587.33, 659.25, 783.99,
    659.25, 587.33, 493.88, 587.33, 659.25, 783.99, 880.00
  ];
  let noteIndex = 0;

  musicInterval = setInterval(() => {
    try {
      const ctx = audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const freq = notes[noteIndex % notes.length];
      noteIndex++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) { }
  }, 480);
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

// ===== WINDOW RESIZE =====
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  const isPortrait = window.innerWidth < window.innerHeight;
  camera.fov = isPortrait ? Math.min(74, 58 / Math.max(camera.aspect, 0.65)) : 58;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// ===== MAIN ANIMATION LOOP =====
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  // Smooth camera transitions
  updateCameraAnimation(dt);

  // If focused on a planet, smoothly follow its world position
  if (focusedTarget && focusedTarget.object && !cameraAnim.active) {
    const targetPos = new THREE.Vector3();
    focusedTarget.object.getWorldPosition(targetPos);
    controls.target.lerp(targetPos, 0.08);
  }

  // Orbit controls update
  if (controls.enabled) controls.update();

  // Rotate starfield slowly
  if (starField) {
    starField.rotation.y += dt * 0.004;
  }

  // Sun pulsing glow
  if (sun) {
    const pulse = 1 + Math.sin(elapsed * 1.6) * 0.04;
    sun.scale.setScalar(pulse);
  }

  // Planet orbit speed multiplier: slows down during zoom inspection
  const orbitSpeedMult = currentView === 'planet-zoom' ? 0.3 : (currentView === 'surprise' ? 0.1 : 1.0);

  // Animate planets
  planets.forEach(p => {
    p.angle += p.data.speed * dt * 8 * orbitSpeedMult;
    p.group.position.x = Math.cos(p.angle) * p.data.distance;
    p.group.position.z = Math.sin(p.angle) * p.data.distance;
    p.mesh.rotation.y += p.data.rotSpeed;
    p.group.position.y = Math.sin(elapsed * 0.5 + p.data.distance) * 0.25;
  });

  // Animate Oktafiya planet
  if (oktafiyaPlanet) {
    oktafiyaPlanet.angle += OKTAFIYA_DATA.speed * dt * 8 * orbitSpeedMult;
    oktafiyaPlanet.group.position.x = Math.cos(oktafiyaPlanet.angle) * OKTAFIYA_DATA.distance;
    oktafiyaPlanet.group.position.z = Math.sin(oktafiyaPlanet.angle) * OKTAFIYA_DATA.distance;
    oktafiyaPlanet.mesh.rotation.y += OKTAFIYA_DATA.rotSpeed;

    const cr = oktafiyaPlanet.group.userData.cosmicStarRing;
    if (cr) cr.rotation.y += dt * 0.25;

    const sg = oktafiyaPlanet.group.userData.miniStarGroup;
    if (sg) sg.rotation.y -= dt * 0.2;

    oktafiyaPlanet.group.position.y = Math.sin(elapsed * 0.4) * 0.4;
  }

  // Animate birthday cake
  if (birthdayCake) {
    birthdayCake.rotation.y += dt * 0.15;
    birthdayCake.position.y = 1.5 + Math.sin(elapsed * 0.7) * 0.4;

    birthdayCake.children.forEach(child => {
      if (child.userData && child.userData.isFlame && child.visible) {
        child.position.y = child.userData.baseY + Math.sin(elapsed * 7 + child.position.x * 10) * 0.03;
        child.scale.setScalar(0.85 + Math.sin(elapsed * 5) * 0.15);
      }
    });
  }

  // Animate cute characters drifting
  characters.forEach(char => {
    char.userData.time += dt;
    const t = char.userData.time;
    const base = char.userData.basePos;
    char.position.x = base.x + Math.sin(t * 0.25) * 2.8;
    char.position.y = base.y + Math.sin(t * 0.4) * 1.2;
    char.position.z = base.z + Math.cos(t * 0.25) * 2.8;
    char.rotation.y += dt * 0.2;
  });

  // Random shooting stars
  if (Math.random() < 0.003 && shootingStars.length < 3) {
    createShootingStar();
  }
  updateShootingStars(dt);

  // Easter eggs animation
  if (secretStar) {
    const sp = 1 + Math.sin(elapsed * 2.2) * 0.15;
    secretStar.scale.setScalar(sp);
  }

  if (hiddenCrystal) {
    hiddenCrystal.position.y = 0.8 + Math.sin(elapsed * 0.8) * 0.4;
    hiddenCrystal.rotation.y += dt * 0.5;
    hiddenCrystal.rotation.x += dt * 0.3;
  }

  // Render scene through bloom composer
  composer.render();
}

// ===== START SCRIPT =====
init();
