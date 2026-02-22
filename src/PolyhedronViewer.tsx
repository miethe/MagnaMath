import React, { useMemo } from 'react';
import * as THREE from 'three';
import { extractPolyhedra, buildSpanningTree, computeTransforms, PolyFace, PolyEdge, HingeNode, getPolygonSides } from './geometry';

interface PolyhedronViewerProps {
  geometry: THREE.BufferGeometry;
  unfoldProgress: number;
  onTileCountsChange?: (counts: Record<number, number>) => void;
}

const TILE_COLORS: Record<number, string> = {
  3: '#ef4444', // Red for triangles
  4: '#3b82f6', // Blue for squares
  5: '#eab308', // Yellow for pentagons
  6: '#22c55e', // Green for hexagons
  8: '#a855f7', // Purple for octagons
};

export function PolyhedronViewer({ geometry, unfoldProgress, onTileCountsChange }: PolyhedronViewerProps) {
  const { polyFaces, polyEdges, spanningTree, faceGeometries, polyFacesMap, tileCounts, faceSides } = useMemo(() => {
    const { polyFaces, polyEdges } = extractPolyhedra(geometry);
    const spanningTree = buildSpanningTree(polyFaces, polyEdges);
    
    const polyFacesMap = new Map<number, PolyFace>();
    const counts: Record<number, number> = {};
    const faceSides = new Map<number, number>();

    for (const pf of polyFaces) {
      polyFacesMap.set(pf.id, pf);
      const sides = getPolygonSides(pf);
      faceSides.set(pf.id, sides);
      counts[sides] = (counts[sides] || 0) + 1;
    }
    
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
    
    return { polyFaces, polyEdges, spanningTree, faceGeometries, polyFacesMap, tileCounts: counts, faceSides };
  }, [geometry]);

  React.useEffect(() => {
    if (onTileCountsChange) {
      onTileCountsChange(tileCounts);
    }
  }, [tileCounts, onTileCountsChange]);

  const transforms = useMemo(() => {
    const map = new Map<number, THREE.Matrix4>();
    if (spanningTree) {
      computeTransforms(spanningTree, polyFacesMap, unfoldProgress, new THREE.Matrix4(), map);
    }
    return map;
  }, [spanningTree, polyFacesMap, unfoldProgress]);

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
        const color = TILE_COLORS[sides] || '#f97316'; // Default orange

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
            {/* Solid rim */}
            <lineSegments>
              <edgesGeometry args={[faceGeometries[i], 1]} />
              <lineBasicMaterial color={color} linewidth={4} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
