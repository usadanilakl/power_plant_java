import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkAreaMapStateService } from './work-area-map-state.service';

@Component({
  selector: 'app-work-area-map-info-window',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (state.showInfoWindow()) {
      <div class="info-window">
        <div class="info-header">
          <h3 class="info-title">Work Area Info</h3>
          <button class="close-button" (click)="close()">&#10005;</button>
        </div>

        <div class="info-content">
          @if (state.infoWindowWorkAreas().length > 0) {
            @for (wa of state.infoWindowWorkAreas(); track wa.id) {
              <div class="wa-card">
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">{{ wa.name }}</span>
                </div>
                @if (wa.areaType?.name) {
                  <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">{{ wa.areaType?.name }}</span>
                  </div>
                }
                @if (wa.description) {
                  <div class="info-row full-width">
                    <span class="info-label">Description:</span>
                    <span class="info-value">{{ wa.description }}</span>
                  </div>
                }
                @if (hasActiveHazards(wa)) {
                  <div class="info-row full-width">
                    <span class="info-label">Hazards:</span>
                    <div class="hazard-tags">
                      @for (h of getActiveHazards(wa); track h) {
                        <span class="hazard-tag">{{ h }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            <p class="no-areas">No work areas assigned to this shape.</p>
          }
        </div>

        <div class="info-footer">
          @if (state.mode() === 'dev') {
            <button class="action-button secondary" (click)="editFirst()">
              Edit
            </button>
          }
          <button class="action-button primary" (click)="close()">Close</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .info-window {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 350px;
      max-height: calc(100% - 32px);
      background: var(--primary-background, #ffffff);
      border: 2px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--primary-color, #2196F3);
      color: white;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    }

    .info-title { margin: 0; font-size: 16px; font-weight: 600; }

    .close-button {
      background: transparent; border: none; color: white;
      font-size: 20px; cursor: pointer; padding: 4px 8px;
      border-radius: 4px; transition: background 0.2s ease; line-height: 1;
    }

    .close-button:hover { background: rgba(255, 255, 255, 0.2); }

    .info-content {
      flex: 1; padding: 16px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 12px;
    }

    .wa-card {
      display: flex; flex-direction: column; gap: 8px;
      padding: 12px; background: var(--secondary-background, #f5f5f5);
      border-radius: 6px;
    }

    .info-row { display: flex; gap: 8px; align-items: flex-start; }
    .info-row.full-width { flex-direction: column; }

    .info-label {
      font-weight: 600; color: var(--secondary-text, #666);
      font-size: 13px; min-width: 80px; flex-shrink: 0;
    }

    .info-row.full-width .info-label { min-width: auto; margin-bottom: 4px; }

    .info-value {
      color: var(--primary-text, #333); font-size: 14px; word-break: break-word;
    }

    .hazard-tags { display: flex; flex-wrap: wrap; gap: 4px; }

    .hazard-tag {
      font-size: 11px; padding: 2px 8px;
      background: #fee2e2; color: #b91c1c;
      border-radius: 4px; font-weight: 500;
    }

    .no-areas { color: #9ca3af; font-size: 13px; margin: 0; }

    .info-footer {
      padding: 12px 16px;
      background: var(--secondary-background, #f5f5f5);
      border-top: 1px solid var(--border-color, #e0e0e0);
      display: flex; justify-content: flex-end; gap: 8px;
    }

    .action-button {
      padding: 8px 16px;
      background: var(--secondary-background, #e5e5e5);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 6px; cursor: pointer;
      font-size: 14px; font-weight: 500;
      color: var(--primary-text, #333);
      transition: all 0.2s ease;
    }

    .action-button:hover {
      background: var(--hover-color, #d5d5d5);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .action-button.primary {
      background: var(--primary-color, #2196F3);
      color: white; border-color: var(--primary-color, #2196F3);
    }

    .action-button.primary:hover { background: #1976D2; border-color: #1976D2; }
    .action-button:active { transform: translateY(0); }
  `],
})
export class WorkAreaMapInfoWindowComponent {
  state = inject(WorkAreaMapStateService);

  close(): void {
    this.state.hideInfoWindow();
  }

  editFirst(): void {
    const workAreas = this.state.infoWindowWorkAreas();
    if (workAreas.length > 0) {
      this.state.openWorkAreaForm(workAreas[0]);
      this.close();
    }
  }

  hasActiveHazards(wa: any): boolean {
    return this.getActiveHazards(wa).length > 0;
  }

  getActiveHazards(wa: any): string[] {
    const h = wa.constantHazards;
    if (!h) return [];
    const labels: string[] = [];
    if (h.highTemp) labels.push('High Temp');
    if (h.highPressure) labels.push('High Pressure');
    if (h.energized) labels.push('Energized');
    if (h.chemicalExposure) labels.push('Chemical Exposure');
    if (h.noiseExposure) labels.push('Noise');
    if (h.confinedSpace) labels.push('Confined Space');
    if (h.elevatedWork) labels.push('Elevated Work');
    if (h.excavation) labels.push('Excavation');
    if (h.radiation) labels.push('Radiation');
    if (h.asbestos) labels.push('Asbestos');
    if (h.movingMachinery) labels.push('Moving Machinery');
    if (h.fallHazard) labels.push('Fall Hazard');
    if (h.fireHazard) labels.push('Fire Hazard');
    if (h.explosiveAtmosphere) labels.push('Explosive Atm');
    if (h.oxygenDeficiency) labels.push('O2 Deficiency');
    if (h.biologicalHazard) labels.push('Biological');
    if (h.electricalHazard) labels.push('Electrical');
    if (h.thermalBurn) labels.push('Thermal Burn');
    if (h.steamExposure) labels.push('Steam');
    if (h.waterHazard) labels.push('Water Hazard');
    return labels;
  }
}
