
import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PIDSymbol, PIDSymbolsService } from '../../../services/ui/pid-symbols.service';

@Component({
  selector: 'app-symbol-palette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './symbol-palette.component.html',
  styleUrl: './symbol-palette.component.css'
})
export class SymbolPaletteComponent {
  private pidSymbolsService = inject(PIDSymbolsService);
  
  symbolSelected = output<PIDSymbol>();
  
  getSymbolsByCategory(category: string): PIDSymbol[] {
    return this.pidSymbolsService.getSymbolsByCategory(category);
  }
  
  onSymbolSelect(symbol: PIDSymbol): void {
    this.symbolSelected.emit(symbol);
  }
}