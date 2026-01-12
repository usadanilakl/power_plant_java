import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PIDSymbol, PIDSymbolsService } from '../services/pid-symbols.service';

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

  // Track expanded category (null = all collapsed, only one can be expanded at a time)
  expandedCategory = signal<string | null>(null);

  categories = [
    { id: 'valve', label: 'Valves' },
    { id: 'pump', label: 'Pumps' },
    { id: 'instrument', label: 'Instruments' },
    { id: 'electrical', label: 'Electrical' }
  ];

  getSymbolsByCategory(category: string): PIDSymbol[] {
    return this.pidSymbolsService.getSymbolsByCategory(category);
  }

  toggleCategory(categoryId: string): void {
    if (this.expandedCategory() === categoryId) {
      this.expandedCategory.set(null);
    } else {
      this.expandedCategory.set(categoryId);
    }
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategory() === categoryId;
  }

  onSymbolSelect(symbol: PIDSymbol): void {
    this.symbolSelected.emit(symbol);
  }
}