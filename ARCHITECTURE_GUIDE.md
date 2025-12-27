# CASA MOOD Architecture Guide

> **Last Updated:** December 27, 2025  
> **Project:** CASA MOOD - 3D Interior Design Application for Egyptian Market

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Recent Updates (December 2025)](#recent-updates-december-2025)
3. [Directory Structure](#directory-structure)
4. [Core Modules](#core-modules)
5. [File Relationships & Data Flow](#file-relationships--data-flow)
6. [Application Features](#application-features)
7. [Build System](#build-system)
8. [Key Classes & Their Responsibilities](#key-classes--their-responsibilities)
9. [Future Development Roadmap](#future-development-roadmap)

---

## Project Overview

CASA MOOD is a **TypeScript/JavaScript library** for creating interactive 3D interior design applications, tailored for the Egyptian furniture market. Users can:

1. Draw 2D floor plans (walls, rooms)
2. View the floor plan extruded into 3D
3. Place furniture items from Egyptian brands (In & Out, Hubu, Kabbanery, Damietta)
4. Apply textures to walls and floors
5. Track budget in EGP (Egyptian Pounds)
6. Save/load designs as `.CasaMood` files
7. Export 3D view as PNG images

**Technology Stack:**
- **Language:** TypeScript (compiled to ES5 JavaScript)
- **3D Engine:** Three.js
- **DOM/Events:** jQuery
- **Styling:** Tailwind CSS (CDN)
- **Build Tool:** Grunt

---

## Recent Updates (December 2025)

### Branding
- Renamed from "LuxePlan" to **CASA MOOD**
- Updated page title, logo, and all code comments

### UI Improvements
- **Professional SaaS Layout** with fixed 60px header
- **Left Sidebar (300px)**: Product catalog with search, category filters, and product cards
- **Right Sidebar (320px)**: Slide-out properties panel for item editing
- **Floating Controls**: Camera presets and zoom buttons

### New Features

| Feature | Description |
|---------|-------------|
| **Budget Tracker** | Real-time cost calculation in EGP as items are added/removed |
| **Budget on Load** | Automatic recalculation when designs are loaded |
| **Load Project** | Opens file dialog to load `.CasaMood` files |
| **Save Project** | Downloads design as `.CasaMood` JSON file |
| **Export Image** | Exports 3D view as PNG |
| **Egyptian Catalog** | Products from In & Out, Hubu, Kabbanery, Damietta Workshop |

### Bug Fixes
- Fixed 3D rendering blocked by duplicate canvas element
- Fixed floorplan button text visibility (white on white issue)
- Fixed budget not recalculating on design load

---

## Directory Structure

```
CASA MOOD/
├── src/                    # 🔹 Core TypeScript source code
│   ├── blueprint3d.ts      # Main entry point
│   ├── core/               # Utilities, configuration, logging
│   ├── floorplanner/       # 2D floor plan editor
│   ├── items/              # Furniture/object system
│   ├── model/              # Data models (walls, rooms, corners)
│   └── three/              # 3D rendering with Three.js
│
├── lib/                    # 🔸 TypeScript definitions
│   ├── jquery.d.ts         # jQuery type definitions
│   └── three.d.ts          # Three.js type definitions
│
├── dist/                   # 🔸 Build output (generated)
│   ├── blueprint3d.js      # Compiled library
│   └── blueprint3d.d.ts    # Generated type definitions
│
├── example/                # 🔹 Production application
│   ├── index.html          # Main HTML (Tailwind CSS)
│   ├── css/example.css     # Custom styles
│   ├── js/
│   │   ├── blueprint3d.js  # Core library
│   │   ├── three.min.js    # Three.js
│   │   ├── jquery.js       # jQuery
│   │   ├── example.js      # App logic, budget tracker
│   │   └── items.js        # Egyptian furniture catalog
│   ├── models/             # 3D furniture models
│   └── rooms/              # Wall/floor textures
│
├── ARCHITECTURE_GUIDE.md   # This document
└── package.json            # npm configuration
```

---

## Core Modules

### 1. `src/core/` — Shared Utilities

| File | Responsibility |
|------|----------------|
| `configuration.ts` | Wall height (250cm), thickness (10cm), units |
| `dimensioning.ts` | Unit conversion (cm to inches, feet) |
| `log.ts` | Logging with levels and contexts |
| `utils.ts` | Geometry math utilities |

### 2. `src/model/` — Data Layer

| File | Responsibility |
|------|----------------|
| `model.ts` | Coordinator, serialization (`.CasaMood` format) |
| `floorplan.ts` | Walls, corners, rooms, room detection |
| `scene.ts` | THREE.Scene wrapper, item lifecycle |

### 3. `src/three/` — 3D Visualization

| File | Responsibility |
|------|----------------|
| `main.ts` | WebGL renderer, camera, animation loop |
| `controller.ts` | Item selection, dragging, state machine |
| `controls.ts` | Orbit camera controls |
| `edge.ts` | 3D wall geometry with textures |

### 4. `example/js/` — Application Layer

| File | Responsibility |
|------|----------------|
| `example.js` | Main app logic |
| `example.js` → `BudgetTracker` | Tracks item costs, recalculates on load |
| `example.js` → `SideMenu` | Tab navigation (Floorplan/3D View/Catalog) |
| `example.js` → `mainControls` | Save/Load/Export functionality |
| `items.js` | Egyptian furniture catalog with prices |

---

## Application Features

### Budget Tracker

The `BudgetTracker` class in `example.js`:

```javascript
var BudgetTracker = function (blueprint3d) {
  var priceByModelUrl = {};  // Price lookup table
  
  // Listens to:
  // - itemLoadedCallbacks: Updates budget when items added
  // - itemRemovedCallbacks: Updates budget when items removed
  // - roomLoadedCallbacks: Recalculates on design load
  
  function recalculateAllItems() {
    // Scans all items, looks up prices by model URL
  }
};
```

### File Format (`.CasaMood`)

JSON structure containing:
```json
{
  "floorplan": {
    "corners": {},
    "walls": [],
    "wallTextures": [],
    "floorTextures": {}
  },
  "items": [
    {
      "item_name": "Milano Sectional Sofa",
      "item_type": 1,
      "model_url": "models/js/sofa.js",
      "xpos": 100, "ypos": 0, "zpos": 200,
      "rotation": 0,
      "scale_x": 1, "scale_y": 1, "scale_z": 1
    }
  ]
}
```

---

## Build System

```bash
# Compile TypeScript + copy to example/
grunt

# Debug: Compile only
grunt debug

# Release: Full build + minify
grunt release
```

---

## Key Classes & Their Responsibilities

### Model (Coordinator)
```typescript
class Model {
    floorplan: Floorplan;  // 2D data
    scene: Scene;          // 3D items
    
    loadSerialized(json);  // Load .CasaMood file
    exportSerialized();    // Save to .CasaMood
}
```

### Three.Main (3D Engine)
```typescript
class Main {
    controls: Controls;
    renderer: WebGLRenderer;
    
    centerCamera();
    updateWindowSize();
    dataUrl();  // Export as PNG
}
```

---

## Future Development Roadmap

### Phase 1: Core Improvements (Q1 2026)

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **AI Room Detection** | Automatically detect walls from uploaded floorplan images |
| 🔴 High | **Real PDF Export** | Generate professional PDF reports with itemized costs |
| 🟡 Medium | **Undo/Redo** | History system for design changes |
| 🟡 Medium | **Item Rotation UI** | Visual rotation handles on selected items |
| 🟢 Low | **Keyboard Shortcuts** | Delete, copy, paste items |

### Phase 2: Enhanced Features (Q2 2026)

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Cloud Save** | Save designs to cloud storage (Firebase/Supabase) |
| 🔴 High | **User Accounts** | Authentication and user profiles |
| 🟡 Medium | **Sharing** | Generate shareable links to designs |
| 🟡 Medium | **3D Walk-through** | First-person camera mode |
| 🟢 Low | **VR Support** | WebXR integration for VR headsets |

### Phase 3: Marketplace (Q3 2026)

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Live Catalog** | Fetch products from API instead of static file |
| 🔴 High | **Store Integration** | Link products to e-commerce checkout |
| 🟡 Medium | **Real Pricing** | Connect to live pricing APIs |
| 🟡 Medium | **Inventory Status** | Show in-stock/out-of-stock status |

### Phase 4: AI & Automation (Q4 2026)

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **AI Design Suggestions** | Recommend furniture placement based on room shape |
| 🟡 Medium | **Auto-Layout** | One-click room arrangement optimization |
| 🟡 Medium | **Style Matching** | Suggest complementary furniture styles |
| 🟢 Low | **Voice Commands** | Control design with voice |

### Technical Debt

| Task | Priority |
|------|----------|
| Migrate TypeScript to ES6 Modules | 🟡 Medium |
| Replace jQuery with vanilla JS | 🟢 Low |
| Add unit tests for model layer | 🔴 High |
| Upgrade Three.js to latest version | 🟡 Medium |
| Implement proper error boundaries | 🟡 Medium |

---

## Quick Reference

| To do this... | Look in... |
|---------------|------------|
| Change wall height | `src/core/configuration.ts` |
| Modify 2D editor | `src/floorplanner/` |
| Change 3D rendering | `src/three/edge.ts` |
| Add furniture | `example/js/items.js` |
| Modify budget logic | `example/js/example.js` → `BudgetTracker` |
| Change file format | `example/js/example.js` → `mainControls` |
| Update UI layout | `example/index.html` |

---

*This document should be updated as the codebase evolves.*
