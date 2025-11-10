
import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PIDSymbol, PIDSymbolsService } from '../../../services/ui/pid-symbols.service';

@Component({
  selector: 'app-symbol-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="symbol-palette">
      <h3>P&ID Symbols</h3>
      
      <div class="symbol-category">
        <h4>Valves</h4>
        <div class="symbol-grid">
          @for (symbol of getSymbolsByCategory('valve'); track symbol.id) {
            <div class="symbol-item" (click)="onSymbolSelect(symbol)">
              <svg [attr.width]="symbol.width" [attr.height]="symbol.height">
                <path [attr.d]="symbol.svgPath" stroke="black" fill="none"/>
              </svg>
              <span>{{ symbol.name }}</span>
            </div>
          }
        </div>
      </div>
      
      <div class="symbol-category">
        <h4>Pumps</h4>
        <div class="symbol-grid">
          @for (symbol of getSymbolsByCategory('pump'); track symbol.id) {
            <div class="symbol-item" (click)="onSymbolSelect(symbol)">
              <svg [attr.width]="symbol.width" [attr.height]="symbol.height">
                <path [attr.d]="symbol.svgPath" stroke="black" fill="none"/>
              </svg>
              <span>{{ symbol.name }}</span>
            </div>
          }
        </div>
      </div>
      
      <div class="symbol-category">
        <h4>Instruments</h4>
        <div class="symbol-grid">
          @for (symbol of getSymbolsByCategory('instrument'); track symbol.id) {
            <div class="symbol-item" (click)="onSymbolSelect(symbol)">
              <svg [attr.width]="symbol.width" [attr.height]="symbol.height">
                <path [attr.d]="symbol.svgPath" stroke="black" fill="none"/>
              </svg>
              <span>{{ symbol.name }}</span>
            </div>
          }
        </div>
      </div>
      
      <div class="symbol-category">
        <h4>Electrical</h4>
        <div class="symbol-grid">
          @for (symbol of getSymbolsByCategory('electrical'); track symbol.id) {
            <div class="symbol-item" (click)="onSymbolSelect(symbol)">
              <svg [attr.width]="symbol.width" [attr.height]="symbol.height">
                <path [attr.d]="symbol.svgPath" stroke="black" fill="none"/>
              </svg>
              <span>{{ symbol.name }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .symbol-palette {
      padding: 10px;
      background: var(--background-color);
      border: 1px solid var(--border-color);
      max-height: 600px;
      overflow-y: auto;
    }
    
    .symbol-category {
      margin-bottom: 20px;
    }
    
    .symbol-category h4 {
      margin: 10px 0;
      color: var(--primary-text);
      font-size: 1em;
      font-weight: 600;
    }
    
    .symbol-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 10px;
    }
    
    .symbol-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .symbol-item:hover {
      background: var(--hover-background);
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .symbol-item svg {
      margin-bottom: 5px;
    }
    
    .symbol-item span {
      font-size: 0.75em;
      text-align: center;
      color: var(--secondary-text);
    }
  `]
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