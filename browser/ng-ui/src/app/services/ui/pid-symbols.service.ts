
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
      id: 'gate-valve',
      name: 'Gate Valve',
      category: 'valve',
      svgPath: 'M 0,0 L 20,10 L 0,20 Z M 20,10 L 40,10',
      width: 40,
      height: 20,
      originalWidth: 40,
      originalHeight: 20
    },
    {
      id: 'centrifugal-pump',
      name: 'Centrifugal Pump',
      category: 'pump',
      svgPath: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0',
      width: 40,
      height: 40,
      originalWidth: 400,
      originalHeight: 400
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