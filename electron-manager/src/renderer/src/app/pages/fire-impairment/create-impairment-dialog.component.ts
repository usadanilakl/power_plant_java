import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService } from '../../services/electron.service';

interface PersonOption {
  key: string;
  name: string;
  email: string;
  selected: boolean;
}

@Component({
  selector: 'app-create-impairment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay" (click)="cancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h2>New Fire Impairment</h2>

        <div class="loading" *ngIf="loadingEnums">Loading options...</div>

        <div class="error-msg" *ngIf="loadError">{{ loadError }}</div>

        <div *ngIf="!loadingEnums">
          <div class="section">
            <h3>People to Notify</h3>
            <div class="checkbox-grid">
              <label *ngFor="let p of people" class="checkbox-item" [title]="p.email">
                <input type="checkbox" [(ngModel)]="p.selected">
                <span>{{ p.name }}</span>
              </label>
            </div>
          </div>

          <div class="section">
            <h3>Location</h3>
            <select [(ngModel)]="selectedLocation" (ngModelChange)="onLocationChange($event)">
              <option value="">-- Select Location --</option>
              <option *ngFor="let loc of locations" [value]="loc.display">{{ loc.display }}</option>
            </select>
          </div>

          <div class="section">
            <h3>Protection Identifier</h3>
            <select [(ngModel)]="selectedProtection">
              <option value="">-- Select Protection --</option>
              <option *ngFor="let pt of protectionTypes" [value]="pt.display">{{ pt.display }}</option>
            </select>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn btn-primary" (click)="submit()" [disabled]="!canSubmit || loadingEnums">
            Create & Open FM Global
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-content {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      width: 520px;
      max-height: 80vh;
      overflow-y: auto;
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 20px;
    }

    .section {
      margin-bottom: 20px;
    }

    h3 {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px;
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-primary);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      transition: background var(--transition-fast);
    }

    .checkbox-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .checkbox-item input[type="checkbox"] {
      accent-color: var(--accent-primary);
    }

    select {
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 13px;
    }

    select:focus {
      outline: none;
      border-color: var(--accent-primary);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .loading {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      font-size: 13px;
    }

    .error-msg {
      padding: 8px 12px;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 6px;
      color: var(--accent-error);
      font-size: 12px;
      margin-bottom: 12px;
    }
  `]
})
export class CreateImpairmentDialogComponent implements OnInit {
  @Output() submitted = new EventEmitter<Record<string, string>>();
  @Output() cancelled = new EventEmitter<void>();

  people: PersonOption[] = [];
  locations: Array<{ value: string; display: string }> = [];
  protectionTypes: Array<{ value: string; display: string }> = [];
  selectedLocation = '';
  selectedLocationValue = '';
  selectedProtection = '';
  loadingEnums = true;
  loadError = '';

  private readonly defaultSelected = [
    'ANDREW_G', 'AUSTIN', 'DANIL', 'HEATHER', 'JOHN',
    'MATT', 'RIGO', 'RYAN', 'SCOTT', 'STUART'
  ];

  // Fallback when /emails endpoint is not yet deployed
  private readonly fallbackEmails: Array<{ key: string; name: string; email: string }> = [
    { key: 'ADAM', name: 'Adam', email: 'abunker@jpowerusa.com' },
    { key: 'ANDREW_G', name: 'Andrew G', email: 'agorelik@jpowerusa.com' },
    { key: 'ANDREW_S', name: 'Andrew S', email: 'astroud@jpowerusa.com' },
    { key: 'ANTHONY', name: 'Anthony', email: 'astein-rojas@jpowerusa.com' },
    { key: 'AUSTIN', name: 'Austin', email: 'aouellette@jpowerusa.com' },
    { key: 'DANIL', name: 'Danil', email: 'dklokov@jpowerusa.com' },
    { key: 'EUGENE', name: 'Eugene', email: 'emykhailenko@jpowerusa.com' },
    { key: 'GEO', name: 'Geo', email: 'gmartinez@jpowerusa.com' },
    { key: 'HEATHER', name: 'Heather', email: 'hsincak@jpowerusa.com' },
    { key: 'JOHN', name: 'John', email: 'jnoble@jpowerusa.com' },
    { key: 'JUAN', name: 'Juan', email: 'jsilva@jpowerusa.com' },
    { key: 'JUSTIN', name: 'Justin', email: 'jwandahovich@jpowerusa.com' },
    { key: 'MATT', name: 'Matt', email: 'mwrightsman@jpowerusa.com' },
    { key: 'RIGO', name: 'Rigo', email: 'rigarcia@jpowerusa.com' },
    { key: 'RYAN', name: 'Ryan', email: 'rsedler@jpowerusa.com' },
    { key: 'SCOTT', name: 'Scott', email: 'sfreese@jpowerusa.com' },
    { key: 'SIDNEY', name: 'Sidney', email: 'sbazemore@jpowerusa.com' },
    { key: 'STUART', name: 'Stuart', email: 'sowens@jpowerusa.com' }
  ];

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    const result = await this.electronService.fireImpGetEnums();
    if (result.success && result.data) {
      const emails = Array.isArray(result.data.emails) ? result.data.emails : this.fallbackEmails;
      this.people = emails.map((e: any) => ({
        key: e.key,
        name: e.name,
        email: e.email,
        selected: this.defaultSelected.includes(e.key)
      }));
      this.locations = Array.isArray(result.data.locations) ? result.data.locations : [];
      this.protectionTypes = Array.isArray(result.data.protectionTypes) ? result.data.protectionTypes : [];
    } else {
      this.loadError = result.error || 'Failed to load options';
      // Use fallbacks for people even on total failure
      this.people = this.fallbackEmails.map(e => ({
        ...e,
        selected: this.defaultSelected.includes(e.key)
      }));
    }
    this.loadingEnums = false;
  }

  onLocationChange(display: string): void {
    const loc = this.locations.find(l => l.display === display);
    this.selectedLocationValue = loc?.value || '';
  }

  get canSubmit(): boolean {
    return this.people.some(p => p.selected) && this.selectedLocation !== '';
  }

  submit(): void {
    const selected = this.people.filter(p => p.selected);
    const dto: Record<string, string> = {
      name: 'Jpower',
      email: selected[0]?.email || '',
      emailCc: selected.map(p => p.email).join(';'),
      clientName: 'Jpower',
      indexNumber: '003652.35-01',
      streetAddress: '24650 South Brandon Road',
      state: 'Illinois',
      city: 'Elwood',
      country: 'United States of America',
      phone: '779-242-6151',
      office: 'Chicago~engchicagocustomerservicedesk@fmglobal.com',
      areaProtected: this.selectedLocation,
      protectionType: this.selectedProtection,
      valveNumber: this.selectedProtection,
      location: this.selectedLocationValue
    };
    this.submitted.emit(dto);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
