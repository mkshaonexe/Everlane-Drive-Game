# 🚗 Everlane Drive

A high-fidelity browser-based 3D driving game built with **React**, **Three.js (React Three Fiber)**, and **TypeScript**.

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev)
[![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deploy to GitHub Pages](https://github.com/mkshaonexe/Everlane-Drive-Game/actions/workflows/deploy.yml/badge.svg)](https://github.com/mkshaonexe/Everlane-Drive-Game/actions/workflows/deploy.yml)

## 🎮 Play Live Demo
👉 **[Everlane Drive Game Live Demo](https://mkshaonexe.github.io/Everlane-Drive-Game/)**

---

## 🏎️ Features & Highlights

- **Infinite Procedural Terrain**: Dynamic chunk generation using multi-octave Simplex noise for organic-feeling hills and valleys.
- **Adaptive Road Network**: A procedural road pathing system that conforms to terrain elevations.
- **Realistic Vehicle Physics**: 
  - Independent 4-wheel raycast suspension model.
  - Spring-damper physics ($F = kx - dv$) for natural body roll, weight distribution, and damping.
  - Variable throttle with Turbo Boost (`Shift`).
  - Active handbrake drifting.
  - Off-road friction/handling penalty system.
- **Garage Vehicle Selector**:
  - Interactive 3D showroom to select and configure different vehicle classes.
  - Real-time animated loading screen showing the asset downloading progress, size, and status.
  - Automatic suspension stabilization when showcasing cars in the garage.
- **Atmospheric Environments**: Mood lighting, fog, and custom sky boxes depending on the selected track.

---

## 🛠️ Technical Architecture

The project is structured into modular systems for maintainability and scalability:

- **`src/core`**: Main game engine loop, world management, and dynamic loading.
- **`src/terrain`**: Procedural generation logic using Simplex noise for heightmaps and infinite chunk management.
- **`src/vehicle`**: The vehicle physics engine, steering controls, and custom spring-damper suspension solver.
- **`src/graphics`**: Lighting, environment controls, fog, and foliage systems.
- **`src/ui`**: React HUD overlay, map settings menu, vehicle selection screen, and assets preloader.
- **`src/stores`**: High-frequency physics and game state using Zustand.

---

## 🎹 Keyboard Controls

| Key | Action |
| --- | --- |
| **W** | Throttle (Forward) |
| **S** | Brake / Reverse |
| **A / D** | Steer Left / Right |
| **Space** | Handbrake (Drift) |
| **Shift** | Turbo Boost |
| **R** | Respawn on Track |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mkshaonexe/Everlane-Drive-Game.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

MIT License.
Asset credits belong to their respective creators. Original concept inspired by [slowroads.io](https://slowroads.io).
