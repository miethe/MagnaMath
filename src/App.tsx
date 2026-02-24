import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { PolyhedronViewer, GeometryStats } from "./PolyhedronViewer";
import {
  generateShape,
  ShapeParams,
  ShapeFamily,
  getPolyhedronName,
} from "./ShapeGenerator";
import { TileType } from "./geometry";
import {
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  Box,
  Palette,
  CheckCircle2,
  Circle,
  Lightbulb,
} from "lucide-react";
import { InfoTooltip } from "./components/InfoTooltip";
import { getShapeFacts } from "./utils/shapeFacts";

const DEFAULT_TILE_INVENTORY: Record<
  string,
  { enabled: boolean; color: string }
> = {
  "Small Square": { enabled: true, color: "#3b82f6" },
  "Equilateral Triangle": { enabled: true, color: "#ef4444" },
  "Isosceles Triangle (Tall)": { enabled: true, color: "#f97316" },
  "Isosceles Triangle (Short)": { enabled: true, color: "#eab308" },
  "Right Triangle": { enabled: true, color: "#22c55e" },
  Hexagon: { enabled: true, color: "#a855f7" },
  Octagon: { enabled: true, color: "#ec4899" },
  Other: { enabled: true, color: "#71717a" },
};

const GENERAL_COLORS: Record<number, string> = {
  3: "#ef4444",
  4: "#3b82f6",
  5: "#eab308",
  6: "#22c55e",
  8: "#a855f7",
};

export default function App() {
  const [shapeParams, setShapeParams] = useState<ShapeParams>({
    family: "Platonic",
    platonicType: "Cube",
    sides: 6,
    radius: 1.5,
    height: 2,
    detail: 1,
    tubeRadius: 0.5,
    tubularSegments: 12,
    radialSegments: 6,
    tessellation: 1,
    curvature: 0,
    symmetry: "None",
  });

  const [unfoldProgress, setUnfoldProgress] = useState(0);
  const [stats, setStats] = useState<GeometryStats | null>(null);
  const [isPaneOpen, setIsPaneOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [tileInventory, setTileInventory] = useState(DEFAULT_TILE_INVENTORY);
  const [restrictToInventory, setRestrictToInventory] = useState(false);
  const [generalColors, setGeneralColors] = useState(GENERAL_COLORS);

  const { geometry, name: shapeName } = useMemo(
    () => generateShape(shapeParams),
    [shapeParams],
  );

  const tileColors = useMemo(() => {
    if (restrictToInventory) {
      const colors: Record<string, string> = {};
      Object.entries(tileInventory).forEach(([type, config]) => {
        colors[type] = config.color;
      });
      return colors;
    } else {
      const colors: Record<string, string> = {};
      Object.entries(generalColors).forEach(([sides, color]) => {
        colors[sides] = color;
      });
      return colors;
    }
  }, [restrictToInventory, tileInventory, generalColors]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDialogOpen(false);
    setUnfoldProgress(0);
  };

  const toggleTile = (type: string) => {
    setTileInventory((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled },
    }));
  };

  const updateTileColor = (type: string, color: string) => {
    setTileInventory((prev) => ({
      ...prev,
      [type]: { ...prev[type], color },
    }));
  };

  const updateGeneralColor = (sides: number, color: string) => {
    setGeneralColors((prev) => ({
      ...prev,
      [sides]: color,
    }));
  };

  const isOptionDisabled = (
    family: ShapeFamily,
    type?: string,
    sides?: number,
  ) => {
    if (!restrictToInventory) return false;

    if (family === "Platonic") {
      if (type === "Tetrahedron")
        return !tileInventory["Equilateral Triangle"].enabled;
      if (type === "Cube") return !tileInventory["Small Square"].enabled;
      if (type === "Octahedron")
        return !tileInventory["Equilateral Triangle"].enabled;
      if (type === "Dodecahedron") return !tileInventory["Other"].enabled; // Pentagons
      if (type === "Icosahedron")
        return !tileInventory["Equilateral Triangle"].enabled;
    }

    if (["Prism", "Antiprism", "Pyramid", "Bipyramid"].includes(family)) {
      if (sides === 3 && !tileInventory["Equilateral Triangle"].enabled)
        return true;
      if (sides === 4 && !tileInventory["Small Square"].enabled) return true;
      if (sides === 6 && !tileInventory["Hexagon"].enabled) return true;
      if (sides === 8 && !tileInventory["Octagon"].enabled) return true;

      // Check side faces
      if (family === "Prism" && !tileInventory["Small Square"].enabled)
        return true;
      if (
        ["Pyramid", "Bipyramid", "Antiprism"].includes(family) &&
        !tileInventory["Equilateral Triangle"].enabled
      )
        return true;
    }

    return false;
  };

  // Auto-tuning Effect
  React.useEffect(() => {
    let newParams = { ...shapeParams };
    let changed = false;

    // 1. Curvature Tuning: Ensure sufficient tessellation
    if (newParams.curvature > 0 && newParams.tessellation < 2) {
      newParams.tessellation = 2;
      changed = true;
    }

    // 2. Inventory Tuning: Ensure valid shape selection
    if (restrictToInventory) {
      // Platonic Solids
      if (newParams.family === "Platonic") {
        if (isOptionDisabled("Platonic", newParams.platonicType)) {
          const types: ShapeParams["platonicType"][] = [
            "Cube",
            "Tetrahedron",
            "Octahedron",
            "Dodecahedron",
            "Icosahedron",
          ];
          const valid = types.find((t) => !isOptionDisabled("Platonic", t));
          if (valid) {
            newParams.platonicType = valid;
            changed = true;
          }
        }
      }

      // Prism/Pyramid Families
      if (
        ["Prism", "Antiprism", "Pyramid", "Bipyramid"].includes(
          newParams.family,
        )
      ) {
        // Check if family is viable (e.g. Prism needs squares)
        const needsSquares =
          newParams.family === "Prism" &&
          !tileInventory["Small Square"].enabled;
        const needsTriangles =
          ["Pyramid", "Bipyramid", "Antiprism"].includes(newParams.family) &&
          !tileInventory["Equilateral Triangle"].enabled;

        if (needsSquares || needsTriangles) {
          // Try to switch to a valid family
          if (
            !tileInventory["Small Square"].enabled &&
            tileInventory["Equilateral Triangle"].enabled
          ) {
            newParams.family = "Pyramid"; // Switch to Pyramid if squares are out but triangles in
            changed = true;
          } else if (
            tileInventory["Small Square"].enabled &&
            !tileInventory["Equilateral Triangle"].enabled
          ) {
            newParams.family = "Prism"; // Switch to Prism if triangles out but squares in
            changed = true;
          } else if (
            !tileInventory["Small Square"].enabled &&
            !tileInventory["Equilateral Triangle"].enabled
          ) {
            // If both main tiles are out, maybe Platonic Dodecahedron (Pentagons)?
            if (tileInventory["Other"].enabled) {
              newParams.family = "Platonic";
              newParams.platonicType = "Dodecahedron";
              changed = true;
            }
          }
        }

        // Check Base Sides
        if (
          !changed &&
          isOptionDisabled(newParams.family, undefined, newParams.sides)
        ) {
          const validSides = [4, 3, 6, 8].find(
            (s) => !isOptionDisabled(newParams.family, undefined, s),
          );
          if (validSides) {
            newParams.sides = validSides;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setShapeParams(newParams);
    }
  }, [shapeParams, restrictToInventory, tileInventory]);

  const facts = useMemo(() => {
    if (!stats) return [];
    return getShapeFacts(
      shapeParams,
      stats.totalFaces,
      stats.totalEdges,
      stats.totalVertices,
    );
  }, [shapeParams, stats]);

  return (
    <div className="w-full h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <header className="px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            MagnaMath
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-neutral-500 hidden sm:inline-block bg-neutral-100 px-3 py-1 rounded-full">
            {shapeName}{" "}
            {stats &&
              stats.totalFaces > 0 &&
              `(${getPolyhedronName(stats.totalFaces)})`}
          </span>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all active:scale-95 shadow-lg shadow-neutral-900/20"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Generate Shape</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Left Pane: Shape Details */}
        <div
          className={`absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-2xl transition-all duration-500 ease-out overflow-hidden ${isPaneOpen ? "w-72" : "w-14"}`}
        >
          <button
            onClick={() => setIsPaneOpen(!isPaneOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
          >
            {isPaneOpen ? (
              <span className="font-bold text-sm text-neutral-800">
                Shape Details
              </span>
            ) : (
              <Box size={20} className="mx-auto text-indigo-600" />
            )}
            {isPaneOpen &&
              (isPaneOpen ? (
                <ChevronDown size={18} className="text-neutral-400" />
              ) : (
                <ChevronRight size={18} className="text-neutral-400" />
              ))}
          </button>

          {isPaneOpen && stats && (
            <div className="p-5 pt-0 border-t border-neutral-100/50 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 mt-2">
                Tile Composition
              </h3>
              <ul className="space-y-2.5">
                {Object.entries(stats.tileTypeCounts)
                  .sort()
                  .map(([type, count]) => (
                    <li
                      key={type}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="flex items-center gap-2.5 font-medium text-neutral-700">
                        <span
                          className="w-3.5 h-3.5 rounded-md inline-block shadow-sm"
                          style={{
                            backgroundColor: tileColors[type] || "#71717a",
                          }}
                        ></span>
                        {type}
                      </span>
                      <span className="font-bold text-neutral-900 bg-white shadow-sm border border-neutral-100 px-2.5 py-0.5 rounded-lg">
                        {count}
                      </span>
                    </li>
                  ))}
              </ul>

              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 mt-6">
                Geometry Stats
              </h3>
              <div className="space-y-2 text-sm text-neutral-600 bg-white/50 rounded-xl p-3 border border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Vertices (V)</span>
                  <span className="font-bold text-neutral-900">
                    {stats.totalVertices}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Edges (E)</span>
                  <span className="font-bold text-neutral-900">
                    {stats.totalEdges}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Faces (F)</span>
                  <span className="font-bold text-neutral-900">
                    {stats.totalFaces}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-indigo-600 mt-2 pt-2 border-t border-indigo-100/50 font-medium">
                  <span>Euler (V - E + F)</span>
                  <span className="font-bold font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
                    {stats.totalVertices - stats.totalEdges + stats.totalFaces}
                  </span>
                </div>
              </div>

              {facts.length > 0 && (
                <>
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 mt-6 flex items-center gap-1.5">
                    <Lightbulb size={12} className="text-amber-500" />
                    Did you know?
                  </h3>
                  <div className="space-y-3">
                    {facts.map((fact, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-neutral-600 leading-relaxed bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl"
                      >
                        {fact}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Tile Inventory */}
        <div
          className={`absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-2xl transition-all duration-500 ease-out overflow-hidden ${isInventoryOpen ? "w-80" : "w-14"}`}
        >
          <button
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
          >
            {isInventoryOpen ? (
              <span className="font-bold text-sm text-neutral-800">
                Tile Inventory
              </span>
            ) : (
              <Palette size={20} className="mx-auto text-pink-500" />
            )}
            {isInventoryOpen &&
              (isInventoryOpen ? (
                <ChevronDown size={18} className="text-neutral-400" />
              ) : (
                <ChevronRight size={18} className="text-neutral-400" />
              ))}
          </button>

          {isInventoryOpen && (
            <div className="p-5 pt-0 border-t border-neutral-100/50 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between py-4 mb-3 border-b border-neutral-100/50">
                <span className="text-sm font-bold text-neutral-700">
                  Only Available Tiles
                </span>
                <button
                  onClick={() => setRestrictToInventory(!restrictToInventory)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none shadow-inner ${restrictToInventory ? "bg-indigo-500" : "bg-neutral-200"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${restrictToInventory ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {restrictToInventory ? (
                <div className="space-y-3">
                  {Object.entries(tileInventory).map(([type, config]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between gap-3 bg-white/50 p-2 rounded-xl border border-neutral-100"
                    >
                      <button
                        onClick={() => toggleTile(type)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {config.enabled ? (
                          <CheckCircle2 size={18} className="text-indigo-500" />
                        ) : (
                          <Circle size={18} className="text-neutral-300" />
                        )}
                        <span
                          className={`text-sm ${config.enabled ? "text-neutral-800 font-semibold" : "text-neutral-400 font-medium"}`}
                        >
                          {type}
                        </span>
                      </button>
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-neutral-200 shrink-0">
                        <input
                          type="color"
                          value={config.color}
                          onChange={(e) =>
                            updateTileColor(type, e.target.value)
                          }
                          className="absolute -inset-2 w-12 h-12 cursor-pointer border-none bg-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500 mb-3 font-medium bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    Set colors for general shape types. Enable "Only Available
                    Tiles" to restrict generation to specific tile shapes.
                  </p>
                  {Object.entries(generalColors).map(([sides, color]) => (
                    <div
                      key={sides}
                      className="flex items-center justify-between gap-3 bg-white/50 p-2 rounded-xl border border-neutral-100"
                    >
                      <span className="text-sm font-semibold text-neutral-700 ml-2">
                        {sides}-gon Tiles
                      </span>
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-neutral-200 shrink-0">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) =>
                            updateGeneralColor(Number(sides), e.target.value)
                          }
                          className="absolute -inset-2 w-12 h-12 cursor-pointer border-none bg-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 3, 5], fov: 45 }}>
            <color attach="background" args={["#fafafa"]} />
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[10, 10, 10]}
              intensity={0.8}
              castShadow
            />
            <directionalLight position={[-10, -10, -10]} intensity={0.4} />
            <Environment preset="city" />

            <PolyhedronViewer
              geometry={geometry}
              unfoldProgress={unfoldProgress}
              onStatsChange={setStats}
              tileColors={tileColors}
            />

            <ContactShadows
              position={[0, -2, 0]}
              opacity={0.4}
              scale={10}
              blur={2}
              far={4}
            />
            <OrbitControls makeDefault />
          </Canvas>
        </div>
      </main>

      <footer className="px-8 py-6 bg-white/80 backdrop-blur-xl border-t border-neutral-200/50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            <span>Folded (3D)</span>
            <span>Unfolded (2D)</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={unfoldProgress}
            onChange={(e) => setUnfoldProgress(parseFloat(e.target.value))}
            className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-indigo-500 shadow-inner"
          />
        </div>
      </footer>

      {/* Generation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col border border-white/20">
            <div className="flex justify-between items-center p-5 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-xl font-bold text-neutral-800">
                Generate Shape
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleGenerate}
              className="p-6 space-y-5 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                    Shape Family
                    <InfoTooltip
                      title="Shape Family"
                      description="The overarching category of the 3D geometry. Each family has distinct structural rules and parameters."
                      animationType="family"
                    />
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                    value={shapeParams.family}
                    onChange={(e) =>
                      setShapeParams({
                        ...shapeParams,
                        family: e.target.value as ShapeFamily,
                      })
                    }
                  >
                    <option value="Platonic">Platonic Solid</option>
                    <option value="Prism">Prism</option>
                    <option value="Antiprism">Antiprism</option>
                    <option value="Pyramid">Pyramid</option>
                    <option value="Bipyramid">Bipyramid</option>
                    <option value="Geodesic">Geodesic Sphere</option>
                    <option value="Torus">Toroidal Polyhedron</option>
                  </select>
                </div>

                {shapeParams.family === "Platonic" && (
                  <div className="col-span-2">
                    <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                      Type
                      <InfoTooltip
                        title="Platonic Solid Type"
                        description="The specific regular polyhedron. There are only 5 in existence: Tetrahedron (4 faces), Cube (6), Octahedron (8), Dodecahedron (12), and Icosahedron (20)."
                        animationType="sides"
                      />
                    </label>
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                      value={shapeParams.platonicType}
                      onChange={(e) =>
                        setShapeParams({
                          ...shapeParams,
                          platonicType: e.target.value as any,
                        })
                      }
                    >
                      <option
                        value="Tetrahedron"
                        disabled={isOptionDisabled("Platonic", "Tetrahedron")}
                      >
                        Tetrahedron
                      </option>
                      <option
                        value="Cube"
                        disabled={isOptionDisabled("Platonic", "Cube")}
                      >
                        Cube
                      </option>
                      <option
                        value="Octahedron"
                        disabled={isOptionDisabled("Platonic", "Octahedron")}
                      >
                        Octahedron
                      </option>
                      <option
                        value="Dodecahedron"
                        disabled={isOptionDisabled("Platonic", "Dodecahedron")}
                      >
                        Dodecahedron
                      </option>
                      <option
                        value="Icosahedron"
                        disabled={isOptionDisabled("Platonic", "Icosahedron")}
                      >
                        Icosahedron
                      </option>
                    </select>
                  </div>
                )}

                {["Prism", "Antiprism", "Pyramid", "Bipyramid"].includes(
                  shapeParams.family,
                ) && (
                  <div className="col-span-2">
                    <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                      Base Sides (n-gonal)
                      <InfoTooltip
                        title="Base Sides"
                        description="The number of edges on the base polygon. For example, 3 creates a triangular base, 4 creates a square base, etc."
                        animationType="sides"
                      />
                    </label>
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                      value={shapeParams.sides}
                      onChange={(e) =>
                        setShapeParams({
                          ...shapeParams,
                          sides: parseInt(e.target.value),
                        })
                      }
                    >
                      <option
                        value={3}
                        disabled={isOptionDisabled(
                          shapeParams.family,
                          undefined,
                          3,
                        )}
                      >
                        3 (Triangle)
                      </option>
                      <option
                        value={4}
                        disabled={isOptionDisabled(
                          shapeParams.family,
                          undefined,
                          4,
                        )}
                      >
                        4 (Square)
                      </option>
                      <option
                        value={6}
                        disabled={isOptionDisabled(
                          shapeParams.family,
                          undefined,
                          6,
                        )}
                      >
                        6 (Hexagon)
                      </option>
                      <option
                        value={8}
                        disabled={isOptionDisabled(
                          shapeParams.family,
                          undefined,
                          8,
                        )}
                      >
                        8 (Octagon)
                      </option>
                      {[5, 7, 9, 10, 12].map((s) => (
                        <option
                          key={s}
                          value={s}
                          disabled={
                            restrictToInventory &&
                            !tileInventory["Other"].enabled
                          }
                        >
                          {s}-gonal
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {shapeParams.family === "Geodesic" && (
                  <div className="col-span-2">
                    <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                      Detail Level
                      <InfoTooltip
                        title="Geodesic Detail"
                        description="The number of times the base icosahedron is subdivided. Higher detail creates a smoother, more complex sphere made of many small triangles."
                        animationType="detail"
                      />
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                      value={shapeParams.detail}
                      onChange={(e) =>
                        setShapeParams({
                          ...shapeParams,
                          detail: parseInt(e.target.value) || 0,
                        })
                      }
                      disabled={
                        restrictToInventory &&
                        !tileInventory["Equilateral Triangle"].enabled
                      }
                    />
                  </div>
                )}

                {shapeParams.family === "Torus" && (
                  <>
                    <div>
                      <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                        Tube Radius
                        <InfoTooltip
                          title="Tube Radius"
                          description="The thickness of the donut's ring. A larger tube radius makes a fatter torus."
                          animationType="torus"
                        />
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="2"
                        step="0.1"
                        className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                        value={shapeParams.tubeRadius}
                        onChange={(e) =>
                          setShapeParams({
                            ...shapeParams,
                            tubeRadius: parseFloat(e.target.value) || 0.5,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                        Radial Segments
                        <InfoTooltip
                          title="Radial Segments"
                          description="The number of segments around the tube itself. Think of it as how many sides a slice of the donut has."
                          animationType="sides"
                        />
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="32"
                        className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                        value={shapeParams.radialSegments}
                        onChange={(e) =>
                          setShapeParams({
                            ...shapeParams,
                            radialSegments: parseInt(e.target.value) || 6,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                        Tubular Segments
                        <InfoTooltip
                          title="Tubular Segments"
                          description="The number of segments along the main ring of the torus. More segments make a smoother circle."
                          animationType="detail"
                        />
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="64"
                        className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                        value={shapeParams.tubularSegments}
                        onChange={(e) =>
                          setShapeParams({
                            ...shapeParams,
                            tubularSegments: parseInt(e.target.value) || 12,
                          })
                        }
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                    Radius / Size
                    <InfoTooltip
                      title="Radius"
                      description="The overall size or width of the shape from its center to its outer vertices."
                      animationType="radius"
                    />
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="5"
                    step="0.1"
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                    value={shapeParams.radius}
                    onChange={(e) =>
                      setShapeParams({
                        ...shapeParams,
                        radius: parseFloat(e.target.value) || 1.5,
                      })
                    }
                  />
                </div>
                {["Prism", "Antiprism", "Pyramid", "Bipyramid"].includes(
                  shapeParams.family,
                ) && (
                  <div>
                    <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                      Height
                      <InfoTooltip
                        title="Height"
                        description="The vertical distance between the base and the top of the shape."
                        animationType="height"
                      />
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="5"
                      step="0.1"
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                      value={shapeParams.height}
                      onChange={(e) =>
                        setShapeParams({
                          ...shapeParams,
                          height: parseFloat(e.target.value) || 2,
                        })
                      }
                    />
                  </div>
                )}

                <div className="col-span-2 pt-5 border-t border-neutral-100 mt-2">
                  <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <Settings size={16} className="text-indigo-500" />
                    Advanced Controls
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="flex justify-between items-center text-sm font-bold text-neutral-700 mb-2">
                        <span className="flex items-center">
                          Curvature (Spherize)
                          <InfoTooltip
                            title="Curvature"
                            description="Pushes the vertices of the shape outward to form a sphere. At 100%, the shape becomes perfectly spherical."
                            animationType="curvature"
                          />
                        </span>
                        <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-600">
                          {Math.round(shapeParams.curvature * 100)}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-indigo-500 shadow-inner"
                        value={shapeParams.curvature}
                        onChange={(e) =>
                          setShapeParams({
                            ...shapeParams,
                            curvature: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-bold text-neutral-700 mb-2">
                        Symmetry
                        <InfoTooltip
                          title="Symmetry"
                          description="Mirrors the geometry across a specific axis, creating perfectly symmetrical shapes."
                          animationType="symmetry"
                        />
                      </label>
                      <select
                        className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3 outline-none transition-all shadow-sm"
                        value={shapeParams.symmetry}
                        onChange={(e) =>
                          setShapeParams({
                            ...shapeParams,
                            symmetry: e.target.value as any,
                          })
                        }
                      >
                        <option value="None">None</option>
                        <option value="Mirror X">Mirror X</option>
                        <option value="Mirror Y">Mirror Y</option>
                        <option value="Mirror Z">Mirror Z</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex justify-between items-center text-sm font-bold text-neutral-700 mb-2">
                        <span className="flex items-center">
                          Tessellation (Subdivisions)
                          <InfoTooltip
                            title="Tessellation"
                            description="Subdivides each face into smaller triangles. This increases the complexity of the shape and allows for smoother curvature."
                            animationType="tessellation"
                          />
                        </span>
                        <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-600">
                          {shapeParams.tessellation}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-indigo-500 shadow-inner"
                        value={shapeParams.tessellation}
                        onChange={(e) =>
                          setShapeParams({
                            ...shapeParams,
                            tessellation: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-neutral-100 mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:text-neutral-900 transition-all active:scale-95 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
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
