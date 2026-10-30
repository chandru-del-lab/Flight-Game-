import * as THREE from 'three';

/**
 * SKYBOUND – ULTIMATE 3D FLIGHT EXPERIENCE
 * Complete 3D Flight Simulator Engine
 * Modules: StorageManager, AudioManager, AircraftBuilder, WorldGenerator,
 *          FlightPhysics, CameraManager, MissionManager, HUDController, Game
 */

const STORAGE_KEY = 'skybound_flight_save_v1';

const AIRCRAFT_SPECS = {
  prop: {
    id: 'prop',
    name: 'SKYHAWK X1',
    role: 'Propeller Trainer',
    maxSpeedKmh: 320,
    cruiseSpeedKmh: 210,
    minStallKmh: 92,
    takeoffKmh: 105,
    accelRate: 68,
    brakeRate: 95,
    pitchRate: 1.35,
    rollRate: 2.25,
    yawRate: 0.85,
    liftFactor: 1.15,
    engineBaseFreq: 68,
    engineType: 'prop'
  },
  jet: {
    id: 'jet',
    name: 'CITATION SOVEREIGN ZX',
    role: 'Modern Business Jet',
    maxSpeedKmh: 460,
    cruiseSpeedKmh: 310,
    minStallKmh: 118,
    takeoffKmh: 135,
    accelRate: 92,
    brakeRate: 115,
    pitchRate: 1.25,
    rollRate: 2.1,
    yawRate: 0.78,
    liftFactor: 1.05,
    engineBaseFreq: 135,
    engineType: 'jet'
  },
  sport: {
    id: 'sport',
    name: 'VIPER APEX GT',
    role: 'Fast Sporty Aircraft',
    maxSpeedKmh: 560,
    cruiseSpeedKmh: 380,
    minStallKmh: 128,
    takeoffKmh: 145,
    accelRate: 125,
    brakeRate: 140,
    pitchRate: 1.65,
    rollRate: 3.1,
    yawRate: 0.98,
    liftFactor: 1.08,
    engineBaseFreq: 165,
    engineType: 'sport'
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
      selectedAircraft: 'prop',
      volume: 75,
      muted: false,
      invertPitch: false,
      touchMode: 'auto'
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
      touchMode: this.data.touchMode
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

      // Engine harmonic oscillators
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

      // Procedural wind rush noise
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
      this.windFilter.Q.value = 1.4;

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

  updateFlightAudio(active, throttlePct, speedKmh, spec, isStalling) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (!active || this.storage.data.muted) {
      this.engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this.windGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }

    const normThr = Math.max(0, Math.min(1, throttlePct / 100));
    const normSpd = Math.max(0, Math.min(1.2, speedKmh / spec.maxSpeedKmh));
    const baseFreq = spec.engineBaseFreq || 80;

    const f1 = baseFreq * (0.65 + normThr * 1.45 + normSpd * 0.35);
    const f2 = f1 * (spec.engineType === 'prop' ? 1.5 : 2.02);

    this.engineOsc1.frequency.setTargetAtTime(f1, now, 0.06);
    this.engineOsc2.frequency.setTargetAtTime(f2, now, 0.06);
    this.engineFilter.frequency.setTargetAtTime(240 + normThr * 950, now, 0.08);
    this.engineGain.gain.setTargetAtTime(0.06 + normThr * 0.16, now, 0.08);

    // Wind rush proportional to airspeed
    this.windFilter.frequency.setTargetAtTime(280 + normSpd * 1100, now, 0.1);
    this.windGain.gain.setTargetAtTime(Math.min(0.22, normSpd * 0.18), now, 0.1);

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
   3. PROCEDURAL 3D AIRCRAFT BUILDER
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
    ctx.fillRect(0, 95, 256, 36);

    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 131, 256, 18);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  static build(type = 'prop') {
    const root = new THREE.Group();
    const parts = {
      propeller: null,
      afterburner: null,
      leftAileron: null,
      rightAileron: null,
      elevators: [],
      rudders: []
    };

    if (type === 'jet') {
      this.buildBusinessJet(root, parts);
    } else if (type === 'sport') {
      this.buildSportJet(root, parts);
    } else {
      this.buildPropAircraft(root, parts);
    }

    // Add standard navigation and strobe lights
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

  static buildPropAircraft(root, parts) {
    // Default aircraft: Blue, White, and Orange livery
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

    // Forward & Main Fuselage (oriented along -Z forward)
    const mainBodyGeo = new THREE.CylinderGeometry(0.68, 0.78, 3.6, 16);
    mainBodyGeo.rotateX(Math.PI / 2);
    const mainBody = new THREE.Mesh(mainBodyGeo, matWhite);
    mainBody.position.set(0, 0, -0.2);
    root.add(mainBody);

    // Tapered Rear Fuselage
    const rearBodyGeo = new THREE.CylinderGeometry(0.78, 0.25, 3.8, 16);
    rearBodyGeo.rotateX(Math.PI / 2);
    const rearBody = new THREE.Mesh(rearBodyGeo, matWhite);
    rearBody.position.set(0, 0.06, 3.5);
    root.add(rearBody);

    // Nose Engine Cowling (Blue & Orange)
    const cowlGeo = new THREE.CylinderGeometry(0.45, 0.68, 1.3, 16);
    cowlGeo.rotateX(Math.PI / 2);
    const cowl = new THREE.Mesh(cowlGeo, matBlue);
    cowl.position.set(0, -0.02, -2.65);
    root.add(cowl);

    // Cockpit Glass Canopy
    const canopyGeo = new THREE.SphereGeometry(0.66, 16, 12);
    canopyGeo.scale(0.88, 0.72, 2.35);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.52, -0.25);
    root.add(canopy);

    // Main Wings (Swept & tapered visual with orange tips)
    const wingGeo = new THREE.BoxGeometry(11.4, 0.14, 1.55);
    const mainWing = new THREE.Mesh(wingGeo, matWhite);
    mainWing.position.set(0, 0.12, -0.35);
    root.add(mainWing);

    // Blue Wing Leading Stripe
    const stripeGeo = new THREE.BoxGeometry(11.45, 0.15, 0.38);
    const wingStripe = new THREE.Mesh(stripeGeo, matBlue);
    wingStripe.position.set(0, 0.125, -0.92);
    root.add(wingStripe);

    // Wingtips (Orange)
    const tipGeo = new THREE.BoxGeometry(0.55, 0.22, 1.58);
    const leftTip = new THREE.Mesh(tipGeo, matOrange);
    leftTip.position.set(-5.85, 0.18, -0.35);
    leftTip.rotation.z = 0.25;
    const rightTip = new THREE.Mesh(tipGeo, matOrange);
    rightTip.position.set(5.85, 0.18, -0.35);
    rightTip.rotation.z = -0.25;
    root.add(leftTip, rightTip);

    // Articulated Ailerons
    const aileronGeo = new THREE.BoxGeometry(2.4, 0.08, 0.34);
    const leftAileron = new THREE.Mesh(aileronGeo, matOrange);
    leftAileron.position.set(-3.9, 0.11, 0.56);
    const rightAileron = new THREE.Mesh(aileronGeo, matOrange);
    rightAileron.position.set(3.9, 0.11, 0.56);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // Vertical Tail Fin
    const vTailGeo = new THREE.BoxGeometry(0.16, 1.75, 1.35);
    const vTail = new THREE.Mesh(vTailGeo, matBlue);
    vTail.position.set(0, 0.98, 4.75);
    vTail.rotation.x = -0.22;
    root.add(vTail);

    // Rudder
    const rudderGeo = new THREE.BoxGeometry(0.12, 1.65, 0.42);
    const rudder = new THREE.Mesh(rudderGeo, matOrange);
    rudder.position.set(0, 0.96, 5.48);
    root.add(rudder);
    parts.rudders.push(rudder);

    // Horizontal Stabilizers & Elevators
    const hStabGeo = new THREE.BoxGeometry(3.7, 0.11, 0.95);
    const hStab = new THREE.Mesh(hStabGeo, matWhite);
    hStab.position.set(0, 0.26, 4.85);
    root.add(hStab);

    const elevGeo = new THREE.BoxGeometry(3.5, 0.08, 0.32);
    const elevator = new THREE.Mesh(elevGeo, matOrange);
    elevator.position.set(0, 0.26, 5.45);
    root.add(elevator);
    parts.elevators.push(elevator);

    // Propeller Assembly (Nose Spinner + 3 Blades)
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

    // Tricycle Landing Gear
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

    // Sleek Elongated Cabin
    const cabinGeo = new THREE.CylinderGeometry(0.76, 0.76, 6.2, 18);
    cabinGeo.rotateX(Math.PI / 2);
    const cabin = new THREE.Mesh(cabinGeo, matWhite);
    cabin.position.set(0, 0, 0.3);
    root.add(cabin);

    // Aerodynamic Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.76, 2.5, 18);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matWhite);
    nose.position.set(0, 0, -4.05);
    root.add(nose);

    // Tail Cone
    const tailConeGeo = new THREE.CylinderGeometry(0.76, 0.22, 3.2, 18);
    tailConeGeo.rotateX(Math.PI / 2);
    const tailCone = new THREE.Mesh(tailConeGeo, matWhite);
    tailCone.position.set(0, 0.1, 5.0);
    root.add(tailCone);

    // Cockpit Windshield
    const visorGeo = new THREE.SphereGeometry(0.72, 16, 12);
    visorGeo.scale(0.92, 0.62, 1.9);
    const visor = new THREE.Mesh(visorGeo, matGlass);
    visor.position.set(0, 0.36, -2.1);
    root.add(visor);

    // Swept Low Wings
    const wingShape = new THREE.BoxGeometry(12.6, 0.14, 1.7);
    const wing = new THREE.Mesh(wingShape, matWhite);
    wing.position.set(0, -0.32, 0.35);
    root.add(wing);

    // Upturned Winglets
    const wingletGeo = new THREE.BoxGeometry(0.16, 1.15, 0.9);
    const leftWinglet = new THREE.Mesh(wingletGeo, matCyan);
    leftWinglet.position.set(-6.3, 0.2, 0.35);
    leftWinglet.rotation.z = -0.18;
    const rightWinglet = new THREE.Mesh(wingletGeo, matCyan);
    rightWinglet.position.set(6.3, 0.2, 0.35);
    rightWinglet.rotation.z = 0.18;
    root.add(leftWinglet, rightWinglet);

    // Ailerons
    const aileronGeo = new THREE.BoxGeometry(2.6, 0.08, 0.35);
    const leftAileron = new THREE.Mesh(aileronGeo, matCyan);
    leftAileron.position.set(-4.3, -0.32, 1.32);
    const rightAileron = new THREE.Mesh(aileronGeo, matCyan);
    rightAileron.position.set(4.3, -0.32, 1.32);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // Twin Rear Turbofan Nacelles
    const nacelleGeo = new THREE.CylinderGeometry(0.44, 0.38, 2.2, 16);
    nacelleGeo.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const glowGeo = new THREE.CircleGeometry(0.32, 12);

    [-1.15, 1.15].forEach((xOffset) => {
      const nacelle = new THREE.Mesh(nacelleGeo, matNavy);
      nacelle.position.set(xOffset, 0.35, 3.65);
      root.add(nacelle);

      const intakeRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.05, 10, 20),
        matChrome
      );
      intakeRing.position.set(xOffset, 0.35, 2.55);
      root.add(intakeRing);

      const exhaustGlow = new THREE.Mesh(glowGeo, glowMat);
      exhaustGlow.position.set(xOffset, 0.35, 4.76);
      root.add(exhaustGlow);
    });

    // T-Tail Fin & High Horizontal Stabilizer
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

    // Sleek Fighter Fuselage
    const coreGeo = new THREE.CylinderGeometry(0.58, 0.72, 5.6, 16);
    coreGeo.rotateX(Math.PI / 2);
    const core = new THREE.Mesh(coreGeo, matBody);
    core.position.set(0, 0, 0.2);
    root.add(core);

    // Sharp Radome Nose
    const noseGeo = new THREE.ConeGeometry(0.58, 2.9, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, matRed);
    nose.position.set(0, -0.02, -4.05);
    root.add(nose);

    // Bubble Canopy
    const canopyGeo = new THREE.SphereGeometry(0.58, 16, 12);
    canopyGeo.scale(0.86, 0.72, 2.5);
    const canopy = new THREE.Mesh(canopyGeo, matGlass);
    canopy.position.set(0, 0.46, -1.05);
    root.add(canopy);

    // Delta Main Wings
    const wingGeo = new THREE.BoxGeometry(10.4, 0.12, 2.35);
    const wing = new THREE.Mesh(wingGeo, matBody);
    wing.position.set(0, -0.05, 0.75);
    root.add(wing);

    // Wingtip Aerobatic Pods
    const podGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 10);
    podGeo.rotateX(Math.PI / 2);
    const leftPod = new THREE.Mesh(podGeo, matOrange);
    leftPod.position.set(-5.25, -0.05, 0.65);
    const rightPod = new THREE.Mesh(podGeo, matOrange);
    rightPod.position.set(5.25, -0.05, 0.65);
    root.add(leftPod, rightPod);

    // Ailerons
    const aileronGeo = new THREE.BoxGeometry(2.5, 0.08, 0.38);
    const leftAileron = new THREE.Mesh(aileronGeo, matOrange);
    leftAileron.position.set(-3.5, -0.05, 2.05);
    const rightAileron = new THREE.Mesh(aileronGeo, matOrange);
    rightAileron.position.set(3.5, -0.05, 2.05);
    root.add(leftAileron, rightAileron);
    parts.leftAileron = leftAileron;
    parts.rightAileron = rightAileron;

    // Twin Canted Vertical Stabilizers
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

    // All-Moving Tailplanes / Elevators
    const elevGeo = new THREE.BoxGeometry(3.8, 0.1, 0.85);
    const elevator = new THREE.Mesh(elevGeo, matRed);
    elevator.position.set(0, -0.04, 3.25);
    root.add(elevator);
    parts.elevators.push(elevator);

    // Afterburner Exhaust Nozzle & Dynamic Flame Cone
    const nozzleGeo = new THREE.CylinderGeometry(0.58, 0.46, 0.95, 16);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, matDark);
    nozzle.position.set(0, 0, 3.45);
    root.add(nozzle);

    const flameGeo = new THREE.ConeGeometry(0.4, 2.2, 14);
    flameGeo.rotateX(Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff7b00,
      transparent: true,
      opacity: 0.85
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0, 0, 4.65);
    root.add(flame);
    parts.afterburner = flame;

    this.addLandingGear(root, matChrome, matDark, matRed);
  }

  static addLandingGear(root, matStrut, matTire, matAccent) {
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14);
    wheelGeo.rotateZ(Math.PI / 2);

    // Nose Gear
    const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8), matStrut);
    noseStrut.position.set(0, -0.68, -2.05);
    const noseWheel = new THREE.Mesh(wheelGeo, matTire);
    noseWheel.scale.set(0.8, 0.8, 0.8);
    noseWheel.position.set(0, -1.08, -2.05);
    root.add(noseStrut, noseWheel);

    // Main Gear (Left & Right)
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
    const span = type === 'jet' ? 6.35 : type === 'sport' ? 5.3 : 5.95;

    // Red Port Wingtip Light
    const redLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    redLight.position.set(-span, 0.18, -0.2);

    // Green Starboard Wingtip Light
    const greenLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    greenLight.position.set(span, 0.18, -0.2);

    // White Tail Strobe
    const whiteLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    whiteLight.position.set(0, 1.4, 5.2);

    root.add(redLight, greenLight, whiteLight);
  }

  static updateControlSurfaces(aircraftMesh, physics, dt) {
    if (!aircraftMesh || !aircraftMesh.userData.parts) return;
    const parts = aircraftMesh.userData.parts;

    if (parts.propeller) {
      const spinSpeed = 14 + (physics.throttle / 100) * 48;
      parts.propeller.rotation.z += spinSpeed * dt;
    }

    if (parts.afterburner) {
      const normThr = physics.throttle / 100;
      const pulse = 0.85 + Math.sin(performance.now() * 0.04) * 0.15;
      parts.afterburner.scale.set(
        0.65 + normThr * 0.55,
        0.65 + normThr * 0.55,
        (0.35 + normThr * 1.45) * pulse
      );
      parts.afterburner.visible = physics.throttle > 8;
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
   4. OPEN-WORLD 3D ENVIRONMENT GENERATOR
   ============================================================================ */
class WorldGenerator {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.windTurbines = [];
    this.beaconLight = null;
    this.buildingBoxes = [];
    this.oceanMesh = null;
  }

  generate() {
    this.setupLightingAndSky();
    this.createOcean();
    this.createIslandsAndMountains();
    this.createAirportAndRunway();
    this.createCityAndBridges();
    this.createForests();
    this.createClouds();
  }

  setupLightingAndSky() {
    this.scene.background = new THREE.Color(0x5ea9e6);
    this.scene.fog = new THREE.FogExp2(0x7ec0f2, 0.00022);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e3a2f, 0.85);
    hemiLight.position.set(0, 600, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    sunLight.position.set(650, 920, 540);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 2600;
    const d = 950;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Visual Sun Disc in Sky
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(75, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false })
    );
    sunDisc.position.copy(sunLight.position).multiplyScalar(3.2);
    this.scene.add(sunDisc);
  }

  createOcean() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#075985';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
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
      roughness: 0.24,
      metalness: 0.35
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

    // Scenic rolling hills on the West & East of Main Island
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

    // River & Inland Lake on Main Island
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

      // Snow Cap
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

    // 4. Eastern Wind-Farm Mesa Island
    const eastIsland = new THREE.Mesh(new THREE.CylinderGeometry(580, 650, 18, 24), matGrass);
    eastIsland.position.set(1750, 8, -950);
    this.scene.add(eastIsland);

    for (let i = 0; i < 5; i++) {
      this.createWindTurbine(1580 + i * 95, 17, -980 + (i % 2) * 110);
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

  createAirportAndRunway() {
    // Runway 36 / 18 at x = 0, z = +480 to -920 (Length: 1400m, Width: 48m)
    const rwyCanvas = document.createElement('canvas');
    rwyCanvas.width = 512;
    rwyCanvas.height = 2048;
    const ctx = rwyCanvas.getContext('2d');

    // Asphalt base
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(0, 0, 512, 2048);

    // Side solid white lines
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(24, 0, 10, 2048);
    ctx.fillRect(478, 0, 10, 2048);

    // Centerline dashed markings
    for (let y = 140; y < 1900; y += 72) {
      ctx.fillRect(250, y, 12, 42);
    }

    // Threshold piano keys (Top & Bottom)
    for (let x = 56; x <= 430; x += 34) {
      ctx.fillRect(x, 35, 20, 75);
      ctx.fillRect(x, 1938, 20, 75);
    }

    // Touchdown Zone Blocks
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(90, 260, 48, 90);
    ctx.fillRect(374, 260, 48, 90);
    ctx.fillRect(90, 1698, 48, 90);
    ctx.fillRect(374, 1698, 48, 90);

    const rwyTex = new THREE.CanvasTexture(rwyCanvas);
    rwyTex.anisotropy = 4;

    const rwyGeo = new THREE.PlaneGeometry(48, 1400);
    rwyGeo.rotateX(-Math.PI / 2);
    const rwyMat = new THREE.MeshStandardMaterial({ map: rwyTex, roughness: 0.75 });
    const runway = new THREE.Mesh(rwyGeo, rwyMat);
    runway.position.set(0, 2.35, -220);
    runway.receiveShadow = true;
    this.scene.add(runway);

    // Parallel Taxiway & Apron
    const taxiMat = new THREE.MeshStandardMaterial({ color: 0x27303a, roughness: 0.85 });
    const taxiway = new THREE.Mesh(new THREE.PlaneGeometry(24, 1150), taxiMat);
    taxiway.rotation.x = -Math.PI / 2;
    taxiway.position.set(-68, 2.32, -220);
    this.scene.add(taxiway);

    // Runway Edge Lights & Approach Threshold Lights
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

    // Airport Control Tower & Hangars (West of Runway at x = -125)
    const matBuilding = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45 });
    const matGlass = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.7 });
    const matRoof = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });

    // Control Tower
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

    // 3 Aircraft Hangars & Terminal
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

  createCityAndBridges() {
    // Procedural Window Façade Texture for Skyscrapers
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 128;
    winCanvas.height = 256;
    const ctx = winCanvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 8; y < 248; y += 16) {
      for (let x = 8; x < 120; x += 16) {
        ctx.fillStyle = (x + y) % 32 === 0 ? '#bae6fd' : '#334155';
        ctx.fillRect(x, y, 10, 10);
      }
    }
    const buildingTex = new THREE.CanvasTexture(winCanvas);
    buildingTex.wrapS = THREE.RepeatWrapping;
    buildingTex.wrapT = THREE.RepeatWrapping;

    const bldgMat = new THREE.MeshStandardMaterial({
      map: buildingTex,
      roughness: 0.35,
      metalness: 0.4
    });

    // Skybound Bay City Grid (East of the River, x: 420 to 820, z: -480 to +160)
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

    // Golden Suspension Bridge across River (x: 160 to 390, z: -210)
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

      // Keep clear of Runway & Taxiway & River & City core
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
    return Math.abs(x) <= 26 && z >= -930 && z <= 490;
  }

  getSurfaceElevation(x, z) {
    if (this.isOnRunway(x, z)) return 2.35;
    // Main island radius check
    const distMain = Math.hypot(x - 180, z + 220);
    if (distMain < 1060) return 2.2;
    // North mountain island check
    const distNorth = Math.hypot(x + 920, z + 1750);
    if (distNorth < 1150) {
      const peakDist = Math.hypot(x + 980, z + 1820);
      if (peakDist < 500) {
        return Math.max(4, (1 - peakDist / 500) * 380);
      }
      return 3.5;
    }
    // South island check
    if (Math.hypot(x + 720, z - 820) < 520) return 2.5;
    // East island check
    if (Math.hypot(x - 1750, z + 950) < 600) return 17.0;
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
   5. ARCADE-SIMULATION FLIGHT PHYSICS
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
    this.airbrake = false;

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

    // 1. Throttle & Airbrake Inputs
    if (keys.has('ShiftLeft') || keys.has('ShiftRight')) {
      this.throttle = Math.min(100, this.throttle + 48 * dt);
    }
    if (keys.has('ControlLeft') || keys.has('ControlRight')) {
      this.throttle = Math.max(0, this.throttle - 48 * dt);
    }
    this.airbrake = keys.has('KeyB');

    // 2. Pitch, Roll, Yaw Control Inputs
    let rawPitch = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) rawPitch += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) rawPitch -= 1;
    if (invertPitch) rawPitch = -rawPitch;

    let rawRoll = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) rawRoll += 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) rawRoll -= 1;

    let rawYaw = 0;
    if (keys.has('KeyQ')) rawYaw += 1;
    if (keys.has('KeyE')) rawYaw -= 1;

    // Smooth control surface damping
    this.inputPitch = THREE.MathUtils.lerp(this.inputPitch, rawPitch, Math.min(1, dt * 10));
    this.inputRoll = THREE.MathUtils.lerp(this.inputRoll, rawRoll, Math.min(1, dt * 10));
    this.inputYaw = THREE.MathUtils.lerp(this.inputYaw, rawYaw, Math.min(1, dt * 10));

    // 3. Speed & Thrust Calculation
    const targetMaxSpeed = (this.throttle / 100) * spec.maxSpeedKmh;
    if (this.speedKmh < targetMaxSpeed) {
      this.speedKmh += spec.accelRate * (0.35 + (this.throttle / 100) * 0.85) * dt;
    } else {
      const naturalDrag = this.grounded ? 26 : 18;
      this.speedKmh = Math.max(0, this.speedKmh - naturalDrag * dt);
    }

    if (this.airbrake) {
      this.speedKmh = Math.max(0, this.speedKmh - spec.brakeRate * dt);
    }

    // Gravity speed transfer when climbing or diving
    if (!this.grounded) {
      const sinPitch = Math.sin(this.euler.x);
      this.speedKmh -= sinPitch * 42 * dt;
    }
    this.speedKmh = THREE.MathUtils.clamp(this.speedKmh, 0, spec.maxSpeedKmh * 1.15);

    // 4. Control Authority Based on Speed
    const speedAuthority = THREE.MathUtils.clamp(this.speedKmh / spec.takeoffKmh, 0.25, 1.35);

    if (this.grounded) {
      // On runway/ground: flatten roll, allow nose rotation when speed >= 80% takeoff speed
      this.euler.z = THREE.MathUtils.lerp(this.euler.z, 0, Math.min(1, dt * 8));
      this.euler.y += this.inputYaw * spec.yawRate * 0.9 * dt;

      if (this.speedKmh >= spec.takeoffKmh * 0.82 && this.inputPitch > 0) {
        this.euler.x = Math.min(0.32, this.euler.x + this.inputPitch * spec.pitchRate * 0.75 * dt);
      } else {
        this.euler.x = THREE.MathUtils.lerp(this.euler.x, 0, Math.min(1, dt * 6));
      }

      // Liftoff check
      if (this.speedKmh >= spec.takeoffKmh && this.euler.x > 0.06) {
        this.grounded = false;
      }
    } else {
      // Airborne orientation update
      this.euler.x += this.inputPitch * spec.pitchRate * speedAuthority * dt;
      this.euler.z += this.inputRoll * spec.rollRate * speedAuthority * dt;
      this.euler.y += this.inputYaw * spec.yawRate * speedAuthority * dt;

      // Coordinated banking turn: rolling left/right naturally turns heading smoothly
      const bankTurn = Math.sin(this.euler.z) * 0.68 * THREE.MathUtils.clamp(this.speedKmh / 200, 0.3, 1.2);
      this.euler.y += bankTurn * dt;

      // Gentle auto-level assist when roll/pitch keys are released
      if (rawRoll === 0) {
        this.euler.z = THREE.MathUtils.lerp(this.euler.z, 0, dt * 0.65);
      }

      // Stall behavior at low speed
      this.isStalling = this.speedKmh < spec.minStallKmh;
      if (this.isStalling) {
        this.euler.x = THREE.MathUtils.lerp(this.euler.x, -0.38, dt * 1.6);
      }

      this.euler.x = THREE.MathUtils.clamp(this.euler.x, -1.25, 1.25);
      this.euler.z = THREE.MathUtils.clamp(this.euler.z, -1.45, 1.45);
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
      const stallSink = (1 - Math.min(1, liftRatio)) * 16.5;
      this.velocity.y -= stallSink * dt * 12;
    } else {
      this.velocity.y = 0;
    }

    const prevY = this.position.y;
    this.position.addScaledVector(this.velocity, dt);

    // 6. Surface & Runway Touchdown / Collision Detection
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
        // Check if safe landing vs crash
        if (surfaceY <= 0.1) {
          this.crashed = true;
          this.crashReason = 'WATER IMPACT – KEEP ABOVE SEA LEVEL';
          return;
        }
        if (descentRate < -14.5 || bankDeg > 28 || pitchDeg > 28) {
          this.crashed = true;
          this.crashReason = 'HARD IMPACT – EXCESSIVE DESCENT RATE OR BANK ANGLE';
          return;
        }

        // Successful Touchdown!
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
      // Gently steer back toward center if exceeding outer limit
      if (Math.abs(this.position.x) > maxBound + 300 || Math.abs(this.position.z) > maxBound + 300) {
        const toCenter = Math.atan2(-this.position.x, -this.position.z);
        this.euler.y = toCenter;
        this.quaternion.setFromEuler(this.euler);
      }
    } else {
      this.BoundaryWarning = false;
    }

    // 8. Telemetry Values for HUD
    this.verticalSpeed = this.grounded ? 0 : (this.position.y - prevY) / Math.max(0.001, dt);
    this.altitude = Math.max(0, this.position.y - 2.2);
    const rawHeading = (-THREE.MathUtils.radToDeg(this.euler.y) % 360 + 360) % 360;
    this.headingDeg = Math.round(rawHeading) === 0 ? 360 : Math.round(rawHeading);
    this.pitchDeg = THREE.MathUtils.radToDeg(this.euler.x);
    this.rollDeg = THREE.MathUtils.radToDeg(this.euler.z);
  }
}

/* ============================================================================
   6. THREE-MODE CAMERA SYSTEM (Chase, Cockpit, Cinematic)
   ============================================================================ */
class CameraManager {
  constructor(camera, cockpitOverlayEl, camLabelEl) {
    this.camera = camera;
    this.cockpitOverlayEl = cockpitOverlayEl;
    this.camLabelEl = camLabelEl;
    this.modeIndex = 0; // 0 = CHASE, 1 = COCKPIT, 2 = CINEMATIC
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

    if (this.modeIndex === 0) {
      // 1. THIRD-PERSON CHASE CAMERA
      const offset = new THREE.Vector3(0, 3.6, 13.8);
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
      // 2. COCKPIT CAMERA
      const cockpitOffset = new THREE.Vector3(0, 0.76, -0.85);
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
      // 3. CINEMATIC CAMERA
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
    const offset = new THREE.Vector3(0, 3.6, 13.8).applyQuaternion(aircraftMesh.quaternion);
    this.currentPos.copy(aircraftMesh.position).add(offset);
    this.currentLook.copy(aircraftMesh.position);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
  }
}

/* ============================================================================
   7. MISSION MANAGER (Free Flight, Checkpoint Challenge, Landing Challenge)
   ============================================================================ */
class MissionManager {
  constructor(scene, world, storage, audio, onMissionEnd) {
    this.scene = scene;
    this.world = world;
    this.storage = storage;
    this.audio = audio;
    this.onMissionEnd = onMissionEnd;

    this.mode = 'free'; // 'free' | 'checkpoint' | 'landing'
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
      // Start on Runway 36 South threshold ready for immediate takeoff roll
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
      // Start airborne over Runway 36 climbing toward Checkpoint 1
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
      // Start 1.65 km South of Runway 36 on Final Approach
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
      new THREE.Vector3(310, 48, -210), // Over suspension bridge
      new THREE.Vector3(500, 96, -220), // Through downtown Bay City
      new THREE.Vector3(690, 125, -360),
      new THREE.Vector3(520, 150, -760),
      new THREE.Vector3(60, 165, -1120),
      new THREE.Vector3(-420, 145, -920),
      new THREE.Vector3(-460, 95, -340),
      new THREE.Vector3(-220, 65, 190),
      new THREE.Vector3(0, 42, -120) // Final finish gate over runway
    ];

    const ringGeo = new THREE.TorusGeometry(22, 1.8, 12, 32);
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
    // Visual glide-slope guidance gates leading down to Runway 36 threshold (z = 475)
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

    // Track distance flown in career storage
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
        if (dist < 28) {
          // Cleared checkpoint!
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
            // Finished all 12 checkpoints!
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
          val4: 'USE SHIFT FOR FULL THRUST'
        });
      }
    } else if (this.mode === 'landing') {
      // Record initial runway touchdown telemetry
      if (physics.lastTouchdownStats && !this.touchdownRecorded) {
        this.touchdownRecorded = { ...physics.lastTouchdownStats };
        this.audio.playLanding(this.touchdownRecorded.onRunway);
      }

      // Evaluate once aircraft slows down on the ground
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

        // Wait until rolled to a safe taxi/stop speed (< 28 km/h) or stopped near end
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
   8. HUD & UI CONTROLLER
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
    this.elPillGear = document.getElementById('pill-gear');
    this.elPillBrake = document.getElementById('pill-brake');
    this.elAlertBanner = document.getElementById('hud-alert-banner');

    this.elMfdLeft = document.getElementById('cockpit-mfd-left');
    this.elMfdCenter = document.getElementById('cockpit-mfd-center');
    this.elMfdRight = document.getElementById('cockpit-mfd-right');
  }

  update(physics, mission, spec) {
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

    // Airspeed & Altitude
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

    // Artificial Horizon (Pitch & Roll)
    const pitchPx = THREE.MathUtils.clamp(physics.pitchDeg * 1.8, -55, 55);
    this.elHorizonDisc.style.transform = `rotate(${physics.rollDeg.toFixed(1)}deg) translateY(${pitchPx.toFixed(1)}px)`;

    // Throttle & Status Pills
    const thr = Math.round(physics.throttle);
    this.elThrottle.textContent = thr;
    this.elThrottleFill.style.height = `${thr}%`;

    const gearDown = physics.altitude < 45 || physics.speedKmh < 185;
    this.elPillGear.textContent = gearDown ? 'GEAR DOWN' : 'GEAR UP';
    this.elPillGear.className = `status-pill ${gearDown ? 'active-green' : ''}`;

    this.elPillBrake.textContent = physics.airbrake ? 'BRAKE ON' : 'BRAKE OFF';
    this.elPillBrake.className = `status-pill ${physics.airbrake ? 'active-amber' : ''}`;

    // Stall or Boundary Alert Banner
    if (physics.isStalling && !physics.grounded) {
      this.elAlertBanner.textContent = 'STALL WARNING – INCREASE THROTTLE & LOWER NOSE';
      this.elAlertBanner.classList.remove('hidden');
    } else if (physics.BoundaryWarning) {
      this.elAlertBanner.textContent = 'AIRSPACE BOUNDARY – TURN BACK TOWARD ISLANDS';
      this.elAlertBanner.classList.remove('hidden');
    } else {
      this.elAlertBanner.classList.add('hidden');
    }

    // Target / Checkpoint Direction Indicator
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

    // Update Cockpit MFD screens
    if (this.elMfdLeft) {
      this.elMfdLeft.textContent = `IAS: ${spd} KM/H // ALT: ${alt} M`;
      this.elMfdCenter.textContent = `HDG: ${String(physics.headingDeg).padStart(3, '0')}° // V/S: ${vs.toFixed(1)} M/S`;
      this.elMfdRight.textContent = `THR: ${thr}% // ${spec.name}`;
    }
  }
}

/* ============================================================================
   9. MAIN GAME APPLICATION CONTROLLER
   ============================================================================ */
class SkyboundGame {
  constructor() {
    this.storage = new StorageManager();
    this.audio = new AudioManager(this.storage);
    this.hud = new HUDController();

    this.canvas = document.getElementById('webgl-canvas');
    this.keys = new Set();
    this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'result'
    this.resetConfirmPending = false;

    this.initRenderer();
    this.world = new WorldGenerator(this.scene);
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
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 9000);
  }

  boot() {
    const progressEl = document.getElementById('loader-progress');
    const statusEl = document.getElementById('loader-status');

    if (progressEl) progressEl.style.width = '40%';
    if (statusEl) statusEl.textContent = 'GENERATING ISLANDS, AIRPORT & CITYSCAPE...';

    this.world.generate();

    if (progressEl) progressEl.style.width = '75%';
    if (statusEl) statusEl.textContent = 'ASSEMBLING 3D AIRCRAFT FLEET...';

    this.spawnAircraft(this.storage.data.selectedAircraft);
    this.bindEvents();
    this.refreshMenuUI();

    if (progressEl) progressEl.style.width = '100%';
    if (statusEl) statusEl.textContent = 'READY FOR CLEARED TAKEOFF';

    setTimeout(() => {
      const loader = document.getElementById('loading-screen');
      if (loader) loader.classList.add('hidden');
    }, 350);

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
    return AIRCRAFT_SPECS[this.storage.data.selectedAircraft] || AIRCRAFT_SPECS.prop;
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
    document.getElementById('hud-layer').classList.remove('hidden');
    document.getElementById('cockpit-overlay').classList.toggle('hidden', this.cameraManager.modeIndex !== 1);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('modal-pause').classList.remove('hidden');
      this.audio.updateFlightAudio(false, 0, 0, this.getActiveSpec(), false);
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
    this.audio.updateFlightAudio(false, 0, 0, this.getActiveSpec(), false);

    document.getElementById('hud-layer').classList.add('hidden');
    document.getElementById('cockpit-overlay').classList.add('hidden');
    document.getElementById('hud-alert-banner').classList.add('hidden');
    document.getElementById('modal-pause').classList.add('hidden');
    document.getElementById('modal-result').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    this.refreshMenuUI();
  }

  showMissionResult(res) {
    this.state = 'result';
    this.audio.updateFlightAudio(false, 0, 0, this.getActiveSpec(), false);
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

    // Aircraft selection cards
    ['prop', 'jet', 'sport'].forEach((id) => {
      const card = document.getElementById(`card-aircraft-${id}`);
      if (card) card.classList.toggle('selected', d.selectedAircraft === id);
    });

    // Audio & Settings controls
    const audioLabel = d.muted ? 'OFF' : 'ON';
    document.getElementById('hud-audio-label').textContent = audioLabel;
    document.getElementById('btn-setting-mute').textContent = `MUTE: ${d.muted ? 'ON' : 'OFF'}`;
    document.getElementById('btn-setting-invert').textContent = `INVERT: ${d.invertPitch ? 'ON' : 'OFF'}`;
    document.getElementById('btn-setting-touch').textContent = `TOUCH PAD: ${d.touchMode.toUpperCase()}`;
    document.getElementById('input-volume').value = d.volume;

    const touchEl = document.getElementById('touch-controls');
    if (touchEl) {
      touchEl.classList.toggle('visible', d.touchMode === 'on');
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
    document.getElementById('btn-setting-invert').addEventListener('click', () => {
      this.audio.playClick();
      this.storage.data.invertPitch = !this.storage.data.invertPitch;
      this.storage.save();
      this.refreshMenuUI();
    });
    document.getElementById('btn-setting-touch').addEventListener('click', () => {
      this.audio.playClick();
      this.storage.data.touchMode = this.storage.data.touchMode === 'on' ? 'auto' : 'on';
      this.storage.save();
      this.refreshMenuUI();
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

    // On-Screen Touch Buttons
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

    if (this.state === 'playing') {
      this.physics.update(dt, this.keys, spec, this.storage.data.invertPitch);
      this.aircraftMesh.position.copy(this.physics.position);
      this.aircraftMesh.quaternion.copy(this.physics.quaternion);

      AircraftBuilder.updateControlSurfaces(this.aircraftMesh, this.physics, dt);
      this.cameraManager.update(dt, this.aircraftMesh, this.physics);
      this.mission.update(dt, this.physics);
      this.hud.update(this.physics, this.mission, spec);
      this.audio.updateFlightAudio(
        true,
        this.physics.throttle,
        this.physics.speedKmh,
        spec,
        this.physics.isStalling && !this.physics.grounded
      );
    } else if (this.state === 'menu') {
      // Idle propeller spin & cinematic hangar camera orbit on Main Menu
      this.physics.throttle = 25;
      AircraftBuilder.updateControlSurfaces(this.aircraftMesh, this.physics, dt);
      this.cameraManager.setMenuOrbit(elapsed, this.aircraftMesh);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.skyboundGame = new SkyboundGame();
});
