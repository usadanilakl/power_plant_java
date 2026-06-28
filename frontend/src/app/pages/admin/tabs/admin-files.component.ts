import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminFunctionalitiesService,
  BackfillHashesResult,
  ConnectorMigrationReportDto,
  ConnectorResyncResultDto,
  FileIntegrityResult,
  FixExtensionsResult,
  SystemsTagsMigrationResult
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

      <!-- 1d. Migrate relatedSystems → tags -->
      <div class="admin-section">
        <h3>Migrate <code>relatedSystems</code> → Systems &amp; Tags</h3>
        <div class="sub-section">
          <p class="description">
            Converts the legacy <code>relatedSystems</code> CSV-of-names into the new
            &#64;ManyToMany collections. For each parsed name: if it matches an existing
            <strong>System</strong> Value (case-insensitive) it goes to the file's <code>systems</code>;
            otherwise it goes to <code>tags</code> (Tag category auto-created on first run, Tag
            Values created if missing). <strong>No new System Values are ever created.</strong>
            The primary <code>system</code> FK is NOT auto-seeded into the new collection.
            Brackets stripped, entries trimmed, deduped case-insensitively. <strong>Run
            <em>Dry Run</em> first</strong> to preview classification; run on the hub so Tag
            Values are minted there and sync to desktops. Idempotent — safe to re-run.
          </p>
          <div class="button-group">
            <button (click)="migrateSystemsTags(true)" [disabled]="loading.migrate" class="toggle-btn">
              {{ loading.migrate ? 'Working…' : 'Dry Run' }}
            </button>
            <button (click)="migrateSystemsTags(false)" [disabled]="loading.migrate" class="action-btn">
              {{ loading.migrate ? 'Migrating…' : 'Run Migration' }}
            </button>
          </div>

          <div class="error" *ngIf="errors.migrate">{{ errors.migrate }}</div>

          <div class="result" *ngIf="migrateResult">
            <div class="result-summary">
              <span class="badge" [class.info]="migrateResult.dryRun" [class.success]="!migrateResult.dryRun">
                {{ migrateResult.dryRun ? 'Dry run' : 'Applied' }}
              </span>
              <span class="badge">Files scanned: {{ migrateResult.filesScanned }}</span>
              <span class="badge success" *ngIf="!migrateResult.dryRun">Files updated: {{ migrateResult.filesUpdated }}</span>
              <span class="badge">Unique CSV names: {{ migrateResult.uniqueCsvNames }}</span>
              <span class="badge success" *ngIf="!migrateResult.dryRun">Tag assignments: {{ migrateResult.tagsAssigned }}</span>
              <span class="badge success" *ngIf="!migrateResult.dryRun">System assignments: {{ migrateResult.systemsAssigned }}</span>
              <span class="badge warning" *ngIf="migrateResult.errors > 0">Errors: {{ migrateResult.errors }}</span>
            </div>

            <!-- Per-category name lists (mainly useful for dry-run preview) -->
            <div class="name-list" *ngIf="migrateResult.systemsReusedNames?.length">
              <h4>
                Systems to assign (existing System Values — reused, NOT created):
                <span class="count">{{ migrateResult.systemsReusedNames.length }}</span>
              </h4>
              <ul>
                <li *ngFor="let n of migrateResult.systemsReusedNames">{{ n }}</li>
              </ul>
            </div>

            <div class="name-list" *ngIf="migrateResult.tagsToCreateNames?.length">
              <h4>
                Tags to create (no existing Value matches these names):
                <span class="count">{{ migrateResult.tagsToCreateNames.length }}</span>
              </h4>
              <ul>
                <li *ngFor="let n of migrateResult.tagsToCreateNames">{{ n }}</li>
              </ul>
            </div>

            <div class="name-list" *ngIf="migrateResult.tagsExistingNames?.length">
              <h4>
                Tags to reuse (matched existing Tag Values):
                <span class="count">{{ migrateResult.tagsExistingNames.length }}</span>
              </h4>
              <ul>
                <li *ngFor="let n of migrateResult.tagsExistingNames">{{ n }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 1e. Migrate connector Equipment → FileConnector entity -->
      <div class="admin-section">
        <h3>Migrate Connector Equipment → <code>FileConnector</code></h3>
        <div class="sub-section">
          <p class="description">
            Walks every <strong>Equipment</strong> with <code>eqType.name='connector'</code>
            (off-page references — those arrows pointing to other P&amp;ID files) and converts
            each to the new <code>FileConnector</code> entity. Five safety gates:
            (1) tagNumber length ≥ <em>min tag length</em>, (2) no attached lotoPoints/files,
            (3) source file present, (4) exactly one FileObject matches the tag as a substring of
            its fileNumber, (5) not already migrated. Skipped rows stay as Equipment and are
            listed in the report for manual review. A second pass auto-pairs connectors that
            point at each other ONLY when exactly 1:1 — N↔M cases are reported as
            "unpaired (multiple candidates)" for manual pairing via the link-counterpart endpoint.
            <strong>Idempotent</strong> — safe to re-run. <strong>Run <em>Dry Run</em> first</strong>
            to preview impact (counts include would-be pairings).
          </p>

          <div class="param-row">
            <label>
              Min tag length:
              <input
                type="number"
                min="3"
                max="20"
                [(ngModel)]="connectorMinTagLength"
                [disabled]="loading.migrateConnectors"
                class="param-input"
                title="Tag-length floor for the substring-match gate. Below this length the match is too generic (e.g. 'PD-03' could match many files) so rows are skipped to manual review. Clamped to ≥3."/>
            </label>
          </div>

          <div class="button-group">
            <button
              (click)="migrateConnectorsFromEquipment(true)"
              [disabled]="loading.migrateConnectors"
              class="toggle-btn">
              {{ loading.migrateConnectors ? 'Working…' : 'Dry Run' }}
            </button>
            <button
              (click)="migrateConnectorsFromEquipment(false)"
              [disabled]="loading.migrateConnectors"
              class="action-btn">
              {{ loading.migrateConnectors ? 'Migrating…' : 'Run Migration' }}
            </button>
          </div>

          <div class="error" *ngIf="errors.migrateConnectors">{{ errors.migrateConnectors }}</div>

          <div class="result" *ngIf="migrateConnectorsResult">
            <div class="result-summary">
              <span class="badge"
                    [class.info]="migrateConnectorsResult.dryRun"
                    [class.success]="!migrateConnectorsResult.dryRun">
                {{ migrateConnectorsResult.dryRun ? 'Dry run' : 'Applied' }}
              </span>
              <span class="badge">Connector Equipment scanned: {{ migrateConnectorsResult.totalConnectorEquipment }}</span>
              <span class="badge success">
                {{ migrateConnectorsResult.dryRun ? 'Would migrate' : 'Migrated' }}:
                {{ migrateConnectorsResult.migrated }}
              </span>
              <span class="badge success">
                {{ migrateConnectorsResult.dryRun ? 'Would pair' : 'Paired' }}:
                {{ migrateConnectorsResult.paired }}
              </span>
              <span class="badge warning" *ngIf="migrateConnectorsResult.unpairedMultipleCandidates > 0">
                Unpaired (ambiguous pairs): {{ migrateConnectorsResult.unpairedMultipleCandidates }}
              </span>
            </div>

            <!-- Skip breakdown — each bucket links back to the gate that fired. -->
            <h4 *ngIf="migrateConnectorsResult.skippedShortTag
                      + migrateConnectorsResult.skippedHasData
                      + migrateConnectorsResult.skippedNoSourceFile
                      + migrateConnectorsResult.skippedNoMatch
                      + migrateConnectorsResult.skippedAmbiguous
                      + migrateConnectorsResult.skippedAlreadyMigrated > 0">
              Skipped breakdown
            </h4>
            <div class="result-summary">
              <span class="badge warning" *ngIf="migrateConnectorsResult.skippedShortTag > 0">
                Short tag: {{ migrateConnectorsResult.skippedShortTag }}
              </span>
              <span class="badge warning" *ngIf="migrateConnectorsResult.skippedHasData > 0">
                Has attached data: {{ migrateConnectorsResult.skippedHasData }}
              </span>
              <span class="badge warning" *ngIf="migrateConnectorsResult.skippedNoSourceFile > 0">
                No source file: {{ migrateConnectorsResult.skippedNoSourceFile }}
              </span>
              <span class="badge warning" *ngIf="migrateConnectorsResult.skippedNoMatch > 0">
                No file match: {{ migrateConnectorsResult.skippedNoMatch }}
              </span>
              <span class="badge warning" *ngIf="migrateConnectorsResult.skippedAmbiguous > 0">
                Ambiguous (multiple file matches): {{ migrateConnectorsResult.skippedAmbiguous }}
              </span>
              <span class="badge" *ngIf="migrateConnectorsResult.skippedAlreadyMigrated > 0">
                Already migrated: {{ migrateConnectorsResult.skippedAlreadyMigrated }}
              </span>
            </div>

            <!-- Per-item audit — collapsed by default since it can be long. -->
            <div class="name-list" *ngIf="migrateConnectorsResult.items?.length">
              <h4>
                <button class="toggle-btn" (click)="migrateConnectorsShowItems = !migrateConnectorsShowItems">
                  {{ migrateConnectorsShowItems ? 'Hide' : 'Show' }} per-item audit log
                </button>
                <span class="count">{{ migrateConnectorsResult.items.length }}</span>
              </h4>
              <ul *ngIf="migrateConnectorsShowItems" class="audit-list">
                <li *ngFor="let item of migrateConnectorsResult.items">
                  <span class="badge"
                        [class.success]="item.action === 'MIGRATED' || item.action === 'DRY_RUN'"
                        [class.warning]="item.action !== 'MIGRATED' && item.action !== 'DRY_RUN' && item.action !== 'SKIP_ALREADY_MIGRATED'">
                    {{ item.action }}
                  </span>
                  <code>Eq #{{ item.equipmentId }}</code>
                  <span *ngIf="item.tagNumber">tag=<code>{{ item.tagNumber }}</code></span>
                  <span *ngIf="item.newConnectorId">→ Connector #{{ item.newConnectorId }}</span>
                  <span class="note">{{ item.note }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Recovery action: re-emit creation events for existing connectors.
               Separate from the migration buttons because it doesn't read/write
               Equipment; it walks FileConnectors and re-fires the sync listener
               for each one. Use when client state diverged from hub state. -->
          <div class="sub-action">
            <h4>Re-sync connectors to clients</h4>
            <p class="description">
              Re-emits creation events for every existing <code>FileConnector</code> so clients
              that missed the original migration broadcast (e.g. because their sync token had
              advanced past those events while the sync registry didn't yet know the entity type)
              pick them up on next pull. <strong>Safe to re-run</strong> — apply path is
              upsert-by-id so duplicates are deduped client-side.
            </p>
            <div class="button-group">
              <button
                (click)="resyncConnectorsToClients()"
                [disabled]="loading.resyncConnectors"
                class="action-btn">
                {{ loading.resyncConnectors ? 'Re-emitting…' : 'Re-sync to Clients' }}
              </button>
            </div>
            <div class="error" *ngIf="errors.resyncConnectors">{{ errors.resyncConnectors }}</div>
            <div class="result" *ngIf="resyncConnectorsResult">
              <div class="result-summary">
                <span class="badge success">Re-emitted: {{ resyncConnectorsResult.emitted }}</span>
                <span class="badge">Scanned: {{ resyncConnectorsResult.totalScanned }}</span>
                <span class="badge warning" *ngIf="resyncConnectorsResult.failed > 0">
                  Failed: {{ resyncConnectorsResult.failed }}
                </span>
              </div>
            </div>
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
    .name-list { margin-top: 14px; padding: 10px 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; }
    .name-list h4 { margin: 0 0 6px 0; font-size: 13px; color: #444; }
    .name-list h4 .count { margin-left: 6px; padding: 1px 8px; border-radius: 10px; background: #e9ecef; color: #666; font-size: 11px; font-weight: 500; }
    .name-list ul { margin: 0; padding-left: 18px; max-height: 220px; overflow-y: auto; font-size: 12px; color: #333; font-family: monospace; }
    .name-list li { padding: 1px 0; }
    /* Sub-action block inside an admin section — used for the connector
       re-sync recovery action so it visually sits as a follow-up to the main
       migration controls without being a whole new section. */
    .sub-action { margin-top: 18px; padding-top: 14px; border-top: 1px dashed #d0d0d0; }
    .sub-action h4 { margin: 0 0 8px 0; font-size: 14px; color: #333; }
    /* Connector migration: numeric input for the min-tag-length parameter. */
    .param-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; color: #555; }
    .param-row label { display: inline-flex; align-items: center; gap: 8px; }
    .param-input { width: 64px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; text-align: right; }
    /* Per-item audit log — denser layout than the default name-list since
       each row has multiple inline elements (badge + id + tag + note). */
    .audit-list { list-style: none; padding-left: 0; max-height: 360px; font-family: inherit; font-size: 12px; }
    .audit-list li { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 4px; border-bottom: 1px solid #f0f0f0; }
    .audit-list li:last-child { border-bottom: 0; }
    .audit-list li .note { color: #666; font-size: 11px; flex: 1 1 100%; padding-left: 4px; }
    .audit-list code { background: #f4f4f4; padding: 1px 6px; border-radius: 3px; font-size: 11px; }
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
    backfillHashes: false,
    migrate: false,
    migrateConnectors: false,
    resyncConnectors: false
  };

  errors = {
    fileIntegrity: '',
    fixExtensions: '',
    backfillHashes: '',
    migrate: '',
    migrateConnectors: '',
    resyncConnectors: ''
  };

  migrateResult: SystemsTagsMigrationResult | null = null;
  migrateConnectorsResult: ConnectorMigrationReportDto | null = null;
  resyncConnectorsResult: ConnectorResyncResultDto | null = null;
  /** Per-Equipment audit log expanded/collapsed in the result panel. */
  migrateConnectorsShowItems = false;
  /** Configurable tag-length floor for the connector migration's auto-match gate. */
  connectorMinTagLength = 5;

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

  migrateSystemsTags(dryRun: boolean): void {
    if (this.loading.migrate) return;
    if (!dryRun && !confirm(
        'Apply migration: parse every FileObject\'s relatedSystems CSV. Names matching an ' +
        'existing System Value are added to the file\'s systems; everything else becomes a Tag ' +
        '(Tag values created if missing). No new System Values are created. The primary system FK ' +
        'is not auto-seeded. Run on the HUB so Tag values mint there and sync to desktops. Continue?')) {
      return;
    }
    this.loading.migrate = true;
    this.errors.migrate = '';
    this.migrateResult = null;
    this.adminService.migrateSystemsAndTags(dryRun).subscribe({
      next: (response) => {
        this.migrateResult = response.responseData;
        this.loading.migrate = false;
      },
      error: (error) => {
        this.errors.migrate = error.error?.message || error.message || 'Migration failed';
        this.loading.migrate = false;
      }
    });
  }

  /**
   * Convert legacy Equipment rows with eqType.name='connector' to first-class
   * FileConnector entities, then auto-pair connectors that point at each other
   * (1:1 only). Idempotent — safe to re-run. Equipment rows that fail one of
   * the safety gates (tag too short, attached data, no source file, no/many
   * candidate files) are left as Equipment and listed in the per-item audit
   * log for manual review.
   */
  /**
   * Recovery action: re-emits creation events for every existing FileConnector
   * so clients that missed the original migration's sync events pick them up.
   * Use after fixing the sync registry or any time client-side state diverged
   * from hub-side state for connectors. Safe to re-run.
   */
  resyncConnectorsToClients(): void {
    if (this.loading.resyncConnectors) return;
    if (!confirm(
        'Re-emit creation events for every FileConnector on the hub. Clients with a sync ' +
        'token past the original migration timestamp will receive these as fresh creation ' +
        'events on their next pull and apply them through the now-registered FileConnector ' +
        'service. Safe to re-run — apply path is upsert-by-id. Continue?')) {
      return;
    }
    this.loading.resyncConnectors = true;
    this.errors.resyncConnectors = '';
    this.resyncConnectorsResult = null;
    this.adminService.resyncConnectorsToClients().subscribe({
      next: (response) => {
        this.resyncConnectorsResult = response.responseData;
        this.loading.resyncConnectors = false;
      },
      error: (error) => {
        this.errors.resyncConnectors = error.error?.message || error.message || 'Re-sync failed';
        this.loading.resyncConnectors = false;
      }
    });
  }

  migrateConnectorsFromEquipment(dryRun: boolean): void {
    if (this.loading.migrateConnectors) return;
    if (!dryRun && !confirm(
        'Apply connector migration: walks every Equipment with eqType.name=\'connector\' and ' +
        'converts each to a FileConnector when 5 safety gates pass (tag-length floor, no ' +
        'attached lotoPoints/files, source file present, exactly one matching target file, ' +
        'not already migrated). Skipped rows stay as Equipment and show in the report. ' +
        'A second pass pairs connectors that point at each other ONLY when exactly 1:1 ' +
        '(multi-on-either-side cases need manual pairing). Continue?')) {
      return;
    }
    this.loading.migrateConnectors = true;
    this.errors.migrateConnectors = '';
    this.migrateConnectorsResult = null;
    const minTag = Math.max(3, Number(this.connectorMinTagLength) || 5);
    this.adminService.migrateConnectorsFromEquipment(dryRun, minTag).subscribe({
      next: (response) => {
        this.migrateConnectorsResult = response.responseData;
        this.loading.migrateConnectors = false;
      },
      error: (error) => {
        this.errors.migrateConnectors = error.error?.message || error.message || 'Connector migration failed';
        this.loading.migrateConnectors = false;
      }
    });
  }
}
