# Curvature & Spherization

**The Concept:** Spherizing a shape involves calculating a vertex's distance from the center and pushing/pulling it to match a desired radius using vector normalization: `v_new = (v / |v|) * r`.

**In Practice:** This mathematical principle is used in procedural planet generation in video games and computing aerodynamic curves in CAD software.

**Demonstration:**
Use the fluid "Curvature" slider to morph a sharp, jagged polyhedron into a smooth sphere using Linear Interpolation (Lerp).
