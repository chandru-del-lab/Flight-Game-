# SKYBOUND – ULTIMATE 3D FLIGHT EXPERIENCE

**SKYBOUND** is a complete, interactive, browser-based 3D flight simulator and arcade aviation game built with **HTML5**, **CSS3**, **JavaScript ES Modules**, **Three.js (WebGL)**, **Web Audio API**, and **LocalStorage**.

Explore a vibrant open-world archipelago featuring islands, mountains, forests, downtown skyscrapers, suspension bridges, lakes, dynamic drifting clouds, and a full international airport with PAPI approach lighting.

---

## Features

- **Three Playable Aircraft**:
  1. **SkyHawk X1 (Propeller Trainer)** – Balanced, agile, high-lift single-engine prop plane in signature blue, white, and orange livery with animated spinning propeller and control surfaces.
  2. **Citation Sovereign ZX (Executive Business Jet)** – High-speed twin-engine executive jet with swept winglets, T-tail stabilizer, and smooth cruise stability.
  3. **Viper Apex GT (Supersonic Sport Aircraft)** – High-thrust aerobatic delta-wing sport jet with twin tails, glowing afterburner nozzle, and rapid roll response.
- **Three Playable Game Modes**:
  1. **Free Flight** – Unlimited open-world exploration with real-time flight statistics, landmarks, and runway takeoff/landing practice.
  2. **Checkpoint Challenge** – High-speed time-trial race through 12 floating neon checkpoint rings across islands, bridges, and mountain valleys.
  3. **Landing Challenge** – Precision final-approach landing scenario with glide-slope guidance gates and a multi-factor landing quality scorecard (descent rate, speed, alignment, and bank angle).
- **Arcade-Simulation Flight Physics**:
  - Realistic lift, drag, gravity, stall behavior at low airspeeds, speed-dependent control authority, coordinated turn banking, airbrakes, and ground gear physics.
  - Animated 3D control surfaces (ailerons, elevators, rudder, and propeller/afterburner).
- **Aviation HUD & 3 Camera Views**:
  - Live airspeed & altitude tapes, scrolling heading compass, artificial horizon (pitch ladder & roll indicator), vertical speed, throttle gauge, and target direction chevron.
  - Switch seamlessly between **Third-Person Chase Camera**, **Cockpit Camera** (with instrument glareshield), and **Cinematic Camera**.
- **Procedural Web Audio Synthesizer**:
  - Real-time synthesized engine harmonics, airspeed wind rush, stall warning alarms, checkpoint chimes, and touchdown audio effects—zero external audio assets required.
- **Persistent Career Progression**:
  - Automatically saves total score, distance flown, best checkpoint race time, successful landings, completed challenges, and unlocked/selected aircraft in `localStorage`.

---

## Project Structure

```text
SKYBOUND/
│
├── index.html   # Main application shell, Three.js CDN import map, HUD & menu DOM
├── style.css    # Dark aviation-themed glassmorphism UI, HUD instruments & responsive layout
├── game.js      # Complete 3D engine: AircraftBuilder, WorldGenerator, FlightPhysics, Audio, HUD & Missions
└── README.md    # Setup, controls, and architecture guide
```

---

## How to Run the Game

Because `index.html` loads `game.js` using JavaScript ES Modules (`<script type="module">`) and resolves Three.js via a CDN `<script type="importmap">`, make sure you have an active internet connection (so your browser can fetch Three.js from the CDN) and run the folder through a local web server:

### Method 1: VS Code Live Server
1. Open the `SKYBOUND` folder in **VS Code**.
2. Right-click `index.html` and open it using the **VS Code Live Server** extension.

### Method 2: Python Local HTTP Server (Alternative)
Run this command inside the `SKYBOUND` project folder:

```bash
python -m http.server 8000
```

Then open your browser and navigate to:

```text
http://localhost:8000
```

> **Note:** Opening `index.html` directly via `file://` may trigger browser CORS restrictions on ES modules. Always use Live Server or `python -m http.server 8000`, and ensure an internet connection is active for the Three.js CDN import map.

---

## Flight Controls

| Key | Action |
| :--- | :--- |
| **W** | Pitch Up (Climb / Pull Nose Up) |
| **S** | Pitch Down (Descend / Push Nose Down) |
| **A** | Roll Left (Bank Left) |
| **D** | Roll Right (Bank Right) |
| **Q** | Yaw Left (Rudder Left) |
| **E** | Yaw Right (Rudder Right) |
| **SHIFT** | Increase Throttle |
| **CTRL** | Decrease Throttle |
| **B** | Hold Airbrake / Wheel Brakes |
| **R** | Reset Aircraft Position |
| **C** | Cycle Camera View (Chase / Cockpit / Cinematic) |
| **P** | Pause / Resume Flight |
| **M** | Mute / Unmute Audio |
| **F** | Toggle Fullscreen |

Responsive on-screen touch controls are also built in for mobile/tablet devices and can be toggled anytime from the **Settings** menu.
