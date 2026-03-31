import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrintableFormService } from '../../../services/forms/printable-form.service';
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

  constructor(private printableFormService: PrintableFormService) {}

  ngOnInit() {
    this.loadSeedTypes();
    this.loadForms();
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
