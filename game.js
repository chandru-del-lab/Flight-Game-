import * as THREE from 'three';

/**
 * SKYBOUND – ULTIMATE 3D FLIGHT EXPERIENCE (v2.0)
 * Complete Desktop & Mobile 3D Flight Simulator & Fighter Jet Sandbox
 * Features:
 *  - 8 Playable Aircraft & Fighter Jets (SkyHawk X1, Citation ZX, Viper GT,
 *    F-22X Raptor, Su-57 Felon, F-14D Tomcat, A-10C Warthog, SkyLiner A380)
 *  - 14 Live AI Air Traffic & Fighter Squadron Flights in Open World
 *  - 3 Landable Airfields / Decks: Intl Airport RWY 36, USS Skybound Carrier, Valkyrie Airbase
 *  - Live HUD Radar Minimap + Full-Screen Interactive Tactical Map with Fast Travel
 *  - Mobile Analog Virtual Flight Stick + Touch Throttle Slider + D-Pad
 *  - Dynamic Time-of-Day (Daylight, Sunset, Night Ops) & Wingtip Smoke Contrails
 */

const STORAGE_KEY = 'skybound_flight_save_v1';

const AIRCRAFT_SPECS = {
  prop: {
    id: 'prop',
    name: 'SKYHAWK X1',
    role: 'Propeller Trainer',
    maxSpeedKmh: 320,
    cruiseSpeedKmh: 210,
    minStallKmh: 88,
    takeoffKmh: 102,
    accelRate: 72,
    brakeRate: 98,
    pitchRate: 1.38,
    rollRate: 2.3,
    yawRate: 0.88,
    liftFactor: 1.18,
    engineBaseFreq: 68,
    engineType: 'prop',
    smokeColor: 0x38bdf8,
    wingSpan: 5.8
  },
  jet: {
    id: 'jet',
    name: 'CITATION SOVEREIGN ZX',
    role: 'Modern Business Jet',
    maxSpeedKmh: 460,
    cruiseSpeedKmh: 310,
    minStallKmh: 115,
    takeoffKmh: 132,
    accelRate: 96,
    brakeRate: 118,
    pitchRate: 1.28,
    rollRate: 2.15,
    yawRate: 0.8,
    liftFactor: 1.06,
    engineBaseFreq: 135,
    engineType: 'jet',
    smokeColor: 0xe0f2fe,
    wingSpan: 6.3
  },
  sport: {
    id: 'sport',
    name: 'VIPER APEX GT',
    role: 'Fast Sporty Aircraft',
    maxSpeedKmh: 560,
    cruiseSpeedKmh: 380,
    minStallKmh: 124,
    takeoffKmh: 142,
    accelRate: 130,
    brakeRate: 145,
    pitchRate: 1.68,
    rollRate: 3.15,
    yawRate: 1.0,
    liftFactor: 1.1,
    engineBaseFreq: 165,
    engineType: 'sport',
    smokeColor: 0xf97316,
    wingSpan: 5.2
  },
  raptor: {
    id: 'raptor',
    name: 'F-22X RAPTOR STEALTH',
    role: '5th-Gen Stealth Fighter',
    maxSpeedKmh: 880,
    cruiseSpeedKmh: 540,
    minStallKmh: 135,
    takeoffKmh: 155,
    accelRate: 210,
    brakeRate: 185,
    pitchRate: 2.05,
    rollRate: 3.65,
    yawRate: 1.15,
    liftFactor: 1.14,
    engineBaseFreq: 185,
    engineType: 'fighter',
    smokeColor: 0x38bdf8,
    wingSpan: 5.8
  },
  felon: {
    id: 'felon',
    name: 'SU-57 FELON STRIKE',
    role: 'Supersonic Strike Fighter',
    maxSpeedKmh: 920,
    cruiseSpeedKmh: 560,
    minStallKmh: 132,
    takeoffKmh: 152,
    accelRate: 225,
    brakeRate: 190,
    pitchRate: 2.2,
    rollRate: 3.85,
    yawRate: 1.25,
    liftFactor: 1.15,
    engineBaseFreq: 192,
    engineType: 'fighter',
    smokeColor: 0xf43f5e,
    wingSpan: 6.0
  },
  tomcat: {
    id: 'tomcat',
    name: 'F-14D SUPER TOMCAT',
    role: 'Carrier Interceptor Jet',
    maxSpeedKmh: 840,
    cruiseSpeedKmh: 510,
    minStallKmh: 130,
    takeoffKmh: 148,
    accelRate: 195,
    brakeRate: 180,
    pitchRate: 1.85,
    rollRate: 3.35,
    yawRate: 1.05,
    liftFactor: 1.12,
    engineBaseFreq: 175,
    engineType: 'fighter',
    smokeColor: 0xfacc15,
    wingSpan: 6.4
  },
  warthog: {
    id: 'warthog',
    name: 'A-10C THUNDERBOLT II',
    role: 'Close Air Support Jet',
    maxSpeedKmh: 520,
    cruiseSpeedKmh: 340,
    minStallKmh: 102,
    takeoffKmh: 118,
    accelRate: 118,
    brakeRate: 155,
    pitchRate: 1.55,
    rollRate: 2.6,
    yawRate: 0.95,
    liftFactor: 1.24,
    engineBaseFreq: 122,
    engineType: 'jet',
    smokeColor: 0x10b981,
    wingSpan: 6.6
  },
  airliner: {
    id: 'airliner',
    name: 'SKYLINER A380 TITAN',
    role: 'Heavy Widebody Airliner',
    maxSpeedKmh: 620,
    cruiseSpeedKmh: 420,
    minStallKmh: 138,
    takeoffKmh: 158,
    accelRate: 105,
    brakeRate: 135,
    pitchRate: 1.05,
    rollRate: 1.55,
    yawRate: 0.68,
    liftFactor: 1.1,
    engineBaseFreq: 110,
    engineType: 'jet',
    smokeColor: 0xffffff,
    wingSpan: 8.6
  }
};

/* ============================================================================
   1. STORAGE MANAGER (LocalStorage Persistence)
   ============================================================================ */
class StorageManager {
  constructor() {
    this.defaultData = {
      totalScore: 0,
      distanceMeters: 0,
      bestCheckpointTime: null,
      landings: 0,
      challengesCompleted: 0,
      selectedAircraft: 'raptor',
      volume: 75,
      muted: false,
      invertPitch: false,
      touchMode: 'auto',
      skyMode: 'DAY'
    };
    this.data = this.load();
  }

  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...this.defaultData };
      const parsed = JSON.parse(raw);
      return { ...this.defaultData, ...parsed };
    } catch (err) {
      return { ...this.defaultData };
    }
  }

  save() {
    try {
      window.localStorage.getItem(STORAGE_KEY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      // Ignore sandbox storage errors gracefully
    }
  }

  resetProgress() {
    const keepSettings = {
      volume: this.data.volume,
      muted: this.data.muted,
      invertPitch: this.data.invertPitch,
      touchMode: this.data.touchMode,
      skyMode: this.data.skyMode
    };
    this.data = { ...this.defaultData, ...keepSettings };
    this.save();
  }
}

/* ============================================================================
   2. WEB AUDIO API SYNTHESIZER (Procedural Sound Effects)
   ============================================================================ */
class AudioManager {
  constructor(storage) {
    this.storage = storage;
    this.ctx = null;
    this.masterGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.windGain = null;
    this.windFilter = null;
    this.initialized = false;
    this.lastStallBeep = 0;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.updateMasterVolume();

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.001;

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 320;

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.value = 65;

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.value = 130;

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();

      // Procedural wind rush & jet roar noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.value = 400;
      this.windFilter.Q.value = 1.3;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.001;

      whiteNoise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      whiteNoise.start();

      this.initialized = true;
    } catch (e) {
      this.initialized = false;
    }
  }

  updateMasterVolume() {
    if (!this.masterGain || !this.ctx) return;
    const vol = this.storage.data.muted ? 0 : (this.storage.data.volume / 100) * 0.45;
    this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  updateFlightAudio(active, throttlePct, speedKmh, spec, isStalling, afterburner) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (!active || this.storage.data.muted) {
      this.engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this.windGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }

    const normThr = Math.max(0, Math.min(1.25, throttlePct / 100));
    const normSpd = Math.max(0, Math.min(1.3, speedKmh / spec.maxSpeedKmh));
    const baseFreq = spec.engineBaseFreq || 80;
    const boostMult = afterburner ? 1.28 : 1.0;

    const f1 = baseFreq * (0.65 + normThr * 1.45 + normSpd * 0.35) * boostMult;
    const f2 = f1 * (spec.engineType === 'prop' ? 1.5 : 2.02);

    this.engineOsc1.frequency.setTargetAtTime(f1, now, 0.06);
    this.engineOsc2.frequency.setTargetAtTime(f2, now, 0.06);
    this.engineFilter.frequency.setTargetAtTime((260 + normThr * 1050) * boostMult, now, 0.08);
    this.engineGain.gain.setTargetAtTime(0.06 + normThr * 0.16, now, 0.08);

    this.windFilter.frequency.setTargetAtTime(280 + normSpd * 1250, now, 0.1);
    this.windGain.gain.setTargetAtTime(Math.min(0.26, normSpd * 0.2 + (afterburner ? 0.06 : 0)), now, 0.1);

    if (isStalling && performance.now() - this.lastStallBeep > 420) {
      this.lastStallBeep = performance.now();
      this.playTone(880, 0.12, 'square', 0.12);
    }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.18, delay = 0) {
    if (!this.initialized || !this.ctx || this.storage.data.muted) return;
    try {
      const start = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(gainVal, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch (e) {
      // Ignore audio scheduling errors
    }
  }

  playClick() {
    this.init();
    this.playTone(620, 0.06, 'sine', 0.14);
    this.playTone(940, 0.05, 'triangle', 0.1, 0.03);
  }

  playCheckpoint() {
    this.playTone(587.33, 0.12, 'triangle', 0.22, 0);
    this.playTone(880.0, 0.16, 'triangle', 0.24, 0.08);
    this.playTone(1174.66, 0.28, 'sine', 0.26, 0.16);
  }

  playLanding(success = true) {
    if (success) {
      this.playTone(440, 0.15, 'sine', 0.2, 0);
      this.playTone(554.37, 0.18, 'sine', 0.2, 0.12);
      this.playTone(659.25, 0.32, 'triangle', 0.25, 0.24);
    } else {
      this.playTone(110, 0.35, 'sawtooth', 0.3, 0);
      this.playTone(75, 0.45, 'sawtooth', 0.28, 0.12);
    }
  }

  playMissionComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, 'triangle', 0.22, idx * 0.11);
    });
  }
}

/* ============================================================================
   3. PROCEDURAL 3D AIRCRAFT & FIGHTER JET BUILDER (8 Detailed Models)
   ============================================================================ */
class AircraftBuilder {
  static createStripeTexture(primaryHex, stripeHex, accentHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = primaryHex;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = stripeHex;
    ctx.fillRect(0, 92, 256, 38);

    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 130, 256, 18);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  static createCamoTexture(c1, c2, c3) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = c2;
    for (let i = 0; i < 14; i++) {
      ctx.fillRect((i * 53) % 220, (i * 79) % 220, 68, 42);
    }
    ctx.fillStyle = c3;
    for (let i = 0; i < 10; i++) {
      ctx.fillRect((i * 89) % 210, (i * 47) % 210, 48, 30);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  static build(type = 'prop') {
    const root = new THREE.Group();
    const parts = {
      propeller: null,
      afterburners: [],
      leftAileron: null,
      rightAileron: null,
      elevators: [],
      rudders: []
    };

    switch (type) {
      case 'jet':
        this.buildBusinessJet(root, parts);
        break;
      case 'sport':
        this.buildSportJet(root, parts);
        break;
      case 'raptor':
        this.buildRaptorFighter(root, parts);
        break;
      case 'felon':
        this.buildFelonFighter(root, parts);
        break;
      case 'tomcat':
        this.buildTomcatFighter(root, parts);
        break;
      case 'warthog':
        this.buildWarthogJet(root, parts);
        break;
      case 'airliner':
        this.buildWidebodyAirliner(root, parts);
        break;
      default:
        this.buildPropAircraft(root, parts);
        break;
    }

    this.addNavigationLights(root, type);

    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    root.userData.parts = parts;
    return root;
  }

  static createAfterburnerCone(colorHex = 0xff7b00, radius = 0.36, length = 2.4) {
    const group = new THREE.Group();
    const outerMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85
    });
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.95
    });

    const outerGeo = new THREE.ConeGeometry(radius, length, 14);
    outerGeo.rotateX(Math.PI / 2);
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.position.z = length * 0.45;

    const innerGeo = new THREE.ConeGeometry(radius * 0.55, length * 0.65, 12);
    innerGeo.rotateX(Math.PI / 2);
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.z = length * 0.3;

    group.add(outer, inner);
    return group;
  }

  static buildPropAircraft(root, parts) {
    const fuselageTex = this.createStripeTexture('#ffffff', '#1e6fff', '#ff6b1a');
    const matWhite = new THREE.MeshStandardMaterial({ map: fuselageTex, roughness: 0.3, metalness: 0.15 });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x1e6fff, roughness: 0.32, metalness: 0.2 });
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.3, metalness: 0.2 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.85 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.68
    });

    const mainBodyGeo = new THREE.CylinderGeometry(0.68, 0.78, 3.6, 16);
    mainBodyGeo.rotateX(Math.PI / 2);
    const mainBody = new THREE.Mesh(mainBodyGeo, matWhite);
    mainBody.position.set(0, 0, -0.2);
    root.add(mainBody);

    const rearBodyGeo = new THREE.CylinderGeometry(0.78, 0.25, 3.8, 16);
    rearBodyGeo.rotateX(Math.PI / 2);
    const rearBody = new THREE.Mesh(rearBodyGeo, matWhite);
    rearBody.position.set(0, 0.06, 3.5);
    root.add(rearBody);

    const cowlGeo = new THREE.CylinderGeometry(0.45, 0.68, 1.3, 16);
    cowlGeo.rotateX(Math.PI / 2);
    const cowl = new THREE.Mesh(cowlGeo, matBlue);
    cowl.position.set(0, -0.02, -2.65);
    root.add(cowl);

    const canopyGeo = new THREE.SphereGeometry(0.66, 16, 12);
    canopyGeo.scale(0.88, 0.72, 2.35);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.52, -0.25);
    root.add(canopy);

    const wingGeo = new THREE.BoxGeometry(11.4, 0.14, 1.55);
    const mainWing = new THREE.Mesh(wingGeo, matWhite);
    mainWing.position.set(0, 0.12, -0.35);
    root.add(mainWing);

    const stripeGeo = new THREE.BoxGeometry(11.45, 0.15, 0.38);
    const wingStripe = new THREE.Mesh(stripeGeo, matBlue);
    wingStripe.position.set(0, 0.125, -0.92);
    root.add(wingStripe);

    const tipGeo = new THREE.BoxGeometry(0.55, 0.22, 1.58);
    const leftTip = new THREE.Mesh(tipGeo, matOrange);
    leftTip.position.set(-5.85, 0.18, -0.35);
    leftTip.rotation.z = 0.25;
    const rightTip = new THREE.Mesh(tipGeo, matOrange);
    rightTip.position.set(5.85, 0.18, -0.35);
    rightTip.rotation.z = -0.25;
    root.add(leftTip, rightTip);

    const aileronGeo = new THREE.BoxGeometry(2.4, 0.08, 0.34);
    const leftAileron = new THREE.Mesh(aileronGeo, matOrange);
    leftAileron.position.set(-3.9, 0.11, 0.56);
    const rightAileron = new THREE.Mesh(aileronGeo, matOrange);
    rightAileron.position.set(3.9, 0.11, 0.56);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    const vTailGeo = new THREE.BoxGeometry(0.16, 1.75, 1.35);
    const vTail = new THREE.Mesh(vTailGeo, matBlue);
    vTail.position.set(0, 0.98, 4.75);
    vTail.rotation.x = -0.22;
    root.add(vTail);

    const rudderGeo = new THREE.BoxGeometry(0.12, 1.65, 0.42);
    const rudder = new THREE.Mesh(rudderGeo, matOrange);
    rudder.position.set(0, 0.96, 5.48);
    root.add(rudder);
    parts.rudders.push(rudder);

    const hStabGeo = new THREE.BoxGeometry(3.7, 0.11, 0.95);
    const hStab = new THREE.Mesh(hStabGeo, matWhite);
    hStab.position.set(0, 0.26, 4.85);
    root.add(hStab);

    const elevGeo = new THREE.BoxGeometry(3.5, 0.08, 0.32);
    const elevator = new THREE.Mesh(elevGeo, matOrange);
    elevator.position.set(0, 0.26, 5.45);
    root.add(elevator);
    parts.elevators.push(elevator);

    const propGroup = new THREE.Group();
    propGroup.position.set(0, -0.02, -3.35);

    const spinnerGeo = new THREE.ConeGeometry(0.42, 0.85, 16);
    spinnerGeo.rotateX(-Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, matOrange);
    spinner.position.set(0, 0, -0.25);
    propGroup.add(spinner);

    const bladeGeo = new THREE.BoxGeometry(2.3, 0.18, 0.04);
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, matDark);
      blade.rotation.z = (i * Math.PI * 2) / 3;
      propGroup.add(blade);
    }
    root.add(propGroup);
    parts.propeller = propGroup;

    this.addLandingGear(root, matChrome, matDark, matBlue);
  }

  static buildBusinessJet(root, parts) {
    const fuselageTex = this.createStripeTexture('#f8fafc', '#0f172a', '#0ea5e9');
    const matWhite = new THREE.MeshStandardMaterial({ map: fuselageTex, roughness: 0.22, metalness: 0.25 });
    const matNavy = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.4 });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.28, metalness: 0.35 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.85 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.3 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.8,
      transparent: true,
      opacity: 0.72
    });

    const cabinGeo = new THREE.CylinderGeometry(0.76, 0.76, 6.2, 18);
    cabinGeo.rotateX(Math.PI / 2);
    const cabin = new THREE.Mesh(cabinGeo, matWhite);
    cabin.position.set(0, 0, 0.3);
    root.add(cabin);

    const noseGeo = new THREE.ConeGeometry(0.76, 2.5, 18);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matWhite);
    nose.position.set(0, 0, -4.05);
    root.add(nose);

    const tailConeGeo = new THREE.CylinderGeometry(0.76, 0.22, 3.2, 18);
    tailConeGeo.rotateX(Math.PI / 2);
    const tailCone = new THREE.Mesh(tailConeGeo, matWhite);
    tailCone.position.set(0, 0.1, 5.0);
    root.add(tailCone);

    const visorGeo = new THREE.SphereGeometry(0.72, 16, 12);
    visorGeo.scale(0.92, 0.62, 1.9);
    const visor = new THREE.Mesh(visorGeo, matGlass);
    visor.position.set(0, 0.36, -2.1);
    root.add(visor);

    const wingShape = new THREE.BoxGeometry(12.6, 0.14, 1.7);
    const wing = new THREE.Mesh(wingShape, matWhite);
    wing.position.set(0, -0.32, 0.35);
    root.add(wing);

    const wingletGeo = new THREE.BoxGeometry(0.16, 1.15, 0.9);
    const leftWinglet = new THREE.Mesh(wingletGeo, matCyan);
    leftWinglet.position.set(-6.3, 0.2, 0.35);
    leftWinglet.rotation.z = -0.18;
    const rightWinglet = new THREE.Mesh(wingletGeo, matCyan);
    rightWinglet.position.set(6.3, 0.2, 0.35);
    rightWinglet.rotation.z = 0.18;
    root.add(leftWinglet, rightWinglet);

    const aileronGeo = new THREE.BoxGeometry(2.6, 0.08, 0.35);
    const leftAileron = new THREE.Mesh(aileronGeo, matCyan);
    leftAileron.position.set(-4.3, -0.32, 1.32);
    const rightAileron = new THREE.Mesh(aileronGeo, matCyan);
    rightAileron.position.set(4.3, -0.32, 1.32);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    const nacelleGeo = new THREE.CylinderGeometry(0.44, 0.38, 2.2, 16);
    nacelleGeo.rotateX(Math.PI / 2);

    [-1.15, 1.15].forEach((xOffset) => {
      const nacelle = new THREE.Mesh(nacelleGeo, matNavy);
      nacelle.position.set(xOffset, 0.35, 3.65);
      root.add(nacelle);

      const ab = this.createAfterburnerCone(0x38bdf8, 0.28, 1.4);
      ab.position.set(xOffset, 0.35, 4.75);
      root.add(ab);
      parts.afterburners.push(ab);
    });

    const vFinGeo = new THREE.BoxGeometry(0.18, 2.2, 1.6);
    const vFin = new THREE.Mesh(vFinGeo, matNavy);
    vFin.position.set(0, 1.25, 5.55);
    vFin.rotation.x = -0.28;
    root.add(vFin);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.0, 0.42), matCyan);
    rudder.position.set(0, 1.25, 6.42);
    root.add(rudder);
    parts.rudders.push(rudder);

    const tStab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 1.0), matWhite);
    tStab.position.set(0, 2.32, 5.95);
    root.add(tStab);

    const elevator = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 0.32), matCyan);
    elevator.position.set(0, 2.32, 6.55);
    root.add(elevator);
    parts.elevators.push(elevator);

    this.addLandingGear(root, matChrome, matDark, matNavy);
  }

  static buildSportJet(root, parts) {
    const fuselageTex = this.createStripeTexture('#1e293b', '#dc2626', '#f97316');
    const matBody = new THREE.MeshStandardMaterial({ map: fuselageTex, roughness: 0.25, metalness: 0.45 });
    const matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, metalness: 0.35 });
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.25, metalness: 0.3 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.85 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.68
    });

    const coreGeo = new THREE.CylinderGeometry(0.58, 0.72, 5.6, 16);
    coreGeo.rotateX(Math.PI / 2);
    const core = new THREE.Mesh(coreGeo, matBody);
    core.position.set(0, 0, 0.2);
    root.add(core);

    const noseGeo = new THREE.ConeGeometry(0.58, 2.9, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matRed);
    nose.position.set(0, -0.02, -4.05);
    root.add(nose);

    const canopyGeo = new THREE.SphereGeometry(0.58, 16, 12);
    canopyGeo.scale(0.86, 0.72, 2.5);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.46, -1.05);
    root.add(canopy);

    const wingGeo = new THREE.BoxGeometry(10.4, 0.12, 2.35);
    const wing = new THREE.Mesh(wingGeo, matBody);
    wing.position.set(0, -0.05, 0.75);
    root.add(wing);

    const podGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 10);
    podGeo.rotateX(Math.PI / 2);
    const leftPod = new THREE.Mesh(podGeo, matOrange);
    leftPod.position.set(-5.25, -0.05, 0.65);
    const rightPod = new THREE.Mesh(podGeo, matOrange);
    rightPod.position.set(5.25, -0.05, 0.65);
    root.add(leftPod, rightPod);

    const aileronGeo = new THREE.BoxGeometry(2.5, 0.08, 0.38);
    const leftAileron = new THREE.Mesh(aileronGeo, matOrange);
    leftAileron.position.set(-3.5, -0.05, 2.05);
    const rightAileron = new THREE.Mesh(aileronGeo, matOrange);
    rightAileron.position.set(3.5, -0.05, 2.05);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    const finGeo = new THREE.BoxGeometry(0.14, 1.65, 1.45);
    [-0.65, 0.65].forEach((xPos, idx) => {
      const fin = new THREE.Mesh(finGeo, matRed);
      fin.position.set(xPos, 0.82, 2.75);
      fin.rotation.z = idx === 0 ? 0.24 : -0.24;
      fin.rotation.x = -0.2;
      root.add(fin);

      const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.45, 0.35), matOrange);
      rudder.position.set(xPos * 1.15, 0.8, 3.55);
      rudder.rotation.z = idx === 0 ? 0.24 : -0.24;
      root.add(rudder);
      parts.rudders.push(rudder);
    });

    const elevGeo = new THREE.BoxGeometry(3.8, 0.1, 0.85);
    const elevator = new THREE.Mesh(elevGeo, matRed);
    elevator.position.set(0, -0.04, 3.25);
    root.add(elevator);
    parts.elevators.push(elevator);

    const nozzleGeo = new THREE.CylinderGeometry(0.58, 0.46, 0.95, 16);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, matDark);
    nozzle.position.set(0, 0, 3.45);
    root.add(nozzle);

    const flame = this.createAfterburnerCone(0xff7b00, 0.42, 2.5);
    flame.position.set(0, 0, 3.95);
    root.add(flame);
    parts.afterburners.push(flame);

    this.addLandingGear(root, matChrome, matDark, matRed);
  }

  static buildRaptorFighter(root, parts) {
    // F-22X Raptor Stealth Fighter: Tactical Slate Camo, Diamond Delta Wings, Twin Canted Tails, Dual Vectoring Nozzles
    const camoTex = this.createCamoTexture('#334155', '#475569', '#1e293b');
    const matStealth = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.35, metalness: 0.55 });
    const matEdge = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.6 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });
    const matGoldCanopy = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.08,
      metalness: 0.88,
      transparent: true,
      opacity: 0.68
    });

    // Stealth Blended Fuselage with Chine Edges
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.68, 6.4), matStealth);
    body.position.set(0, 0, 0.2);
    root.add(body);

    // Chined Stealth Radome Nose
    const noseGeo = new THREE.ConeGeometry(1.15, 3.4, 4);
    noseGeo.rotateY(Math.PI / 4);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.0, 0.52, 1.0);
    const nose = new THREE.Mesh(noseGeo, matStealth);
    nose.position.set(0, 0, -4.6);
    root.add(nose);

    // Gold-Tinted Stealth Bubble Canopy
    const canopyGeo = new THREE.SphereGeometry(0.66, 16, 12);
    canopyGeo.scale(0.88, 0.68, 2.55);
    const canopy = new THREE.Mesh(canopyGeo, matGoldCanopy);
    canopy.position.set(0, 0.48, -1.35);
    root.add(canopy);

    // Wide Diamond Delta Wings
    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.12, 3.2), matStealth);
    mainWing.position.set(0, 0.05, 0.85);
    root.add(mainWing);

    const aileronGeo = new THREE.BoxGeometry(2.8, 0.08, 0.42);
    const leftAileron = new THREE.Mesh(aileronGeo, matEdge);
    leftAileron.position.set(-3.8, 0.05, 2.62);
    const rightAileron = new THREE.Mesh(aileronGeo, matEdge);
    rightAileron.position.set(3.8, 0.05, 2.62);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // Twin Outward-Canted Vertical Tails
    const tailGeo = new THREE.BoxGeometry(0.16, 1.95, 1.85);
    [-0.95, 0.95].forEach((xPos, idx) => {
      const fin = new THREE.Mesh(tailGeo, matStealth);
      fin.position.set(xPos, 0.96, 2.85);
      fin.rotation.z = idx === 0 ? 0.34 : -0.34;
      fin.rotation.x = -0.22;
      root.add(fin);

      const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.7, 0.42), matEdge);
      rudder.position.set(xPos * 1.18, 0.92, 3.85);
      rudder.rotation.z = idx === 0 ? 0.34 : -0.34;
      root.add(rudder);
      parts.rudders.push(rudder);
    });

    // Horizontal Stabilators
    const stab = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 1.35), matEdge);
    stab.position.set(0, 0.02, 3.65);
    root.add(stab);
    parts.elevators.push(stab);

    // Dual Rectangular Thrust-Vectoring Nozzles + Twin Afterburners
    [-0.58, 0.58].forEach((xPos) => {
      const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.9), matDark);
      nozzle.position.set(xPos, 0, 3.7);
      root.add(nozzle);

      const flame = this.createAfterburnerCone(0x38bdf8, 0.34, 2.8);
      flame.position.set(xPos, 0, 4.15);
      root.add(flame);
      parts.afterburners.push(flame);
    });

    this.addLandingGear(root, matEdge, matDark, matStealth);
  }

  static buildFelonFighter(root, parts) {
    // Su-57 Felon Strike Fighter: Digital Blue/White/Gray Splinter Camo, Twin Circular Plasma Afterburners
    const camoTex = this.createCamoTexture('#1e3a8a', '#bae6fd', '#334155');
    const matCamo = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.3, metalness: 0.45 });
    const matCyan = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.25, metalness: 0.45 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.7
    });

    const core = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.58, 6.6), matCamo);
    core.position.set(0, 0, 0.3);
    root.add(core);

    const noseGeo = new THREE.ConeGeometry(0.78, 3.5, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matCamo);
    nose.position.set(0, -0.02, -4.65);
    root.add(nose);

    const canopyGeo = new THREE.SphereGeometry(0.62, 16, 12);
    canopyGeo.scale(0.85, 0.68, 2.4);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.44, -1.4);
    root.add(canopy);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.12, 3.4), matCamo);
    wing.position.set(0, 0.02, 0.95);
    root.add(wing);

    // Wingtip Air-to-Air Missiles
    const missileGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
    missileGeo.rotateX(Math.PI / 2);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
    [-6.05, 6.05].forEach((xPos) => {
      const m = new THREE.Mesh(missileGeo, whiteMat);
      m.position.set(xPos, -0.05, 0.9);
      root.add(m);
    });

    const aileronGeo = new THREE.BoxGeometry(2.9, 0.08, 0.4);
    const leftAileron = new THREE.Mesh(aileronGeo, matCyan);
    leftAileron.position.set(-4.0, 0.02, 2.8);
    const rightAileron = new THREE.Mesh(aileronGeo, matCyan);
    rightAileron.position.set(4.0, 0.02, 2.8);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    [-1.05, 1.05].forEach((xPos, idx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.75, 1.65), matCamo);
      fin.position.set(xPos, 0.84, 2.95);
      fin.rotation.z = idx === 0 ? 0.3 : -0.3;
      root.add(fin);
      parts.rudders.push(fin);
    });

    const elev = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 1.2), matCamo);
    elev.position.set(0, 0, 3.75);
    root.add(elev);
    parts.elevators.push(elev);

    [-0.65, 0.65].forEach((xPos) => {
      const nozGeo = new THREE.CylinderGeometry(0.42, 0.36, 1.1, 14);
      nozGeo.rotateX(Math.PI / 2);
      const noz = new THREE.Mesh(nozGeo, matDark);
      noz.position.set(xPos, 0, 3.85);
      root.add(noz);

      const flame = this.createAfterburnerCone(0xff5500, 0.36, 2.9);
      flame.position.set(xPos, 0, 4.35);
      root.add(flame);
      parts.afterburners.push(flame);
    });

    this.addLandingGear(root, matCyan, matDark, matCamo);
  }

  static buildTomcatFighter(root, parts) {
    // F-14D Super Tomcat: Naval Gull Gray, Twin Engine Nacelles, Swept Wings, Jolly Rogers Black/Gold Tails
    const matGray = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.35 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.4 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.5 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.68
    });

    // Twin Engine Nacelles + Center Pancake Fuselage
    const centerDeck = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.52, 6.2), matGray);
    centerDeck.position.set(0, 0.08, 0.3);
    root.add(centerDeck);

    [-0.82, 0.82].forEach((xPos) => {
      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.68, 5.8), matGray);
      nacelle.position.set(xPos, -0.12, 0.6);
      root.add(nacelle);

      const flame = this.createAfterburnerCone(0xf97316, 0.35, 2.6);
      flame.position.set(xPos, -0.12, 3.6);
      root.add(flame);
      parts.afterburners.push(flame);
    });

    const noseGeo = new THREE.ConeGeometry(0.68, 3.4, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matDark);
    nose.position.set(0, 0.02, -4.4);
    root.add(nose);

    const canopyGeo = new THREE.SphereGeometry(0.62, 16, 12);
    canopyGeo.scale(0.84, 0.72, 2.75);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.48, -1.25);
    root.add(canopy);

    // Variable-Sweep Style Main Wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.14, 1.95), matGray);
    wing.position.set(0, 0.22, 0.4);
    root.add(wing);

    const aileronGeo = new THREE.BoxGeometry(2.8, 0.08, 0.36);
    const leftAileron = new THREE.Mesh(aileronGeo, matGold);
    leftAileron.position.set(-4.4, 0.22, 1.5);
    const rightAileron = new THREE.Mesh(aileronGeo, matGold);
    rightAileron.position.set(4.4, 0.22, 1.5);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // Twin Squadron Tails (Black with Gold tips)
    [-0.95, 0.95].forEach((xPos, idx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.05, 1.65), matDark);
      fin.position.set(xPos, 1.05, 2.85);
      fin.rotation.z = idx === 0 ? 0.12 : -0.12;
      root.add(fin);

      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 1.65), matGold);
      tip.position.set(xPos * 1.08, 2.05, 2.85);
      root.add(tip);

      const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.38), matGold);
      rudder.position.set(xPos * 1.05, 1.0, 3.78);
      root.add(rudder);
      parts.rudders.push(rudder);
    });

    const stab = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.1, 1.25), matGray);
    stab.position.set(0, -0.05, 3.25);
    root.add(stab);
    parts.elevators.push(stab);

    this.addLandingGear(root, matGray, matDark, matGold);
  }

  static buildWarthogJet(root, parts) {
    // A-10C Thunderbolt II Warthog: High Twin Turbofans, Straight Wing with Ordnance, H-Tail, Rotary Cannon
    const matOlive = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.65, metalness: 0.25 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, metalness: 0.3 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.68
    });

    const fuselageGeo = new THREE.CylinderGeometry(0.68, 0.62, 6.8, 16);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, matOlive);
    fuselage.position.set(0, 0, 0.4);
    root.add(fuselage);

    const noseGeo = new THREE.ConeGeometry(0.68, 2.1, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matOlive);
    nose.position.set(0, 0, -4.0);
    root.add(nose);

    // GAU-8 30mm Nose Rotary Cannon Barrel
    const gunGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 10);
    gunGeo.rotateX(Math.PI / 2);
    const gun = new THREE.Mesh(gunGeo, matDark);
    gun.position.set(0, -0.22, -5.15);
    root.add(gun);

    const canopyGeo = new THREE.SphereGeometry(0.6, 14, 12);
    canopyGeo.scale(0.84, 0.75, 2.1);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.52, -1.65);
    root.add(canopy);

    // Wide Straight Attack Wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.18, 1.85), matOlive);
    wing.position.set(0, -0.22, 0.1);
    root.add(wing);

    const aileronGeo = new THREE.BoxGeometry(2.8, 0.1, 0.38);
    const leftAileron = new THREE.Mesh(aileronGeo, matAccent);
    leftAileron.position.set(-4.6, -0.22, 1.15);
    const rightAileron = new THREE.Mesh(aileronGeo, matAccent);
    rightAileron.position.set(4.6, -0.22, 1.15);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // High Twin Turbofan Nacelles Behind Wings
    const nacGeo = new THREE.CylinderGeometry(0.62, 0.54, 2.4, 16);
    nacGeo.rotateX(Math.PI / 2);
    [-1.25, 1.25].forEach((xPos) => {
      const nac = new THREE.Mesh(nacGeo, matOlive);
      nac.position.set(xPos, 0.68, 2.25);
      root.add(nac);

      const ab = this.createAfterburnerCone(0x38bdf8, 0.32, 1.3);
      ab.position.set(xPos, 0.68, 3.45);
      root.add(ab);
      parts.afterburners.push(ab);
    });

    // H-Tail Horizontal Stabilizer & Twin Vertical Rudders
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 1.15), matOlive);
    hTail.position.set(0, 0.25, 4.15);
    root.add(hTail);
    parts.elevators.push(hTail);

    [-2.25, 2.25].forEach((xPos) => {
      const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.95, 1.35), matOlive);
      vFin.position.set(xPos, 0.75, 4.15);
      root.add(vFin);

      const rud = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.36), matAccent);
      rud.position.set(xPos, 0.75, 4.95);
      root.add(rud);
      parts.rudders.push(rud);
    });

    this.addLandingGear(root, matDark, matDark, matAccent);
  }

  static buildWidebodyAirliner(root, parts) {
    // SkyLiner A380 Titan: Double-Deck Widebody Fuselage + 4 Under-Wing Turbofans
    const fuselageTex = this.createStripeTexture('#ffffff', '#0284c7', '#f59e0b');
    const matWhite = new THREE.MeshStandardMaterial({ map: fuselageTex, roughness: 0.2, metalness: 0.2 });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.3 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.4 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75
    });

    const cabinGeo = new THREE.CylinderGeometry(1.12, 1.12, 8.2, 20);
    cabinGeo.rotateX(Math.PI / 2);
    cabinGeo.scale(0.92, 1.12, 1.0);
    const cabin = new THREE.Mesh(cabinGeo, matWhite);
    cabin.position.set(0, 0.15, 0.4);
    root.add(cabin);

    const noseGeo = new THREE.SphereGeometry(1.12, 18, 14);
    noseGeo.scale(0.92, 1.1, 1.9);
    const nose = new THREE.Mesh(noseGeo, matWhite);
    nose.position.set(0, 0.12, -3.7);
    root.add(nose);

    const tailGeo = new THREE.CylinderGeometry(1.12, 0.26, 3.6, 18);
    tailGeo.rotateX(Math.PI / 2);
    tailGeo.scale(0.92, 1.1, 1.0);
    const tail = new THREE.Mesh(tailGeo, matWhite);
    tail.position.set(0, 0.22, 6.2);
    root.add(tail);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.38, 0.9), matGlass);
    visor.position.set(0, 0.52, -4.45);
    root.add(visor);

    // Wide Swept Commercial Wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.18, 2.2), matWhite);
    wing.position.set(0, -0.35, 0.45);
    root.add(wing);

    // 4 Under-Wing Turbofan Engines
    const engGeo = new THREE.CylinderGeometry(0.46, 0.4, 1.85, 14);
    engGeo.rotateX(Math.PI / 2);
    [-6.2, -3.2, 3.2, 6.2].forEach((xPos) => {
      const eng = new THREE.Mesh(engGeo, matBlue);
      eng.position.set(xPos, -0.82, 0.15);
      root.add(eng);

      const ab = this.createAfterburnerCone(0x38bdf8, 0.28, 1.1);
      ab.position.set(xPos, -0.82, 1.15);
      root.add(ab);
      parts.afterburners.push(ab);
    });

    const aileronGeo = new THREE.BoxGeometry(3.4, 0.08, 0.4);
    const leftAileron = new THREE.Mesh(aileronGeo, matGold);
    leftAileron.position.set(-5.8, -0.35, 1.65);
    const rightAileron = new THREE.Mesh(aileronGeo, matGold);
    rightAileron.position.set(5.8, -0.35, 1.65);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // Giant Airline Vertical Tail Fin
    const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.1, 2.2), matBlue);
    vFin.position.set(0, 1.85, 6.65);
    vFin.rotation.x = -0.28;
    root.add(vFin);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.9, 0.48), matGold);
    rudder.position.set(0, 1.85, 7.85);
    root.add(rudder);
    parts.rudders.push(rudder);

    const hStab = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.14, 1.35), matWhite);
    hStab.position.set(0, 0.35, 6.95);
    root.add(hStab);
    parts.elevators.push(hStab);

    this.addLandingGear(root, matWhite, matDark, matBlue);
  }

  static addLandingGear(root, matStrut, matTire, matAccent) {
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14);
    wheelGeo.rotateZ(Math.PI / 2);

    const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8), matStrut);
    noseStrut.position.set(0, -0.68, -2.05);
    const noseWheel = new THREE.Mesh(wheelGeo, matTire);
    noseWheel.scale.set(0.8, 0.8, 0.8);
    noseWheel.position.set(0, -1.08, -2.05);
    root.add(noseStrut, noseWheel);

    [-1.35, 1.35].forEach((xPos) => {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8), matStrut);
      strut.position.set(xPos, -0.66, 0.35);
      strut.rotation.z = xPos < 0 ? 0.18 : -0.18;

      const wheel = new THREE.Mesh(wheelGeo, matTire);
      wheel.position.set(xPos * 1.06, -1.08, 0.35);

      const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.72), matAccent);
      fairing.position.set(xPos * 1.06, -0.98, 0.35);

      root.add(strut, wheel, fairing);
    });
  }

  static addNavigationLights(root, type) {
    const spec = AIRCRAFT_SPECS[type] || AIRCRAFT_SPECS.prop;
    const span = spec.wingSpan || 5.95;

    const redLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    redLight.position.set(-span, 0.18, 0.2);

    const greenLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    greenLight.position.set(span, 0.18, 0.2);

    const whiteLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    whiteLight.position.set(0, 1.4, 5.2);

    root.add(redLight, greenLight, whiteLight);
  }

  static updateControlSurfaces(aircraftMesh, physics, dt) {
    if (!aircraftMesh || !aircraftMesh.userData.parts) return;
    const parts = aircraftMesh.userData.parts;

    if (parts.propeller) {
      const spinSpeed = 14 + (physics.throttle / 100) * 52;
      parts.propeller.rotation.z += spinSpeed * dt;
    }

    if (parts.afterburners && parts.afterburners.length > 0) {
      const normThr = physics.throttle / 100;
      const boostScale = physics.afterburner ? 1.45 : 1.0;
      const pulse = 0.86 + Math.sin(performance.now() * 0.045) * 0.14;
      parts.afterburners.forEach((flame) => {
        flame.scale.set(
          (0.6 + normThr * 0.55) * boostScale,
          (0.6 + normThr * 0.55) * boostScale,
          (0.32 + normThr * 1.45) * pulse * boostScale
        );
        flame.visible = physics.throttle > 8 || physics.afterburner;
      });
    }

    if (parts.leftAileron && parts.rightAileron) {
      const rollDeflect = physics.inputRoll * 0.42;
      parts.leftAileron.rotation.x = rollDeflect;
      parts.rightAileron.rotation.x = -rollDeflect;
    }

    parts.elevators.forEach((el) => {
      el.rotation.x = -physics.inputPitch * 0.38;
    });

    parts.rudders.forEach((rud) => {
      rud.rotation.y = -physics.inputYaw * 0.42;
    });
  }
}

/* ============================================================================
   4. WINGTIP CONTRAILS & AEROBATIC SMOKE TRAIL SYSTEM
   ============================================================================ */
class ContrailManager {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.maxPuffs = 90;
    this.puffs = [];
    this.spawnTimer = 0;

    const geo = new THREE.SphereGeometry(0.48, 6, 6);
    for (let i = 0; i < this.maxPuffs; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.puffs.push({ mesh, life: 0, maxLife: 1.4 });
    }
    this.cursor = 0;
  }

  update(dt, aircraftMesh, physics, spec) {
    this.spawnTimer += dt;
    if (
      this.enabled &&
      !physics.grounded &&
      physics.speedKmh > 130 &&
      this.spawnTimer >= 0.032 &&
      aircraftMesh
    ) {
      this.spawnTimer = 0;
      const span = spec.wingSpan || 5.8;
      [-span, span].forEach((xOffset) => {
        const tipWorld = new THREE.Vector3(xOffset, 0.05, 1.1)
          .applyQuaternion(aircraftMesh.quaternion)
          .add(aircraftMesh.position);
        const item = this.puffs[this.cursor];
        this.cursor = (this.cursor + 1) % this.maxPuffs;

        item.life = 1.35;
        item.maxLife = 1.35;
        item.mesh.position.copy(tipWorld);
        item.mesh.scale.set(0.65, 0.65, 0.65);
        item.mesh.material.color.setHex(spec.smokeColor || 0xffffff);
        item.mesh.material.opacity = 0.55;
        item.mesh.visible = true;
      });
    }

    for (let i = 0; i < this.maxPuffs; i++) {
      const p = this.puffs[i];
      if (p.life > 0) {
        p.life -= dt;
        if (p.life <= 0) {
          p.mesh.visible = false;
        } else {
          const ratio = p.life / p.maxLife;
          p.mesh.material.opacity = ratio * 0.52;
          const s = 0.65 + (1 - ratio) * 2.2;
          p.mesh.scale.set(s, s, s);
        }
      }
    }
  }
}

/* ============================================================================
   5. AI AIR TRAFFIC & FIGHTER SQUADRON MANAGER (14 Active Flights)
   ============================================================================ */
class AITrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.flights = [];
  }

  init() {
    const configs = [
      { type: 'raptor', cx: 350, cz: -240, rx: 680, rz: 580, alt: 165, speed: 125, phase: 0.0, callsign: 'VIPER-1' },
      { type: 'raptor', cx: 375, cz: -220, rx: 680, rz: 580, alt: 172, speed: 125, phase: 0.08, callsign: 'VIPER-2' },
      { type: 'felon', cx: -850, cz: -1550, rx: 820, rz: 740, alt: 290, speed: 145, phase: 1.2, callsign: 'GHOST-1' },
      { type: 'felon', cx: -820, cz: -1520, rx: 820, rz: 740, alt: 298, speed: 145, phase: 1.28, callsign: 'GHOST-2' },
      { type: 'tomcat', cx: -1150, cz: 220, rx: 720, rz: 640, alt: 135, speed: 118, phase: 2.1, callsign: 'JOLLY-1' },
      { type: 'tomcat', cx: -1120, cz: 240, rx: 720, rz: 640, alt: 144, speed: 118, phase: 2.18, callsign: 'JOLLY-2' },
      { type: 'warthog', cx: 1650, cz: -950, rx: 650, rz: 550, alt: 115, speed: 88, phase: 3.4, callsign: 'HOG-1' },
      { type: 'sport', cx: 120, cz: -180, rx: 520, rz: 820, alt: 145, speed: 110, phase: 4.1, callsign: 'APEX-7' },
      { type: 'airliner', cx: 0, cz: -400, rx: 1650, rz: 1450, alt: 340, speed: 95, phase: 0.5, callsign: 'SKY-380' },
      { type: 'airliner', cx: 200, cz: 100, rx: 1850, rz: 1550, alt: 390, speed: 98, phase: 3.7, callsign: 'SKY-787' },
      { type: 'jet', cx: -200, cz: 300, rx: 1200, rz: 1050, alt: 245, speed: 92, phase: 1.9, callsign: 'EXEC-4' },
      { type: 'prop', cx: -680, cz: 780, rx: 420, rz: 420, alt: 88, speed: 58, phase: 2.8, callsign: 'HAWK-9' },
      { type: 'raptor', cx: 850, cz: -500, rx: 950, rz: 850, alt: 220, speed: 138, phase: 5.0, callsign: 'RAPTOR-5' },
      { type: 'tomcat', cx: -300, cz: -700, rx: 1100, rz: 900, alt: 210, speed: 128, phase: 4.6, callsign: 'TOMCAT-3' }
    ];

    configs.forEach((cfg) => {
      const mesh = AircraftBuilder.build(cfg.type);
      mesh.scale.set(1.25, 1.25, 1.25);
      this.scene.add(mesh);
      this.flights.push({
        ...cfg,
        mesh,
        angle: cfg.phase,
        x: cfg.cx,
        y: cfg.alt,
        z: cfg.cz,
        headingRad: 0
      });
    });
  }

  update(dt) {
    const fakePhysics = {
      throttle: 85,
      afterburner: true,
      inputRoll: 0.25,
      inputPitch: 0.05,
      inputYaw: 0
    };

    this.flights.forEach((f) => {
      const angularSpeed = f.speed / Math.max(400, (f.rx + f.rz) * 0.5);
      f.angle += angularSpeed * dt;

      const nextX = f.cx + Math.cos(f.angle) * f.rx;
      const nextZ = f.cz + Math.sin(f.angle) * f.rz;
      const nextY = f.alt + Math.sin(f.angle * 2) * 14;

      const dx = nextX - f.x;
      const dz = nextZ - f.z;
      const dy = nextY - f.y;

      f.x = nextX;
      f.z = nextZ;
      f.y = nextY;

      f.mesh.position.set(f.x, f.y, f.z);

      if (Math.hypot(dx, dz) > 0.001) {
        f.headingRad = Math.atan2(dx, dz);
        const targetPos = new THREE.Vector3(f.x + dx * 20, f.y + dy * 20, f.z + dz * 20);
        f.mesh.lookAt(targetPos);
        f.mesh.rotateZ(0.28);
      }

      AircraftBuilder.updateControlSurfaces(f.mesh, fakePhysics, dt);
    });
  }
}

/* ============================================================================
   6. OPEN-WORLD 3D ENVIRONMENT GENERATOR (Islands, Carrier, Airbases, Cities)
   ============================================================================ */
class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.windTurbines = [];
    this.beaconLight = null;
    this.buildingBoxes = [];
    this.oceanMesh = null;
    this.hemiLight = null;
    this.sunLight = null;
    this.sunDisc = null;
    this.skyMode = 'DAY';
  }

  generate() {
    this.setupLightingAndSky();
    this.createOcean();
    this.createIslandsAndMountains();
    this.createAirportAndRunway();
    this.createMilitaryAirbase();
    this.createCarrierStrikeGroup();
    this.createCityAndBridges();
    this.createForests();
    this.createClouds();
  }

  setupLightingAndSky() {
    this.scene.background = new THREE.Color(0x4ea3e8);
    this.scene.fog = new THREE.FogExp2(0x74bcf5, 0.0002);

    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e3a2f, 0.9);
    this.hemiLight.position.set(0, 600, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.5);
    this.sunLight.position.set(650, 920, 540);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 100;
    this.sunLight.shadow.camera.far = 2600;
    const d = 950;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(78, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false })
    );
    this.sunDisc.position.copy(this.sunLight.position).multiplyScalar(3.2);
    this.scene.add(this.sunDisc);
  }

  setTimeOfDay(mode) {
    this.skyMode = mode;
    if (mode === 'SUNSET') {
      this.scene.background.setHex(0xc2410c);
      this.scene.fog.color.setHex(0xfb923c);
      this.hemiLight.color.setHex(0xfed7aa);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.72;
      this.sunLight.color.setHex(0xffedd5);
      this.sunLight.intensity = 1.25;
      this.sunLight.position.set(-950, 260, -820);
      this.sunDisc.material.color.setHex(0xf97316);
      this.sunDisc.position.copy(this.sunLight.position).multiplyScalar(3.0);
    } else if (mode === 'NIGHT') {
      this.scene.background.setHex(0x040b18);
      this.scene.fog.color.setHex(0x071226);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.38;
      this.sunLight.color.setHex(0x93c5fd);
      this.sunLight.intensity = 0.45;
      this.sunLight.position.set(500, 820, -500);
      this.sunDisc.material.color.setHex(0xe2e8f0);
      this.sunDisc.position.copy(this.sunLight.position).multiplyScalar(3.2);
    } else {
      this.scene.background.setHex(0x4ea3e8);
      this.scene.fog.color.setHex(0x74bcf5);
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x1e3a2f);
      this.hemiLight.intensity = 0.9;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.5;
      this.sunLight.position.set(650, 920, 540);
      this.sunDisc.material.color.setHex(0xfef08a);
      this.sunDisc.position.copy(this.sunLight.position).multiplyScalar(3.2);
    }
  }

  createOcean() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#075985';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(64, y + 10, 192, y - 10, 256, y);
      ctx.stroke();
    }

    const oceanTex = new THREE.CanvasTexture(canvas);
    oceanTex.wrapS = THREE.RepeatWrapping;
    oceanTex.wrapT = THREE.RepeatWrapping;
    oceanTex.repeat.set(180, 180);

    const oceanGeo = new THREE.PlaneGeometry(16000, 16000, 32, 32);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      map: oceanTex,
      color: 0x0c6aa0,
      roughness: 0.22,
      metalness: 0.38
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
    this.oceanTex = oceanTex;
  }

  createIslandsAndMountains() {
    const matSand = new THREE.MeshStandardMaterial({ color: 0xe7d39b, roughness: 0.88 });
    const matGrass = new THREE.MeshStandardMaterial({ color: 0x2d6a3e, roughness: 0.82 });
    const matLush = new THREE.MeshStandardMaterial({ color: 0x3b8246, roughness: 0.78 });
    const matRock = new THREE.MeshStandardMaterial({ color: 0x57606f, roughness: 0.85 });
    const matSnow = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });
    const matWaterLake = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.4 });

    // 1. Main Airport & Bay Hub Island
    const mainBeach = new THREE.Mesh(new THREE.CylinderGeometry(1080, 1160, 2.2, 36), matSand);
    mainBeach.position.set(180, 0.6, -220);
    mainBeach.receiveShadow = true;

    const mainGrass = new THREE.Mesh(new THREE.CylinderGeometry(980, 1060, 2.2, 36), matGrass);
    mainGrass.position.set(180, 1.1, -220);
    mainGrass.receiveShadow = true;
    this.scene.add(mainBeach, mainGrass);

    const hillSpecs = [
      { x: -380, z: -320, rTop: 65, rBot: 240, h: 48, mat: matLush },
      { x: -460, z: 120, rTop: 45, rBot: 210, h: 62, mat: matGrass },
      { x: 840, z: -580, rTop: 80, rBot: 260, h: 55, mat: matLush },
      { x: 760, z: 260, rTop: 50, rBot: 210, h: 44, mat: matGrass }
    ];
    hillSpecs.forEach((h) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(h.rTop, h.rBot, h.h, 20), h.mat);
      mesh.position.set(h.x, h.h / 2 + 1.5, h.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    const lake = new THREE.Mesh(new THREE.CircleGeometry(155, 24), matWaterLake);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-280, 2.35, -60);
    this.scene.add(lake);

    const river = new THREE.Mesh(new THREE.PlaneGeometry(58, 760), matWaterLake);
    river.rotation.x = -Math.PI / 2;
    river.position.set(275, 2.32, -220);
    this.scene.add(river);

    // 2. Mount Nimbus Northern Mountain Island
    const northBase = new THREE.Mesh(new THREE.CylinderGeometry(1100, 1220, 4, 32), matGrass);
    northBase.position.set(-920, 1.5, -1750);
    this.scene.add(northBase);

    const mountainPeaks = [
      { x: -980, z: -1820, r: 520, h: 420 },
      { x: -640, z: -1620, r: 410, h: 310 },
      { x: -1280, z: -1560, r: 390, h: 285 },
      { x: -850, z: -2150, r: 440, h: 350 }
    ];
    mountainPeaks.forEach((m) => {
      const rockCone = new THREE.Mesh(new THREE.ConeGeometry(m.r, m.h, 16), matRock);
      rockCone.position.set(m.x, m.h / 2 + 2, m.z);
      rockCone.castShadow = true;
      rockCone.receiveShadow = true;
      this.scene.add(rockCone);

      const capH = m.h * 0.36;
      const capR = m.r * 0.36;
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(capR + 2, capH, 16), matSnow);
      snowCap.position.set(m.x, m.h - capH / 2 + 2.5, m.z);
      this.scene.add(snowCap);
    });

    // 3. Southern Tropical Atoll & Lighthouse Point
    const southBeach = new THREE.Mesh(new THREE.CylinderGeometry(520, 580, 2.2, 28), matSand);
    southBeach.position.set(-720, 0.7, 820);
    const southGrass = new THREE.Mesh(new THREE.CylinderGeometry(440, 490, 3.5, 28), matLush);
    southGrass.position.set(-720, 1.6, 820);
    this.scene.add(southBeach, southGrass);

    this.createLighthouse(-540, 680);

    // 4. Eastern Valkyrie Fighter Airbase Mesa Island
    const eastIsland = new THREE.Mesh(new THREE.CylinderGeometry(640, 720, 18, 28), matGrass);
    eastIsland.position.set(1750, 8, -950);
    this.scene.add(eastIsland);

    for (let i = 0; i < 5; i++) {
      this.createWindTurbine(2020, 17, -1180 + i * 115);
    }
  }

  createLighthouse(x, z) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 7.5, 46, 14),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
    );
    tower.position.set(x, 24, z);
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 7, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lantern.position.set(x, 49, z);
    this.scene.add(tower, lantern);
  }

  createWindTurbine(x, yBase, z) {
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 68, 10), matWhite);
    mast.position.set(x, yBase + 34, z);
    this.scene.add(mast);

    const rotor = new THREE.Group();
    rotor.position.set(x, yBase + 68, z - 2);
    const bladeGeo = new THREE.BoxGeometry(2.2, 28, 0.4);
    bladeGeo.translate(0, 14, 0);
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(bladeGeo, matWhite);
      b.rotation.z = (i * Math.PI * 2) / 3;
      rotor.add(b);
    }
    this.scene.add(rotor);
    this.windTurbines.push(rotor);
  }

  createRunwayTexture() {
    const rwyCanvas = document.createElement('canvas');
    rwyCanvas.width = 512;
    rwyCanvas.height = 2048;
    const ctx = rwyCanvas.getContext('2d');

    ctx.fillStyle = '#1e242b';
    ctx.fillRect(0, 0, 512, 2048);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(24, 0, 10, 2048);
    ctx.fillRect(478, 0, 10, 2048);

    for (let y = 140; y < 1900; y += 72) {
      ctx.fillRect(250, y, 12, 42);
    }

    for (let x = 56; x <= 430; x += 34) {
      ctx.fillRect(x, 35, 20, 75);
      ctx.fillRect(x, 1938, 20, 75);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(90, 260, 48, 90);
    ctx.fillRect(374, 260, 48, 90);
    ctx.fillRect(90, 1698, 48, 90);
    ctx.fillRect(374, 1698, 48, 90);

    const tex = new THREE.CanvasTexture(rwyCanvas);
    tex.anisotropy = 4;
    return tex;
  }

  createAirportAndRunway() {
    this.rwyTex = this.createRunwayTexture();
    const rwyGeo = new THREE.PlaneGeometry(48, 1400);
    rwyGeo.rotateX(-Math.PI / 2);
    const rwyMat = new THREE.MeshStandardMaterial({ map: this.rwyTex, roughness: 0.75 });
    const runway = new THREE.Mesh(rwyGeo, rwyMat);
    runway.position.set(0, 2.35, -220);
    runway.receiveShadow = true;
    this.scene.add(runway);

    const taxiMat = new THREE.MeshStandardMaterial({ color: 0x27303a, roughness: 0.85 });
    const taxiway = new THREE.Mesh(new THREE.PlaneGeometry(24, 1150), taxiMat);
    taxiway.rotation.x = -Math.PI / 2;
    taxiway.position.set(-68, 2.32, -220);
    this.scene.add(taxiway);

    const edgeLightGeo = new THREE.SphereGeometry(0.65, 6, 6);
    const edgeMatWhite = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const edgeMatGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const edgeMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let z = -900; z <= 460; z += 68) {
      const lLeft = new THREE.Mesh(edgeLightGeo, edgeMatWhite);
      lLeft.position.set(-25, 2.9, z);
      const lRight = new THREE.Mesh(edgeLightGeo, edgeMatWhite);
      lRight.position.set(25, 2.9, z);
      this.scene.add(lLeft, lRight);
    }

    for (let x = -22; x <= 22; x += 5.5) {
      const southLight = new THREE.Mesh(edgeLightGeo, edgeMatGreen);
      southLight.position.set(x, 2.9, 476);
      const northLight = new THREE.Mesh(edgeLightGeo, edgeMatRed);
      northLight.position.set(x, 2.9, -916);
      this.scene.add(southLight, northLight);
    }

    const matBuilding = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45 });
    const matGlass = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.7 });
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });

    const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 54, 12), matBuilding);
    towerShaft.position.set(-130, 29, -180);
    const towerCab = new THREE.Mesh(new THREE.CylinderGeometry(11, 8.5, 9, 12), matGlass);
    towerCab.position.set(-130, 60, -180);
    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(12, 5, 12), matRoof);
    towerRoof.position.set(-130, 67, -180);

    this.beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    this.beaconLight.position.set(-130, 71, -180);
    this.scene.add(towerShaft, towerCab, towerRoof, this.beaconLight);

    for (let i = 0; i < 3; i++) {
      const zPos = -40 - i * 85;
      const hangar = new THREE.Mesh(new THREE.BoxGeometry(42, 16, 52), matBuilding);
      hangar.position.set(-135, 10, zPos);
      hangar.castShadow = true;
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, 52, 16, 1, false, 0, Math.PI), matRoof);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.set(-135, 18, zPos);
      this.scene.add(hangar, roof);
    }
  }

  createMilitaryAirbase() {
    // Valkyrie Fighter Airbase on East Mesa Island (x = 1750, z = -1350..-550, elevation y = 17.2m)
    const rwyGeo = new THREE.PlaneGeometry(46, 820);
    rwyGeo.rotateX(-Math.PI / 2);
    const rwyMat = new THREE.MeshStandardMaterial({ map: this.rwyTex, roughness: 0.72 });
    const milRunway = new THREE.Mesh(rwyGeo, rwyMat);
    milRunway.position.set(1750, 17.2, -950);
    this.scene.add(milRunway);

    // Hardened Fighter Shelters & Radar Dome
    const matShelter = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 });
    const matDome = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    for (let i = 0; i < 4; i++) {
      const shelter = new THREE.Mesh(new THREE.BoxGeometry(32, 11, 36), matShelter);
      shelter.position.set(1665, 22.5, -1120 + i * 105);
      this.scene.add(shelter);
    }

    const radarPedestal = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 22, 12), matShelter);
    radarPedestal.position.set(1650, 28, -680);
    const radome = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 16), matDome);
    radome.position.set(1650, 46, -680);
    this.scene.add(radarPedestal, radome);
  }

  createCarrierStrikeGroup() {
    // USS Skybound CVN-88 Naval Aircraft Carrier at (x = -1150, z = 220)
    // Flight Deck: x in [-1180, -1120], z in [60, 380], elevation y = 14.5m
    const cx = -1150;
    const cz = 220;
    const matHull = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.45 });
    const matDeck = new THREE.MeshStandardMaterial({ map: this.rwyTex, roughness: 0.75 });
    const matLine = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(48, 14, 290), matHull);
    hull.position.set(cx, 7, cz);
    this.scene.add(hull);

    const flightDeck = new THREE.Mesh(new THREE.BoxGeometry(62, 1.4, 320), matDeck);
    flightDeck.position.set(cx, 14.2, cz);
    this.scene.add(flightDeck);

    // Carrier Island Superstructure (Starboard side at x = cx + 24)
    const island = new THREE.Mesh(new THREE.BoxGeometry(11, 24, 42), matHull);
    island.position.set(cx + 24, 26, cz - 20);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 18, 8), matHull);
    mast.position.set(cx + 24, 46, cz - 20);
    const deckBeacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), matLine);
    deckBeacon.position.set(cx + 24, 56, cz - 20);
    this.scene.add(island, mast, deckBeacon);

    // 2 Escort Naval Destroyers
    [-1320, -980].forEach((dx, idx) => {
      const dz = cz - 90 + idx * 140;
      const dHull = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 125), matHull);
      dHull.position.set(dx, 4.5, dz);
      const dBridge = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 28), matHull);
      dBridge.position.set(dx, 14, dz - 10);
      this.scene.add(dHull, dBridge);
    });
  }

  createCityAndBridges() {
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 128;
    winCanvas.height = 256;
    const ctx = winCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 8; y < 248; y += 16) {
      for (let x = 8; x < 120; x += 16) {
        ctx.fillStyle = (x + y) % 32 === 0 ? '#7dd3fc' : '#fde047';
        ctx.fillRect(x, y, 10, 10);
      }
    }
    const buildingTex = new THREE.CanvasTexture(winCanvas);
    buildingTex.wrapS = THREE.RepeatWrapping;
    buildingTex.wrapT = THREE.RepeatWrapping;

    const bldgMat = new THREE.MeshStandardMaterial({
      map: buildingTex,
      roughness: 0.3,
      metalness: 0.45
    });

    const layout = [
      { x: 450, z: -380, w: 38, d: 38, h: 115 },
      { x: 530, z: -380, w: 42, d: 42, h: 155 },
      { x: 615, z: -360, w: 36, d: 36, h: 95 },
      { x: 455, z: -280, w: 40, d: 40, h: 138 },
      { x: 540, z: -275, w: 46, d: 46, h: 192 },
      { x: 630, z: -270, w: 38, d: 38, h: 120 },
      { x: 710, z: -280, w: 34, d: 34, h: 82 },
      { x: 460, z: -170, w: 36, d: 36, h: 98 },
      { x: 545, z: -165, w: 42, d: 42, h: 145 },
      { x: 630, z: -165, w: 38, d: 38, h: 110 },
      { x: 470, z: -70, w: 34, d: 34, h: 78 },
      { x: 555, z: -65, w: 38, d: 38, h: 105 },
      { x: 640, z: -60, w: 34, d: 34, h: 74 },
      { x: 510, z: 45, w: 36, d: 36, h: 68 },
      { x: 590, z: 50, w: 34, d: 34, h: 62 }
    ];

    layout.forEach((b) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bldgMat);
      mesh.position.set(b.x, b.h / 2 + 2.2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.buildingBoxes.push({
        minX: b.x - b.w / 2 - 3,
        maxX: b.x + b.w / 2 + 3,
        minZ: b.z - b.d / 2 - 3,
        maxZ: b.z + b.d / 2 + 3,
        maxY: b.h + 2.5
      });
    });

    const matBridgeRed = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.45 });
    const matRoad = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(240, 2.2, 18), matRoad);
    deck.position.set(275, 22, -210);
    this.scene.add(deck);

    [215, 335].forEach((px) => {
      const pylonLeft = new THREE.Mesh(new THREE.BoxGeometry(4.5, 68, 4.5), matBridgeRed);
      pylonLeft.position.set(px, 34, -219);
      const pylonRight = new THREE.Mesh(new THREE.BoxGeometry(4.5, 68, 4.5), matBridgeRed);
      pylonRight.position.set(px, 34, -201);
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4, 22), matBridgeRed);
      crossBeam.position.set(px, 58, -210);
      this.scene.add(pylonLeft, pylonRight, crossBeam);
    });
  }

  createForests() {
    const count = 650;
    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 5, 6);
    trunkGeo.translate(0, 2.5, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });

    const foliageGeo = new THREE.ConeGeometry(3.8, 12, 7);
    foliageGeo.translate(0, 10, 0);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e5631, roughness: 0.8 });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const crowns = new THREE.InstancedMesh(foliageGeo, foliageMat, count);
    trunks.castShadow = true;
    crowns.castShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    while (placed < count) {
      const x = (rand() - 0.45) * 1900;
      const z = (rand() - 0.55) * 1800;

      if (Math.abs(x) < 175 && z > -980 && z < 540) continue;
      if (x > 195 && x < 760 && z > -460 && z < 120) continue;
      if (Math.hypot(x + 280, z + 60) < 170) continue;
      if (Math.hypot(x - 180, z + 220) > 940) continue;

      const scale = 0.75 + rand() * 0.95;
      dummy.position.set(x, 2.2, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = rand() * Math.PI * 2;
      dummy.updateMatrix();

      trunks.setMatrixAt(placed, dummy.matrix);
      crowns.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    this.scene.add(trunks, crowns);
  }

  createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9
    });
    const puffGeo = new THREE.DodecahedronGeometry(26, 1);

    for (let i = 0; i < 42; i++) {
      const group = new THREE.Group();
      const puffs = 3 + (i % 4);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((p - 1.5) * 24, (p % 2) * 8, (p % 3 - 1) * 14);
        const s = 0.8 + ((i + p) % 4) * 0.25;
        puff.scale.set(s * 1.4, s * 0.75, s);
        group.add(puff);
      }
      group.position.set(
        ((i * 397) % 4800) - 2400,
        250 + ((i * 73) % 340),
        ((i * 613) % 4800) - 2400
      );
      this.scene.add(group);
      this.clouds.push(group);
    }
  }

  update(dt) {
    if (this.oceanTex) {
      this.oceanTex.offset.y = (this.oceanTex.offset.y + dt * 0.06) % 1;
    }
    this.clouds.forEach((c, idx) => {
      c.position.x += (6 + (idx % 5) * 1.5) * dt;
      if (c.position.x > 2500) c.position.x = -2500;
    });
    this.windTurbines.forEach((wt) => {
      wt.rotation.z += dt * 1.4;
    });
  }

  isOnRunway(x, z) {
    const onMainRwy = Math.abs(x) <= 26 && z >= -930 && z <= 490;
    const onEastAirbase = Math.abs(x - 1750) <= 26 && z >= -1360 && z <= -540;
    const onCarrierDeck = x >= -1182 && x <= -1118 && z >= 60 && z <= 380;
    return onMainRwy || onEastAirbase || onCarrierDeck;
  }

  getSurfaceElevation(x, z) {
    if (x >= -1182 && x <= -1118 && z >= 60 && z <= 380) {
      return 14.9;
    }
    if (Math.abs(x) <= 26 && z >= -930 && z <= 490) return 2.35;
    if (Math.hypot(x - 1750, z + 950) < 680) return 17.2;

    const distMain = Math.hypot(x - 180, z + 220);
    if (distMain < 1060) return 2.2;

    const distNorth = Math.hypot(x + 920, z + 1750);
    if (distNorth < 1150) {
      const peakDist = Math.hypot(x + 980, z + 1820);
      if (peakDist < 500) {
        return Math.max(4, (1 - peakDist / 500) * 380);
      }
      return 3.5;
    }
    if (Math.hypot(x + 720, z - 820) < 520) return 2.5;
    return 0.0;
  }

  checkBuildingCollision(pos) {
    for (let i = 0; i < this.buildingBoxes.length; i++) {
      const b = this.buildingBoxes[i];
      if (
        pos.x >= b.minX &&
        pos.x <= b.maxX &&
        pos.z >= b.minZ &&
        pos.z <= b.maxZ &&
        pos.y <= b.maxY
      ) {
        return true;
      }
    }
    return false;
  }
}

/* ============================================================================
   7. ARCADE-SIMULATION FLIGHT PHYSICS (With Mobile Analog Stick & Afterburner)
   ============================================================================ */
class FlightPhysics {
  constructor(world) {
    this.world = world;
    this.position = new THREE.Vector3(0, 3.45, 420);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.speedKmh = 0;
    this.throttle = 0;
    this.verticalSpeed = 0;
    this.altitude = 3.4;
    this.headingDeg = 360;
    this.pitchDeg = 0;
    this.rollDeg = 0;

    this.inputPitch = 0;
    this.inputRoll = 0;
    this.inputYaw = 0;
    this.analogPitch = 0;
    this.analogRoll = 0;
    this.airbrake = false;
    this.afterburner = false;

    this.grounded = true;
    this.isStalling = false;
    this.crashed = false;
    this.crashReason = '';
    this.BoundaryWarning = false;
    this.lastTouchdownStats = null;
  }

  resetState(config) {
    this.position.set(config.x, config.y, config.z);
    this.euler.set(config.pitch || 0, config.yaw || 0, config.roll || 0, 'YXZ');
    this.quaternion.setFromEuler(this.euler);

    this.speedKmh = config.speedKmh || 0;
    this.throttle = config.throttle || 0;
    this.grounded = Boolean(config.grounded);
    this.verticalSpeed = 0;
    this.isStalling = false;
    this.crashed = false;
    this.crashReason = '';
    this.BoundaryWarning = false;
    this.lastTouchdownStats = null;
  }

  update(dt, keys, spec, invertPitch) {
    if (this.crashed) return;

    // 1. Throttle, Afterburner Boost & Airbrake Inputs
    this.afterburner = keys.has('Space');
    if (keys.has('ShiftLeft') || keys.has('ShiftRight') || this.afterburner) {
      this.throttle = Math.min(100, this.throttle + 52 * dt);
    }
    if (keys.has('ControlLeft') || keys.has('ControlRight')) {
      this.throttle = Math.max(0, this.throttle - 52 * dt);
    }
    this.airbrake = keys.has('KeyB');

    // 2. Pitch, Roll, Yaw Inputs (Keyboard + Mobile Analog Virtual Joystick)
    let rawPitch = this.analogPitch;
    if (keys.has('KeyW') || keys.has('ArrowUp')) rawPitch += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) rawPitch -= 1;
    rawPitch = THREE.MathUtils.clamp(rawPitch, -1, 1);
    if (invertPitch) rawPitch = -rawPitch;

    let rawRoll = this.analogRoll;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) rawRoll += 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) rawRoll -= 1;
    rawRoll = THREE.MathUtils.clamp(rawRoll, -1, 1);

    let rawYaw = 0;
    if (keys.has('KeyQ')) rawYaw += 1;
    if (keys.has('KeyE')) rawYaw -= 1;

    this.inputPitch = THREE.MathUtils.lerp(this.inputPitch, rawPitch, Math.min(1, dt * 11));
    this.inputRoll = THREE.MathUtils.lerp(this.inputRoll, rawRoll, Math.min(1, dt * 11));
    this.inputYaw = THREE.MathUtils.lerp(this.inputYaw, rawYaw, Math.min(1, dt * 11));

    // 3. Speed & Thrust Calculation
    const boostMult = this.afterburner ? 1.24 : 1.0;
    const targetMaxSpeed = (this.throttle / 100) * spec.maxSpeedKmh * boostMult;
    if (this.speedKmh < targetMaxSpeed) {
      this.speedKmh += spec.accelRate * (0.38 + (this.throttle / 100) * 0.88) * boostMult * dt;
    } else {
      const naturalDrag = this.grounded ? 26 : 18;
      this.speedKmh = Math.max(0, this.speedKmh - naturalDrag * dt);
    }

    if (this.airbrake) {
      this.speedKmh = Math.max(0, this.speedKmh - spec.brakeRate * dt);
    }

    if (!this.grounded) {
      const sinPitch = Math.sin(this.euler.x);
      this.speedKmh -= sinPitch * 40 * dt;
    }
    this.speedKmh = THREE.MathUtils.clamp(this.speedKmh, 0, spec.maxSpeedKmh * 1.25);

    // 4. Control Authority Based on Speed
    const speedAuthority = THREE.MathUtils.clamp(this.speedKmh / spec.takeoffKmh, 0.28, 1.35);

    if (this.grounded) {
      this.euler.z = THREE.MathUtils.lerp(this.euler.z, 0, Math.min(1, dt * 8));
      this.euler.y += this.inputYaw * spec.yawRate * 0.9 * dt;

      if (this.speedKmh >= spec.takeoffKmh * 0.8 && this.inputPitch > 0) {
        this.euler.x = Math.min(0.34, this.euler.x + this.inputPitch * spec.pitchRate * 0.78 * dt);
      } else {
        this.euler.x = THREE.MathUtils.lerp(this.euler.x, 0, Math.min(1, dt * 6));
      }

      if (this.speedKmh >= spec.takeoffKmh && this.euler.x > 0.05) {
        this.grounded = false;
      }
    } else {
      this.euler.x += this.inputPitch * spec.pitchRate * speedAuthority * dt;
      this.euler.z += this.inputRoll * spec.rollRate * speedAuthority * dt;
      this.euler.y += this.inputYaw * spec.yawRate * speedAuthority * dt;

      const bankTurn = Math.sin(this.euler.z) * 0.72 * THREE.MathUtils.clamp(this.speedKmh / 200, 0.3, 1.25);
      this.euler.y += bankTurn * dt;

      if (Math.abs(rawRoll) < 0.05) {
        this.euler.z = THREE.MathUtils.lerp(this.euler.z, 0, dt * 0.75);
      }

      this.isStalling = this.speedKmh < spec.minStallKmh;
      if (this.isStalling) {
        this.euler.x = THREE.MathUtils.lerp(this.euler.x, -0.35, dt * 1.5);
      }

      this.euler.x = THREE.MathUtils.clamp(this.euler.x, -1.28, 1.28);
      this.euler.z = THREE.MathUtils.clamp(this.euler.z, -1.48, 1.48);
    }

    this.quaternion.setFromEuler(this.euler);

    // 5. Linear Velocity & Lift Integration
    const speedMs = this.speedKmh / 3.6;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    this.velocity.copy(forward).multiplyScalar(speedMs);

    if (!this.grounded) {
      const liftRatio = THREE.MathUtils.clamp(
        (this.speedKmh / spec.minStallKmh) * spec.liftFactor,
        0,
        1.15
      );
      const stallSink = (1 - Math.min(1, liftRatio)) * 16.0;
      this.velocity.y -= stallSink * dt * 12;
    } else {
      this.velocity.y = 0;
    }

    const prevY = this.position.y;
    this.position.addScaledVector(this.velocity, dt);

    // 6. Surface & Runway / Carrier Deck Touchdown Detection
    const surfaceY = this.world.getSurfaceElevation(this.position.x, this.position.z);
    const gearHeight = 1.1;

    if (this.world.checkBuildingCollision(this.position)) {
      this.crashed = true;
      this.crashReason = 'COLLISION WITH CITY STRUCTURE';
      return;
    }

    if (this.position.y <= surfaceY + gearHeight) {
      const descentRate = (this.position.y - prevY) / Math.max(0.001, dt);
      const onRunway = this.world.isOnRunway(this.position.x, this.position.z);
      const bankDeg = Math.abs(THREE.MathUtils.radToDeg(this.euler.z));
      const pitchDeg = Math.abs(THREE.MathUtils.radToDeg(this.euler.x));

      if (!this.grounded) {
        if (surfaceY <= 0.1) {
          this.crashed = true;
          this.crashReason = 'WATER IMPACT – KEEP ABOVE SEA LEVEL';
          return;
        }
        if (descentRate < -15.5 || bankDeg > 29 || pitchDeg > 29) {
          this.crashed = true;
          this.crashReason = 'HARD IMPACT – EXCESSIVE DESCENT RATE OR BANK ANGLE';
          return;
        }

        this.grounded = true;
        this.isStalling = false;
        this.lastTouchdownStats = {
          onRunway,
          verticalSpeed: Math.abs(descentRate),
          speedKmh: this.speedKmh,
          centerlineOffset: Math.abs(this.position.x),
          bankDeg
        };
      }

      this.position.y = surfaceY + gearHeight;
      this.euler.x = Math.max(0, this.euler.x);
      this.euler.z = 0;
      this.quaternion.setFromEuler(this.euler);
    }

    // 7. World Boundaries Check (±4200m)
    const maxBound = 4200;
    if (Math.abs(this.position.x) > maxBound || Math.abs(this.position.z) > maxBound) {
      this.BoundaryWarning = true;
      if (Math.abs(this.position.x) > maxBound + 300 || Math.abs(this.position.z) > maxBound + 300) {
        const toCenter = Math.atan2(-this.position.x, -this.position.z);
        this.euler.y = toCenter;
        this.quaternion.setFromEuler(this.euler);
      }
    } else {
      this.BoundaryWarning = false;
    }

    // 8. Telemetry Values
    this.verticalSpeed = this.grounded ? 0 : (this.position.y - prevY) / Math.max(0.001, dt);
    this.altitude = Math.max(0, this.position.y - 2.2);
    const rawHeading = (-THREE.MathUtils.radToDeg(this.euler.y) % 360 + 360) % 360;
    this.headingDeg = Math.round(rawHeading) === 0 ? 360 : Math.round(rawHeading);
    this.pitchDeg = THREE.MathUtils.radToDeg(this.euler.x);
    this.rollDeg = THREE.MathUtils.radToDeg(this.euler.z);
  }
}

/* ============================================================================
   8. THREE-MODE CAMERA SYSTEM (Chase, Cockpit, Cinematic)
   ============================================================================ */
class CameraManager {
  constructor(camera, cockpitOverlayEl, camLabelEl) {
    this.camera = camera;
    this.cockpitOverlayEl = cockpitOverlayEl;
    this.camLabelEl = camLabelEl;
    this.modeIndex = 0;
    this.modeNames = ['CHASE', 'COCKPIT', 'CINEMATIC'];
    this.cinematicAngle = 0;
    this.currentPos = new THREE.Vector3();
    this.currentLook = new THREE.Vector3();
  }

  cycleMode() {
    this.modeIndex = (this.modeIndex + 1) % 3;
    const modeName = this.modeNames[this.modeIndex];
    if (this.camLabelEl) this.camLabelEl.textContent = modeName;
    if (this.cockpitOverlayEl) {
      this.cockpitOverlayEl.classList.toggle('hidden', this.modeIndex !== 1);
    }
  }

  setMenuOrbit(timeSec, targetMesh) {
    if (this.cockpitOverlayEl) this.cockpitOverlayEl.classList.add('hidden');
    const radius = 15.5;
    const angle = timeSec * 0.32;
    const targetPos = targetMesh ? targetMesh.position : new THREE.Vector3(0, 3.45, 420);
    this.camera.position.set(
      targetPos.x + Math.cos(angle) * radius,
      targetPos.y + 4.5 + Math.sin(timeSec * 0.5) * 1.2,
      targetPos.z + Math.sin(angle) * radius
    );
    this.camera.lookAt(targetPos.x, targetPos.y + 0.8, targetPos.z);
  }

  update(dt, aircraftMesh, physics) {
    if (!aircraftMesh) return;

    // Dynamic FOV warp when boosting at high speed
    const targetFov = physics && physics.afterburner ? 68 : 60;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 6);
      this.camera.updateProjectionMatrix();
    }

    if (this.modeIndex === 0) {
      const offset = new THREE.Vector3(0, 3.8, 14.5);
      offset.applyQuaternion(aircraftMesh.quaternion);
      const desiredPos = aircraftMesh.position.clone().add(offset);

      const lookOffset = new THREE.Vector3(0, 0.8, -18);
      lookOffset.applyQuaternion(aircraftMesh.quaternion);
      const desiredLook = aircraftMesh.position.clone().add(lookOffset);

      this.currentPos.lerp(desiredPos, Math.min(1, dt * 9.5));
      this.currentLook.lerp(desiredLook, Math.min(1, dt * 12));

      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentLook);
    } else if (this.modeIndex === 1) {
      const cockpitOffset = new THREE.Vector3(0, 0.78, -0.85);
      cockpitOffset.applyQuaternion(aircraftMesh.quaternion);
      const camPos = aircraftMesh.position.clone().add(cockpitOffset);

      const forwardLook = new THREE.Vector3(0, 0.62, -45);
      forwardLook.applyQuaternion(aircraftMesh.quaternion);
      const lookPos = aircraftMesh.position.clone().add(forwardLook);

      const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(aircraftMesh.quaternion);
      this.camera.up.copy(upVec);
      this.camera.position.copy(camPos);
      this.camera.lookAt(lookPos);
      return;
    } else {
      this.cinematicAngle += dt * 0.35;
      const dist = 22;
      const sideX = Math.cos(this.cinematicAngle) * dist;
      const sideZ = Math.sin(this.cinematicAngle) * dist;
      const desiredPos = new THREE.Vector3(
        aircraftMesh.position.x + sideX,
        Math.max(5, aircraftMesh.position.y + 6.5),
        aircraftMesh.position.z + sideZ
      );
      this.currentPos.lerp(desiredPos, Math.min(1, dt * 4.5));
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(aircraftMesh.position);
    }

    this.camera.up.set(0, 1, 0);
  }

  snapToAircraft(aircraftMesh) {
    if (!aircraftMesh) return;
    const offset = new THREE.Vector3(0, 3.8, 14.5).applyQuaternion(aircraftMesh.quaternion);
    this.currentPos.copy(aircraftMesh.position).add(offset);
    this.currentLook.copy(aircraftMesh.position);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
  }
}

/* ============================================================================
   9. INTERACTIVE RADAR MINIMAP & FULL-WORLD TACTICAL MAP RENDERER
   ============================================================================ */
class MapController {
  constructor() {
    this.minimapCanvas = document.getElementById('hud-minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
    this.worldMapCanvas = document.getElementById('world-map-canvas');
    this.worldMapCtx = this.worldMapCanvas ? this.worldMapCanvas.getContext('2d') : null;
    this.coordsEl = document.getElementById('hud-coords');
  }

  drawMapOnContext(ctx, w, h, physics, aiTraffic, mission, isFullMap) {
    if (!ctx) return;

    // World bounds [-2600, +2600] mapped to canvas [0, w]
    const worldSpan = isFullMap ? 5200 : 2800;
    const centerX = isFullMap ? 200 : physics.position.x;
    const centerZ = isFullMap ? -450 : physics.position.z;

    const toPx = (wx, wz) => {
      const px = ((wx - centerX) / worldSpan + 0.5) * w;
      const py = ((wz - centerZ) / worldSpan + 0.5) * h;
      return [px, py];
    };
    const scaleR = (r) => (r / worldSpan) * w;

    // Deep Ocean Radar Background
    ctx.fillStyle = '#041226';
    ctx.fillRect(0, 0, w, h);

    // Tactical Radar Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1;
    const step = w / 8;
    for (let i = step; i < w; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Draw Islands
    const islands = [
      { x: 180, z: -220, r: 1040, color: '#1e4e3a', border: '#34d399', name: 'EMERALD ATOLL' },
      { x: -920, z: -1750, r: 1120, color: '#334155', border: '#94a3b8', name: 'MT. NIMBUS' },
      { x: -720, z: 820, r: 520, color: '#1e4e3a', border: '#34d399', name: 'SOUTH ATOLL' },
      { x: 1750, z: -950, r: 660, color: '#274c3c', border: '#38bdf8', name: 'VALKYRIE BASE' }
    ];

    islands.forEach((isl) => {
      const [ix, iy] = toPx(isl.x, isl.z);
      const ir = scaleR(isl.r);
      ctx.beginPath();
      ctx.arc(ix, iy, ir, 0, Math.PI * 2);
      ctx.fillStyle = isl.color;
      ctx.fill();
      ctx.strokeStyle = isl.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isFullMap) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(isl.name, ix - 36, iy + ir - 12);
      }
    });

    // Draw Bay City District
    const [cx, cy] = toPx(430, -390);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.fillRect(cx, cy, scaleR(300), scaleR(460));
    if (isFullMap) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('BAY CITY', cx + 4, cy + 14);
    }

    // Draw Runways & Carrier Deck
    const drawStrip = (x, z1, z2, widthM, color, label) => {
      const [x1, y1] = toPx(x - widthM, z1);
      const [x2, y2] = toPx(x + widthM, z2);
      ctx.fillStyle = color;
      ctx.fillRect(x1, Math.min(y1, y2), Math.max(4, x2 - x1), Math.abs(y2 - y1));
      if (isFullMap && label) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(label, x2 + 6, (y1 + y2) * 0.5);
      }
    };

    drawStrip(0, -920, 480, 35, '#38bdf8', 'INTL RWY 36');
    drawStrip(1750, -1350, -550, 35, '#38bdf8', 'VALKYRIE RWY');
    drawStrip(-1150, 60, 380, 42, '#facc15', 'USS SKYBOUND CVN');

    // Draw Active Checkpoints / Approach Gates
    if (mission && mission.checkpoints) {
      mission.checkpoints.forEach((cp, idx) => {
        if (!cp.visible) return;
        const [rx, ry] = toPx(cp.position.x, cp.position.z);
        ctx.beginPath();
        ctx.arc(rx, ry, isFullMap ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = idx === mission.currentCheckpointIdx ? '#f97316' : '#34d399';
        ctx.fill();
      });
    }

    // Draw Live AI Air Traffic & Fighter Squadrons
    if (aiTraffic && aiTraffic.flights) {
      aiTraffic.flights.forEach((f) => {
        const [fx, fy] = toPx(f.x, f.z);
        if (fx < 0 || fx > w || fy < 0 || fy > h) return;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(f.headingRad);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(3, 4);
        ctx.lineTo(-3, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw Player Aircraft & Heading Cone
    const [px, py] = toPx(physics.position.x, physics.position.z);
    const headingRad = -physics.euler.y;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(headingRad);

    // Radar FOV Cone
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -28);
    ctx.lineTo(14, -28);
    ctx.closePath();
    ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
    ctx.fill();

    // Player Jet Delta Icon
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5.5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  update(physics, aiTraffic, mission, isMapModalOpen) {
    if (this.coordsEl) {
      this.coordsEl.textContent = `${Math.round(physics.position.x)}, ${Math.round(physics.position.z)}`;
    }
    if (this.minimapCtx && this.minimapCanvas) {
      this.drawMapOnContext(
        this.minimapCtx,
        this.minimapCanvas.width,
        this.minimapCanvas.height,
        physics,
        aiTraffic,
        mission,
        false
      );
    }
    if (isMapModalOpen && this.worldMapCtx && this.worldMapCanvas) {
      this.drawMapOnContext(
        this.worldMapCtx,
        this.worldMapCanvas.width,
        this.worldMapCanvas.height,
        physics,
        aiTraffic,
        mission,
        true
      );
    }
  }
}

/* ============================================================================
   10. MISSION MANAGER (Free Flight, Checkpoint Challenge, Landing Challenge)
   ============================================================================ */
class MissionManager {
  constructor(scene, world, storage, audio, onMissionEnd) {
    this.scene = scene;
    this.world = world;
    this.storage = storage;
    this.audio = audio;
    this.onMissionEnd = onMissionEnd;

    this.mode = 'free';
    this.score = 0;
    this.elapsedTime = 0;
    this.remainingTime = 0;
    this.checkpointGroup = new THREE.Group();
    this.scene.add(this.checkpointGroup);

    this.checkpoints = [];
    this.currentCheckpointIdx = 0;
    this.landingEvaluated = false;
    this.touchdownRecorded = null;
  }

  clearMissionObjects() {
    while (this.checkpointGroup.children.length > 0) {
      const child = this.checkpointGroup.children[0];
      this.checkpointGroup.remove(child);
    }
    this.checkpoints = [];
  }

  startMission(mode, physics, spec) {
    this.clearMissionObjects();
    this.mode = mode;
    this.score = 0;
    this.elapsedTime = 0;
    this.landingEvaluated = false;
    this.touchdownRecorded = null;

    if (mode === 'free') {
      physics.resetState({
        x: 0,
        y: 3.45,
        z: 420,
        pitch: 0,
        yaw: 0,
        roll: 0,
        speedKmh: 0,
        throttle: 45,
        grounded: true
      });
    } else if (mode === 'checkpoint') {
      physics.resetState({
        x: 0,
        y: 58,
        z: 240,
        pitch: 0.04,
        yaw: 0,
        roll: 0,
        speedKmh: spec.cruiseSpeedKmh,
        throttle: 82,
        grounded: false
      });
      this.remainingTime = 95.0;
      this.currentCheckpointIdx = 0;
      this.buildCheckpointCourse();
    } else if (mode === 'landing') {
      physics.resetState({
        x: 0,
        y: 185,
        z: 1620,
        pitch: -0.06,
        yaw: 0,
        roll: 0,
        speedKmh: spec.minStallKmh * 1.42,
        throttle: 36,
        grounded: false
      });
      this.buildApproachGates();
    }
  }

  buildCheckpointCourse() {
    const waypoints = [
      new THREE.Vector3(0, 68, -180),
      new THREE.Vector3(25, 85, -620),
      new THREE.Vector3(210, 72, -520),
      new THREE.Vector3(310, 48, -210),
      new THREE.Vector3(500, 96, -220),
      new THREE.Vector3(690, 125, -360),
      new THREE.Vector3(520, 150, -760),
      new THREE.Vector3(60, 165, -1120),
      new THREE.Vector3(-420, 145, -920),
      new THREE.Vector3(-460, 95, -340),
      new THREE.Vector3(-220, 65, 190),
      new THREE.Vector3(0, 42, -120)
    ];

    const ringGeo = new THREE.TorusGeometry(24, 1.9, 12, 32);
    waypoints.forEach((pos, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xff6b1a : 0x38bdf8,
        transparent: true,
        opacity: idx === 0 ? 0.95 : 0.38
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.position.copy(pos);

      if (idx < waypoints.length - 1) {
        mesh.lookAt(waypoints[idx + 1]);
      }

      this.checkpointGroup.add(mesh);
      this.checkpoints.push(mesh);
    });
  }

  buildApproachGates() {
    const gatePositions = [
      new THREE.Vector3(0, 150, 1320),
      new THREE.Vector3(0, 112, 1040),
      new THREE.Vector3(0, 74, 780),
      new THREE.Vector3(0, 36, 560)
    ];

    const gateGeo = new THREE.TorusGeometry(18, 0.9, 10, 28);
    gatePositions.forEach((pos) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.45
      });
      const gate = new THREE.Mesh(gateGeo, mat);
      gate.position.copy(pos);
      this.checkpointGroup.add(gate);
      this.checkpoints.push(gate);
    });
  }

  update(dt, physics) {
    this.elapsedTime += dt;

    const distStep = (physics.speedKmh / 3.6) * dt;
    this.storage.data.distanceMeters += distStep;

    if (physics.crashed) {
      this.audio.playLanding(false);
      this.onMissionEnd({
        success: false,
        title: 'AIRCRAFT CRASHED',
        subtitle: physics.crashReason || 'Flight envelope exceeded.',
        label1: 'Mode',
        val1: this.mode.toUpperCase(),
        label2: 'Flight Time',
        val2: this.formatTime(this.elapsedTime),
        label3: 'Airspeed',
        val3: `${Math.round(physics.speedKmh)} km/h`,
        label4: 'Status',
        val4: 'RETRY READY'
      });
      return;
    }

    if (this.mode === 'free') {
      if (!physics.grounded) {
        this.score += dt * (physics.speedKmh * 0.08);
      }
      if (physics.lastTouchdownStats && physics.lastTouchdownStats.onRunway && !this.landingEvaluated) {
        this.landingEvaluated = true;
        this.score += 250;
        this.storage.data.landings += 1;
        this.storage.data.totalScore += 250;
        this.storage.save();
        this.audio.playLanding(true);
      } else if (!physics.grounded) {
        this.landingEvaluated = false;
      }
    } else if (this.mode === 'checkpoint') {
      this.remainingTime = Math.max(0, this.remainingTime - dt);

      const activeRing = this.checkpoints[this.currentCheckpointIdx];
      if (activeRing) {
        activeRing.rotation.z += dt * 1.5;
        const dist = physics.position.distanceTo(activeRing.position);
        if (dist < 30) {
          this.audio.playCheckpoint();
          activeRing.visible = false;
          const speedBonus = Math.round(physics.speedKmh * 0.8);
          this.score += 200 + speedBonus;
          this.remainingTime += 10.0;
          this.currentCheckpointIdx++;

          if (this.currentCheckpointIdx < this.checkpoints.length) {
            const nextRing = this.checkpoints[this.currentCheckpointIdx];
            nextRing.material.color.setHex(0xff6b1a);
            nextRing.material.opacity = 0.95;
          } else {
            const timeBonus = Math.round(this.remainingTime * 25);
            this.score = Math.round(this.score + timeBonus);
            this.storage.data.totalScore += this.score;
            this.storage.data.challengesCompleted += 1;
            if (
              !this.storage.data.bestCheckpointTime ||
              this.elapsedTime < this.storage.data.bestCheckpointTime
            ) {
              this.storage.data.bestCheckpointTime = this.elapsedTime;
            }
            this.storage.save();
            this.audio.playMissionComplete();

            const grade = this.elapsedTime < 58 ? 'S RANK' : this.elapsedTime < 75 ? 'A RANK' : 'B RANK';
            this.onMissionEnd({
              success: true,
              title: 'CHECKPOINT CHALLENGE COMPLETE!',
              subtitle: 'All 12 aerial race gates cleared!',
              label1: 'Final Score',
              val1: `${Math.round(this.score)} PTS`,
              label2: 'Course Time',
              val2: this.formatTime(this.elapsedTime),
              label3: 'Pilot Grade',
              val3: grade,
              label4: 'Time Bonus',
              val4: `+${timeBonus} PTS`
            });
          }
        }
      }

      if (this.remainingTime <= 0 && this.currentCheckpointIdx < this.checkpoints.length) {
        this.audio.playLanding(false);
        this.onMissionEnd({
          success: false,
          title: 'TIME EXPIRED',
          subtitle: `You cleared ${this.currentCheckpointIdx} of ${this.checkpoints.length} checkpoints.`,
          label1: 'Score Earned',
          val1: `${Math.round(this.score)} PTS`,
          label2: 'Gates Cleared',
          val2: `${this.currentCheckpointIdx} / ${this.checkpoints.length}`,
          label3: 'Grade',
          val3: 'INCOMPLETE',
          label4: 'Tip',
          val4: 'USE SPACE FOR AFTERBURNER'
        });
      }
    } else if (this.mode === 'landing') {
      if (physics.lastTouchdownStats && !this.touchdownRecorded) {
        this.touchdownRecorded = { ...physics.lastTouchdownStats };
        this.audio.playLanding(this.touchdownRecorded.onRunway);
      }

      if (physics.grounded && this.touchdownRecorded && !this.landingEvaluated) {
        if (!this.touchdownRecorded.onRunway) {
          this.landingEvaluated = true;
          this.onMissionEnd({
            success: false,
            title: 'OFF-RUNWAY TOUCHDOWN',
            subtitle: 'You touched down outside the asphalt runway strip. Line up with Runway 36!',
            label1: 'Centerline Offset',
            val1: `${this.touchdownRecorded.centerlineOffset.toFixed(1)} m`,
            label2: 'Touchdown Speed',
            val2: `${Math.round(this.touchdownRecorded.speedKmh)} km/h`,
            label3: 'Result',
            val3: 'MISSED RUNWAY',
            label4: 'Tip',
            val4: 'FOLLOW GREEN GATES'
          });
          return;
        }

        if (physics.speedKmh <= 25) {
          this.landingEvaluated = true;
          const td = this.touchdownRecorded;
          const vsPenalty = Math.min(350, td.verticalSpeed * 42);
          const alignPenalty = Math.min(300, td.centerlineOffset * 12);
          const bankPenalty = Math.min(200, td.bankDeg * 10);
          const finalScore = Math.max(150, Math.round(1000 - vsPenalty - alignPenalty - bankPenalty));
          const grade =
            finalScore >= 880 ? 'S RANK (BUTTER!)' : finalScore >= 740 ? 'A RANK' : finalScore >= 580 ? 'B RANK' : 'C RANK';

          this.score = finalScore;
          this.storage.data.totalScore += finalScore;
          this.storage.data.landings += 1;
          this.storage.data.challengesCompleted += 1;
          this.storage.save();
          this.audio.playMissionComplete();

          this.onMissionEnd({
            success: true,
            title: 'PRECISION LANDING COMPLETE!',
            subtitle: 'Safe touchdown and rollout on Runway 36!',
            label1: 'Landing Score',
            val1: `${finalScore} / 1000`,
            label2: 'Touchdown V/S',
            val2: `-${td.verticalSpeed.toFixed(1)} m/s`,
            label3: 'Landing Grade',
            val3: grade,
            label4: 'Centerline Error',
            val4: `${td.centerlineOffset.toFixed(1)} m`
          });
        }
      }
    }
  }

  getTargetInfo(physics) {
    if (this.mode === 'checkpoint' && this.currentCheckpointIdx < this.checkpoints.length) {
      const ring = this.checkpoints[this.currentCheckpointIdx];
      const dist = Math.round(physics.position.distanceTo(ring.position));
      return {
        active: true,
        pos: ring.position,
        label: `CHECKPOINT ${this.currentCheckpointIdx + 1}/${this.checkpoints.length} • ${dist} m`
      };
    }
    if (this.mode === 'landing') {
      const rwyThreshold = new THREE.Vector3(0, 3.0, 420);
      const dist = Math.round(physics.position.distanceTo(rwyThreshold));
      const hint = physics.grounded ? 'HOLD [B] BRAKE TO STOP ON RUNWAY' : `RWY 36 THRESHOLD • ${dist} m`;
      return {
        active: true,
        pos: rwyThreshold,
        label: hint
      };
    }
    return { active: false };
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${String(m).padStart(2, '0')}:${s.padStart(4, '0')}`;
  }
}

/* ============================================================================
   11. HUD & UI CONTROLLER
   ============================================================================ */
class HUDController {
  constructor() {
    this.elMode = document.getElementById('hud-mode');
    this.elScore = document.getElementById('hud-score');
    this.elTimer = document.getElementById('hud-timer');
    this.elHeading = document.getElementById('hud-heading');
    this.elCompassStrip = document.getElementById('compass-strip');
    this.elTargetBanner = document.getElementById('hud-target-banner');
    this.elTargetArrow = document.getElementById('target-arrow');
    this.elTargetText = document.getElementById('hud-target-text');

    this.elAirspeed = document.getElementById('hud-airspeed');
    this.elSpeedBar = document.getElementById('hud-speed-bar');
    this.elHorizonDisc = document.getElementById('adi-horizon-disc');
    this.elPitchLadder = document.getElementById('adi-pitch-ladder');
    this.elAltitude = document.getElementById('hud-altitude');
    this.elAltBar = document.getElementById('hud-alt-bar');
    this.elVSpeed = document.getElementById('hud-vspeed');

    this.elThrottle = document.getElementById('hud-throttle');
    this.elThrottleFill = document.getElementById('hud-throttle-fill');
    this.elMobileThrottleSlider = document.getElementById('mobile-throttle-slider');
    this.elPillGear = document.getElementById('pill-gear');
    this.elPillBrake = document.getElementById('pill-brake');
    this.elPillSmoke = document.getElementById('pill-smoke');
    this.elAlertBanner = document.getElementById('hud-alert-banner');

    this.elMfdLeft = document.getElementById('cockpit-mfd-left');
    this.elMfdCenter = document.getElementById('cockpit-mfd-center');
    this.elMfdRight = document.getElementById('cockpit-mfd-right');
  }

  update(physics, mission, spec, smokeEnabled) {
    const modeTitle =
      mission.mode === 'checkpoint'
        ? 'CHECKPOINT CHALLENGE'
        : mission.mode === 'landing'
          ? 'LANDING CHALLENGE'
          : 'FREE FLIGHT';
    this.elMode.textContent = modeTitle;
    this.elScore.textContent = Math.round(mission.score).toLocaleString();

    const timerVal = mission.mode === 'checkpoint' ? mission.remainingTime : mission.elapsedTime;
    this.elTimer.textContent = mission.formatTime(timerVal);

    this.elHeading.textContent = String(physics.headingDeg).padStart(3, '0');
    const stripShift = ((physics.headingDeg % 360) / 360) * 180 - 90;
    this.elCompassStrip.style.transform = `translateX(${-stripShift}px)`;

    const spd = Math.round(physics.speedKmh);
    this.elAirspeed.textContent = spd;
    const spdPct = Math.min(100, (spd / spec.maxSpeedKmh) * 100);
    this.elSpeedBar.style.height = `${spdPct}%`;

    const alt = Math.round(physics.altitude);
    this.elAltitude.textContent = alt;
    const altPct = Math.min(100, (alt / 600) * 100);
    this.elAltBar.style.height = `${altPct}%`;

    const vs = physics.verticalSpeed;
    this.elVSpeed.textContent = `${vs >= 0 ? '+' : ''}${vs.toFixed(1)}`;

    const pitchPx = THREE.MathUtils.clamp(physics.pitchDeg * 1.8, -55, 55);
    this.elHorizonDisc.style.transform = `rotate(${physics.rollDeg.toFixed(1)}deg) translateY(${pitchPx.toFixed(1)}px)`;

    const thr = Math.round(physics.throttle);
    this.elThrottle.textContent = thr;
    this.elThrottleFill.style.height = `${thr}%`;
    if (this.elMobileThrottleSlider && document.activeElement !== this.elMobileThrottleSlider) {
      this.elMobileThrottleSlider.value = thr;
    }

    const gearDown = physics.altitude < 45 || physics.speedKmh < 185;
    this.elPillGear.textContent = gearDown ? 'GEAR DOWN' : 'GEAR UP';
    this.elPillGear.className = `status-pill ${gearDown ? 'active-green' : ''}`;

    this.elPillBrake.textContent = physics.airbrake ? 'BRAKE ON' : 'BRAKE OFF';
    this.elPillBrake.className = `status-pill ${physics.airbrake ? 'active-amber' : ''}`;

    if (this.elPillSmoke) {
      this.elPillSmoke.textContent = smokeEnabled ? 'SMOKE ON' : 'SMOKE OFF';
      this.elPillSmoke.className = `status-pill ${smokeEnabled ? 'active-amber' : ''}`;
    }

    if (physics.isStalling && !physics.grounded) {
      this.elAlertBanner.textContent = 'STALL WARNING – INCREASE THROTTLE & LOWER NOSE';
      this.elAlertBanner.classList.remove('hidden');
    } else if (physics.BoundaryWarning) {
      this.elAlertBanner.textContent = 'AIRSPACE BOUNDARY – TURN BACK TOWARD ISLANDS';
      this.elAlertBanner.classList.remove('hidden');
    } else {
      this.elAlertBanner.classList.add('hidden');
    }

    const targetInfo = mission.getTargetInfo(physics);
    if (targetInfo.active) {
      this.elTargetBanner.classList.remove('hidden');
      this.elTargetText.textContent = targetInfo.label;

      const dx = targetInfo.pos.x - physics.position.x;
      const dz = targetInfo.pos.z - physics.position.z;
      const bearingRad = Math.atan2(dx, -dz);
      const bearingDeg = (THREE.MathUtils.radToDeg(bearingRad) + 360) % 360;
      const relDeg = (bearingDeg - physics.headingDeg + 540) % 360 - 180;
      this.elTargetArrow.style.transform = `rotate(${relDeg.toFixed(0)}deg)`;
    } else {
      this.elTargetBanner.classList.add('hidden');
    }

    if (this.elMfdLeft) {
      this.elMfdLeft.textContent = `IAS: ${spd} KM/H // ALT: ${alt} M`;
      this.elMfdCenter.textContent = `HDG: ${String(physics.headingDeg).padStart(3, '0')}° // V/S: ${vs.toFixed(1)} M/S`;
      this.elMfdRight.textContent = `THR: ${thr}% // ${spec.name}`;
    }
  }
}

/* ============================================================================
   12. MAIN GAME APPLICATION CONTROLLER
   ============================================================================ */
class SkyboundGame {
  constructor() {
    this.storage = new StorageManager();
    this.audio = new AudioManager(this.storage);
    this.hud = new HUDController();
    this.mapController = new MapController();

    this.canvas = document.getElementById('webgl-canvas');
    this.keys = new Set();
    this.state = 'menu';
    this.resetConfirmPending = false;

    this.initRenderer();
    this.world = new WorldGenerator(this.scene);
    this.contrails = new ContrailManager(this.scene);
    this.aiTraffic = new AITrafficManager(this.scene);
    this.physics = new FlightPhysics(this.world);
    this.cameraManager = new CameraManager(
      this.camera,
      document.getElementById('cockpit-overlay'),
      document.getElementById('hud-cam-label')
    );
    this.mission = new MissionManager(
      this.scene,
      this.world,
      this.storage,
      this.audio,
      (res) => this.showMissionResult(res)
    );

    this.aircraftMesh = null;
    this.clock = new THREE.Clock();

    this.boot();
  }

  initRenderer() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (err) {
      const statusEl = document.getElementById('loader-status');
      if (statusEl) {
        statusEl.textContent = 'WEBGL INITIALIZATION FAILED – PLEASE ENABLE HARDWARE ACCELERATION.';
      }
      throw err;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 9500);
  }

  boot() {
    const progressEl = document.getElementById('loader-progress');
    const statusEl = document.getElementById('loader-status');

    if (progressEl) progressEl.style.width = '35%';
    if (statusEl) statusEl.textContent = 'GENERATING ARCHIPELAGO, CARRIER & AIRBASES...';

    this.world.generate();
    this.world.setTimeOfDay(this.storage.data.skyMode || 'DAY');

    if (progressEl) progressEl.style.width = '70%';
    if (statusEl) statusEl.textContent = 'SPAWNING 8 FIGHTER JETS & AI SQUADRONS...';

    this.aiTraffic.init();
    this.spawnAircraft(this.storage.data.selectedAircraft);

    // Auto-enable touch controls if mobile/tablet screen or touch sensor detected
    if (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 900
    ) {
      if (this.storage.data.touchMode === 'auto') {
        document.getElementById('touch-controls').classList.add('visible');
      }
    }

    this.bindEvents();
    this.refreshMenuUI();

    if (progressEl) progressEl.style.width = '100%';
    if (statusEl) statusEl.textContent = 'READY FOR CLEARED TAKEOFF';

    setTimeout(() => {
      const loader = document.getElementById('loading-screen');
      if (loader) loader.classList.add('hidden');
    }, 320);

    this.clock.start();
    this.animate();
  }

  spawnAircraft(type) {
    if (this.aircraftMesh) {
      this.scene.remove(this.aircraftMesh);
    }
    this.storage.data.selectedAircraft = type;
    this.storage.save();

    this.aircraftMesh = AircraftBuilder.build(type);
    this.aircraftMesh.position.copy(this.physics.position);
    this.aircraftMesh.quaternion.copy(this.physics.quaternion);
    this.scene.add(this.aircraftMesh);
    this.refreshMenuUI();
  }

  getActiveSpec() {
    return AIRCRAFT_SPECS[this.storage.data.selectedAircraft] || AIRCRAFT_SPECS.raptor;
  }

  startGameMode(mode) {
    this.audio.playClick();
    const spec = this.getActiveSpec();
    this.mission.startMission(mode, this.physics, spec);
    this.aircraftMesh.position.copy(this.physics.position);
    this.aircraftMesh.quaternion.copy(this.physics.quaternion);
    this.cameraManager.snapToAircraft(this.aircraftMesh);

    this.state = 'playing';
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('modal-pause').classList.add('hidden');
    document.getElementById('modal-result').classList.add('hidden');
    document.getElementById('modal-map').classList.add('hidden');
    document.getElementById('hud-layer').classList.remove('hidden');
    document.getElementById('cockpit-overlay').classList.toggle('hidden', this.cameraManager.modeIndex !== 1);
  }

  fastTravelTo(preset) {
    this.audio.playClick();
    const spec = this.getActiveSpec();
    this.mission.clearMissionObjects();
    this.mission.mode = 'free';
    this.mission.score = 0;
    this.mission.elapsedTime = 0;

    if (preset === 'carrier') {
      // USS Skybound CVN-88 Flight Deck Launch
      this.physics.resetState({
        x: -1150,
        y: 16.0,
        z: 345,
        pitch: 0,
        yaw: 0,
        roll: 0,
        speedKmh: 0,
        throttle: 75,
        grounded: true
      });
    } else if (preset === 'airbase') {
      // Valkyrie Fighter Airbase (East Island)
      this.physics.resetState({
        x: 1750,
        y: 18.3,
        z: -600,
        pitch: 0,
        yaw: 0,
        roll: 0,
        speedKmh: 0,
        throttle: 65,
        grounded: true
      });
    } else if (preset === 'mountain') {
      // Mount Nimbus High-Altitude Summit Pass
      this.physics.resetState({
        x: -780,
        y: 430,
        z: -1250,
        pitch: 0,
        yaw: 0.35,
        roll: 0,
        speedKmh: spec.cruiseSpeedKmh,
        throttle: 82,
        grounded: false
      });
    } else if (preset === 'city') {
      // Bay City Downtown Flyover
      this.physics.resetState({
        x: 275,
        y: 135,
        z: 240,
        pitch: 0,
        yaw: -0.35,
        roll: 0,
        speedKmh: spec.cruiseSpeedKmh,
        throttle: 80,
        grounded: false
      });
    } else {
      // Main Intl Airport RWY 36
      this.physics.resetState({
        x: 0,
        y: 3.45,
        z: 420,
        pitch: 0,
        yaw: 0,
        roll: 0,
        speedKmh: 0,
        throttle: 55,
        grounded: true
      });
    }

    this.aircraftMesh.position.copy(this.physics.position);
    this.aircraftMesh.quaternion.copy(this.physics.quaternion);
    this.cameraManager.snapToAircraft(this.aircraftMesh);

    this.state = 'playing';
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('modal-map').classList.add('hidden');
    document.getElementById('modal-pause').classList.add('hidden');
    document.getElementById('hud-layer').classList.remove('hidden');
  }

  toggleMapModal() {
    this.audio.playClick();
    const mapModal = document.getElementById('modal-map');
    const isHidden = mapModal.classList.contains('hidden');
    if (isHidden) {
      mapModal.classList.remove('hidden');
      this.mapController.update(this.physics, this.aiTraffic, this.mission, true);
    } else {
      mapModal.classList.add('hidden');
    }
  }

  cycleTimeOfDay() {
    const order = ['DAY', 'SUNSET', 'NIGHT'];
    const current = this.storage.data.skyMode || 'DAY';
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.storage.data.skyMode = next;
    this.storage.save();
    this.world.setTimeOfDay(next);
    this.refreshMenuUI();
  }

  toggleTouchControls() {
    const touchEl = document.getElementById('touch-controls');
    const isVis = touchEl.classList.toggle('visible');
    this.storage.data.touchMode = isVis ? 'on' : 'auto';
    this.storage.save();
    this.refreshMenuUI();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('modal-pause').classList.remove('hidden');
      this.audio.updateFlightAudio(false, 0, 0, this.getActiveSpec(), false, false);
    } else if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('modal-pause').classList.add('hidden');
    }
  }

  returnToMainMenu() {
    this.audio.playClick();
    this.state = 'menu';
    this.mission.clearMissionObjects();
    this.physics.resetState({
      x: 0,
      y: 3.45,
      z: 420,
      pitch: 0,
      yaw: 0,
      roll: 0,
      speedKmh: 0,
      throttle: 0,
      grounded: true
    });
    this.aircraftMesh.position.copy(this.physics.position);
    this.aircraftMesh.quaternion.copy(this.physics.quaternion);
    this.audio.updateFlightAudio(false, 0, 0, this.getActiveSpec(), false, false);

    document.getElementById('hud-layer').classList.add('hidden');
    document.getElementById('cockpit-overlay').classList.add('hidden');
    document.getElementById('hud-alert-banner').classList.add('hidden');
    document.getElementById('modal-pause').classList.add('hidden');
    document.getElementById('modal-result').classList.add('hidden');
    document.getElementById('modal-map').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    this.refreshMenuUI();
  }

  showMissionResult(res) {
    this.state = 'result';
    this.audio.updateFlightAudio(false, 0, 0, this.getActiveSpec(), false, false);
    document.getElementById('hud-alert-banner').classList.add('hidden');

    document.getElementById('result-title').textContent = res.title;
    document.getElementById('result-subtitle').textContent = res.subtitle;
    document.getElementById('result-label-1').textContent = res.label1;
    document.getElementById('result-val-1').textContent = res.val1;
    document.getElementById('result-label-2').textContent = res.label2;
    document.getElementById('result-val-2').textContent = res.val2;
    document.getElementById('result-label-3').textContent = res.label3;
    document.getElementById('result-val-3').textContent = res.val3;
    document.getElementById('result-label-4').textContent = res.label4;
    document.getElementById('result-val-4').textContent = res.val4;

    document.getElementById('modal-result').classList.remove('hidden');
    this.refreshMenuUI();
  }

  refreshMenuUI() {
    const d = this.storage.data;
    const spec = this.getActiveSpec();
    document.getElementById('menu-active-aircraft').textContent = spec.name;
    document.getElementById('stat-total-score').textContent = Math.round(d.totalScore).toLocaleString();
    document.getElementById('stat-distance').textContent = `${(d.distanceMeters / 1000).toFixed(1)} km`;
    document.getElementById('stat-best-time').textContent = d.bestCheckpointTime
      ? this.mission.formatTime(d.bestCheckpointTime)
      : '--:--';
    document.getElementById('stat-landings').textContent = d.landings;
    document.getElementById('stat-challenges').textContent = d.challengesCompleted;

    Object.keys(AIRCRAFT_SPECS).forEach((id) => {
      const card = document.getElementById(`card-aircraft-${id}`);
      if (card) card.classList.toggle('selected', d.selectedAircraft === id);
    });

    const audioLabel = d.muted ? 'OFF' : 'ON';
    document.getElementById('hud-audio-label').textContent = audioLabel;
    document.getElementById('btn-setting-mute').textContent = `MUTE: ${d.muted ? 'ON' : 'OFF'}`;
    document.getElementById('btn-setting-invert').textContent = `INVERT: ${d.invertPitch ? 'ON' : 'OFF'}`;
    document.getElementById('btn-setting-touch').textContent = `TOUCH PAD: ${d.touchMode.toUpperCase()}`;
    document.getElementById('btn-setting-sky').textContent = `TIME: ${d.skyMode || 'DAY'}`;
    document.getElementById('hud-sky-label').textContent = d.skyMode || 'DAY';
    document.getElementById('input-volume').value = d.volume;

    const touchEl = document.getElementById('touch-controls');
    if (touchEl && d.touchMode === 'on') {
      touchEl.classList.add('visible');
    }
  }

  toggleMute() {
    this.storage.data.muted = !this.storage.data.muted;
    this.storage.save();
    this.audio.updateMasterVolume();
    this.refreshMenuUI();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  bindEvents() {
    const gameControlCodes = new Set([
      'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE',
      'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
      'KeyB', 'KeyR', 'KeyC', 'KeyP', 'KeyM', 'KeyF',
      'KeyG', 'KeyN', 'KeyT', 'Tab',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'
    ]);

    window.addEventListener('keydown', (e) => {
      if (gameControlCodes.has(e.code)) {
        e.preventDefault();
      }
      this.audio.init();

      if (e.repeat) return;
      this.keys.add(e.code);

      if (e.code === 'KeyC' && (this.state === 'playing' || this.state === 'paused')) {
        this.cameraManager.cycleMode();
      } else if (e.code === 'KeyP' && (this.state === 'playing' || this.state === 'paused')) {
        this.togglePause();
      } else if (e.code === 'KeyR' && (this.state === 'playing' || this.state === 'paused')) {
        this.startGameMode(this.mission.mode);
      } else if (e.code === 'KeyM') {
        this.toggleMute();
      } else if (e.code === 'KeyF') {
        this.toggleFullscreen();
      } else if (e.code === 'KeyG') {
        this.contrails.enabled = !this.contrails.enabled;
      } else if (e.code === 'KeyT') {
        this.cycleTimeOfDay();
      } else if (e.code === 'KeyN' || e.code === 'Tab') {
        this.toggleMapModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Main Menu Buttons
    document.getElementById('btn-start-free').addEventListener('click', () => this.startGameMode('free'));
    document.getElementById('btn-start-checkpoint').addEventListener('click', () => this.startGameMode('checkpoint'));
    document.getElementById('btn-start-landing').addEventListener('click', () => this.startGameMode('landing'));

    document.getElementById('btn-open-aircraft').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('modal-aircraft').classList.remove('hidden');
    });
    document.getElementById('btn-close-aircraft').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('modal-aircraft').classList.add('hidden');
    });

    document.querySelectorAll('.aircraft-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.audio.playClick();
        const type = card.getAttribute('data-aircraft');
        if (type) this.spawnAircraft(type);
      });
    });

    // World Map & Fast Travel Modal
    document.getElementById('btn-open-map-menu').addEventListener('click', () => this.toggleMapModal());
    document.getElementById('btn-hud-map').addEventListener('click', () => this.toggleMapModal());
    document.getElementById('hud-minimap-box').addEventListener('click', () => this.toggleMapModal());
    document.getElementById('btn-close-map').addEventListener('click', () => this.toggleMapModal());
    document.getElementById('btn-spawn-airport').addEventListener('click', () => this.fastTravelTo('airport'));
    document.getElementById('btn-spawn-carrier').addEventListener('click', () => this.fastTravelTo('carrier'));
    document.getElementById('btn-spawn-airbase').addEventListener('click', () => this.fastTravelTo('airbase'));
    document.getElementById('btn-spawn-mountain').addEventListener('click', () => this.fastTravelTo('mountain'));
    document.getElementById('btn-spawn-city').addEventListener('click', () => this.fastTravelTo('city'));

    // Settings Modal
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      this.audio.playClick();
      this.resetConfirmPending = false;
      document.getElementById('btn-reset-progress').textContent = 'RESET PROGRESS';
      document.getElementById('modal-settings').classList.remove('hidden');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('modal-settings').classList.add('hidden');
    });

    document.getElementById('input-volume').addEventListener('input', (e) => {
      this.storage.data.volume = Number(e.target.value);
      this.storage.save();
      this.audio.updateMasterVolume();
    });
    document.getElementById('btn-setting-mute').addEventListener('click', () => {
      this.audio.playClick();
      this.toggleMute();
    });
    document.getElementById('btn-setting-sky').addEventListener('click', () => {
      this.audio.playClick();
      this.cycleTimeOfDay();
    });
    document.getElementById('btn-setting-invert').addEventListener('click', () => {
      this.audio.playClick();
      this.storage.data.invertPitch = !this.storage.data.invertPitch;
      this.storage.save();
      this.refreshMenuUI();
    });
    document.getElementById('btn-setting-touch').addEventListener('click', () => {
      this.audio.playClick();
      this.toggleTouchControls();
    });
    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      this.audio.playClick();
      const btn = document.getElementById('btn-reset-progress');
      const status = document.getElementById('reset-progress-status');
      if (!this.resetConfirmPending) {
        this.resetConfirmPending = true;
        btn.textContent = 'CLICK AGAIN TO CONFIRM';
        status.textContent = 'Are you sure? Click button again to permanently clear stats.';
      } else {
        this.storage.resetProgress();
        this.resetConfirmPending = false;
        btn.textContent = 'PROGRESS CLEARED';
        status.textContent = 'All career statistics and best times have been reset.';
        this.refreshMenuUI();
      }
    });

    // Help Modal
    document.getElementById('btn-open-help').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('modal-help').classList.remove('hidden');
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('modal-help').classList.add('hidden');
    });

    // HUD Quick Action Buttons
    document.getElementById('btn-hud-sky').addEventListener('click', () => {
      this.audio.playClick();
      this.cycleTimeOfDay();
    });
    document.getElementById('btn-hud-touch').addEventListener('click', () => {
      this.audio.playClick();
      this.toggleTouchControls();
    });
    document.getElementById('btn-hud-camera').addEventListener('click', () => {
      this.audio.playClick();
      this.cameraManager.cycleMode();
    });
    document.getElementById('btn-hud-mute').addEventListener('click', () => {
      this.audio.playClick();
      this.toggleMute();
    });
    document.getElementById('btn-hud-reset').addEventListener('click', () => {
      this.audio.playClick();
      this.startGameMode(this.mission.mode);
    });
    document.getElementById('btn-hud-fullscreen').addEventListener('click', () => {
      this.audio.playClick();
      this.toggleFullscreen();
    });
    document.getElementById('btn-hud-pause').addEventListener('click', () => {
      this.audio.playClick();
      this.togglePause();
    });

    // Pause Modal Buttons
    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      this.audio.playClick();
      this.togglePause();
    });
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.startGameMode(this.mission.mode);
    });
    document.getElementById('btn-pause-camera').addEventListener('click', () => {
      this.audio.playClick();
      this.cameraManager.cycleMode();
    });
    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.returnToMainMenu();
    });

    // Result Modal Buttons
    document.getElementById('btn-result-retry').addEventListener('click', () => {
      this.startGameMode(this.mission.mode);
    });
    document.getElementById('btn-result-menu').addEventListener('click', () => {
      this.returnToMainMenu();
    });

    // Mobile Touch Action Buttons
    document.getElementById('btn-touch-smoke').addEventListener('click', () => {
      this.audio.playClick();
      this.contrails.enabled = !this.contrails.enabled;
    });
    document.getElementById('btn-touch-map').addEventListener('click', () => {
      this.toggleMapModal();
    });

    // Mobile Throttle Slider
    const thrSlider = document.getElementById('mobile-throttle-slider');
    if (thrSlider) {
      thrSlider.addEventListener('input', (e) => {
        this.audio.init();
        this.physics.throttle = Number(e.target.value);
      });
    }

    // Mobile Virtual Analog Joystick (Multi-Touch Safe)
    const stickZone = document.getElementById('mobile-joystick-zone');
    const stickKnob = document.getElementById('mobile-joystick-knob');
    if (stickZone && stickKnob) {
      let activePointerId = null;
      const maxRadius = 44;

      const updateStick = (clientX, clientY) => {
        const rect = stickZone.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }
        stickKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;

        // Right drag = Roll Right (-1), Left drag = Roll Left (+1)
        this.physics.analogRoll = -(dx / maxRadius);
        // Down drag = Pull Nose Up (+1), Up drag = Push Nose Down (-1)
        this.physics.analogPitch = dy / maxRadius;
      };

      const resetStick = () => {
        activePointerId = null;
        stickKnob.style.transform = 'translate(0px, 0px)';
        this.physics.analogRoll = 0;
        this.physics.analogPitch = 0;
      };

      stickZone.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.init();
        activePointerId = e.pointerId;
        stickZone.setPointerCapture(e.pointerId);
        updateStick(e.clientX, e.clientY);
      });

      stickZone.addEventListener('pointermove', (e) => {
        if (e.pointerId !== activePointerId) return;
        e.preventDefault();
        updateStick(e.clientX, e.clientY);
      });

      stickZone.addEventListener('pointerup', (e) => {
        if (e.pointerId === activePointerId) resetStick();
      });
      stickZone.addEventListener('pointercancel', (e) => {
        if (e.pointerId === activePointerId) resetStick();
      });
    }

    // Classic On-Screen D-Pad & Hold Buttons
    document.querySelectorAll('.touch-btn').forEach((btn) => {
      const code = btn.getAttribute('data-key');
      if (!code) return;
      const press = (e) => {
        e.preventDefault();
        this.audio.init();
        this.keys.add(code);
        btn.classList.add('pressed');
      };
      const release = (e) => {
        e.preventDefault();
        this.keys.delete(code);
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();
    const spec = this.getActiveSpec();

    this.world.update(dt);
    this.aiTraffic.update(dt);

    const isMapModalOpen = !document.getElementById('modal-map').classList.contains('hidden');

    if (this.state === 'playing') {
      this.physics.update(dt, this.keys, spec, this.storage.data.invertPitch);
      this.aircraftMesh.position.copy(this.physics.position);
      this.aircraftMesh.quaternion.copy(this.physics.quaternion);

      AircraftBuilder.updateControlSurfaces(this.aircraftMesh, this.physics, dt);
      this.contrails.update(dt, this.aircraftMesh, this.physics, spec);
      this.cameraManager.update(dt, this.aircraftMesh, this.physics);
      this.mission.update(dt, this.physics);
      this.hud.update(this.physics, this.mission, spec, this.contrails.enabled);
      this.mapController.update(this.physics, this.aiTraffic, this.mission, isMapModalOpen);
      this.audio.updateFlightAudio(
        true,
        this.physics.throttle,
        this.physics.speedKmh,
        spec,
        this.physics.isStalling && !this.physics.grounded,
        this.physics.afterburner
      );
    } else if (this.state === 'menu') {
      this.physics.throttle = 45;
      AircraftBuilder.updateControlSurfaces(this.aircraftMesh, this.physics, dt);
      this.cameraManager.setMenuOrbit(elapsed, this.aircraftMesh);
      if (isMapModalOpen) {
        this.mapController.update(this.physics, this.aiTraffic, this.mission, true);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.skyboundGame = new SkyboundGame();
});
