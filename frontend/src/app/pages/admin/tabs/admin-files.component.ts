import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminFunctionalitiesService,
  FileIntegrityResult,
  FixExtensionsResult
} from '../../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-files',
  standalone: true,
  imports: [CommonModule],
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
  `]
})
export class AdminFilesComponent {
  loading = {
    fileIntegrity: false,
    fixExtensions: false
  };

  errors = {
    fileIntegrity: '',
    fixExtensions: ''
  };

  fileIntegrityResult: FileIntegrityResult | null = null;
  fixExtensionsResult: FixExtensionsResult | null = null;

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
