
import { Injectable } from '@angular/core';

export interface PIDSymbol {
  id: string;
  name: string;
  category: 'valve' | 'pump' | 'instrument' | 'vessel' | 'electrical';
  svgPath: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class PIDSymbolsService {
  
  private symbols: PIDSymbol[] = [
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
