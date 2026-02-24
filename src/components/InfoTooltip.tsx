import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoTooltipProps {
  title: string;
  description: string;
  animationType: 'radius' | 'height' | 'curvature' | 'symmetry' | 'tessellation' | 'family' | 'sides' | 'detail' | 'torus';
}

export function InfoTooltip({ title, description, animationType }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderAnimation = () => {
    switch (animationType) {
      case 'radius':
        return (
          <div className="flex justify-center items-center h-24 bg-indigo-50/50 rounded-xl mb-3 border border-indigo-100/50">
            <motion.div 
              className="bg-indigo-400 rounded-full opacity-80 shadow-inner"
              animate={{ width: [30, 60, 30], height: [30, 60, 30] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      case 'height':
        return (
          <div className="flex justify-center items-center h-24 bg-emerald-50/50 rounded-xl mb-3 border border-emerald-100/50 flex-col justify-end pb-4">
            <motion.div 
              className="bg-emerald-400 rounded-t-lg w-12 opacity-80 shadow-inner"
              animate={{ height: [20, 60, 20] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="w-16 h-2 bg-emerald-600 rounded-full mt-1 opacity-50" />
          </div>
        );
      case 'curvature':
        return (
          <div className="flex justify-center items-center h-24 bg-amber-50/50 rounded-xl mb-3 border border-amber-100/50">
            <motion.div 
              className="bg-amber-400 w-12 h-12 opacity-80 shadow-inner"
              animate={{ borderRadius: ["0%", "50%", "0%"], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      case 'symmetry':
        return (
          <div className="flex justify-center items-center h-24 bg-rose-50/50 rounded-xl mb-3 border border-rose-100/50 relative overflow-hidden">
            {/* Mirror Line */}
            <div className="absolute top-4 bottom-4 left-1/2 w-0.5 border-r-2 border-dashed border-rose-300/50" />
            
            {/* Left Shape */}
            <div className="absolute right-1/2 mr-2 w-8 h-10 bg-rose-400 rounded-l-full opacity-80 shadow-sm" />
            
            {/* Right Shape (Mirrored) */}
            <motion.div 
              className="absolute left-1/2 ml-2 w-8 h-10 bg-rose-400 rounded-l-full opacity-60 shadow-sm origin-left"
              style={{ scaleX: -1 }}
              animate={{ 
                opacity: [0.2, 0.8, 0.2],
                x: [5, 0, 5]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      case 'tessellation':
        return (
          <div className="flex justify-center items-center h-24 bg-cyan-50/50 rounded-xl mb-3 border border-cyan-100/50">
            <motion.div 
              className="grid grid-cols-2 gap-1 w-12 h-12"
              animate={{ gap: ["0px", "4px", "0px"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="bg-cyan-400 rounded-sm opacity-80" />
              <div className="bg-cyan-400 rounded-sm opacity-80" />
              <div className="bg-cyan-400 rounded-sm opacity-80" />
              <div className="bg-cyan-400 rounded-sm opacity-80" />
            </motion.div>
          </div>
        );
      case 'family':
        return (
          <div className="flex justify-center items-center h-24 bg-violet-50/50 rounded-xl mb-3 border border-violet-100/50 perspective-[200px]">
            <motion.div 
              className="w-12 h-12 border-4 border-violet-400 rounded-lg opacity-80"
              animate={{ rotateX: [0, 180, 360], rotateY: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
        );
      case 'sides':
        return (
          <div className="flex justify-center items-center h-24 bg-blue-50/50 rounded-xl mb-3 border border-blue-100/50">
            <motion.div 
              className="w-12 h-12 border-4 border-blue-400 opacity-80"
              animate={{ borderRadius: ["0%", "20%", "50%", "0%"], rotate: [0, 90, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      case 'detail':
        return (
          <div className="flex justify-center items-center h-24 bg-fuchsia-50/50 rounded-xl mb-3 border border-fuchsia-100/50">
            <motion.div 
              className="w-12 h-12 rounded-full border-2 border-fuchsia-400 opacity-80 flex items-center justify-center overflow-hidden relative"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div 
                className="absolute inset-0 border-2 border-fuchsia-300 rounded-full"
                animate={{ rotateX: [0, 180], rotateY: [0, 180] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-0 border-2 border-fuchsia-300 rounded-full"
                animate={{ rotateX: [90, 270], rotateY: [90, 270] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
        );
      case 'torus':
        return (
          <div className="flex justify-center items-center h-24 bg-pink-50/50 rounded-xl mb-3 border border-pink-100/50 perspective-[200px]">
            <motion.div 
              className="w-12 h-12 rounded-full border-[8px] border-pink-400 opacity-80"
              animate={{ rotateX: [0, 60, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative inline-flex items-center ml-1.5" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <Info size={14} className="text-neutral-400 hover:text-indigo-500 cursor-help transition-colors" />
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-64 p-4 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 pointer-events-none"
            style={{ transformOrigin: 'bottom center' }}
          >
            {renderAnimation()}
            <h4 className="font-bold text-sm text-neutral-800 mb-1">{title}</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">{description}</p>
            
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 backdrop-blur-xl border-b border-r border-white/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
