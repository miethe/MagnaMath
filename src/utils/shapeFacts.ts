import { ShapeParams } from '../ShapeGenerator';

export function getShapeFacts(params: ShapeParams, totalFaces: number, totalEdges: number, totalVertices: number): string[] {
  const facts: string[] = [];

  // Euler characteristic fact
  const euler = totalVertices - totalEdges + totalFaces;
  if (euler === 2) {
    facts.push("Like all convex polyhedra, this shape follows Euler's formula: V - E + F = 2.");
  } else if (euler === 0) {
    facts.push("This shape has an Euler characteristic of 0, which is typical for a torus (donut shape).");
  }

  // Family specific facts
  switch (params.family) {
    case 'Platonic':
      facts.push("Platonic solids are highly symmetric, with every face being a regular polygon of the same size and shape.");
      if (params.platonicType === 'Tetrahedron') facts.push("The tetrahedron is the simplest of all ordinary convex polyhedra and the only one with fewer than 5 faces.");
      if (params.platonicType === 'Cube') facts.push("A cube is the only regular hexahedron and is one of the five Platonic solids.");
      if (params.platonicType === 'Octahedron') facts.push("An octahedron has 8 faces, 12 edges, and 6 vertices. It is the dual polyhedron of the cube.");
      if (params.platonicType === 'Dodecahedron') facts.push("The regular dodecahedron is composed of 12 regular pentagonal faces.");
      if (params.platonicType === 'Icosahedron') facts.push("An icosahedron has 20 faces. Many viruses, such as herpes and rhinovirus, have icosahedral shells.");
      break;
    case 'Prism':
      facts.push(`A ${params.sides}-gonal prism consists of two ${params.sides}-sided bases connected by ${params.sides} rectangular sides.`);
      if (params.sides === 3) facts.push("Triangular prisms are commonly used in optics to disperse light into a spectrum.");
      break;
    case 'Antiprism':
      facts.push(`Unlike a regular prism, a ${params.sides}-gonal antiprism connects its bases with an alternating band of ${params.sides * 2} triangles.`);
      break;
    case 'Pyramid':
      facts.push(`A ${params.sides}-gonal pyramid has a ${params.sides}-sided base and ${params.sides} triangular faces meeting at a common apex.`);
      if (params.sides === 4) facts.push("The Great Pyramid of Giza is a classic example of a square pyramid.");
      break;
    case 'Bipyramid':
      facts.push(`A ${params.sides}-gonal bipyramid is formed by joining two ${params.sides}-gonal pyramids base-to-base.`);
      if (params.sides === 8) facts.push("Octagonal bipyramids are sometimes found in crystal structures.");
      break;
    case 'Geodesic':
      facts.push("Geodesic spheres approximate a sphere using a network of triangles. They are incredibly structurally strong.");
      facts.push(`Higher detail levels (currently ${params.detail}) exponentially increase the number of triangles, creating a smoother sphere.`);
      break;
    case 'Torus':
      facts.push("A torus is mathematically defined as the product of two circles. It's the shape of a donut or an inner tube.");
      break;
  }

  // Parameter specific facts
  if (params.curvature > 0) {
    facts.push(`The shape is spherized by ${Math.round(params.curvature * 100)}%, pushing its vertices outward towards a bounding sphere.`);
  }
  if (params.tessellation > 1) {
    facts.push(`Each face is subdivided ${params.tessellation} times, increasing the geometric complexity and allowing for smoother deformations.`);
  }
  if (params.symmetry !== 'None') {
    facts.push(`The geometry is mirrored along the ${params.symmetry.replace('Mirror ', '')}-axis, ensuring perfect bilateral symmetry.`);
  }

  return facts;
}
