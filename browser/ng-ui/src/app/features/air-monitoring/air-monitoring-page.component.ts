import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AirTestDto, MonitoredAreaDto, PwaAirMonitoringService } from './air-monitoring.service';

/**
 * Air monitoring, in the field.
 *
 * <p>Overdue first, because the only reason to open this on a phone is to find out what still needs
 * testing. Recording works with no signal — the reading is queued locally and pushed when the hub
 * answers — and the queue is shown rather than hidden, so nobody has to wonder whether their test
 * was saved.
 */
@Component({
  selector: 'app-air-monitoring-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="head">
        <h2>Air Monitoring</h2>
        <button class="refresh" [disabled]="svc.loading()" (click)="reload()">
          {{ svc.loading() ? '…' : 'Refresh' }}
        </button>
      </header>

      <p class="src" *ngIf="svc.source() as s">
        <ng-container [ngSwitch]="s">
          <span *ngSwitchCase="'snapshot'">Offline copy — the hub could not be reached.</span>
          <span *ngSwitchCase="'cache'">Showing the last list this device saw.</span>
          <span *ngSwitchCase="'none'">No list available yet. Connect once to download it.</span>
        </ng-container>
      </p>

      <p class="queued" *ngIf="svc.pending().length">
        {{ svc.pending().length }} test(s) saved on this device, waiting to upload. They will send
        themselves when you have signal.
      </p>

      <p class="summary" *ngIf="areas().length">
        <strong>{{ overdue().length }}</strong> need testing of {{ areas().length }}
      </p>

      <div class="list">
        <button class="card" *ngFor="let area of areas()"
                [class.overdue]="area.overdue"
                (click)="startTest(area)">
          <div class="card-top">
            <span class="name">{{ area.name }}</span>
            <span class="pill" *ngIf="area.overdue">needs test</span>
          </div>
          <div class="meta">
            <span *ngIf="area.workAreaName">{{ area.workAreaName }}</span>
            <span *ngIf="area.lastTest">last {{ area.hoursSinceLastTest }}h ago</span>
            <span *ngIf="!area.lastTest">never tested</span>
          </div>
          <div class="readings" *ngIf="area.lastTest as t">
            <span *ngIf="t.oxygen">O₂ {{ t.oxygen }}</span>
            <span *ngIf="t.lel">LEL {{ t.lel }}</span>
            <span *ngIf="t.hydrogenSulfide">H₂S {{ t.hydrogenSulfide }}</span>
            <span *ngIf="t.carbonMonoxide">CO {{ t.carbonMonoxide }}</span>
          </div>
        </button>
      </div>

      <p class="empty" *ngIf="!areas().length && !svc.loading()">Nothing needs monitoring.</p>

      <!-- Record ------------------------------------------------------------- -->
      <div class="sheet" *ngIf="testing() as area">
        <div class="sheet-head">
          <strong>{{ area.name }}</strong>
          <button class="close" (click)="testing.set(null)">×</button>
        </div>

        <label>Taken at
          <input type="datetime-local" [(ngModel)]="form.testedAt" />
        </label>
        <label>Tested by <input type="text" [(ngModel)]="form.testedBy" /></label>

        <div class="grid">
          <label>O₂ <input type="text" inputmode="decimal" [(ngModel)]="form.oxygen" placeholder="20.9" /></label>
          <label>LEL <input type="text" inputmode="decimal" [(ngModel)]="form.lel" placeholder="0" /></label>
          <label>H₂S <input type="text" inputmode="decimal" [(ngModel)]="form.hydrogenSulfide" /></label>
          <label>CO <input type="text" inputmode="decimal" [(ngModel)]="form.carbonMonoxide" /></label>
          <label>NH₃ <input type="text" inputmode="decimal" [(ngModel)]="form.ammonia" /></label>
        </div>

        <div class="grid">
          <label>Meter model <input type="text" [(ngModel)]="form.meterModel" /></label>
          <label>Meter serial <input type="text" [(ngModel)]="form.meterSerial" /></label>
        </div>

        <div class="result-row">
          <button class="result pass" [class.on]="form.result === 'PASS'" (click)="form.result = 'PASS'">PASS</button>
          <button class="result fail" [class.on]="form.result === 'FAIL'" (click)="form.result = 'FAIL'">FAIL</button>
        </div>

        <label>Notes <input type="text" [(ngModel)]="form.notes" /></label>

        <button class="save" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Saving…' : 'Save test' }}
        </button>
        <p class="saved" *ngIf="saveNote()">{{ saveNote() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 12px 12px 32px; }
    .head { display: flex; align-items: center; justify-content: space-between; }
    h2 { margin: 0 0 4px; font-size: 20px; }

    .refresh {
      border: 1px solid var(--border-color, #ddd); background: none;
      border-radius: 4px; padding: 4px 12px; font-size: 13px; cursor: pointer;
    }

    .src, .queued, .summary, .empty { font-size: 13px; margin: 6px 0; }
    .src { color: var(--secondary-text, #777); }
    .queued { color: #a26a00; }

    .list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }

    .card {
      width: 100%; text-align: left; cursor: pointer;
      border: 1px solid var(--border-color, #ddd); border-radius: 8px;
      background: var(--card-background, #fff); padding: 10px 12px;
    }

    /* The whole reason to open this on a phone. */
    .card.overdue { border-color: #c62828; background: rgba(198, 40, 40, .06); }

    .card-top { display: flex; align-items: center; gap: 8px; }
    .name { font-weight: 600; font-size: 15px; }

    .pill {
      margin-left: auto; font-size: 11px; padding: 2px 8px; border-radius: 10px;
      background: #c62828; color: #fff;
    }

    .meta, .readings {
      display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px;
      font-size: 12px; color: var(--secondary-text, #666);
    }

    .sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
      max-height: 88vh; overflow-y: auto;
      background: var(--card-background, #fff);
      border-top: 1px solid var(--border-color, #ddd);
      border-radius: 12px 12px 0 0;
      padding: 14px 14px 28px;
      box-shadow: 0 -4px 16px rgba(0,0,0,.2);
    }

    .sheet-head { display: flex; align-items: center; margin-bottom: 10px; font-size: 16px; }
    .close { margin-left: auto; border: none; background: none; font-size: 24px; line-height: 1; cursor: pointer; }

    label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; margin-bottom: 8px; color: var(--secondary-text, #666); }

    input {
      padding: 9px 10px; font-size: 16px; /* 16px stops iOS zooming the page on focus */
      border: 1px solid var(--border-color, #ddd); border-radius: 6px;
      background: var(--primary-background, #fff); color: var(--primary-text, #222);
    }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }

    .result-row { display: flex; gap: 8px; margin: 6px 0 10px; }
    .result {
      flex: 1; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 15px;
      border: 2px solid var(--border-color, #ddd); background: none; cursor: pointer;
    }
    .result.pass.on { border-color: #2e7d32; background: rgba(46,125,50,.12); color: #2e7d32; }
    .result.fail.on { border-color: #c62828; background: rgba(198,40,40,.12); color: #c62828; }

    .save {
      width: 100%; padding: 14px; border: none; border-radius: 8px;
      background: var(--accent-color, #007bff); color: #fff; font-size: 16px; font-weight: 600;
      cursor: pointer;
    }
    .save:disabled { opacity: .5; }
    .saved { text-align: center; font-size: 13px; color: #2e7d32; margin-top: 8px; }
  `],
})
export class AirMonitoringPageComponent implements OnInit {
  svc = inject(PwaAirMonitoringService);

  testing = signal<MonitoredAreaDto | null>(null);
  saving = signal(false);
  saveNote = signal('');

  form: AirTestDto & { testedAt: string } = this.blank();

  areas = computed(() => this.svc.areas());
  overdue = computed(() => this.areas().filter(a => a.overdue));

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    void this.svc.load();
  }

  private blank(): AirTestDto & { testedAt: string } {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      monitoredAreaId: 0,
      testedAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
        + `T${pad(now.getHours())}:${pad(now.getMinutes())}`,
      testedBy: '', meterModel: '', meterSerial: '',
      oxygen: '', lel: '', hydrogenSulfide: '', carbonMonoxide: '', ammonia: '',
      result: 'PASS', notes: '',
    };
  }

  startTest(area: MonitoredAreaDto): void {
    this.saveNote.set('');
    this.form = this.blank();
    this.form.monitoredAreaId = area.id;
    // One tester usually walks several spaces with one instrument; retyping the serial each time is
    // how serials end up wrong.
    if (area.lastTest) {
      this.form.meterModel = area.lastTest.meterModel ?? '';
      this.form.meterSerial = area.lastTest.meterSerial ?? '';
    }
    this.testing.set(area);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    const outcome = await this.svc.record({
      ...this.form,
      testedAt: new Date(this.form.testedAt).toISOString(),
    });
    this.saving.set(false);
    this.saveNote.set(outcome === 'sent'
      ? 'Saved.'
      : 'Saved on this device — it will upload when you have signal.');
    this.testing.set(null);
    this.reload();
  }
}
