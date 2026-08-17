import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResolvedLocation, WorkAreaMapStateService } from './work-area-map-state.service';
import { WorkAreaDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';
import { RfFormField } from '../../../../models/ui/form-field.model';

/** One work area rendered in the info window, with every id already resolved to a label. */
interface AreaCard {
  wa: WorkAreaDto;
  hazards: string[];
  hotWorkMeasures: string[];
  confinedSpaceHazards: string[];
  locations: ResolvedLocation[];
  lotoStandards: string[];
  counts: WorkAreaPermitCounts | null;
  hasDetails: boolean;
}

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
          @if (cards().length > 0) {
            @for (card of cards(); track card.wa.id) {
              <div
                class="wa-card"
                [class.selected]="state.selectedWorkArea()?.id === card.wa.id"
                (click)="select(card.wa)"
              >
                <div class="info-row card-title-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">{{ card.wa.name }}</span>
                  <!-- Per-area Edit, so a shape carrying several areas has no ambiguity about which
                       one the button opens. Edit mode only — Select/Overview are read-only views. -->
                  @if (state.mode() === 'dev') {
                    <button
                      class="card-edit-button"
                      title="Edit this work area"
                      (click)="edit(card.wa, $event)"
                    >Edit</button>
                  }
                </div>
                @if (card.wa.areaType?.name) {
                  <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">{{ card.wa.areaType?.name }}</span>
                  </div>
                }
                @if (card.wa.description) {
                  <div class="info-row full-width">
                    <span class="info-label">Description:</span>
                    <span class="info-value">{{ card.wa.description }}</span>
                  </div>
                }
                <!-- Hazards stay in the summary: they're the safety-critical bit someone opening
                     this window needs at a glance. Everything else sits behind Details. -->
                @if (card.hazards.length > 0) {
                  <div class="info-row full-width">
                    <span class="info-label">Hazards:</span>
                    <div class="chip-row">
                      @for (h of card.hazards; track h) {
                        <span class="chip chip-hazard">{{ h }}</span>
                      }
                    </div>
                  </div>
                }

                @if (card.hasDetails) {
                  <button
                    class="details-toggle"
                    [attr.aria-expanded]="isExpanded(card.wa.id)"
                    (click)="toggleDetails(card.wa.id, $event)"
                  >
                    {{ isExpanded(card.wa.id) ? '&#9652;' : '&#9662;' }} Details
                  </button>
                }

                @if (card.hasDetails && isExpanded(card.wa.id)) {
                  <div class="details-body">
                    @if (card.locations.length > 0) {
                      <div class="info-row full-width">
                        <span class="info-label">Locations:</span>
                        <div class="chip-row">
                          @for (loc of card.locations; track loc.id) {
                            <span class="chip chip-plain">
                              {{ loc.name }}
                              @if (loc.unitLabel) {
                                <span class="chip-unit">{{ loc.unitLabel }}</span>
                              }
                            </span>
                          }
                        </div>
                      </div>
                    }
                    @if (card.lotoStandards.length > 0) {
                      <div class="info-row full-width">
                        <span class="info-label">LOTO Standards:</span>
                        <div class="chip-row">
                          @for (std of card.lotoStandards; track std) {
                            <span class="chip chip-plain">{{ std }}</span>
                          }
                        </div>
                      </div>
                    }
                    @if (card.hotWorkMeasures.length > 0) {
                      <div class="info-row full-width">
                        <span class="info-label">Hot Work Measures:</span>
                        <div class="chip-row">
                          @for (m of card.hotWorkMeasures; track m) {
                            <span class="chip chip-plain">{{ m }}</span>
                          }
                        </div>
                      </div>
                    }
                    @if (card.confinedSpaceHazards.length > 0) {
                      <div class="info-row full-width">
                        <span class="info-label">Confined Space Hazards:</span>
                        <div class="chip-row">
                          @for (h of card.confinedSpaceHazards; track h) {
                            <span class="chip chip-hazard">{{ h }}</span>
                          }
                        </div>
                      </div>
                    }
                    @if (card.counts) {
                      <div class="info-row full-width">
                        <span class="info-label">Active Permits:</span>
                        <div class="chip-row">
                          <span class="chip chip-plain">Safe Work: {{ card.counts.safeWorkCount }}</span>
                          <span class="chip chip-plain">Hot Work: {{ card.counts.hotWorkCount }}</span>
                          <span class="chip chip-plain">Confined Space: {{ card.counts.confinedSpaceCount }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          } @else {
            <p class="no-areas">No work areas assigned to this shape.</p>
          }
        </div>

        <div class="info-footer">
          @if (state.mode() === 'dev' && state.infoWindowWorkAreas().length === 0) {
            <button class="action-button secondary" (click)="createForShape()">
              New Work Area
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
      border: 1px solid transparent;
      cursor: pointer;
    }

    .wa-card:hover { border-color: var(--border-color, #d1d5db); }

    /* Selection must never hardcode a background: text here is var(--primary-text), which is
       near-white under .dark-theme, so a fixed light tint made the card unreadable. --hover-color
       is a translucent overlay that composites correctly over either theme's card colour, and the
       accent border + inset bar carry the "selected" signal without touching contrast. */
    .wa-card.selected {
      border-color: var(--accent-color, #007bff);
      background: var(--hover-color, rgba(65, 65, 133, 0.15));
      box-shadow: inset 3px 0 0 var(--accent-color, #007bff);
    }

    .card-title-row { align-items: center; }

    .card-edit-button {
      margin-left: auto; flex-shrink: 0;
      padding: 3px 10px;
      /* Accent fill with the page background as the text colour: inverts correctly in both themes
         (white on #007bff in light, near-black on #4dabf7 in dark). */
      background: var(--accent-color, #007bff);
      color: var(--primary-background, #ffffff);
      border: none; border-radius: 4px;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }

    .card-edit-button:hover { background: var(--accent-color-hover, #0056b3); }

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

    .chip-row { display: flex; flex-wrap: wrap; gap: 4px; }

    .chip {
      font-size: 11px; padding: 2px 8px;
      border-radius: 4px; font-weight: 500;
    }

    /* Self-contained colour pair so it reads the same in both themes. */
    .chip-hazard { background: #fee2e2; color: #b91c1c; }

    .chip-plain {
      background: var(--primary-background, #fff);
      color: var(--primary-text, #333);
      border: 1px solid var(--border-color, #e0e0e0);
      display: inline-flex; align-items: center; gap: 5px;
    }

    .chip-unit {
      font-size: 10px; font-weight: 700;
      padding: 0 4px; border-radius: 3px;
      background: var(--accent-color, #007bff);
      color: var(--primary-background, #fff);
    }

    .details-toggle {
      align-self: flex-start;
      margin-top: 2px; padding: 2px 6px;
      background: none; border: none;
      color: var(--accent-color, #007bff);
      font-size: 12px; font-weight: 600; cursor: pointer;
    }

    .details-toggle:hover { text-decoration: underline; }

    .details-body {
      display: flex; flex-direction: column; gap: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--border-color, #e0e0e0);
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

  /** Work areas whose Details block is open, by id. Collapsed by default. */
  private expandedIds = signal<Set<number>>(new Set());

  /**
   * Display model for the shape's work areas, computed once per change rather than via method calls
   * in the template — each card resolves five collections, and template methods would rebuild all of
   * them on every change-detection pass.
   */
  cards = computed<AreaCard[]>(() =>
    this.state.infoWindowWorkAreas().map(wa => {
      const hazards = this.activeLabels(WorkAreaDto.getHazardFields(wa.constantHazards));
      const hotWorkMeasures = this.activeLabels(WorkAreaDto.getHotWorkMeasureFields(wa.constantHotWorkMeasures));
      const confinedSpaceHazards = this.activeLabels(
        WorkAreaDto.getConfinedSpaceHazardFields(wa.constantConfinedSpaceHazards)
      );
      const locations = this.state.resolvedLocations(wa);
      const lotoStandards = this.state.resolvedLotoStandardNames(wa);
      const counts = this.state.permitCountsFor(wa.id);

      return {
        wa,
        hazards,
        hotWorkMeasures,
        confinedSpaceHazards,
        locations,
        lotoStandards,
        counts,
        hasDetails:
          locations.length > 0 ||
          lotoStandards.length > 0 ||
          hotWorkMeasures.length > 0 ||
          confinedSpaceHazards.length > 0 ||
          counts !== null,
      };
    })
  );

  /**
   * Labels of the checkbox fields that are ticked, read straight off the form definitions.
   *
   * The form field list is the single source of truth for which keys exist and what they're called —
   * a hand-maintained label map here silently rots (the previous one was written against an obsolete
   * hazard set, so the Hazards row never rendered at all).
   */
  private activeLabels(fields: RfFormField[]): string[] {
    return fields.filter(field => field.initialValue === true).map(field => field.label);
  }

  isExpanded(workAreaId: number): boolean {
    return this.expandedIds().has(workAreaId);
  }

  toggleDetails(workAreaId: number, event: MouseEvent): void {
    event.stopPropagation();
    const next = new Set(this.expandedIds());
    if (next.has(workAreaId)) {
      next.delete(workAreaId);
    } else {
      next.add(workAreaId);
    }
    this.expandedIds.set(next);
  }

  close(): void {
    this.state.hideInfoWindow();
  }

  /** Make this the active work area (drives the counterpart button and the left panel). */
  select(wa: WorkAreaDto): void {
    this.state.selectedWorkArea.set(wa);
  }

  /**
   * Open the form for THIS card's work area. A shape can carry several areas, so
   * each card owns its own Edit button — the old single footer button always
   * opened workAreas[0], which was ambiguous the moment a shape had two areas.
   */
  edit(wa: WorkAreaDto, event: MouseEvent): void {
    event.stopPropagation();
    this.select(wa);
    this.state.openWorkAreaForm(wa);
    this.close();
  }

  /** Blank form for a shape that has no areas yet. */
  createForShape(): void {
    this.state.openWorkAreaForm();
    this.close();
  }

}
