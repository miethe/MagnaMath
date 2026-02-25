import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { ChevronLeft, ChevronRight, X, List } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { PolyhedronViewer } from '../PolyhedronViewer';
import { generateShape } from '../ShapeGenerator';

// Import markdown files
import step1 from '../tutorials/01-platonic-solids.md?raw';
import step2 from '../tutorials/02-eulers-formula.md?raw';
import step3 from '../tutorials/03-unfolding.md?raw';
import step4 from '../tutorials/04-curvature.md?raw';
import step5 from '../tutorials/05-tessellation.md?raw';
import step6 from '../tutorials/06-symmetry.md?raw';
import step7 from '../tutorials/07-dual-polyhedra.md?raw';
import step8 from '../tutorials/08-truncation.md?raw';
import step9 from '../tutorials/09-2d-tilings.md?raw';
import step10 from '../tutorials/10-descartes-theorem.md?raw';

import {
  StepPlatonic,
  StepEuler,
  StepUnfolding,
  StepCurvature,
  StepTessellation,
  StepSymmetry,
  StepDual,
  StepTruncation,
  StepTiling,
  StepDescartes,
  useShape
} from './tutorial/TutorialScenes';

const TUTORIAL_STEPS = [
  { id: 1, content: step1, title: 'Platonic Solids' },
  { id: 2, content: step2, title: "Euler's Formula" },
  { id: 3, content: step3, title: 'Unfolding' },
  { id: 4, content: step4, title: 'Curvature' },
  { id: 5, content: step5, title: 'Tessellation' },
  { id: 6, content: step6, title: 'Symmetry' },
  { id: 7, content: step7, title: 'Dual Polyhedra' },
  { id: 8, content: step8, title: 'Truncation' },
  { id: 9, content: step9, title: '2D Tilings' },
  { id: 10, content: step10, title: "Descartes' Theorem" },
];

function TocScene() {
  const tocGeom = useShape({
    family: 'Geodesic', platonicType: 'Icosahedron', sides: 3, radius: 2.5, height: 1, detail: 1, tubeRadius: 0.5, tubularSegments: 12, radialSegments: 6, tessellation: 1, curvature: 0.5, symmetry: 'None'
  });
  return (
    <group>
      {tocGeom && <PolyhedronViewer geometry={tocGeom} unfoldProgress={0} />}
    </group>
  );
}

interface TutorialModeProps {
  onClose: () => void;
}

export function TutorialMode({ onClose }: TutorialModeProps) {
  const [currentStep, setCurrentStep] = useState(-1);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderTutorialScene = () => {
    switch (currentStep) {
      case -1: return <TocScene />;
      case 0: return <StepPlatonic />;
      case 1: return <StepEuler />;
      case 2: return <StepUnfolding />;
      case 3: return <StepCurvature />;
      case 4: return <StepTessellation />;
      case 5: return <StepSymmetry />;
      case 6: return <StepDual />;
      case 7: return <StepTruncation />;
      case 8: return <StepTiling />;
      case 9: return <StepDescartes />;
      default: return <TocScene />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-neutral-900 text-white">
      {/* 3D Viewport */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
          <color attach="background" args={['#171717']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
          <directionalLight position={[-10, -10, -10]} intensity={0.4} />
          <Environment preset="city" />
          
          {renderTutorialScene()}
          
          <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={2} far={4} color="#000000" />
          <OrbitControls makeDefault />
        </Canvas>
      </div>

      {/* Tutorial Sidebar */}
      <div className="w-96 bg-neutral-800 border-l border-neutral-700 flex flex-col shadow-2xl relative z-10">
        <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-900/50">
          <h2 className="text-lg font-bold text-indigo-400">Tutorial Mode</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {currentStep === -1 ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">MagnaMath</h1>
                <p className="text-neutral-400">Interactive Geometry Tutorial</p>
              </div>
              <div className="space-y-2">
                {TUTORIAL_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-700 hover:bg-neutral-700 hover:border-indigo-500 transition-all text-left group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      {step.id}
                    </span>
                    <span className="font-medium text-neutral-200 group-hover:text-white transition-colors">
                      {step.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex justify-between items-center">
                <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                <button onClick={() => setCurrentStep(-1)} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <List size={14} /> TOC
                </button>
              </div>
              <div className="prose prose-invert prose-indigo">
                <div className="markdown-body">
                  <Markdown>{TUTORIAL_STEPS[currentStep].content}</Markdown>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-neutral-700 flex justify-between items-center bg-neutral-900/50">
          <button 
            onClick={handlePrev}
            disabled={currentStep === -1}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${currentStep === -1 ? 'text-neutral-600 cursor-not-allowed' : 'text-white hover:bg-neutral-700'}`}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          
          <div className="flex gap-1">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-indigo-500' : 'bg-neutral-600'}`} />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            disabled={currentStep === TUTORIAL_STEPS.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${currentStep === TUTORIAL_STEPS.length - 1 ? 'text-neutral-600 cursor-not-allowed' : 'text-white hover:bg-neutral-700'}`}
          >
            {currentStep === -1 ? 'Start' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
