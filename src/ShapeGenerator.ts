import * as THREE from 'three';

export type ShapeFamily = 'Platonic' | 'Prism' | 'Antiprism' | 'Pyramid' | 'Bipyramid' | 'Geodesic' | 'Torus';
export type SymmetryType = 'None' | 'Mirror X' | 'Mirror Y' | 'Mirror Z';

export interface ShapeParams {
  family: ShapeFamily;
  platonicType: 'Tetrahedron' | 'Cube' | 'Octahedron' | 'Dodecahedron' | 'Icosahedron';
  sides: number;
  radius: number;
  height: number;
  detail: number;
  tubeRadius: number;
  tubularSegments: number;
  radialSegments: number;
  tessellation: number; // 1 to 4
  curvature: number; // 0 to 1
  symmetry: SymmetryType;
}

export function getPolyhedronName(faces: number): string {
  const names: Record<number, string> = {
    4: 'Tetrahedron',
    5: 'Pentahedron',
    6: 'Hexahedron',
    7: 'Heptahedron',
    8: 'Octahedron',
    9: 'Enneahedron',
    10: 'Decahedron',
    11: 'Hendecahedron',
    12: 'Dodecahedron',
    13: 'Tridecahedron',
    14: 'Tetradecahedron',
    15: 'Pentadecahedron',
    16: 'Hexadecahedron',
    17: 'Heptadecahedron',
    18: 'Octadecahedron',
    19: 'Enneadecahedron',
    20: 'Icosahedron',
    24: 'Icositetrahedron',
    30: 'Triacontahedron',
    32: 'Triacontadihedron',
    60: 'Hexacontahedron',
    90: 'Enneacontahedron'
  };
  return names[faces] || `${faces}-hedron`;
}

export function generateShape(params: ShapeParams): { geometry: THREE.BufferGeometry, name: string } {
  let geom: THREE.BufferGeometry;
  let baseName = '';

  const r = params.radius;
  const h = params.height;
  const n = params.sides;
  const tess = params.tessellation || 1;

  const prefixes: Record<number, string> = { 3: 'Triangular', 4: 'Square', 5: 'Pentagonal', 6: 'Hexagonal', 7: 'Heptagonal', 8: 'Octagonal', 9: 'Enneagonal', 10: 'Decagonal', 11: 'Hendecagonal', 12: 'Dodecagonal' };
  const prefix = prefixes[n] || `${n}-gonal`;

  if (params.family === 'Platonic') {
    baseName = params.platonicType;
    const detail = params.detail || 0;
    switch (baseName) {
      case 'Tetrahedron': geom = new THREE.TetrahedronGeometry(r, detail); break;
      case 'Cube': geom = new THREE.BoxGeometry(r*1.5, r*1.5, r*1.5, tess, tess, tess); break;
      case 'Octahedron': geom = new THREE.OctahedronGeometry(r, detail); break;
      case 'Dodecahedron': geom = new THREE.DodecahedronGeometry(r, detail); break;
      case 'Icosahedron': geom = new THREE.IcosahedronGeometry(r, detail); break;
      default: geom = new THREE.BoxGeometry(r, r, r, tess, tess, tess);
    }
  } else if (params.family === 'Prism') {
    baseName = `${prefix} Prism`;
    geom = new THREE.CylinderGeometry(r, r, h, n, tess);
  } else if (params.family === 'Antiprism') {
    // ... (Antiprism logic remains mostly custom, hard to tessellate without custom logic, but maybe we can subdivide?)
    // For now, keep as is, but maybe add segments if possible? 
    // The custom buffer geometry below doesn't support tessellation easily. 
    // Let's leave it for now or switch to a Cylinder approximation if tessellation > 1?
    // Actually, CylinderGeometry can be an antiprism if we rotate the top?
    // No, CylinderGeometry aligns vertices.
    
    baseName = `${prefix} Antiprism`;
    geom = new THREE.BufferGeometry();
    // ... (rest of antiprism code)
    const vertices = [];
    const indices = [];
    // ...
    // (We will keep the existing custom code for Antiprism/Bipyramid for now as they are procedural)
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2 + Math.PI / n;
      vertices.push(r * Math.cos(theta), h/2, r * Math.sin(theta));
    }
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2;
      vertices.push(r * Math.cos(theta), -h/2, r * Math.sin(theta));
    }
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i, i + 1);
    }
    for (let i = 1; i < n - 1; i++) {
      indices.push(n, n + i + 1, n + i);
    }
    for (let i = 0; i < n; i++) {
      const t1 = i;
      const t2 = (i + 1) % n;
      const b1 = n + i;
      const b2 = n + ((i + 1) % n);
      indices.push(t1, b2, t2);
      indices.push(t1, b1, b2);
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
  } else if (params.family === 'Pyramid') {
    baseName = `${prefix} Pyramid`;
    geom = new THREE.ConeGeometry(r, h, n, tess);
  } else if (params.family === 'Bipyramid') {
    // ... (Bipyramid code)
    baseName = `${prefix} Bipyramid`;
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
  } else if (params.family === 'Geodesic') {
    geom = new THREE.IcosahedronGeometry(r, params.detail);
    baseName = `Geodesic Sphere`;
  } else if (params.family === 'Torus') {
    geom = new THREE.TorusGeometry(r, params.tubeRadius, params.radialSegments, params.tubularSegments);
    baseName = `Toroidal Polyhedron`;
  } else {
    geom = new THREE.BoxGeometry(r, r, r, tess, tess, tess);
    baseName = 'Cube';
  }

  // Apply Curvature (Spherize)
  if (params.curvature > 0) {
    // Ensure we have normals computed before modifying positions if needed, but we recompute after.
    const posAttr = geom.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const dist = v.length();
      // For shapes like Cube, dist varies. For Sphere, dist is constant.
      // Spherize: move vertex towards radius r.
      // Lerp between original position and normalized position at radius r.
      
      // We need to be careful: if we just normalize, a cube becomes a sphere.
      // params.curvature 0 -> Cube, 1 -> Sphere.
      
      if (dist > 0.0001) {
        const target = v.clone().normalize().multiplyScalar(r);
        v.lerp(target, params.curvature);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
    }
    geom.attributes.position.needsUpdate = true;
    geom.computeVertexNormals();
  }

  // Apply Symmetry (Mirroring)
  if (params.symmetry !== 'None') {
    const originalGeom = geom.clone();
    const mirrorGeom = geom.clone();
    const scale = new THREE.Vector3(1, 1, 1);
    const offset = new THREE.Vector3();
    
    // Offset to separate the mirrored shapes slightly (by radius)
    const separation = r * 0.1; // Small gap

    if (params.symmetry === 'Mirror X') {
      scale.x = -1;
      originalGeom.translate(separation, 0, 0);
      mirrorGeom.translate(-separation, 0, 0);
    }
    if (params.symmetry === 'Mirror Y') {
      scale.y = -1;
      originalGeom.translate(0, separation, 0);
      mirrorGeom.translate(0, -separation, 0);
    }
    if (params.symmetry === 'Mirror Z') {
      scale.z = -1;
      originalGeom.translate(0, 0, separation);
      mirrorGeom.translate(0, 0, -separation);
    }
    
    mirrorGeom.scale(scale.x, scale.y, scale.z);
    
    // Fix winding order for mirrored geometry (restore outward normals)
    // Mirroring flips winding order (CCW -> CW). We need to swap vertices/indices to restore CCW.
    if (mirrorGeom.index) {
      const indices = mirrorGeom.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const temp = indices[i];
        indices[i] = indices[i + 1];
        indices[i + 1] = temp;
      }
    } else {
      // Non-indexed: swap vertices in position attribute
      const pos = mirrorGeom.attributes.position.array;
      for (let i = 0; i < pos.length; i += 9) {
        // Swap v0 and v1 (x,y,z)
        const v0x = pos[i];
        const v0y = pos[i+1];
        const v0z = pos[i+2];
        
        pos[i] = pos[i+3];
        pos[i+1] = pos[i+4];
        pos[i+2] = pos[i+5];
        
        pos[i+3] = v0x;
        pos[i+4] = v0y;
        pos[i+5] = v0z;
      }
    }
    
    // Merge geometries properly preserving indices
    const combinedGeom = new THREE.BufferGeometry();
    
    const pos1 = originalGeom.attributes.position.array;
    const pos2 = mirrorGeom.attributes.position.array;
    
    const combinedPos = new Float32Array(pos1.length + pos2.length);
    combinedPos.set(pos1);
    combinedPos.set(pos2, pos1.length);
    combinedGeom.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
    
    // Handle Normals
    if (originalGeom.attributes.normal) {
        const norm1 = originalGeom.attributes.normal.array;
        const norm2 = mirrorGeom.attributes.normal.array;
        const combinedNorm = new Float32Array(norm1.length + norm2.length);
        combinedNorm.set(norm1);
        combinedNorm.set(norm2, norm1.length);
        combinedGeom.setAttribute('normal', new THREE.BufferAttribute(combinedNorm, 3));
    }
    
    // Handle UVs
    if (originalGeom.attributes.uv) {
        const uv1 = originalGeom.attributes.uv.array;
        const uv2 = mirrorGeom.attributes.uv.array;
        const combinedUV = new Float32Array(uv1.length + uv2.length);
        combinedUV.set(uv1);
        combinedUV.set(uv2, uv1.length);
        combinedGeom.setAttribute('uv', new THREE.BufferAttribute(combinedUV, 2));
    }

    // Handle Indices
    if (originalGeom.index) {
        const idx1 = originalGeom.index.array;
        const idx2 = mirrorGeom.index.array;
        const offset = pos1.length / 3;
        
        // Create a new array for indices. 
        // Note: if vertex count > 65535, we need Uint32Array.
        const count = idx1.length + idx2.length;
        const combinedIndex = (pos1.length / 3 + pos2.length / 3) > 65535 
            ? new Uint32Array(count) 
            : new Uint16Array(count);
            
        combinedIndex.set(idx1);
        for (let i = 0; i < idx2.length; i++) {
            combinedIndex[idx1.length + i] = idx2[i] + offset;
        }
        combinedGeom.setIndex(new THREE.BufferAttribute(combinedIndex, 1));
    }
    
    // Recompute normals to be safe (especially after winding flip)
    combinedGeom.computeVertexNormals();
    
    geom = combinedGeom;
    baseName = `Symmetric ${baseName}`;
  }

  return { geometry: geom, name: baseName };
}
