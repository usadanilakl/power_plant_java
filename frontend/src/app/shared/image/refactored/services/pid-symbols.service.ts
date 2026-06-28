
import { Injectable } from '@angular/core';

export interface PIDSymbol {
  id: string;
  name: string;
  category: 'valve' | 'pump' | 'instrument' | 'vessel' | 'electrical' | 'rotating-equipment' | 'connector';
  svgPath: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  /**
   * When true, drag-to-draw is free-form (width and height follow the cursor
   * independently) and the symbol's SVG is stretched to fit. Default behavior
   * (omitted/false) locks the draw to the symbol's native aspect ratio, which
   * is correct for valves/pumps/instruments where shape conveys meaning. The
   * off-page connector overrides this because the user typically sizes it to
   * fit a label area on the diagram, not to convey symbolic geometry.
   */
  allowFreeAspect?: boolean;
}

/**
 * Sentinel symbol id — when the user draws a shape with this symbol selected,
 * the draw handler creates a {@code FileConnector} (off-page reference)
 * instead of an Equipment. Single source of truth so the drawing flow and the
 * mapper agree on the same string.
 */
export const OFF_PAGE_CONNECTOR_SYMBOL_ID = 'off-page-connector';

@Injectable({
  providedIn: 'root'
})
export class PIDSymbolsService {
  
  private symbols: PIDSymbol[] = [
    {
      // Off-page reference / continuation arrow. Picking this symbol from the
      // palette and drawing a shape creates a FileConnector instead of an
      // Equipment row. SVG is a simple pentagon-style arrow pointing right —
      // the standard P&ID off-page reference glyph.
      id: OFF_PAGE_CONNECTOR_SYMBOL_ID,
      name: 'Off-page Connector',
      category: 'connector',
      svgPath: 'M 0,0 L 24,0 L 36,12 L 24,24 L 0,24 Z',
      width: 36,
      height: 24,
      originalWidth: 36,
      originalHeight: 24,
      // Connectors mark off-page references — the user sizes the box to fit
      // a label area on the P&ID, so the SVG stretches rather than locking
      // to the source pentagon's proportions.
      allowFreeAspect: true
    },
    {
      id: 'manual-valve',
      name: 'Manual Valve',
      category: 'valve',
      svgPath: 'M 0,0 L 20,10 L 0,20 Z M 40,0 L 20,10 L 40,20 Z',
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'gate-valve',
      name: 'Gate Valve',
      category: 'valve',
      svgPath: 'M 0,10 L 16,0 L 16,20 Z M 40,10 L 24,0 L 24,20 Z M 16,10 L 24,10 M 20,10 L 20,-2 M 12,-2 L 28,-2',
      width: 40,
      height: 22,
      originalWidth: 40,
      originalHeight: 22
    },
    {
      id: 'globe-valve',
      name: 'Globe Valve',
      category: 'valve',
      svgPath: 'M 0,10 L 14,0 L 20,10 L 14,20 Z M 40,10 L 26,0 L 20,10 L 26,20 Z M 20,10 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
      width: 40,
      height: 22,
      originalWidth: 40,
      originalHeight: 22
    },
    {
      id: 'check-valve',
      name: 'Check Valve',
      category: 'valve',
      svgPath: 'M 0,10 L 18,0 L 18,20 Z M 18,0 L 40,10 L 18,20 Z M 8,10 L 18,10',
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'ball-valve',
      name: 'Ball Valve',
      category: 'valve',
      svgPath: 'M 0,10 L 12,2 L 20,10 L 12,18 Z M 40,10 L 28,2 L 20,10 L 28,18 Z M 20,10 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'butterfly-valve',
      name: 'Butterfly Valve',
      category: 'valve',
      svgPath: 'M 0,10 L 10,10 M 30,10 L 40,10 M 20,10 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 20,0 L 20,20 M 14,4 L 20,10 L 14,16 M 26,4 L 20,10 L 26,16',
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'relief-valve',
      name: 'Relief Valve',
      category: 'valve',
      svgPath: 'M 0,12 L 14,12 L 20,6 L 26,12 L 40,12 M 20,6 L 20,-4 M 14,-4 L 26,-4 M 12,16 L 28,16',
      width: 40,
      height: 22,
      originalWidth: 40,
      originalHeight: 22
    },
    {
      id: 'mov',
      name: 'Motor Operated Valve',
      category: 'valve',
      // svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 20,5 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 15,5 l 10,0 l -5,8 z',
      svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 20,5 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0 M 16,10 L 16,0 L 20,5 L 24,0 L 24,10',
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: 'bypass-line-2-valves',
      name: 'Bypass Line with 2 Valves',
      category: 'valve',
      svgPath: 'M 0,40 L 0,0 L 20,0 M 20,0 L 30,5 L 20,10 Z M 40,0 L 30,5 L 40,10 Z M 40,0 L 80,0 M 80,0 L 90,5 L 80,10 Z M 100,0 L 90,5 L 100,10 Z M 100,0 L 120,0 L 120,40',
      width: 120,
      height: 40,
      originalWidth: 120,
      originalHeight: 40
    },
    {
      id: 'aov',
      name: 'Air Operated Valve',
      category: 'valve',
      svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 10,0 h 20 v 15 h -20 z M 15,12 l 5,-10 l 5,10 M 17,8 h 6',
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: 'cv',
      name: 'Control Valve',
      category: 'valve',
      // svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15',
      svgPath: 'M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15 Z',
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: 'centrifugal-pump',
      name: 'Centrifugal Pump',
      category: 'pump',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 10,20 L 30,20 M 25,15 L 30,20 L 25,25',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'vertical-pump',
      name: 'Vertical Pump',
      category: 'pump',
      svgPath: 'M 20,20 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 20,0 L 20,8 M 20,32 L 20,40 M 14,20 L 26,20 M 22,16 L 26,20 L 22,24',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'positive-displacement-pump',
      name: 'Positive Displacement Pump',
      category: 'pump',
      svgPath: 'M 4,10 L 28,10 L 28,30 L 4,30 Z M 28,20 L 40,20 M 10,16 L 22,16 M 10,24 L 22,24 M 16,10 L 16,30',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'compressor',
      name: 'Compressor',
      category: 'pump',
      svgPath: 'M 4,20 L 18,8 L 18,32 Z M 18,8 L 34,8 L 40,20 L 34,32 L 18,32',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'heat-exchanger',
      name: 'Heat Exchanger',
      category: 'vessel',
      svgPath: 'M 4,10 L 36,10 L 36,30 L 4,30 Z M 10,14 L 30,26 M 10,26 L 30,14 M 0,20 L 4,20 M 36,20 L 40,20',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'horizontal-vessel',
      name: 'Horizontal Vessel',
      category: 'vessel',
      svgPath: 'M 8,10 L 32,10 M 8,30 L 32,30 M 8,10 a 8,10 0 0,0 0,20 M 32,10 a 8,10 0 0,1 0,20 M 12,30 L 12,38 M 28,30 L 28,38',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'vertical-vessel',
      name: 'Vertical Vessel',
      category: 'vessel',
      svgPath: 'M 10,8 L 30,8 M 10,32 L 30,32 M 10,8 a 10,8 0 0,0 0,24 M 30,8 a 10,8 0 0,1 0,24 M 14,32 L 14,40 M 26,32 L 26,40',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'tank',
      name: 'Storage Tank',
      category: 'vessel',
      svgPath: 'M 8,4 L 32,4 M 8,4 a 12,4 0 0,0 0,8 M 32,4 a 12,4 0 0,1 0,8 M 8,12 L 8,34 M 32,12 L 32,34 M 8,34 a 12,4 0 0,0 24,0',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'pressure-indicator',
      name: 'Pressure Indicator',
      category: 'instrument',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,5 L 20,35',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'pressure-transmitter',
      name: 'Pressure Transmitter',
      category: 'instrument',
      svgPath: 'M 20,16 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0 M 20,28 L 20,40 M 14,16 L 26,16 M 20,10 L 24,20',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'temperature-indicator',
      name: 'Temperature Indicator',
      category: 'instrument',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,10 L 20,28 M 16,28 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'flow-indicator',
      name: 'Flow Indicator',
      category: 'instrument',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 10,20 L 28,20 M 22,14 L 28,20 L 22,26',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'level-indicator',
      name: 'Level Indicator',
      category: 'instrument',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,24 L 28,24 M 16,16 L 24,16',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'motor',
      name: 'Electric Motor',
      category: 'electrical',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 35,20',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'generator',
      name: 'Generator',
      category: 'electrical',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,16 L 28,16 M 12,24 L 28,24 M 20,10 L 20,30',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'transformer',
      name: 'Transformer',
      category: 'electrical',
      svgPath: 'M 12,20 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 M 28,20 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 M 0,20 L 6,20 M 34,20 L 40,20',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'breaker',
      name: 'Breaker',
      category: 'electrical',
      svgPath: 'M 4,20 L 14,20 M 26,20 L 36,20 M 14,20 L 26,12 M 18,28 L 22,28',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'switchgear',
      name: 'Switchgear',
      category: 'electrical',
      svgPath: 'M 6,6 L 34,6 L 34,34 L 6,34 Z M 12,14 L 28,14 M 12,20 L 28,20 M 12,26 L 28,26',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },

    // --- Rotating Equipment ---

    {
      id: 'generator-body',
      name: 'Generator Body',
      category: 'rotating-equipment',
      // Large cylindrical generator body with end bells, shaft extending both sides,
      // cooling fins on top, terminal box, and internal stator winding indication
      svgPath: 'M 20,10 L 140,10 M 20,70 L 140,70 M 20,10 a 10,30 0 0,0 0,60 M 140,10 a 10,30 0 0,1 0,60 M 0,40 L 20,40 M 140,40 L 160,40 M 30,10 L 30,70 M 130,10 L 130,70 M 60,18 Q 80,26 100,18 M 60,62 Q 80,54 100,62 M 70,4 L 90,4 L 90,10 L 70,10 Z',
      width: 160,
      height: 80,
      originalWidth: 160,
      originalHeight: 80
    },
    {
      id: 'shaft-seal',
      name: 'Shaft Seal',
      category: 'rotating-equipment',
      // Cross-section of a shaft seal: shaft through center, seal housing above and below,
      // oil inlet from top, H2 side (left), air side (right), drain at bottom
      svgPath: 'M 0,25 L 50,25 M 0,35 L 50,35 M 10,15 L 10,45 L 18,45 L 18,15 Z M 32,15 L 32,45 L 40,45 L 40,15 Z M 25,0 L 25,15 M 25,45 L 25,60 M 14,20 L 14,40 M 36,20 L 36,40 M 18,25 L 32,25 M 18,35 L 32,35',
      width: 50,
      height: 60,
      originalWidth: 50,
      originalHeight: 60
    },
    {
      id: 'bearing-housing',
      name: 'Bearing Housing',
      category: 'rotating-equipment',
      // Bearing pedestal: rectangular housing with shaft through center,
      // oil inlet top, drain bottom, bearing surfaces indicated
      svgPath: 'M 5,8 L 45,8 L 45,42 L 5,42 Z M 0,25 L 5,25 M 45,25 L 50,25 M 25,0 L 25,8 M 25,42 L 25,50 M 12,18 a 13,7 0 0,1 26,0 M 12,32 a 13,7 0 0,0 26,0 M 12,18 L 12,32 M 38,18 L 38,32',
      width: 50,
      height: 50,
      originalWidth: 50,
      originalHeight: 50
    },
    {
      id: 'exciter',
      name: 'Exciter',
      category: 'rotating-equipment',
      // Smaller cylinder on the end of generator shaft
      svgPath: 'M 8,8 L 42,8 M 8,32 L 42,32 M 8,8 a 6,12 0 0,0 0,24 M 42,8 a 6,12 0 0,1 0,24 M 0,20 L 8,20 M 42,20 L 50,20 M 20,4 L 30,4 L 30,8 L 20,8 Z',
      width: 50,
      height: 40,
      originalWidth: 50,
      originalHeight: 40
    },
    {
      id: 'drain-pot',
      name: 'Drain Pot',
      category: 'rotating-equipment',
      // Small vertical vessel with float mechanism inside, inlet side, drain bottom
      svgPath: 'M 10,5 L 30,5 L 30,40 L 10,40 Z M 0,15 L 10,15 M 30,15 L 40,15 M 20,40 L 20,50 M 17,20 L 17,32 M 15,32 L 19,32 M 15,20 a 2,2 0 0,1 4,0',
      width: 40,
      height: 50,
      originalWidth: 40,
      originalHeight: 50
    },
    {
      id: 'float-trap',
      name: 'Float Trap',
      category: 'rotating-equipment',
      // Float-operated trap: body with float ball inside, inlet/outlet
      svgPath: 'M 8,5 L 32,5 L 32,35 L 8,35 Z M 0,20 L 8,20 M 32,20 L 40,20 M 20,35 L 20,45 M 20,22 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0 M 20,17 L 20,12 L 24,12',
      width: 40,
      height: 45,
      originalWidth: 40,
      originalHeight: 45
    },
    {
      id: 'vacuum-pump',
      name: 'Vacuum Pump',
      category: 'rotating-equipment',
      // Pump circle with V inside for vacuum
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 13,12 L 20,28 L 27,12',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'detraining-tank',
      name: 'Detraining Tank',
      category: 'rotating-equipment',
      svgPath: 'M 8,6 L 32,6 M 8,6 a 12,4 0 0,0 0,8 M 32,6 a 12,4 0 0,1 0,8 M 8,14 L 8,44 M 32,14 L 32,44 M 8,44 a 12,4 0 0,0 24,0 M 12,20 L 28,20 M 14,28 L 26,28 M 16,36 L 24,36 M 20,44 L 20,54 M 0,20 L 8,20 M 32,25 L 40,25',
      width: 40,
      height: 54,
      originalWidth: 40,
      originalHeight: 54
    },
    {
      id: 'vapor-extractor',
      name: 'Vapor Extractor',
      category: 'rotating-equipment',
      // Fan/blower: circle with blades inside, inlet bottom, outlet top
      svgPath: 'M 20,20 m -14,0 a 14,14 0 1,0 28,0 a 14,14 0 1,0 -28,0 M 20,8 L 14,18 L 20,20 L 26,18 Z M 20,32 L 14,22 L 20,20 L 26,22 Z M 20,0 L 20,6 M 20,34 L 20,40',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'filter',
      name: 'Filter / Strainer',
      category: 'rotating-equipment',
      // Circle with crosshatch pattern inside
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 10,10 L 30,30 M 10,16 L 24,30 M 16,10 L 30,24 M 10,24 L 24,10 M 10,30 L 30,10 M 16,30 L 30,16 M 0,20 L 5,20 M 35,20 L 40,20',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'seal-drain-tray',
      name: 'Seal Drain Tray',
      category: 'rotating-equipment',
      // Wide rectangular tray with compartments — catches oil draining from seals
      svgPath: 'M 0,0 L 80,0 L 80,20 L 0,20 Z M 20,0 L 20,20 M 40,0 L 40,20 M 60,0 L 60,20 M 10,20 L 10,28 M 70,20 L 70,28 M 40,20 L 40,28',
      width: 80,
      height: 28,
      originalWidth: 80,
      originalHeight: 28
    },
    {
      id: 'vacuum-tank-horizontal',
      name: 'Vacuum Tank',
      category: 'rotating-equipment',
      // Horizontal vessel with float mechanism inside, inlet left, oil drain bottom, gas vent top
      svgPath: 'M 8,8 L 52,8 M 8,32 L 52,32 M 8,8 a 8,12 0 0,0 0,24 M 52,8 a 8,12 0 0,1 0,24 M 30,0 L 30,8 M 20,32 L 20,40 M 40,32 L 40,40 M 25,14 L 25,26 M 23,26 L 27,26 M 23,14 a 2,2 0 0,1 4,0 M 35,14 L 35,26 M 33,26 L 37,26 M 33,14 a 2,2 0 0,1 4,0 M 0,20 L 8,20',
      width: 60,
      height: 40,
      originalWidth: 60,
      originalHeight: 40
    },
    {
      id: 'expansion-tank',
      name: 'Expansion / Accumulator Tank',
      category: 'vessel',
      // Vertical cylinder with domed top (gas charge), bladder/diaphragm wavy line, bottom fluid connection
      svgPath: 'M 10,8 a 10,6 0 0,1 20,0 M 10,8 L 10,42 M 30,8 L 30,42 M 10,42 a 10,4 0 0,0 20,0 M 10,25 Q 15,21 20,25 Q 25,29 30,25 M 20,46 L 20,54 M 16,2 L 24,2 M 20,2 L 20,8',
      width: 40,
      height: 54,
      originalWidth: 40,
      originalHeight: 54
    },
    {
      id: 'three-way-valve',
      name: '3-Way Valve',
      category: 'valve',
      // Two opposing triangles (inline flow) with a third triangle branching downward from center
      svgPath: 'M 0,0 L 20,10 L 0,20 Z M 40,0 L 20,10 L 40,20 Z M 10,10 L 20,30 L 30,10 Z M 20,30 L 20,40',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 40
    },
    {
      id: 'square-tank',
      name: 'Square Tank',
      category: 'vessel',
      // Rectangular flat-walled tank with support legs and side connections
      svgPath: 'M 6,6 L 34,6 L 34,36 L 6,36 Z M 10,36 L 10,42 M 30,36 L 30,42 M 0,20 L 6,20 M 34,20 L 40,20',
      width: 40,
      height: 42,
      originalWidth: 40,
      originalHeight: 42
    }
  ];
  
  getSymbolsByCategory(category: string): PIDSymbol[] {
    return this.symbols.filter(s => s.category === category);
  }
  
  getSymbolById(id: string): PIDSymbol | undefined {
    return this.symbols.find(s => s.id === id);
  }
  
  getAllSymbols(): PIDSymbol[] {
    return this.symbols;
  }
}
