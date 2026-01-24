# Slow Roads Recreation

A high-fidelity recreation of the browser-based 3D driving game [slowroads.io](https://slowroads.io), built with **React**, **Three.js (React Three Fiber)**, and **TypeScript**.

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

## 🚗 Project Overview

This project aims to replicate the minimalist, soothing, yet technically complex experience of driving through infinite procedural landscapes. It focuses on high-quality rendering, smooth vehicle physics, and intelligent world generation. The infinite terrain generator uses multi-octave noise to create varied landscapes, while the road system adapts dynamically to the terrain contours.

## 🏗️ Technical Architecture

The project is structured into modular systems for maintainability and scalability:

-   **`src/core`**: Main game engine loop, world management, and dynamic loading.
-   **`src/terrain`**: Procedural generation logic using Simplex noise for heightmaps and infinite chunk management.
-   **`src/vehicle`**: The "Care Model" - Physics engine, vehicle controller, and camera logic.
-   **`src/graphics`**: Visual systems including mood lighting, dynamic weather (fog, time of day), and vegetation rendering.
-   **`src/ui`**: React-based HUD overlay, menus, and debug tools.
-   **`src/stores`**: State management using Zustand for high-frequency game data.

## 🏎️ Care Model (Vehicle Physics & Implementation)

The vehicle implementation (The "Care Model") is designed to balance arcade fun with realistic weight and suspension feel.

### Physics Engine (`VehiclePhysics.ts`)
The car allows for a "semi-arcade" driving feel using a custom raycast suspension system rather than a generic physics engine body.
-   **Raycast Suspension**: 4-wheel independent rays cast downwards to detect terrain height.
-   **Spring-Damper Model**: Calculates compression forces ($F = kx - dv$) to simulate suspension travel and bounce.
-   **Gravity & Ground Detection**: Applies gravity when airborne; implements a safety net to respawn the car if it falls through the map.

### Driving Dynamics
-   **Variable Acceleration**:
    -   **Linear input**: Gentle acceleration for cruising.
    -   **Shift modifier**: Aggressive power delivery for racing.
-   **Braking ('S' Key)**:
    -   At speed: Applies strong braking force.
    -   At standstill: Transitions to reverse gear (smart shifting).
-   **Handbrake (Space)**: Applies immediate, strong deceleration force for drifting or emergency stops.
-   **Off-Road Penalties**: Driving off the road surface reduces speed cap by 40% and reduces handling (turn speed) to simulate traction loss.

### Available Vehicles
- **Standard EV**: Balanced performance, modern look.
- **Drift King**: Tuned for sliding, higher torque.
- **Storm**: Heavy duty, stable tracking.
- **Lightning**: High top speed, aggressive aero.

### Controls
-   **W**: Throttle (Forward)
-   **S**: Brake / Reverse
-   **A / D**: Steer Left / Right
-   **Space**: Handbrake
-   **Shift**: Turbo Boost
-   **R**: Respawn on track

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
- [x] Infinite Procedural Terrain
- [x] Advanced Vehicle Physics ("Care Model")
- [x] Dynamic Lighting & Fog
- [/] Procedural Road Path Generation (In Progress)
- [/] Vegetation System (In Progress)

## 📄 License

MIT License.
Asset credits belong to their respective creators. Original concept by [slowroads.io](https://slowroads.io).
