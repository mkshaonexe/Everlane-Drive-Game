# Slow Roads Clone - Product Requirements Document (PRD)

> **Goal**: Recreate a browser-based 3D driving game matching the visual quality and features of [slowroads.io](https://slowroads.io) using Three.js/WebGL without a traditional game engine.

![Reference](/C:/Users/MK%20Shaon/.gemini/antigravity/brain/9e6589a9-e694-4687-bc45-be492db008c4/uploaded_image_1769181597400.jpg)

---

## Executive Summary

This PRD outlines the complete development plan for recreating Slow Roads - a casual browser-based driving game featuring:
- **Procedurally generated infinite terrain and roads**
- **High-quality 3D graphics** (vegetation, lighting, shadows)
- **Realistic vehicle physics** with arcade feel
- **Dynamic weather and time-of-day systems**
- **Immersive audio design**
- **Clean, minimal HUD**

**Tech Stack**: Vite + React + TypeScript + Three.js (React Three Fiber)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: Core Engine](#2-phase-1-core-engine)
3. [Phase 2: Procedural Generation](#3-phase-2-procedural-generation)
4. [Phase 3: Vehicle System](#4-phase-3-vehicle-system)
5. [Phase 4: Graphics & Rendering](#5-phase-4-graphics--rendering)
6. [Phase 5: Audio System](#6-phase-5-audio-system)
7. [Phase 6: UI/UX](#7-phase-6-uiux)
8. [Step-by-Step Implementation Order](#8-step-by-step-implementation-order)
9. [Verification Plan](#9-verification-plan)

---

## 1. Architecture Overview

### Directory Structure

```
src/
├── core/                    # Core engine modules
│   ├── Engine.ts           # Main game loop
│   ├── ChunkManager.ts     # Terrain chunk loading/unloading
│   └── WorldGenerator.ts   # Procedural world generation
├── terrain/                 # Terrain generation
│   ├── TerrainChunk.ts     # Single terrain chunk
│   ├── NoiseGenerator.ts   # Perlin/Simplex noise
│   └── RoadGenerator.ts    # Road path generation
├── vehicle/                 # Vehicle system
│   ├── Vehicle.ts          # Vehicle entity
│   ├── VehiclePhysics.ts   # Physics simulation
│   ├── VehicleController.ts # Input handling
│   └── CameraController.ts # Follow camera
├── graphics/                # Rendering systems
│   ├── Lighting.ts         # Sun, ambient, shadows
│   ├── Vegetation.ts       # Trees, grass, bushes
│   ├── Weather.ts          # Fog, rain, clouds
│   ├── PostProcessing.ts   # Bloom, DOF, color grading
│   └── Shaders/            # Custom GLSL shaders
├── audio/                   # Audio system
│   ├── AudioManager.ts     # Central audio controller
│   ├── EngineAudio.ts      # Motor/engine sounds
│   └── AmbientAudio.ts     # Environment sounds
├── ui/                      # User interface
│   ├── HUD.tsx             # Speed, compass, controls
│   ├── SettingsMenu.tsx    # Graphics, audio settings
│   └── VehicleSelect.tsx   # Vehicle picker
├── stores/                  # State management (Zustand)
│   ├── gameStore.ts        # Game state
│   └── settingsStore.ts    # User settings
└── utils/                   # Utilities
    ├── math.ts             # Math helpers
    ├── pool.ts             # Object pooling
    └── constants.ts        # Game constants
```

### Core Technologies

| Technology | Purpose |
|------------|---------|
| **Three.js** | WebGL 3D rendering |
| **React Three Fiber** | React bindings for Three.js |
| **@react-three/drei** | Useful R3F helpers |
| **Zustand** | Lightweight state management |
| **GLSL Shaders** | Custom terrain, vegetation, post-processing |
| **Web Audio API** | Spatial audio, engine sounds |

---

## 2. Phase 1: Core Engine

### 2.1 Game Loop (`Engine.ts`)

```typescript
// Core responsibilities:
// - Fixed timestep physics (60Hz)
// - Variable render loop
// - Delta time management
// - Pause/Resume functionality
```

#### Implementation Steps:
1. Create `Engine.ts` with `useFrame` hook integration
2. Implement fixed timestep for physics (16.67ms)
3. Add pause/resume state management
4. Create performance monitoring (FPS counter)

### 2.2 Chunk Manager (`ChunkManager.ts`)

Manages loading/unloading terrain chunks based on vehicle position.

```typescript
interface Chunk {
  id: string;           // "x_z" format
  position: Vector3;    // World position
  terrain: Mesh;        // Terrain geometry
  road: Mesh;           // Road segment
  vegetation: Group;    // Trees, grass
  loaded: boolean;
}
```

#### Key Features:
- **View distance**: 5-10 chunks ahead
- **LOD levels**: 3 levels based on distance
- **Object pooling**: Reuse meshes for performance
- **Async loading**: Non-blocking chunk generation

---

## 3. Phase 2: Procedural Generation

### 3.1 Terrain Generation

#### Noise-Based Heightmap

```typescript
// NoiseGenerator.ts
class NoiseGenerator {
  // Multi-octave Simplex noise
  // Parameters: frequency, amplitude, octaves, persistence
  
  getHeight(x: number, z: number): number {
    let height = 0;
    let amplitude = 1;
    let frequency = 0.005;
    
    for (let i = 0; i < 6; i++) {
      height += simplex2D(x * frequency, z * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return height * 50; // Scale to world units
  }
}
```

#### Terrain Chunk Generation

1. Generate 64x64 vertex heightmap using noise
2. Apply biome-based modifications (forest, plains, hills)
3. Create BufferGeometry with position, normal, UV attributes
4. Apply terrain shader with texture splatting

### 3.2 Road Generation Algorithm

This is the **core innovation** of Slow Roads - procedural road that follows terrain naturally.

#### Algorithm Steps:

1. **Start Point**: Begin at chunk origin
2. **Direction Sampling**: Sample 5-7 directions ahead (10m increments)
3. **Cost Function**: Evaluate each direction:
   - Gradient penalty (prefer flat roads)
   - Curvature penalty (smooth turns)
   - Height variance penalty
   - Self-intersection avoidance
4. **Path Selection**: Choose lowest-cost direction
5. **Spline Fitting**: Fit Catmull-Rom spline through points
6. **Road Mesh**: Extrude road geometry along spline

```typescript
// RoadGenerator.ts
class RoadGenerator {
  generateRoadSegment(start: Vector3, direction: Vector3): RoadPath {
    const points: Vector3[] = [start];
    let currentDir = direction.clone();
    
    for (let i = 0; i < 100; i++) {
      const candidates = this.sampleDirections(currentDir, 7);
      const best = this.evaluateCandidates(candidates, points);
      points.push(best.point);
      currentDir = best.direction;
    }
    
    return new CatmullRomCurve3(points);
  }
}
```

#### Road Mesh Features:
- **Width**: 8-10m (two lanes)
- **Lane markings**: Dashed center line, edge lines
- **Curbs/Barriers**: On dangerous turns
- **Texture**: Asphalt with detail normals

---

## 4. Phase 3: Vehicle System

### 4.1 Vehicle Model

Create a sleek, modern EV-style vehicle (matching reference):

```typescript
// Vehicle geometry breakdown:
// - Body: StreamlinedGeometry or loaded GLTF
// - Wheels: CylinderGeometry with rim detail
// - Windows: Transparent material
// - Lights: Emissive materials + point lights
// - Interior: Basic dash, seats (visible through windows)
```

**Option A**: Procedural geometry (faster, lighter)
**Option B**: GLTF model (better detail, heavier)

Recommend: **Procedural for MVP, GLTF for polish**

### 4.2 Vehicle Physics

Implement arcade-style physics with realistic feel:

```typescript
// VehiclePhysics.ts
class VehiclePhysics {
  // State
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  angularVelocity: number;
  
  // Parameters
  maxSpeed = 50;        // m/s (~180 km/h)
  acceleration = 15;    // m/s²
  braking = 25;         // m/s²
  turnSpeed = 2.5;      // rad/s
  friction = 0.98;      // Ground friction
  
  update(delta: number, input: InputState) {
    // 1. Apply acceleration/braking
    // 2. Apply steering (speed-dependent)
    // 3. Apply gravity
    // 4. Ground collision with raycast
    // 5. Apply friction/drag
    // 6. Update position/rotation
  }
}
```

#### Key Physics Features:
- **Raycast ground detection**: 4 corners for stability
- **Speed-dependent steering**: Tighter at low speed
- **Smooth acceleration curves**: Easing functions
- **Drift mechanics**: Optional for fun
- **Suspension simulation**: Visual wheel bounce

### 4.3 Camera System

```typescript
// CameraController.ts
class CameraController {
  // Follow modes:
  // 1. Chase cam (default) - behind vehicle
  // 2. Hood cam - first person
  // 3. Orbit cam - cinematic
  
  followTarget(vehicle: Vehicle, delta: number) {
    const targetPos = vehicle.position
      .clone()
      .add(new Vector3(0, 3, 8).applyQuaternion(vehicle.rotation));
    
    // Smooth interpolation
    this.camera.position.lerp(targetPos, 5 * delta);
    this.camera.lookAt(vehicle.position);
  }
}
```

---

## 5. Phase 4: Graphics & Rendering

### 5.1 Lighting System

```typescript
// Lighting.ts
// Sun light (directional)
const sun = new DirectionalLight(0xffffff, 1.5);
sun.position.set(100, 100, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.far = 500;

// Ambient light (hemisphere)
const ambient = new HemisphereLight(0x87ceeb, 0x362a1a, 0.6);

// Time-of-day system
function updateLighting(timeOfDay: number) {
  // 0-24 hour cycle
  // Adjust sun position, color, intensity
  // Adjust ambient colors
  // Adjust sky gradient
}
```

### 5.2 Vegetation System

#### Instanced Trees

```typescript
// Vegetation.ts
class VegetationSystem {
  // Use InstancedMesh for performance
  // 1000+ trees per chunk
  
  createTreeInstances(chunk: Chunk, count: number) {
    const geometry = createTreeGeometry(); // Billboard or low-poly
    const material = new MeshStandardMaterial({ map: treeTexture });
    const mesh = new InstancedMesh(geometry, material, count);
    
    for (let i = 0; i < count; i++) {
      const position = getValidTreePosition(chunk);
      const scale = 0.8 + Math.random() * 0.4;
      const rotation = Math.random() * Math.PI * 2;
      
      const matrix = new Matrix4()
        .makeRotationY(rotation)
        .scale(new Vector3(scale, scale, scale))
        .setPosition(position);
      
      mesh.setMatrixAt(i, matrix);
    }
    
    return mesh;
  }
}
```

#### Tree Types (for autumn forest like reference):
1. **Birch trees**: White bark, yellow/orange leaves
2. **Oak trees**: Dark bark, red/brown leaves  
3. **Pine trees**: Evergreen accent
4. **Bushes**: Low shrubs along road

#### Grass System

```typescript
// Use instanced grass blades with wind animation
// Vertex shader for wind sway
// LOD: Full grass near, fade to ground texture far
```

### 5.3 Weather System

```typescript
// Weather.ts
interface WeatherState {
  fogDensity: number;     // 0-1
  cloudCover: number;     // 0-1
  rainIntensity: number;  // 0-1
  windSpeed: number;      // 0-20 m/s
}

// Fog implementation
scene.fog = new FogExp2(0x88a4bc, fogDensity);

// Volumetric clouds (optional)
// Use noise-based cloud shader
```

### 5.4 Post-Processing

```typescript
// PostProcessing.ts
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three/examples/jsm/postprocessing';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Bloom for sun, lights
composer.addPass(new UnrealBloomPass(resolution, 0.5, 0.4, 0.85));

// Optional: SSAO, DOF, Color Grading
```

### 5.5 Custom Shaders

#### Terrain Shader (Texture Splatting)

```glsl
// terrain.frag
uniform sampler2D grassTexture;
uniform sampler2D dirtTexture;
uniform sampler2D rockTexture;
uniform sampler2D splatMap;

void main() {
  vec4 splat = texture2D(splatMap, vUv);
  
  vec4 grass = texture2D(grassTexture, vUv * 50.0) * splat.r;
  vec4 dirt = texture2D(dirtTexture, vUv * 50.0) * splat.g;
  vec4 rock = texture2D(rockTexture, vUv * 50.0) * splat.b;
  
  gl_FragColor = grass + dirt + rock;
}
```

---

## 6. Phase 5: Audio System

### 6.1 Engine Audio

```typescript
// EngineAudio.ts
class EngineAudio {
  // Use Web Audio API
  private context: AudioContext;
  private engineSource: AudioBufferSourceNode;
  
  update(rpm: number, throttle: number) {
    // Pitch shift based on RPM
    this.engineSource.playbackRate.value = 0.5 + (rpm / 8000) * 1.5;
    
    // Volume based on throttle
    this.gainNode.gain.value = 0.3 + throttle * 0.7;
  }
}
```

### 6.2 Environmental Audio

```typescript
// AmbientAudio.ts
// - Wind (speed-dependent)
// - Birds (forest areas)
// - Tire on road (speed + surface)
// - Suspension (bumps)
```

---

## 7. Phase 6: UI/UX

### 7.1 HUD Design (Minimal)

Based on reference image:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  22.3                                     0.0   │
│  km/h          [steering indicator]   km total  │
│                                                 │
│  WORLD   STYLE   VEHICLE      AUTODRIVE   🔧   │
└─────────────────────────────────────────────────┘
```

```tsx
// HUD.tsx
function HUD() {
  const speed = useGameStore(s => s.speed);
  const distance = useGameStore(s => s.distance);
  
  return (
    <div className="hud">
      <div className="speed">{speed.toFixed(1)}</div>
      <SteeringIndicator />
      <div className="distance">{distance.toFixed(1)}</div>
      <nav className="controls">
        <button>WORLD</button>
        <button>STYLE</button>
        <button>VEHICLE</button>
        <button>AUTODRIVE</button>
      </nav>
    </div>
  );
}
```

### 7.2 Settings Menu

- **Graphics**: Quality preset, shadows, vegetation density
- **Audio**: Master, engine, ambient volumes
- **Controls**: Sensitivity, key bindings
- **Gameplay**: Units (km/h vs mph), autodrive speed

---

## 8. Step-by-Step Implementation Order

> [!IMPORTANT]
> Follow this order for smooth development. Each step depends on previous steps.

### Week 1-2: Foundation
1. ✅ Set up project (Vite + R3F) - DONE
2. ⬜ Create `NoiseGenerator.ts` with Simplex noise
3. ⬜ Create basic `TerrainChunk.ts` with heightmap
4. ⬜ Implement `ChunkManager.ts` for single chunk

### Week 3-4: Road System
5. ⬜ Create `RoadGenerator.ts` with path algorithm
6. ⬜ Generate road mesh from spline
7. ⬜ Add lane markings and road texture
8. ⬜ Integrate road with terrain (carve into heightmap)

### Week 5-6: Vehicle
9. ⬜ Create procedural vehicle geometry
10. ⬜ Implement `VehiclePhysics.ts`
11. ⬜ Add `CameraController.ts` chase cam
12. ⬜ Refine controls and feel

### Week 7-8: Graphics Polish
13. ⬜ Implement lighting and shadows
14. ⬜ Add instanced vegetation (trees, grass)
15. ⬜ Create weather system (fog)
16. ⬜ Add post-processing effects

### Week 9-10: Audio & UI
17. ⬜ Implement engine audio
18. ⬜ Add ambient sounds
19. ⬜ Create HUD components
20. ⬜ Add settings menu

### Week 11-12: Polish & Optimization
21. ⬜ Optimize chunk loading (async, pooling)
22. ⬜ Add LOD for terrain and vegetation
23. ⬜ Performance profiling and fixes
24. ⬜ Final polish and bug fixes

---

## 9. Verification Plan

### Automated Tests

```bash
# Run unit tests
npm run test

# Run build verification
npm run build
```

### Manual Verification Checklist

#### Terrain Generation
- [ ] Terrain generates smoothly without gaps
- [ ] Height variation looks natural
- [ ] No z-fighting or visual artifacts

#### Road System
- [ ] Road follows terrain contours
- [ ] No sharp turns or impossible gradients
- [ ] Lane markings render correctly
- [ ] Road connects between chunks seamlessly

#### Vehicle
- [ ] Vehicle responds to WASD/Arrow keys
- [ ] Speed increases/decreases smoothly
- [ ] Vehicle stays on ground
- [ ] Camera follows vehicle smoothly

#### Graphics
- [ ] Shadows cast correctly
- [ ] Trees render with proper LOD
- [ ] Fog fades distant objects
- [ ] 60 FPS on mid-range hardware

#### Audio
- [ ] Engine pitch changes with speed
- [ ] No audio clipping or distortion
- [ ] Ambient sounds play correctly

### Browser Testing

Run dev server and verify in:
```bash
npm run dev
```
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

---

## Appendix: File Creation Checklist

### New Files to Create

```
src/
├── core/
│   ├── Engine.ts              ⬜
│   ├── ChunkManager.ts        ⬜
│   └── WorldGenerator.ts      ⬜
├── terrain/
│   ├── TerrainChunk.ts        ⬜
│   ├── NoiseGenerator.ts      ⬜
│   └── RoadGenerator.ts       ⬜
├── vehicle/
│   ├── VehicleModel.ts        ⬜
│   ├── VehiclePhysics.ts      ⬜ (refactor existing)
│   ├── VehicleController.ts   ⬜ (refactor existing)
│   └── CameraController.ts    ⬜
├── graphics/
│   ├── Lighting.ts            ⬜
│   ├── Vegetation.ts          ⬜
│   ├── Weather.ts             ⬜
│   └── PostProcessing.ts      ⬜
├── audio/
│   ├── AudioManager.ts        ⬜
│   ├── EngineAudio.ts         ⬜
│   └── AmbientAudio.ts        ⬜
├── ui/
│   ├── HUD.tsx                ⬜
│   ├── SettingsMenu.tsx       ⬜
│   └── SteeringIndicator.tsx  ⬜
├── stores/
│   ├── gameStore.ts           ⬜
│   └── settingsStore.ts       ⬜
└── utils/
    ├── math.ts                ⬜
    ├── pool.ts                ⬜
    └── constants.ts           ⬜
```

### Dependencies to Add

```bash
npm install simplex-noise three-stdlib postprocessing howler
```

---

## Summary

This PRD provides a complete roadmap to recreate Slow Roads with:

1. **Procedural infinite terrain** using noise-based generation
2. **Intelligent road generation** following natural terrain contours
3. **Arcade vehicle physics** with realistic feel
4. **High-quality graphics** including vegetation, lighting, weather
5. **Immersive audio** with engine and ambient sounds
6. **Clean minimal UI** matching the original game

**Estimated Development Time**: 10-12 weeks for full implementation

**Priority Order**: Terrain → Road → Vehicle → Graphics → Audio → UI
