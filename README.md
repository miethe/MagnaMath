# MagnaMath

MagnaMath is an interactive, educational web application designed for exploring complex 3D geometries, understanding their mathematical properties, and generating 2D flat patterns (nets) specifically tailored for magnetic building tiles (like Magna-Tiles).

## 🌟 Features

- **Procedural Shape Generation:** Generate a wide variety of 3D polyhedra dynamically.
- **Interactive Unfolding:** Watch 3D shapes unfold into 2D flat nets in real-time.
- **Advanced Transformations:** 
  - **Tessellation:** Subdivide faces into smaller triangles.
  - **Curvature (Spherization):** Morph sharp polyhedra into smooth spheres.
  - **Symmetry:** Mirror shapes across X, Y, or Z axes.
- **Inventory Constraints:** Restrict the shape generator to only use tiles you actually own (e.g., Equilateral Triangles, Squares, Hexagons).
- **Real-time Statistics:** View Vertex, Edge, and Face counts, along with the Euler Characteristic.

## 📚 Educational Concepts

MagnaMath is built on deep geometric and mathematical principles. For a detailed breakdown of the math behind the app, including Euler's Formula, Spanning Trees for unfolding, and the geometry of Platonic solids, please read our [Educational Guide](EDUCATION.md).

## 🏗️ Architecture Overview

The application is built using **React 18**, **Three.js**, **React Three Fiber**, and **Tailwind CSS**.

### Core Modules:

1. **`src/App.tsx`**: The main application entry point. It manages the global state (shape parameters, inventory, UI toggles) and sets up the 3D `<Canvas>` environment.
2. **`src/ShapeGenerator.ts`**: The procedural geometry engine. It takes user parameters and constructs `THREE.BufferGeometry`. It handles custom generation for shapes like Antiprisms and Bipyramids, and applies post-processing like Tessellation (subdivision), Curvature (vertex normalization), and Symmetry (geometry cloning and merging).
3. **`src/geometry.ts`**: The mathematical core for analyzing shapes. 
   - Extracts individual faces and edges from raw geometry.
   - Classifies faces into Magna-Tile types (e.g., "Small Square", "Isosceles Triangle").
   - Builds a **Spanning Forest** to determine how the 3D shape should unfold without overlapping faces.
   - Computes rotational transforms for the unfolding animation.
4. **`src/PolyhedronViewer.tsx`**: The React Three Fiber component responsible for rendering the geometry, applying materials, rendering wireframe rims, and animating the unfolding process based on the spanning forest transforms.

## 📐 Supported Shapes

MagnaMath can generate the following shape families:

- **Platonic Solids:** The 5 regular polyhedra (Tetrahedron, Cube, Octahedron, Dodecahedron, Icosahedron).
- **Prisms:** Extruded polygons with rectangular sides.
- **Antiprisms:** Similar to prisms, but the top base is twisted, resulting in alternating triangular sides.
- **Pyramids:** A polygonal base connected to an apex point.
- **Bipyramids:** Two pyramids joined at their bases.
- **Geodesic Spheres:** Icosahedrons subdivided and spherized to create complex spherical grids.
- **Toroidal Polyhedra:** Donut-shaped geometries with customizable tube and radial segments.

## 🚀 Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Frontend Framework:** React 18
- **3D Rendering:** Three.js, @react-three/fiber, @react-three/drei
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Build Tool:** Vite
