import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PhysicalObjectApiService } from './physical-object-api.service';
import { PhysicalObjectAggregate } from './physical-object.model';

type Tab = 'overview' | 'loto' | 'files' | 'logs' | 'checks' | 'maximo';

/**
 * Embeddable "everything about this object" binder for the PWA. Given an {@code objectId}, loads the aggregate
 * (files/P&IDs, LOTO points, work areas, systems, logs, Maximo WO/SR) and lets the operator add a log entry.
 * Used from the Rounds question-context; also usable standalone. Online-only (offline caching layered in P4).
 */
@Component({
  selector: 'app-object-context',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="oc">
      @if (loading()) {
        <p class="oc-msg">Loading object…</p>
      } @else if (error()) {
        <p class="oc-msg oc-error">{{ error() }}</p>
      } @else if (agg()) {
        @let a = agg()!;
        <div class="oc-head">
          <div class="oc-title">{{ a.node.name || '(unnamed)' }}</div>
          <div class="oc-sub">
            @if (a.node.type) { <span class="oc-chip">{{ a.node.type }}</span> }
            @if (a.node.tagNumber) { <span class="oc-chip">{{ a.node.tagNumber }}</span> }
          </div>
          @if (a.breadcrumb.length > 1) {
            <div class="oc-crumb">{{ crumb(a) }}</div>
          }
          <button class="oc-report" (click)="reportToMaximo(a)">＋ Report to Maximo (SR)</button>
        </div>

        <div class="oc-tabs">
          <button [class.active]="tab() === 'overview'" (click)="tab.set('overview')">Info</button>
          <button [class.active]="tab() === 'loto'" (click)="tab.set('loto')">LOTO ({{ a.lotoPoints.length }})</button>
          <button [class.active]="tab() === 'files'" (click)="tab.set('files')">P&amp;IDs ({{ a.files.length }})</button>
          <button [class.active]="tab() === 'logs'" (click)="tab.set('logs')">Logs ({{ a.logs.length }})</button>
          @if (a.roundChecks.length) {
            <button [class.active]="tab() === 'checks'" (click)="tab.set('checks')">Checks ({{ a.roundChecks.length }})</button>
          }
          @if (a.maximo.available) {
            <button [class.active]="tab() === 'maximo'" (click)="tab.set('maximo')">Maximo</button>
          }
        </div>

        <div class="oc-body">
          @switch (tab()) {
            @case ('overview') {
              <dl class="oc-dl">
                @if (a.node.description) { <dt>Description</dt><dd>{{ a.node.description }}</dd> }
                @if (a.node.specificLocation) { <dt>Location</dt><dd>{{ a.node.specificLocation }}</dd> }
                @if (a.node.maximoLocation) { <dt>Maximo location</dt><dd>{{ a.node.maximoLocation }}</dd> }
                @if (a.node.maximoAssetnum) { <dt>Maximo asset</dt><dd>{{ a.node.maximoAssetnum }}</dd> }
                @if (a.systems.length) {
                  <dt>Systems</dt>
                  <dd>@for (s of a.systems; track s.id) { <span class="oc-chip">{{ s.name }}</span> }</dd>
                }
                @if (a.workAreas.length) {
                  <dt>Work areas</dt>
                  <dd>@for (w of a.workAreas; track w.id) { <span class="oc-chip">{{ w.name }} ({{ w.lotoCount }} LOTO)</span> }</dd>
                }
              </dl>
            }
            @case ('loto') {
              @if (a.lotoPoints.length) {
                @for (p of a.lotoPoints; track p.id) {
                  <div class="oc-row">
                    <div class="oc-row-main">{{ p.tagNumber || '—' }} <span class="oc-muted">{{ p.description }}</span></div>
                    <div class="oc-row-sub">
                      @if (p.normalPosition) { <span>norm: {{ p.normalPosition }}</span> }
                      @if (p.isolatedPosition) { <span>iso: {{ p.isolatedPosition }}</span> }
                      @if (p.specificLocation) { <span>{{ p.specificLocation }}</span> }
                    </div>
                  </div>
                }
              } @else { <p class="oc-empty">No LOTO points bound.</p> }
            }
            @case ('files') {
              @if (a.files.length) {
                @for (f of a.files; track f.id) {
                  <a class="oc-row oc-link" [href]="f.fileLink || '#'" target="_blank" rel="noopener">
                    <div class="oc-row-main">{{ f.name || f.fileNumber || 'file' }}</div>
                    <div class="oc-row-sub"><span>{{ f.fileNumber }}</span><span>{{ f.extension }}</span></div>
                  </a>
                }
              } @else { <p class="oc-empty">No documents / P&amp;IDs.</p> }
            }
            @case ('logs') {
              <div class="oc-addlog">
                <textarea [(ngModel)]="newLog" rows="2" placeholder="Add a log entry for this object…"></textarea>
                <label class="oc-attn"><input type="checkbox" [(ngModel)]="newLogAttn" /> flag</label>
                <button [disabled]="!newLog.trim() || savingLog()" (click)="submitLog()">{{ savingLog() ? '…' : 'Add' }}</button>
              </div>
              @if (a.logs.length) {
                @for (l of a.logs; track l.id) {
                  <div class="oc-row" [class.oc-attn-row]="l.needsAttention">
                    <div class="oc-row-main">{{ l.content }}</div>
                    <div class="oc-row-sub"><span>{{ l.author || 'unknown' }}</span><span>{{ l.createdAt | date:'short' }}</span></div>
                  </div>
                }
              } @else { <p class="oc-empty">No logs yet.</p> }
            }
            @case ('checks') {
              @for (c of a.roundChecks; track c.questionId) {
                <div class="oc-row" [class.oc-attn-row]="c.openIssue">
                  <div class="oc-row-main">
                    {{ c.prompt }}
                    @if (c.openIssue) { <span class="oc-badge oor">out of range</span> }
                  </div>
                  <div class="oc-row-sub">
                    <span>{{ c.roundName }}</span>
                    @if (c.answerType) { <span>{{ c.answerType }}</span> }
                    @if (c.lowLimit != null || c.highLimit != null) { <span>{{ c.lowLimit ?? '' }}–{{ c.highLimit ?? '' }} {{ c.unit }}</span> }
                    @else if (c.expectedValue) { <span>= {{ c.expectedValue }}</span> }
                    @if (c.lastValue) { <span class="oc-last">last: {{ c.lastValue }} {{ c.lastAt ? '(' + (c.lastAt | date:'MMM d') + ')' : '' }}</span> }
                  </div>
                </div>
              } @empty { <p class="oc-empty">No round checks reference this object.</p> }
            }
            @case ('maximo') {
              <div class="oc-mx-group">Work orders</div>
              @if (a.maximo.workOrders.length) {
                @for (w of a.maximo.workOrders; track w.wonum) {
                  <div class="oc-row"><div class="oc-row-main">{{ w.wonum }} <span class="oc-muted">{{ w.description }}</span></div>
                    <div class="oc-row-sub"><span>{{ w.status }}</span></div></div>
                }
              } @else { <p class="oc-empty">No work orders.</p> }
              <div class="oc-mx-group">Service requests</div>
              @if (a.maximo.serviceRequests.length) {
                @for (s of a.maximo.serviceRequests; track s.ticketid) {
                  <div class="oc-row"><div class="oc-row-main">{{ s.ticketid }} <span class="oc-muted">{{ s.description }}</span></div>
                    <div class="oc-row-sub"><span>{{ s.status }}</span></div></div>
                }
              } @else { <p class="oc-empty">No service requests.</p> }
            }
          }
        </div>
      } @else {
        <p class="oc-msg">Object not found.</p>
      }
    </div>
  `,
  styles: [`
    .oc { font-size: 14px; color: var(--primary-text); }
    .oc-msg { padding: 16px; color: var(--secondary-text); text-align: center; }
    .oc-error { color: var(--danger-text); }
    .oc-head { padding: 8px 0 6px; border-bottom: 1px solid var(--border-color); }
    .oc-title { font-size: 16px; font-weight: 600; color: var(--primary-text); }
    .oc-sub { margin-top: 4px; }
    .oc-crumb { margin-top: 4px; color: var(--secondary-text); font-size: 12px; }
    .oc-report { margin-top: 8px; background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 6px; padding: 8px 12px; font-size: 13px; }
    .oc-chip { display: inline-block; background: var(--secondary-background); color: var(--secondary-text); border-radius: 4px; padding: 2px 7px; margin: 2px 4px 2px 0; font-size: 12px; }
    .oc-tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1px solid var(--border-color); margin-top: 6px; }
    .oc-tabs button { flex: none; background: none; border: none; padding: 8px 12px; font-size: 13px; color: var(--secondary-text); border-bottom: 2px solid transparent; }
    .oc-tabs button.active { color: var(--accent-color); border-bottom-color: var(--accent-color); font-weight: 600; }
    .oc-body { padding: 8px 0; }
    .oc-dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0; }
    .oc-dl dt { color: var(--secondary-text); font-size: 12px; }
    .oc-dl dd { margin: 0; }
    .oc-row { padding: 7px 0; border-bottom: 1px solid var(--border-color); }
    .oc-link { display: block; text-decoration: none; color: inherit; }
    .oc-row-main { font-size: 14px; }
    .oc-muted { color: var(--secondary-text); }
    .oc-row-sub { display: flex; gap: 10px; color: var(--secondary-text); font-size: 12px; margin-top: 2px; }
    .oc-empty { color: var(--secondary-text); padding: 12px 0; text-align: center; font-size: 13px; }
    .oc-attn-row { background: var(--warning-bg); }
    .oc-addlog { display: flex; gap: 6px; align-items: flex-start; margin-bottom: 8px; }
    .oc-addlog textarea { flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: 5px; font: inherit; font-size: 16px; resize: vertical; background: var(--input-bg); color: var(--primary-text); }
    .oc-addlog button { background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 5px; padding: 6px 14px; }
    .oc-attn { display: flex; align-items: center; gap: 3px; font-size: 12px; color: var(--secondary-text); }
    .oc-mx-group { font-size: 12px; font-weight: 600; color: var(--secondary-text); text-transform: uppercase; margin: 8px 0 2px; }
    .oc-badge { border-radius: 3px; padding: 1px 5px; font-size: 10px; margin-left: 6px; }
    .oc-badge.oor { background: var(--danger-bg); color: var(--danger-text); }
    .oc-last { color: var(--secondary-text); }
  `],
})
export class ObjectContextComponent {
  private api = inject(PhysicalObjectApiService);
  private router = inject(Router);

  /** The PhysicalObject to render. */
  objectId = input.required<number>();

  agg = signal<PhysicalObjectAggregate | null>(null);
  loading = signal(false);
  error = signal<string>('');
  tab = signal<Tab>('overview');

  newLog = '';
  newLogAttn = false;
  savingLog = signal(false);

  constructor() {
    effect(() => {
      const id = this.objectId();
      if (id != null) this.load(id);
    });
  }

  private async load(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.agg.set(await firstValueFrom(this.api.getAggregate(id)));
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to load object');
    } finally {
      this.loading.set(false);
    }
  }

  crumb(a: PhysicalObjectAggregate): string {
    return a.breadcrumb.map(n => n.name).filter(Boolean).join(' › ');
  }

  /** Deep-link into the Maximo SR-create form with this object's asset/location prefilled. */
  reportToMaximo(a: PhysicalObjectAggregate): void {
    const n = a.node;
    const tag = n.tagNumber || n.name || '';
    this.router.navigate(['/maximo/new-request'], {
      queryParams: {
        assetnum: n.maximoAssetnum || undefined,
        location: n.maximoLocation || undefined,
        description: tag ? `${tag} — ` : undefined,
      },
    });
  }

  async submitLog(): Promise<void> {
    const a = this.agg();
    const text = this.newLog.trim();
    if (!a || !text) return;
    this.savingLog.set(true);
    try {
      const log = await firstValueFrom(this.api.addLog(a.node.id, text, this.newLogAttn));
      this.agg.set({ ...a, logs: [log, ...a.logs] });
      this.newLog = '';
      this.newLogAttn = false;
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to add log');
    } finally {
      this.savingLog.set(false);
    }
  }
}
