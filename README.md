# CASA-MOOD

CASA-MOOD is a customizable application built on three.js that allows users to design an interior space such as a home or apartment.

## Overview

This project provides a 3D floor planning and interior design tool. Users can:
1. Create 2D floorplans
2. Add furniture and items
3. Visualize and design in 3D

## Getting Started

To get started, clone the repository and ensure you have `npm` and `grunt` installed.

### Installation

```bash
npm install
grunt
```

The `grunt` command generates `example/js/blueprint3d.js` from the source typescripts.

### Compiling

Run `npm run build` or `grunt` to compile the TypeScript source into the distributable JavaScript file.

## Running Locally

To run the example application locally:

1. Navigate to the example directory:
   ```bash
   cd example
   ```

2. Start a simple HTTP server. For example, using Python:
   ```bash
   # Python 3.x
   python -m http.server
   ```

3. Visit `http://localhost:8000` in your browser.


## Directory Structure

*   `src/` - Core source code (TypeScript)
    *   `core` - Basic utilities
    *   `floorplanner` - 2D view/controller
    *   `items` - Item definitions
    *   `model` - Data model
    *   `three` - 3D view/controller
*   `example/` - Example application demonstrating usage

## License

This project is open-source. See LICENSE.txt for more information.
