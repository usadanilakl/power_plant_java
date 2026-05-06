import { Component, computed, inject, signal } from '@angular/core';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto, PersonnelSignEntry } from '../../../models/loto/loto.model';
import { RfFormField } from '../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { LotoPointsPanelComponent } from './loto-points-panel/loto-points-panel.component';
import { LotoService } from '../../../services/loto/loto.service';
import { LotoStandardService } from '../../../services/loto/loto-standard.service';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rf-loto-form',
  standalone: true,
  imports: [
    CommonModule,
    RfReactiveFormComponent,
    LotoPointsPanelComponent,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
  ],
  template: `
    <div class="loto-form-container">
      <!-- Top toolbar — always visible -->
      <div class="toolbar">
        <button mat-stroked-button (click)="newLoto()">
          <mat-icon>add</mat-icon> New LOTO
        </button>

        @if (entity().id) {
          <span class="status-chip" [class]="'status-' + statusName().toLowerCase()">
            {{ statusName() }}
          </span>
          @if (entity().boxNumber) {
            <span class="box-indicator">Box #{{ entity().boxNumber }}</span>
          }

          <!-- Status transition buttons -->
          @if (statusName() === 'Building') {
            <button mat-raised-button color="warn" (click)="changeStatus('Active')">Activate</button>
            <button mat-stroked-button (click)="changeStatus('Closed')">Close</button>
          }
          @if (statusName() === 'Active') {
            <button mat-raised-button color="accent" (click)="changeStatus('Test')">Test</button>
            <button mat-stroked-button (click)="changeStatus('Closed')">Close</button>
          }
          @if (statusName() === 'Test') {
            <button mat-raised-button color="warn" (click)="changeStatus('Active')">Re-Activate</button>
            <button mat-stroked-button (click)="changeStatus('Closed')">Close</button>
          }
        }
      </div>

      <!-- CREATE VIEW — shown when no entity is selected -->
      @if (!entity().id) {
        <div class="create-panel">
          <h3>Create LOTO Permit</h3>

          @if (!showStandardSelector()) {
            <div class="create-actions">
              <button mat-raised-button color="primary" (click)="loadStandardsAndShow()">
                <mat-icon>library_books</mat-icon> From Standard
              </button>
              <button mat-stroked-button (click)="createFromScratch()">
                <mat-icon>edit_note</mat-icon> From Scratch
              </button>
            </div>
          }

          @if (showStandardSelector()) {
            <div class="standard-selector">
              <div class="selector-header">
                <h4>Select a LOTO Standard</h4>
                <button mat-icon-button (click)="showStandardSelector.set(false)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              @if (loadingStandards()) {
                <p class="loading-text">Loading standards...</p>
              } @else if (standards().length === 0) {
                <p class="loading-text">No LOTO standards found.</p>
              } @else {
                <div class="standard-list">
                  @for (std of standards(); track std.id) {
                    <div class="standard-item" (click)="createFromStandard(std.id)">
                      <mat-icon>checklist</mat-icon>
                      <div class="standard-info">
                        <span class="standard-name">{{ std.name || 'Standard #' + std.id }}</span>
                        <span class="standard-desc">{{ std.description || '' }} — {{ std.lotoPoints?.length || 0 }} points</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- EDIT VIEW — shown when entity is selected -->
      @if (entity().id) {
        <mat-tab-group>
          <mat-tab label="Info">
            <app-rf-reactive-form
              [fields]="fields()"
              [entity]="entity()"
              [title]="'LOTO'"
              [submitButtonText]="'Update'"
              [deleteButtonText]="'Delete'"
              (formSubmit)="onSubmit($event)"
              (formDelete)="onDelete()"
            ></app-rf-reactive-form>
          </mat-tab>
          <mat-tab label="LOTO Points">
            <app-loto-points-panel></app-loto-points-panel>
          </mat-tab>
          <mat-tab label="Personnel ({{ entity().personnel?.length || 0 }})">
            <div class="personnel-panel">
              <div class="personnel-actions">
                <button mat-raised-button color="primary" (click)="showSignOnForm.set(!showSignOnForm())">
                  <mat-icon>person_add</mat-icon> Sign On
                </button>
              </div>
              @if (showSignOnForm()) {
                <div class="sign-on-form">
                  <input #nameInput placeholder="Name" class="form-input">
                  <input #roleInput placeholder="Role" class="form-input">
                  <input #companyInput placeholder="Company" class="form-input">
                  <button mat-raised-button (click)="signOn(nameInput.value, roleInput.value, companyInput.value); showSignOnForm.set(false); nameInput.value=''; roleInput.value=''; companyInput.value=''">
                    Confirm
                  </button>
                  <button mat-stroked-button (click)="showSignOnForm.set(false)">Cancel</button>
                </div>
              }
              @if (entity().personnel?.length) {
                <table class="personnel-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Role</th><th>Company</th><th>Sign On</th><th>Sign Off</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of entity().personnel; track p.personName + p.signOnTime) {
                      <tr [class.signed-off]="p.signOffTime">
                        <td>{{ p.personName }}</td>
                        <td>{{ p.personRole }}</td>
                        <td>{{ p.company }}</td>
                        <td>{{ p.signOnTime }}</td>
                        <td>{{ p.signOffTime || '-' }}</td>
                        <td>
                          @if (!p.signOffTime) {
                            <button mat-icon-button color="warn" (click)="signOff(p.personName)">
                              <mat-icon>logout</mat-icon>
                            </button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="empty-text">No personnel signed on yet.</p>
              }
            </div>
          </mat-tab>
          <mat-tab label="History">
            <div class="snapshot-panel">
              <p class="empty-text">Snapshot history will appear here after status changes.</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .loto-form-container { display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px; }

    .toolbar { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #1a1a1a; border-radius: 8px; flex-wrap: wrap; }
    .status-chip { padding: 4px 12px; border-radius: 16px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .status-building { background: #2e7d32; color: white; }
    .status-active { background: #c62828; color: white; }
    .status-test { background: #f9a825; color: black; }
    .status-closed { background: #424242; color: #aaa; }
    .box-indicator { padding: 4px 10px; background: #333; border-radius: 8px; font-size: 13px; }

    .create-panel { padding: 16px; }
    .create-panel h3 { margin: 0 0 16px; color: #ddd; }
    .create-actions { display: flex; gap: 12px; }

    .standard-selector { margin-top: 8px; }
    .selector-header { display: flex; align-items: center; justify-content: space-between; }
    .selector-header h4 { margin: 0; color: #ccc; }
    .loading-text { color: #888; font-style: italic; padding: 12px 0; }
    .standard-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; margin-top: 8px; }
    .standard-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      background: #222; border-radius: 6px; cursor: pointer; transition: background 0.15s;
    }
    .standard-item:hover { background: #2a3a50; }
    .standard-info { display: flex; flex-direction: column; }
    .standard-name { font-weight: 600; color: #ddd; }
    .standard-desc { font-size: 12px; color: #888; }

    .personnel-panel { padding: 16px; }
    .personnel-actions { margin-bottom: 12px; }
    .sign-on-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
    .form-input { padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; }
    .personnel-table { width: 100%; border-collapse: collapse; }
    .personnel-table th, .personnel-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
    .personnel-table th { color: #aaa; font-weight: 500; }
    .signed-off { opacity: 0.5; }
    .snapshot-panel { padding: 16px; }
    .empty-text { color: #666; font-style: italic; }
  `],
})
export class RfLotoFormComponent {
  private currentService = inject(CurrentLotoService);
  private lotoService = inject(LotoService);
  private lotoStandardService = inject(LotoStandardService);

  showStandardSelector = signal(false);
  showSignOnForm = signal(false);
  standards = signal<LotoStandardDto[]>([]);
  loadingStandards = signal(false);

  entity = computed(() => this.currentService.selectedItem() ?? new LotoDto());
  fields = computed(() => LotoDto.toFormFields(this.entity()) as RfFormField[]);
  statusName = computed(() => this.entity().permitStatus?.name || 'Building');

  newLoto(): void {
    this.currentService.setCurrentLoto(null);
    this.showStandardSelector.set(false);
  }

  onSubmit(formData: any): void {
    this.currentService.processLotoChanges(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.deleteLoto(entity.id);
    }
  }

  changeStatus(status: string): void {
    const entity = this.entity();
    if (entity?.id) {
      this.lotoService.changeStatus(entity.id, status).subscribe(res => {
        if (res.responseData) {
          const updated = LotoDto.fromJson(res.responseData);
          this.currentService.updateLotoInList(updated);
          this.currentService.setCurrentLoto(updated);
        }
      });
    }
  }

  loadStandardsAndShow(): void {
    this.loadingStandards.set(true);
    this.showStandardSelector.set(true);
    this.lotoStandardService.getAllLotoStandards().subscribe(res => {
      this.standards.set((res.responseData ?? []).map((s: any) => LotoStandardDto.fromJson(s)));
      this.loadingStandards.set(false);
    });
  }

  createFromStandard(standardId: number): void {
    this.lotoService.createFromStandard(standardId).subscribe(res => {
      if (res.responseData) {
        const newLoto = LotoDto.fromJson(res.responseData);
        this.currentService.addLotoToList(newLoto);
        this.currentService.setCurrentLoto(newLoto);
        this.showStandardSelector.set(false);
      }
    });
  }

  createFromScratch(): void {
    this.lotoService.createFromScratch().subscribe(res => {
      if (res.responseData) {
        const newLoto = LotoDto.fromJson(res.responseData);
        this.currentService.addLotoToList(newLoto);
        this.currentService.setCurrentLoto(newLoto);
      }
    });
  }

  signOn(name: string, role: string, company: string): void {
    const entity = this.entity();
    if (entity?.id && name) {
      const entry: PersonnelSignEntry = {
        personName: name, personRole: role, company: company,
        signOnTime: '', signOffTime: null, signOffComments: null, performedBy: '', foreman: false
      };
      this.lotoService.signOn(entity.id, entry).subscribe(res => {
        if (res.responseData) this.currentService.setCurrentLoto(LotoDto.fromJson(res.responseData));
      });
    }
  }

  signOff(name: string): void {
    const entity = this.entity();
    if (entity?.id) {
      this.lotoService.signOff(entity.id, name, '').subscribe(res => {
        if (res.responseData) this.currentService.setCurrentLoto(LotoDto.fromJson(res.responseData));
      });
    }
  }
}
