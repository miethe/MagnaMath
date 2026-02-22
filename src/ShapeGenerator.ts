import * as THREE from 'three';

export type ShapeFamily = 'Platonic' | 'Prism' | 'Pyramid' | 'Bipyramid';

export interface ShapeParams {
  family: ShapeFamily;
  platonicType: 'Tetrahedron' | 'Cube' | 'Octahedron' | 'Dodecahedron' | 'Icosahedron';
  sides: number;
  radius: number;
  height: number;
}

export function generateShape(params: ShapeParams): { geometry: THREE.BufferGeometry, name: string } {
  let geom: THREE.BufferGeometry;
  let name = '';

  const r = params.radius;
  const h = params.height;
  const n = params.sides;

  const prefixes: Record<number, string> = { 3: 'Triangular', 4: 'Square', 5: 'Pentagonal', 6: 'Hexagonal', 7: 'Heptagonal', 8: 'Octagonal', 9: 'Enneagonal', 10: 'Decagonal', 11: 'Hendecagonal', 12: 'Dodecagonal' };
  const prefix = prefixes[n] || `${n}-gonal`;

  if (params.family === 'Platonic') {
    name = params.platonicType;
    switch (name) {
      case 'Tetrahedron': geom = new THREE.TetrahedronGeometry(r); break;
      case 'Cube': geom = new THREE.BoxGeometry(r*1.5, r*1.5, r*1.5); break;
      case 'Octahedron': geom = new THREE.OctahedronGeometry(r); break;
      case 'Dodecahedron': geom = new THREE.DodecahedronGeometry(r); break;
      case 'Icosahedron': geom = new THREE.IcosahedronGeometry(r); break;
      default: geom = new THREE.BoxGeometry(r, r, r);
    }
  } else if (params.family === 'Prism') {
    name = `${prefix} Prism`;
    geom = new THREE.CylinderGeometry(r, r, h, n);
  } else if (params.family === 'Pyramid') {
    name = `${prefix} Pyramid`;
    geom = new THREE.ConeGeometry(r, h, n);
  } else if (params.family === 'Bipyramid') {
    name = `${prefix} Bipyramid`;
    geom = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    vertices.push(0, h/2, 0); // top
    vertices.push(0, -h/2, 0); // bottom
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2;
      vertices.push(r * Math.cos(theta), 0, r * Math.sin(theta));
    }
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      indices.push(0, 2 + i, 2 + next);
      indices.push(1, 2 + next, 2 + i);
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
  } else {
    geom = new THREE.BoxGeometry(r, r, r);
    name = 'Cube';
  }

  return { geometry: geom, name };
}
