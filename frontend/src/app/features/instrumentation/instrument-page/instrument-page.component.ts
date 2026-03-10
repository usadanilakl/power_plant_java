import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InstrumentTableComponent } from '../instrument-table/instrument-table.component';
import { InstrumentLogTableComponent } from '../instrument-log-table/instrument-log-table.component';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-instrument-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, InstrumentTableComponent, InstrumentLogTableComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="content-area">
          <div class="action-bar">
            <h2>Instruments</h2>
            <button class="action-btn" (click)="goToAddInstrument()">Add Instrument</button>
            <button class="action-btn" (click)="goToBulkUpload()">Bulk Upload</button>
            @if (selectedInstrument()) {
              <button class="action-btn" (click)="clearSelection()">Back to All Instruments</button>
              <span class="selected-tag">{{ selectedInstrument()!.tagNumber }} - {{ selectedInstrument()!.description }}</span>
            }
          </div>

          @if (!selectedInstrument()) {
            <app-instrument-table
              (rowClickEvent)="onInstrumentClick($event)"
            ></app-instrument-table>
          } @else {
            <app-instrument-log-table
              [tagNumber]="selectedInstrument()!.tagNumber"
            ></app-instrument-log-table>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .content-area {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .action-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-shrink: 0;
    }
    .action-bar h2 {
      margin: 0;
      color: var(--primary-text);
      font-size: 1.1rem;
    }
    .action-btn {
      padding: 0.3rem 0.75rem;
      background: var(--accent-color);
      color: var(--primary-text);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .action-btn:hover {
      opacity: 0.8;
    }
    .selected-tag {
      color: var(--secondary-text);
      font-size: 0.9rem;
    }
    app-instrument-table, app-instrument-log-table {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  `]
})
export class InstrumentPageComponent {
  private router = inject(Router);
  selectedInstrument = signal<InstrumentDto | null>(null);

  onInstrumentClick(instrument: InstrumentDto): void {
    this.selectedInstrument.set(instrument);
  }

  clearSelection(): void {
    this.selectedInstrument.set(null);
  }

  goToAddInstrument(): void {
    this.router.navigate(['/instrumentation/add']);
  }

  goToBulkUpload(): void {
    this.router.navigate(['/instrumentation/bulk-upload']);
  }
}
