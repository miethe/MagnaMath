import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { PolyhedronViewer } from './PolyhedronViewer';
import { generateShape, ShapeParams, ShapeFamily } from './ShapeGenerator';
import { Settings, ChevronRight, ChevronDown, X } from 'lucide-react';

export default function App() {
  const [shapeParams, setShapeParams] = useState<ShapeParams>({
    family: 'Platonic',
    platonicType: 'Cube',
    sides: 6,
    radius: 1.5,
    height: 2,
  });
  
  const [unfoldProgress, setUnfoldProgress] = useState(0);
  const [tileCounts, setTileCounts] = useState<Record<number, number>>({});
  const [isPaneOpen, setIsPaneOpen] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { geometry, name: shapeName } = useMemo(() => generateShape(shapeParams), [shapeParams]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDialogOpen(false);
    setUnfoldProgress(0);
  };

  const getTileName = (sides: number) => {
    const names: Record<number, string> = { 3: 'Triangles', 4: 'Squares', 5: 'Pentagons', 6: 'Hexagons', 8: 'Octagons' };
    return names[sides] || `${sides}-gons`;
  };

  return (
    <div className="w-full h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900 overflow-hidden">
      <header className="px-6 py-4 bg-white border-b border-neutral-200 flex justify-between items-center shadow-sm z-10">
        <h1 className="text-xl font-semibold tracking-tight">MagnaMath</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-neutral-600">{shapeName}</span>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Settings size={16} />
            Generate Shape
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Collapsible Pane */}
        <div className={`absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-neutral-200 rounded-xl shadow-lg transition-all duration-300 overflow-hidden ${isPaneOpen ? 'w-64' : 'w-12'}`}>
          <button 
            onClick={() => setIsPaneOpen(!isPaneOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
          >
            {isPaneOpen ? (
              <span className="font-semibold text-sm">Shape Details</span>
            ) : (
              <span className="sr-only">Open Details</span>
            )}
            {isPaneOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          {isPaneOpen && (
            <div className="p-4 pt-0 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 mt-2">Tile Composition</h3>
              <ul className="space-y-2">
                {Object.entries(tileCounts).map(([sides, count]) => (
                  <li key={sides} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{
                        backgroundColor: sides === '3' ? '#ef4444' : sides === '4' ? '#3b82f6' : sides === '5' ? '#eab308' : sides === '6' ? '#22c55e' : sides === '8' ? '#a855f7' : '#f97316'
                      }}></span>
                      {getTileName(Number(sides))}
                    </span>
                    <span className="font-medium bg-neutral-100 px-2 py-0.5 rounded-md">{count}</span>
                  </li>
                ))}
              </ul>
              
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 mt-6">Geometry</h3>
              <div className="space-y-1 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Total Faces:</span>
                  <span className="font-medium text-neutral-900">{Object.values(tileCounts).reduce((a, b) => a + b, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Family:</span>
                  <span className="font-medium text-neutral-900">{shapeParams.family}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 3, 5], fov: 45 }}>
            <color attach="background" args={['#f5f5f5']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
            <directionalLight position={[-10, -10, -10]} intensity={0.4} />
            <Environment preset="city" />
            
            <PolyhedronViewer 
              geometry={geometry} 
              unfoldProgress={unfoldProgress} 
              onTileCountsChange={setTileCounts}
            />
            
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
            <OrbitControls makeDefault />
          </Canvas>
        </div>
      </main>

      <footer className="px-8 py-6 bg-white border-t border-neutral-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex justify-between text-xs font-medium text-neutral-500 uppercase tracking-wider">
            <span>Folded (3D)</span>
            <span>Unfolded (2D)</span>
          </div>
          <input 
            type="range" 
            min="0" max="1" step="0.001" 
            value={unfoldProgress}
            onChange={(e) => setUnfoldProgress(parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </footer>

      {/* Generation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold">Generate Shape</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-neutral-500 hover:text-neutral-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Shape Family</label>
                <select 
                  className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                  value={shapeParams.family}
                  onChange={(e) => setShapeParams({...shapeParams, family: e.target.value as ShapeFamily})}
                >
                  <option value="Platonic">Platonic Solid</option>
                  <option value="Prism">Prism</option>
                  <option value="Pyramid">Pyramid</option>
                  <option value="Bipyramid">Bipyramid</option>
                </select>
              </div>

              {shapeParams.family === 'Platonic' ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                  <select 
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    value={shapeParams.platonicType}
                    onChange={(e) => setShapeParams({...shapeParams, platonicType: e.target.value as any})}
                  >
                    <option value="Tetrahedron">Tetrahedron</option>
                    <option value="Cube">Cube</option>
                    <option value="Octahedron">Octahedron</option>
                    <option value="Dodecahedron">Dodecahedron</option>
                    <option value="Icosahedron">Icosahedron</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Base Sides (n-gonal)</label>
                  <input 
                    type="number" 
                    min="3" max="12" 
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    value={shapeParams.sides}
                    onChange={(e) => setShapeParams({...shapeParams, sides: parseInt(e.target.value) || 3})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Radius / Size</label>
                  <input 
                    type="number" 
                    min="0.5" max="5" step="0.1"
                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                    value={shapeParams.radius}
                    onChange={(e) => setShapeParams({...shapeParams, radius: parseFloat(e.target.value) || 1.5})}
                  />
                </div>
                {shapeParams.family !== 'Platonic' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Height</label>
                    <input 
                      type="number" 
                      min="0.5" max="5" step="0.1"
                      className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                      value={shapeParams.height}
                      onChange={(e) => setShapeParams({...shapeParams, height: parseFloat(e.target.value) || 2})}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-200 mt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
