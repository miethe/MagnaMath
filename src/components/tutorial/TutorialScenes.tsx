import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { PolyhedronViewer } from '../../PolyhedronViewer';
import { generateShape, ShapeParams } from '../../ShapeGenerator';

// Custom hook to manage geometry lifecycle and prevent memory leaks
export function useShape(params: ShapeParams) {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    const { geometry } = generateShape(params);
    setGeom(geometry);
    return () => geometry.dispose();
  }, [JSON.stringify(params)]);
  return geom;
}

export function StepPlatonic() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.3;
    }
  });

  const shapes = ['Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron'].map(type => {
    return useShape({
      family: 'Platonic', platonicType: type as any, sides: 3, radius: 1, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0, symmetry: 'None'
    });
  });

  return (
    <group ref={groupRef}>
      {shapes.map((geom, i) => geom && (
        <group key={i} position={[(i - 2) * 3, 0, 0]}>
          <PolyhedronViewer geometry={geom} unfoldProgress={0} />
        </group>
      ))}
    </group>
  );
}

export function StepEuler() {
  const [tessellation, setTessellation] = useState(1);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  const geometry = useShape({
    family: 'Platonic', platonicType: 'Icosahedron', sides: 3, radius: 2, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation, curvature: 0, symmetry: 'None'
  });

  const stats = useMemo(() => {
    if (!geometry) return { v: 0, e: 0, f: 0, pointsGeom: null, linesGeom: null };
    
    const pos = geometry.attributes.position.array;
    const uniqueVertices: THREE.Vector3[] = [];
    const vertexMap = new Map();
    for (let i=0; i<pos.length; i+=3) {
      const key = `${pos[i].toFixed(3)},${pos[i+1].toFixed(3)},${pos[i+2].toFixed(3)}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, uniqueVertices.length);
        uniqueVertices.push(new THREE.Vector3(pos[i], pos[i+1], pos[i+2]));
      }
    }

    const uniqueEdges: THREE.Vector3[] = [];
    const edgeMap = new Set();
    const index = geometry.index ? geometry.index.array : null;
    const getV = (idx: number) => {
      if (index) idx = index[idx];
      return new THREE.Vector3(pos[idx*3], pos[idx*3+1], pos[idx*3+2]);
    };
    
    const count = index ? index.length : pos.length / 3;
    for (let i=0; i<count; i+=3) {
      for (let j=0; j<3; j++) {
        const vA = getV(i+j);
        const vB = getV(i+((j+1)%3));
        const keyA = `${vA.x.toFixed(3)},${vA.y.toFixed(3)},${vA.z.toFixed(3)}`;
        const keyB = `${vB.x.toFixed(3)},${vB.y.toFixed(3)},${vB.z.toFixed(3)}`;
        const key = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
        if (!edgeMap.has(key)) {
          edgeMap.add(key);
          uniqueEdges.push(vA, vB);
        }
      }
    }

    const pGeom = new THREE.BufferGeometry().setFromPoints(uniqueVertices);
    const lGeom = new THREE.BufferGeometry().setFromPoints(uniqueEdges);

    return {
      v: uniqueVertices.length,
      e: uniqueEdges.length / 2,
      f: count / 3,
      pointsGeom: pGeom,
      linesGeom: lGeom
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      stats.pointsGeom?.dispose();
      stats.linesGeom?.dispose();
    };
  }, [stats]);

  return (
    <group>
      {geometry && (
        <group ref={groupRef}>
          <mesh geometry={geometry}>
            <meshStandardMaterial color="#22c55e" transparent opacity={0.6} polygonOffset polygonOffsetFactor={1} />
          </mesh>
          {stats.linesGeom && (
            <lineSegments geometry={stats.linesGeom}>
              <lineBasicMaterial color="#ef4444" linewidth={2} />
            </lineSegments>
          )}
          {stats.pointsGeom && (
            <points geometry={stats.pointsGeom}>
              <pointsMaterial color="#3b82f6" size={0.2} sizeAttenuation />
            </points>
          )}
        </group>
      )}
      
      <Html center style={{ position: 'absolute', top: '-40vh', left: 0, transform: 'translateX(-50%)' }}>
        <div className="flex flex-col items-center gap-4" onPointerDown={(e) => e.stopPropagation()}>
          <div className="bg-neutral-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-neutral-700 shadow-2xl flex items-center gap-4 font-mono text-xl whitespace-nowrap">
            <div className="flex flex-col items-center"><span className="text-xs text-neutral-400">Vertices</span><span className="text-blue-400 font-bold">{stats.v}</span></div>
            <span className="text-white">-</span>
            <div className="flex flex-col items-center"><span className="text-xs text-neutral-400">Edges</span><span className="text-red-400 font-bold">{stats.e}</span></div>
            <span className="text-white">+</span>
            <div className="flex flex-col items-center"><span className="text-xs text-neutral-400">Faces</span><span className="text-green-400 font-bold">{stats.f}</span></div>
            <span className="text-white">=</span>
            <span className="text-3xl font-bold text-white">2</span>
          </div>
          <div className="bg-neutral-800/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-700 shadow-2xl flex flex-col items-center gap-2 w-full">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tessellation (Subdivisions)</label>
            <input 
              type="range" min="1" max="4" step="1" 
              value={tessellation} onChange={e => setTessellation(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

export function StepUnfolding() {
  const [progress, setProgress] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current && progress === 0) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    } else if (groupRef.current) {
      // Slowly rotate back to 0 when unfolding
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
    }
  });

  const geometry = useShape({
    family: 'Platonic', platonicType: 'Cube', sides: 3, radius: 2, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0, symmetry: 'None'
  });

  return (
    <group>
      <group ref={groupRef} position={[0, 1, 0]}>
        {geometry && <PolyhedronViewer geometry={geometry} unfoldProgress={progress} />}
      </group>
      <Html center style={{ position: 'absolute', top: '35vh', left: 0, transform: 'translateX(-50%)' }}>
        <div className="bg-neutral-800/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-700 shadow-2xl flex flex-col items-center gap-2 w-64" onPointerDown={(e) => e.stopPropagation()}>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Unfold Progress</label>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={progress} onChange={e => setProgress(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
      </Html>
    </group>
  );
}

export function StepCurvature() {
  const [curvature, setCurvature] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  const geometry = useShape({
    family: 'Platonic', platonicType: 'Cube', sides: 3, radius: 2, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 4, curvature, symmetry: 'None'
  });

  return (
    <group>
      <group ref={groupRef}>
        {geometry && <PolyhedronViewer geometry={geometry} unfoldProgress={0} />}
      </group>
      <Html center style={{ position: 'absolute', top: '35vh', left: 0, transform: 'translateX(-50%)' }}>
        <div className="bg-neutral-800/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-700 shadow-2xl flex flex-col items-center gap-2 w-64" onPointerDown={(e) => e.stopPropagation()}>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Curvature</label>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={curvature} onChange={e => setCurvature(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
      </Html>
    </group>
  );
}

export function StepTessellation() {
  const [tessellation, setTessellation] = useState(1);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  const geometry = useShape({
    family: 'Platonic', platonicType: 'Tetrahedron', sides: 3, radius: 2, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation, curvature: 0, symmetry: 'None'
  });

  return (
    <group>
      <group ref={groupRef}>
        {geometry && <PolyhedronViewer geometry={geometry} unfoldProgress={0} />}
      </group>
      <Html center style={{ position: 'absolute', top: '35vh', left: 0, transform: 'translateX(-50%)' }}>
        <div className="bg-neutral-800/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-700 shadow-2xl flex flex-col items-center gap-2 w-64" onPointerDown={(e) => e.stopPropagation()}>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tessellation</label>
          <input 
            type="range" min="1" max="5" step="1" 
            value={tessellation} onChange={e => setTessellation(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
      </Html>
    </group>
  );
}

export function StepSymmetry() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const geometry = useShape({
    family: 'Pyramid', platonicType: 'Cube', sides: 5, radius: 1.5, height: 2, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0, symmetry: 'Mirror X'
  });

  return (
    <group ref={groupRef}>
      {/* Mirror Plane */}
      <mesh rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {geometry && <PolyhedronViewer geometry={geometry} unfoldProgress={0} />}
    </group>
  );
}

export function StepDual() {
  const [shape, setShape] = useState<'Cube' | 'Dodecahedron'>('Cube');
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  const baseGeom = useShape({
    family: 'Platonic', platonicType: shape, sides: 3, radius: 2, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0, symmetry: 'None'
  });
  
  const dualGeom = useShape({
    family: 'Platonic', platonicType: shape === 'Cube' ? 'Octahedron' : 'Icosahedron', sides: 3, radius: shape === 'Cube' ? 1.5 : 1.6, height: 1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0, symmetry: 'None'
  });

  return (
    <group>
      <group ref={groupRef}>
        {baseGeom && (
          <mesh geometry={baseGeom}>
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} wireframe />
          </mesh>
        )}
        {dualGeom && (
          <mesh geometry={dualGeom}>
            <meshStandardMaterial color="#ec4899" transparent opacity={0.9} />
          </mesh>
        )}
      </group>
      <Html center style={{ position: 'absolute', top: '35vh', left: 0, transform: 'translateX(-50%)' }}>
        <div className="bg-neutral-800/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-700 shadow-2xl flex gap-4" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShape('Cube')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${shape === 'Cube' ? 'bg-indigo-500 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}
          >
            Cube / Octahedron
          </button>
          <button 
            onClick={() => setShape('Dodecahedron')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${shape === 'Dodecahedron' ? 'bg-indigo-500 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}
          >
            Dodecahedron / Icosahedron
          </button>
        </div>
      </Html>
    </group>
  );
}

export function StepTruncation() {
  const groupRef = useRef<THREE.Group>(null);
  const [geom] = useState(() => {
    const g = new THREE.BufferGeometry();
    const indices = [];
    const corners: THREE.Vector3[] = [];
    for(let i=0; i<8; i++) {
        corners.push(new THREE.Vector3((i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1));
    }
    
    for(let i=0; i<8; i++) {
        const base = i*3;
        const c = corners[i];
        const p0 = new THREE.Vector3(c.x*0.5, c.y, c.z);
        const p1 = new THREE.Vector3(c.x, c.y*0.5, c.z);
        const p2 = new THREE.Vector3(c.x, c.y, c.z*0.5);
        const n = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0));
        if (n.dot(c) < 0) {
            indices.push(base, base+2, base+1);
        } else {
            indices.push(base, base+1, base+2);
        }
    }
    
    const axes = [
        {axis: 'x', sign: 1}, {axis: 'x', sign: -1},
        {axis: 'y', sign: 1}, {axis: 'y', sign: -1},
        {axis: 'z', sign: 1}, {axis: 'z', sign: -1},
    ];
    axes.forEach(a => {
        const facePts: {c: THREE.Vector3, idx: number}[] = [];
        for(let idx=0; idx<24; idx++) {
            const cornerIdx = Math.floor(idx/3);
            const c = corners[cornerIdx];
            if (c[a.axis as keyof THREE.Vector3] === a.sign) {
                if ((a.axis === 'x' && idx%3 !== 0) ||
                    (a.axis === 'y' && idx%3 !== 1) ||
                    (a.axis === 'z' && idx%3 !== 2)) {
                    facePts.push({ c, idx });
                }
            }
        }
        
        const center = new THREE.Vector3();
        facePts.forEach(fp => center.add(fp.c));
        center.divideScalar(facePts.length);
        
        const u = new THREE.Vector3();
        const v = new THREE.Vector3();
        if (a.axis === 'x') { u.set(0,1,0); v.set(0,0,1); }
        if (a.axis === 'y') { u.set(1,0,0); v.set(0,0,1); }
        if (a.axis === 'z') { u.set(1,0,0); v.set(0,1,0); }
        if (a.sign < 0) {
            const temp = u.clone(); u.copy(v); v.copy(temp);
        }
        
        facePts.sort((fp1, fp2) => {
            const d1 = fp1.c.clone().sub(center);
            const d2 = fp2.c.clone().sub(center);
            const angle1 = Math.atan2(d1.dot(v), d1.dot(u));
            const angle2 = Math.atan2(d2.dot(v), d2.dot(u));
            return angle1 - angle2;
        });
        
        for(let i=1; i<facePts.length-1; i++) {
            indices.push(facePts[0].idx, facePts[i].idx, facePts[i+1].idx);
        }
    });
    
    g.setIndex(indices);
    g.userData = { corners };
    return g;
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
    
    const t = (Math.sin(state.clock.elapsedTime * 2) + 1) / 4; // 0 to 0.5
    const positions = new Float32Array(24 * 3);
    let i = 0;
    const corners = geom.userData.corners as THREE.Vector3[];
    corners.forEach(c => {
        positions[i++] = c.x*(1-t); positions[i++] = c.y; positions[i++] = c.z;
        positions[i++] = c.x; positions[i++] = c.y*(1-t); positions[i++] = c.z;
        positions[i++] = c.x; positions[i++] = c.y; positions[i++] = c.z*(1-t);
    });
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();
  });

  return (
    <group ref={groupRef} scale={[1.5, 1.5, 1.5]}>
      <mesh geometry={geom}>
        <meshStandardMaterial color="#8b5cf6" flatShading={true} roughness={0.2} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geom}>
        <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export function StepTiling() {
  const hexGeom = useShape({
    family: 'Prism', platonicType: 'Cube', sides: 6, radius: 1, height: 0.1, detail: 0, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0, symmetry: 'None'
  });

  return (
    <group rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]}>
      {[[-1.5, 0.866], [0, 0], [1.5, -0.866], [0, 1.732], [1.5, 0.866], [-1.5, -0.866]].map((pos, i) => (
        <group key={i} position={[pos[0], pos[1], 0]}>
          {hexGeom && <PolyhedronViewer geometry={hexGeom} unfoldProgress={0} />}
        </group>
      ))}
    </group>
  );
}

export function StepDescartes() {
  return (
    <group position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* Square 1: Top Right */}
      <mesh position={[1, 1, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color="#3b82f6" side={THREE.DoubleSide} />
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(2, 2)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      </mesh>
      
      {/* Square 2: Top Left */}
      <mesh position={[-1, 1, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color="#22c55e" side={THREE.DoubleSide} />
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(2, 2)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      </mesh>
      
      {/* Square 3: Bottom Left */}
      <mesh position={[-1, -1, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color="#a855f7" side={THREE.DoubleSide} />
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(2, 2)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      </mesh>
      
      {/* Deficit Wedge */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[2, 32, -Math.PI/2, Math.PI/2]} />
        <meshBasicMaterial color="#f97316" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* HTML Overlays */}
      <Html position={[0.5, 0.5, 0]} center>
        <div className="text-white font-bold text-xl drop-shadow-md">90°</div>
      </Html>
      <Html position={[-0.5, 0.5, 0]} center>
        <div className="text-white font-bold text-xl drop-shadow-md">90°</div>
      </Html>
      <Html position={[-0.5, -0.5, 0]} center>
        <div className="text-white font-bold text-xl drop-shadow-md">90°</div>
      </Html>
      
      <Html position={[1, -1, 0]} center>
        <div className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap animate-pulse">
          Angle Deficit: 90°
        </div>
      </Html>
    </group>
  );
}
