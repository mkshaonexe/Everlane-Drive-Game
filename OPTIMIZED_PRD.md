# Slow Roads Recreation - Complete Game PRD & Fix Plan

> **Goal**: Transform the current prototype into a production-level browser-based 3D driving game matching the visual quality and gameplay of [slowroads.io](https://slowroads.io)

![Reference Image](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/image.png)

---

## Executive Summary

This PRD provides a comprehensive analysis of the current codebase, identifies all critical issues, and outlines the complete implementation plan to achieve a production-quality Slow Roads clone.

### Current State Assessment: ⚠️ PROTOTYPE (40% Complete)

| Component | Status | Issues |
|-----------|--------|--------|
| **Terrain Generation** | 🟡 Partial | Basic heightmap works, no biomes |
| **Road System** | 🔴 Critical | Tube geometry instead of flat road, not integrated with terrain |
| **Vehicle Physics** | 🔴 Critical | Car floats, not constrained to road, flies into sky on collision |
| **Vehicle Model** | 🟡 Partial | Box-based, not matching reference (sleek white car) |
| **Vegetation** | 🔴 Critical | Simple green cones, not autumn birch/aspen trees |
| **Chunk Manager** | 🔴 Critical | Hardcoded 5 chunks, no dynamic loading |
| **Graphics** | 🟡 Partial | Basic lighting, fog, no post-processing |
| **Audio** | 🟡 Partial | Basic engine sound, needs improvement |
| **HUD** | 🟢 Good | Speed/distance display works |

---

## Critical Issues Identified

### 🔴 Issue #1: Car Not on Road (HIGHEST PRIORITY)

**Problem**: The car spawns at position `[0, 10, 0]` and falls based on raycast to terrain, but:
1. Road uses `TubeGeometry` which creates a cylindrical tube, not a flat drivable surface
2. Car raycasts to terrain mesh but not specifically to road surface
3. No mechanism to keep car on road or apply different friction on/off road

**Current Code** (`RoadMesh.tsx:11`):
```tsx
<tubeGeometry args={[path, 64, 4, 8, false]} />  // Creates a TUBE, not flat road!
```

**Solution**: Replace with proper flat road mesh using `ExtrudeGeometry` or custom ribbon geometry along the spline path.

---

### 🔴 Issue #2: Physics Allows Flying & Falling Through World

**Problem** (`VehiclePhysics.ts`):
1. Single raycast from center - car can tip and fall
2. No 4-corner ground detection for stability
3. No speed reduction off-road
4. Car can accelerate into sky after hitting obstacles
5. No collision with road barriers/curbs

**Solution**:
1. Implement 4-corner raycast suspension system
2. Add road surface detection (is car on road?)
3. Apply friction multiplier: road=1.0, grass/dirt=0.5
4. Add proper collision bounds to prevent flying

---

### 🔴 Issue #3: Vegetation Doesn't Match Reference

**Problem** (`Vegetation.tsx`):
- Uses simple green `ConeGeometry` (pine tree shape)
- Reference shows **autumn birch/aspen forest** with:
  - White bark trunks
  - Yellow/orange foliage
  - Fallen leaves on ground
  - Mixed vegetation density

**Current Code**:
```tsx
const geometry = useMemo(() => new ConeGeometry(1, 4, 8), []);
const material = useMemo(() => new MeshStandardMaterial({ color: '#2d4c1e' }), []);
```

**Solution**: Create proper tree models with:
- Cylindrical white trunk
- Billboard or instanced leaf geometry with autumn colors
- Ground cover with fallen leaves texture

---

### 🔴 Issue #4: No Infinite Road Generation

**Problem**:
- Road is generated once at startup with fixed 400m length
- ChunkManager exists but doesn't dynamically load/unload
- Only 5 hardcoded terrain chunks

**Solution**:
1. Generate road procedurally ahead of player
2. Dynamic chunk loading based on vehicle position
3. Seamless chunk transitions

---

### 🟡 Issue #5: Vehicle Model Not Matching Reference

**Problem** (`VehicleModel.tsx`):
- Current: Dark gray box-based "Cybertruck" style
- Reference: Sleek white sports car with smooth curves

**Solution**: Create new procedural vehicle with:
- White body color
- Aerodynamic shape
- Proper hood/trunk/roof contours
- Realistic wheel proportions

---

### 🟡 Issue #6: Road Not Integrated with Terrain

**Problem**:
- Road floats above terrain or cuts through hills
- No terrain carving where road passes
- No smooth blending at road edges

**Solution**:
1. Flatten terrain under road path
2. Create road shoulders with gradual slope
3. Blend road texture with terrain at edges

---

## Proposed Implementation Phases

### Phase 1: Fix Road Geometry (Critical Path)

This is the **MOST CRITICAL** fix - without proper road, nothing else works.

---

#### [MODIFY] [RoadMesh.tsx](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/slow-roads-recreation/src/terrain/RoadMesh.tsx)

**Replace tube geometry with flat ribbon road:**

```typescript
// Create flat road mesh from path
function createRoadGeometry(path: CatmullRomCurve3, width: number = 8): BufferGeometry {
    const points = path.getPoints(200);
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const tangent = path.getTangentAt(i / (points.length - 1));
        
        // Calculate perpendicular direction (cross with up)
        const up = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(tangent, up).normalize();
        
        // Left and right edge points
        const left = point.clone().add(right.clone().multiplyScalar(-width / 2));
        const rightPt = point.clone().add(right.clone().multiplyScalar(width / 2));
        
        // Add vertices
        positions.push(left.x, left.y + 0.1, left.z);
        positions.push(rightPt.x, rightPt.y + 0.1, rightPt.z);
        
        // UVs for road texture
        uvs.push(0, i / (points.length - 1) * 10);
        uvs.push(1, i / (points.length - 1) * 10);
        
        // Create triangles
        if (i > 0) {
            const idx = (i - 1) * 2;
            indices.push(idx, idx + 1, idx + 2);
            indices.push(idx + 1, idx + 3, idx + 2);
        }
    }
    
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}
```

---

### Phase 2: Fix Vehicle Physics (Critical Path)

---

#### [MODIFY] [VehiclePhysics.ts](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/slow-roads-recreation/src/vehicle/VehiclePhysics.ts)

**Add 4-corner suspension and road detection:**

Key changes:
1. Add `wheelPositions` array for 4 corners
2. Raycast from each wheel position
3. Calculate average ground height and surface normal
4. Detect if on road (raycast hits road mesh vs terrain)
5. Apply different friction: road=1.0, off-road=0.5
6. Reduce speed when off-road
7. Add proper gravity clamping to prevent flying

---

### Phase 3: Autumn Forest Vegetation

---

#### [MODIFY] [Vegetation.tsx](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/slow-roads-recreation/src/graphics/Vegetation.tsx)

**Create autumn birch/aspen trees:**

```typescript
// Birch tree with white trunk and autumn leaves
function createBirchTree(): Group {
    const tree = new Group();
    
    // White bark trunk
    const trunk = new Mesh(
        new CylinderGeometry(0.15, 0.2, 6, 8),
        new MeshStandardMaterial({ color: '#f5f5f0', roughness: 0.9 })
    );
    trunk.position.y = 3;
    tree.add(trunk);
    
    // Autumn foliage (billboard or instanced spheres)
    const foliage = new Mesh(
        new SphereGeometry(2.5, 8, 6),
        new MeshStandardMaterial({ 
            color: '#d4a52c', // Golden yellow
            roughness: 0.8,
            side: DoubleSide
        })
    );
    foliage.position.y = 6;
    foliage.scale.set(1, 0.7, 1);
    tree.add(foliage);
    
    return tree;
}
```

**Tree color palette:**
- Birch leaves: `#d4a52c` (golden), `#c97a2c` (orange)
- Ground cover: `#8b4513` (fallen leaves), `#d2691e` (orange leaves)

---

### Phase 4: Dynamic Chunk Loading

---

#### [MODIFY] [ChunkManager.ts](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/slow-roads-recreation/src/core/ChunkManager.ts)

**Implement proper infinite generation:**

```typescript
export class ChunkManager {
    private chunks: Map<string, ChunkData> = new Map();
    private viewDistance = 3; // Chunks in each direction
    
    update(playerPosition: Vector3): ChunkUpdate {
        const playerChunk = this.getChunkCoord(playerPosition);
        const chunksToLoad: Vector3[] = [];
        const chunksToUnload: string[] = [];
        
        // Find chunks that need loading
        for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
            for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
                const chunkId = `${playerChunk.x + dx}_${playerChunk.z + dz}`;
                if (!this.chunks.has(chunkId)) {
                    chunksToLoad.push(new Vector3(
                        (playerChunk.x + dx) * CHUNK_SIZE,
                        0,
                        (playerChunk.z + dz) * CHUNK_SIZE
                    ));
                }
            }
        }
        
        // Find chunks that need unloading
        for (const [chunkId, chunk] of this.chunks) {
            const dist = this.getChunkDistance(chunkId, playerChunk);
            if (dist > this.viewDistance + 1) {
                chunksToUnload.push(chunkId);
            }
        }
        
        return { chunksToLoad, chunksToUnload };
    }
}
```

---

### Phase 5: White Sports Car Model

---

#### [MODIFY] [VehicleModel.tsx](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/slow-roads-recreation/src/vehicle/VehicleModel.tsx)

**Create sleek white sports car matching reference:**

- Body color: `#f0f0f0` (off-white/light gray)
- Smooth aerodynamic shape
- Proper roof curve
- Visible rear window
- Red taillights strip

---

### Phase 6: Terrain-Road Integration

---

#### [MODIFY] [RoadGenerator.ts](file:///e:/Cursor%20Play%20ground/SLOWREADGMAE%20CLODE/slow-roads-recreation/src/terrain/RoadGenerator.ts)

**Add terrain flattening under road:**

The road generator should output a "road mask" that the terrain uses to:
1. Flatten height under road path
2. Create smooth road shoulders
3. Prevent vegetation spawning on road

---

## New Files Required

| File | Purpose |
|------|---------|
| `[NEW] src/terrain/RoadSurface.tsx` | Flat ribbon road with lane markings |
| `[NEW] src/vehicle/WheelPhysics.ts` | 4-wheel suspension raycasting |
| `[NEW] src/graphics/TreeModels.ts` | Autumn birch/aspen tree generation |
| `[NEW] src/graphics/GroundCover.tsx` | Fallen leaves, grass blades |
| `[NEW] src/utils/RoadMask.ts` | Road area detection for terrain/vegetation |

---

## Verification Plan

### Automated Verification

```bash
# Build verification (ensures no TypeScript errors)
npm run build

# Lint verification
npm run lint
```

### Manual Verification Checklist

After implementation, verify in browser at `http://localhost:5173`:

#### Phase 1: Road Geometry
- [ ] Road appears as flat surface (not tube)
- [ ] Road follows terrain contours
- [ ] Road has visible asphalt texture/color

#### Phase 2: Vehicle Physics
- [ ] Car spawns ON the road, not floating
- [ ] Car wheels appear to touch ground
- [ ] Driving off-road slows the car
- [ ] Car cannot fly into sky when hitting obstacles
- [ ] Car stays grounded on hills/slopes

#### Phase 3: Vegetation
- [ ] Trees have white birch trunks
- [ ] Foliage is yellow/orange (autumn colors)
- [ ] Trees don't spawn on road
- [ ] Dense forest on both sides of road

#### Phase 4: Infinite Generation
- [ ] New terrain chunks load as you drive forward
- [ ] Road continues infinitely
- [ ] No visible loading hitches/freezes

#### Phase 5: Vehicle Model
- [ ] Car is white/light gray color
- [ ] Car has aerodynamic shape
- [ ] Car matches reference image style

#### Overall Game Feel
- [ ] Matches the aesthetic of reference image
- [ ] Smooth 60 FPS gameplay
- [ ] Immersive driving experience

---

## Implementation Order (Priority)

> [!IMPORTANT]
> Follow this order - each step enables the next.

### Sprint 1: Core Drivability (CRITICAL)
1. **Fix RoadMesh.tsx** - Replace tube with flat ribbon geometry
2. **Fix VehiclePhysics.ts** - Add road surface detection + off-road friction
3. **Fix vehicle spawn position** - Start on road at correct height

### Sprint 2: Visual Quality
4. **Fix Vegetation.tsx** - Autumn birch trees
5. **Fix VehicleModel.tsx** - White sports car
6. **Add fallen leaves ground texture**

### Sprint 3: Infinite World
7. **Fix ChunkManager.ts** - Dynamic loading/unloading
8. **Extend RoadGenerator.ts** - Continuous generation ahead of player
9. **Optimize for performance**

### Sprint 4: Polish
10. **Add road lane markings**
11. **Improve lighting for golden hour feel**
12. **Add ambient audio (birds, wind)**
13. **Performance optimization**

---

## Summary

The current prototype has the basic structure but critical issues prevent it from being playable:

1. **Road is a tube, not flat surface** → Car can't drive on it properly
2. **Physics don't constrain car to ground** → Car flies into sky
3. **Vegetation is wrong type** → Green cones instead of autumn forest
4. **No infinite generation** → Limited play area

By following this PRD's implementation phases in order, the game will transform from a broken prototype into a polished, production-quality Slow Roads clone matching the reference image.

**Estimated Implementation Time**: 2-3 weeks for full implementation
