import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { WorkCategoryProfileApiService } from './services/work-category-profile-api.service';
import { WorkCategoryProfileDto } from '../../../models/permits/work-category-profile.model';
import { SwHazards } from '../../../models/permits/safe-work.model';
import { HotWorkMeasures } from '../../../models/permits/hot-work.model';
import { ConfinedSpaceHazards } from '../../../models/permits/confined-space.model';

@Component({
  selector: 'app-work-category-profile-admin',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="Work Category Hazard Profiles">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
      <div class="admin-container">

        <div *ngIf="errorMessage()" class="error-message">{{ errorMessage() }}</div>
        <div *ngIf="successMessage()" class="success-message">{{ successMessage() }}</div>

        <!-- Profile List -->
        <div class="profiles-grid">
          <div *ngFor="let profile of profiles()" class="profile-card" [class.selected]="selectedProfile()?.id === profile.id" (click)="selectProfile(profile)">
            <div class="profile-header">{{ profile.workCategory?.name || 'Unknown' }}</div>
            <div class="profile-counts">
              <span class="count-badge hazard">{{ countTrue(profile.standardHazards) }} hazards</span>
              <span class="count-badge hotwork">{{ countTrue(profile.standardHotWorkMeasures) }} hot work</span>
              <span class="count-badge confined">{{ countTrue(profile.standardConfinedSpaceHazards) }} confined</span>
            </div>
          </div>
        </div>

        <!-- Edit Panel -->
        <div *ngIf="selectedProfile()" class="edit-panel">
          <h3>{{ selectedProfile()!.workCategory?.name }} - Standard Hazards</h3>

          <div class="hazard-section">
            <h4>Safe Work Hazards</h4>
            <div class="checkbox-grid">
              <label *ngFor="let h of swHazardKeys" class="checkbox-item">
                <input type="checkbox" [checked]="getSwHazard(h)" (change)="toggleSwHazard(h)">
                {{ formatLabel(h) }}
              </label>
            </div>
          </div>

          <div class="hazard-section">
            <h4>Hot Work Measures</h4>
            <div class="checkbox-grid">
              <label *ngFor="let h of hwMeasureKeys" class="checkbox-item">
                <input type="checkbox" [checked]="getHwMeasure(h)" (change)="toggleHwMeasure(h)">
                {{ formatLabel(h) }}
              </label>
            </div>
          </div>

          <div class="hazard-section">
            <h4>Confined Space Hazards</h4>
            <div class="checkbox-grid">
              <label *ngFor="let h of csHazardKeys" class="checkbox-item">
                <input type="checkbox" [checked]="getCsHazard(h)" (change)="toggleCsHazard(h)">
                {{ formatLabel(h) }}
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn save" (click)="save()" [disabled]="isSaving()">{{ isSaving() ? 'Saving...' : 'Save' }}</button>
            <button class="btn cancel" (click)="selectedProfile.set(null)">Cancel</button>
          </div>
        </div>

      </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .admin-container { padding: 20px; max-width: 1200px; margin: 0 auto; }

    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .profile-card {
      background: #16213e;
      border: 1px solid #1a1a3e;
      border-radius: 8px;
      padding: 14px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .profile-card:hover { border-color: #533483; }
    .profile-card.selected { border-color: #7c4dff; background: #1a2a4e; }
    .profile-header { color: #e0e0e0; font-weight: 600; margin-bottom: 8px; }
    .profile-counts { display: flex; flex-wrap: wrap; gap: 6px; }
    .count-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
    }
    .count-badge.hazard { background: rgba(255, 152, 0, 0.2); color: #ffb74d; }
    .count-badge.hotwork { background: rgba(244, 67, 54, 0.2); color: #ef9a9a; }
    .count-badge.confined { background: rgba(33, 150, 243, 0.2); color: #90caf9; }

    .edit-panel {
      background: #16213e;
      border: 1px solid #1a1a3e;
      border-radius: 8px;
      padding: 20px;
    }
    .edit-panel h3 { color: #e0e0e0; margin: 0 0 16px 0; }
    .edit-panel h4 { color: #aaa; margin: 16px 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }

    .hazard-section { margin-bottom: 12px; }
    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 4px;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ddd;
      font-size: 13px;
      padding: 4px 0;
      cursor: pointer;
    }
    .checkbox-item input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

    .form-actions { display: flex; gap: 10px; margin-top: 20px; }

    .btn {
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 13px;
    }
    .btn.save { background: #2d8a4e; }
    .btn.cancel { background: #555; }
    .btn:hover { opacity: 0.85; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .error-message {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      color: #ff6b6b;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .success-message {
      background: rgba(45, 138, 78, 0.15);
      border: 1px solid #2d8a4e;
      color: #81c784;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
  `]
})
export class WorkCategoryProfileAdminComponent implements OnInit {
  private api = inject(WorkCategoryProfileApiService);

  profiles = signal<WorkCategoryProfileDto[]>([]);
  selectedProfile = signal<WorkCategoryProfileDto | null>(null);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Keys for each hazard type (excluding string description fields)
  swHazardKeys = Object.keys(new SwHazards()).filter(k => typeof (new SwHazards() as any)[k] === 'boolean');
  hwMeasureKeys = Object.keys(new HotWorkMeasures()).filter(k => typeof (new HotWorkMeasures() as any)[k] === 'boolean');
  csHazardKeys = Object.keys(new ConfinedSpaceHazards()).filter(k => typeof (new ConfinedSpaceHazards() as any)[k] === 'boolean');

  ngOnInit() {
    this.loadProfiles();
  }

  loadProfiles() {
    this.api.getAll().subscribe({
      next: profiles => this.profiles.set(profiles),
      error: () => this.errorMessage.set('Failed to load profiles')
    });
  }

  selectProfile(profile: WorkCategoryProfileDto) {
    // Deep clone to avoid mutating list
    this.selectedProfile.set(WorkCategoryProfileDto.fromJson(profile.toJson()));
    this.clearMessages();
  }

  countTrue(obj: any): number {
    if (!obj) return 0;
    return Object.values(obj).filter(v => v === true).length;
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }

  getSwHazard(key: string): boolean {
    return (this.selectedProfile()?.standardHazards as any)?.[key] ?? false;
  }
  toggleSwHazard(key: string) {
    const p = this.selectedProfile();
    if (!p) return;
    const hazards = p.standardHazards || new SwHazards();
    (hazards as any)[key] = !(hazards as any)[key];
    p.standardHazards = new SwHazards(hazards);
    this.selectedProfile.set(WorkCategoryProfileDto.fromJson(p.toJson()));
  }

  getHwMeasure(key: string): boolean {
    return (this.selectedProfile()?.standardHotWorkMeasures as any)?.[key] ?? false;
  }
  toggleHwMeasure(key: string) {
    const p = this.selectedProfile();
    if (!p) return;
    const measures = p.standardHotWorkMeasures || new HotWorkMeasures();
    (measures as any)[key] = !(measures as any)[key];
    p.standardHotWorkMeasures = new HotWorkMeasures(measures);
    this.selectedProfile.set(WorkCategoryProfileDto.fromJson(p.toJson()));
  }

  getCsHazard(key: string): boolean {
    return (this.selectedProfile()?.standardConfinedSpaceHazards as any)?.[key] ?? false;
  }
  toggleCsHazard(key: string) {
    const p = this.selectedProfile();
    if (!p) return;
    const hazards = p.standardConfinedSpaceHazards || new ConfinedSpaceHazards();
    (hazards as any)[key] = !(hazards as any)[key];
    p.standardConfinedSpaceHazards = new ConfinedSpaceHazards(hazards);
    this.selectedProfile.set(WorkCategoryProfileDto.fromJson(p.toJson()));
  }

  save() {
    const profile = this.selectedProfile();
    if (!profile) return;
    this.isSaving.set(true);
    this.clearMessages();
    this.api.save(profile).subscribe({
      next: saved => {
        this.successMessage.set('Profile saved successfully');
        this.isSaving.set(false);
        this.selectedProfile.set(null);
        this.loadProfiles();
      },
      error: () => {
        this.errorMessage.set('Failed to save profile');
        this.isSaving.set(false);
      }
    });
  }

  private clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
