import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AdminClientsService, ClientView } from '../../../services/admin/admin-clients.service';

const ACTIONS = ['jar', 'db', 'files', 'electron'] as const;

/**
 * Hub-admin Clients control panel: see connected desktops, set what each updates on its NEXT boot
 * (jar / db / files / electron), and issue IMMEDIATE shutdown / restart to a running client.
 */
@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clients">
      <div class="bar">
        <div class="title">Connected clients <span class="count">{{ clients().length }}</span></div>
        <button class="btn ghost" (click)="load()" [disabled]="loading()">↻ Refresh</button>
      </div>
      @if (note()) { <div class="note">{{ note() }}</div> }

      <div class="scroll">
        <table>
          <thead>
            <tr><th>Machine</th><th>Status</th><th>Last seen</th><th>Next-boot directive</th><th>Command</th></tr>
          </thead>
          <tbody>
            @for (c of clients(); track c.machineId) {
              <tr [class.sel]="selected()?.machineId === c.machineId" (click)="select(c)">
                <td>
                  <div class="mid">{{ c.machineName || c.machineId }}</div>
                  <div class="sub">{{ c.machineId }}<span *ngIf="c.deviceNumber != null"> · dev {{ c.deviceNumber }}</span></div>
                </td>
                <td><span class="dot" [class.on]="c.status === 'ONLINE'" [class.sync]="c.status === 'SYNCING'"></span>{{ c.status || '—' }}</td>
                <td class="mono">{{ ago(c.lastSeen) }}</td>
                <td>
                  @if (c.directiveActions) {
                    <span class="tag" [class.pending]="c.directivePending">{{ c.directiveActions }}</span>
                    <span class="applied" *ngIf="!c.directivePending"> ✓ applied</span>
                  } @else { <span class="dash">—</span> }
                </td>
                <td>
                  @if (c.commandPending) { <span class="tag cmd">{{ c.pendingCommand }} pending</span> }
                  @else { <span class="dash">—</span> }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">No clients registered on the hub.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (selected(); as c) {
        <div class="detail">
          <div class="dhead">{{ c.machineName || c.machineId }} <span class="sub">{{ c.machineId }}</span></div>

          <div class="panel">
            <div class="ptitle">Next-boot update directive</div>
            <div class="actions-row">
              @for (a of allActions; track a) {
                <label class="chk"><input type="checkbox" [checked]="dirActions().has(a)" (change)="toggle(a)" /> {{ a }}</label>
              }
              <label class="chk"><input type="checkbox" [(ngModel)]="mandatory" /> mandatory</label>
            </div>
            <input class="msg" type="text" placeholder="Message shown to the user (optional)" [(ngModel)]="message" />
            <div class="btns">
              <button class="btn primary" (click)="setDirective()" [disabled]="busy() || dirActions().size === 0">Set directive</button>
              <button class="btn" (click)="clearDirective()" [disabled]="busy() || !c.directiveActions">Clear</button>
            </div>
            <div class="hint">Applied by the client on its next boot, once, in order (electron → jar → db → files).</div>
          </div>

          <div class="panel danger">
            <div class="ptitle">Immediate command <span class="warn">(acts on the running client now)</span></div>
            <div class="btns">
              <button class="btn stop" (click)="command('SHUTDOWN')" [disabled]="busy()">Stop now</button>
              <button class="btn restart" (click)="command('RESTART')" [disabled]="busy()">Restart now</button>
              <button class="btn" (click)="clearCommand()" [disabled]="busy() || !c.commandPending">Cancel pending</button>
            </div>
            @if (c.commandPending) {
              <div class="hint">A <b>{{ c.pendingCommand }}</b> is queued and will run next time this client polls (~30s).</div>
            }
          </div>
        </div>
      } @else {
        <div class="pick">Select a client to manage its updates and issue commands.</div>
      }
    </div>
  `,
  styles: [`
    .clients { padding: 18px; max-width: 1100px; margin: 0 auto; color: #222; }
    .bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .title { font-weight: 600; font-size: 16px; }
    .count { background: #eef1f6; border-radius: 10px; padding: 0 8px; font-size: 13px; margin-left: 4px; }
    .btn { border: 1px solid #cfd6dd; background: #fff; border-radius: 7px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
    .btn:hover:not(:disabled) { background: #f4f7fa; }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn.primary { border-color: #2874a6; color: #1f618d; }
    .btn.stop { border-color: #c0392b; color: #a93226; }
    .btn.restart { border-color: #b9770e; color: #9a6212; }
    .btn.ghost { color: #555; }
    .note { background: #eef6ff; border: 1px solid #bcdcff; color: #1c5a99; border-radius: 7px; padding: 7px 12px; font-size: 13px; margin-bottom: 10px; }
    .scroll { overflow-x: auto; border: 1px solid #e2e7ec; border-radius: 10px; }
    table { border-collapse: collapse; width: 100%; min-width: 720px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef1f4; font-size: 13px; vertical-align: top; }
    thead th { background: #f6f8fa; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #7a8794; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: #f8fafc; }
    tbody tr.sel { background: #eaf2fb; }
    .mid { font-weight: 600; }
    .sub { color: #7c86a0; font-size: 12px; }
    .mono { font-family: monospace; font-size: 12px; color: #55607a; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #b6bdc9; margin-right: 6px; }
    .dot.on { background: #1f9d57; } .dot.sync { background: #d98a1a; }
    .tag { display: inline-block; background: #eef1f6; border: 1px solid #dbe1ea; border-radius: 6px; padding: 1px 7px; font-family: monospace; font-size: 12px; }
    .tag.pending { background: #fbf1dd; border-color: #e6cd97; color: #a46b12; }
    .tag.cmd { background: #fbe6e3; border-color: #eeb3ab; color: #bd3a30; }
    .applied { color: #147a4c; font-size: 12px; }
    .dash { color: #9aa7b2; }
    .empty { text-align: center; color: #7c86a0; padding: 20px; }
    .detail { margin-top: 16px; border: 1px solid #e2e7ec; border-radius: 12px; padding: 14px 16px; background: #fff; }
    .dhead { font-weight: 600; margin-bottom: 12px; }
    .panel { border: 1px solid #eef1f4; border-radius: 9px; padding: 12px; margin-bottom: 10px; }
    .panel.danger { border-color: #f0c9c3; background: #fdf4f3; }
    .ptitle { font-weight: 600; font-size: 13px; margin-bottom: 8px; }
    .warn { color: #bd3a30; font-weight: 400; font-size: 12px; }
    .actions-row { display: flex; flex-wrap: wrap; gap: 12px 16px; margin-bottom: 10px; }
    .chk { display: flex; align-items: center; gap: 5px; font-size: 13px; cursor: pointer; }
    .msg { width: 100%; box-sizing: border-box; border: 1px solid #cfd6dd; border-radius: 7px; padding: 7px 10px; font-size: 13px; margin-bottom: 10px; }
    .btns { display: flex; gap: 8px; flex-wrap: wrap; }
    .hint { color: #7c86a0; font-size: 12px; margin-top: 8px; }
    .pick { margin-top: 16px; color: #7c86a0; text-align: center; padding: 24px; border: 1px dashed #d5dbe1; border-radius: 10px; }
  `],
})
export class AdminClientsComponent {
  private api = inject(AdminClientsService);
  private destroyRef = inject(DestroyRef);

  readonly allActions = ACTIONS;
  readonly clients = signal<ClientView[]>([]);
  readonly selected = signal<ClientView | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly note = signal('');

  // directive editor state (for the selected client)
  readonly dirActions = signal<Set<string>>(new Set());
  mandatory = false;
  message = '';

  constructor() {
    this.load();
    // Light auto-refresh so status + "command applied" updates show without manual reload.
    interval(10_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(true));
  }

  load(quiet = false): void {
    if (!quiet) this.loading.set(true);
    this.api.list().subscribe(list => {
      this.clients.set(list);
      this.loading.set(false);
      // keep the selected client's data fresh
      const sel = this.selected();
      if (sel) {
        const fresh = list.find(c => c.machineId === sel.machineId);
        if (fresh) this.selected.set(fresh);
      }
    });
  }

  select(c: ClientView): void {
    this.selected.set(c);
    this.dirActions.set(new Set((c.directiveActions ?? '').split(',').map(s => s.trim()).filter(Boolean)));
    this.mandatory = !!c.directiveMandatory;
    this.message = c.directiveMessage ?? '';
    this.note.set('');
  }

  toggle(a: string): void {
    this.dirActions.update(set => {
      const n = new Set(set);
      n.has(a) ? n.delete(a) : n.add(a);
      return n;
    });
  }

  setDirective(): void {
    const c = this.selected(); if (!c) return;
    this.busy.set(true);
    this.api.setDirective(c.machineId, [...this.dirActions()], this.mandatory, this.message).subscribe(r => {
      this.busy.set(false); this.note.set(r.message); this.load(true);
    });
  }

  clearDirective(): void {
    const c = this.selected(); if (!c) return;
    this.busy.set(true);
    this.api.clearDirective(c.machineId).subscribe(r => {
      this.busy.set(false); this.note.set(r.message); this.dirActions.set(new Set()); this.mandatory = false; this.message = ''; this.load(true);
    });
  }

  command(cmd: 'SHUTDOWN' | 'RESTART'): void {
    const c = this.selected(); if (!c) return;
    const verb = cmd === 'SHUTDOWN' ? 'STOP' : 'RESTART';
    if (!confirm(`${verb} the running client "${c.machineName || c.machineId}" now?`)) return;
    this.busy.set(true);
    this.api.issueCommand(c.machineId, cmd).subscribe(r => {
      this.busy.set(false); this.note.set(r.message); this.load(true);
    });
  }

  clearCommand(): void {
    const c = this.selected(); if (!c) return;
    this.busy.set(true);
    this.api.clearCommand(c.machineId).subscribe(r => {
      this.busy.set(false); this.note.set(r.message); this.load(true);
    });
  }

  /** ISO timestamp → short "x ago". */
  ago(iso?: string): string {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '—';
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
}
