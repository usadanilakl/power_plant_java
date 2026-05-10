import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto, PersonnelSignEntry } from '../../../models/loto/loto.model';
import { LotoSnapshotDto } from '../../../models/loto/loto-snapshot.model';
import { GuidedProcedureWindowComponent, GuidedProcedureMode } from '../../../shared/loto/guided-procedure-window/guided-procedure-window.component';
import { RfFormField } from '../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { LotoPointsPanelComponent } from './loto-points-panel/loto-points-panel.component';
import { LotoService } from '../../../services/loto/loto.service';
import { LotoStandardService } from '../../../services/loto/loto-standard.service';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rf-loto-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RfReactiveFormComponent,
    LotoPointsPanelComponent,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    GuidedProcedureWindowComponent,
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

      <!-- Close-time disposition banner -->
      @if (closeDispositionMessage(); as msg) {
        <div class="close-disposition" [class.disposition-ok]="entity().closeDisposition === 'READY_FOR_APPROVAL'"
             [class.disposition-warn]="entity().closeDisposition === 'NEEDS_REVIEW'">
          <span>{{ msg }}</span>
          @if (entity().sourceStandardId) {
            <button mat-stroked-button (click)="proposeChangesToStandard()">
              {{ entity().closeDisposition === 'NEEDS_REVIEW' ? 'Propose Changes to Standard' : 'Open Source Standard' }}
            </button>
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
          <mat-tab label="Lifecycle">
            <div class="lifecycle-panel">
              <table class="lifecycle-table">
                <thead><tr><th>Event</th><th>By</th><th>At</th><th></th></tr></thead>
                <tbody>
                  <tr>
                    <td>CA Approved for Hanging</td>
                    <td>{{ latestEvent('caApprovedForHangingBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('caApprovedForHangingAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('ca-approve-hanging')" (click)="recordCaApprovedForHanging()">Approve for Hanging</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Hung By</td>
                    <td>{{ latestEvent('hungBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('hungAt')) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              [disabled]="!canStartProcedure('HANG')"
                              (click)="openProcedure('HANG')">
                        <mat-icon>lock</mat-icon> Start Hanging
                      </button>
                      <button mat-stroked-button class="aggregate-btn"
                              [disabled]="!canRecord('hung')"
                              (click)="recordHung()">Sign as Hung</button>
                      <span class="progress-note">{{ pointsHungProgress() }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Verified By</td>
                    <td>{{ latestEvent('verifiedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('verifiedAt')) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              [disabled]="!canStartProcedure('VERIFY')"
                              (click)="openProcedure('VERIFY')">
                        <mat-icon>verified_user</mat-icon> Start Verifying
                      </button>
                      <button mat-stroked-button class="aggregate-btn"
                              [disabled]="!canRecord('verified')"
                              (click)="recordVerified()">Sign as Verified</button>
                      <span class="progress-note">{{ pointsVerifiedProgress() }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Walkdown</td>
                    <td>{{ walkdownDoneCount() }} / {{ entity().lotoPoints?.length || 0 }} points</td>
                    <td>{{ formatTime(latestWalkdownAt()) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              [disabled]="!canStartProcedure('WALKDOWN')"
                              (click)="openProcedure('WALKDOWN')">
                        <mat-icon>directions_walk</mat-icon> Start Walkdown
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>CA Activated</td>
                    <td>{{ latestEvent('caActivatedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('caActivatedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('ca-activate')" (click)="recordCaActivated()">Activate as CA</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Activated By</td>
                    <td>{{ latestEvent('activatedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('activatedAt')) || '—' }}</td>
                    <td><span class="auto-note">(auto on Activate)</span></td>
                  </tr>
                  <tr>
                    <td>Test Started By</td>
                    <td>{{ latestEvent('testStartedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('testStartedAt')) || '—' }}</td>
                    <td><span class="auto-note">(auto on Test)</span></td>
                  </tr>
                  <tr>
                    <td>Re-Activated By</td>
                    <td>{{ latestEvent('reactivatedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('reactivatedAt')) || '—' }}</td>
                    <td><span class="auto-note">(auto on Re-Activate)</span></td>
                  </tr>
                  <tr>
                    <td>Requestor Transferred</td>
                    <td>
                      @if (latestEvent('transferredFrom') || latestEvent('transferredTo')) {
                        {{ latestEvent('transferredFrom') || '?' }} → {{ latestEvent('transferredTo') || '?' }}
                      } @else { — }
                    </td>
                    <td>{{ formatTime(latestEvent('transferredAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('transfer')" (click)="openTransferDialog()">Transfer…</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Requestor Accepted By</td>
                    <td>{{ latestEvent('acceptedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('acceptedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('accept')" (click)="recordAccepted()">Accept</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Requestor Released By</td>
                    <td>{{ latestEvent('requestorReleasedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('requestorReleasedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('release')" (click)="recordRequestorReleased()">Release</button>
                    </td>
                  </tr>
                  <tr>
                    <td>CA Released By</td>
                    <td>{{ latestEvent('controlAuthorityReleasedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('controlAuthorityReleasedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('release-ca')" (click)="recordCAReleased()">Release CA</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Locks Removed By</td>
                    <td>{{ latestEvent('locksRemovedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('locksRemovedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('remove-locks')" (click)="recordLocksRemoved()">Remove Locks</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Closed By</td>
                    <td>{{ latestEvent('closedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('closedAt')) || '—' }}</td>
                    <td><span class="auto-note">(auto on Close)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Transfer dialog -->
            @if (showTransferDialog()) {
              <div class="dialog-backdrop" (click)="showTransferDialog.set(false)">
                <div class="dialog" (click)="$event.stopPropagation()">
                  <h3>Transfer Requestor</h3>
                  <div class="dialog-row">
                    <label>From:</label>
                    <input type="text" [value]="entity().lotoRequestor || ''" disabled>
                  </div>
                  <div class="dialog-row">
                    <label>To:</label>
                    <input type="text" [(ngModel)]="transferTo" placeholder="New requestor name">
                  </div>
                  <div class="dialog-actions">
                    <button mat-stroked-button (click)="showTransferDialog.set(false)">Cancel</button>
                    <button mat-raised-button color="primary" [disabled]="!transferTo()" (click)="confirmTransfer()">Confirm Transfer</button>
                  </div>
                </div>
              </div>
            }
          </mat-tab>
          <mat-tab label="Procedure Log">
            <div class="procedure-log-panel">
              @if ((entity().lotoPoints?.length ?? 0) === 0) {
                <p class="empty-text">No LOTO points on this permit.</p>
              } @else {
                <table class="procedure-log-table">
                  <thead>
                    <tr>
                      <th style="width: 10%">Tag #</th>
                      <th style="width: 18%">Description</th>
                      <th>Hung</th>
                      <th>Verified</th>
                      <th>Walked-down</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of entity().lotoPoints; track p.id) {
                      <tr>
                        <td>{{ p.tagNumber }}</td>
                        <td>{{ p.description }}</td>
                        <td>{{ describePointAction('HANG', p.id) }}</td>
                        <td>{{ describePointAction('VERIFY', p.id) }}</td>
                        <td>{{ describePointAction('WALKDOWN', p.id) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </mat-tab>
          <mat-tab label="History ({{ entity().snapshots?.length || 0 }})">
            <div class="snapshot-panel">
              @if ((entity().snapshots?.length ?? 0) === 0) {
                <p class="empty-text">No snapshots yet — they're created on each status transition.</p>
              } @else {
                <table class="snapshot-table">
                  <thead>
                    <tr><th>Date</th><th>Reason</th><th>Status</th><th>Events</th></tr>
                  </thead>
                  <tbody>
                    @for (s of sortedSnapshots(); track s.id) {
                      <tr>
                        <td>{{ formatTime(s.dateCreated) }}</td>
                        <td>{{ s.snapshotReason || '—' }}</td>
                        <td>{{ s.status || '—' }}</td>
                        <td class="events-cell">{{ describeEvents(s) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </mat-tab>
        </mat-tab-group>

        @if (procedureMode()) {
          <app-guided-procedure-window
            [loto]="entity()"
            [mode]="procedureMode()!"
            (closed)="procedureMode.set(null)"
            (lotoChanged)="onLotoChangedFromProcedure($event)">
          </app-guided-procedure-window>
        }
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

    .lifecycle-panel { padding: 16px; }
    .lifecycle-table { width: 100%; border-collapse: collapse; }
    .lifecycle-table th, .lifecycle-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; font-size: 13px; }
    .lifecycle-table th { color: #aaa; font-weight: 500; }
    .lifecycle-table td:first-child { color: #ccc; font-weight: 600; width: 22%; }
    .auto-note { color: #777; font-style: italic; font-size: 12px; }
    .progress-note { margin-left: 10px; color: #888; font-size: 12px; }


    .close-disposition {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      border-radius: 6px; margin: 8px 12px 0; font-size: 13px;
    }
    .close-disposition.disposition-ok { background: rgba(46, 125, 50, 0.18); border: 1px solid #2e7d32; color: #c8e6c9; }
    .close-disposition.disposition-warn { background: rgba(245, 124, 0, 0.18); border: 1px solid #f57c00; color: #ffe0b2; }
    .close-disposition span { flex: 1; }

    .procedure-log-panel { padding: 16px; }
    .procedure-log-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .procedure-log-table th, .procedure-log-table td { padding: 8px; text-align: left; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
    .procedure-log-table th { color: #aaa; font-weight: 500; background: #181818; }
    .aggregate-btn { margin-left: 8px; }
    .badge-completed { background: #2e7d32; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-active { background: #f57c00; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }

    .snapshot-table { width: 100%; border-collapse: collapse; }
    .snapshot-table th, .snapshot-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; font-size: 13px; vertical-align: top; }
    .snapshot-table th { color: #aaa; font-weight: 500; }
    .snapshot-table .events-cell { color: #ccc; max-width: 50ch; }

    .dialog-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center; z-index: 3000;
    }
    .dialog {
      background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 8px;
      padding: 20px; width: min(440px, 90vw); display: flex; flex-direction: column; gap: 12px;
    }
    .dialog h3 { margin: 0; color: #82b1ff; }
    .dialog-row { display: flex; align-items: center; gap: 10px; }
    .dialog-row label { width: 60px; color: #aaa; }
    .dialog-row input { flex: 1; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; padding: 6px 8px; }
    .dialog-row input:disabled { opacity: 0.7; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  `],
})
export class RfLotoFormComponent {
  private currentService = inject(CurrentLotoService);
  private lotoService = inject(LotoService);
  private lotoStandardService = inject(LotoStandardService);
  private router = inject(Router);

  showStandardSelector = signal(false);
  showSignOnForm = signal(false);
  showTransferDialog = signal(false);
  transferTo = signal('');
  standards = signal<LotoStandardDto[]>([]);
  loadingStandards = signal(false);

  sortedSnapshots = computed(() => {
    const list = this.entity().snapshots ?? [];
    return [...list].sort((a, b) => {
      const ta = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const tb = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return tb - ta; // newest first
    });
  });

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
    if (!entity?.id) return;
    const current = this.statusName();
    const action = status === current ? `re-apply ${status}` : `change status from ${current} to ${status}`;
    if (!confirm(`Are you sure you want to ${action}? This is an irreversible operation.`)) return;
    this.lotoService.changeStatus(entity.id, status).subscribe(res => {
      if (res.responseData) {
        const updated = LotoDto.fromJson(res.responseData);
        this.currentService.updateLotoInList(updated);
        this.currentService.setCurrentLoto(updated);
      }
    });
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

  // ----- Lifecycle helpers -----

  /**
   * Returns the most recent non-null value of the given field across all snapshots
   * (newest snapshot first). Used to display "current state" in the Lifecycle panel.
   */
  latestEvent(field: keyof LotoSnapshotDto): string | null {
    const snaps = [...(this.entity().snapshots ?? [])].sort((a, b) => {
      const ta = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const tb = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return tb - ta;
    });
    for (const s of snaps) {
      const v = (s as any)[field];
      if (v != null && v !== '') return String(v);
    }
    return null;
  }

  formatTime(s: string | null): string {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString();
  }

  canRecord(event: 'ca-approve-hanging' | 'ca-activate' | 'hung' | 'verified' | 'point-hung' | 'point-verified' | 'transfer' | 'accept' | 'release' | 'release-ca' | 'remove-locks'): boolean {
    const s = this.statusName();
    if (s === 'Closed') return false;
    switch (event) {
      case 'ca-approve-hanging':
        return s === 'Building' && !this.latestEvent('caApprovedForHangingBy');
      case 'point-hung':
        return s === 'Building' && !!this.latestEvent('caApprovedForHangingBy');
      case 'hung':
        return s === 'Building'
          && !!this.latestEvent('caApprovedForHangingBy')
          && this.allPointsHung()
          && (this.entity().lotoPoints?.length ?? 0) > 0;
      case 'point-verified':
        return s === 'Building';
      case 'verified':
        return s === 'Building'
          && this.allPointsVerified()
          && (this.entity().lotoPoints?.length ?? 0) > 0;
      case 'ca-activate':
        // CA can activate once Hung + Verified are recorded, and not yet activated
        return s === 'Building'
          && !!this.latestEvent('hungBy')
          && !!this.latestEvent('verifiedBy')
          && !this.latestEvent('caActivatedBy');
      case 'transfer':
      case 'accept':
      case 'release':
      case 'release-ca':
        return s === 'Active' || s === 'Test' || s === 'Building';
      case 'remove-locks':
        return s === 'Active' || s === 'Test';
    }
    return false;
  }

  // ---- Per-point helpers ----

  /**
   * Returns the latest snapshot's per-point map for the given key
   * (newest snapshot first; first non-empty wins, since clearLifecycleEventFields()
   * resets these on each new snapshot).
   */
  private latestPointMap(field:
        'pointHungBy' | 'pointHungAt' | 'pointHangNotes'
      | 'pointVerifiedBy' | 'pointVerifiedAt' | 'pointVerifyNotes'
      | 'pointWalkdownBy' | 'pointWalkdownAt' | 'pointWalkdownNotes'): Record<number, string> {
    const snaps = [...(this.entity().snapshots ?? [])].sort((a, b) => {
      const ta = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const tb = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return tb - ta;
    });
    for (const s of snaps) {
      const m = (s as any)[field];
      if (m && Object.keys(m).length > 0) return m;
    }
    return {};
  }

  pointHungBy(pointId: number): string | null { return this.latestPointMap('pointHungBy')[pointId] ?? null; }
  pointHungAt(pointId: number): string | null { return this.latestPointMap('pointHungAt')[pointId] ?? null; }
  pointVerifiedBy(pointId: number): string | null { return this.latestPointMap('pointVerifiedBy')[pointId] ?? null; }
  pointVerifiedAt(pointId: number): string | null { return this.latestPointMap('pointVerifiedAt')[pointId] ?? null; }

  isPointHung(pointId: number): boolean { return !!this.pointHungBy(pointId); }
  isPointVerified(pointId: number): boolean { return !!this.pointVerifiedBy(pointId); }
  isPointWalkedDown(pointId: number): boolean { return !!this.latestPointMap('pointWalkdownBy')[pointId]; }

  allPointsHung(): boolean {
    const points = this.entity().lotoPoints ?? [];
    if (points.length === 0) return false;
    return points.every(p => this.isPointHung(p.id));
  }

  allPointsVerified(): boolean {
    const points = this.entity().lotoPoints ?? [];
    if (points.length === 0) return false;
    return points.every(p => this.isPointVerified(p.id));
  }

  pointsHungProgress(): string {
    const points = this.entity().lotoPoints ?? [];
    if (points.length === 0) return '';
    const hung = points.filter(p => this.isPointHung(p.id)).length;
    return `${hung} of ${points.length} hung`;
  }

  pointsVerifiedProgress(): string {
    const points = this.entity().lotoPoints ?? [];
    if (points.length === 0) return '';
    const verified = points.filter(p => this.isPointVerified(p.id)).length;
    return `${verified} of ${points.length} verified`;
  }

  describeEvents(s: LotoSnapshotDto): string {
    const parts: string[] = [];
    const add = (label: string, by: string | null, at: string | null) => {
      if (by || at) parts.push(`${label}: ${by ?? '?'} (${this.formatTime(at) || '?'})`);
    };
    add('CA Approved Hanging', s.caApprovedForHangingBy, s.caApprovedForHangingAt);
    add('Hung', s.hungBy, s.hungAt);
    add('Verified', s.verifiedBy, s.verifiedAt);
    add('CA Activated', s.caActivatedBy, s.caActivatedAt);
    add('Activated', s.activatedBy, s.activatedAt);
    add('Test Started', s.testStartedBy, s.testStartedAt);
    add('Re-Activated', s.reactivatedBy, s.reactivatedAt);
    if (s.transferredFrom || s.transferredTo) {
      parts.push(`Transferred: ${s.transferredFrom ?? '?'} → ${s.transferredTo ?? '?'} (${this.formatTime(s.transferredAt) || '?'})`);
    }
    add('Accepted', s.acceptedBy, s.acceptedAt);
    add('Requestor Released', s.requestorReleasedBy, s.requestorReleasedAt);
    add('CA Released', s.controlAuthorityReleasedBy, s.controlAuthorityReleasedAt);
    add('Locks Removed', s.locksRemovedBy, s.locksRemovedAt);
    add('Closed', s.closedBy, s.closedAt);
    return parts.join('  •  ') || '—';
  }

  private applyLifecycleResponse(res: any): void {
    if (res?.responseData) {
      const updated = LotoDto.fromJson(res.responseData);
      this.currentService.updateLotoInList(updated);
      this.currentService.setCurrentLoto(updated);
    }
  }

  recordCaApprovedForHanging(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.approveForHanging(id).subscribe({
      next: res => this.applyLifecycleResponse(res),
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  recordCaActivated(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.caActivate(id).subscribe({
      next: res => this.applyLifecycleResponse(res),
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  recordHung(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.markHung(id).subscribe({
      next: res => this.applyLifecycleResponse(res),
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  recordVerified(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.markVerified(id).subscribe(res => this.applyLifecycleResponse(res));
  }

  openTransferDialog(): void {
    this.transferTo.set('');
    this.showTransferDialog.set(true);
  }

  confirmTransfer(): void {
    const id = this.entity().id;
    if (!id) return;
    const to = this.transferTo();
    if (!to) return;
    const from = this.entity().lotoRequestor || null;
    this.lotoService.transferRequestor(id, from, to).subscribe(res => {
      this.applyLifecycleResponse(res);
      this.showTransferDialog.set(false);
    });
  }

  recordAccepted(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.acceptRequestor(id).subscribe(res => this.applyLifecycleResponse(res));
  }

  recordRequestorReleased(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.releaseByRequestor(id).subscribe(res => this.applyLifecycleResponse(res));
  }

  recordCAReleased(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.releaseByControlAuthority(id).subscribe(res => this.applyLifecycleResponse(res));
  }

  recordLocksRemoved(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.removeLocks(id).subscribe(res => this.applyLifecycleResponse(res));
  }

  // ── Guided procedure (hang / verify / walkdown) ───────────────────────────

  procedureMode = signal<GuidedProcedureMode | null>(null);

  canStartProcedure(mode: GuidedProcedureMode): boolean {
    if (!this.entity().id) return false;
    if (this.statusName() !== 'Building') return false;
    if (mode === 'HANG') {
      // Need CA approval before hanging.
      return !!this.latestEvent('caApprovedForHangingBy');
    }
    if (mode === 'VERIFY') {
      // Verify only after every point is hung.
      return this.allPointsHung();
    }
    // Walkdown — only after every point is verified.
    return this.allPointsVerified();
  }

  openProcedure(mode: GuidedProcedureMode): void {
    if (!this.canStartProcedure(mode)) return;
    this.procedureMode.set(mode);
  }

  onLotoChangedFromProcedure(updated: LotoDto): void {
    this.currentService.updateLotoInList(updated);
    this.currentService.setCurrentLoto(updated);
  }

  walkdownDoneCount(): number {
    return Object.keys(this.latestPointMap('pointWalkdownBy')).length;
  }

  latestWalkdownAt(): string | null {
    const map = this.latestPointMap('pointWalkdownAt');
    let latest: string | null = null;
    for (const v of Object.values(map)) {
      if (!v) continue;
      if (!latest || v > latest) latest = v;
    }
    return latest;
  }

  /** Procedure-log cell text for one point in one mode. */
  describePointAction(mode: GuidedProcedureMode, pointId: number): string {
    const byMap =
      mode === 'HANG'   ? this.latestPointMap('pointHungBy') :
      mode === 'VERIFY' ? this.latestPointMap('pointVerifiedBy') :
                          this.latestPointMap('pointWalkdownBy');
    const atMap =
      mode === 'HANG'   ? this.latestPointMap('pointHungAt') :
      mode === 'VERIFY' ? this.latestPointMap('pointVerifiedAt') :
                          this.latestPointMap('pointWalkdownAt');
    const notesMap =
      mode === 'HANG'   ? this.latestPointMap('pointHangNotes') :
      mode === 'VERIFY' ? this.latestPointMap('pointVerifyNotes') :
                          this.latestPointMap('pointWalkdownNotes');
    const by = byMap[pointId];
    if (!by) return '—';
    const at = this.formatTime(atMap[pointId] ?? '') || '?';
    const notes = notesMap[pointId];
    return `✓ ${by} (${at})${notes ? ' — ' + notes : ''}`;
  }

  // ── Close-time disposition ────────────────────────────────────────────────

  closeDispositionMessage = computed(() => {
    if (this.statusName() !== 'Closed') return null;
    if (this.entity().closeDisposition === 'READY_FOR_APPROVAL') {
      return 'No modifications during Active. Source standard is ready for approval.';
    }
    if (this.entity().closeDisposition === 'NEEDS_REVIEW') {
      return 'Modifications occurred during Active. Test possibly failed — consider applying the modifications back to the source standard.';
    }
    return null;
  });

  proposeChangesToStandard(): void {
    const stdId = this.entity().sourceStandardId;
    if (!stdId) { alert('This LOTO has no source standard.'); return; }
    this.router.navigate(['/loto/loto-standards'], { queryParams: { standardId: stdId } });
  }
}
