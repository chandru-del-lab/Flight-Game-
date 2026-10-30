# SKYBOUND – ULTIMATE 3D FLIGHT EXPERIENCE (v2.0)

**SKYBOUND** is a complete, interactive, desktop and mobile browser-based 3D flight simulator and fighter jet sandbox built with **HTML5**, **CSS3**, **JavaScript ES Modules**, **Three.js (WebGL)**, **Web Audio API**, and **LocalStorage**.

---

## What's New in v2.0

- **Full Mobile & Touch Flight Controls**:
  - **Virtual Analog Flight Stick**: Drag smoothly in any direction on phones or tablets for proportional pitch and roll control.
  - **Touch Throttle Slider & Quick Action Pad**: Dedicated vertical throttle slider, **BOOST** (Afterburner), **SMOKE**, **BRAKE**, **YAW L/R**, and **MAP** buttons, plus a 1-tap `TOUCH` toggle in the top HUD bar.
- **8 Playable Aircraft & Fighter Jets**:
  1. **SkyHawk X1** – Propeller Trainer (320 km/h)
  2. **Citation Sovereign ZX** – Modern Business Jet (460 km/h)
  3. **Viper Apex GT** – Fast Sporty Delta Jet (560 km/h)
  4. **F-22X Raptor Stealth** – 5th-Gen Stealth Air Superiority Fighter (880 km/h)
  5. **Su-57 Felon Strike** – Supersonic Digital-Camo Strike Fighter (920 km/h)
  6. **F-14D Super Tomcat** – Naval Carrier Interceptor Jet (840 km/h)
  7. **A-10C Thunderbolt II Warthog** – Close Air Support Attack Jet with Nose Cannon (520 km/h)
  8. **SkyLiner A380 Titan** – Heavy Quad-Engine Widebody Airliner (620 km/h)
- **14 Live AI Flights & Fighter Squadrons**:
  - Dynamic AI fighter patrols and commercial airliners cruising across the archipelago and visible on radar.
- **Interactive Radar Minimap & Tactical World Map (`N` / `TAB` or tap Minimap)**:
  - Live bottom-left HUD radar minimap with island contours, runways, checkpoints, and AI traffic.
  - Expandable Full-Screen Tactical Map with **Instant Fast-Travel / Spawn** to **Skybound Intl Airport**, **USS Skybound Aircraft Carrier**, **Valkyrie Fighter Airbase**, **Mount Nimbus Summit**, and **Bay City Downtown**.
- **Enhanced 3D Graphics**:
  - Live **Time-of-Day Switcher (`T`)**: Cycle between **Daylight**, **Golden Sunset**, and **Night Ops**.
  - **Wingtip Contrails & Aerobatic Smoke (`G`)** and **Supersonic Afterburner Boost (`SPACE`)**.

---

## How to Run the Game

1. Open the `SKYBOUND` folder in **VS Code** and launch `index.html` with the **Live Server** extension, OR
2. Run a local HTTP server inside the `SKYBOUND` folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser (requires an internet connection for the Three.js CDN import map).
