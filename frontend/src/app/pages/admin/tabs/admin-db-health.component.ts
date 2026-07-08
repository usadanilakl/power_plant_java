import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDbHealthService, DbHealth } from '../../../services/admin/admin-db-health.service';

@Component({
  selector: 'app-admin-db-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <div class="admin-section">
        <div class="section-head">
          <h3>Database Health</h3>
          <button (click)="load()" [disabled]="loading">{{ loading ? 'Loading...' : 'Refresh' }}</button>
        </div>
        <p class="description">
          Read-only snapshot of the H2 database. To reclaim dead space, stop the app and run
          <code>scripts/database/compact-database.bat</code>.
        </p>

        <div class="error" *ngIf="error">{{ error }}</div>
        <div class="note" *ngIf="stats?.note">{{ stats?.note }}</div>

        <ng-container *ngIf="stats && !error">
          <div class="banner" *ngIf="stats.compactRecommended">
            ⚠ {{ stats.deadSpacePercent }}% of the file is dead space - compaction recommended.
          </div>

          <div class="cards">
            <div class="card">
              <div class="card-label">File size</div>
              <div class="card-value">{{ fmt(stats.fileSizeBytes) }}</div>
            </div>
            <div class="card">
              <div class="card-label">Real data (logical)</div>
              <div class="card-value">{{ fmt(stats.logicalBytes) }}</div>
            </div>
            <div class="card" [class.warn]="stats.compactRecommended">
              <div class="card-label">Dead space</div>
              <div class="card-value">{{ fmt(stats.deadSpaceBytes) }} ({{ stats.deadSpacePercent }}%)</div>
            </div>
            <div class="card">
              <div class="card-label">Trace file</div>
              <div class="card-value">{{ fmt(stats.traceSizeBytes) }}</div>
            </div>
          </div>

          <div class="bar" title="dead space vs real data">
            <div class="bar-used" [style.width.%]="usedPercent()"></div>
          </div>
          <div class="bar-legend">
            <span><i class="sw used"></i> Real data {{ usedPercent() }}%</span>
            <span><i class="sw dead"></i> Dead space {{ stats.deadSpacePercent }}%</span>
          </div>

          <div class="warn-row" *ngIf="stats.auditTables?.length">
            ⚠ Leftover Envers audit tables present:
            <span *ngFor="let t of stats.auditTables">{{ t.name }} ({{ fmt(t.bytes) }})&nbsp;</span>
            - run <code>drop-audit-tables.bat</code>.
          </div>

          <div class="grid">
            <div>
              <h4>Biggest tables</h4>
              <table class="stat-table">
                <thead><tr><th>Table</th><th class="num">Size</th></tr></thead>
                <tbody>
                  <tr *ngFor="let t of stats.tables">
                    <td>{{ t.name }}</td>
                    <td class="num">{{ fmt(t.bytes) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4>Attachments</h4>
              <table class="stat-table" *ngIf="stats.attachments as a">
                <tbody>
                  <tr><td>Rows</td><td class="num">{{ a.rowCount }}</td></tr>
                  <tr><td>Distinct files (by hash)</td><td class="num">{{ a.distinctHashes }}</td></tr>
                  <tr [class.warn-cell]="duplicateCount() > 0">
                    <td>Duplicate copies</td><td class="num">{{ duplicateCount() }}</td>
                  </tr>
                  <tr><td>Rows without hash</td><td class="num">{{ a.nullHashCount }}</td></tr>
                  <tr><td>Total content</td><td class="num">{{ fmt(a.totalBytes) }}</td></tr>
                </tbody>
              </table>

              <h4>FieldChange (last 14 days) - total {{ stats.fieldChangeTotal }}</h4>
              <table class="stat-table">
                <thead><tr><th>Day</th><th class="num">Changes</th></tr></thead>
                <tbody>
                  <tr *ngFor="let d of stats.fieldChangeByDay">
                    <td>{{ d.day }}</td><td class="num">{{ d.count }}</td>
                  </tr>
                  <tr *ngIf="!stats.fieldChangeByDay?.length"><td colspan="2">No recent changes.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .admin-section { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; }
    .section-head { display: flex; align-items: center; justify-content: space-between; }
    .section-head h3 { margin: 0; color: #333; }
    .section-head button { padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: #fff; cursor: pointer; }
    .section-head button:disabled { opacity: .6; cursor: default; }
    .description { color: #666; font-size: 13px; }
    code { background: #f2f2f2; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
    .error { color: #b00020; padding: 8px 0; }
    .note { color: #8a6d00; background: #fff8e1; padding: 8px 12px; border-radius: 4px; margin: 8px 0; }
    .banner { background: #fdecea; color: #b00020; border: 1px solid #f5c6cb; border-radius: 4px; padding: 10px 12px; margin: 12px 0; font-weight: 600; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
    .card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 14px; }
    .card.warn { background: #fdecea; border-color: #f5c6cb; }
    .card-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: .03em; }
    .card-value { font-size: 20px; font-weight: 700; color: #222; margin-top: 4px; }
    .bar { height: 16px; border-radius: 8px; background: #e74c3c; overflow: hidden; margin-top: 8px; }
    .bar-used { height: 100%; background: #2ecc71; }
    .bar-legend { display: flex; gap: 18px; font-size: 12px; color: #555; margin: 6px 0 4px; }
    .sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; }
    .sw.used { background: #2ecc71; } .sw.dead { background: #e74c3c; }
    .warn-row { background: #fff8e1; color: #8a6d00; border-radius: 4px; padding: 8px 12px; margin: 12px 0; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    h4 { margin: 14px 0 6px; color: #333; }
    .stat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .stat-table th, .stat-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
    .stat-table th.num, .stat-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .warn-cell td, tr.warn-cell td { color: #b00020; font-weight: 600; }
  `]
})
export class AdminDbHealthComponent implements OnInit {
  private api = inject(AdminDbHealthService);

  stats: DbHealth | null = null;
  loading = false;
  error = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getStats().subscribe({
      next: (res) => { this.stats = res.responseData; this.loading = false; },
      error: (e) => { this.error = e?.error?.message || e?.message || 'Failed to load DB health'; this.loading = false; }
    });
  }

  usedPercent(): number {
    if (!this.stats || this.stats.fileSizeBytes <= 0) return 0;
    return Math.round((this.stats.logicalBytes * 100 / this.stats.fileSizeBytes) * 10) / 10;
  }

  duplicateCount(): number {
    const a = this.stats?.attachments;
    if (!a) return 0;
    return Math.max(0, a.rowCount - a.distinctHashes - a.nullHashCount);
  }

  fmt(bytes: number): string {
    if (bytes == null) return '-';
    if (bytes < 1024) return bytes + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let v = bytes / 1024, i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return v.toFixed(v >= 100 ? 0 : 1) + ' ' + units[i];
  }
}
