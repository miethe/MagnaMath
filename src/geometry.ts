import * as THREE from 'three';

export type TileType = 
  | 'Small Square' 
  | 'Equilateral Triangle' 
  | 'Isosceles Triangle (Tall)' 
  | 'Isosceles Triangle (Short)' 
  | 'Right Triangle' 
  | 'Hexagon' 
  | 'Octagon'
  | 'Other';

export interface Triangle {
  id: number;
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  normal: THREE.Vector3;
  faceId: number;
}

export interface PolyFace {
  id: number;
  triangles: Triangle[];
  normal: THREE.Vector3;
}

export interface PolyEdge {
  face1: number;
  face2: number;
  v1: THREE.Vector3;
  v2: THREE.Vector3;
}

export interface HingeNode {
  faceId: number;
  parentFaceId: number | null;
  hingeEdge: PolyEdge | null;
  children: HingeNode[];
}

export function getVertexKey(v: THREE.Vector3): string {
  return `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
}

export function getEdgeKey(vA: THREE.Vector3, vB: THREE.Vector3): string {
  const keyA = getVertexKey(vA);
  const keyB = getVertexKey(vB);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
}

export function getPolygonSides(pf: PolyFace): number {
  const edgeCounts = new Map<string, number>();
  for (const t of pf.triangles) {
    const edges = [
      getEdgeKey(t.vertices[0], t.vertices[1]),
      getEdgeKey(t.vertices[1], t.vertices[2]),
      getEdgeKey(t.vertices[2], t.vertices[0])
    ];
    for (const e of edges) {
      edgeCounts.set(e, (edgeCounts.get(e) || 0) + 1);
    }
  }
  let outerEdges = 0;
  for (const count of edgeCounts.values()) {
    if (count === 1) outerEdges++;
  }
  return outerEdges;
}

export function classifyFace(pf: PolyFace): TileType {
  const sides = getPolygonSides(pf);
  
  if (sides === 4) return 'Small Square';
  if (sides === 6) return 'Hexagon';
  if (sides === 8) return 'Octagon';
  
  if (sides === 3) {
    const t = pf.triangles[0];
    const v1 = t.vertices[0];
    const v2 = t.vertices[1];
    const v3 = t.vertices[2];
    
    const d12 = v1.distanceTo(v2);
    const d23 = v2.distanceTo(v3);
    const d31 = v3.distanceTo(v1);
    
    const lengths = [d12, d23, d31].sort((a, b) => a - b);
    const [s1, s2, s3] = lengths;
    
    // Equilateral: all sides roughly equal
    if (Math.abs(s3 - s1) < 0.05 * s3) return 'Equilateral Triangle';
    
    // Right Triangle: a^2 + b^2 = c^2
    if (Math.abs(s1*s1 + s2*s2 - s3*s3) < 0.1 * s3*s3) return 'Right Triangle';
    
    // Isosceles: two sides equal
    if (Math.abs(s1 - s2) < 0.05 * s3 || Math.abs(s2 - s3) < 0.05 * s3) {
      // Tall vs Short
      // Tall usually has 2 long sides, 1 short base. s1=s2 < s3 (Wait, if s1=s2 and s3 is long, it's wide)
      // Actually, Tall Isosceles in Magna-Tiles has s1 < s2=s3.
      if (Math.abs(s2 - s3) < 0.05 * s3) {
        if (s3 / s1 > 1.2) return 'Isosceles Triangle (Tall)';
      }
      return 'Isosceles Triangle (Short)';
    }
    
    return 'Equilateral Triangle'; // Fallback
  }
  
  return 'Other';
}

export function extractPolyhedra(geometry: THREE.BufferGeometry) {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = nonIndexed.attributes.position.array;
  const triangles: Triangle[] = [];
  
  for (let i = 0; i < positions.length; i += 9) {
    const v0 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
    const v1 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
    const v2 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);
    
    const cb = new THREE.Vector3().subVectors(v2, v1);
    const ab = new THREE.Vector3().subVectors(v0, v1);
    const cross = new THREE.Vector3().crossVectors(cb, ab);
    
    if (cross.lengthSq() < 1e-10) continue; // Skip degenerate triangles
    
    const normal = cross.normalize();
    
    triangles.push({
      id: i / 9,
      vertices: [v0, v1, v2],
      normal,
      faceId: -1
    });
  }
  
  const edgeMap = new Map<string, Triangle[]>();
  for (const t of triangles) {
    const edges = [
      [t.vertices[0], t.vertices[1]],
      [t.vertices[1], t.vertices[2]],
      [t.vertices[2], t.vertices[0]]
    ];
    for (const [vA, vB] of edges) {
      const key = getEdgeKey(vA, vB);
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key)!.push(t);
    }
  }
  
  const parent = new Array(triangles.length).fill(0).map((_, i) => i);
  function find(i: number): number {
    if (parent[i] === i) return i;
    return parent[i] = find(parent[i]);
  }
  function union(i: number, j: number) {
    parent[find(i)] = find(j);
  }
  
  for (const tris of edgeMap.values()) {
    if (tris.length === 2) {
      const [t1, t2] = tris;
      if (t1.normal.dot(t2.normal) > 0.99) {
        union(t1.id, t2.id);
      }
    }
  }
  
  const polyFacesMap = new Map<number, PolyFace>();
  for (const t of triangles) {
    const root = find(t.id);
    t.faceId = root;
    if (!polyFacesMap.has(root)) {
      polyFacesMap.set(root, { id: root, triangles: [], normal: t.normal });
    }
    polyFacesMap.get(root)!.triangles.push(t);
  }
  
  const polyFaces = Array.from(polyFacesMap.values());
  const polyEdges: PolyEdge[] = [];
  
  for (const tris of edgeMap.values()) {
    if (tris.length === 2) {
      const [t1, t2] = tris;
      if (t1.faceId !== t2.faceId) {
        const shared = [];
        for (const vA of t1.vertices) {
          for (const vB of t2.vertices) {
            if (vA.distanceTo(vB) < 1e-4) {
              shared.push(vA);
              break;
            }
          }
        }
        if (shared.length >= 2) {
          polyEdges.push({
            face1: t1.faceId,
            face2: t2.faceId,
            v1: shared[0],
            v2: shared[1]
          });
        }
      }
    }
  }
  
  return { polyFaces, polyEdges };
}

export function buildSpanningForest(polyFaces: PolyFace[], polyEdges: PolyEdge[]): HingeNode[] {
  if (polyFaces.length === 0) return [];
  
  const forest: HingeNode[] = [];
  const visited = new Set<number>();
  
  // Build adjacency list
  const adj = new Map<number, PolyEdge[]>();
  for (const e of polyEdges) {
    if (!adj.has(e.face1)) adj.set(e.face1, []);
    if (!adj.has(e.face2)) adj.set(e.face2, []);
    adj.get(e.face1)!.push(e);
    adj.get(e.face2)!.push(e);
  }
  
  // Iterate through all faces to find connected components
  for (const rootFace of polyFaces) {
    if (visited.has(rootFace.id)) continue;
    
    const tree: HingeNode = { faceId: rootFace.id, parentFaceId: null, hingeEdge: null, children: [] };
    forest.push(tree);
    visited.add(rootFace.id);
    
    const queue: { node: HingeNode }[] = [{ node: tree }];
    
    while (queue.length > 0) {
      const { node } = queue.shift()!;
      const edges = adj.get(node.faceId) || [];
      
      for (const e of edges) {
        const neighborId = e.face1 === node.faceId ? e.face2 : e.face1;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const childNode: HingeNode = {
            faceId: neighborId,
            parentFaceId: node.faceId,
            hingeEdge: e,
            children: []
          };
          node.children.push(childNode);
          queue.push({ node: childNode });
        }
      }
    }
  }
  
  return forest;
}

export function computeTransforms(
  node: HingeNode, 
  polyFacesMap: Map<number, PolyFace>, 
  t: number, 
  parentMatrix: THREE.Matrix4,
  transforms: Map<number, THREE.Matrix4>
) {
  let currentMatrix = parentMatrix.clone();
  
  if (node.parentFaceId !== null && node.hingeEdge !== null) {
    const parentFace = polyFacesMap.get(node.parentFaceId)!;
    const currentFace = polyFacesMap.get(node.faceId)!;
    
    const nP = parentFace.normal;
    const nC = currentFace.normal;
    
    let axis = new THREE.Vector3().crossVectors(nC, nP);
    const sinAngle = axis.length();
    let angle = Math.atan2(sinAngle, nP.dot(nC));
    
    if (sinAngle > 1e-6) {
      axis.normalize();
    } else {
      axis.subVectors(node.hingeEdge.v2, node.hingeEdge.v1).normalize();
      angle = 0;
    }
    
    const pivot = node.hingeEdge.v1;
    
    const t1 = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
    const r = new THREE.Matrix4().makeRotationAxis(axis, t * angle);
    const t2 = new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);
    
    const localTransform = new THREE.Matrix4().multiply(t2).multiply(r).multiply(t1);
    currentMatrix.multiply(localTransform);
  }
  
  transforms.set(node.faceId, currentMatrix);
  
  for (const child of node.children) {
    computeTransforms(child, polyFacesMap, t, currentMatrix, transforms);
  }
}
