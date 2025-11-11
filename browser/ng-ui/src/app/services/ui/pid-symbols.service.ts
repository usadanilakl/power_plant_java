
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
      id: 'motor',
      name: 'Electric Motor',
      category: 'electrical',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 35,20',
      width: 40,
      height: 40,
      originalWidth: 40,
      originalHeight: 20
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