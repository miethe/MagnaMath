import React, { useMemo } from 'react';
import * as THREE from 'three';
import { extractPolyhedra, buildSpanningForest, computeTransforms, PolyFace, PolyEdge, HingeNode, getPolygonSides, getVertexKey, getEdgeKey, classifyFace, TileType } from './geometry';

export interface GeometryStats {
  tileCounts: Record<number, number>;
  tileTypeCounts: Record<string, number>;
  totalFaces: number;
  totalEdges: number;
  totalVertices: number;
}

interface PolyhedronViewerProps {
  geometry: THREE.BufferGeometry;
  unfoldProgress: number;
  onStatsChange?: (stats: GeometryStats) => void;
  tileColors?: Record<string, string>;
}

const TILE_COLORS: Record<number, string> = {
  3: '#ef4444', // Red for triangles
  4: '#3b82f6', // Blue for squares
  5: '#eab308', // Yellow for pentagons
  6: '#22c55e', // Green for hexagons
  8: '#a855f7', // Purple for octagons
};

export function PolyhedronViewer({ geometry, unfoldProgress, onStatsChange, tileColors }: PolyhedronViewerProps) {
  const { polyFaces, polyEdges, spanningForest, faceGeometries, polyFacesMap, stats, faceSides, faceTypes } = useMemo(() => {
    const { polyFaces, polyEdges } = extractPolyhedra(geometry);
    const spanningForest = buildSpanningForest(polyFaces, polyEdges);
    
    const polyFacesMap = new Map<number, PolyFace>();
    const counts: Record<number, number> = {};
    const typeCounts: Record<string, number> = {};
    const faceSides = new Map<number, number>();
    const faceTypes = new Map<number, TileType>();
    const uniqueVertices = new Set<string>();

    for (const pf of polyFaces) {
      polyFacesMap.set(pf.id, pf);
      const sides = getPolygonSides(pf);
      const type = classifyFace(pf);
      
      faceSides.set(pf.id, sides);
      faceTypes.set(pf.id, type);
      
      counts[sides] = (counts[sides] || 0) + 1;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      
      for (const t of pf.triangles) {
        uniqueVertices.add(getVertexKey(t.vertices[0]));
        uniqueVertices.add(getVertexKey(t.vertices[1]));
        uniqueVertices.add(getVertexKey(t.vertices[2]));
      }
    }
    
    const stats: GeometryStats = {
      tileCounts: counts,
      tileTypeCounts: typeCounts,
      totalFaces: polyFaces.length,
      totalEdges: polyEdges.length,
      totalVertices: uniqueVertices.size
    };
    
    const faceGeometries = polyFaces.map(pf => {
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array(pf.triangles.length * 9);
      let i = 0;
      for (const t of pf.triangles) {
        vertices[i++] = t.vertices[0].x; vertices[i++] = t.vertices[0].y; vertices[i++] = t.vertices[0].z;
        vertices[i++] = t.vertices[1].x; vertices[i++] = t.vertices[1].y; vertices[i++] = t.vertices[1].z;
        vertices[i++] = t.vertices[2].x; vertices[i++] = t.vertices[2].y; vertices[i++] = t.vertices[2].z;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();
      return geom;
    });
    
    return { polyFaces, polyEdges, spanningForest, faceGeometries, polyFacesMap, stats, faceSides, faceTypes };
  }, [geometry]);

  React.useEffect(() => {
    if (onStatsChange) {
      onStatsChange(stats);
    }
  }, [stats, onStatsChange]);

  const transforms = useMemo(() => {
    const map = new Map<number, THREE.Matrix4>();
    if (spanningForest) {
      for (const tree of spanningForest) {
        // Calculate root face normal and center to align it to the ground (Y-up)
        const rootFace = polyFacesMap.get(tree.faceId);
        let initialMatrix = new THREE.Matrix4();

        if (rootFace) {
          // Calculate centroid
          const center = new THREE.Vector3();
          let count = 0;
          for (const t of rootFace.triangles) {
            center.add(t.vertices[0]).add(t.vertices[1]).add(t.vertices[2]);
            count += 3;
          }
          if (count > 0) center.divideScalar(count);

          // Calculate rotation to align normal to (0, 1, 0)
          const normal = rootFace.normal.clone().normalize();
          const up = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(normal, up);

          // Create transform: Translate to origin -> Rotate -> (Optional: Translate up slightly?)
          // We want the face to be flat on the ground (y=0)
          const t1 = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
          const r = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
          
          initialMatrix.multiply(r).multiply(t1);
        }

        computeTransforms(tree, polyFacesMap, unfoldProgress, initialMatrix, map);
      }
    }
    return map;
  }, [spanningForest, polyFacesMap, unfoldProgress]);

  return (
    <group>
      {polyFaces.map((pf, i) => {
        const matrix = transforms.get(pf.id);
        if (!matrix) return null;
        
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, quaternion, scale);
        
        const sides = faceSides.get(pf.id) || 3;
        const type = faceTypes.get(pf.id) || 'Other';
        
        let color = '#f97316'; // Default orange
        if (tileColors) {
          color = tileColors[type] || tileColors[sides] || color;
        } else {
          color = TILE_COLORS[sides] || color;
        }

        // Create rim geometry from outer edges
        const rimVertices: number[] = [];
        const edgeCounts = new Map<string, number>();
        for (const t of pf.triangles) {
          const edges = [
            [t.vertices[0], t.vertices[1]],
            [t.vertices[1], t.vertices[2]],
            [t.vertices[2], t.vertices[0]]
          ];
          for (const [vA, vB] of edges) {
            const key = getEdgeKey(vA, vB);
            edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
          }
        }
        for (const t of pf.triangles) {
          const edges = [
            [t.vertices[0], t.vertices[1]],
            [t.vertices[1], t.vertices[2]],
            [t.vertices[2], t.vertices[0]]
          ];
          for (const [vA, vB] of edges) {
            const key = getEdgeKey(vA, vB);
            if (edgeCounts.get(key) === 1) {
              rimVertices.push(vA.x, vA.y, vA.z, vB.x, vB.y, vB.z);
            }
          }
        }
        const rimGeometry = new THREE.BufferGeometry();
        rimGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rimVertices, 3));

        return (
          <group key={pf.id} position={position} quaternion={quaternion} scale={scale}>
            {/* Transparent colored face */}
            <mesh geometry={faceGeometries[i]}>
              <meshPhysicalMaterial 
                color={color} 
                side={THREE.DoubleSide} 
                transparent={true}
                opacity={0.65}
                polygonOffset 
                polygonOffsetFactor={1} 
                polygonOffsetUnits={1} 
                roughness={0.1}
                metalness={0.1}
                clearcoat={1.0}
                clearcoatRoughness={0.1}
              />
            </mesh>
            {/* Solid rim - now using only outer edges */}
            <lineSegments geometry={rimGeometry}>
              <lineBasicMaterial color={color} linewidth={4} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
