import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RedTagStandardService } from '../../../services/loto/red-tag-standard.service';
import {
  RedTagStandard,
  RedTagPointMatch,
  MatchedPoint,
} from '../../../models/loto/red-tag-standard.model';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { GlobalMessageService } from '../../../shared/global-message/global-message.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { RfLotoStandardStateService } from '../refactored/services/rf-loto-standard-state.service';

/** Working selection state for one Red Tag row. */
interface RowState {
  match: RedTagPointMatch;
  /** Point id chosen for this row (MATCHED → the single point; MULTIPLE/NONE → user-driven). */
  chosenPointId: number | null;
  /** Whether this row's point is included in the generated standard. */
  included: boolean;
  /** Inline create-missing form is open. */
  creating: boolean;
  /** Draft fields for the inline create form. */
  draftTag: string;
  draftDesc: string;
}

/**
 * Red Tag standard detail — shows the source screenshot beside the digitized
 * isolation table, reconciles each row against the LOTO point database, lets
 * the user create points for unmatched rows, and generates a native
 * LotoStandard from the selected points.
 */
@Component({
  selector: 'app-red-tag-standard-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout [mainContentPadding]="false">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
    @if (loading()) {
      <p class="rt-note">Loading…</p>
    } @else if (!standard()) {
      <p class="rt-note">Red Tag standard not found.</p>
    } @else {
      <div class="rt-detail">
        <header class="rt-d-header">
          <button class="rt-link" (click)="back()">‹ Red Tag Standards</button>
          <h2>{{ standard()!.name }}</h2>
          <span class="rt-unit">{{ standard()!.unit }}</span>
          <span class="rt-spacer"></span>
          @if (standard()!.generatedStandardId) {
            <span class="rt-badge rt-badge-done">✓ Generated standard #{{ standard()!.generatedStandardId }}</span>
          }
        </header>

        <div class="rt-panes">
          <!-- Left: the actual Red Tag screenshot -->
          <div class="rt-pane rt-image-pane">
            <h3>Actual Red Tag version</h3>
            @if (standard()!.sourceImageBase64) {
              <img class="rt-source-img" [class.zoomed]="imgZoom()"
                   [src]="'data:image/png;base64,' + standard()!.sourceImageBase64"
                   (click)="imgZoom.set(!imgZoom())"
                   alt="Red Tag standard source image"/>
              <p class="rt-note">Click image to {{ imgZoom() ? 'shrink' : 'zoom' }}.</p>
            } @else {
              <p class="rt-note">No source image stored.</p>
            }
          </div>

          <!-- Right: reconciled rows -->
          <div class="rt-pane rt-rows-pane">
            <div class="rt-rows-head">
              <h3>Isolation points ({{ rows().length }})</h3>
              <span class="rt-count">{{ selectedCount() }} selected</span>
            </div>

            <table class="rt-table">
              <thead>
                <tr>
                  <th></th>
                  <th>#</th>
                  <th>Description</th>
                  <th>PNID</th>
                  <th>Isol.</th>
                  <th>Norm.</th>
                  <th>Match</th>
                </tr>
              </thead>
              <tbody>
                @for (rs of rowStates(); track rs.match.row.rowNumber) {
                  <tr [class.rt-included]="rs.included">
                    <td>
                      <input type="checkbox" [attr.data-testid]="'rt-select-' + rs.match.row.rowNumber"
                             [checked]="rs.included"
                             [disabled]="rs.chosenPointId == null"
                             (change)="toggleRow(rs)"/>
                    </td>
                    <td>{{ rs.match.row.rowNumber }}</td>
                    <td class="rt-desc">{{ rs.match.row.description }}</td>
                    <td class="rt-pnid">{{ rs.match.row.pnid }}</td>
                    <td>{{ rs.match.row.isolatedPosition }}</td>
                    <td>{{ rs.match.row.normalPosition || '—' }}</td>
                    <td class="rt-match-cell">
                      @switch (rs.match.status) {
                        @case ('MATCHED') {
                          <span class="rt-badge rt-badge-matched"
                                [attr.data-testid]="'rt-status-' + rs.match.row.rowNumber">✓ matched</span>
                        }
                        @case ('MULTIPLE') {
                          <select [ngModel]="rs.chosenPointId"
                                  (ngModelChange)="pickPoint(rs, $event)">
                            <option [ngValue]="null">— pick point —</option>
                            @for (m of rs.match.matches; track m.id) {
                              <option [ngValue]="m.id">{{ m.tagNumber }} — {{ m.description }}</option>
                            }
                          </select>
                        }
                        @case ('NONE') {
                          @if (!rs.creating) {
                            <button class="rt-btn rt-btn-sm" [attr.data-testid]="'rt-create-' + rs.match.row.rowNumber"
                                    (click)="openCreate(rs)">⚠ Create point</button>
                          } @else {
                            <div class="rt-create-form">
                              <input [(ngModel)]="rs.draftTag" placeholder="Tag number"/>
                              <input [(ngModel)]="rs.draftDesc" placeholder="Description"/>
                              <button class="rt-btn rt-btn-sm rt-btn-primary"
                                      [disabled]="!rs.draftTag.trim()" (click)="createPoint(rs)">Save</button>
                              <button class="rt-btn rt-btn-sm" (click)="rs.creating = false">Cancel</button>
                            </div>
                          }
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Add an arbitrary DB point not present in the table -->
            <div class="rt-extra">
              <h4>Add another LOTO point</h4>
              <div class="rt-extra-search">
                <input [(ngModel)]="searchQuery" placeholder="Search by tag number…"
                       (keyup.enter)="searchPoints()"/>
                <button class="rt-btn rt-btn-sm" (click)="searchPoints()">Search</button>
              </div>
              @for (p of searchResults(); track p.id) {
                <div class="rt-extra-row">
                  <span>{{ p.tagNumber }} — {{ p.description }}</span>
                  <button class="rt-btn rt-btn-sm" (click)="addExtra(p)"
                          [disabled]="isExtraAdded(p.id)">
                    {{ isExtraAdded(p.id) ? 'added' : 'Add' }}
                  </button>
                </div>
              }
              @for (p of extraPoints(); track p.id) {
                <div class="rt-extra-row rt-included">
                  <label>
                    <input type="checkbox" checked disabled/>
                    {{ p.tagNumber }} — {{ p.description }} <em>(extra)</em>
                  </label>
                  <button class="rt-btn rt-btn-sm" (click)="removeExtra(p.id)">Remove</button>
                </div>
              }
            </div>

            <div class="rt-generate">
              <input [(ngModel)]="generateName" placeholder="New standard name"/>
              <button class="rt-btn rt-btn-primary" data-testid="rt-generate-btn"
                      [disabled]="selectedCount() === 0 || generating()"
                      (click)="generate()">
                {{ generating() ? 'Generating…' : 'Generate LOTO Standard (' + selectedCount() + ' points)' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .rt-note { color: var(--secondary-text); padding: 20px; }
    .rt-detail { padding: 16px 20px; color: var(--primary-text); background: var(--primary-background); }
    .rt-d-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .rt-d-header h2 { margin: 0; color: var(--primary-text); }
    .rt-link { background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 13px; }
    .rt-unit { background: var(--secondary-background); color: var(--secondary-text);
      padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .rt-spacer { flex: 1; }
    .rt-panes { display: flex; gap: 16px; align-items: flex-start; }
    .rt-pane { border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;
      background: var(--card-background); }
    .rt-image-pane { flex: 0 0 38%; }
    .rt-rows-pane { flex: 1; min-width: 0; }
    .rt-pane h3 { margin: 0 0 10px; font-size: 14px; color: var(--primary-text); }
    .rt-pane h4 { color: var(--primary-text); }
    .rt-source-img { width: 100%; cursor: zoom-in; border: 1px solid var(--border-color); background: #fff; }
    .rt-source-img.zoomed { width: auto; max-width: none; cursor: zoom-out; }
    .rt-rows-head { display: flex; justify-content: space-between; align-items: baseline; }
    .rt-count { color: var(--accent-color); font-weight: 600; font-size: 13px; }
    .rt-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .rt-table th { text-align: left; padding: 6px 8px; background: var(--secondary-background);
      color: var(--secondary-text); font-size: 10px; text-transform: uppercase;
      border-bottom: 1px solid var(--border-color); }
    .rt-table td { padding: 6px 8px; border-bottom: 1px solid var(--border-color);
      vertical-align: top; color: var(--primary-text); }
    .rt-included { background: var(--hover-color); }
    .rt-desc { max-width: 260px; }
    .rt-pnid { font-family: 'Courier New', monospace; font-weight: 600; }
    .rt-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .rt-badge-matched { background: #bbf7d0; color: #14532d; }
    .rt-badge-done { background: #bbf7d0; color: #14532d; }
    .rt-create-form { display: flex; gap: 4px; flex-wrap: wrap; }
    .rt-create-form input { font-size: 11px; padding: 2px 4px;
      background: var(--card-background); color: var(--primary-text); border: 1px solid var(--border-color); }
    .rt-btn { padding: 6px 12px; border-radius: 5px; border: 1px solid var(--border-color); cursor: pointer;
      font-size: 12px; background: var(--card-background); color: var(--primary-text); }
    .rt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .rt-btn-sm { padding: 3px 8px; font-size: 11px; }
    .rt-btn-primary { background: var(--accent-color); color: #fff; border-color: var(--accent-color); font-weight: 600; }
    .rt-extra { margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .rt-extra h4 { margin: 0 0 8px; font-size: 13px; color: var(--primary-text); }
    .rt-extra-search { display: flex; gap: 6px; margin-bottom: 8px; }
    .rt-extra-search input { flex: 1; padding: 4px 8px;
      background: var(--card-background); color: var(--primary-text); border: 1px solid var(--border-color); }
    .rt-extra-row { display: flex; justify-content: space-between; align-items: center;
      padding: 4px 6px; font-size: 12px; border-bottom: 1px solid var(--border-color); color: var(--primary-text); }
    .rt-generate { display: flex; gap: 8px; margin-top: 16px; }
    .rt-generate input { flex: 1; padding: 8px;
      background: var(--card-background); color: var(--primary-text); border: 1px solid var(--border-color); }
    select { background: var(--card-background); color: var(--primary-text); border: 1px solid var(--border-color); }
  `],
})
export class RedTagStandardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(RedTagStandardService);
  private http = inject(HttpClient);
  private messages = inject(GlobalMessageService);
  private lotoStandardState = inject(RfLotoStandardStateService);

  standard = signal<RedTagStandard | null>(null);
  rowStates = signal<RowState[]>([]);
  extraPoints = signal<MatchedPoint[]>([]);
  searchResults = signal<MatchedPoint[]>([]);
  loading = signal(true);
  generating = signal(false);
  imgZoom = signal(false);

  searchQuery = '';
  generateName = '';

  private standardId!: number;

  rows = computed(() => this.standard()?.rows ?? []);

  selectedCount = computed(() => {
    const fromRows = this.rowStates().filter(r => r.included && r.chosenPointId != null).length;
    return fromRows + this.extraPoints().length;
  });

  ngOnInit(): void {
    this.standardId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getById(this.standardId).subscribe({
      next: res => {
        this.standard.set(res.responseData ?? null);
        this.generateName = res.responseData?.name ?? '';
        this.loadMatches();
      },
      error: err => {
        this.loading.set(false);
        this.messages.showError('Failed to load: ' + (err?.error?.message || err?.message));
      },
    });
  }

  /** (Re)load reconciliation. Preserves selection state across reloads where possible. */
  private loadMatches(): void {
    this.service.getMatches(this.standardId).subscribe({
      next: res => {
        const prior = new Map(this.rowStates().map(r => [r.match.row.rowNumber, r]));
        const states: RowState[] = (res.responseData ?? []).map(m => {
          const old = prior.get(m.row.rowNumber);
          // MATCHED → auto-pick the single point and include it by default.
          const autoPoint = m.status === 'MATCHED' ? m.matches[0].id : (old?.chosenPointId ?? null);
          return {
            match: m,
            chosenPointId: autoPoint,
            included: old ? old.included : m.status === 'MATCHED',
            creating: false,
            draftTag: old?.draftTag ?? m.row.pnid,
            draftDesc: old?.draftDesc ?? m.row.description,
          };
        });
        this.rowStates.set(states);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.messages.showError('Failed to reconcile rows: ' + (err?.error?.message || err?.message));
      },
    });
  }

  toggleRow(rs: RowState): void {
    rs.included = !rs.included;
    this.rowStates.set([...this.rowStates()]);
  }

  pickPoint(rs: RowState, pointId: number | null): void {
    rs.chosenPointId = pointId;
    rs.included = pointId != null;
    this.rowStates.set([...this.rowStates()]);
  }

  openCreate(rs: RowState): void {
    rs.creating = true;
    rs.draftTag = rs.match.row.pnid;
    rs.draftDesc = rs.match.row.description;
    this.rowStates.set([...this.rowStates()]);
  }

  /** Create a LOTO point for an unmatched row, then re-reconcile so the row flips to MATCHED. */
  createPoint(rs: RowState): void {
    const payload = {
      tagNumber: rs.draftTag.trim(),
      description: rs.draftDesc.trim(),
      specificLocation: '',
      equipmentIdList: [],
      isLabeled: true,
      isLockable: true,
      normalPosition: rs.match.row.normalPosition || null,
      isolatedPosition: rs.match.row.isolatedPosition || null,
    };
    this.http.post<SpringApiResponse<any>>(`${environment.apiUrl}/loto-points`, payload).subscribe({
      next: () => {
        this.messages.showSuccess(`Created LOTO point "${payload.tagNumber}".`);
        this.loadMatches();
      },
      error: err => this.messages.showError('Create failed: ' + (err?.error?.message || err?.message)),
    });
  }

  // ── Add arbitrary DB points ─────────────────────────────────────────────────

  searchPoints(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    // SearchCriteria.SearchType serializes lowercase ("global"/"column"/"sort").
    this.http.post<SpringApiResponse<any>>(
      `${environment.apiUrl}/loto-points/search?page=1&pageSize=20`,
      { type: 'global', query: q },
    ).subscribe({
      next: res => {
        const content: any[] = res.responseData?.content ?? res.responseData ?? [];
        this.searchResults.set(content.map(p => ({
          id: p.id, tagNumber: p.tagNumber, description: p.description,
        })));
      },
      error: err => this.messages.showError('Search failed: ' + (err?.error?.message || err?.message)),
    });
  }

  isExtraAdded(id: number): boolean {
    return this.extraPoints().some(p => p.id === id);
  }

  addExtra(p: MatchedPoint): void {
    if (this.isExtraAdded(p.id)) return;
    this.extraPoints.set([...this.extraPoints(), p]);
  }

  removeExtra(id: number): void {
    this.extraPoints.set(this.extraPoints().filter(p => p.id !== id));
  }

  // ── Generate ────────────────────────────────────────────────────────────────

  generate(): void {
    const ids = new Set<number>();
    for (const rs of this.rowStates()) {
      if (rs.included && rs.chosenPointId != null) ids.add(rs.chosenPointId);
    }
    for (const p of this.extraPoints()) ids.add(p.id);
    if (ids.size === 0) {
      this.messages.showWarning('Select at least one LOTO point.');
      return;
    }
    this.generating.set(true);
    this.service.generateStandard(this.standardId, this.generateName.trim(), [...ids]).subscribe({
      next: res => {
        this.generating.set(false);
        // Push the new standard into the shared (root-singleton) state service
        // BEFORE navigating, so the LOTO standard page's left panel + table
        // show it immediately — no refresh needed. The page also reads ?id=
        // and re-selects it, but the list insertion is what fixes the gap.
        const created = LotoStandardDto.fromJson(res.responseData);
        this.lotoStandardState.updateLotoStandardInList(created);
        this.lotoStandardState.setSelectedItem(created);
        this.messages.showSuccess(`Generated LOTO standard "${created?.name}".`);
        this.router.navigate(['/loto-standard'], { queryParams: { id: created?.id } });
      },
      error: err => {
        this.generating.set(false);
        this.messages.showError('Generate failed: ' + (err?.error?.message || err?.message));
      },
    });
  }

  back(): void {
    this.router.navigate(['/red-tag-standards']);
  }
}
