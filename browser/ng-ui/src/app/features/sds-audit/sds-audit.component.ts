import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServerApiService } from '../../services/server-api.service';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { UserSetupService } from '../../services/user-setup.service';

type ViewMode = 'select' | 'list';
type GroupBy = 'location' | 'alpha';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface Chemical {
  localUuid: string;
  sharepointId: string;
  primaryName: string;
  names: string;
  locations: string;
  bookNumber: number | null;
  sectionNumber: number | null;
  statusName: string;
}

interface Group { label: string; items: Chemical[]; }

@Component({
  selector: 'app-sds-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (submitState() === 'submitting') {
      <div class="overlay"><div class="overlay-card"><div class="spinner"></div><p>Saving audit...</p></div></div>
    }
    @if (submitState() === 'error') {
      <div class="overlay"><div class="overlay-card error">
        <span class="icon">&#10007;</span><p>{{ submitMessage() }}</p>
        <button class="btn" (click)="submitState.set('idle')">OK</button>
      </div></div>
    }

    @if (mode() === 'select') {
      <div class="wrap">
        <h2 class="title">SDS Audit</h2>
        <p class="subtitle">Walk the storage locations and verify each chemical's filed data.</p>

        <label class="lbl">Campaign</label>
        <select class="inp" [(ngModel)]="campaign">
          @for (c of campaigns(); track c) { <option [value]="c">{{ c }}</option> }
          @if (campaigns().length === 0) { <option value="">(no campaigns)</option> }
        </select>

        <label class="lbl">Review by</label>
        <div class="seg">
          <button [class.active]="groupBy() === 'location'" (click)="groupBy.set('location')">Location</button>
          <button [class.active]="groupBy() === 'alpha'" (click)="groupBy.set('alpha')">Alphabetical</button>
        </div>

        <button class="btn primary start" [disabled]="!campaign() || loading()" (click)="startAudit()">
          {{ loading() ? 'Loading...' : 'Start auditing' }}
        </button>
      </div>
    }

    @if (mode() === 'list') {
      <div class="wrap wide">
        <div class="sticky">
          <button class="back" (click)="mode.set('select')">&#x2190; Back</button>
          <span class="hdr">{{ campaign() }} — {{ dueCount() }} to review</span>
        </div>

        @if (loading()) {
          <div class="muted center">Loading inventory...</div>
        } @else if (dueCount() === 0) {
          <div class="muted center">&#10003; All chemicals audited for this campaign.</div>
        } @else {
          @for (g of groups(); track g.label) {
            <div class="group">
              <div class="group-hdr">{{ g.label }} <span class="count">({{ g.items.length }})</span></div>
              @for (c of g.items; track $index) {
                <div class="item" [class.expanded]="expanded() === c.localUuid">
                  <div class="item-row" (click)="toggle(c)">
                    <div>
                      <div class="item-name">{{ c.primaryName || '(unnamed)' }}</div>
                      <div class="item-meta">
                        Book {{ c.bookNumber ?? '—' }} / Sec {{ c.sectionNumber ?? '—' }}
                        @if (c.statusName) { · {{ c.statusName }} }
                      </div>
                    </div>
                    <span class="chev">{{ expanded() === c.localUuid ? '▾' : '▸' }}</span>
                  </div>

                  @if (expanded() === c.localUuid) {
                    @if (editing() !== c.localUuid) {
                      <div class="item-detail">
                        <div><strong>Names:</strong> {{ namesList(c).join(', ') }}</div>
                        <div><strong>Locations:</strong> {{ locList(c).join(', ') || '—' }}</div>
                        <div class="actions">
                          <button class="btn ok" (click)="confirm(c)">&#10003; Confirm correct</button>
                          <button class="btn" (click)="startEdit(c)">Edit</button>
                        </div>
                      </div>
                    } @else {
                      <div class="item-edit">
                        <label class="lbl">Names (one per line)</label>
                        <textarea class="inp" rows="3" [(ngModel)]="editNames"></textarea>
                        <label class="lbl">Locations (one per line)</label>
                        <textarea class="inp" rows="3" [(ngModel)]="editLocations"></textarea>
                        <label class="lbl">Comments</label>
                        <textarea class="inp" rows="2" [(ngModel)]="editComments" placeholder="What changed / why"></textarea>
                        <div class="actions">
                          <button class="btn primary" (click)="saveEdit(c)">Save changes</button>
                          <button class="btn" (click)="editing.set(null)">Cancel</button>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }
    .wrap { max-width: 600px; margin: 0 auto; padding: 16px; box-sizing: border-box; }
    .wrap.wide { max-width: 800px; }
    .title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
    .subtitle { color: var(--secondary-text); margin: 0 0 20px; }
    .lbl { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text);
      text-transform: uppercase; letter-spacing: .3px; margin: 14px 0 4px; }
    .inp { width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--card-background); color: var(--primary-text); font-family: inherit; font-size: 14px; }
    .seg { display: flex; gap: 6px; }
    .seg button { flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; }
    .seg button.active { background: var(--accent-color); color: #fff; border-color: var(--accent-color); }
    .btn { padding: 9px 16px; border: 1px solid var(--border-color); border-radius: 6px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 14px; font-family: inherit; }
    .btn.primary { background: var(--accent-color); color: #fff; border-color: var(--accent-color); }
    .btn.ok { background: var(--status-complete); color: var(--primary-text); border-color: var(--status-complete); }
    .btn.start { margin-top: 20px; width: 100%; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .sticky { position: sticky; top: 0; background: var(--primary-background); padding: 10px 0;
      display: flex; align-items: center; gap: 12px; z-index: 5; flex-wrap: wrap; }
    .back { background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 14px; }
    .hdr { font-weight: 600; }
    .muted { color: var(--secondary-text); } .center { text-align: center; padding: 32px; }
    .group { margin-bottom: 16px; }
    .group-hdr { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
      color: var(--secondary-text); padding: 6px 0; border-bottom: 1px solid var(--border-color); }
    .group-hdr .count { font-weight: 400; }
    .item { border: 1px solid var(--border-color); border-radius: 8px; margin-top: 8px; background: var(--card-background); }
    .item.expanded { border-color: var(--accent-color); }
    .item-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; }
    .item-name { font-weight: 600; }
    .item-meta { font-size: 12px; color: var(--secondary-text); margin-top: 2px; }
    .chev { color: var(--secondary-text); }
    .item-detail, .item-edit { padding: 0 12px 12px; font-size: 14px; display: flex; flex-direction: column; gap: 6px; }
    .actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .overlay-card { background: var(--primary-background); border-radius: 16px; padding: 28px; text-align: center; min-width: 260px; }
    .overlay-card .icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .overlay-card.error .icon { color: #f44336; }
    .spinner { width: 36px; height: 36px; border: 4px solid var(--border-color); border-top-color: var(--accent-color);
      border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SdsAuditComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetup = inject(UserSetupService);

  mode = signal<ViewMode>('select');
  groupBy = signal<GroupBy>('location');
  campaign = signal<string>('');
  campaigns = signal<string[]>([]);
  loading = signal(false);
  submitState = signal<SubmitState>('idle');
  submitMessage = signal('');

  private chemicals = signal<Chemical[]>([]);
  private auditedUuids = signal<Set<string>>(new Set());
  private doneUuids = signal<Set<string>>(new Set());

  expanded = signal<string | null>(null);
  editing = signal<string | null>(null);
  editNames = '';
  editLocations = '';
  editComments = '';

  private due = computed<Chemical[]>(() => {
    const audited = this.auditedUuids();
    const done = this.doneUuids();
    return this.chemicals().filter(c =>
      !done.has(c.localUuid) && (!c.localUuid || !audited.has(c.localUuid)));
  });

  dueCount = computed(() => this.due().length);

  groups = computed<Group[]>(() => {
    const items = this.due();
    if (this.groupBy() === 'alpha') {
      const sorted = [...items].sort((a, b) =>
        (a.primaryName || '').toLowerCase().localeCompare((b.primaryName || '').toLowerCase()));
      return [{ label: 'All chemicals', items: sorted }];
    }
    // by location — a chemical appears under each of its locations
    const map = new Map<string, Chemical[]>();
    for (const c of items) {
      const locs = this.locList(c);
      const keys = locs.length ? locs : ['Unspecified'];
      for (const k of keys) {
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      }
    }
    return [...map.keys()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map(label => ({ label, items: map.get(label)!.sort((a, b) =>
        (a.primaryName || '').toLowerCase().localeCompare((b.primaryName || '').toLowerCase())) }));
  });

  ngOnInit(): void {
    const cached = localStorage.getItem('pwa_sds_campaigns');
    if (cached) { try { this.setCampaigns(JSON.parse(cached)); } catch { /* ignore */ } }
    this.serverApi.getSdsCampaigns().subscribe(list => {
      if (list.length) {
        this.setCampaigns(list);
        localStorage.setItem('pwa_sds_campaigns', JSON.stringify(list));
      }
    });
  }

  private setCampaigns(list: string[]): void {
    this.campaigns.set(list);
    if (!this.campaign() && list.length) this.campaign.set(list[0]);
  }

  startAudit(): void {
    this.loading.set(true);
    this.mode.set('list');
    this.doneUuids.set(new Set());
    this.serverApi.getActiveSdsChemicals().subscribe(list => {
      this.chemicals.set((list || []).map(c => ({
        localUuid: c.localUuid || '',
        sharepointId: c.sharepointId || '',
        primaryName: c.primaryName || '',
        names: c.names || '',
        locations: c.locations || '',
        bookNumber: c.bookNumber ?? null,
        sectionNumber: c.sectionNumber ?? null,
        statusName: c.statusName || '',
      })));
    });
    this.serverApi.getSdsAuditedUuids(this.campaign()).subscribe(uuids => {
      this.auditedUuids.set(new Set(uuids || []));
      this.loading.set(false);
    });
  }

  namesList(c: Chemical): string[] { return splitLines(c.names); }
  locList(c: Chemical): string[] { return splitLines(c.locations); }

  toggle(c: Chemical): void {
    this.editing.set(null);
    this.expanded.set(this.expanded() === c.localUuid ? null : c.localUuid);
  }

  startEdit(c: Chemical): void {
    this.editNames = c.names;
    this.editLocations = c.locations;
    this.editComments = '';
    this.editing.set(c.localUuid);
  }

  confirm(c: Chemical): void {
    const user = this.userSetup.getUserData();
    this.submitState.set('submitting');
    this.orchestrator.submitSdsAudit({
      chemicalSharepointId: c.sharepointId,
      chemicalLocalUuid: c.localUuid,
      chemicalName: c.primaryName,
      action: 'Confirmed',
      oldSnapshot: '',
      auditedByName: user?.name || '',
      auditedByEmail: user?.email || '',
      comments: '',
      campaign: this.campaign(),
    }).subscribe({
      next: r => this.afterAudit(c, r.success, r.message),
      error: () => this.afterAudit(c, false, 'Audit failed.')
    });
  }

  saveEdit(c: Chemical): void {
    const user = this.userSetup.getUserData();
    const oldSnapshot = JSON.stringify({
      names: c.names, locations: c.locations, bookNumber: c.bookNumber, sectionNumber: c.sectionNumber,
    });
    this.submitState.set('submitting');

    // 1) update the chemical (server → PA → email)
    this.orchestrator.updateSdsChemical({
      localUuid: c.localUuid,
      sharepointId: c.sharepointId,
      names: this.editNames,
      locations: this.editLocations,
      statusName: c.statusName,
    }).subscribe({
      next: () => {
        // 2) record the audit with the old snapshot
        this.orchestrator.submitSdsAudit({
          chemicalSharepointId: c.sharepointId,
          chemicalLocalUuid: c.localUuid,
          chemicalName: c.primaryName,
          action: 'Edited',
          oldSnapshot,
          auditedByName: user?.name || '',
          auditedByEmail: user?.email || '',
          comments: this.editComments,
          campaign: this.campaign(),
        }).subscribe({
          next: r => this.afterAudit(c, r.success, r.message),
          error: () => this.afterAudit(c, false, 'Audit record failed.')
        });
      },
      error: () => this.afterAudit(c, false, 'Chemical update failed.')
    });
  }

  private afterAudit(c: Chemical, success: boolean, message?: string): void {
    if (success) {
      this.submitState.set('idle');
      this.doneUuids.update(s => new Set(s).add(c.localUuid));
      this.expanded.set(null);
      this.editing.set(null);
    } else {
      this.submitState.set('error');
      this.submitMessage.set(message || 'Failed. Please retry.');
    }
  }
}

function splitLines(text: string | null | undefined): string[] {
  return (text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}
