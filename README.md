# Slow Roads Recreation

A high-fidelity recreation of the browser-based 3D driving game [slowroads.io](https://slowroads.io), built with **React**, **Three.js (React Three Fiber)**, and **TypeScript**.

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

## 🚗 Project Overview

This project aims to replicate the minimalist, soothing, yet technically complex experience of driving through infinite procedural landscapes. It focuses on high-quality rendering, smooth vehicle physics, and intelligent world generation.

### Key Features

-   **Infinite Procedural Terrain**: Landscape generated on-the-fly using multi-octave noise.
-   **Procedural Road System**: Intelligent road paths that follow terrain contours naturally.
-   **Arcade-Realistic Physics**: Vehicle dynamics with throttle, braking, and steering.
-   **Dynamic Environment**: Lighting, weather (fog), and vegetation systems.
-   **Minimal HUD**: A clean, immersive user interface.

## 🏗️ Technical Architecture

The project is structured into modular systems:

-   **`src/core`**: Main game engine and world managers.
-   **`src/terrain`**: Noise-based heightmaps and road generation algorithms.
-   **`src/vehicle`**: Physics, control logic, and camera systems.
-   **`src/graphics`**: Lighting, weather, vegetation, and post-processing.
-   **`src/ui`**: React-based HUD and menus.
-   **`src/stores`**: State management using Zustand.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/slow-roads-recreation.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🛠️ Current Status

- [x] Core Engine Loop
- [x] Basic Procedural Terrain (Heightmap)
- [x] Vehicle Physics & Controls
- [x] Basic Lighting & Fog
- [/] Procedural Road Path Generation (In Progress)
- [/] Vegetation System (In Progress)
- [/] HUD & Menu Overlays (In Progress)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details. (Note: Asset credits to original Slow Roads developers where applicable).

