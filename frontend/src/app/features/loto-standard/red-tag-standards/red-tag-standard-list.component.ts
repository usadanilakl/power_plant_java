import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RedTagStandardService } from '../../../services/loto/red-tag-standard.service';
import { RedTagStandard } from '../../../models/loto/red-tag-standard.model';
import { GlobalMessageService } from '../../../shared/global-message/global-message.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';

/**
 * Red Tag Standards list — every digitized standard from the external Red
 * Tag system. From here the user opens a standard to reconcile its rows
 * against the LOTO point database and generate a native LotoStandard.
 *
 * The "Import bundled standards" button triggers the manual, idempotent
 * seed import (never auto-run on startup — see the backend service).
 */
@Component({
  selector: 'app-red-tag-standard-list',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout [mainContentPadding]="false">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="rt-list-page">
          <header class="rt-header">
            <div>
              <h2>Red Tag Standards</h2>
              <p class="rt-subtitle">
                LOTO standards digitized from the Red Tag system — reconcile their
                isolation points against the database and generate native standards.
              </p>
            </div>
            <button class="rt-btn rt-btn-primary" data-testid="rt-import-btn"
                    [disabled]="importing()" (click)="onImport()">
              {{ importing() ? 'Importing…' : 'Import bundled standards' }}
            </button>
          </header>

          @if (loading()) {
            <p class="rt-note">Loading…</p>
          } @else if (standards().length === 0) {
            <div class="rt-empty">
              <p>No Red Tag standards yet.</p>
              <p class="rt-note">Click "Import bundled standards" to load the digitized set.</p>
            </div>
          } @else {
            <table class="rt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit</th>
                  <th>Isolation points</th>
                  <th>Generated standard</th>
                </tr>
              </thead>
              <tbody>
                @for (s of standards(); track s.id) {
                  <tr class="rt-row" [attr.data-testid]="'rt-row-' + s.id" (click)="open(s)">
                    <td class="rt-name">{{ s.name }}</td>
                    <td>{{ s.unit || '—' }}</td>
                    <td>{{ s.rows.length }}</td>
                    <td>
                      @if (s.generatedStandardId) {
                        <span class="rt-badge rt-badge-done">✓ #{{ s.generatedStandardId }}</span>
                      } @else {
                        <span class="rt-badge rt-badge-pending">not generated</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .rt-list-page { padding: 20px; max-width: 1100px; margin: 0 auto;
      color: var(--primary-text); background: var(--primary-background); }
    .rt-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .rt-header h2 { margin: 0 0 4px; color: var(--primary-text); }
    .rt-subtitle { color: var(--secondary-text); font-size: 13px; margin: 0; max-width: 620px; }
    .rt-note { color: var(--secondary-text); font-size: 13px; }
    .rt-empty { text-align: center; padding: 48px 0; color: var(--primary-text); }
    .rt-btn { padding: 8px 16px; border-radius: 5px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; }
    .rt-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .rt-btn-primary { background: var(--accent-color); color: #fff; }
    .rt-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .rt-table th { text-align: left; padding: 8px 10px; background: var(--secondary-background);
      color: var(--secondary-text); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color); }
    .rt-table td { padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--primary-text); }
    .rt-row { cursor: pointer; }
    .rt-row:hover { background: var(--hover-color); }
    .rt-name { font-weight: 600; color: var(--primary-text); }
    .rt-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .rt-badge-done { background: #bbf7d0; color: #14532d; }
    .rt-badge-pending { background: #e5e7eb; color: #6b7280; }
  `],
})
export class RedTagStandardListComponent implements OnInit {
  private service = inject(RedTagStandardService);
  private router = inject(Router);
  private messages = inject(GlobalMessageService);

  standards = signal<RedTagStandard[]>([]);
  loading = signal(true);
  importing = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: res => {
        this.standards.set(res.responseData ?? []);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.messages.showError('Failed to load Red Tag standards: ' + (err?.error?.message || err?.message));
      },
    });
  }

  onImport(): void {
    this.importing.set(true);
    this.service.importSeed().subscribe({
      next: res => {
        this.importing.set(false);
        const r = res.responseData;
        this.messages.showSuccess(
          `Imported ${r?.created ?? 0} new standard(s), skipped ${r?.skipped ?? 0} existing.`);
        this.reload();
      },
      error: err => {
        this.importing.set(false);
        this.messages.showError('Import failed: ' + (err?.error?.message || err?.message));
      },
    });
  }

  open(s: RedTagStandard): void {
    this.router.navigate(['/red-tag-standards', s.id]);
  }
}
