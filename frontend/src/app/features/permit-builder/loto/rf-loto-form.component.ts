import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { AuthService } from '../../../services/auth.service';
import { LotoDto, PersonnelSignEntry } from '../../../models/loto/loto.model';
import { LotoSnapshotDto } from '../../../models/loto/loto-snapshot.model';
import { GuidedProcedureWindowComponent, GuidedProcedureMode } from '../../../shared/loto/guided-procedure-window/guided-procedure-window.component';
import { StepUpDialogComponent } from '../../../shared/step-up/step-up-dialog.component';
import { WalkdownSessionService } from '../../../services/loto/walkdown-session.service';
import { WalkdownSessionDto } from '../../../models/loto/walkdown-session.model';
import { RfFormField } from '../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { LotoPointsPanelComponent } from './loto-points-panel/loto-points-panel.component';
import { LotoService } from '../../../services/loto/loto.service';
import { LotoStandardService } from '../../../services/loto/loto-standard.service';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { RfUserOptionService } from '../../users/services/rf-user-option.service';
import { GlobalMessageService } from '../../../shared/global-message/global-message.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { RfLotoPrintService } from '../../../services/ui/rf-loto-print.service';

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
    StepUpDialogComponent,
  ],
  template: `
    <div class="loto-form-container">
      <!-- Top toolbar — always visible -->
      <div class="toolbar">
        <button mat-stroked-button (click)="newLoto()">
          <mat-icon>add</mat-icon> New LOTO
        </button>
        <button mat-icon-button
                (click)="refreshRoles()"
                [title]="'Refresh session roles (' + (authService.currentUser?.roles?.join(\', \') || 'none') + ')'">
          <mat-icon>refresh</mat-icon>
        </button>

        @if (entity().id) {
          <span class="status-chip" data-testid="permit-status" [class]="'status-' + statusName().toLowerCase()">
            {{ statusName() }}
          </span>
          @if (entity().boxNumber) {
            <span class="box-indicator">Box #{{ entity().boxNumber }}</span>
          }

          <!-- Status transition buttons (CA only) -->
          @if (authService.isControlAuthority()) {
            @if (statusName() === 'Building') {
              <button mat-raised-button color="warn" data-testid="status-activate" (click)="changeStatus('Active')">Activate</button>
              <button mat-stroked-button data-testid="status-close" (click)="changeStatus('Closed')">Close</button>
            }
            @if (statusName() === 'Active') {
              <button mat-raised-button color="accent"
                      data-testid="status-test"
                      [disabled]="currentlySignedOnCount() > 0"
                      [title]="currentlySignedOnCount() > 0 ? 'Sign everyone off first' : ''"
                      (click)="changeStatus('Test')">Test</button>
              <button mat-stroked-button
                      data-testid="status-modification"
                      [disabled]="currentlySignedOnCount() > 0"
                      [title]="currentlySignedOnCount() > 0 ? 'Sign everyone off first' : ''"
                      (click)="changeStatus('Modification')">Modify</button>
              <button mat-stroked-button data-testid="status-close" (click)="changeStatus('Closed')">Close</button>
            }
            @if (statusName() === 'Test' || statusName() === 'Modification') {
              <button mat-raised-button color="warn"
                      data-testid="status-reactivate"
                      [disabled]="!canReactivate()"
                      [title]="canReactivate() ? '' : reactivateBlockedReason()"
                      (click)="changeStatus('Active')">Re-Activate</button>
              <button mat-stroked-button data-testid="status-close" (click)="changeStatus('Closed')">Close</button>
            }
          }

          <!-- Print P&IDs — available to everyone once a permit is loaded.
               Rasterizes each P&ID with numbered highlighted shapes and
               opens the browser print dialog in a new tab. Same code
               path the LOTO Standard editor uses. -->
          <button mat-stroked-button
                  data-testid="print-pids"
                  (click)="onPrintPids()"
                  [disabled]="isPrintingPids()"
                  [title]="'Print every P&ID for this permit with equipment shapes highlighted and numbered by point order'">
            <mat-icon>print</mat-icon>
            {{ isPrintingPids() ? 'Preparing…' : 'Print P&IDs' }}
          </button>
        }
      </div>

      <!-- Pending transfer banner -->
      @if (pendingTransferTo(); as recipient) {
        <div class="transfer-banner">
          <mat-icon>swap_horiz</mat-icon>
          <strong>Pending transfer:</strong>
          <span>{{ pendingTransferFrom() || '?' }} → {{ recipient }}</span>
          <span class="spacer"></span>
          @if (isCurrentUserPendingTransferee()) {
            <button mat-raised-button color="primary" (click)="acceptTransfer()">
              <mat-icon>check</mat-icon> Accept Transfer as {{ recipient }}
            </button>
          } @else {
            <!-- Anyone (recipient on a shared tablet) can accept via step-up PIN -->
            <button mat-stroked-button color="primary" (click)="openStepUpForAccept()">
              <mat-icon>vpn_key</mat-icon> Accept (sign in)
            </button>
          }
          @if (isCurrentUserRequestor()) {
            <button mat-stroked-button (click)="cancelPendingTransfer()">
              <mat-icon>close</mat-icon> Cancel
            </button>
          }
        </div>
      }

      <!-- Step-up authorization dialog (one-shot PIN entry) -->
      @if (stepUpContext()) {
        <app-step-up-dialog
          [actionLabel]="stepUpContext()!.label"
          (authorized)="onStepUpAuthorized($event)"
          (cancelled)="stepUpContext.set(null)">
        </app-step-up-dialog>
      }

      <!-- CREATE VIEW — shown when no entity is selected -->
      @if (!entity().id) {
        <div class="create-panel">
          <h3>Create LOTO Permit</h3>

          @if (!showStandardSelector()) {
            <div class="create-actions">
              <button mat-raised-button color="primary" data-testid="create-from-standard-btn" (click)="loadStandardsAndShow()">
                <mat-icon>library_books</mat-icon> From Standard
              </button>
              <button mat-stroked-button data-testid="create-from-scratch-btn" (click)="createFromScratch()">
                <mat-icon>edit_note</mat-icon> From Scratch
              </button>
            </div>
          }

          @if (showStandardSelector()) {
            <div class="standard-selector" (keydown.escape)="showStandardSelector.set(false)">
              <div class="selector-header">
                <h4>Select a LOTO Standard</h4>
                <button mat-icon-button (click)="showStandardSelector.set(false)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              @if (loadingStandards()) {
                <p class="loading-text">Loading standards...</p>
              } @else if (standards().length === 0) {
                <div class="empty-standards">
                  <p class="loading-text">No LOTO standards found.</p>
                  <p class="empty-standards-hint">A LOTO Standard defines the reusable set of points for a piece of equipment. Create one first, then come back here.</p>
                  <button mat-stroked-button color="primary" (click)="openLotoStandardsPage()">
                    <mat-icon>library_books</mat-icon> Manage LOTO Standards
                  </button>
                </div>
              } @else {
                <input class="standard-search" type="text" placeholder="Filter by name or description…"
                       autofocus
                       [value]="stdSearch()"
                       (input)="stdSearch.set(($any($event.target)).value)">
                @if (filteredStandards().length === 0) {
                  <p class="loading-text">No standards match “{{ stdSearch() }}”.</p>
                } @else {
                  <div class="standard-list">
                    @for (std of filteredStandards(); track std.id) {
                      <div class="standard-item" [attr.data-testid]="'standard-item-' + std.id" (click)="createFromStandard(std.id)">
                        <mat-icon>checklist</mat-icon>
                        <div class="standard-info">
                          <span class="standard-name">{{ std.name || 'Standard #' + std.id }}</span>
                          <span class="standard-desc">{{ $any(std).description || '' }} — {{ std.lotoPoints?.length || 0 }} points</span>
                        </div>
                      </div>
                    }
                  </div>
                }
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
              (formValueChange)="onFormValueChange($event)"
              (formSubmit)="onSubmit($event)"
              (formDelete)="onDelete()"
            ></app-rf-reactive-form>
            @if (autoSaveStatus()) {
              <div class="autosave-indicator">{{ autoSaveStatus() }}</div>
            }
          </mat-tab>
          <mat-tab label="LOTO Points">
            <app-loto-points-panel></app-loto-points-panel>
          </mat-tab>
          <mat-tab label="Personnel ({{ currentlySignedOnCount() }}/{{ entity().personnel?.length || 0 }})">
            <div class="personnel-panel">
              <div class="personnel-status-banner" [class.warn]="!canSignOn()">
                <strong>{{ currentlySignedOnCount() }}</strong> currently signed on
                @if (!canSignOn(); as _) {
                  <span class="status-note">— {{ signOnBlockedReason() }}</span>
                }
              </div>
              <div class="personnel-actions">
                <button mat-raised-button color="primary"
                        [disabled]="!canSignOn()"
                        (click)="openSignOn()">
                  <mat-icon>person_add</mat-icon> Sign On
                </button>
                @if (isCurrentUserSignedOn()) {
                  <button mat-stroked-button color="warn" class="self-off-btn"
                          (click)="signOffSelf()">
                    <mat-icon>logout</mat-icon> Sign Off (me)
                  </button>
                }
              </div>
              @if (showSignOnForm()) {
                <div class="sign-on-form">
                  <input #nameInput placeholder="Name" class="form-input" [value]="defaultSignOnName()">
                  <input #roleInput placeholder="Role" class="form-input">
                  <input #companyInput placeholder="Company" class="form-input">
                  <button mat-raised-button (click)="signOn(nameInput.value || defaultSignOnName(), roleInput.value, companyInput.value); showSignOnForm.set(false); nameInput.value=''; roleInput.value=''; companyInput.value=''">
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
                    <td>{{ formatAuditBy(latestEvent('caApprovedForHangingBy')) }}</td>
                    <td>{{ formatTime(latestEvent('caApprovedForHangingAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button data-testid="ca-approve-hanging-btn" [disabled]="!canRecord('ca-approve-hanging')" (click)="recordCaApprovedForHanging()">Approve for Hanging</button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="ca-approve-hanging-pin-btn"
                              [disabled]="!canStepUpApproveHanging()"
                              (click)="openStepUp('ca-approve-hanging', 'CA: Approve for Hanging')">
                        <mat-icon>vpn_key</mat-icon> (PIN)
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Hung By</td>
                    <td>{{ formatAuditBy(latestEvent('hungBy')) }}</td>
                    <td>{{ formatTime(latestEvent('hungAt')) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              data-testid="start-hanging-btn"
                              [disabled]="!canStartProcedure('HANG')"
                              (click)="openProcedure('HANG')">
                        <mat-icon>lock</mat-icon> Start Hanging
                      </button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="mark-hung-btn"
                              [disabled]="!canRecord('hung')"
                              (click)="recordHung()">Sign as Hung</button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="mark-hung-pin-btn"
                              [disabled]="!canStepUpHung()"
                              (click)="openStepUp('mark-hung', 'Sign LOTO as Hung')">
                        <mat-icon>vpn_key</mat-icon> (PIN)
                      </button>
                      <span class="progress-note">{{ pointsHungProgress() }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Verified By</td>
                    <td>{{ formatAuditBy(latestEvent('verifiedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('verifiedAt')) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              data-testid="start-verifying-btn"
                              [disabled]="!canStartProcedure('VERIFY')"
                              (click)="openProcedure('VERIFY')">
                        <mat-icon>verified_user</mat-icon> Start Verifying
                      </button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="mark-verified-btn"
                              [disabled]="!canRecord('verified')"
                              (click)="recordVerified()">Sign as Verified</button>
                      <!-- Step-up path: another qualified user walks up, enters
                           initials+PIN, and signs as Verified without the logged-in
                           hanger logging out. Always offered while a Verify is
                           pending (so the verifier never needs the hanger's roles). -->
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="mark-verified-pin-btn"
                              [disabled]="!canStepUpVerify()"
                              (click)="openStepUpForVerify()">
                        <mat-icon>vpn_key</mat-icon> Sign as Verified (PIN)
                      </button>
                      <span class="progress-note">{{ pointsVerifiedProgress() }}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Walkdown</td>
                    <td>{{ walkdownCompletedCount() }} completed / {{ walkdownSessionCount() }} total sessions</td>
                    <td>{{ formatTime(latestWalkdownAt()) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              data-testid="start-walkdown-btn"
                              [disabled]="!canStartProcedure('WALKDOWN')"
                              (click)="openProcedure('WALKDOWN')">
                        <mat-icon>directions_walk</mat-icon> Start Walkdown
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>CA Activated</td>
                    <td>{{ formatAuditBy(latestEvent('caActivatedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('caActivatedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button data-testid="ca-activate-btn" [disabled]="!canRecord('ca-activate')" (click)="recordCaActivated()">Activate as CA</button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="ca-activate-pin-btn"
                              [disabled]="!canStepUpActivate()"
                              (click)="openStepUp('ca-activate', 'CA: Activate LOTO')">
                        <mat-icon>vpn_key</mat-icon> (PIN)
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Test Started By</td>
                    <td>{{ formatAuditBy(latestEvent('testStartedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('testStartedAt')) || '—' }}</td>
                    <td><span class="auto-note">(auto on Test)</span></td>
                  </tr>
                  <tr>
                    <td>Re-Activated By</td>
                    <td>{{ formatAuditBy(latestEvent('reactivatedBy')) }}</td>
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
                    <td>{{ formatAuditBy(latestEvent('acceptedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('acceptedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button [disabled]="!canRecord('accept')" (click)="recordAccepted()">Accept</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Requestor Released By</td>
                    <td>{{ formatAuditBy(latestEvent('requestorReleasedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('requestorReleasedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button data-testid="release-requestor-btn" [disabled]="!canRecord('release')" (click)="recordRequestorReleased()">Release</button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="release-requestor-pin-btn"
                              [disabled]="!canStepUpRelease()"
                              (click)="openStepUp('release-requestor', 'Requestor: Release LOTO')">
                        <mat-icon>vpn_key</mat-icon> (PIN)
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>CA Released By</td>
                    <td>{{ formatAuditBy(latestEvent('controlAuthorityReleasedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('controlAuthorityReleasedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button data-testid="release-ca-btn" [disabled]="!canRecord('release-ca')" (click)="recordCAReleased()">Release CA</button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="release-ca-pin-btn"
                              [disabled]="!canStepUpReleaseCa()"
                              (click)="openStepUp('release-ca', 'CA: Release LOTO')">
                        <mat-icon>vpn_key</mat-icon> (PIN)
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Per-point Removal</td>
                    <td>{{ removalDoneCount() }} / {{ entity().lotoPoints?.length || 0 }} points</td>
                    <td>{{ formatTime(latestRemovedAt()) || '—' }}</td>
                    <td>
                      <button mat-raised-button color="primary"
                              data-testid="start-removal-btn"
                              [disabled]="!canStartProcedure('REMOVE')"
                              (click)="openProcedure('REMOVE')">
                        <mat-icon>lock_open</mat-icon> Start Removal
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Locks Removed By</td>
                    <td>{{ formatAuditBy(latestEvent('locksRemovedBy')) }}</td>
                    <td>{{ formatTime(latestEvent('locksRemovedAt')) || '—' }}</td>
                    <td>
                      <button mat-stroked-button data-testid="remove-locks-btn" [disabled]="!canRecord('remove-locks')" (click)="recordLocksRemoved()">Remove Locks</button>
                      <button mat-stroked-button class="aggregate-btn"
                              data-testid="remove-locks-pin-btn"
                              [disabled]="!canStepUpRemoveLocks()"
                              (click)="openStepUp('remove-locks', 'CA: Remove Locks')">
                        <mat-icon>vpn_key</mat-icon> (PIN)
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Closed By</td>
                    <td>{{ formatAuditBy(latestEvent('closedBy')) }}</td>
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
                    <select [ngModel]="transferTo()" (ngModelChange)="transferTo.set($event)">
                      <option value="">— Select a person —</option>
                      @for (p of transferCandidates(); track p) {
                        <option [value]="p">{{ p }}</option>
                      }
                    </select>
                  </div>
                  @if ((entity().personnel?.length ?? 0) === 0) {
                    <p class="dialog-warn">No personnel on this LOTO. Add personnel before transferring.</p>
                  }
                  <div class="dialog-actions">
                    <button mat-stroked-button (click)="showTransferDialog.set(false)">Cancel</button>
                    <button mat-stroked-button
                            [disabled]="!transferTo()"
                            (click)="confirmTransferWithPin()">
                      <mat-icon>vpn_key</mat-icon> Confirm with PIN
                    </button>
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
                      <th style="width: 9%">Tag #</th>
                      <th style="width: 14%">Description</th>
                      <th>Hung</th>
                      <th>Verified</th>
                      <th>Walked-down</th>
                      <th>Removed</th>
                      @if (statusName() === 'Test' || statusName() === 'Modification') {
                        <th style="width: 14%">Re-hang</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of entity().lotoPoints; track p.id) {
                      <tr [class.needs-rehang]="isNeedsRehang(p.id)">
                        <td>{{ p.tagNumber }}</td>
                        <td>{{ p.description }}</td>
                        <td>{{ describePointAction('HANG', p.id) }}</td>
                        <td>{{ describePointAction('VERIFY', p.id) }}</td>
                        <td>{{ pointWalkdownSummary(p.id) }}</td>
                        <td>{{ describePointAction('REMOVE', p.id) }}</td>
                        @if (statusName() === 'Test' || statusName() === 'Modification') {
                          <td>
                            @if (isNeedsRehang(p.id)) {
                              <span class="rehang-badge">needs re-hang</span>
                            } @else if (isPointHung(p.id) && isPointVerified(p.id)) {
                              <button mat-stroked-button class="pull-btn"
                                      (click)="pullPointForTest(p.id, p.tagNumber)">
                                Pull
                              </button>
                            }
                          </td>
                        }
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
    .status-modification { background: #ef6c00; color: white; }
    .status-closed { background: #424242; color: #aaa; }
    .box-indicator { padding: 4px 10px; background: #333; border-radius: 8px; font-size: 13px; }

    .create-panel { padding: 16px; }
    .create-panel h3 { margin: 0 0 16px; color: #ddd; }
    .create-actions { display: flex; gap: 12px; }

    .standard-selector { margin-top: 8px; }
    .selector-header { display: flex; align-items: center; justify-content: space-between; }
    .selector-header h4 { margin: 0; color: #ccc; }
    .loading-text { color: #888; font-style: italic; padding: 12px 0; }
    .standard-search {
      width: 100%; box-sizing: border-box;
      padding: 8px 12px; margin: 8px 0 4px;
      background: #1a1a1a; color: #ddd; border: 1px solid #444; border-radius: 6px;
      font-size: 14px;
    }
    .standard-search:focus { outline: none; border-color: #4a90e2; }
    .empty-standards { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; align-items: flex-start; }
    .empty-standards-hint { color: #999; font-size: 13px; margin: 0; }
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
    .transfer-banner { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #1a2030; border: 1px solid #1565c0; border-radius: 6px; margin: 0 0 12px; color: #bbdefb; font-size: 13px; }
    .transfer-banner .spacer { flex: 1; }
    .transfer-banner mat-icon { color: #82b1ff; }
    .personnel-status-banner { padding: 8px 12px; background: #1a2a1a; border-left: 3px solid #66bb6a; border-radius: 4px; margin-bottom: 10px; color: #ddd; font-size: 13px; }
    .personnel-status-banner.warn { background: #2a1f1a; border-left-color: #ffb74d; color: #ffd180; }
    .personnel-status-banner .status-note { color: inherit; font-style: italic; margin-left: 4px; }
    .personnel-actions { margin-bottom: 12px; display: flex; gap: 8px; }
    .self-off-btn { margin-left: auto; }
    .sign-on-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
    .form-input { padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; }
    .personnel-table { width: 100%; border-collapse: collapse; }
    .personnel-table th, .personnel-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
    .personnel-table th { color: #aaa; font-weight: 500; }
    .signed-off { opacity: 0.5; }
    .snapshot-panel { padding: 16px; }
    .empty-text { color: #666; font-style: italic; }

    .autosave-indicator {
      padding: 4px 12px;
      font-size: 12px;
      color: #82b1ff;
      font-style: italic;
      text-align: right;
      margin: -4px 16px 8px;
    }

    .lifecycle-panel { padding: 16px; }
    .lifecycle-table { width: 100%; border-collapse: collapse; }
    .lifecycle-table th, .lifecycle-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; font-size: 13px; }
    .lifecycle-table th { color: #aaa; font-weight: 500; }
    .lifecycle-table td:first-child { color: #ccc; font-weight: 600; width: 22%; }
    .auto-note { color: #777; font-style: italic; font-size: 12px; }
    .progress-note { margin-left: 10px; color: #888; font-size: 12px; }

    /* Material's default disabled button text is near-invisible on a dark
       background. Make disabled lifecycle actions readable but still clearly
       disabled (dimmer than the enabled state but legible). */
    .lifecycle-table button.mat-mdc-button[disabled],
    .lifecycle-table button.mat-mdc-raised-button[disabled],
    .lifecycle-table button.mat-mdc-outlined-button[disabled],
    .lifecycle-table button.mat-mdc-stroked-button[disabled],
    .lifecycle-table button[disabled].mat-stroked-button,
    .lifecycle-table button[disabled].mat-raised-button,
    .lifecycle-table button[disabled] {
      color: #888 !important;
      border-color: #555 !important;
      background: transparent !important;
      opacity: 1;
    }
    .lifecycle-table button.mat-mdc-raised-button[disabled],
    .lifecycle-table button[disabled].mat-raised-button {
      background: #2a2a2a !important;
    }


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
    .procedure-log-table tr.needs-rehang { background: rgba(239, 108, 0, 0.08); }
    .rehang-badge { display: inline-block; padding: 2px 8px; background: #ef6c00; color: white; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .pull-btn { font-size: 11px !important; padding: 0 8px !important; min-height: 24px !important; line-height: 24px !important; }
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
    .dialog-row select { flex: 1; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; padding: 6px 8px; }
    .dialog-warn { color: #ffb74d; font-size: 12px; margin: 8px 0; font-style: italic; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  `],
})
export class RfLotoFormComponent {
  private currentService = inject(CurrentLotoService);
  private lotoService = inject(LotoService);
  protected authService = inject(AuthService);
  private walkdownSessionService = inject(WalkdownSessionService);
  private lotoStandardService = inject(LotoStandardService);
  private userOptionService = inject(RfUserOptionService);
  private router = inject(Router);
  private messageService = inject(GlobalMessageService);
  private printService = inject(RfLotoPrintService);

  showStandardSelector = signal(false);
  isPrintingPids = signal(false);

  /**
   * Print all P&IDs for this permit with numbered highlighted shapes.
   * Delegates to the shared client-side print service so the output
   * matches the LOTO Standard printout for the same set of points.
   * See {@link ../../../services/ui/rf-loto-print.service.ts}.
   */
  async onPrintPids(): Promise<void> {
    const entity = this.entity();
    if (!entity?.id) {
      alert('Select a LOTO permit before printing its P&IDs.');
      return;
    }
    if (this.isPrintingPids()) return;
    this.isPrintingPids.set(true);
    try {
      await this.printService.print(entity);
    } catch (err) {
      console.error('Print P&IDs failed:', err);
      alert(`Print P&IDs failed: ${(err as any)?.message ?? 'Unknown error'}`);
    } finally {
      this.isPrintingPids.set(false);
    }
  }
  showSignOnForm = signal(false);
  showTransferDialog = signal(false);
  transferTo = signal('');
  standards = signal<LotoStandardDto[]>([]);
  loadingStandards = signal(false);
  stdSearch = signal('');
  filteredStandards = computed(() => {
    const term = this.stdSearch().trim().toLowerCase();
    const list = this.standards();
    if (!term) return list;
    return list.filter(s =>
      (s.name || '').toLowerCase().includes(term) ||
      ((s as any).description || '').toLowerCase().includes(term));
  });

  sortedSnapshots = computed(() => {
    const list = this.entity().snapshots ?? [];
    return [...list].sort((a, b) => {
      const ta = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const tb = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return tb - ta; // newest first
    });
  });

  entity = computed(() => this.currentService.selectedItem() ?? new LotoDto());
  fields = computed(() => {
    // lotoRequestor is persisted as a name string — build options whose
    // value equals the label so the existing storage format is preserved.
    const reqOpts = this.userOptionService.getFilteredOptions('REQUESTOR');
    const caOpts = this.userOptionService.getFilteredOptions('CONTROL_AUTHORITY');
    const seen = new Set<string>();
    const requestorOptions = [...reqOpts, ...caOpts]
      .map(o => ({ value: o.label, label: o.label }))
      .filter(o => {
        if (!o.label || seen.has(o.label)) return false;
        seen.add(o.label);
        return true;
      });
    return LotoDto.toFormFields(this.entity(), { requestorOptions }) as RfFormField[];
  });
  statusName = computed(() => this.entity().permitStatus?.name || 'Building');

  newLoto(): void {
    this.currentService.setCurrentLoto(null);
    this.showStandardSelector.set(false);
  }

  /** Re-fetch /me so newly-granted roles take effect without re-login. */
  refreshRoles(): void {
    this.authService.refreshCurrentUser().subscribe();
  }

  /** Auto-save indicator text. Empty string = hidden. */
  autoSaveStatus = signal<string>('');
  /** Memo of last persisted form-data signature, to skip no-op auto-saves. */
  private lastAutoSaveSignature = '';

  /**
   * Auto-save handler — rf-reactive-form already debounces value changes by 1s
   * and merges the form value with the entity (so id, snapshots, equipment,
   * etc. are preserved). We send the merged payload through the same update
   * path as the manual button.
   */
  onFormValueChange(mergedData: any): void {
    if (!mergedData) return;
    const id = mergedData.id ?? this.entity().id;
    if (!id) return;  // never auto-save before the LOTO exists server-side
    const payload = { ...mergedData, id };
    const sig = this.signatureOf(payload);
    if (sig === this.lastAutoSaveSignature) return;
    this.lastAutoSaveSignature = sig;
    this.autoSaveStatus.set('Saving…');
    this.currentService.processLotoChanges(
      payload,
      () => this.autoSaveStatus.set('Saved'),
      err => {
        // Reset the signature so the next identical-looking change still fires (the
        // failed save didn't actually persist, so the client and server are out of sync).
        this.lastAutoSaveSignature = '';
        const msg = err?.error?.message ?? err?.message ?? 'Auto-save failed';
        this.autoSaveStatus.set('Save failed');
        this.messageService.showError(msg);
      },
    );
    setTimeout(() => {
      if (this.autoSaveStatus() === 'Saved') this.autoSaveStatus.set('');
    }, 1500);
  }

  /** Cheap deep-string signature for the form-shaped fields we care about. */
  private signatureOf(p: any): string {
    return JSON.stringify({
      eq: p.equipmentSystem ?? null,
      rq: p.lotoRequestor ?? null,
      d: p.date ?? null,
      bn: p.boxNumber ?? null,
      lb: p.lotoBox?.id ?? p.lotoBox ?? null,
      lk: (p.locks ?? []).map((l: any) => l?.id ?? l).sort(),
      lp: (p.lotoPoints ?? []).map((lp: any) => lp?.id ?? lp).sort(),
    });
  }

  onSubmit(formData: any): void {
    const id = formData?.id ?? this.entity().id;
    const payload = { ...formData, id };
    this.currentService.processLotoChanges(payload);
  }

  onDelete(): void {
    const entity = this.entity();
    if (!entity?.id) return;
    const label = (entity as any).permitNumber || `#${entity.id}`;
    if (!confirm(`Delete permit ${label}? This cannot be undone.`)) return;
    this.currentService.deleteLoto(entity.id);
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
    this.stdSearch.set('');
    this.lotoStandardService.getAllLotoStandards().subscribe({
      next: res => {
        const list = (res.responseData ?? [])
          .map((s: any) => LotoStandardDto.fromJson(s))
          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.standards.set(list);
        this.loadingStandards.set(false);
      },
      error: err => {
        this.loadingStandards.set(false);
        this.messageService.showError(err?.error?.message ?? err?.message ?? 'Could not load LOTO standards.');
      },
    });
  }

  openLotoStandardsPage(): void {
    this.showStandardSelector.set(false);
    this.router.navigateByUrl('/loto/loto-standard');
  }

  createFromStandard(standardId: number): void {
    this.lotoService.createFromStandard(standardId).subscribe({
      next: res => {
        if (res.responseData) {
          const newLoto = LotoDto.fromJson(res.responseData);
          this.currentService.addLotoToList(newLoto);
          this.currentService.setCurrentLoto(newLoto);
          this.showStandardSelector.set(false);
        }
      },
      error: err => this.messageService.showError(
        err?.error?.message ?? err?.message ??
        'Could not create permit — Control Authority permission may be required.'),
    });
  }

  createFromScratch(): void {
    this.lotoService.createFromScratch().subscribe({
      next: res => {
        if (res.responseData) {
          const newLoto = LotoDto.fromJson(res.responseData);
          this.currentService.addLotoToList(newLoto);
          this.currentService.setCurrentLoto(newLoto);
        }
      },
      error: err => this.messageService.showError(
        err?.error?.message ?? err?.message ??
        'Could not create permit — Control Authority permission may be required.'),
    });
  }

  signOn(name: string, role: string, company: string): void {
    const entity = this.entity();
    if (!entity?.id) return;
    const resolved = (name && name.trim()) || this.defaultSignOnName();
    if (!resolved) { alert('Name required for sign-on'); return; }
    const entry: PersonnelSignEntry = {
      personName: resolved, personRole: role, company: company,
      signOnTime: '', signOffTime: null, signOffComments: null, performedBy: '', foreman: false
    };
    this.lotoService.signOn(entity.id, entry).subscribe({
      next: res => { if (res.responseData) this.currentService.setCurrentLoto(LotoDto.fromJson(res.responseData)); },
      error: err => alert(err?.error?.message ?? err?.message ?? 'Sign-on failed'),
    });
  }

  signOff(name: string): void {
    const entity = this.entity();
    if (!entity?.id) return;
    this.lotoService.signOff(entity.id, name, '').subscribe({
      next: res => { if (res.responseData) this.currentService.setCurrentLoto(LotoDto.fromJson(res.responseData)); },
      error: err => alert(err?.error?.message ?? err?.message ?? 'Sign-off failed'),
    });
  }

  /** Convenience: sign off the authenticated user. */
  signOffSelf(): void {
    const me = this.authService.currentUser?.name;
    if (!me) return;
    this.signOff(me);
  }

  openSignOn(): void {
    if (!this.canSignOn()) return;
    this.showSignOnForm.set(true);
  }

  defaultSignOnName(): string {
    return this.authService.currentUser?.name ?? '';
  }

  currentlySignedOnCount(): number {
    return (this.entity().personnel ?? []).filter(p => !p.signOffTime).length;
  }

  isCurrentUserSignedOn(): boolean {
    const me = this.authService.currentUser?.name;
    if (!me) return false;
    return (this.entity().personnel ?? []).some(p => p.personName === me && !p.signOffTime);
  }

  /** Mirrors NgLotoService.signOnPerson gates so the UI doesn't trigger expected errors. */
  canSignOn(): boolean {
    if (!this.entity().id) return false;
    const status = this.statusName();
    if (status !== 'Active' && status !== 'Test') return false;
    if (!this.latestEvent('caActivatedBy')) return false;
    if (this.latestEvent('requestorReleasedBy')) return false;
    if (this.isCurrentUserSignedOn()) return false;
    return true;
  }

  signOnBlockedReason(): string {
    if (!this.entity().id) return 'save the LOTO first';
    const status = this.statusName();
    if (status !== 'Active' && status !== 'Test') return 'LOTO must be Active or Test';
    if (!this.latestEvent('caActivatedBy')) return 'CA must activate the LOTO first';
    if (this.latestEvent('requestorReleasedBy')) return 'requestor has released the LOTO';
    if (this.isCurrentUserSignedOn()) return 'you are already signed on';
    return '';
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

  /**
   * Decorate an audit-field value (email, possibly suffixed with
   * "via:sessionHolder" by step-up flows) with signing initials when we can
   * resolve them from the user cache. Returns something like:
   *   "alice@plant.com [AB]"             (direct action)
   *   "verifier@plant.com [VK] via hanger@plant.com [HG]"  (step-up'd)
   */
  formatAuditBy(audit: string | null | undefined): string {
    if (!audit) return '—';
    const decorate = (name: string): string => {
      const u = this.userOptionService.getUserByIdentity(name);
      if (u && u.signingInitials) return `${name} [${u.signingInitials}]`;
      return name;
    };
    // "actor via:sessionHolder"
    const m = audit.match(/^(.+?)\s+via:(.+)$/);
    if (m) return `${decorate(m[1].trim())} via ${decorate(m[2].trim())}`;
    return decorate(audit);
  }

  canRecord(event: 'ca-approve-hanging' | 'ca-activate' | 'hung' | 'verified' | 'point-hung' | 'point-verified' | 'transfer' | 'accept' | 'release' | 'release-ca' | 'remove-locks'): boolean {
    const s = this.statusName();
    if (s === 'Closed') return false;
    switch (event) {
      case 'ca-approve-hanging':
        return s === 'Building' && !this.latestEvent('caApprovedForHangingBy')
          && this.authService.isControlAuthority();
      case 'point-hung':
        return s === 'Building' && !!this.latestEvent('caApprovedForHangingBy')
          && this.authService.isLotoQualified();
      case 'hung':
        return s === 'Building'
          && !!this.latestEvent('caApprovedForHangingBy')
          && this.allPointsHung()
          && (this.entity().lotoPoints?.length ?? 0) > 0
          && this.isCurrentUserAHanger()
          && this.authService.isLotoQualified();
      case 'point-verified':
        return s === 'Building' && this.authService.isLotoQualified();
      case 'verified':
        // Separation of duty: the person finalizing "Verified" must themselves
        // have verified at least one point. Without this, anyone with the role
        // could sign off on work they didn't do.
        return s === 'Building'
          && this.allPointsVerified()
          && (this.entity().lotoPoints?.length ?? 0) > 0
          && this.isCurrentUserAVerifier()
          && this.authService.isLotoQualified();
      case 'ca-activate':
        return s === 'Building'
          && !!this.latestEvent('hungBy')
          && !!this.latestEvent('verifiedBy')
          && !this.latestEvent('caActivatedBy')
          && this.authService.isControlAuthority();
      case 'transfer':
        return (s === 'Active' || s === 'Test' || s === 'Building')
          && this.isCurrentUserRequestor()
          && this.authService.isRequestor()
          && this.transferCandidates().length > 0;
      case 'accept':
        return (s === 'Active' || s === 'Test' || s === 'Building')
          && this.isCurrentUserPendingTransferee()
          && this.authService.isRequestor();
      case 'release':
        return (s === 'Active' || s === 'Test' || s === 'Building')
          && this.isCurrentUserRequestor()
          && this.authService.isRequestor();
      case 'release-ca':
        return (s === 'Active' || s === 'Test' || s === 'Building')
          && this.authService.isControlAuthority();
      case 'remove-locks':
        return (s === 'Active' || s === 'Test')
          && this.authService.isControlAuthority();
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
      | 'pointWalkdownBy' | 'pointWalkdownAt' | 'pointWalkdownNotes'
      | 'pointRemovedBy' | 'pointRemovedAt' | 'pointRemovedNotes'): Record<number, string> {
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

  /**
   * Identity keys for "is this me?" comparisons against audit fields. The
   * backend writes audit fields using Spring's principal username (= email,
   * see CustomUserDetails) — but newer requestor pickers store the user's
   * display name. So match against both name AND email to cover both cases.
   */
  private myIdentityKeys(): string[] {
    const u = this.authService.currentUser;
    if (!u) return [];
    return [u.name, u.email].filter((v): v is string => !!v && v.trim().length > 0);
  }

  /** True when the authenticated user is one of the people who hung at least one point. */
  isCurrentUserAHanger(): boolean {
    const ids = this.myIdentityKeys();
    if (ids.length === 0) return false;
    const hung = Object.values(this.latestPointMap('pointHungBy'));
    return hung.some(v => ids.includes(v));
  }

  /** True when the authenticated user is one of the people who verified at least one point. */
  isCurrentUserAVerifier(): boolean {
    const ids = this.myIdentityKeys();
    if (ids.length === 0) return false;
    const verified = Object.values(this.latestPointMap('pointVerifiedBy'));
    return verified.some(v => ids.includes(v));
  }

  /** True when the authenticated user is the current requestor on this LOTO. */
  isCurrentUserRequestor(): boolean {
    const ids = this.myIdentityKeys();
    const req = this.entity().lotoRequestor;
    return !!req && ids.includes(req);
  }

  /** True when the authenticated user is the named recipient of a pending transfer. */
  isCurrentUserPendingTransferee(): boolean {
    const ids = this.myIdentityKeys();
    const to = this.latestEvent('transferredTo');
    return !!to && ids.includes(to);
  }

  // ── Phase 4: Modification / Test resume gating ────────────────────────────

  /** Returns the set of point IDs that need re-hanging on the latest snapshot. */
  needsRehangSet(): Set<number> {
    const snaps = this.entity().snapshots ?? [];
    if (snaps.length === 0) return new Set();
    const latest = [...snaps].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
    return new Set(latest.pointNeedsRehang ?? []);
  }

  isNeedsRehang(pointId: number): boolean {
    return this.needsRehangSet().has(pointId);
  }

  canReactivate(): boolean {
    const status = this.statusName();
    if (status !== 'Test' && status !== 'Modification') return false;
    if (this.needsRehangSet().size > 0) return false;
    return this.allPointsHung() && this.allPointsVerified();
  }

  reactivateBlockedReason(): string {
    const s = this.needsRehangSet().size;
    if (s > 0) return `${s} point(s) still need re-hanging`;
    if (!this.allPointsHung()) return 'Not all points are hung';
    if (!this.allPointsVerified()) return 'Not all points are verified';
    return '';
  }

  pullPointForTest(pointId: number, tagNumber: string | null): void {
    const id = this.entity().id;
    if (!id) return;
    const tag = tagNumber || `#${pointId}`;
    if (!confirm(`Pull point ${tag} for testing? Its lock state will be cleared and it will need to be re-hung + re-verified before re-activation.`)) return;
    this.lotoService.pullPointForTest(id, pointId, null).subscribe({
      next: res => this.applyLifecycleResponse(res),
      error: err => alert(err?.error?.message ?? err?.message ?? 'Pull-for-test failed'),
    });
  }

  /** Pending transfer recipient = latest snapshot's transferredTo (cleared after accept). */
  pendingTransferTo(): string | null {
    const snaps = this.entity().snapshots ?? [];
    if (snaps.length === 0) return null;
    const latest = [...snaps].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
    if (latest.acceptedBy) return null;
    return latest.transferredTo ?? null;
  }

  pendingTransferFrom(): string | null {
    const snaps = this.entity().snapshots ?? [];
    if (snaps.length === 0) return null;
    const latest = [...snaps].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
    if (latest.acceptedBy) return null;
    return latest.transferredFrom ?? null;
  }

  acceptTransfer(): void {
    const id = this.entity().id;
    if (!id) return;
    this.lotoService.acceptRequestor(id).subscribe({
      next: res => this.applyLifecycleResponse(res),
      error: err => alert(err?.error?.message ?? err?.message ?? 'Accept failed'),
    });
  }

  // ── Step-up authorization (one-shot PIN entry) ────────────────────────────

  /** What action a pending step-up should authorize. Null = no dialog open. */
  stepUpContext = signal<{
    kind: 'accept-transfer' | 'mark-verified' | 'ca-approve-hanging' | 'mark-hung'
        | 'ca-activate' | 'transfer' | 'release-requestor' | 'release-ca' | 'remove-locks';
    label: string;
    payload?: any;
  } | null>(null);

  openStepUpForAccept(): void {
    const recipient = this.pendingTransferTo();
    if (!recipient) return;
    this.stepUpContext.set({
      kind: 'accept-transfer',
      label: `Accept transfer as ${recipient}`,
    });
  }

  /**
   * Show the PIN dialog so the verifier can sign as themselves under the
   * hanger's logged-in session. Eligibility (status, all points verified) is
   * checked by canStepUpVerify(); role authorization happens on the server
   * against the PIN-bearer.
   */
  openStepUpForVerify(): void {
    if (!this.canStepUpVerify()) return;
    this.stepUpContext.set({
      kind: 'mark-verified',
      label: 'Sign LOTO as Verified',
    });
  }

  /**
   * Can the "Sign as Verified (PIN)" button be clicked? Mirrors canRecord('verified')
   * but skips the current-session role check — the PIN bearer's role is checked
   * server-side once their token authorizes the request.
   */
  canStepUpVerify(): boolean {
    const s = this.statusName();
    return s === 'Building'
      && this.allPointsVerified()
      && (this.entity().lotoPoints?.length ?? 0) > 0;
  }

  /** "Approve for Hanging" — CA role checked server-side under PIN bearer's identity. */
  canStepUpApproveHanging(): boolean {
    const s = this.statusName();
    return s === 'Building' && !this.latestEvent('caApprovedForHangingBy');
  }

  /** "Sign as Hung (PIN)" — backend enforces separation-of-duty (PIN bearer must be a hanger). */
  canStepUpHung(): boolean {
    const s = this.statusName();
    return s === 'Building'
      && !!this.latestEvent('caApprovedForHangingBy')
      && this.allPointsHung()
      && (this.entity().lotoPoints?.length ?? 0) > 0;
  }

  /** "Activate as CA (PIN)" — CA role checked server-side. */
  canStepUpActivate(): boolean {
    const s = this.statusName();
    return s === 'Building'
      && !!this.latestEvent('hungBy')
      && !!this.latestEvent('verifiedBy')
      && !this.latestEvent('caActivatedBy');
  }

  /** "Transfer (PIN)" — requestor role + at-least-one candidate. */
  canStepUpTransfer(): boolean {
    const s = this.statusName();
    return (s === 'Active' || s === 'Test' || s === 'Building')
      && this.transferCandidates().length > 0;
  }

  /** "Release (PIN)" — requestor role checked server-side. */
  canStepUpRelease(): boolean {
    const s = this.statusName();
    return s === 'Active' || s === 'Test' || s === 'Building';
  }

  /** "Release CA (PIN)" — CA role checked server-side. */
  canStepUpReleaseCa(): boolean {
    const s = this.statusName();
    return s === 'Active' || s === 'Test' || s === 'Building';
  }

  /** "Remove Locks (PIN)" — CA role checked server-side. */
  canStepUpRemoveLocks(): boolean {
    const s = this.statusName();
    return s === 'Active' || s === 'Test';
  }

  onStepUpAuthorized(result: { token: string; expiresAt: string }): void {
    const ctx = this.stepUpContext();
    this.stepUpContext.set(null);
    if (!ctx) return;
    const id = this.entity().id;
    if (!id) return;
    const token = result.token;
    const ok = (verb: string) => (res: any) => {
      this.applyLifecycleResponse(res);
      this.messageService.showSuccess(`${verb} signed`);
    };
    const fail = (verb: string) => (err: any) =>
      alert(err?.error?.message ?? err?.message ?? `${verb} failed`);
    switch (ctx.kind) {
      case 'accept-transfer':
        this.lotoService.acceptRequestor(id, token).subscribe({ next: ok('Accept'), error: fail('Accept') });
        break;
      case 'mark-verified':
        this.lotoService.markVerified(id, token).subscribe({ next: ok('Sign as Verified'), error: fail('Verify') });
        break;
      case 'ca-approve-hanging':
        this.lotoService.approveForHanging(id, token).subscribe({ next: ok('Approve for Hanging'), error: fail('Approve for Hanging') });
        break;
      case 'mark-hung':
        this.lotoService.markHung(id, token).subscribe({ next: ok('Sign as Hung'), error: fail('Sign as Hung') });
        break;
      case 'ca-activate':
        this.lotoService.caActivate(id, token).subscribe({ next: ok('Activate as CA'), error: fail('Activate as CA') });
        break;
      case 'transfer': {
        const to = ctx.payload?.to as string;
        if (!to) return;
        this.lotoService.transferRequestor(id, this.entity().lotoRequestor ?? null, to, token).subscribe({
          next: res => { ok('Transfer')(res); this.showTransferDialog.set(false); },
          error: fail('Transfer'),
        });
        break;
      }
      case 'release-requestor':
        this.lotoService.releaseByRequestor(id, token).subscribe({ next: ok('Release'), error: fail('Release') });
        break;
      case 'release-ca':
        this.lotoService.releaseByControlAuthority(id, token).subscribe({ next: ok('Release CA'), error: fail('Release CA') });
        break;
      case 'remove-locks':
        this.lotoService.removeLocks(id, token).subscribe({ next: ok('Remove Locks'), error: fail('Remove Locks') });
        break;
    }
  }

  /** Open the PIN dialog for one of the lifecycle actions. */
  openStepUp(
    kind: 'accept-transfer' | 'mark-verified' | 'ca-approve-hanging' | 'mark-hung'
        | 'ca-activate' | 'transfer' | 'release-requestor' | 'release-ca' | 'remove-locks',
    label: string,
    payload?: any
  ): void {
    this.stepUpContext.set({ kind, label, payload });
  }

  cancelPendingTransfer(): void {
    const id = this.entity().id;
    if (!id) return;
    if (!confirm(`Cancel pending transfer to ${this.pendingTransferTo()}?`)) return;
    this.lotoService.cancelTransfer(id).subscribe({
      next: res => this.applyLifecycleResponse(res),
      error: err => alert(err?.error?.message ?? err?.message ?? 'Cancel failed'),
    });
  }

  /** Personnel names for the transfer dropdown — excludes the current requestor. */
  transferCandidates(): string[] {
    const me = this.entity().lotoRequestor;
    const personnel = this.entity().personnel ?? [];
    return personnel
      .map(p => p.personName)
      .filter(n => !!n && n !== me) as string[];
  }

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

  /** Same as confirmTransfer but routes through step-up so a different requestor can sign in. */
  confirmTransferWithPin(): void {
    const to = this.transferTo();
    if (!to) return;
    this.openStepUp('transfer', `Transfer requestor → ${to}`, { to });
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
    const status = this.statusName();
    // All four modes require at least LOTO_QUALIFIED (CA implicitly qualifies).
    if (!this.authService.isLotoQualified()) return false;
    if (mode === 'REMOVE') {
      if (status === 'Closed') return false;
      return !!this.latestEvent('controlAuthorityReleasedBy');
    }
    if (mode === 'HANG' || mode === 'VERIFY') {
      if (status === 'Building') {
        if (mode === 'HANG') return !!this.latestEvent('caApprovedForHangingBy');
        return !!this.latestEvent('hungBy');
      }
      if (status === 'Modification' || status === 'Test') {
        return this.needsRehangSet().size > 0;
      }
      return false;
    }
    if (status !== 'Building') return false;
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

  /** Multi-crew walkdown sessions for the current LOTO. */
  walkdownSessions = signal<WalkdownSessionDto[]>([]);

  private walkdownSessionLoader = effect(() => {
    const id = this.entity().id;
    if (!id) { this.walkdownSessions.set([]); return; }
    this.walkdownSessionService.listForLoto(id).subscribe({
      next: res => this.walkdownSessions.set((res.responseData ?? []).map(WalkdownSessionDto.fromJson)),
      error: () => this.walkdownSessions.set([]),
    });
  }, { allowSignalWrites: true });

  walkdownSessionCount(): number { return this.walkdownSessions().length; }
  walkdownCompletedCount(): number { return this.walkdownSessions().filter(s => s.completed).length; }

  latestWalkdownAt(): string | null {
    let latest: string | null = null;
    for (const s of this.walkdownSessions()) {
      const t = s.completedAt ?? s.startedAt;
      if (!t) continue;
      if (!latest || t > latest) latest = t;
    }
    return latest;
  }

  /** Compact per-point summary: number of sessions that checked this point. */
  pointWalkdownSummary(pointId: number): string {
    const sessions = this.walkdownSessions();
    if (sessions.length === 0) return '—';
    const checks = sessions.filter(s => !!s.pointStates?.[pointId]?.checked);
    if (checks.length === 0) return `0 / ${sessions.length}`;
    return `✓ ${checks.length} / ${sessions.length}`;
  }

  removalDoneCount(): number {
    return Object.keys(this.latestPointMap('pointRemovedBy')).length;
  }

  latestRemovedAt(): string | null {
    return this.latestTimestamp('pointRemovedAt');
  }

  private latestTimestamp(field: Parameters<RfLotoFormComponent['latestPointMap']>[0]): string | null {
    const map = this.latestPointMap(field);
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
      mode === 'HANG'    ? this.latestPointMap('pointHungBy') :
      mode === 'VERIFY'  ? this.latestPointMap('pointVerifiedBy') :
      mode === 'REMOVE'  ? this.latestPointMap('pointRemovedBy') :
                           this.latestPointMap('pointWalkdownBy');
    const atMap =
      mode === 'HANG'    ? this.latestPointMap('pointHungAt') :
      mode === 'VERIFY'  ? this.latestPointMap('pointVerifiedAt') :
      mode === 'REMOVE'  ? this.latestPointMap('pointRemovedAt') :
                           this.latestPointMap('pointWalkdownAt');
    const notesMap =
      mode === 'HANG'    ? this.latestPointMap('pointHangNotes') :
      mode === 'VERIFY'  ? this.latestPointMap('pointVerifyNotes') :
      mode === 'REMOVE'  ? this.latestPointMap('pointRemovedNotes') :
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
    this.router.navigate(['/loto-standard'], { queryParams: { standardId: stdId } });
  }
}
