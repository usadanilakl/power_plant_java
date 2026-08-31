import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { AirMonitoringService, AirTestDto, MonitoredAreaDto } from '../../../services/permits/air-monitoring.service';

/**
 * Everywhere that needs air monitoring, and what it last read.
 *
 * <p>The list is derived from the open Confined Space and Hot Work permits and then edited on top —
 * a list somebody has to remember to add to is a list that will be missing the space nobody thought
 * of. Overdue entries sort to the top because the list exists to surface what needs doing.
 */
@Component({
  selector: 'app-air-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="Air Monitoring">
      <ng-container header><app-router-menu [layout]="'row'"></app-router-menu></ng-container>
      <ng-container main-content>
        <div class="page">
          <div class="toolbar">
            <span class="summary">
              <strong>{{ overdueCount() }}</strong> overdue of {{ areas().length }}
            </span>
            <span class="spacer"></span>
            <label class="inline">
              <input type="checkbox" [ngModel]="includeInactive()"
                     (ngModelChange)="includeInactive.set($event); load()" />
              Show retired
            </label>
            <button class="btn" [disabled]="busy()" (click)="refreshFromPermits()">
              {{ busy() ? 'Working…' : 'Refresh from permits' }}
            </button>
            <button class="btn" (click)="startNew()">Add area</button>
          </div>

          <p class="error" *ngIf="error()">{{ error() }}</p>
          <p class="note" *ngIf="message()">{{ message() }}</p>

          <p class="empty" *ngIf="!areas().length && !busy()">
            Nothing needs monitoring. "Refresh from permits" rebuilds the list from the open
            Confined Space and Hot Work permits.
          </p>

          <table class="grid" *ngIf="areas().length">
            <thead>
              <tr>
                <th>Area</th><th>From</th><th>Work area</th>
                <th>Last test</th><th>Readings</th><th>Tested by</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let area of areas()"
                  [class.overdue]="area.overdue"
                  [class.retired]="area.requiresMonitoring === false">
                <td>
                  <div class="name">{{ area.name }}</div>
                  <div class="sub" *ngIf="area.spaceName && area.spaceName !== area.name">
                    {{ area.spaceName }}
                  </div>
                </td>
                <td><span class="tag" [attr.data-src]="area.sourceType">{{ sourceLabel(area) }}</span></td>
                <td>{{ area.workAreaName }}</td>
                <td>
                  <ng-container *ngIf="area.lastTest; else never">
                    {{ area.hoursSinceLastTest }}h ago
                    <span class="badge" *ngIf="area.overdue">overdue</span>
                  </ng-container>
                  <ng-template #never>
                    <span class="badge">never tested</span>
                  </ng-template>
                </td>
                <td class="readings">
                  <ng-container *ngIf="area.lastTest as t">
                    <span *ngIf="t.oxygen">O₂ {{ t.oxygen }}</span>
                    <span *ngIf="t.lel">LEL {{ t.lel }}</span>
                    <span *ngIf="t.hydrogenSulfide">H₂S {{ t.hydrogenSulfide }}</span>
                    <span *ngIf="t.carbonMonoxide">CO {{ t.carbonMonoxide }}</span>
                    <span *ngIf="t.ammonia">NH₃ {{ t.ammonia }}</span>
                    <span class="result" [class.fail]="t.result === 'FAIL'" *ngIf="t.result">{{ t.result }}</span>
                  </ng-container>
                </td>
                <td>{{ area.lastTest?.testedBy }}</td>
                <td class="actions">
                  <button class="link" (click)="startTest(area)">Record test</button>
                  <button class="link" (click)="startEdit(area)">Edit</button>
                  <button class="link danger" *ngIf="area.requiresMonitoring !== false"
                          (click)="remove(area)">Remove</button>
                  <button class="link" *ngIf="area.manuallyRemoved" (click)="restore(area)">Restore</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Record a test -------------------------------------------------- -->
          <div class="panel" *ngIf="testingArea() as area">
            <h3>Air test — {{ area.name }}</h3>
            <div class="row">
              <label>Taken at
                <input type="datetime-local" [(ngModel)]="testForm.testedAt" />
              </label>
              <label>Tested by <input type="text" [(ngModel)]="testForm.testedBy" /></label>
              <label>Meter model <input type="text" [(ngModel)]="testForm.meterModel" /></label>
              <label>Meter serial <input type="text" [(ngModel)]="testForm.meterSerial" /></label>
            </div>
            <div class="row">
              <label>O₂ <input type="text" [(ngModel)]="testForm.oxygen" placeholder="20.9" /></label>
              <label>LEL <input type="text" [(ngModel)]="testForm.lel" placeholder="0" /></label>
              <label>H₂S <input type="text" [(ngModel)]="testForm.hydrogenSulfide" /></label>
              <label>CO <input type="text" [(ngModel)]="testForm.carbonMonoxide" /></label>
              <label>NH₃ <input type="text" [(ngModel)]="testForm.ammonia" /></label>
              <label>Result
                <select [(ngModel)]="testForm.result">
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </label>
            </div>
            <label class="wide">Notes <input type="text" [(ngModel)]="testForm.notes" /></label>
            <div class="row">
              <button class="btn primary" [disabled]="busy()" (click)="saveTest()">Save test</button>
              <button class="btn" (click)="testingArea.set(null)">Cancel</button>
            </div>
          </div>

          <!-- Add / edit an area --------------------------------------------- -->
          <div class="panel" *ngIf="editingArea()">
            <h3>{{ editForm.id ? 'Edit area' : 'Add area' }}</h3>
            <div class="row">
              <label>Name <input type="text" [(ngModel)]="editForm.name" /></label>
              <label>Space / vessel <input type="text" [(ngModel)]="editForm.spaceName" /></label>
              <label>Re-test every (hours)
                <input type="number" min="1" [(ngModel)]="editForm.testIntervalHours"
                       placeholder="12" />
              </label>
            </div>
            <label class="wide">Notes <input type="text" [(ngModel)]="editForm.notes" /></label>
            <div class="row">
              <button class="btn primary" [disabled]="busy() || !editForm.name" (click)="saveArea()">Save</button>
              <button class="btn" (click)="editingArea.set(false)">Cancel</button>
            </div>
          </div>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .page { padding: 8px; color: var(--primary-text); }
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .spacer { flex: 1; }
    .summary { font-size: 14px; }
    .inline { display: flex; align-items: center; gap: 6px; font-size: 13px; }

    .btn {
      padding: 5px 12px; border-radius: 4px; font-size: 13px; cursor: pointer;
      border: 1px solid var(--border-color); background: transparent; color: var(--primary-text);
    }
    .btn:hover:not(:disabled) { background: var(--hover-color); }
    .btn:disabled { opacity: .45; cursor: not-allowed; }
    .btn.primary { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }

    .grid { width: 100%; border-collapse: collapse; font-size: 13px; }
    .grid th, .grid td { border-bottom: 1px solid var(--border-color); padding: 7px 8px; text-align: left; vertical-align: top; }
    .grid thead th { background: var(--secondary-background); color: var(--secondary-text); }

    /* Overdue is the reason the screen exists, so it is the loudest thing on it. */
    .grid tr.overdue { background: rgba(239, 68, 68, .10); }
    .grid tr.retired { opacity: .55; }

    .name { font-weight: 600; }
    .sub { font-size: 12px; color: var(--secondary-text); }

    .tag { font-size: 11px; padding: 1px 7px; border-radius: 9px; background: var(--secondary-background); }
    .tag[data-src="HOT_WORK"] { background: rgba(249, 115, 22, .2); }
    .tag[data-src="CONFINED_SPACE"] { background: rgba(234, 179, 8, .2); }

    .badge {
      font-size: 11px; padding: 1px 7px; border-radius: 9px;
      background: #c62828; color: #fff; margin-left: 4px;
    }

    .readings { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; }
    .result { font-weight: 700; color: #2e7d32; }
    .result.fail { color: #c62828; }

    .actions { white-space: nowrap; }
    .link { border: none; background: none; color: var(--accent-color); cursor: pointer; font-size: 12px; padding: 0 4px; }
    .link.danger { color: #ef5350; }
    .link:hover { text-decoration: underline; }

    .panel {
      margin-top: 16px; padding: 12px; border-radius: 6px;
      border: 1px solid var(--border-color); background: var(--card-background);
    }
    .panel h3 { margin: 0 0 10px; font-size: 15px; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; }
    label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--secondary-text); }
    label.wide { width: 100%; }
    input, select {
      padding: 4px 7px; border-radius: 4px; font-size: 13px;
      border: 1px solid var(--border-color);
      background: var(--primary-background); color: var(--primary-text);
    }

    .error { color: #ef5350; font-size: 13px; }
    .note { color: #66bb6a; font-size: 13px; }
    .empty { color: var(--secondary-text); font-size: 13px; }
  `],
})
export class AirMonitoringComponent implements OnInit {
  private api = inject(AirMonitoringService);

  areas = signal<MonitoredAreaDto[]>([]);
  includeInactive = signal(false);
  busy = signal(false);
  error = signal('');
  message = signal('');

  testingArea = signal<MonitoredAreaDto | null>(null);
  editingArea = signal(false);

  testForm: AirTestDto & { testedAt: string } = this.blankTest();
  editForm: MonitoredAreaDto = { name: '' };

  overdueCount = computed(() => this.areas().filter(a => a.overdue).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.busy.set(true);
    this.error.set('');
    this.api.areas(this.includeInactive()).subscribe({
      next: res => { this.areas.set(res.responseData ?? []); this.busy.set(false); },
      error: err => { this.error.set(this.describe(err)); this.busy.set(false); },
    });
  }

  refreshFromPermits(): void {
    this.busy.set(true);
    this.error.set('');
    this.api.refresh().subscribe({
      next: res => {
        const r = res.responseData ?? {};
        this.message.set(`Added ${r.added ?? 0}, reactivated ${r.reactivated ?? 0}, retired ${r.retired ?? 0}.`);
        this.load();
      },
      error: err => { this.error.set(this.describe(err)); this.busy.set(false); },
    });
  }

  sourceLabel(area: MonitoredAreaDto): string {
    switch (area.sourceType) {
      case 'CONFINED_SPACE': return 'CS permit';
      case 'HOT_WORK': return 'HW permit';
      default: return 'added by hand';
    }
  }

  // ---------------------------------------------------------------- tests

  private blankTest(): AirTestDto & { testedAt: string } {
    return {
      monitoredAreaId: 0,
      // Defaults to now, but stays editable: a reading written up after the fact must carry the
      // moment it was taken, not the moment it was typed.
      testedAt: this.toLocalInput(new Date()),
      testedBy: '', meterModel: '', meterSerial: '',
      oxygen: '', lel: '', hydrogenSulfide: '', carbonMonoxide: '', ammonia: '',
      result: 'PASS', notes: '',
    };
  }

  startTest(area: MonitoredAreaDto): void {
    this.editingArea.set(false);
    this.message.set('');
    this.testForm = this.blankTest();
    this.testForm.monitoredAreaId = area.id!;
    // Carry the meter forward — the same person usually tests several spaces on one walk with one
    // instrument, and retyping the serial each time is how serials end up wrong.
    const previous = area.lastTest;
    if (previous) {
      this.testForm.meterModel = previous.meterModel ?? '';
      this.testForm.meterSerial = previous.meterSerial ?? '';
    }
    this.testingArea.set(area);
  }

  saveTest(): void {
    const area = this.testingArea();
    if (!area) return;
    this.busy.set(true);
    this.error.set('');
    this.api.recordTest({ ...this.testForm, testedAt: this.toInstant(this.testForm.testedAt) }).subscribe({
      next: () => { this.testingArea.set(null); this.message.set('Test recorded.'); this.load(); },
      error: err => { this.error.set(this.describe(err)); this.busy.set(false); },
    });
  }

  // ---------------------------------------------------------------- areas

  startNew(): void {
    this.testingArea.set(null);
    this.message.set('');
    this.editForm = { name: '', requiresMonitoring: true };
    this.editingArea.set(true);
  }

  startEdit(area: MonitoredAreaDto): void {
    this.testingArea.set(null);
    this.message.set('');
    this.editForm = { ...area };
    this.editingArea.set(true);
  }

  saveArea(): void {
    this.busy.set(true);
    this.error.set('');
    this.api.saveArea(this.editForm).subscribe({
      next: () => { this.editingArea.set(false); this.load(); },
      error: err => { this.error.set(this.describe(err)); this.busy.set(false); },
    });
  }

  remove(area: MonitoredAreaDto): void {
    if (!confirm(`Take "${area.name}" off the list? Its recorded tests are kept.`)) return;
    this.api.removeArea(area.id!).subscribe({
      next: () => this.load(),
      error: err => this.error.set(this.describe(err)),
    });
  }

  restore(area: MonitoredAreaDto): void {
    this.api.restoreArea(area.id!).subscribe({
      next: () => this.load(),
      error: err => this.error.set(this.describe(err)),
    });
  }

  // ---------------------------------------------------------------- helpers

  /** `datetime-local` wants local wall time with no zone; the API wants an ISO instant. */
  private toLocalInput(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toInstant(local: string): string {
    return local ? new Date(local).toISOString() : new Date().toISOString();
  }

  private describe(err: any): string {
    return err?.error?.message || err?.message || 'Request failed';
  }
}
