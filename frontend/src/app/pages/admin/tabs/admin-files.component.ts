import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminFunctionalitiesService,
  BackfillHashesResult,
  FileIntegrityResult,
  FixExtensionsResult
} from '../../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- 1a. File Integrity Check -->
      <div class="admin-section">
        <h3>File Integrity Check</h3>
        <div class="sub-section">
          <p class="description">
            Compares physical files in the uploads folder with database entries.
            Identifies orphaned files (no database entry) and missing files (database entry but no physical file).
          </p>
          <div class="button-group">
            <button (click)="checkFileIntegrity(true)" [disabled]="loading.fileIntegrity">
              {{ loading.fileIntegrity ? 'Checking...' : 'Check (Dry Run)' }}
            </button>
          </div>

          <div class="error" *ngIf="errors.fileIntegrity">{{ errors.fileIntegrity }}</div>

          <div class="result" *ngIf="fileIntegrityResult">
            <div class="result-summary">
              <span class="badge">Files Scanned: {{ fileIntegrityResult.filesScanned }}</span>
              <span class="badge">Entities Checked: {{ fileIntegrityResult.entitiesChecked }}</span>
              <span class="badge warning" *ngIf="fileIntegrityResult.orphanedCount > 0">
                Orphaned Files: {{ fileIntegrityResult.orphanedCount }}
              </span>
              <span class="badge success" *ngIf="fileIntegrityResult.orphanedCount === 0">
                Orphaned Files: 0
              </span>
              <span class="badge warning" *ngIf="fileIntegrityResult.missingCount > 0">
                Missing Files: {{ fileIntegrityResult.missingCount }}
              </span>
              <span class="badge success" *ngIf="fileIntegrityResult.missingCount === 0">
                Missing Files: 0
              </span>
            </div>

            <!-- Orphaned Files -->
            <div class="details-section" *ngIf="fileIntegrityResult.orphanedCount > 0">
              <button class="toggle-btn" (click)="toggleSection('orphanedFiles')">
                {{ expandedSections['orphanedFiles'] ? 'Hide' : 'Show' }} Orphaned Files
              </button>
              <div class="details-list" *ngIf="expandedSections['orphanedFiles']">
                <table>
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th>File Number</th>
                      <th>Type</th>
                      <th>Vendor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let file of fileIntegrityResult.orphanedFiles">
                      <td>{{ file.path }}</td>
                      <td>{{ file.fileNumber }}</td>
                      <td>{{ file.fileType }}</td>
                      <td>{{ file.vendor }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Missing Files -->
            <div class="details-section" *ngIf="fileIntegrityResult.missingCount > 0">
              <button class="toggle-btn" (click)="toggleSection('missingFiles')">
                {{ expandedSections['missingFiles'] ? 'Hide' : 'Show' }} Missing Files
              </button>
              <div class="details-list" *ngIf="expandedSections['missingFiles']">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>File Number</th>
                      <th>Name</th>
                      <th>Expected Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let file of fileIntegrityResult.missingFiles">
                      <td>{{ file.id }}</td>
                      <td>{{ file.fileNumber }}</td>
                      <td>{{ file.name }}</td>
                      <td>{{ file.expectedPath }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="sub-divider">

      <!-- 1b. Fix File Extensions -->
      <div class="admin-section">
        <h3>Fix File Extensions</h3>
        <div class="sub-section">
          <p class="description">
            Scans the filesystem for each FileObject and sets the <code>extensions</code> field
            based on which extension folders actually contain matching files (e.g. pdf, jpg, dwg).
            This fixes file move operations that rely on extensions being set correctly.
          </p>
          <div class="button-group">
            <button (click)="fixFileExtensions(true)" [disabled]="loading.fixExtensions">
              {{ loading.fixExtensions ? 'Scanning...' : 'Preview (Dry Run)' }}
            </button>
            <button (click)="fixFileExtensions(false)" [disabled]="loading.fixExtensions" class="action-btn">
              {{ loading.fixExtensions ? 'Fixing...' : 'Fix Extensions' }}
            </button>
          </div>

          <div class="error" *ngIf="errors.fixExtensions">{{ errors.fixExtensions }}</div>

          <div class="result" *ngIf="fixExtensionsResult">
            <div class="result-summary">
              <span class="badge" [class.info]="fixExtensionsResult.dryRun">
                {{ fixExtensionsResult.dryRun ? 'DRY RUN' : 'EXECUTED' }}
              </span>
              <span class="badge">Checked: {{ fixExtensionsResult.totalChecked }}</span>
              <span class="badge" [class.warning]="fixExtensionsResult.totalFixed > 0"
                                  [class.success]="fixExtensionsResult.totalFixed === 0">
                Need Fix: {{ fixExtensionsResult.totalFixed }}
              </span>
              <span class="badge success">Already Correct: {{ fixExtensionsResult.alreadyCorrect }}</span>
            </div>

            <div class="result-summary" *ngIf="fixExtensionsResult.availableExtensions?.length">
              <span class="badge info">
                Extension Folders: {{ fixExtensionsResult.availableExtensions.join(', ') }}
              </span>
            </div>

            <!-- Fixed Files Details -->
            <div class="details-section" *ngIf="fixExtensionsResult.fixedFiles?.length && fixExtensionsResult.fixedFiles.length > 0">
              <button class="toggle-btn" (click)="toggleSection('fixedFiles')">
                {{ expandedSections['fixedFiles'] ? 'Hide' : 'Show' }} {{ fixExtensionsResult.dryRun ? 'Files to Fix' : 'Fixed Files' }}
                ({{ fixExtensionsResult.fixedFiles.length }})
              </button>
              <div class="details-list" *ngIf="expandedSections['fixedFiles']">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>File Number</th>
                      <th>Name</th>
                      <th>Old Extensions</th>
                      <th>New Extensions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let file of fixExtensionsResult.fixedFiles">
                      <td>{{ file.id }}</td>
                      <td>{{ file.fileNumber }}</td>
                      <td>{{ file.name }}</td>
                      <td>{{ file.oldExtensions }}</td>
                      <td>{{ file.newExtensions }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="sub-divider">

      <!-- 1c. Backfill File Hashes -->
      <div class="admin-section">
        <h3>Backfill File Hashes</h3>
        <div class="sub-section">
          <p class="description">
            Computes <code>fileHash</code> (SHA-256) and <code>perceptualHash</code> (dHash) for
            every FileObject that doesn't have them yet. Hash-based duplicate detection (the
            "Possible duplicate detected" toast) can't match files with null hashes, so legacy
            files need this. Safe to re-run; files that already have hashes are skipped.
          </p>
          <p class="description">
            Tick <strong>Recompute perceptual hash</strong> after a visual-hash algorithm change
            (e.g. aHash → dHash) — it walks <em>every</em> file and overwrites the existing
            perceptual hash. Use this once after the dHash upgrade so old aHash values (mostly
            zeros on P&IDs) get replaced.
          </p>
          <div class="button-group">
            <button (click)="backfillHashes()" [disabled]="loading.backfillHashes" class="action-btn">
              {{ loading.backfillHashes ? 'Hashing files…' : 'Re-hash all files' }}
            </button>
            <label class="limit-input">
              Limit:
              <input type="number" [(ngModel)]="backfillLimit" min="0" placeholder="0 = all"
                     [disabled]="loading.backfillHashes" />
            </label>
            <label class="recompute-toggle">
              <input type="checkbox" [(ngModel)]="recomputePerceptual"
                     [disabled]="loading.backfillHashes" />
              Recompute perceptual hash (force, walks all files)
            </label>
          </div>

          <div class="error" *ngIf="errors.backfillHashes">{{ errors.backfillHashes }}</div>

          <div class="result" *ngIf="backfillHashesResult">
            <div class="result-summary">
              <span class="badge info" *ngIf="backfillHashesResult.running">
                Running… {{ backfillHashesResult.processed }} / {{ backfillHashesResult.total || '?' }}
              </span>
              <span class="badge success" *ngIf="!backfillHashesResult.running && backfillHashesResult.finishedAt > 0">
                Finished
              </span>
              <span class="badge info" *ngIf="backfillHashesResult.recomputePerceptual">
                Mode: recompute perceptual (all files)
              </span>
              <span class="badge">Total to hash: {{ backfillHashesResult.total }}</span>
              <span class="badge">Processed: {{ backfillHashesResult.processed }}</span>
              <span class="badge success">Updated: {{ backfillHashesResult.updated }}</span>
              <span class="badge warning" *ngIf="backfillHashesResult.missingOnDisk > 0">
                Couldn't hash: {{ backfillHashesResult.missingOnDisk }}
              </span>
              <span class="badge warning" *ngIf="backfillHashesResult.errors > 0">
                Errors: {{ backfillHashesResult.errors }}
              </span>
            </div>
            <div class="progress-wrap" *ngIf="backfillHashesResult.total > 0">
              <div class="progress-bar" [style.width.%]="progressPct()"></div>
            </div>

            <!-- Skip-reason breakdown — shows *why* files couldn't be hashed -->
            <div class="skip-breakdown" *ngIf="backfillHashesResult.missingOnDisk > 0">
              <h4>Why files were skipped</h4>
              <div class="skip-grid">
                <div *ngIf="backfillHashesResult.skipFileMissing > 0">
                  <strong>File missing on disk:</strong> {{ backfillHashesResult.skipFileMissing }}
                  <span class="muted">(fileLink points to a path that doesn't exist — orphaned DB record)</span>
                </div>
                <div *ngIf="backfillHashesResult.skipNoExtension > 0">
                  <strong>No extension set:</strong> {{ backfillHashesResult.skipNoExtension }}
                  <span class="muted">(can't build a file path — try Fix Extensions first)</span>
                </div>
                <div *ngIf="backfillHashesResult.skipNoTypeOrVendor > 0">
                  <strong>Missing fileType or vendor:</strong> {{ backfillHashesResult.skipNoTypeOrVendor }}
                  <span class="muted">(assign via bulk edit before re-running)</span>
                </div>
                <div *ngIf="backfillHashesResult.skipNoFileLink > 0">
                  <strong>buildFileLink returned null:</strong> {{ backfillHashesResult.skipNoFileLink }}
                  <span class="muted">(corrupt metadata — needs manual review)</span>
                </div>
                <div *ngIf="backfillHashesResult.skipEntityMissing > 0">
                  <strong>Entity deleted mid-run:</strong> {{ backfillHashesResult.skipEntityMissing }}
                </div>
                <div *ngIf="backfillHashesResult.skipIoError > 0">
                  <strong>IO error:</strong> {{ backfillHashesResult.skipIoError }}
                  <span class="muted">(disk read failure)</span>
                </div>
              </div>
              <div class="sample-skipped" *ngIf="backfillHashesResult.sampleSkipped?.length">
                <strong>Example skipped files:</strong>
                <ul>
                  <li *ngFor="let line of backfillHashesResult.sampleSkipped">{{ line }}</li>
                </ul>
              </div>
            </div>

            <p class="hint" *ngIf="!backfillHashesResult.running && backfillLimit > 0 && backfillHashesResult.processed >= backfillLimit">
              Reached the limit — run again to process the next batch.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .admin-section { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .admin-section h3 { color: #333; margin-top: 0; margin-bottom: 10px; }
    .description { color: #666; font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
    .button-group { display: flex; gap: 10px; margin-bottom: 15px; }
    button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    button:not(.action-btn):not(.toggle-btn) { background-color: #6c757d; color: white; }
    button:not(.action-btn):not(.toggle-btn):hover:not(:disabled) { background-color: #5a6268; }
    .action-btn { background-color: #007bff; color: white; }
    .action-btn:hover:not(:disabled) { background-color: #0056b3; }
    .toggle-btn { background-color: #e9ecef; color: #333; padding: 8px 15px; font-size: 13px; }
    .toggle-btn:hover { background-color: #dee2e6; }
    .error { background-color: #f8d7da; color: #721c24; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px; }
    .result { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px; }
    .result-summary { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 13px; background-color: #e9ecef; color: #333; }
    .badge.success { background-color: #d4edda; color: #155724; }
    .badge.warning { background-color: #fff3cd; color: #856404; }
    .badge.info { background-color: #cce5ff; color: #004085; }
    .details-section { margin-top: 15px; }
    .details-list { margin-top: 10px; max-height: 400px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    table th, table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; }
    table th { background-color: #f1f3f4; font-weight: 600; position: sticky; top: 0; }
    table tr:hover { background-color: #f8f9fa; }
    table td { word-break: break-word; }
    .sub-divider { border: none; border-top: 1px solid #e9ecef; margin: 20px 0; }
    .sub-section { margin-bottom: 10px; }
    code { background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    .limit-input { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; }
    .limit-input input { width: 80px; padding: 6px 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 13px; }
    .recompute-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; cursor: pointer; }
    .recompute-toggle input { cursor: pointer; }
    .hint { font-size: 12px; color: #777; margin-top: 8px; font-style: italic; }
    .progress-wrap { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-bar { height: 100%; background: #007bff; transition: width 0.5s ease; }
    .skip-breakdown { margin-top: 15px; padding: 12px; background: #fff8e6; border-left: 3px solid #f0ad4e; border-radius: 4px; font-size: 13px; color: #6e5713; }
    .skip-breakdown h4 { margin: 0 0 8px 0; font-size: 13px; color: #6e5713; }
    .skip-grid { display: flex; flex-direction: column; gap: 4px; }
    .skip-grid .muted { color: #8a7a4a; font-size: 12px; margin-left: 4px; }
    .sample-skipped { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #d8c89a; }
    .sample-skipped ul { margin: 6px 0 0 18px; padding: 0; font-family: monospace; font-size: 12px; }
    .sample-skipped li { margin: 2px 0; word-break: break-all; }
  `]
})
export class AdminFilesComponent implements OnInit, OnDestroy {
  loading = {
    fileIntegrity: false,
    fixExtensions: false,
    backfillHashes: false
  };

  errors = {
    fileIntegrity: '',
    fixExtensions: '',
    backfillHashes: ''
  };

  fileIntegrityResult: FileIntegrityResult | null = null;
  fixExtensionsResult: FixExtensionsResult | null = null;
  backfillHashesResult: BackfillHashesResult | null = null;
  backfillLimit = 0;
  recomputePerceptual = false;
  private pollTimer: any = null;

  progressPct(): number {
    const r = this.backfillHashesResult;
    if (!r || !r.total) return 0;
    return Math.min(100, Math.round((r.processed / r.total) * 100));
  }

  ngOnInit() {
    // If a backfill was already running when the user navigated here, pick it back up.
    this.adminService.getBackfillHashesStatus().subscribe({
      next: (response) => {
        const state = response.responseData;
        if (state && (state.running || state.finishedAt > 0)) {
          this.backfillHashesResult = state;
          if (state.running) this.startPolling();
        }
      },
      error: () => { /* status is best-effort */ }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.adminService.getBackfillHashesStatus().subscribe({
        next: (response) => {
          this.backfillHashesResult = response.responseData;
          if (!this.backfillHashesResult?.running) {
            this.stopPolling();
            this.loading.backfillHashes = false;
          }
        },
        error: () => {
          this.stopPolling();
          this.loading.backfillHashes = false;
        }
      });
    }, 2000);
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  expandedSections: { [key: string]: boolean } = {
    orphanedFiles: false,
    missingFiles: false,
    fixedFiles: false
  };

  constructor(private adminService: AdminFunctionalitiesService) {}

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  checkFileIntegrity(dryRun: boolean = true) {
    this.loading.fileIntegrity = true;
    this.errors.fileIntegrity = '';
    this.fileIntegrityResult = null;

    this.adminService.restoreFileIntegrity(dryRun).subscribe({
      next: (response) => {
        this.fileIntegrityResult = response.responseData;
        this.loading.fileIntegrity = false;
      },
      error: (error) => {
        this.errors.fileIntegrity = error.error?.message || error.message || 'An error occurred';
        this.loading.fileIntegrity = false;
      }
    });
  }

  backfillHashes() {
    if (this.backfillHashesResult?.running) {
      // Already running — make sure we're polling.
      this.startPolling();
      return;
    }
    const msg = this.recomputePerceptual
      ? 'RECOMPUTE mode: walks EVERY file on disk and replaces the existing perceptual hash. Use after a perceptual algorithm change (aHash → dHash). Runs in the background. Continue?'
      : 'This will read every un-hashed file from disk and compute SHA-256 + perceptual hashes. Runs in the background; you can leave this page and come back. Continue?';
    if (!confirm(msg)) {
      return;
    }

    this.loading.backfillHashes = true;
    this.errors.backfillHashes = '';
    this.backfillHashesResult = null;

    this.adminService.backfillFileHashes(this.backfillLimit || 0, this.recomputePerceptual).subscribe({
      next: (response) => {
        // Backend returned immediately with the initial state — start polling.
        this.backfillHashesResult = response.responseData;
        if (this.backfillHashesResult?.running) {
          this.startPolling();
        } else {
          this.loading.backfillHashes = false;
        }
      },
      error: (error) => {
        this.errors.backfillHashes = error.error?.message || error.message || 'An error occurred';
        this.loading.backfillHashes = false;
      }
    });
  }

  fixFileExtensions(dryRun: boolean = true) {
    if (!dryRun && !confirm('This will update extensions on all FileObjects based on actual files on disk. Continue?')) {
      return;
    }

    this.loading.fixExtensions = true;
    this.errors.fixExtensions = '';
    this.fixExtensionsResult = null;

    this.adminService.fixFileExtensions(dryRun).subscribe({
      next: (response) => {
        this.fixExtensionsResult = response.responseData;
        this.loading.fixExtensions = false;
      },
      error: (error) => {
        this.errors.fixExtensions = error.error?.message || error.message || 'An error occurred';
        this.loading.fixExtensions = false;
      }
    });
  }
}
