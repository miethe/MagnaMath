# Unfolding & Spanning Trees

**The Concept:** Flattening a 3D shape into a 2D net without overlapping requires treating the faces as a graph, running a Breadth-First Search (BFS) to find a Spanning Tree, and using the calculated Dihedral Angles to hinge the faces flat.

**In Practice:** This exact algorithmic process is used in sheet metal manufacturing, cardboard packaging design, and generating UV maps for texturing 3D video game assets.

**Demonstration:**
Watch a smooth, real-time 3D-to-2D animation. The "hinge" edges (the Spanning Tree) act as the folding points, while the "cut" edges allow the shape to lay flat without tearing.
