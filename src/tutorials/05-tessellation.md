# Tessellation (Subdivision)

**The Concept:** Splitting polygons into smaller pieces by finding the midpoints of edges and connecting them to create smaller internal triangles.

**In Practice:** This is the core of Level of Detail (LOD) systems in computer graphics, where objects get more detailed (subdivided) as the camera gets closer, and is crucial for creating high-resolution collision meshes in physics engines.

**Demonstration:**
Watch a single 2D triangle split. Dots appear at the midpoints of its edges, then lines connect them, showing 1 triangle splitting into 4.
