# Blueprint3D Architecture Guide

> **Last Updated:** December 25, 2025  
> **Project:** GP Demo - 3D Interior Design Application

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Core Modules](#core-modules)
4. [File Relationships & Data Flow](#file-relationships--data-flow)
5. [Build System](#build-system)
6. [Key Classes & Their Responsibilities](#key-classes--their-responsibilities)

---

## Project Overview

Blueprint3D is a **TypeScript/JavaScript library** for creating interactive 3D interior design applications. Users can:

1. Draw 2D floor plans (walls, rooms)
2. View the floor plan extruded into 3D
3. Place furniture items in the 3D scene
4. Apply textures to walls and floors
5. Save/load designs as JSON files

**Technology Stack:**
- **Language:** TypeScript (compiled to ES5 JavaScript)
- **3D Engine:** Three.js
- **DOM/Events:** jQuery
- **Build Tool:** Grunt
- **Styling:** Bootstrap CSS

---

## Directory Structure

```
GP Demo/
├── src/                    # 🔹 Core TypeScript source code
│   ├── blueprint3d.ts      # Main entry point
│   ├── core/               # Utilities, configuration, logging
│   ├── floorplanner/       # 2D floor plan editor
│   ├── items/              # Furniture/object system
│   ├── model/              # Data models (walls, rooms, corners)
│   └── three/              # 3D rendering with Three.js
│
├── lib/                    # 🔸 Legacy TypeScript definitions
│   ├── jquery.d.ts         # jQuery type definitions
│   └── three.d.ts          # Three.js type definitions
│
├── dist/                   # 🔸 Build output (generated)
│   ├── blueprint3d.js      # Compiled library
│   ├── blueprint3d.d.ts    # Generated type definitions
│   └── blueprint3d.js.map  # Source map
│
├── example/                # 🔹 Demo application
│   ├── index.html          # Main HTML page
│   ├── css/                # Stylesheets (Bootstrap + custom)
│   ├── fonts/              # Glyphicons for Bootstrap
│   ├── js/                 # JavaScript files
│   │   ├── blueprint3d.js  # Copied from dist/
│   │   ├── three.min.js    # Three.js library
│   │   ├── jquery.js       # jQuery library
│   │   ├── bootstrap.js    # Bootstrap JS
│   │   ├── example.js      # Demo app logic
│   │   └── items.js        # Furniture catalog
│   ├── models/             # 3D furniture models (.js format)
│   │   ├── js/             # Model geometry files
│   │   └── thumbnails/     # Item preview images
│   └── rooms/              # Room textures
│       ├── textures/       # Wall/floor texture images
│       └── thumbnails/     # Texture previews
│
├── node_modules/           # npm dependencies
├── package.json            # npm configuration
├── gruntfile.js            # Build configuration
├── README.md               # Project documentation
├── LICENSE.txt             # MIT License
└── .gitignore              # Git ignore rules
```

---

## Core Modules

### 1. `src/core/` — Shared Utilities

| File | Responsibility |
|------|----------------|
| `configuration.ts` | Global settings: wall height (250cm), thickness (10cm), dimension units |
| `dimensioning.ts` | Unit conversion utilities (cm to inches, feet, etc.) |
| `log.ts` | Logging system with levels (Info, Warning, Error, Fatal, Debug) and contexts |
| `utils.ts` | Geometry math: point-in-polygon, line intersections, distance calculations |
| `version.ts` | Library version information |

### 2. `src/model/` — Data Layer

| File | Responsibility |
|------|----------------|
| `model.ts` | **Coordinator** — Connects Floorplan with Scene, handles serialization |
| `floorplan.ts` | Manages walls, corners, and rooms. Contains room detection algorithm |
| `wall.ts` | Wall entity: start/end corners, thickness, height, textures, attached items |
| `corner.ts` | Corner entity: 2D position, connected walls, snapping logic |
| `room.ts` | Room entity: corner list, floor plane, texture management |
| `half_edge.ts` | Doubly-Connected Edge List (DCEL) for wall/room topology |
| `scene.ts` | Wrapper for THREE.Scene, manages item loading and lifecycle |

### 3. `src/floorplanner/` — 2D Editor

| File | Responsibility |
|------|----------------|
| `floorplanner.ts` | **Controller** — Handles mouse events, modes (Move/Draw/Delete), wall creation |
| `floorplanner_view.ts` | **View** — Canvas rendering: grid, rooms, walls, corners, labels |

### 4. `src/three/` — 3D Visualization

| File | Responsibility |
|------|----------------|
| `main.ts` | **Entry Point** — Sets up WebGL renderer, camera, animation loop |
| `controller.ts` | Mouse interaction: item selection, dragging, rotating, state machine |
| `controls.ts` | Camera controls: orbit, pan, zoom (modified THREE.OrbitControls) |
| `edge.ts` | Renders 3D wall geometry with textures and visibility culling |
| `floor.ts` | Renders floor planes with textures |
| `floorplan.ts` | Creates 3D representation from model floorplan |
| `lights.ts` | Scene lighting setup |
| `skybox.ts` | Background environment |
| `hud.ts` | Heads-up display for rotation controls |

### 5. `src/items/` — Object System

| File | Responsibility |
|------|----------------|
| `item.ts` | **Abstract Base** — Hover, selection, drag, rotate, resize, error glow |
| `factory.ts` | Creates item instances by type ID |
| `floor_item.ts` | Items on floor: position validation, room bounds checking |
| `wall_item.ts` | Items on walls: rotation alignment, wall attachment |
| `in_wall_item.ts` | Items in walls: windows, doors (creates holes in wall geometry) |
| `on_floor_item.ts` | Floor items that don't obstruct others |
| `wall_floor_item.ts` | Items touching both wall and floor |
| `in_wall_floor_item.ts` | In-wall items that also touch floor (doors) |
| `metadata.ts` | Item metadata interface |

---

## File Relationships & Data Flow

### Initialization Flow

```
index.html
    └── loads example.js
            └── creates BP3D.Blueprint3d(options)
                    ├── new Model.Model(textureDir)
                    │       ├── new Floorplan()
                    │       └── new Scene(model, textureDir)
                    │
                    ├── new Three.Main(model, element, canvas, opts)
                    │       ├── new Three.Controls(camera, domElement)
                    │       ├── new Three.Controller(...)
                    │       ├── new Three.Lights(scene, floorplan)
                    │       ├── new Three.Floorplan(scene, floorplan, controls)
                    │       └── starts animation loop
                    │
                    └── new Floorplanner.Floorplanner(canvas, floorplan)
                            └── new FloorplannerView(floorplan, viewmodel, canvas)
```

### 2D to 3D Update Flow

```
User draws wall in 2D Floorplanner
    │
    ▼
floorplanner.ts (mouseup)
    └── floorplan.newWall(startCorner, endCorner)
            │
            ▼
        floorplan.ts (update)
            ├── findRooms() → detects closed polygons
            ├── creates Room objects
            └── fires updated_rooms callback
                    │
                    ▼
                Three.Floorplan (callback)
                    └── rebuilds 3D wall edges
                            │
                            ▼
                        edge.ts (updatePlanes)
                            └── creates THREE.Mesh geometry
```

### Item Placement Flow

```
User clicks "Add Item" in sidebar
    │
    ▼
example.js (initItems mousedown)
    └── scene.addItem(itemType, modelUrl, metadata)
            │
            ▼
        scene.ts (addItem)
            └── loader.load(fileName, callback)
                    │
                    ▼
                Factory.getClass(itemType) → returns item class
                    └── new FloorItem/WallItem/etc(...)
                            │
                            ▼
                        item.initObject()
                            └── placeInRoom()
```

### Key Callback Connections

| Publisher | Event | Subscribers |
|-----------|-------|-------------|
| `Floorplan` | `roomLoadedCallbacks` | Floorplanner.reset(), Three.Main |
| `Floorplan` | `updated_rooms` | Three.Floorplan (rebuild 3D) |
| `Wall` | `moved_callbacks` | Connected edges/corners |
| `Scene` | `itemLoadedCallbacks` | Controller (auto-select), ModalEffects |
| `Controls` | `cameraMovedCallbacks` | Edge (visibility check) |
| `Three.Main` | `itemSelectedCallbacks` | ContextMenu, TextureSelector |

---

## Build System

### Grunt Tasks (gruntfile.js)

```bash
# Default: Compile TypeScript + copy to example/
grunt

# Debug: Compile TypeScript only
grunt debug

# Example: Copy files to example folder
grunt example

# Release: Clean + compile + minify + generate docs
grunt release
```

### Build Output

1. **Source:** `src/**/*.ts`
2. **Compiled:** `dist/blueprint3d.js`
3. **Copied to:** `example/js/blueprint3d.js`

### Dependencies (package.json)

| Package | Purpose |
|---------|---------|
| `three` | 3D graphics library |
| `grunt` | Task runner |
| `grunt-typescript` | TypeScript compilation |
| `grunt-typedoc` | Documentation generation |
| `grunt-contrib-uglify` | Minification |
| `grunt-contrib-copy` | File copying |
| `grunt-contrib-clean` | Cleanup |

---

## Key Classes & Their Responsibilities

### Central Coordinator: `Model`

```typescript
class Model {
    floorplan: Floorplan;  // 2D wall/room data
    scene: Scene;          // 3D items collection
    
    loadSerialized(json);  // Load design from JSON
    exportSerialized();    // Save design to JSON
}
```

### 2D Data: `Floorplan`

```typescript
class Floorplan {
    corners: Corner[];
    walls: Wall[];
    rooms: Room[];
    
    newCorner(x, y);
    newWall(start, end);
    update();              // Recalculate rooms
    findRooms(corners);    // Room detection algorithm
}
```

### 3D Rendering: `Three.Main`

```typescript
var Main = function(model, element, canvasElement, opts) {
    // Properties
    controls: Controls;
    
    // Methods
    centerCamera();
    updateWindowSize();
    needsUpdate();
    dataUrl();             // Export canvas as image
}
```

### Item Base: `Item`

```typescript
abstract class Item extends THREE.Mesh {
    // State
    hover: boolean;
    selected: boolean;
    fixed: boolean;
    
    // Abstract (implemented by subclasses)
    placeInRoom();
    isValidPosition(vec3);
    resized();
    
    // Interaction
    mouseOver() / mouseOff();
    clickPressed() / clickDragged() / clickReleased();
    rotate(intersection);
}
```

---

## Module Namespace Structure

```
BP3D
├── Core
│   ├── Configuration
│   ├── Dimensioning
│   ├── Utils
│   └── log(), isLogging()
│
├── Model
│   ├── Model
│   ├── Floorplan
│   ├── Scene
│   ├── Wall
│   ├── Room
│   ├── Corner
│   └── HalfEdge
│
├── Floorplanner
│   ├── Floorplanner
│   ├── FloorplannerView
│   └── floorplannerModes
│
├── Three
│   ├── Main
│   ├── Controller
│   ├── Controls
│   ├── Edge
│   ├── Floor
│   ├── Floorplan
│   ├── Lights
│   ├── Skybox
│   └── HUD
│
└── Items
    ├── Item
    ├── Factory
    ├── FloorItem
    ├── WallItem
    ├── InWallItem
    ├── OnFloorItem
    ├── WallFloorItem
    └── InWallFloorItem
```

---

## Quick Reference: Where to Find Things

| If you want to... | Look in... |
|-------------------|------------|
| Change wall default height | `src/core/configuration.ts` |
| Modify 2D drawing behavior | `src/floorplanner/floorplanner.ts` |
| Change 2D visual appearance | `src/floorplanner/floorplanner_view.ts` |
| Modify 3D wall rendering | `src/three/edge.ts` |
| Change camera behavior | `src/three/controls.ts` |
| Add new item types | `src/items/factory.ts` + new item class |
| Modify item placement logic | `src/items/floor_item.ts` or `wall_item.ts` |
| Change serialization format | `src/model/model.ts`, `floorplan.ts` |
| Add furniture to catalog | `example/js/items.js` |
| Modify UI layout | `example/index.html` |

---

*This document should be updated as the codebase evolves.*
