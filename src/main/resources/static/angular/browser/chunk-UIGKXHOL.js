import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-VPLEDPJD.js";
import {
  FormsModule,
  takeUntilDestroyed
} from "./chunk-BLD5MXQL.js";
import {
  ChangeDetectorRef,
  CommonModule,
  DestroyRef,
  ElementRef,
  NgForOf,
  NgIf,
  PLATFORM_ID,
  computed,
  effect,
  fromEvent,
  inject,
  input,
  isPlatformBrowser,
  output,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-W4KMF4YJ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-N6ESDQJH.js";

// src/app/shared/image/refactored/services/pid-symbols.service.ts
var PIDSymbolsService = class _PIDSymbolsService {
  symbols = [
    {
      id: "manual-valve",
      name: "Manual Valve",
      category: "valve",
      svgPath: "M 0,0 L 20,10 L 0,20 Z M 40,0 L 20,10 L 40,20 Z",
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "gate-valve",
      name: "Gate Valve",
      category: "valve",
      svgPath: "M 0,10 L 16,0 L 16,20 Z M 40,10 L 24,0 L 24,20 Z M 16,10 L 24,10 M 20,10 L 20,-2 M 12,-2 L 28,-2",
      width: 40,
      height: 22,
      originalWidth: 40,
      originalHeight: 22
    },
    {
      id: "globe-valve",
      name: "Globe Valve",
      category: "valve",
      svgPath: "M 0,10 L 14,0 L 20,10 L 14,20 Z M 40,10 L 26,0 L 20,10 L 26,20 Z M 20,10 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0",
      width: 40,
      height: 22,
      originalWidth: 40,
      originalHeight: 22
    },
    {
      id: "check-valve",
      name: "Check Valve",
      category: "valve",
      svgPath: "M 0,10 L 18,0 L 18,20 Z M 18,0 L 40,10 L 18,20 Z M 8,10 L 18,10",
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "ball-valve",
      name: "Ball Valve",
      category: "valve",
      svgPath: "M 0,10 L 12,2 L 20,10 L 12,18 Z M 40,10 L 28,2 L 20,10 L 28,18 Z M 20,10 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0",
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "butterfly-valve",
      name: "Butterfly Valve",
      category: "valve",
      svgPath: "M 0,10 L 10,10 M 30,10 L 40,10 M 20,10 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 20,0 L 20,20 M 14,4 L 20,10 L 14,16 M 26,4 L 20,10 L 26,16",
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "relief-valve",
      name: "Relief Valve",
      category: "valve",
      svgPath: "M 0,12 L 14,12 L 20,6 L 26,12 L 40,12 M 20,6 L 20,-4 M 14,-4 L 26,-4 M 12,16 L 28,16",
      width: 40,
      height: 22,
      originalWidth: 40,
      originalHeight: 22
    },
    {
      id: "mov",
      name: "Motor Operated Valve",
      category: "valve",
      // svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 20,5 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 15,5 l 10,0 l -5,8 z',
      svgPath: "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 20,5 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 16,10 L 16,0 L 20,5 L 24,0 L 24,10",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "bypass-line-2-valves",
      name: "Bypass Line with 2 Valves",
      category: "valve",
      svgPath: "M 0,40 L 0,0 L 20,0 M 20,0 L 30,5 L 20,10 Z M 40,0 L 30,5 L 40,10 Z M 40,0 L 80,0 M 80,0 L 90,5 L 80,10 Z M 100,0 L 90,5 L 100,10 Z M 100,0 L 120,0 L 120,40",
      width: 120,
      height: 40,
      originalWidth: 120,
      originalHeight: 40
    },
    {
      id: "aov",
      name: "Air Operated Valve",
      category: "valve",
      svgPath: "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 10,0 h 20 v 15 h -20 z M 15,12 l 5,-10 l 5,10 M 17,8 h 6",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "cv",
      name: "Control Valve",
      category: "valve",
      // svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15',
      svgPath: "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15 Z",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "centrifugal-pump",
      name: "Centrifugal Pump",
      category: "pump",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 10,20 L 30,20 M 25,15 L 30,20 L 25,25",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "vertical-pump",
      name: "Vertical Pump",
      category: "pump",
      svgPath: "M 20,20 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 20,0 L 20,8 M 20,32 L 20,40 M 14,20 L 26,20 M 22,16 L 26,20 L 22,24",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "positive-displacement-pump",
      name: "Positive Displacement Pump",
      category: "pump",
      svgPath: "M 4,10 L 28,10 L 28,30 L 4,30 Z M 28,20 L 40,20 M 10,16 L 22,16 M 10,24 L 22,24 M 16,10 L 16,30",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "compressor",
      name: "Compressor",
      category: "pump",
      svgPath: "M 4,20 L 18,8 L 18,32 Z M 18,8 L 34,8 L 40,20 L 34,32 L 18,32",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "heat-exchanger",
      name: "Heat Exchanger",
      category: "vessel",
      svgPath: "M 4,10 L 36,10 L 36,30 L 4,30 Z M 10,14 L 30,26 M 10,26 L 30,14 M 0,20 L 4,20 M 36,20 L 40,20",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "horizontal-vessel",
      name: "Horizontal Vessel",
      category: "vessel",
      svgPath: "M 8,10 L 32,10 M 8,30 L 32,30 M 8,10 a 8,10 0 0,0 0,20 M 32,10 a 8,10 0 0,1 0,20 M 12,30 L 12,38 M 28,30 L 28,38",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "vertical-vessel",
      name: "Vertical Vessel",
      category: "vessel",
      svgPath: "M 10,8 L 30,8 M 10,32 L 30,32 M 10,8 a 10,8 0 0,0 0,24 M 30,8 a 10,8 0 0,1 0,24 M 14,32 L 14,40 M 26,32 L 26,40",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "tank",
      name: "Storage Tank",
      category: "vessel",
      svgPath: "M 8,4 L 32,4 M 8,4 a 12,4 0 0,0 0,8 M 32,4 a 12,4 0 0,1 0,8 M 8,12 L 8,34 M 32,12 L 32,34 M 8,34 a 12,4 0 0,0 24,0",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "pressure-indicator",
      name: "Pressure Indicator",
      category: "instrument",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,5 L 20,35",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "pressure-transmitter",
      name: "Pressure Transmitter",
      category: "instrument",
      svgPath: "M 20,16 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 20,28 L 20,40 M 14,16 L 26,16 M 20,10 L 24,20",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "temperature-indicator",
      name: "Temperature Indicator",
      category: "instrument",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,10 L 20,28 M 16,28 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "flow-indicator",
      name: "Flow Indicator",
      category: "instrument",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 10,20 L 28,20 M 22,14 L 28,20 L 22,26",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "level-indicator",
      name: "Level Indicator",
      category: "instrument",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,24 L 28,24 M 16,16 L 24,16",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "motor",
      name: "Electric Motor",
      category: "electrical",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 35,20",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: "generator",
      name: "Generator",
      category: "electrical",
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,16 L 28,16 M 12,24 L 28,24 M 20,10 L 20,30",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "transformer",
      name: "Transformer",
      category: "electrical",
      svgPath: "M 12,20 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 M 28,20 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 M 0,20 L 6,20 M 34,20 L 40,20",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "breaker",
      name: "Breaker",
      category: "electrical",
      svgPath: "M 4,20 L 14,20 M 26,20 L 36,20 M 14,20 L 26,12 M 18,28 L 22,28",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "switchgear",
      name: "Switchgear",
      category: "electrical",
      svgPath: "M 6,6 L 34,6 L 34,34 L 6,34 Z M 12,14 L 28,14 M 12,20 L 28,20 M 12,26 L 28,26",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    // --- Rotating Equipment ---
    {
      id: "generator-body",
      name: "Generator Body",
      category: "rotating-equipment",
      // Large cylindrical generator body with end bells, shaft extending both sides,
      // cooling fins on top, terminal box, and internal stator winding indication
      svgPath: "M 20,10 L 140,10 M 20,70 L 140,70 M 20,10 a 10,30 0 0,0 0,60 M 140,10 a 10,30 0 0,1 0,60 M 0,40 L 20,40 M 140,40 L 160,40 M 30,10 L 30,70 M 130,10 L 130,70 M 60,18 Q 80,26 100,18 M 60,62 Q 80,54 100,62 M 70,4 L 90,4 L 90,10 L 70,10 Z",
      width: 160,
      height: 80,
      originalWidth: 160,
      originalHeight: 80
    },
    {
      id: "shaft-seal",
      name: "Shaft Seal",
      category: "rotating-equipment",
      // Cross-section of a shaft seal: shaft through center, seal housing above and below,
      // oil inlet from top, H2 side (left), air side (right), drain at bottom
      svgPath: "M 0,25 L 50,25 M 0,35 L 50,35 M 10,15 L 10,45 L 18,45 L 18,15 Z M 32,15 L 32,45 L 40,45 L 40,15 Z M 25,0 L 25,15 M 25,45 L 25,60 M 14,20 L 14,40 M 36,20 L 36,40 M 18,25 L 32,25 M 18,35 L 32,35",
      width: 50,
      height: 60,
      originalWidth: 50,
      originalHeight: 60
    },
    {
      id: "bearing-housing",
      name: "Bearing Housing",
      category: "rotating-equipment",
      // Bearing pedestal: rectangular housing with shaft through center,
      // oil inlet top, drain bottom, bearing surfaces indicated
      svgPath: "M 5,8 L 45,8 L 45,42 L 5,42 Z M 0,25 L 5,25 M 45,25 L 50,25 M 25,0 L 25,8 M 25,42 L 25,50 M 12,18 a 13,7 0 0,1 26,0 M 12,32 a 13,7 0 0,0 26,0 M 12,18 L 12,32 M 38,18 L 38,32",
      width: 50,
      height: 50,
      originalWidth: 50,
      originalHeight: 50
    },
    {
      id: "exciter",
      name: "Exciter",
      category: "rotating-equipment",
      // Smaller cylinder on the end of generator shaft
      svgPath: "M 8,8 L 42,8 M 8,32 L 42,32 M 8,8 a 6,12 0 0,0 0,24 M 42,8 a 6,12 0 0,1 0,24 M 0,20 L 8,20 M 42,20 L 50,20 M 20,4 L 30,4 L 30,8 L 20,8 Z",
      width: 50,
      height: 40,
      originalWidth: 50,
      originalHeight: 40
    },
    {
      id: "drain-pot",
      name: "Drain Pot",
      category: "rotating-equipment",
      // Small vertical vessel with float mechanism inside, inlet side, drain bottom
      svgPath: "M 10,5 L 30,5 L 30,40 L 10,40 Z M 0,15 L 10,15 M 30,15 L 40,15 M 20,40 L 20,50 M 17,20 L 17,32 M 15,32 L 19,32 M 15,20 a 2,2 0 0,1 4,0",
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: "float-trap",
      name: "Float Trap",
      category: "rotating-equipment",
      // Float-operated trap: body with float ball inside, inlet/outlet
      svgPath: "M 8,5 L 32,5 L 32,35 L 8,35 Z M 0,20 L 8,20 M 32,20 L 40,20 M 20,35 L 20,45 M 20,22 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0 M 20,17 L 20,12 L 24,12",
      width: 40,
      height: 45,
      originalWidth: 40,
      originalHeight: 45
    },
    {
      id: "vacuum-pump",
      name: "Vacuum Pump",
      category: "rotating-equipment",
      // Pump circle with V inside for vacuum
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 13,12 L 20,28 L 27,12",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "detraining-tank",
      name: "Detraining Tank",
      category: "rotating-equipment",
      svgPath: "M 8,6 L 32,6 M 8,6 a 12,4 0 0,0 0,8 M 32,6 a 12,4 0 0,1 0,8 M 8,14 L 8,44 M 32,14 L 32,44 M 8,44 a 12,4 0 0,0 24,0 M 12,20 L 28,20 M 14,28 L 26,28 M 16,36 L 24,36 M 20,44 L 20,54 M 0,20 L 8,20 M 32,25 L 40,25",
      width: 40,
      height: 54,
      originalWidth: 40,
      originalHeight: 54
    },
    {
      id: "vapor-extractor",
      name: "Vapor Extractor",
      category: "rotating-equipment",
      // Fan/blower: circle with blades inside, inlet bottom, outlet top
      svgPath: "M 20,20 m -14,0 a 14,14 0 1,0 28,0 a 14,14 0 1,0 -28,0 M 20,8 L 14,18 L 20,20 L 26,18 Z M 20,32 L 14,22 L 20,20 L 26,22 Z M 20,0 L 20,6 M 20,34 L 20,40",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "filter",
      name: "Filter / Strainer",
      category: "rotating-equipment",
      // Circle with crosshatch pattern inside
      svgPath: "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 10,10 L 30,30 M 10,16 L 24,30 M 16,10 L 30,24 M 10,24 L 24,10 M 10,30 L 30,10 M 16,30 L 30,16 M 0,20 L 5,20 M 35,20 L 40,20",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "seal-drain-tray",
      name: "Seal Drain Tray",
      category: "rotating-equipment",
      // Wide rectangular tray with compartments — catches oil draining from seals
      svgPath: "M 0,0 L 80,0 L 80,20 L 0,20 Z M 20,0 L 20,20 M 40,0 L 40,20 M 60,0 L 60,20 M 10,20 L 10,28 M 70,20 L 70,28 M 40,20 L 40,28",
      width: 80,
      height: 28,
      originalWidth: 80,
      originalHeight: 28
    },
    {
      id: "vacuum-tank-horizontal",
      name: "Vacuum Tank",
      category: "rotating-equipment",
      // Horizontal vessel with float mechanism inside, inlet left, oil drain bottom, gas vent top
      svgPath: "M 8,8 L 52,8 M 8,32 L 52,32 M 8,8 a 8,12 0 0,0 0,24 M 52,8 a 8,12 0 0,1 0,24 M 30,0 L 30,8 M 20,32 L 20,40 M 40,32 L 40,40 M 25,14 L 25,26 M 23,26 L 27,26 M 23,14 a 2,2 0 0,1 4,0 M 35,14 L 35,26 M 33,26 L 37,26 M 33,14 a 2,2 0 0,1 4,0 M 0,20 L 8,20",
      width: 60,
      height: 40,
      originalWidth: 60,
      originalHeight: 40
    },
    {
      id: "expansion-tank",
      name: "Expansion / Accumulator Tank",
      category: "vessel",
      // Vertical cylinder with domed top (gas charge), bladder/diaphragm wavy line, bottom fluid connection
      svgPath: "M 10,8 a 10,6 0 0,1 20,0 M 10,8 L 10,42 M 30,8 L 30,42 M 10,42 a 10,4 0 0,0 20,0 M 10,25 Q 15,21 20,25 Q 25,29 30,25 M 20,46 L 20,54 M 16,2 L 24,2 M 20,2 L 20,8",
      width: 40,
      height: 54,
      originalWidth: 40,
      originalHeight: 54
    },
    {
      id: "three-way-valve",
      name: "3-Way Valve",
      category: "valve",
      // Two opposing triangles (inline flow) with a third triangle branching downward from center
      svgPath: "M 0,0 L 20,10 L 0,20 Z M 40,0 L 20,10 L 40,20 Z M 10,10 L 20,30 L 30,10 Z M 20,30 L 20,40",
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: "square-tank",
      name: "Square Tank",
      category: "vessel",
      // Rectangular flat-walled tank with support legs and side connections
      svgPath: "M 6,6 L 34,6 L 34,36 L 6,36 Z M 10,36 L 10,42 M 30,36 L 30,42 M 0,20 L 6,20 M 34,20 L 40,20",
      width: 40,
      height: 42,
      originalWidth: 40,
      originalHeight: 42
    }
  ];
  getSymbolsByCategory(category) {
    return this.symbols.filter((s) => s.category === category);
  }
  getSymbolById(id) {
    return this.symbols.find((s) => s.id === id);
  }
  getAllSymbols() {
    return this.symbols;
  }
  static \u0275fac = function PIDSymbolsService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PIDSymbolsService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _PIDSymbolsService, factory: _PIDSymbolsService.\u0275fac, providedIn: "root" });
};

// src/app/shared/image/refactored/services/zoom-pan.service.ts
var ZoomPanService = class _ZoomPanService {
  MIN_SCALE = 0.1;
  MAX_SCALE = 10;
  ZOOM_FACTOR_IN = 1.2;
  ZOOM_FACTOR_OUT = 0.8;
  calculateZoom(event, currentState, containerRect, imageRect) {
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;
    const delta = event.deltaY > 0 ? this.ZOOM_FACTOR_OUT : this.ZOOM_FACTOR_IN;
    const newScale = Math.min(Math.max(this.MIN_SCALE, currentState.scale * delta), this.MAX_SCALE);
    const newPosition = this.calculatePosition(mouseX, mouseY, currentState, newScale, imageRect);
    return {
      scale: newScale,
      pointX: newPosition.left,
      pointY: newPosition.top
    };
  }
  calculatePosition(mouseX, mouseY, currentState, newScale, imageRect) {
    const relativeX = (mouseX - currentState.pointX) / imageRect.width;
    const relativeY = (mouseY - currentState.pointY) / imageRect.height;
    const newWidth = imageRect.width * newScale / currentState.scale;
    const newHeight = imageRect.height * newScale / currentState.scale;
    const newLeft = mouseX - relativeX * newWidth;
    const newTop = mouseY - relativeY * newHeight;
    return { left: newLeft, top: newTop };
  }
  calculatePan(startPos, currentPos, initialTransform) {
    return {
      pointX: initialTransform.pointX + (currentPos.x - startPos.x),
      pointY: initialTransform.pointY + (currentPos.y - startPos.y)
    };
  }
  applyTransform(element, state, transition = "0s") {
    element.style.setProperty("--transition-duration", transition);
    element.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`;
  }
  static \u0275fac = function ZoomPanService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ZoomPanService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ZoomPanService, factory: _ZoomPanService.\u0275fac, providedIn: "root" });
};

// src/app/shared/menu/context-menu/context-menu.component.ts
var _c0 = ["menuContainer"];
function ContextMenuComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275listener("contextmenu", function ContextMenuComponent_div_0_Template_div_contextmenu_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(false);
    });
    \u0275\u0275elementEnd();
  }
}
function ContextMenuComponent_div_1_ng_container_3_button_1_span_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const action_r4 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", action_r4.icon, " ");
  }
}
function ContextMenuComponent_div_1_ng_container_3_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 9);
    \u0275\u0275listener("click", function ContextMenuComponent_div_1_ng_container_3_button_1_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const action_r4 = \u0275\u0275nextContext().$implicit;
      const ctx_r4 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r4.onActionClick(action_r4));
    })("contextmenu", function ContextMenuComponent_div_1_ng_container_3_button_1_Template_button_contextmenu_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(false);
    });
    \u0275\u0275template(1, ContextMenuComponent_div_1_ng_container_3_button_1_span_1_Template, 2, 1, "span", 10);
    \u0275\u0275elementStart(2, "span", 11);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const action_r4 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classProp("disabled", action_r4.disabled);
    \u0275\u0275property("disabled", action_r4.disabled);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", action_r4.icon);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(action_r4.label);
  }
}
function ContextMenuComponent_div_1_ng_container_3_div_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 13);
  }
}
function ContextMenuComponent_div_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, ContextMenuComponent_div_1_ng_container_3_button_1_Template, 4, 5, "button", 7)(2, ContextMenuComponent_div_1_ng_container_3_div_2_Template, 1, 0, "div", 8);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const action_r4 = ctx.$implicit;
    const last_r6 = ctx.last;
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !action_r4.divider);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", action_r4.divider && !last_r6);
  }
}
function ContextMenuComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4, 0);
    \u0275\u0275listener("contextmenu", function ContextMenuComponent_div_1_Template_div_contextmenu_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      $event.preventDefault();
      $event.stopPropagation();
      return \u0275\u0275resetView(false);
    });
    \u0275\u0275elementStart(2, "div", 5);
    \u0275\u0275template(3, ContextMenuComponent_div_1_ng_container_3_Template, 3, 2, "ng-container", 6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r4 = \u0275\u0275nextContext();
    \u0275\u0275styleProp("left", ctx_r4.position().x, "px")("top", ctx_r4.position().y, "px");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r4.actions());
  }
}
var ContextMenuComponent = class _ContextMenuComponent {
  menuContainer;
  destroyRef = inject(DestroyRef);
  platformId = inject(PLATFORM_ID);
  selectedItem = input(null);
  isVisible = input(false);
  position = input({ x: 0, y: 0 });
  actions = input([]);
  actionSelected = output();
  closeMenu = output();
  positionAdjusted = output();
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(document, "mousedown").pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        if (!this.isVisible())
          return;
        if (this.menuContainer && !this.menuContainer.nativeElement.contains(event.target)) {
          this.closeMenu.emit();
        }
      });
    }
    effect(() => {
      if (this.isVisible()) {
        setTimeout(() => this.adjustPositionIfNeeded(), 0);
      }
    });
  }
  ngAfterViewInit() {
    this.adjustPositionIfNeeded();
  }
  adjustPositionIfNeeded() {
    if (!this.menuContainer)
      return;
    const menu = this.menuContainer.nativeElement;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10;
    let adjustedX = this.position().x;
    let adjustedY = this.position().y;
    if (rect.right + padding > viewportWidth) {
      adjustedX = viewportWidth - rect.width - padding;
    }
    if (rect.bottom + padding > viewportHeight) {
      adjustedY = viewportHeight - rect.height - padding;
    }
    adjustedX = Math.max(padding, adjustedX);
    adjustedY = Math.max(padding, adjustedY);
    if (adjustedX !== this.position().x || adjustedY !== this.position().y) {
      this.positionAdjusted.emit({ x: adjustedX, y: adjustedY });
      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }
  onActionClick(action) {
    const item = this.selectedItem();
    if (item && !action.disabled) {
      action.action(item);
      this.actionSelected.emit({ action, item });
      this.closeMenu.emit();
    }
  }
  static \u0275fac = function ContextMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ContextMenuComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ContextMenuComponent, selectors: [["app-context-menu"]], viewQuery: function ContextMenuComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c0, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.menuContainer = _t.first);
    }
  }, inputs: { selectedItem: [1, "selectedItem"], isVisible: [1, "isVisible"], position: [1, "position"], actions: [1, "actions"] }, outputs: { actionSelected: "actionSelected", closeMenu: "closeMenu", positionAdjusted: "positionAdjusted" }, decls: 2, vars: 2, consts: [["menuContainer", ""], ["class", "context-menu-backdrop", 3, "contextmenu", 4, "ngIf"], ["class", "context-menu", 3, "left", "top", "contextmenu", 4, "ngIf"], [1, "context-menu-backdrop", 3, "contextmenu"], [1, "context-menu", 3, "contextmenu"], [1, "context-menu-content"], [4, "ngFor", "ngForOf"], ["class", "context-menu-item", "type", "button", 3, "disabled", "click", "contextmenu", 4, "ngIf"], ["class", "context-menu-divider", 4, "ngIf"], ["type", "button", 1, "context-menu-item", 3, "click", "contextmenu", "disabled"], ["class", "context-menu-icon", 4, "ngIf"], [1, "context-menu-label"], [1, "context-menu-icon"], [1, "context-menu-divider"]], template: function ContextMenuComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, ContextMenuComponent_div_0_Template, 1, 0, "div", 1)(1, ContextMenuComponent_div_1_Template, 4, 5, "div", 2);
    }
    if (rf & 2) {
      \u0275\u0275property("ngIf", ctx.isVisible());
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.isVisible());
    }
  }, dependencies: [CommonModule, NgForOf, NgIf], styles: ["\n\n.context-menu-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 10001;\n  pointer-events: none;\n}\n.context-menu[_ngcontent-%COMP%] {\n  position: fixed;\n  background: var(--primary-background);\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n  z-index: 10002;\n  min-width: 200px;\n  overflow: hidden;\n}\n.context-menu-content[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.context-menu-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 8px 16px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 14px;\n  color: var(--primary-text);\n  text-align: left;\n  transition: background-color 0.2s ease;\n  white-space: nowrap;\n}\n.context-menu-item[_ngcontent-%COMP%]:hover:not(.disabled) {\n  background-color: var(--hover-color);\n}\n.context-menu-item.disabled[_ngcontent-%COMP%] {\n  color: var(--secondary-text);\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n.context-menu-icon[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 20px;\n  height: 20px;\n  font-size: 16px;\n}\n.context-menu-label[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.context-menu-divider[_ngcontent-%COMP%] {\n  height: 1px;\n  background-color: var(--border-color);\n  margin: 4px 0;\n}\n/*# sourceMappingURL=context-menu.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ContextMenuComponent, { className: "ContextMenuComponent", filePath: "src/app/shared/menu/context-menu/context-menu.component.ts", lineNumber: 23 });
})();

// src/app/models/ui/nested-item.model.ts
var NestedItemImpl = class _NestedItemImpl {
  id;
  name;
  subtitle;
  values;
  isExpanded;
  objectType;
  color;
  isClicked;
  isLastClicked;
  constructor(data = {}) {
    this.id = data.id ?? "";
    this.name = data.name ?? "";
    this.subtitle = data.subtitle;
    this.values = data.values?.map((item) => new _NestedItemImpl(item)) ?? [];
    this.isExpanded = data.isExpanded ?? false;
    this.objectType = data.objectType ?? "";
    this.color = data.color ?? "";
    this.isClicked = data.isClicked ?? false;
    this.isLastClicked = data.isLastClicked ?? false;
  }
  addChild(child) {
    if (!this.values) {
      this.values = [];
    }
    this.values.push(new _NestedItemImpl(child));
  }
  removeChild(childId) {
    if (this.values) {
      this.values = this.values.filter((child) => child.id !== childId);
    }
  }
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
};

// src/app/shared/list/toggle-list-virtual-scroll/toggle-list-virtual-scroll.component.ts
function ToggleListVirtualScrollComponent_ng_container_1_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 7);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r2.isExpanded ? "v" : ">", " ");
  }
}
function ToggleListVirtualScrollComponent_ng_container_1_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r2.subtitle);
  }
}
function ToggleListVirtualScrollComponent_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "div", 2);
    \u0275\u0275listener("click", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_click_1_listener($event) {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onClick($event, item_r2));
    })("dblclick", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_dblclick_1_listener() {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDoubleClick(item_r2));
    })("contextmenu", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_contextmenu_1_listener($event) {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onRightClick($event, item_r2));
    })("mousedown", function ToggleListVirtualScrollComponent_ng_container_1_Template_div_mousedown_1_listener($event) {
      const item_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onMiddleClick($event, item_r2));
    });
    \u0275\u0275template(2, ToggleListVirtualScrollComponent_ng_container_1_span_2_Template, 2, 1, "span", 3);
    \u0275\u0275elementStart(3, "div", 4)(4, "span", 5);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, ToggleListVirtualScrollComponent_ng_container_1_span_6_Template, 2, 1, "span", 6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275styleProp("padding-left", 12 + item_r2.level * 18, "px")("background-color", ctx_r2.getItemColor(item_r2));
    \u0275\u0275classProp("highlighted", ctx_r2.highlightOnHover())("clicked", item_r2.isClicked)("last-clicked", item_r2.isLastClicked)("has-subtitle", ctx_r2.isLeafWithSubtitle(item_r2))("level-1", ctx_r2.colorLevels() && item_r2.level === 0)("level-2", ctx_r2.colorLevels() && item_r2.level === 1)("level-3", ctx_r2.colorLevels() && item_r2.level === 2);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", item_r2.values && item_r2.values.length > 0);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r2.name);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.isLeafWithSubtitle(item_r2));
  }
}
var ToggleListVirtualScrollComponent = class _ToggleListVirtualScrollComponent {
  viewport = null;
  cdr = inject(ChangeDetectorRef);
  elementRef = inject(ElementRef);
  intersectionObserver = null;
  items = input([]);
  highlightOnHover = input(false);
  trackLastClicked = input(false);
  trackAllClicked = input(false);
  colorLevels = input(false);
  itemClicked = output();
  itemDoubleClicked = output();
  itemRightClicked = output();
  itemMiddleClicked = output();
  clickTimeout = null;
  lastClickTime = 0;
  doubleClickDelay = 250;
  expandedItemIds = signal(/* @__PURE__ */ new Set());
  lastClickedItemId = signal(null);
  allClickedItemIds = signal(/* @__PURE__ */ new Set());
  flatItems = computed(() => {
    const expandedIds = this.expandedItemIds();
    const lastClickedId = this.trackLastClicked() ? this.lastClickedItemId() : null;
    const allClickedIds = this.trackAllClicked() ? this.allClickedItemIds() : /* @__PURE__ */ new Set();
    const flatten = (items, level) => {
      let result = [];
      for (const item of items) {
        const isExpanded = expandedIds.has(item.id);
        const flatItem = __spreadProps(__spreadValues({}, item), {
          level,
          isExpanded,
          isClicked: allClickedIds.has(item.id),
          isLastClicked: item.id === lastClickedId
        });
        result.push(flatItem);
        if (isExpanded && item.values) {
          result = result.concat(flatten(item.values, level + 1));
        }
      }
      return result;
    };
    return flatten(this.items(), 0);
  });
  // Track last items reference to avoid redundant updates
  lastItemsLength = 0;
  pendingTimeouts = [];
  constructor() {
    effect(() => {
      const items = this.items();
      if (items.length !== this.lastItemsLength) {
        this.lastItemsLength = items.length;
        if (items.length > 0) {
          this.scheduleViewportCheck();
        }
      }
    });
  }
  ngAfterViewInit() {
    this.setupVisibilityObserver();
    this.scheduleViewportCheck();
  }
  /**
   * Set up IntersectionObserver to detect visibility changes.
   * This handles the case where the component is rendered but hidden initially.
   */
  setupVisibilityObserver() {
    if (typeof IntersectionObserver === "undefined")
      return;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          this.scheduleViewportCheck();
        }
      });
    }, { threshold: [0, 0.1, 0.5, 1] });
    this.intersectionObserver.observe(this.elementRef.nativeElement);
  }
  /**
   * Schedule viewport checks to ensure proper rendering.
   * Clears any pending checks before scheduling new ones.
   */
  scheduleViewportCheck() {
    this.pendingTimeouts.forEach((t) => clearTimeout(t));
    this.pendingTimeouts = [];
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 0));
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 100));
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 300));
  }
  /**
   * Force the viewport to update and render items
   */
  forceViewportUpdate() {
    if (this.viewport) {
      this.viewport.checkViewportSize();
      this.cdr.markForCheck();
    }
  }
  trackByFn(index, item) {
    return item.id;
  }
  onClick(event, item) {
    event.stopPropagation();
    const currentTime = (/* @__PURE__ */ new Date()).getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;
    if (timeSinceLastClick < this.doubleClickDelay) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.onDoubleClick(item);
    } else {
      this.clickTimeout = setTimeout(() => {
        this.onItemClick(event, item);
        this.clickTimeout = null;
      }, this.doubleClickDelay);
    }
    this.lastClickTime = currentTime;
  }
  onItemClick(event, item) {
    this.toggleItem(item);
    if (this.trackLastClicked()) {
      this.lastClickedItemId.set(item.id);
    }
    if (this.trackAllClicked()) {
      this.allClickedItemIds.update((ids) => {
        ids.add(item.id);
        return new Set(ids);
      });
    }
    this.itemClicked.emit(item);
  }
  toggleItem(item) {
    const flatIndex = this.flatItems().findIndex((flatItem) => flatItem.id === item.id);
    this.expandedItemIds.update((ids) => {
      if (ids.has(item.id)) {
        ids.delete(item.id);
      } else {
        ids.add(item.id);
      }
      return new Set(ids);
    });
    if (this.viewport) {
      this.viewport.checkViewportSize();
      const targetIndex = Math.max(flatIndex - 1, 0);
      this.pendingTimeouts.push(setTimeout(() => {
        this.viewport?.checkViewportSize();
        this.viewport?.scrollToIndex(targetIndex, "smooth");
      }, 0));
    }
  }
  isItemClicked(item) {
    return this.trackAllClicked() && this.allClickedItemIds().has(item.id);
  }
  isItemLastClicked(item) {
    return this.trackLastClicked() && item.id === this.lastClickedItemId();
  }
  onDoubleClick(item) {
    this.itemDoubleClicked.emit(item);
  }
  onRightClick(event, item) {
    event.preventDefault();
    event.stopPropagation();
    this.itemRightClicked.emit({ event, item });
  }
  onMiddleClick(event, item) {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.itemMiddleClicked.emit(item);
    }
  }
  getItemColor(item) {
    return item.color || null;
  }
  isLeafWithSubtitle(item) {
    return !!item.subtitle && (!item.values || item.values.length === 0);
  }
  getItemSize() {
    const hasSubtitles = this.flatItems().some((item) => this.isLeafWithSubtitle(item));
    return hasSubtitles ? 50 : 40;
  }
  ngOnDestroy() {
    if (this.clickTimeout !== null) {
      clearTimeout(this.clickTimeout);
    }
    this.pendingTimeouts.forEach((t) => clearTimeout(t));
    this.pendingTimeouts = [];
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
  static \u0275fac = function ToggleListVirtualScrollComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ToggleListVirtualScrollComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ToggleListVirtualScrollComponent, selectors: [["app-toggle-list-virtual-scroll"]], viewQuery: function ToggleListVirtualScrollComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.viewport = _t.first);
    }
  }, inputs: { items: [1, "items"], highlightOnHover: [1, "highlightOnHover"], trackLastClicked: [1, "trackLastClicked"], trackAllClicked: [1, "trackAllClicked"], colorLevels: [1, "colorLevels"] }, outputs: { itemClicked: "itemClicked", itemDoubleClicked: "itemDoubleClicked", itemRightClicked: "itemRightClicked", itemMiddleClicked: "itemMiddleClicked" }, decls: 2, vars: 3, consts: [[1, "toggle-list", 3, "itemSize"], [4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], [1, "item-content", 3, "click", "dblclick", "contextmenu", "mousedown"], ["class", "toggle-icon", 4, "ngIf"], [1, "item-text"], [1, "item-name"], ["class", "item-subtitle", 4, "ngIf"], [1, "toggle-icon"], [1, "item-subtitle"]], template: function ToggleListVirtualScrollComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "cdk-virtual-scroll-viewport", 0);
      \u0275\u0275template(1, ToggleListVirtualScrollComponent_ng_container_1_Template, 7, 21, "ng-container", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("itemSize", ctx.getItemSize());
      \u0275\u0275advance();
      \u0275\u0275property("cdkVirtualForOf", ctx.flatItems())("cdkVirtualForTrackBy", ctx.trackByFn);
    }
  }, dependencies: [ScrollingModule, CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport, CommonModule, NgIf], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  height: 100%;\n  min-height: 300px;\n  background: var(--primary-background);\n}\n.toggle-list[_ngcontent-%COMP%] {\n  height: 100%;\n  min-height: 300px;\n}\ncdk-virtual-scroll-viewport.toggle-list[_ngcontent-%COMP%] {\n  height: 100%;\n  min-height: 300px;\n}\n.item-content[_ngcontent-%COMP%] {\n  margin: 2px 6px;\n  padding: 10px 12px;\n  cursor: pointer;\n  transition:\n    background-color 0.2s ease,\n    border-color 0.2s ease,\n    transform 0.2s ease;\n  display: flex;\n  align-items: center;\n  border: 1px solid transparent;\n  border-radius: 10px;\n}\n.item-content[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color);\n  border-color: var(--border-color);\n  transform: translateX(2px);\n}\n.clicked[_ngcontent-%COMP%] {\n  text-decoration: underline;\n  text-decoration-thickness: 2px;\n  font-weight: bold;\n}\n.last-clicked[_ngcontent-%COMP%] {\n  border-left: 3px solid var(--accent-color);\n  background: color-mix(in srgb, var(--accent-color-shadow) 65%, transparent);\n}\n.toggle-icon[_ngcontent-%COMP%] {\n  margin-right: 8px;\n  flex-shrink: 0;\n  color: var(--secondary-text);\n  font-size: 12px;\n}\n.item-text[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  min-width: 0;\n  flex: 1;\n}\n.item-name[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  color: var(--primary-text);\n}\n.item-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.75em;\n  color: var(--secondary-text);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  margin-top: 2px;\n}\n.item-content.has-subtitle[_ngcontent-%COMP%] {\n  min-height: 50px;\n  display: flex;\n  align-items: center;\n}\n.highlighted[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color);\n}\n.level-1[_ngcontent-%COMP%] {\n  margin-left: 0;\n}\n.level-2[_ngcontent-%COMP%] {\n  margin-left: 20px;\n}\n.level-3[_ngcontent-%COMP%] {\n  margin-left: 40px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: var(--secondary-background);\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: var(--border-color);\n  border-radius: 4px;\n}\n[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: var(--secondary-text);\n}\n/*# sourceMappingURL=toggle-list-virtual-scroll.component.css.map */"], changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ToggleListVirtualScrollComponent, { className: "ToggleListVirtualScrollComponent", filePath: "src/app/shared/list/toggle-list-virtual-scroll/toggle-list-virtual-scroll.component.ts", lineNumber: 34 });
})();

// src/app/shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component.ts
function RfToggleMenuComponent_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 11);
    \u0275\u0275listener("click", function RfToggleMenuComponent_Conditional_1_Conditional_3_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.clearSearch());
    });
    \u0275\u0275text(1, " x ");
    \u0275\u0275elementEnd();
  }
}
function RfToggleMenuComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 6)(2, "input", 7);
    \u0275\u0275listener("input", function RfToggleMenuComponent_Conditional_1_Template_input_input_2_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSearchChange($event.target.value));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, RfToggleMenuComponent_Conditional_1_Conditional_3_Template, 2, 0, "button", 8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "button", 9);
    \u0275\u0275listener("click", function RfToggleMenuComponent_Conditional_1_Template_button_click_4_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleSearchMode());
    });
    \u0275\u0275elementStart(5, "span", 10);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275property("placeholder", ctx_r1.searchPlaceholder())("value", ctx_r1.searchQuery());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r1.searchQuery() ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275property("title", ctx_r1.searchMode() === "AND" ? "Match all words" : "Match any word");
    \u0275\u0275attribute("data-mode", ctx_r1.searchMode());
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.searchMode());
  }
}
function RfToggleMenuComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "app-toggle-list-virtual-scroll", 12);
    \u0275\u0275listener("itemClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemClick($event));
    })("itemDoubleClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemDoubleClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemDoubleClicked($event));
    })("itemRightClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemRightClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemRightClicked($event));
    })("itemMiddleClicked", function RfToggleMenuComponent_Conditional_3_Template_app_toggle_list_virtual_scroll_itemMiddleClicked_0_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onItemMiddleClicked($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("items", ctx_r1.filteredItems())("trackLastClicked", true)("trackAllClicked", true)("highlightOnHover", false);
  }
}
function RfToggleMenuComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 13);
    \u0275\u0275text(2, "Search");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 14);
    \u0275\u0275text(4, "No items match your search");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 15);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1(" Try using ", ctx_r1.searchMode() === "AND" ? "OR" : "AND", " mode or different keywords ");
  }
}
function RfToggleMenuComponent_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "div", 16);
    \u0275\u0275text(2, "List");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 17);
    \u0275\u0275text(4, "No items to display");
    \u0275\u0275elementEnd()();
  }
}
var RfToggleMenuComponent = class _RfToggleMenuComponent {
  destroyRef = inject(DestroyRef);
  // Inputs
  menuItems = input([]);
  enableSearch = input(true);
  searchPlaceholder = input("Search...");
  // Outputs
  itemClick = output();
  itemDblClick = output();
  itemRightClick = output();
  itemMiddleClick = output();
  // Search state
  searchQuery = signal("");
  searchMode = signal("AND");
  // Computed filtered items based on search
  filteredItems = computed(() => {
    const query = this.searchQuery().trim();
    const items = this.menuItems();
    if (!query) {
      return items;
    }
    const mode = this.searchMode();
    const searchTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 0);
    return this.filterItems(items, searchTerms, mode);
  });
  // Check if any items match the search
  hasResults = computed(() => this.filteredItems().length > 0);
  /**
   * Recursively filter items based on search terms and mode
   */
  filterItems(items, searchTerms, mode) {
    return items.map((item) => this.filterSingleItem(item, searchTerms, mode)).filter((item) => item !== null);
  }
  /**
   * Filter a single item and its children
   */
  filterSingleItem(item, searchTerms, mode) {
    const itemText = (item.name + (item.subtitle ? " " + item.subtitle : "")).toLowerCase();
    const matchesSearch = this.itemMatchesSearch(itemText, searchTerms, mode);
    const filteredChildren = item.values ? this.filterItems(item.values, searchTerms, mode) : [];
    if (matchesSearch || filteredChildren.length > 0) {
      return __spreadProps(__spreadValues({}, item), {
        values: filteredChildren.length > 0 ? filteredChildren : item.values,
        isExpanded: filteredChildren.length > 0 ? true : item.isExpanded
        // Auto-expand if children match
      });
    }
    return null;
  }
  /**
   * Check if item text matches search terms based on mode
   */
  itemMatchesSearch(itemText, searchTerms, mode) {
    if (mode === "AND") {
      return searchTerms.every((term) => itemText.includes(term));
    } else {
      return searchTerms.some((term) => itemText.includes(term));
    }
  }
  /**
   * Toggle between AND/OR search mode
   */
  toggleSearchMode() {
    this.searchMode.update((mode) => mode === "AND" ? "OR" : "AND");
  }
  /**
   * Clear the search query
   */
  clearSearch() {
    this.searchQuery.set("");
  }
  /**
   * Handle search input change
   */
  onSearchChange(value) {
    this.searchQuery.set(value);
  }
  // Event handlers
  onItemClick(item) {
    this.itemClick.emit(item);
  }
  onItemDoubleClicked(item) {
    this.itemDblClick.emit(item);
  }
  onItemRightClicked(event) {
    this.itemRightClick.emit(event);
  }
  onItemMiddleClicked(item) {
    this.itemMiddleClick.emit(item);
  }
  static \u0275fac = function RfToggleMenuComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RfToggleMenuComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RfToggleMenuComponent, selectors: [["app-rf-toggle-menu"]], inputs: { menuItems: [1, "menuItems"], enableSearch: [1, "enableSearch"], searchPlaceholder: [1, "searchPlaceholder"] }, outputs: { itemClick: "itemClick", itemDblClick: "itemDblClick", itemRightClick: "itemRightClick", itemMiddleClick: "itemMiddleClick" }, decls: 6, vars: 2, consts: [[1, "rf-toggle-menu"], [1, "search-section"], [1, "menu-list-container"], [3, "items", "trackLastClicked", "trackAllClicked", "highlightOnHover"], [1, "no-results"], [1, "empty-state"], [1, "search-input-wrapper"], ["type", "text", 1, "search-input", 3, "input", "placeholder", "value"], ["title", "Clear search", 1, "clear-search-btn"], [1, "search-mode-toggle", 3, "click", "title"], [1, "mode-label"], ["title", "Clear search", 1, "clear-search-btn", 3, "click"], [3, "itemClicked", "itemDoubleClicked", "itemRightClicked", "itemMiddleClicked", "items", "trackLastClicked", "trackAllClicked", "highlightOnHover"], [1, "no-results-icon"], [1, "no-results-text"], [1, "no-results-hint"], [1, "empty-state-icon"], [1, "empty-state-text"]], template: function RfToggleMenuComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, RfToggleMenuComponent_Conditional_1_Template, 7, 6, "div", 1);
      \u0275\u0275elementStart(2, "div", 2);
      \u0275\u0275template(3, RfToggleMenuComponent_Conditional_3_Template, 1, 4, "app-toggle-list-virtual-scroll", 3)(4, RfToggleMenuComponent_Conditional_4_Template, 7, 1, "div", 4)(5, RfToggleMenuComponent_Conditional_5_Template, 5, 0, "div", 5);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.enableSearch() ? 1 : -1);
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.hasResults() ? 3 : ctx.searchQuery() ? 4 : 5);
    }
  }, dependencies: [CommonModule, FormsModule, ToggleListVirtualScrollComponent], styles: ["\n\n[_nghost-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n  background-color: var(--primary-background);\n  color: var(--primary-text);\n}\n.rf-toggle-menu[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 100%;\n  gap: 8px;\n}\n.search-section[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  padding: 12px;\n  background-color: var(--secondary-background);\n  border-bottom: 1px solid var(--border-color);\n}\n.search-input-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  flex: 1;\n}\n.search-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px 32px 8px 12px;\n  font-size: 14px;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--card-background);\n  color: var(--primary-text);\n  transition: all 0.2s ease;\n}\n.search-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--accent-color);\n  box-shadow: 0 0 0 3px var(--accent-color-shadow);\n}\n.search-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--secondary-text);\n  opacity: 0.6;\n}\n.clear-search-btn[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 4px;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 24px;\n  height: 24px;\n  border: none;\n  background-color: transparent;\n  color: var(--secondary-text);\n  font-size: 20px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: all 0.2s ease;\n}\n.clear-search-btn[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color);\n  color: var(--primary-text);\n}\n.search-mode-toggle[_ngcontent-%COMP%] {\n  min-width: 60px;\n  padding: 8px 16px;\n  font-size: 13px;\n  font-weight: 600;\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  background-color: var(--card-background);\n  color: var(--primary-text);\n  cursor: pointer;\n  transition: all 0.2s ease;\n  position: relative;\n}\n.search-mode-toggle[_ngcontent-%COMP%]:hover {\n  background-color: var(--hover-color);\n  border-color: var(--accent-color);\n}\n.search-mode-toggle[data-mode=AND][_ngcontent-%COMP%] {\n  border-color: var(--accent-color);\n  background-color: var(--accent-color);\n  color: white;\n}\n.search-mode-toggle[data-mode=OR][_ngcontent-%COMP%] {\n  border-color: var(--warning-background);\n  background-color: var(--warning-background);\n  color: var(--primary-text);\n}\n.mode-label[_ngcontent-%COMP%] {\n  display: block;\n  text-align: center;\n}\n.menu-list-container[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 300px;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n}\n.menu-list-container[_ngcontent-%COMP%]   app-toggle-list-virtual-scroll[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 300px;\n}\n.no-results[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  padding: 32px;\n  text-align: center;\n  color: var(--secondary-text);\n}\n.no-results-icon[_ngcontent-%COMP%], \n.empty-state-icon[_ngcontent-%COMP%] {\n  font-size: 48px;\n  margin-bottom: 16px;\n  opacity: 0.5;\n}\n.no-results-text[_ngcontent-%COMP%], \n.empty-state-text[_ngcontent-%COMP%] {\n  font-size: 16px;\n  font-weight: 500;\n  margin-bottom: 8px;\n  color: var(--primary-text);\n}\n.no-results-hint[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: var(--secondary-text);\n  opacity: 0.8;\n}\n@media (max-width: 768px) {\n  .search-section[_ngcontent-%COMP%] {\n    padding: 8px;\n  }\n  .search-input[_ngcontent-%COMP%] {\n    font-size: 13px;\n    padding: 6px 28px 6px 10px;\n  }\n  .search-mode-toggle[_ngcontent-%COMP%] {\n    min-width: 50px;\n    padding: 6px 12px;\n    font-size: 12px;\n  }\n}\n.search-input[_ngcontent-%COMP%]:focus-visible, \n.search-mode-toggle[_ngcontent-%COMP%]:focus-visible, \n.clear-search-btn[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid var(--accent-color);\n  outline-offset: 2px;\n}\n@keyframes _ngcontent-%COMP%_fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(-10px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.no-results[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeIn 0.3s ease;\n}\n/*# sourceMappingURL=rf-toggle-menu.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RfToggleMenuComponent, { className: "RfToggleMenuComponent", filePath: "src/app/shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component.ts", lineNumber: 16 });
})();

export {
  ContextMenuComponent,
  PIDSymbolsService,
  ZoomPanService,
  NestedItemImpl,
  RfToggleMenuComponent
};
//# sourceMappingURL=chunk-UIGKXHOL.js.map
