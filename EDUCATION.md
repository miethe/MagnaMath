# The Mathematics of MagnaMath

MagnaMath is not just a visualizer; it is a sandbox for exploring discrete geometry, topology, and computational mathematics. This document outlines the core educational concepts driving the application.

## 1. Polyhedra & Platonic Solids

A **polyhedron** is a 3D shape with flat polygonal faces, straight edges, and sharp corners (vertices). 

MagnaMath features the **Platonic Solids**, which are the only 5 regular, convex polyhedra in existence. For a shape to be a Platonic solid:
1. All faces must be congruent regular polygons.
2. The same number of faces must meet at every vertex.

The 5 Platonic Solids are:
- **Tetrahedron:** 4 Triangles
- **Cube (Hexahedron):** 6 Squares
- **Octahedron:** 8 Triangles
- **Dodecahedron:** 12 Pentagons
- **Icosahedron:** 20 Triangles

## 2. Euler's Formula

One of the most beautiful theorems in topology is **Euler's Polyhedron Formula**. For any convex polyhedron, the number of Vertices ($V$), Edges ($E$), and Faces ($F$) always relates in the following way:

$$V - E + F = 2$$

**Try it in the app:** Generate a Cube. It has 8 Vertices, 12 Edges, and 6 Faces. 
$8 - 12 + 6 = 2$. 
If you increase the Tessellation or change the shape to a Geodesic Sphere, the numbers will change drastically, but the result of $V - E + F$ will always remain 2!

*(Note: Toroidal polyhedra have a "hole" in them, meaning their topology is different. For a torus, $V - E + F = 0$.)*

## 3. Unfolding & Spanning Trees

How do we flatten a 3D shape into a 2D net without the faces tearing apart or overlapping? This is a classic problem in computational geometry.

MagnaMath solves this using **Graph Theory**:
1. **Face Graph:** Every face of the polyhedron is treated as a "Node". Every shared edge between two faces is treated as a "Link" between those nodes.
2. **Spanning Tree:** The app runs a Breadth-First Search (BFS) algorithm to find a "Spanning Tree"—a path that connects every face together without creating any loops.
3. **Hinges:** The edges selected by the Spanning Tree act as "hinges". The unselected edges are "cut".
4. **Dihedral Angles:** The app calculates the angle between the normal vectors of adjacent faces. During the unfolding animation, faces rotate around their hinges by this exact angle to lay flat on the ground plane.

## 4. Curvature & Spherization

In computer graphics, a perfect sphere doesn't exist—everything is made of flat triangles. To make a shape look spherical, MagnaMath uses a process called **Spherization**.

1. **Vector Normalization:** Every vertex in a 3D model has a position vector $(x, y, z)$ originating from the center $(0,0,0)$. 
2. To spherize the shape, we calculate the distance (magnitude) of the vertex from the center.
3. We then "push" or "pull" the vertex so its distance matches the desired radius $r$. Mathematically, we normalize the vector and multiply it by $r$: $\vec{v}_{new} = \frac{\vec{v}}{|\vec{v}|} \times r$.
4. The **Curvature** slider in the app performs a Linear Interpolation (Lerp) between the original vertex position and the spherical vertex position.

## 5. Tessellation (Subdivision)

If you try to spherize a Cube with only 6 faces, it just looks like a bloated cube. To make it truly spherical, we need more vertices.

**Tessellation** (or subdivision) is the process of splitting polygons into smaller pieces. MagnaMath uses a simple triangle subdivision algorithm:
1. For every triangle, find the midpoint of its 3 edges.
2. Connect these midpoints to create 4 smaller triangles inside the original one.
3. When combined with Spherization, these new vertices are pushed outward, creating a smooth, high-resolution curved surface.

## 6. Symmetry & Reflection

Symmetry is a fundamental concept in geometry. MagnaMath allows you to apply **Reflectional Symmetry** across the X, Y, or Z axes.

Mathematically, reflecting a shape across the X-axis involves multiplying the X-coordinate of every vertex by $-1$. 

**The Winding Order Problem:** 
In 3D graphics, the "front" of a face is determined by the order its vertices are drawn (usually Counter-Clockwise). If you mirror a shape by multiplying an axis by $-1$, the drawing order flips to Clockwise, turning the shape inside-out! MagnaMath automatically detects this and reverses the vertex indices of the mirrored shape to ensure the normals face outward correctly.
