import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto, PersonnelSignEntry } from '../../../models/loto/loto.model';
import { LotoSnapshotDto, PointPrerequisiteDto } from '../../../models/loto/loto-snapshot.model';
import { WalkdownChecklistDto } from '../../../models/loto/walkdown-checklist.model';
import { WalkdownService } from '../../../services/loto/walkdown.service';
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
                      <button mat-stroked-button [disabled]="!canRecord('hung')" (click)="recordHung()">Sign as Hung</button>
                      <span class="progress-note">{{ pointsHungProgress() }}</span>
                    </td>
                  </tr>
                  <tr class="point-list-row">
                    <td colspan="4">
                      <details open>
                        <summary>Per-point Hung status</summary>
                        @if (entity().lotoPoints?.length) {
                          <table class="point-status-table">
                            <thead><tr><th>Tag #</th><th>Description</th><th>Prerequisites</th><th>Hung By</th><th>At</th><th></th></tr></thead>
                            <tbody>
                              @for (p of entity().lotoPoints; track p.id) {
                                <tr [class.point-done]="isPointHung(p.id)" [class.point-blocked]="!isPointHung(p.id) && hangPredecessorBlock(p.id)">
                                  <td>{{ p.tagNumber }}</td>
                                  <td>{{ p.description }}</td>
                                  <td>
                                    @if (hangPredecessorBlock(p.id); as block) {
                                      <div class="prereq-block">⏸ {{ block }}</div>
                                    }
                                    @for (cond of safetyConditionsFor(p.id); track cond) {
                                      <label class="cond-row">
                                        <input type="checkbox"
                                               [disabled]="isPointHung(p.id) || !canRecord('point-hung')"
                                               [checked]="isHangCondAcked(p.id, cond)"
                                               (change)="toggleHangCond(p.id, cond)">
                                        <span>{{ cond }}</span>
                                      </label>
                                    }
                                  </td>
                                  <td>{{ pointHungBy(p.id) || '—' }}</td>
                                  <td>{{ formatTime(pointHungAt(p.id)) || '—' }}</td>
                                  <td>
                                    @if (!isPointHung(p.id)) {
                                      <button mat-stroked-button
                                              [disabled]="!canMarkPointHung(p.id)"
                                              (click)="markPointHung(p.id)">Mark Hung</button>
                                    } @else {
                                      <span class="check">✓</span>
                                    }
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        } @else {
                          <p class="empty-text">No LOTO points.</p>
                        }
                      </details>
                    </td>
                  </tr>
                  <tr>
                    <td>Verified By</td>
                    <td>{{ latestEvent('verifiedBy') || '—' }}</td>
                    <td>{{ formatTime(latestEvent('verifiedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('verified')" (click)="recordVerified()">Sign as Verified</button>
                      <span class="progress-note">{{ pointsVerifiedProgress() }}</span>
                    </td>
                  </tr>
                  <tr class="point-list-row">
                    <td colspan="4">
                      <details open>
                        <summary>Per-point Verified status</summary>
                        @if (entity().lotoPoints?.length) {
                          <table class="point-status-table">
                            <thead><tr><th>Tag #</th><th>Description</th><th>Prerequisites</th><th>Verified By</th><th>At</th><th></th></tr></thead>
                            <tbody>
                              @for (p of entity().lotoPoints; track p.id) {
                                <tr [class.point-done]="isPointVerified(p.id)" [class.point-blocked]="!isPointVerified(p.id) && verifyPredecessorBlock(p.id)">
                                  <td>{{ p.tagNumber }}</td>
                                  <td>{{ p.description }}</td>
                                  <td>
                                    @if (verifyPredecessorBlock(p.id); as block) {
                                      <div class="prereq-block">⏸ {{ block }}</div>
                                    }
                                    @for (cond of safetyConditionsFor(p.id); track cond) {
                                      <label class="cond-row">
                                        <input type="checkbox"
                                               [disabled]="isPointVerified(p.id) || !canRecord('point-verified')"
                                               [checked]="isVerifyCondAcked(p.id, cond)"
                                               (change)="toggleVerifyCond(p.id, cond)">
                                        <span>{{ cond }}</span>
                                      </label>
                                    }
                                  </td>
                                  <td>{{ pointVerifiedBy(p.id) || '—' }}</td>
                                  <td>{{ formatTime(pointVerifiedAt(p.id)) || '—' }}</td>
                                  <td>
                                    @if (!isPointVerified(p.id)) {
                                      <button mat-stroked-button
                                              [disabled]="!canMarkPointVerified(p.id)"
                                              (click)="markPointVerified(p.id)">Mark Verified</button>
                                    } @else {
                                      <span class="check">✓</span>
                                    }
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        } @else {
                          <p class="empty-text">No LOTO points.</p>
                        }
                      </details>
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
          <mat-tab label="Walkdowns ({{ walkdowns().length }})">
            <div class="walkdown-panel">
              <div class="walkdown-header">
                <h3>Walkdowns</h3>
                <button mat-raised-button color="primary"
                        [disabled]="!canStartWalkdown()"
                        (click)="startWalkdown()">
                  <mat-icon>add</mat-icon> Start Walkdown
                </button>
              </div>

              @if (walkdowns().length === 0) {
                <p class="empty-text">No walkdowns yet. Start one once the LOTO has been hung.</p>
              }

              @for (w of walkdowns(); track w.id) {
                <div class="walkdown-card" [class.completed]="w.completed">
                  <div class="walkdown-card-header">
                    <strong>Walkdown #{{ w.id }}</strong>
                    @if (w.completed) {
                      <span class="badge-completed">COMPLETED</span>
                    } @else {
                      <span class="badge-active">IN PROGRESS</span>
                    }
                    <span class="walkdown-meta">
                      Requested by {{ w.requestedBy }} at {{ formatTime(w.requestedAt) }}
                      @if (w.completed) {
                        · Completed by {{ w.completedBy }} at {{ formatTime(w.completedAt) }}
                      }
                    </span>
                    <span class="spacer"></span>
                    <button mat-stroked-button (click)="printWalkdown(w)">
                      <mat-icon>print</mat-icon> Print
                    </button>
                  </div>

                  <table class="walkdown-points-table">
                    <thead>
                      <tr><th style="width: 14%">Tag #</th><th style="width: 36%">Description</th><th style="width: 12%">Checked</th><th style="width: 18%">By</th><th>At</th></tr>
                    </thead>
                    <tbody>
                      @for (p of orderedPointsFor(w); track p.id) {
                        <tr [class.point-checked]="walkdownPointChecked(w, p.id)">
                          <td>{{ p.tagNumber }}</td>
                          <td>{{ p.description }}</td>
                          <td>
                            <input type="checkbox"
                                   [disabled]="w.completed"
                                   [checked]="walkdownPointChecked(w, p.id)"
                                   (change)="toggleWalkdownPoint(w, p.id, $any($event.target).checked)">
                          </td>
                          <td>{{ walkdownPointBy(w, p.id) || '—' }}</td>
                          <td>{{ formatTime(walkdownPointAt(w, p.id)) || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>

                  @if (!w.completed) {
                    <div class="walkdown-actions">
                      <button mat-raised-button color="primary"
                              [disabled]="!walkdownAllChecked(w)"
                              (click)="completeWalkdown(w)">
                        Complete &amp; Lock
                      </button>
                      <span class="walkdown-progress">{{ walkdownProgressText(w) }}</span>
                    </div>
                  }
                </div>
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

    .point-list-row td { background: #141414; padding: 4px 12px 12px; }
    .point-list-row summary { cursor: pointer; color: #999; font-size: 12px; padding: 6px 0; }
    .point-list-row summary:hover { color: #ccc; }

    .point-status-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .point-status-table th, .point-status-table td { padding: 5px 8px; text-align: left; border-bottom: 1px solid #2a2a2a; font-size: 12px; }
    .point-status-table th { color: #888; font-weight: 500; }
    .point-status-table tr.point-done { color: #999; background: rgba(46, 125, 50, 0.07); }
    .point-status-table tr.point-blocked { background: rgba(255, 152, 0, 0.06); }
    .point-status-table .check { color: #66bb6a; font-weight: bold; }
    .prereq-block { color: #ffb74d; font-size: 11px; margin-bottom: 4px; }
    .cond-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #ccc; padding: 2px 0; }
    .cond-row input[type="checkbox"] { margin: 0; }

    .close-disposition {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      border-radius: 6px; margin: 8px 12px 0; font-size: 13px;
    }
    .close-disposition.disposition-ok { background: rgba(46, 125, 50, 0.18); border: 1px solid #2e7d32; color: #c8e6c9; }
    .close-disposition.disposition-warn { background: rgba(245, 124, 0, 0.18); border: 1px solid #f57c00; color: #ffe0b2; }
    .close-disposition span { flex: 1; }

    .walkdown-panel { padding: 16px; }
    .walkdown-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .walkdown-header h3 { margin: 0; color: #82b1ff; }
    .walkdown-card { background: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .walkdown-card.completed { opacity: 0.85; border-color: #2e7d32; background: #16201a; }
    .walkdown-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .walkdown-card-header strong { color: #ddd; }
    .walkdown-meta { color: #888; font-size: 12px; flex-shrink: 0; }
    .walkdown-card-header .spacer { flex: 1; }
    .badge-completed { background: #2e7d32; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-active { background: #f57c00; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .walkdown-points-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .walkdown-points-table th, .walkdown-points-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #2a2a2a; }
    .walkdown-points-table th { color: #aaa; font-weight: 500; }
    .walkdown-points-table tr.point-checked { color: #999; background: rgba(46, 125, 50, 0.07); }
    .walkdown-actions { display: flex; align-items: center; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #2a2a2a; }
    .walkdown-progress { color: #888; font-size: 12px; }

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
  private walkdownService = inject(WalkdownService);
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
  private latestPointMap(field: 'pointHungBy' | 'pointHungAt' | 'pointVerifiedBy' | 'pointVerifiedAt'): Record<number, string> {
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

  // ---- Prerequisites ----

  /** Read prereq spec from the latest snapshot's pointPrerequisites map. */
  private prereqFor(pointId: number): PointPrerequisiteDto | null {
    const snaps = [...(this.entity().snapshots ?? [])].sort((a, b) => {
      const ta = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const tb = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return tb - ta;
    });
    const latest = snaps[0];
    if (!latest || !latest.pointPrerequisites) return null;
    return latest.pointPrerequisites[pointId] ?? null;
  }

  safetyConditionsFor(pointId: number): string[] {
    const spec = this.prereqFor(pointId);
    return spec?.safetyConditions ?? [];
  }

  /**
   * Returns a human-readable predecessor block message if any required predecessor
   * point isn't yet hung; null when all are satisfied (or no prereqs declared).
   */
  hangPredecessorBlock(pointId: number): string | null {
    const spec = this.prereqFor(pointId);
    if (!spec || !spec.requiredPointIds?.length) return null;
    const points = this.entity().lotoPoints ?? [];
    const tagFor = (id: number) => points.find(p => p.id === id)?.tagNumber ?? `#${id}`;
    const missing = spec.requiredPointIds.filter(id => !this.isPointHung(id));
    if (missing.length === 0) return null;
    return `Hang first: ${missing.map(tagFor).join(', ')}`;
  }

  verifyPredecessorBlock(pointId: number): string | null {
    const spec = this.prereqFor(pointId);
    if (!spec || !spec.requiredPointIds?.length) return null;
    const points = this.entity().lotoPoints ?? [];
    const tagFor = (id: number) => points.find(p => p.id === id)?.tagNumber ?? `#${id}`;
    const missing = spec.requiredPointIds.filter(id => !this.isPointVerified(id));
    if (missing.length === 0) return null;
    return `Verify first: ${missing.map(tagFor).join(', ')}`;
  }

  // Per-point in-memory acknowledgement state (cleared on point save).
  private hangAckMap = signal<Record<number, Set<string>>>({});
  private verifyAckMap = signal<Record<number, Set<string>>>({});

  isHangCondAcked(pointId: number, cond: string): boolean {
    return this.hangAckMap()[pointId]?.has(cond) ?? false;
  }

  isVerifyCondAcked(pointId: number, cond: string): boolean {
    return this.verifyAckMap()[pointId]?.has(cond) ?? false;
  }

  toggleHangCond(pointId: number, cond: string): void {
    const map = { ...this.hangAckMap() };
    const set = new Set(map[pointId] ?? []);
    if (set.has(cond)) set.delete(cond); else set.add(cond);
    map[pointId] = set;
    this.hangAckMap.set(map);
  }

  toggleVerifyCond(pointId: number, cond: string): void {
    const map = { ...this.verifyAckMap() };
    const set = new Set(map[pointId] ?? []);
    if (set.has(cond)) set.delete(cond); else set.add(cond);
    map[pointId] = set;
    this.verifyAckMap.set(map);
  }

  /** True when the per-point Mark Hung button should be enabled for this point. */
  canMarkPointHung(pointId: number): boolean {
    if (!this.canRecord('point-hung')) return false;
    if (this.isPointHung(pointId)) return false;
    if (this.hangPredecessorBlock(pointId)) return false;
    const conds = this.safetyConditionsFor(pointId);
    return conds.every(c => this.isHangCondAcked(pointId, c));
  }

  canMarkPointVerified(pointId: number): boolean {
    if (!this.canRecord('point-verified')) return false;
    if (this.isPointVerified(pointId)) return false;
    if (this.verifyPredecessorBlock(pointId)) return false;
    const conds = this.safetyConditionsFor(pointId);
    return conds.every(c => this.isVerifyCondAcked(pointId, c));
  }

  isPointHung(pointId: number): boolean { return !!this.pointHungBy(pointId); }
  isPointVerified(pointId: number): boolean { return !!this.pointVerifiedBy(pointId); }

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

  markPointHung(pointId: number): void {
    const id = this.entity().id;
    if (!id) return;
    const acked = Array.from(this.hangAckMap()[pointId] ?? []);
    this.lotoService.markPointHung(id, pointId, acked).subscribe({
      next: res => {
        this.applyLifecycleResponse(res);
        // Clear in-memory ack state for this point — it's persisted now.
        const m = { ...this.hangAckMap() };
        delete m[pointId];
        this.hangAckMap.set(m);
      },
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  markPointVerified(pointId: number): void {
    const id = this.entity().id;
    if (!id) return;
    const acked = Array.from(this.verifyAckMap()[pointId] ?? []);
    this.lotoService.markPointVerified(id, pointId, acked).subscribe({
      next: res => {
        this.applyLifecycleResponse(res);
        const m = { ...this.verifyAckMap() };
        delete m[pointId];
        this.verifyAckMap.set(m);
      },
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

  // ── Walkdown ──────────────────────────────────────────────────────────────

  walkdowns = signal<WalkdownChecklistDto[]>([]);

  /**
   * Reload walkdowns whenever the current LOTO id changes. effect() is the right tool
   * here: it tracks signal reads and fires once per change, with no risk of being
   * triggered repeatedly by template reads.
   */
  private walkdownLoader = effect(() => {
    const id = this.entity().id;
    if (id) {
      this.walkdownService.listForLoto(id).subscribe({
        next: res => this.walkdowns.set((res.responseData ?? []).map(WalkdownChecklistDto.fromJson)),
        error: () => this.walkdowns.set([]),
      });
    } else {
      this.walkdowns.set([]);
    }
  }, { allowSignalWrites: true });

  canStartWalkdown(): boolean {
    if (!this.entity().id) return false;
    if (this.statusName() === 'Closed') return false;
    return !!this.latestEvent('hungBy');
  }

  startWalkdown(): void {
    const id = this.entity().id;
    if (!id) return;
    this.walkdownService.request(id).subscribe({
      next: res => {
        const w = WalkdownChecklistDto.fromJson(res.responseData);
        this.walkdowns.set([w, ...this.walkdowns()]);
      },
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  toggleWalkdownPoint(w: WalkdownChecklistDto, pointId: number, checked: boolean): void {
    if (w.completed || !w.id) return;
    this.walkdownService.checkPoint(w.id, pointId, checked).subscribe({
      next: res => {
        const updated = WalkdownChecklistDto.fromJson(res.responseData);
        this.walkdowns.set(this.walkdowns().map(x => x.id === updated.id ? updated : x));
      },
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  completeWalkdown(w: WalkdownChecklistDto): void {
    if (!w.id) return;
    if (!confirm('Complete and lock this walkdown? It cannot be modified after this.')) return;
    this.walkdownService.complete(w.id).subscribe({
      next: res => {
        const updated = WalkdownChecklistDto.fromJson(res.responseData);
        this.walkdowns.set(this.walkdowns().map(x => x.id === updated.id ? updated : x));
      },
      error: err => alert(err?.error?.message ?? err.message),
    });
  }

  orderedPointsFor(_w: WalkdownChecklistDto) {
    return this.entity().lotoPoints ?? [];
  }

  walkdownPointChecked(w: WalkdownChecklistDto, pointId: number): boolean {
    return !!w.pointStates?.[pointId]?.checked;
  }
  walkdownPointBy(w: WalkdownChecklistDto, pointId: number): string | null {
    return w.pointStates?.[pointId]?.checkedBy ?? null;
  }
  walkdownPointAt(w: WalkdownChecklistDto, pointId: number): string | null {
    return w.pointStates?.[pointId]?.checkedAt ?? null;
  }
  walkdownAllChecked(w: WalkdownChecklistDto): boolean {
    const points = this.entity().lotoPoints ?? [];
    if (points.length === 0) return false;
    return points.every(p => this.walkdownPointChecked(w, p.id));
  }
  walkdownProgressText(w: WalkdownChecklistDto): string {
    const total = (this.entity().lotoPoints ?? []).length;
    const done = (this.entity().lotoPoints ?? []).filter(p => this.walkdownPointChecked(w, p.id)).length;
    return `${done} of ${total} points checked`;
  }

  printWalkdown(w: WalkdownChecklistDto): void {
    const points = this.entity().lotoPoints ?? [];
    const rows = points.map(p => {
      const st = w.pointStates?.[p.id];
      const mark = st?.checked ? '✓' : '☐';
      const by = st?.checkedBy ?? '';
      const at = st?.checkedAt ? this.formatTime(st.checkedAt) : '';
      return `<tr><td>${p.tagNumber ?? ''}</td><td>${p.description ?? ''}</td><td style="text-align:center">${mark}</td><td>${by}</td><td>${at}</td></tr>`;
    }).join('');
    const html = `<html><head><title>Walkdown #${w.id}</title>
      <style>body{font-family:sans-serif;margin:24px}h1{color:#222;margin:0 0 8px}.meta{color:#555;margin-bottom:18px;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid #ccc;text-align:left}th{background:#f0f0f0}.notes{margin-top:18px;padding:10px;background:#f8f8f8;border-left:4px solid #888;white-space:pre-wrap}</style>
      </head><body><h1>Walkdown #${w.id}</h1>
      <div class="meta">Requested by ${w.requestedBy ?? '?'} at ${this.formatTime(w.requestedAt)}
      ${w.completed ? `· Completed by ${w.completedBy ?? '?'} at ${this.formatTime(w.completedAt)}` : '(IN PROGRESS)'}</div>
      <table><thead><tr><th>Tag #</th><th>Description</th><th>Checked</th><th>By</th><th>At</th></tr></thead><tbody>${rows}</tbody></table>
      ${w.notes ? `<div class="notes"><strong>Notes:</strong><br>${w.notes}</div>` : ''}
      </body></html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print(); }
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
