import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DuplicatePrimaryResult,
  FormDiagnostics,
  OrphanRepairResult,
  PrintableFormService,
} from '../../../services/forms/printable-form.service';
import { PrintableFormDto } from '../../../models/forms/printable-form.model';

@Component({
  selector: 'app-admin-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- Seed Form -->
      <div class="admin-section">
        <h3>Seed Printable Form</h3>
        <p class="description">
          Create a new printable form from a predefined template. Select the form type,
          set a custom name, and click Seed to generate it.
        </p>

        <div class="form-row">
          <label for="formType">Form Type:</label>
          <select id="formType" [(ngModel)]="selectedType" (ngModelChange)="onTypeChange()">
            <option value="">-- Select --</option>
            <option *ngFor="let entry of seedTypeEntries" [value]="entry.key">
              {{ entry.key }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="formName">Form Name:</label>
          <input id="formName" type="text" [(ngModel)]="formName" placeholder="Enter form name" />
        </div>

        <div class="button-group">
          <button (click)="seedForm()" [disabled]="seeding || !selectedType || !formName.trim()" class="action-btn">
            {{ seeding ? 'Seeding...' : 'Seed Form' }}
          </button>
        </div>

        <div class="error" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="successMessage">{{ successMessage }}</div>
      </div>

      <!-- Existing Forms -->
      <div class="admin-section">
        <h3>Existing Printable Forms</h3>
        <button (click)="loadForms()" [disabled]="loadingForms" class="action-btn secondary">
          {{ loadingForms ? 'Loading...' : 'Refresh' }}
        </button>

        <table *ngIf="forms.length > 0" class="forms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Form Type</th>
              <th>Primary</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let form of forms">
              <td>{{ form.id }}</td>
              <td>{{ form.name }}</td>
              <td>{{ form.formType }}</td>
              <td>{{ form.isPrimary ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="forms.length === 0 && !loadingForms" class="no-data">No forms found.</p>
      </div>

      <!-- Maintenance -->
      <div class="admin-section">
        <h3>Form Maintenance</h3>
        <p class="description">
          Every action here has a <strong>Dry run</strong> that reports what would change without
          writing anything. Review it, then Apply.
        </p>

        <div class="button-group">
          <button (click)="diagnose()" [disabled]="diagnosing" class="action-btn secondary">
            {{ diagnosing ? 'Checking...' : 'Run Diagnostics' }}
          </button>
        </div>

        <table *ngIf="diagnostics" class="forms-table">
          <tbody>
            <tr><th>Live forms</th><td>{{ diagnostics.totalForms }}</td></tr>
            <tr><th>Live containers</th><td>{{ diagnostics.totalContainers }}</td></tr>
            <tr>
              <th>Orphaned containers</th>
              <td [class.bad]="diagnostics.orphanedContainers > 0">
                {{ diagnostics.orphanedContainers }}
                <span *ngIf="orphanBreakdown" class="muted">&nbsp;({{ orphanBreakdown }})</span>
              </td>
            </tr>
            <tr>
              <th>Form types with &gt;1 primary</th>
              <td [class.bad]="diagnostics.duplicatePrimaryTypes > 0">
                {{ diagnostics.duplicatePrimaryTypes }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Orphaned containers -->
        <div class="sub-section">
          <h4>Orphaned containers &mdash; this machine only</h4>
          <p class="description">
            Containers whose parent form never arrived on this node. The repair is deliberately
            <strong>not</strong> broadcast: the same row may be correctly linked on another machine,
            so deleting it fleet-wide would destroy healthy data.
            <strong>Run this on each machine separately.</strong>
          </p>
          <div class="button-group">
            <button (click)="repairOrphans(true)" [disabled]="repairingOrphans" class="action-btn secondary">
              {{ repairingOrphans ? 'Working...' : 'Dry run' }}
            </button>
            <button (click)="repairOrphans(false)"
                    [disabled]="repairingOrphans || !orphanDryRunDone"
                    class="action-btn danger"
                    title="Run a dry run first">
              Apply &mdash; soft-delete orphans
            </button>
          </div>
          <pre *ngIf="orphanResult" class="result">{{ orphanResult | json }}</pre>
        </div>

        <!-- Duplicate primaries -->
        <div class="sub-section">
          <h4>Duplicate primary forms &mdash; syncs fleet-wide</h4>
          <p class="description">
            More than one primary for a form type makes
            <code>get-primary-form-by-type</code> throw, which takes that paper form offline.
            This keeps the newest and demotes the rest. <code>PrintableForm</code> is CRDT-synced,
            so <strong>run this once, on the hub</strong> &mdash; the change reaches every desktop.
          </p>
          <div class="button-group">
            <button (click)="fixPrimaries(true)" [disabled]="fixingPrimaries" class="action-btn secondary">
              {{ fixingPrimaries ? 'Working...' : 'Dry run' }}
            </button>
            <button (click)="fixPrimaries(false)"
                    [disabled]="fixingPrimaries || !primaryDryRunDone"
                    class="action-btn danger"
                    title="Run a dry run first">
              Apply &mdash; demote extras
            </button>
          </div>
          <pre *ngIf="primaryResult" class="result">{{ primaryResult | json }}</pre>
        </div>

        <div class="error" *ngIf="maintenanceError">{{ maintenanceError }}</div>
        <div class="success-msg" *ngIf="maintenanceMessage">{{ maintenanceMessage }}</div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .admin-section {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .admin-section h3 {
      margin-top: 0;
      color: #333;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 8px;
    }
    .description {
      color: #666;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .form-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .form-row label {
      min-width: 100px;
      font-weight: 600;
      color: #333;
    }
    .form-row select,
    .form-row input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    .button-group {
      margin-top: 10px;
    }
    .action-btn {
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      background-color: #007bff;
      color: white;
      transition: background-color 0.2s;
    }
    .action-btn:hover:not(:disabled) {
      background-color: #0056b3;
    }
    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .action-btn.secondary {
      background-color: #6c757d;
    }
    .action-btn.secondary:hover:not(:disabled) {
      background-color: #545b62;
    }
    .error {
      color: #dc3545;
      margin-top: 10px;
      padding: 8px;
      background: #f8d7da;
      border-radius: 4px;
    }
    .success-msg {
      color: #155724;
      margin-top: 10px;
      padding: 8px;
      background: #d4edda;
      border-radius: 4px;
    }
    .forms-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .forms-table th, .forms-table td {
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      text-align: left;
    }
    .forms-table th {
      background: #e9ecef;
      font-weight: 600;
    }
    .forms-table tr:hover {
      background: #f0f0f0;
    }
    .no-data {
      color: #999;
      font-style: italic;
    }
    .sub-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed #ccc;
    }
    .sub-section h4 {
      margin: 0 0 6px;
      color: #333;
    }
    .action-btn.danger {
      background-color: #dc3545;
      margin-left: 8px;
    }
    .action-btn.danger:hover:not(:disabled) {
      background-color: #b02a37;
    }
    .result {
      margin-top: 12px;
      padding: 10px;
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 12px;
      max-height: 260px;
      overflow: auto;
      white-space: pre-wrap;
    }
    td.bad {
      color: #dc3545;
      font-weight: 700;
    }
    .muted {
      color: #666;
      font-weight: 400;
      font-size: 12px;
    }
  `]
})
export class AdminFormsComponent implements OnInit {
  seedTypes: Record<string, string> = {};
  seedTypeEntries: { key: string; value: string }[] = [];
  selectedType = '';
  formName = '';
  seeding = false;
  error = '';
  successMessage = '';

  forms: PrintableFormDto[] = [];
  loadingForms = false;

  // Maintenance
  diagnostics: FormDiagnostics | null = null;
  diagnosing = false;
  orphanResult: OrphanRepairResult | null = null;
  repairingOrphans = false;
  orphanDryRunDone = false;
  primaryResult: DuplicatePrimaryResult | null = null;
  fixingPrimaries = false;
  primaryDryRunDone = false;
  maintenanceError = '';
  maintenanceMessage = '';

  constructor(private printableFormService: PrintableFormService) {}

  /** e.g. "device 1: 490, device 3: 180" */
  get orphanBreakdown(): string {
    const byDevice = this.diagnostics?.orphansByDevice ?? {};
    return Object.entries(byDevice).map(([device, count]) => `${device}: ${count}`).join(', ');
  }

  ngOnInit() {
    this.loadSeedTypes();
    this.loadForms();
  }

  diagnose() {
    this.diagnosing = true;
    this.maintenanceError = '';
    this.maintenanceMessage = '';
    this.printableFormService.diagnose().subscribe({
      next: res => {
        this.diagnostics = res.responseData ?? null;
        this.diagnosing = false;
      },
      error: err => {
        this.diagnosing = false;
        this.maintenanceError = err.error?.message || 'Diagnostics failed';
      }
    });
  }

  repairOrphans(dryRun: boolean) {
    this.repairingOrphans = true;
    this.maintenanceError = '';
    this.maintenanceMessage = '';
    this.printableFormService.repairOrphans(dryRun).subscribe({
      next: res => {
        this.repairingOrphans = false;
        this.orphanResult = res.responseData ?? null;
        this.maintenanceMessage = res.message || '';
        if (dryRun) {
          this.orphanDryRunDone = true;
        } else {
          this.orphanDryRunDone = false;
          this.diagnose();
        }
      },
      error: err => {
        this.repairingOrphans = false;
        this.maintenanceError = err.error?.message || 'Orphan repair failed';
      }
    });
  }

  fixPrimaries(dryRun: boolean) {
    this.fixingPrimaries = true;
    this.maintenanceError = '';
    this.maintenanceMessage = '';
    this.printableFormService.fixDuplicatePrimaries(dryRun).subscribe({
      next: res => {
        this.fixingPrimaries = false;
        this.primaryResult = res.responseData ?? null;
        this.maintenanceMessage = res.message || '';
        if (dryRun) {
          this.primaryDryRunDone = true;
        } else {
          this.primaryDryRunDone = false;
          this.diagnose();
          this.loadForms();
        }
      },
      error: err => {
        this.fixingPrimaries = false;
        this.maintenanceError = err.error?.message || 'Duplicate-primary fix failed';
      }
    });
  }

  loadSeedTypes() {
    this.printableFormService.getSeedTypes().subscribe({
      next: res => {
        this.seedTypes = res.responseData || {};
        this.seedTypeEntries = Object.entries(this.seedTypes).map(([key, value]) => ({ key, value }));
      },
      error: () => this.error = 'Failed to load seed types'
    });
  }

  onTypeChange() {
    if (this.selectedType && this.seedTypes[this.selectedType]) {
      this.formName = this.seedTypes[this.selectedType];
    }
  }

  seedForm() {
    this.seeding = true;
    this.error = '';
    this.successMessage = '';
    this.printableFormService.seedForm(this.selectedType, this.formName).subscribe({
      next: res => {
        this.seeding = false;
        this.successMessage = res.message || 'Form seeded successfully.';
        this.loadForms();
      },
      error: err => {
        this.seeding = false;
        this.error = err.error?.message || 'Failed to seed form';
      }
    });
  }

  loadForms() {
    this.loadingForms = true;
    this.printableFormService.getAll().subscribe({
      next: res => {
        this.forms = res.responseData || [];
        this.loadingForms = false;
      },
      error: () => {
        this.loadingForms = false;
      }
    });
  }
}
