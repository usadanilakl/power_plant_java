import { Component, computed, inject, signal } from '@angular/core';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto, PersonnelSignEntry } from '../../../models/loto/loto.model';
import { RfFormField } from '../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { LotoPointsPanelComponent } from './loto-points-panel/loto-points-panel.component';
import { LotoService } from '../../../services/loto/loto.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

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
    MatChipsModule
  ],
  template: `
    <div class="loto-form-container">
      <!-- Status Bar -->
      @if (entity().id) {
        <div class="status-bar">
          <span class="status-label">Status:</span>
          <span class="status-chip" [class]="'status-' + (statusName() | lowercase)">
            {{ statusName() }}
          </span>
          <span class="box-indicator" *ngIf="entity().boxNumber">
            Box #{{ entity().boxNumber }}
          </span>
          <div class="status-actions">
            @if (statusName() === 'Building') {
              <button mat-raised-button color="warn" (click)="changeStatus('Active')">Activate LOTO</button>
              <button mat-stroked-button (click)="changeStatus('Closed')">Close</button>
            }
            @if (statusName() === 'Active') {
              <button mat-raised-button color="accent" (click)="changeStatus('Test')">Put in Test</button>
              <button mat-stroked-button (click)="changeStatus('Closed')">Close</button>
            }
            @if (statusName() === 'Test') {
              <button mat-raised-button color="warn" (click)="changeStatus('Active')">Re-Activate</button>
              <button mat-stroked-button (click)="changeStatus('Closed')">Close</button>
            }
          </div>
        </div>
      }

      <!-- Create Actions (when no entity selected) -->
      @if (!entity().id) {
        <div class="create-actions">
          <button mat-raised-button color="primary" (click)="showStandardSelector = true">
            <mat-icon>library_books</mat-icon> Create from Standard
          </button>
          <button mat-stroked-button (click)="createFromScratch()">
            <mat-icon>add</mat-icon> Create from Scratch
          </button>
        </div>
      }

      <!-- Main Form -->
      <mat-tab-group>
        <mat-tab label="Info">
          <app-rf-reactive-form
            [fields]="fields()"
            [entity]="entity()"
            [title]="'LOTO'"
            [submitButtonText]="entity().id ? 'Update' : 'Create'"
            [deleteButtonText]="entity().id ? 'Delete' : ''"
            (formSubmit)="onSubmit($event)"
            (formDelete)="onDelete()"
          ></app-rf-reactive-form>
        </mat-tab>
        <mat-tab label="LOTO Points">
          <app-loto-points-panel></app-loto-points-panel>
        </mat-tab>
        <mat-tab label="Personnel">
          <div class="personnel-panel">
            <div class="personnel-actions">
              <button mat-raised-button color="primary" (click)="showSignOnForm = !showSignOnForm">
                <mat-icon>person_add</mat-icon> Sign On
              </button>
            </div>
            @if (showSignOnForm) {
              <div class="sign-on-form">
                <input #nameInput placeholder="Name" class="form-input">
                <input #roleInput placeholder="Role" class="form-input">
                <input #companyInput placeholder="Company" class="form-input">
                <button mat-raised-button (click)="signOn(nameInput.value, roleInput.value, companyInput.value); showSignOnForm = false">
                  Confirm Sign On
                </button>
              </div>
            }
            <table class="personnel-table" *ngIf="entity().personnel?.length">
              <thead>
                <tr>
                  <th>Name</th><th>Role</th><th>Company</th><th>Sign On</th><th>Sign Off</th><th>Action</th>
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
          </div>
        </mat-tab>
        <mat-tab label="History">
          <div class="snapshot-panel">
            <p *ngIf="!entity().id">Save the LOTO permit to view snapshot history.</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .loto-form-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: #1e1e1e; border-radius: 8px; }
    .status-label { font-weight: 500; color: #aaa; }
    .status-chip { padding: 4px 12px; border-radius: 16px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .status-building { background: #2e7d32; color: white; }
    .status-active { background: #c62828; color: white; }
    .status-test { background: #f9a825; color: black; }
    .status-closed { background: #424242; color: #aaa; }
    .box-indicator { margin-left: auto; padding: 4px 12px; background: #333; border-radius: 8px; }
    .status-actions { display: flex; gap: 8px; margin-left: 8px; }
    .create-actions { display: flex; gap: 12px; padding: 8px 0; }
    .personnel-panel { padding: 16px; }
    .personnel-actions { margin-bottom: 12px; }
    .sign-on-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
    .form-input { padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; }
    .personnel-table { width: 100%; border-collapse: collapse; }
    .personnel-table th, .personnel-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
    .personnel-table th { color: #aaa; font-weight: 500; }
    .signed-off { opacity: 0.5; }
    .snapshot-panel { padding: 16px; }
  `],
})
export class RfLotoFormComponent {
  private currentService = inject(CurrentLotoService);
  private lotoService = inject(LotoService);

  showStandardSelector = false;
  showSignOnForm = false;

  entity = computed(() => this.currentService.selectedItem() ?? new LotoDto());
  fields = computed(() => LotoDto.toFormFields(this.entity()) as RfFormField[]);
  statusName = computed(() => this.entity().permitStatus?.name ?? 'Building');

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
        if (res.data) {
          this.currentService.setCurrentLoto(LotoDto.fromJson(res.data));
        }
      });
    }
  }

  createFromScratch(): void {
    this.lotoService.createFromScratch().subscribe(res => {
      if (res.data) {
        this.currentService.setCurrentLoto(LotoDto.fromJson(res.data));
      }
    });
  }

  signOn(name: string, role: string, company: string): void {
    const entity = this.entity();
    if (entity?.id && name) {
      const entry: PersonnelSignEntry = {
        personName: name, personRole: role, company: company,
        signOnTime: '', signOffTime: null, signOffComments: null, performedBy: ''
      };
      this.lotoService.signOn(entity.id, entry).subscribe(res => {
        if (res.data) this.currentService.setCurrentLoto(LotoDto.fromJson(res.data));
      });
    }
  }

  signOff(name: string): void {
    const entity = this.entity();
    if (entity?.id) {
      this.lotoService.signOff(entity.id, name, '').subscribe(res => {
        if (res.data) this.currentService.setCurrentLoto(LotoDto.fromJson(res.data));
      });
    }
  }
}
