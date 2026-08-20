import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { ServerStatusService } from '../../services/server-status.service';
import { PortalToBodyDirective } from '../../shared/portal-to-body.directive';
import { LotoDrawingService } from './loto-drawing.service';
import { LotoDrawingViewerComponent } from './loto-drawing-viewer.component';
import { LotoPointActionsComponent } from './loto-point-actions.component';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LotoStandardStore } from './loto-standard-store.service';
import { LotoWalkdownSyncService } from './loto-walkdown-sync.service';
import {
  GLOBAL_ITEMS, GlobalItemDef, LOTO_STANDARD_STATUS, LotoPointRef, LotoStandard, POINT_CHECKS,
  PointChecklist, PositionOptions, WalkdownDraft, WalkdownGroupBy, WalkdownGroup,
  groupPointsForWalkdown, orderedPoints, pointChecklistComplete, pointHasNegative,
} from './loto-standard.model';
import { WakeLockService } from '../../services/wake-lock.service';
import { HapticsService } from '../../services/haptics.service';

type TransitionMode = 'verify' | 'walkdown' | null;

@Component({
  selector: 'app-loto-standard-walkdown',
  standalone: true,
  imports: [MainLayoutComponent, LotoDrawingViewerComponent, LotoPointActionsComponent, PortalToBodyDirective],
  template: `
    <app-main-layout [header]="'Verify / Walk down'">
      <ng-container main-content>
        <div class="w-container">
          <button class="w-back" (click)="back()">← Standard</button>

          @if (!online()) {
            <div class="w-net">📴 Offline — your checklist is saved on this device and submits when you reconnect.</div>
          }

          @if (loading()) {
            <p class="w-msg">Loading…</p>
          } @else if (error() || !std() || !draft()) {
            <p class="w-msg w-error">{{ error() || 'Standard not available.' }}</p>
          } @else if (submitted()) {
            <div class="w-done">
              <div class="w-done-icon">✓</div>
              <p class="w-done-title">{{ submittedMessage() }}</p>
              <button class="w-save" (click)="back()">Back to standard</button>
            </div>
          } @else {
            <h1 class="w-title">{{ std()!.name || '(unnamed)' }}</h1>
            <p class="w-status">Status: <b>{{ statusName() || 'Draft' }}</b>
              @if (mode() === null) { <span class="w-hint">— not currently awaiting verification or walkdown</span> }
            </p>

            <!-- Global items -->
            <h2 class="w-h2">Standard items</h2>
            <div class="w-globals">
              @for (g of globalItemsToShow(); track g.key) {
                <div class="w-global-item">
                  <label class="w-global">
                    <input type="checkbox" [checked]="globalChecked(g.key)"
                           (change)="setGlobal(g.key, $any($event.target).checked)">
                    <span>{{ g.label }}</span>
                  </label>
                  @if (globalText(g); as txt) {
                    <details class="w-reveal"><summary>View text</summary><p class="w-reveal-body">{{ txt }}</p></details>
                  } @else if (g.field) {
                    <span class="w-reveal-empty">No text recorded</span>
                  }
                  @if (g.order) {
                    <details class="w-reveal">
                      <summary>View {{ g.order }} order</summary>
                      <ol class="w-order">
                        @for (p of orderFor(g.order); track p.id) {
                          <li class="w-order-item">
                            <span class="w-order-tag">{{ p.tagNumber || '—' }}</span>
                            @if (p.description) { <span class="w-order-desc">{{ p.description }}</span> }
                          </li>
                        }
                      </ol>
                    </details>
                  }
                </div>
              }
            </div>

            <!-- Points — grouped summary list. Tap a row to open the per-point dialog. -->
            <h2 class="w-h2">Points ({{ completeCount() }}/{{ points().length }} complete)</h2>
            <div class="w-groupbar" role="tablist" aria-label="Group and sort points">
              <button class="w-groupbtn" [class.active]="groupBy() === 'install'" (click)="groupBy.set('install')">Install order</button>
              <button class="w-groupbtn" [class.active]="groupBy() === 'removal'" (click)="groupBy.set('removal')">Removal order</button>
              <button class="w-groupbtn" [class.active]="groupBy() === 'system'" (click)="groupBy.set('system')">System</button>
              <button class="w-groupbtn" [class.active]="groupBy() === 'location'" (click)="groupBy.set('location')">Location</button>
            </div>

            @for (g of groups(); track g.key) {
              <details class="w-group" [open]="isSingletonGroup() || g.status !== 'pass'">
                <summary class="w-group-summary" [attr.data-status]="g.status">
                  <span class="w-group-label">{{ g.label }}</span>
                  <span class="w-group-meta">
                    <span class="w-group-count">{{ g.points.length }}</span>
                    <span class="w-group-badge" [attr.data-status]="g.status">{{ groupStatusLabel(g.status) }}</span>
                  </span>
                </summary>
                <div class="w-group-list">
                  @for (p of g.points; track p.id) {
                    <button class="w-row" [attr.data-status]="rowStatus(p.id)" (click)="openPointDialog(p.id)">
                      <span class="w-row-tag">{{ corrTag(p) || '—' }}</span>
                      <span class="w-row-desc">{{ corrDesc(p) || '(no description)' }}</span>
                      <span class="w-row-loc">{{ locName(p) || corrSpecific(p) || '—' }}</span>
                      <span class="w-row-status" [attr.data-status]="rowStatus(p.id)">{{ rowStatusLabel(p.id) }}</span>
                    </button>
                  }
                </div>
              </details>
            }

            <!-- Legacy per-point cards removed — replaced by the grouped summary list above +
                 the per-point dialog below. See the pre-refactor commit for the old markup.
                 The block below is dead code and will be dropped in a follow-up sweep. -->
            @if (false) { <div>
            @for (p of points(); track p.id) {
              <div class="w-point" [class.done]="pointComplete(p.id)">
                <div class="w-point-head">
                  <span class="w-tag">{{ corrTag(p) || '—' }}</span>
                  <span class="w-point-head-right">
                    @if (hasDrawing(p.id)) { <button class="w-drawing-btn" (click)="openDrawing(p)">📄 Drawing</button> }
                    @else if (drawingMissing(p.id)) { <span class="w-flag-missing">⚠ No drawing</span> }
                    @if (pointComplete(p.id)) { <span class="w-badge-ok">✓ complete</span> }
                  </span>
                </div>

                <dl class="w-point-info">
                  @if (corrDesc(p)) { <dt>Description</dt><dd>{{ corrDesc(p) }}</dd> }
                  <dt>Isolation position</dt><dd>{{ isoName(p) || '—' }}</dd>
                  <dt>Restored position</dt><dd>{{ normName(p) || '—' }}</dd>
                  @if (p.zeroEnergyMethod) {
                    <dt>Zero energy</dt><dd>{{ p.zeroEnergyMethod }}</dd>
                  } @else {
                    <dt>Zero energy</dt><dd class="w-missing">⚠ none recorded — flag it below</dd>
                  }
                </dl>

                @for (c of checks; track c.key) {
                  <div class="w-check">
                    <span class="w-check-label">{{ c.label }}</span>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(p.id, c.key) === true"
                              (click)="setCheck(p.id, c.key, true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(p.id, c.key) === false"
                              (click)="setCheck(p.id, c.key, false)">Fail</button>
                    </span>
                  </div>
                }

                @if (pointNegative(p.id)) {
                  <textarea class="w-comment" rows="2" placeholder="Comment required — explain the failed check(s)"
                            [value]="comment(p.id)" (input)="setComment(p.id, $any($event.target).value)"></textarea>
                }

                <details class="w-correct">
                  <summary>Correct tag / description / position / location</summary>
                  <label class="w-field">Tag number
                    <input type="text" [value]="corrTag(p)" (input)="setCorr(p.id, 'tagNumber', $any($event.target).value)">
                  </label>
                  <label class="w-field">Description
                    <input type="text" [value]="corrDesc(p)" (input)="setCorr(p.id, 'description', $any($event.target).value)">
                  </label>
                  <label class="w-field">Isolation position
                    <select [value]="corrIso(p)" (change)="setCorrPos(p.id, 'isoPosId', $any($event.target).value)">
                      <option value="">—</option>
                      @for (o of positions().isoPos; track o.id) { <option [value]="o.id" [selected]="o.id === corrIso(p)">{{ o.name }}</option> }
                    </select>
                  </label>
                  <label class="w-field">Restored position
                    <select [value]="corrNorm(p)" (change)="setCorrPos(p.id, 'normPosId', $any($event.target).value)">
                      <option value="">—</option>
                      @for (o of positions().normPos; track o.id) { <option [value]="o.id" [selected]="o.id === corrNorm(p)">{{ o.name }}</option> }
                    </select>
                  </label>
                  <label class="w-field">Specific location
                    <input type="text" [value]="corrSpecific(p)" (input)="setCorr(p.id, 'specificLocation', $any($event.target).value)">
                  </label>
                  <label class="w-field">Location
                    <select [value]="corrLocation(p)" (change)="setCorrPos(p.id, 'locationId', $any($event.target).value)">
                      <option value="">—</option>
                      @for (o of positions().location; track o.id) { <option [value]="o.id" [selected]="o.id === corrLocation(p)">{{ o.name }}</option> }
                    </select>
                  </label>
                  <!-- Durable physical flags — tap Yes/No to set; tap the active side again to clear. -->
                  <div class="w-check">
                    <span class="w-check-label">Lockable</span>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="corrLockable(p) === true"
                              (click)="setCorrFlag(p.id, 'isLockable', true)">Yes</button>
                      <button class="w-yn fail" [class.active]="corrLockable(p) === false"
                              (click)="setCorrFlag(p.id, 'isLockable', false)">No</button>
                    </span>
                  </div>
                  <div class="w-check">
                    <span class="w-check-label">Metal tag present</span>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="corrLabeled(p) === true"
                              (click)="setCorrFlag(p.id, 'isLabeled', true)">Yes</button>
                      <button class="w-yn fail" [class.active]="corrLabeled(p) === false"
                              (click)="setCorrFlag(p.id, 'isLabeled', false)">No</button>
                    </span>
                  </div>
                </details>

                <app-loto-point-actions
                  [pointId]="p.id"
                  [pointLabel]="corrTag(p) || null" />
              </div>
            }
            </div> }

            <!-- Submit -->
            <div class="w-finish">
              @if (mode() !== null) {
                <h2 class="w-h2">{{ mode() === 'verify' ? 'Complete verification' : 'Complete walkdown' }}</h2>
                @if (!readyToComplete()) {
                  <p class="w-hint">Check every standard item and answer all point checks to
                    {{ mode() === 'verify' ? 'verify' : 'complete the walkdown' }}.</p>
                }
              } @else {
                <h2 class="w-h2">Submit corrections</h2>
                <p class="w-hint">This standard isn't awaiting a transition — any per-point corrections you made are applied to the LOTO points, and the checklist (if any) is recorded as evidence. The standard's status doesn't change.</p>
              }
              <textarea class="w-comment" rows="2" placeholder="Notes (optional)"
                        [value]="notes()" (input)="setNotes($any($event.target).value)"></textarea>
              @if (draft()!.status === 'failed' && draft()!.lastError) {
                <p class="w-msg w-error">{{ draft()!.lastError }}</p>
              }
            </div>

            <!--
              Sticky action bar. A standard can carry 30+ points, so the submit control has to stay
              reachable without scrolling to the very bottom; the counter doubles as live progress.
            -->
            <div class="w-sticky">
              <div class="w-sticky-progress">
                <span>{{ completeCount() }} / {{ points().length }} points</span>
                @if (!allGlobalChecked()) { <span class="w-sticky-warn">standard items outstanding</span> }
              </div>
              <button class="w-finish-btn" [disabled]="!canSubmit() || submitting()" (click)="doSubmit()">
                {{ submitting() ? 'Submitting…'
                   : (!online() ? 'Save & queue for submit'
                   : (mode() === 'verify' ? 'Mark Verified' : mode() === 'walkdown' ? 'Mark Walkdown Complete' : 'Submit checklist')) }}
              </button>
            </div>
          }

          @if (viewerPoint(); as vp) {
            <app-loto-drawing-viewer [standardId]="std()!.id" [pointId]="vp.pointId" [title]="vp.tag"
                                     (close)="closeDrawing()"></app-loto-drawing-viewer>
          }

          <!--
            Per-point dialog. Opens when a row in the summary list is tapped. All Pass/Fail buttons,
            inline value edits, and toggles operate on the point identified by activePointId(); the
            existing corr* / setCorr* / setCheck helpers already do the right thing per pointId.
          -->
          @if (activePoint(); as ap) {
            <div class="w-dialog-backdrop" appPortalToBody (click)="closePointDialog()">
              <div class="w-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
                <div class="w-dialog-head">
                  <div class="w-dialog-title">
                    <span class="w-tag">{{ corrTag(ap) || '—' }}</span>
                    @if (corrDesc(ap)) { <span class="w-dialog-desc">{{ corrDesc(ap) }}</span> }
                  </div>
                  <button class="w-dialog-close" (click)="closePointDialog()" aria-label="Close">✕</button>
                </div>

                <div class="w-dialog-body">
                  <!-- Drawing file — click to view, Pass/Fail = fileReferenceProvided -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      @if (hasDrawing(ap.id)) {
                        <button class="w-drawing-btn" (click)="openDrawing(ap)">📄 View drawing</button>
                      } @else {
                        <span class="w-flag-missing">⚠ No drawing on file</span>
                      }
                      <span class="w-field-caption">File reference provided</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'fileReferenceProvided') === true"
                              (click)="setCheck(ap.id, 'fileReferenceProvided', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'fileReferenceProvided') === false"
                              (click)="setCheck(ap.id, 'fileReferenceProvided', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Tag number -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      @if (canEdit()) {
                        <input class="w-inline-input" type="text" [value]="corrTag(ap)"
                               (input)="setCorr(ap.id, 'tagNumber', $any($event.target).value)">
                      } @else {
                        <span class="w-inline-span">{{ corrTag(ap) || '—' }}</span>
                      }
                      <span class="w-field-caption">Tag numbers match (app / file / metal tag)</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'tagNumbersMatch') === true"
                              (click)="setCheck(ap.id, 'tagNumbersMatch', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'tagNumbersMatch') === false"
                              (click)="setCheck(ap.id, 'tagNumbersMatch', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Description (edit-only; no check) -->
                  @if (canEdit()) {
                    <div class="w-field-row w-field-editonly">
                      <div class="w-field-value">
                        <input class="w-inline-input" type="text" [value]="corrDesc(ap)"
                               placeholder="Description"
                               (input)="setCorr(ap.id, 'description', $any($event.target).value)">
                        <span class="w-field-caption">Description</span>
                      </div>
                    </div>
                  }

                  <!-- Metal tag present (Labeled) — canEdit: Yes/No is authoritative and drives the
                       metalTagPresent check. Read-only: value shown + Pass/Fail buttons for the verifier. -->
                  <div class="w-field-row">
                    <div class="w-field-value w-field-value-wide">
                      <span class="w-field-caption">Metal tag present</span>
                    </div>
                    @if (canEdit()) {
                      <span class="w-mini-toggle">
                        <button class="w-yn pass" [class.active]="corrLabeled(ap) === true"
                                (click)="setFlagAndCheck(ap.id, 'isLabeled', 'metalTagPresent', true)">Yes</button>
                        <button class="w-yn fail" [class.active]="corrLabeled(ap) === false"
                                (click)="setFlagAndCheck(ap.id, 'isLabeled', 'metalTagPresent', false)">No</button>
                      </span>
                    } @else {
                      <span class="w-inline-span w-value-inline">{{ corrLabeled(ap) === true ? 'Labeled' : corrLabeled(ap) === false ? 'Not labeled' : '—' }}</span>
                      <span class="w-check-btns">
                        <button class="w-yn pass" [class.active]="checkValue(ap.id, 'metalTagPresent') === true"
                                (click)="setCheck(ap.id, 'metalTagPresent', true)">Pass</button>
                        <button class="w-yn fail" [class.active]="checkValue(ap.id, 'metalTagPresent') === false"
                                (click)="setCheck(ap.id, 'metalTagPresent', false)">Fail</button>
                      </span>
                    }
                  </div>

                  <!-- Isolation position -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      @if (canEdit()) {
                        <select class="w-inline-input" [value]="corrIso(ap)"
                                (change)="setCorrPos(ap.id, 'isoPosId', $any($event.target).value)">
                          <option value="">—</option>
                          @for (o of positions().isoPos; track o.id) {
                            <option [value]="o.id" [selected]="o.id === corrIso(ap)">{{ o.name }}</option>
                          }
                        </select>
                      } @else {
                        <span class="w-inline-span">{{ isoName(ap) || '—' }}</span>
                      }
                      <span class="w-field-caption">Isolation position correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'isolationPositionCorrect') === true"
                              (click)="setCheck(ap.id, 'isolationPositionCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'isolationPositionCorrect') === false"
                              (click)="setCheck(ap.id, 'isolationPositionCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Restored position -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      @if (canEdit()) {
                        <select class="w-inline-input" [value]="corrNorm(ap)"
                                (change)="setCorrPos(ap.id, 'normPosId', $any($event.target).value)">
                          <option value="">—</option>
                          @for (o of positions().normPos; track o.id) {
                            <option [value]="o.id" [selected]="o.id === corrNorm(ap)">{{ o.name }}</option>
                          }
                        </select>
                      } @else {
                        <span class="w-inline-span">{{ normName(ap) || '—' }}</span>
                      }
                      <span class="w-field-caption">Restored position correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'restoredPositionCorrect') === true"
                              (click)="setCheck(ap.id, 'restoredPositionCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'restoredPositionCorrect') === false"
                              (click)="setCheck(ap.id, 'restoredPositionCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Zero energy (edit-only; no check) -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      <span class="w-inline-span">{{ ap.zeroEnergyMethod || '—' }}</span>
                      <span class="w-field-caption">Zero energy adequate</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'zeroEnergyAdequate') === true"
                              (click)="setCheck(ap.id, 'zeroEnergyAdequate', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'zeroEnergyAdequate') === false"
                              (click)="setCheck(ap.id, 'zeroEnergyAdequate', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Specific location -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      @if (canEdit()) {
                        <input class="w-inline-input" type="text" [value]="corrSpecific(ap)"
                               placeholder="Specific location"
                               (input)="setCorr(ap.id, 'specificLocation', $any($event.target).value)">
                      } @else {
                        <span class="w-inline-span">{{ corrSpecific(ap) || '—' }}</span>
                      }
                      <span class="w-field-caption">Specific location correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'specificLocationCorrect') === true"
                              (click)="setCheck(ap.id, 'specificLocationCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'specificLocationCorrect') === false"
                              (click)="setCheck(ap.id, 'specificLocationCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Location Value dropdown -->
                  <div class="w-field-row">
                    <div class="w-field-value">
                      @if (canEdit()) {
                        <select class="w-inline-input" [value]="corrLocation(ap)"
                                (change)="setCorrPos(ap.id, 'locationId', $any($event.target).value)">
                          <option value="">—</option>
                          @for (o of positions().location; track o.id) {
                            <option [value]="o.id" [selected]="o.id === corrLocation(ap)">{{ o.name }}</option>
                          }
                        </select>
                      } @else {
                        <span class="w-inline-span">{{ locName(ap) || '—' }}</span>
                      }
                      <span class="w-field-caption">Location correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'locationCorrect') === true"
                              (click)="setCheck(ap.id, 'locationCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'locationCorrect') === false"
                              (click)="setCheck(ap.id, 'locationCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <!-- Lockable — canEdit: Yes/No is authoritative and drives the equipmentLockable check.
                       Read-only: value shown + Pass/Fail for the verifier. -->
                  <div class="w-field-row">
                    <div class="w-field-value w-field-value-wide">
                      <span class="w-field-caption">Equipment lockable</span>
                    </div>
                    @if (canEdit()) {
                      <span class="w-mini-toggle">
                        <button class="w-yn pass" [class.active]="corrLockable(ap) === true"
                                (click)="setFlagAndCheck(ap.id, 'isLockable', 'equipmentLockable', true)">Yes</button>
                        <button class="w-yn fail" [class.active]="corrLockable(ap) === false"
                                (click)="setFlagAndCheck(ap.id, 'isLockable', 'equipmentLockable', false)">No</button>
                      </span>
                    } @else {
                      <span class="w-inline-span w-value-inline">{{ corrLockable(ap) === true ? 'Lockable' : corrLockable(ap) === false ? 'Not lockable' : '—' }}</span>
                      <span class="w-check-btns">
                        <button class="w-yn pass" [class.active]="checkValue(ap.id, 'equipmentLockable') === true"
                                (click)="setCheck(ap.id, 'equipmentLockable', true)">Pass</button>
                        <button class="w-yn fail" [class.active]="checkValue(ap.id, 'equipmentLockable') === false"
                                (click)="setCheck(ap.id, 'equipmentLockable', false)">Fail</button>
                      </span>
                    }
                  </div>

                  <!-- Standalone: Equipment accessible (no field on the point card) -->
                  <div class="w-field-row w-field-standalone">
                    <div class="w-field-value"><span class="w-field-caption">Equipment accessible</span></div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'equipmentAccessible') === true"
                              (click)="setCheck(ap.id, 'equipmentAccessible', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'equipmentAccessible') === false"
                              (click)="setCheck(ap.id, 'equipmentAccessible', false)">Fail</button>
                    </span>
                  </div>

                  @if (pointNegative(ap.id)) {
                    <textarea class="w-comment" rows="2" placeholder="Comment required — explain the failed check(s)"
                              [value]="comment(ap.id)" (input)="setComment(ap.id, $any($event.target).value)"></textarea>
                  }

                  <!-- Persistent verified flag on the LotoPoint. Hidden until every check passes so a
                       walker can't half-verify. Visible only in canEdit contexts (Draft, Verified,
                       New-Pending-Reapproval) — verifiers in Pending Verification submit through the
                       transition, not by flipping this flag. -->
                  @if (canEdit() && rowStatus(ap.id) === 'pass') {
                    <div class="w-field-row w-verified-row">
                      <div class="w-field-value w-field-value-wide">
                        <span class="w-field-caption">Point verified</span>
                        <span class="w-hint">Persistent on the LOTO Point — visible to future permit builders.</span>
                      </div>
                      <span class="w-mini-toggle">
                        <button class="w-yn pass" [class.active]="corrVerified(ap) === true"
                                (click)="setCorrVerified(ap.id, true)">Yes</button>
                        <button class="w-yn fail" [class.active]="corrVerified(ap) === false"
                                (click)="setCorrVerified(ap.id, false)">No</button>
                      </span>
                    </div>
                  }

                  <app-loto-point-actions [pointId]="ap.id" [pointLabel]="corrTag(ap) || null" />

                  @if (canEdit() && std()?.id) {
                    <button class="w-danger-btn" [disabled]="removingPointId() === ap.id"
                            (click)="removePointFromStandard(ap.id)">
                      {{ removingPointId() === ap.id ? 'Removing…' : '🗑 Remove point from this standard' }}
                    </button>
                  }
                </div>

                <div class="w-dialog-foot">
                  <span class="w-dialog-status" [attr.data-status]="rowStatus(ap.id)">{{ rowStatusLabel(ap.id) }}</span>
                  <button class="w-save" (click)="closePointDialog()">Done</button>
                </div>
              </div>
            </div>
          }

          @if (flash()) { <div class="w-flash" [class.err]="flashErr()">{{ flash() }}</div> }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    /* Bottom padding is small: the sticky action bar is the last child and provides the end-stop. */
    .w-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 0.5rem; }
    .w-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .w-net { background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; margin: 0.4rem 0 0.6rem; }
    .w-msg { text-align: center; color: var(--secondary-text); padding: 2rem 1rem; }
    .w-error { color: var(--danger-text); }
    .w-done { text-align: center; padding: 2.5rem 1rem; }
    .w-done-icon { width: 3.5rem; height: 3.5rem; line-height: 3.5rem; margin: 0 auto 0.75rem; border-radius: 50%; background: var(--success-solid); color: var(--on-solid); font-size: 2rem; }
    .w-done-title { color: var(--primary-text); font-size: 1.05rem; margin-bottom: 1.25rem; }
    .w-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-text); margin: 0.3rem 0 0.2rem; }
    .w-status { color: var(--primary-text); font-size: 0.9rem; margin: 0 0 1rem; }
    .w-hint { color: var(--secondary-text); font-size: 0.85rem; font-style: italic; }
    .w-h2 { font-size: 1rem; font-weight: 700; color: var(--primary-text); margin: 1.2rem 0 0.5rem; }
    .w-globals { display: flex; flex-direction: column; gap: 0.65rem; }
    .w-global-item { border-bottom: 1px solid var(--border-color); padding-bottom: 0.55rem; }
    .w-global-item:last-child { border-bottom: none; padding-bottom: 0; }
    .w-global { display: flex; align-items: center; gap: 0.5rem; color: var(--primary-text); font-size: 0.92rem; }
    .w-global input { width: 1.15rem; height: 1.15rem; flex-shrink: 0; }
    .w-reveal { margin: 0.25rem 0 0 1.65rem; }
    .w-reveal summary { font-size: 0.78rem; color: var(--accent-color); cursor: pointer; }
    .w-reveal-body { white-space: pre-wrap; font-size: 0.85rem; color: var(--primary-text); margin: 0.35rem 0 0; }
    .w-reveal-empty { display: block; margin: 0.15rem 0 0 1.65rem; font-size: 0.72rem; font-style: italic; color: var(--secondary-text); }
    .w-order { margin: 0.4rem 0 0 1.4rem; padding-left: 1rem; font-size: 0.85rem; color: var(--primary-text); }
    .w-order-item { margin: 0.35rem 0; padding-bottom: 0.35rem; border-bottom: 1px dashed var(--border-color); }
    .w-order-item:last-child { border-bottom: none; }
    .w-order-tag { font-weight: 700; }
    .w-order-desc { display: block; color: var(--secondary-text); font-size: 0.8rem; margin-top: 0.1rem; }
    .w-point { border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem; margin-bottom: 0.75rem; background: var(--card-bg, var(--secondary-background)); }
    .w-point.done { border-color: var(--success-border); }
    .w-point-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
    .w-point-head-right { display: flex; align-items: center; gap: 0.4rem; }
    .w-drawing-btn { background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); border-radius: 8px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-tag { font-weight: 700; color: var(--primary-text); }
    .w-badge-ok { font-size: 0.72rem; font-weight: 700; color: var(--on-solid); background: var(--success-solid); padding: 0.12rem 0.5rem; border-radius: 999px; }
    .w-point-info { display: grid; grid-template-columns: auto 1fr; gap: 0.15rem 0.7rem; margin: 0 0 0.55rem; }
    .w-point-info dt { font-size: 0.72rem; font-weight: 700; color: var(--secondary-text); align-self: start; }
    .w-point-info dd { margin: 0; font-size: 0.85rem; color: var(--primary-text); }
    .w-point-info .w-missing { color: var(--warning-text); font-weight: 600; }
    .w-flag-missing { font-size: 0.72rem; font-weight: 700; color: var(--warning-text); white-space: nowrap; }
    .w-check { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0; }
    .w-check-label { font-size: 0.9rem; color: var(--primary-text); flex: 1; }
    .w-check-btns { display: flex; gap: 0.4rem; flex-shrink: 0; }
    /* 44px min box + 64px min width: this is the safety decision, tapped with gloves on.
       Tapping the active value again clears it back to unanswered (see setCheck). */
    .w-yn { min-height: 44px; min-width: 64px; border: 1px solid var(--border-color); background: transparent; color: var(--secondary-text); border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-yn.pass.active { background: var(--success-solid); border-color: var(--success-solid); color: var(--on-solid); }
    .w-yn.fail.active { background: var(--danger-solid); border-color: var(--danger-solid); color: var(--on-solid); }
    .w-comment { width: 100%; box-sizing: border-box; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); resize: vertical; }
    .w-correct { margin-top: 0.6rem; }
    .w-correct summary { font-size: 0.8rem; color: var(--accent-color); cursor: pointer; }
    .w-field { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: var(--secondary-text); margin: 0.5rem 0; }
    .w-field input, .w-field select { padding: 0.45rem 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .w-finish { margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem; }
    .w-finish-btn { width: 100%; min-height: 52px; background: var(--success-solid); color: var(--on-solid); border: none; border-radius: 10px; padding: 0.8rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-finish-btn:disabled { opacity: 0.5; cursor: default; }
    .w-save { background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    /* Pinned above the home indicator; --w-container padding-bottom keeps the last card clear of it. */
    .w-sticky { position: sticky; bottom: 0; margin: 0 -1rem; padding: 0.6rem 1rem calc(0.6rem + env(safe-area-inset-bottom, 0px)); background: var(--primary-background); border-top: 1px solid var(--border-color); box-shadow: 0 -2px 10px rgba(0,0,0,0.08); }
    .w-sticky-progress { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; font-size: 0.8rem; color: var(--secondary-text); margin-bottom: 0.45rem; }
    .w-sticky-warn { color: var(--warning-text); font-weight: 600; }
    .w-flash { position: fixed; bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px)); left: 50%; transform: translateX(-50%); background: var(--primary-text); color: var(--primary-background); padding: 0.6rem 1.1rem; border-radius: 999px; font-size: 0.85rem; box-shadow: 0 3px 12px rgba(0,0,0,0.3); z-index: 50; max-width: 90%; text-align: center; }
    .w-flash.err { background: var(--danger-solid); color: var(--on-solid); }

    /* Group toolbar — 44px min-height chips so a glove-tap picks reliably. */
    .w-groupbar { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.4rem 0 0.75rem; }
    .w-groupbtn { min-height: 40px; padding: 0.4rem 0.85rem; border: 1px solid var(--border-color); background: transparent; color: var(--secondary-text); border-radius: 999px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit; }
    .w-groupbtn.active { background: var(--accent-color); border-color: var(--accent-color); color: var(--on-solid); }

    /* Collapsible group. Header shows count + status roll-up badge. */
    .w-group { border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 0.5rem; overflow: hidden; background: var(--card-bg, var(--secondary-background)); }
    .w-group[open] > .w-group-summary { border-bottom: 1px solid var(--border-color); }
    .w-group-summary { list-style: none; padding: 0.55rem 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; cursor: pointer; min-height: 44px; }
    .w-group-summary::-webkit-details-marker { display: none; }
    .w-group-summary::before { content: '▸'; color: var(--secondary-text); font-size: 0.8rem; margin-right: 0.4rem; transition: transform 0.15s; }
    .w-group[open] > .w-group-summary::before { transform: rotate(90deg); display: inline-block; }
    .w-group-label { font-weight: 700; color: var(--primary-text); font-size: 0.92rem; flex: 1; }
    .w-group-meta { display: flex; align-items: center; gap: 0.5rem; }
    .w-group-count { color: var(--secondary-text); font-size: 0.75rem; }
    .w-group-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; white-space: nowrap; }
    .w-group-badge[data-status="pass"] { background: var(--success-solid); color: var(--on-solid); }
    .w-group-badge[data-status="fail"] { background: var(--danger-solid); color: var(--on-solid); }
    .w-group-badge[data-status="incomplete"] { background: var(--border-color); color: var(--primary-text); }
    .w-group-list { display: flex; flex-direction: column; }

    /* One-line point row — tap opens the dialog. */
    .w-row { display: grid; grid-template-columns: minmax(4.5rem, auto) 1fr minmax(4rem, 8rem) minmax(4rem, auto); gap: 0.5rem; align-items: center; padding: 0.6rem 0.75rem; background: transparent; border: none; border-top: 1px solid var(--border-color); text-align: left; color: var(--primary-text); font: inherit; cursor: pointer; min-height: 44px; width: 100%; }
    .w-group-list > .w-row:first-child { border-top: none; }
    .w-row:hover { background: var(--hover-bg, rgba(255,255,255,0.03)); }
    .w-row-tag { font-weight: 700; color: var(--primary-text); font-size: 0.88rem; }
    .w-row-desc { color: var(--primary-text); font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .w-row-loc { color: var(--secondary-text); font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .w-row-status { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; text-align: center; justify-self: end; white-space: nowrap; }
    .w-row-status[data-status="pass"] { background: var(--success-solid); color: var(--on-solid); }
    .w-row-status[data-status="fail"] { background: var(--danger-solid); color: var(--on-solid); }
    .w-row-status[data-status="incomplete"] { background: transparent; color: var(--secondary-text); border: 1px solid var(--border-color); }
    .w-row[data-status="fail"] { border-left: 3px solid var(--danger-solid); }
    .w-row[data-status="pass"] { border-left: 3px solid var(--success-solid); }

    /* Per-point dialog. Full-height sheet on phones, centered card on wider viewports. */
    .w-dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
    @media (min-width: 720px) { .w-dialog-backdrop { align-items: center; } }
    .w-dialog { background: var(--primary-background); border-radius: 12px 12px 0 0; width: 100%; max-width: 720px; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 -4px 20px rgba(0,0,0,0.4); }
    @media (min-width: 720px) { .w-dialog { border-radius: 12px; max-height: 88vh; } }
    .w-dialog-head { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-color); }
    .w-dialog-title { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
    .w-dialog-desc { color: var(--secondary-text); font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .w-dialog-close { background: transparent; border: none; color: var(--secondary-text); font-size: 1.2rem; min-height: 40px; min-width: 40px; cursor: pointer; }
    .w-dialog-body { padding: 0.5rem 1rem 1rem; overflow-y: auto; flex: 1; }
    .w-dialog-foot { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--border-color); background: var(--primary-background); }
    .w-dialog-status { font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 999px; }
    .w-dialog-status[data-status="pass"] { background: var(--success-solid); color: var(--on-solid); }
    .w-dialog-status[data-status="fail"] { background: var(--danger-solid); color: var(--on-solid); }
    .w-dialog-status[data-status="incomplete"] { background: var(--border-color); color: var(--primary-text); }

    /* Field row inside the dialog: value/edit on the left, Pass/Fail on the right. */
    .w-field-row { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); }
    .w-field-row:last-child { border-bottom: none; }
    .w-field-row.w-field-standalone .w-field-value { color: var(--primary-text); font-weight: 500; }
    .w-field-row.w-field-editonly { justify-content: flex-start; }
    .w-field-value { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; min-width: 0; }
    .w-field-caption { font-size: 0.72rem; color: var(--secondary-text); text-transform: uppercase; letter-spacing: 0.02em; }
    .w-inline-input { padding: 0.45rem 0.55rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--secondary-background); color: var(--primary-text); font: inherit; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
    .w-inline-span { color: var(--primary-text); font-size: 0.9rem; font-weight: 500; overflow-wrap: anywhere; }
    .w-mini-toggle { display: inline-flex; gap: 0.3rem; }
    .w-yn.w-mini { min-height: 32px; min-width: 44px; font-size: 0.78rem; padding: 0.15rem 0.55rem; }
    /* When canEdit hides the value column and the Yes/No toggle IS the answer, let the caption
       stretch full width; the read-only branch reinstates a narrow value column via w-value-inline. */
    .w-field-value-wide { flex: 1; }
    .w-value-inline { color: var(--primary-text); font-size: 0.9rem; margin-right: 0.6rem; }
    /* Persistent-verified row — accent border so it reads as the finishing action, not another check. */
    .w-verified-row { border-top: 2px solid var(--accent-color); margin-top: 0.4rem; padding-top: 0.6rem; }
    .w-verified-row .w-field-caption { color: var(--accent-color); }
    .w-danger-btn { display: block; width: 100%; margin-top: 0.75rem; min-height: 44px; background: transparent; color: var(--danger-text); border: 1px solid var(--danger-solid); border-radius: 10px; padding: 0.55rem 0.75rem; font: inherit; font-weight: 600; cursor: pointer; }
    .w-danger-btn:hover { background: var(--danger-solid); color: var(--on-solid); }
    .w-danger-btn:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class LotoStandardWalkdownComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private haptics = inject(HapticsService);
  private store = inject(LotoStandardStore);
  private sync = inject(LotoWalkdownSyncService);
  private drawingService = inject(LotoDrawingService);
  private serverStatus = inject(ServerStatusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Keep the screen on for the whole walkdown; released automatically when this screen closes. */
  private wakeLock = inject(WakeLockService).bindTo();

  readonly checks = POINT_CHECKS;
  online = this.serverStatus.isOnline;

  std = signal<LotoStandard | null>(null);
  positions = signal<PositionOptions>({ isoPos: [], normPos: [], location: [] });
  draft = signal<WalkdownDraft | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  submitted = signal(false);
  submittedMessage = signal('Submitted.');
  flash = signal<string | null>(null);
  flashErr = signal(false);
  pointsWithDrawings = signal<Set<number>>(new Set());
  drawingsChecked = signal(false);
  viewerPoint = signal<{ pointId: number; tag: string } | null>(null);

  points = computed<LotoPointRef[]>(() => this.std()?.lotoPoints ?? []);
  statusName = computed(() => this.std()?.developmentStatus?.name);
  mode = computed<TransitionMode>(() => this.modeFor(this.std()));
  notes = computed(() => this.draft()?.notes ?? '');

  globalItemsToShow = computed(() => {
    const s = this.std();
    return GLOBAL_ITEMS.filter(g => !g.field || !!(s?.[g.field]));
  });

  completeCount = computed(() => {
    const d = this.draft();
    return this.points().filter(p => pointChecklistComplete(d?.pointResults?.[String(p.id)])).length;
  });

  /** Also surfaced in the sticky bar, so it can't be private. */
  allGlobalChecked = computed(() =>
    this.globalItemsToShow().every(g => this.draft()?.globalItems?.[g.key]?.checked));
  private allPointsComplete = computed(() => {
    const pts = this.points();
    return pts.length > 0 && pts.every(p => pointChecklistComplete(this.draft()?.pointResults?.[String(p.id)]));
  });
  readyToComplete = computed(() => this.allGlobalChecked() && this.allPointsComplete());
  /** With a pending transition, require completeness; with none, allow recording partial evidence. */
  canSubmit = computed(() => this.mode() === null ? true : this.readyToComplete());

  // ── Grouped summary list + per-point dialog ──────────────────────────────
  /** How the point list is grouped and sorted. Persisted only in-memory; a fresh open resets. */
  groupBy = signal<WalkdownGroupBy>('install');
  /** Groups computed from std + current draft answers — rebuilt on any draft/point change. */
  groups = computed<WalkdownGroup[]>(() =>
    groupPointsForWalkdown(this.std(), this.groupBy(), this.draft()?.pointResults ?? {})
  );
  /** For install/removal we render one group; auto-expand it so the "collapsible" chrome doesn't
   *  add a needless tap when the list is already flat. */
  isSingletonGroup = computed(() => this.groups().length === 1);

  /**
   * Whether inline field edits are allowed in the point dialog. TRUE when the standard is in a
   * status where content changes are normal (Draft, New – Pending Reapproval, and — matching the
   * existing corrections-during-walkdown UX — Verified). FALSE in Pending Verification: verifiers
   * are checking, not authoring.
   */
  canEdit = computed<boolean>(() => {
    const name = this.std()?.developmentStatus?.name;
    return name === LOTO_STANDARD_STATUS.DRAFT
        || name === LOTO_STANDARD_STATUS.NEW_PENDING_REAPPROVAL
        || name === LOTO_STANDARD_STATUS.VERIFIED
        || !name;
  });

  /** Which point's dialog is open (null = list view). */
  activePointId = signal<number | null>(null);
  activePoint = computed<LotoPointRef | null>(() => {
    const id = this.activePointId();
    if (id == null) return null;
    return this.points().find(p => p.id === id) ?? null;
  });
  openPointDialog(pointId: number): void {
    // The dialog's position-fixed + body-scroll-lock is handled by [appPortalToBody] on the
    // .w-dialog-backdrop; the directive fires when @if creates the element and cleans up when
    // it's destroyed. No need to touch scroll here.
    this.activePointId.set(pointId);
    this.haptics.tap('tap');
  }
  closePointDialog(): void { this.activePointId.set(null); }

  /** Row-level status for a point — pass when complete + all-Pass, fail when any Fail, else incomplete. */
  rowStatus(pointId: number): 'pass' | 'fail' | 'incomplete' {
    const c = this.draft()?.pointResults?.[String(pointId)];
    if (pointHasNegative(c)) return 'fail';
    if (pointChecklistComplete(c)) return 'pass';
    return 'incomplete';
  }
  rowStatusLabel(pointId: number): string {
    const s = this.rowStatus(pointId);
    return s === 'pass' ? '✓ Pass' : s === 'fail' ? '✗ Fail' : '—';
  }
  groupStatusLabel(s: 'pass' | 'fail' | 'incomplete'): string {
    return s === 'pass' ? '✓ Complete' : s === 'fail' ? '✗ Fail' : '⋯ Incomplete';
  }

  /** Effective Location Value name — pending correction wins over the persisted point value. */
  locName(p: LotoPointRef): string {
    const cid = this.draft()?.corrections?.[String(p.id)]?.locationId;
    if (cid) return this.positions().location.find(o => o.id === cid)?.name ?? '';
    return p.location?.name ?? '';
  }

  /** Point id currently being removed (spinner + disable state on the button). */
  removingPointId = signal<number | null>(null);
  /**
   * Detach a point from this standard. Only reachable in editable modes (Draft / New–Pending
   * Reapproval / Verified — same as canEdit()). Confirms with the walker, calls the server,
   * closes the dialog on success, and drops the point from the local list. Errors flash.
   */
  removePointFromStandard(pointId: number): void {
    const s = this.std();
    if (!s?.id) return;
    if (this.removingPointId() !== null) return;
    const p = this.points().find(x => x.id === pointId);
    const label = p?.tagNumber ? `“${p.tagNumber}”` : `point #${pointId}`;
    if (typeof confirm === 'function' && !confirm(`Remove ${label} from this standard? The LOTO point itself stays in the hub — only the standard's link is severed.`)) return;
    this.removingPointId.set(pointId);
    // HttpClient observables complete after one emission — the subscribe won't leak past navigation.
    this.api.removePointFromStandard(s.id, pointId)
      .subscribe({
        next: (updated) => {
          this.removingPointId.set(null);
          if (updated) { this.std.set(updated); this.store.cacheStandard(updated); }
          this.closePointDialog();
          this.flashMsg('Point removed from standard.');
        },
        error: (err) => {
          this.removingPointId.set(null);
          this.flashMsg(err?.error?.message ?? err?.message ?? 'Remove failed', true);
        },
      });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.error.set('Missing standard id.'); this.loading.set(false); return; }
    const id = Number(idParam);

    // Seed from cache immediately so the screen works with no signal.
    const cachedStd = this.store.getCachedStandard(id);
    const cachedPos = this.store.getCachedPositions();
    if (cachedStd) this.std.set(cachedStd.std);
    if (cachedPos) this.positions.set(cachedPos);
    this.draft.set(this.store.getDraft(id) ?? this.newDraft(id, this.std()));
    if (cachedStd) this.loading.set(false);
    this.loadDrawings(id);

    // Always try to refresh (works online; harmless offline — the request just fails and we keep the cache).
    forkJoin({
      std: this.api.getById(id).pipe(catchError(() => of(null))),
      pos: this.api.getPositions().pipe(catchError(() => of(null))),
    }).subscribe(({ std, pos }) => {
      if (std) { this.std.set(std); this.store.cacheStandard(std); this.reseedDraft(std); }
      if (pos) { this.positions.set(pos); this.store.cachePositions(pos); }
      if (!this.std()) {
        this.error.set("This standard isn't cached and couldn't be fetched. Open it once on a connection first.");
      }
      this.loading.set(false);
    });
  }

  // ── Draft seeding ──────────────────────────────────────────────────────────
  private newDraft(id: number, std: LotoStandard | null): WalkdownDraft {
    return {
      standardId: id, capturedVersion: std?.currentVersion, transition: this.modeFor(std),
      notes: '', globalItems: {}, pointResults: {}, corrections: {}, status: 'draft', updatedAt: Date.now(),
    };
  }
  /** Keep the captured version + transition intent aligned with the freshly-fetched standard. */
  private reseedDraft(std: LotoStandard): void {
    const d = this.clone(this.draft()!);
    d.capturedVersion = std.currentVersion;
    d.transition = this.modeFor(std);
    this.draft.set(d);
    this.store.saveDraft(d);
  }
  private modeFor(std: LotoStandard | null): TransitionMode {
    switch (std?.developmentStatus?.name) {
      case LOTO_STANDARD_STATUS.PENDING_VERIFICATION: return 'verify';
      case LOTO_STANDARD_STATUS.VERIFIED: return 'walkdown';
      default: return null;
    }
  }

  private clone(d: WalkdownDraft): WalkdownDraft { return JSON.parse(JSON.stringify(d)); }
  private patch(mutate: (d: WalkdownDraft) => void): void {
    const d = this.clone(this.draft()!);
    mutate(d);
    d.status = 'draft';
    this.draft.set(d);
    this.store.saveDraft(d);
  }

  // ── Global items ───────────────────────────────────────────────────────────
  globalChecked(key: string): boolean { return !!this.draft()?.globalItems?.[key]?.checked; }
  setGlobal(key: string, checked: boolean): void { this.patch(d => { d.globalItems[key] = { checked }; }); }
  globalText(g: GlobalItemDef): string | null {
    if (!g.field) return null;
    const v = this.std()?.[g.field];
    return typeof v === 'string' && v.trim() ? v : null;
  }
  orderFor(which: 'install' | 'removal'): LotoPointRef[] { return orderedPoints(this.std(), which); }

  // ── Drawings ───────────────────────────────────────────────────────────────
  private async loadDrawings(id: number): Promise<void> {
    const list = await this.drawingService.drawingDescriptors(id);
    if (list) { this.pointsWithDrawings.set(new Set(list.map(d => d.pointId))); this.drawingsChecked.set(true); }
    this.drawingService.precache(id); // fire-and-forget: cache image blobs for offline field use
  }
  hasDrawing(pointId: number): boolean { return this.pointsWithDrawings().has(pointId); }
  drawingMissing(pointId: number): boolean { return this.drawingsChecked() && !this.pointsWithDrawings().has(pointId); }
  openDrawing(p: LotoPointRef): void { this.viewerPoint.set({ pointId: p.id, tag: this.corrTag(p) || String(p.id) }); }
  closeDrawing(): void { this.viewerPoint.set(null); }
  isoName(p: LotoPointRef): string {
    const cid = this.draft()?.corrections?.[String(p.id)]?.isoPosId;
    if (cid) return this.positions().isoPos.find(o => o.id === cid)?.name ?? '';
    return p.isoPos?.name ?? p.isolatedPosition ?? '';
  }
  normName(p: LotoPointRef): string {
    const cid = this.draft()?.corrections?.[String(p.id)]?.normPosId;
    if (cid) return this.positions().normPos.find(o => o.id === cid)?.name ?? '';
    return p.normPos?.name ?? p.normalPosition ?? '';
  }

  // ── Per-point checks ───────────────────────────────────────────────────────
  checkValue(pointId: number, key: keyof PointChecklist): boolean | null | undefined {
    return this.draft()?.pointResults?.[String(pointId)]?.[key] as boolean | null | undefined;
  }
  setCheck(pointId: number, key: keyof PointChecklist, value: boolean): void {
    let cleared = false;
    this.patch(d => {
      const cur: PointChecklist = { ...(d.pointResults[String(pointId)] ?? {}) };
      cleared = cur[key] === value;
      (cur[key] as boolean | null) = cleared ? null : value;
      d.pointResults[String(pointId)] = cur;
    });
    // Confirm the tap by feel — the screen is often washed out and held at arm's length.
    this.haptics.tap(cleared ? 'tap' : value ? 'success' : 'warn');
  }
  pointNegative(pointId: number): boolean { return pointHasNegative(this.draft()?.pointResults?.[String(pointId)]); }
  pointComplete(pointId: number): boolean { return pointChecklistComplete(this.draft()?.pointResults?.[String(pointId)]); }
  comment(pointId: number): string { return this.draft()?.pointResults?.[String(pointId)]?.comment ?? ''; }
  setComment(pointId: number, text: string): void {
    this.patch(d => { d.pointResults[String(pointId)] = { ...(d.pointResults[String(pointId)] ?? {}), comment: text }; });
  }

  // ── Corrections ────────────────────────────────────────────────────────────
  corrTag(p: LotoPointRef): string { return this.draft()?.corrections?.[String(p.id)]?.tagNumber ?? p.tagNumber ?? ''; }
  corrDesc(p: LotoPointRef): string { return this.draft()?.corrections?.[String(p.id)]?.description ?? p.description ?? ''; }
  corrIso(p: LotoPointRef): number | '' {
    const c = this.draft()?.corrections?.[String(p.id)];
    return (c?.isoPosId ?? p.isoPos?.id) ?? '';
  }
  corrNorm(p: LotoPointRef): number | '' {
    const c = this.draft()?.corrections?.[String(p.id)];
    return (c?.normPosId ?? p.normPos?.id) ?? '';
  }
  corrSpecific(p: LotoPointRef): string {
    return this.draft()?.corrections?.[String(p.id)]?.specificLocation ?? p.specificLocation ?? '';
  }
  /** Effective Location Value id — pending correction wins over the persisted point value. */
  corrLocation(p: LotoPointRef): number | '' {
    const c = this.draft()?.corrections?.[String(p.id)];
    return (c?.locationId ?? p.location?.id) ?? '';
  }
  /** Effective isLockable to render — pending correction wins over the persisted point flag. */
  corrLockable(p: LotoPointRef): boolean | null {
    const cv = this.draft()?.corrections?.[String(p.id)]?.isLockable;
    // cv can be true/false/null (cleared)/undefined (never set). Only fall back on undefined,
    // so a walker's explicit null (cleared re-tap) shows the underlying point value again.
    return cv === undefined ? (p.isLockable ?? null) : cv;
  }
  corrLabeled(p: LotoPointRef): boolean | null {
    const cv = this.draft()?.corrections?.[String(p.id)]?.isLabeled;
    return cv === undefined ? (p.isLabeled ?? null) : cv;
  }
  setCorr(pointId: number, field: 'tagNumber' | 'description' | 'specificLocation', value: string): void {
    this.patch(d => { d.corrections[String(pointId)] = { ...(d.corrections[String(pointId)] ?? {}), [field]: value }; });
  }
  /**
   * Toggle a durable physical flag correction. Tap Yes/No to set; tap the active side again to
   * clear the override (so the underlying point flag stays authoritative). Cleared value is `null`
   * — the backend skips null on {@code applyCorrection}, matching the "leave as is" semantics.
   */
  setCorrFlag(pointId: number, field: 'isLockable' | 'isLabeled', value: boolean): void {
    let cleared = false;
    this.patch(d => {
      const cur = d.corrections[String(pointId)] ?? {};
      cleared = cur[field] === value;
      d.corrections[String(pointId)] = { ...cur, [field]: cleared ? null : value };
    });
    this.haptics.tap(cleared ? 'tap' : value ? 'success' : 'warn');
  }

  /**
   * canEdit-mode setter that flips BOTH the durable physical flag AND the paired checklist answer
   * in one tap. Yes ⇒ flag=true + check=Pass; No ⇒ flag=false + check=Fail; retap clears both
   * (so the walker can back out an accidental tap without leaving an orphan Pass/Fail behind).
   */
  setFlagAndCheck(pointId: number, flagField: 'isLockable' | 'isLabeled',
                  checkField: keyof PointChecklist, value: boolean): void {
    let cleared = false;
    this.patch(d => {
      const cur = d.corrections[String(pointId)] ?? {};
      cleared = cur[flagField] === value;
      d.corrections[String(pointId)] = { ...cur, [flagField]: cleared ? null : value };
      const cl = { ...(d.pointResults[String(pointId)] ?? {}) };
      (cl[checkField] as boolean | null) = cleared ? null : value;
      d.pointResults[String(pointId)] = cl;
    });
    this.haptics.tap(cleared ? 'tap' : value ? 'success' : 'warn');
  }

  /** Effective isVerified value for the dialog — pending correction wins over the point's current flag. */
  corrVerified(p: LotoPointRef): boolean | null {
    const cv = this.draft()?.corrections?.[String(p.id)]?.isVerified;
    return cv === undefined ? (p.isVerified ?? null) : cv;
  }
  /**
   * Set the persistent isVerified flag correction. Same clear-on-retap semantics as {@link setCorrFlag}.
   * Only invoked from the dialog when every check passes (template gate + defensive check here).
   */
  setCorrVerified(pointId: number, value: boolean): void {
    if (this.rowStatus(pointId) !== 'pass') return;
    let cleared = false;
    this.patch(d => {
      const cur = d.corrections[String(pointId)] ?? {};
      cleared = cur.isVerified === value;
      d.corrections[String(pointId)] = { ...cur, isVerified: cleared ? null : value };
    });
    this.haptics.tap(cleared ? 'tap' : value ? 'success' : 'warn');
  }
  setCorrPos(pointId: number, field: 'isoPosId' | 'normPosId' | 'locationId', value: string): void {
    const id = value ? Number(value) : null;
    this.patch(d => { d.corrections[String(pointId)] = { ...(d.corrections[String(pointId)] ?? {}), [field]: id }; });
  }

  // ── Notes + submit ─────────────────────────────────────────────────────────
  setNotes(text: string): void { this.patch(d => { d.notes = text; }); }

  doSubmit(): void {
    const d = this.clone(this.draft()!);
    // client-side guard: any negative needs a comment
    for (const p of this.points()) {
      const cl = d.pointResults[String(p.id)];
      if (pointHasNegative(cl) && !(cl?.comment ?? '').trim()) {
        this.flashMsg(`Point ${this.corrTag(p) || p.id}: add a comment for the failed check(s).`, true);
        return;
      }
    }
    d.transition = this.mode();
    d.capturedVersion = this.std()?.currentVersion;
    this.draft.set(d);
    this.store.saveDraft(d);

    // Optimistic: always attempt the submit. On a real network failure sync.submit() re-saves it as 'pending'
    // (queued) and it flushes on reconnect — so we don't depend on the possibly-stale online() signal here.
    this.submitting.set(true);
    this.sync.submit(d).subscribe({
      next: res => {
        this.submitting.set(false);
        if (res.standard) this.std.set(res.standard);
        this.submittedMessage.set(res.transitioned
          ? (this.mode() === 'walkdown' ? 'Walkdown complete.' : 'Standard verified.')
          : (res.transitionMessage ? `Checklist recorded. Not finalized: ${res.transitionMessage}` : 'Checklist recorded.'));
        this.submitted.set(true);
      },
      error: err => {
        this.submitting.set(false);
        const status = err?.status;
        if (status === 409) {
          this.flashMsg(err?.error?.message || 'This standard changed — reopen it to refresh.', true);
        } else if (status === 400) {
          this.flashMsg(this.msg(err), true);
        } else {
          // network / offline / 5xx — sync.submit() already queued it as 'pending'.
          this.submittedMessage.set('Saved on this device — it will submit automatically when you reconnect.');
          this.submitted.set(true);
        }
      }
    });
  }

  back(): void { this.router.navigate(['/loto-standards', this.route.snapshot.paramMap.get('id')]); }

  private flashMsg(text: string, isErr = false): void {
    this.flash.set(text); this.flashErr.set(isErr);
    setTimeout(() => { if (this.flash() === text) this.flash.set(null); }, 3500);
  }
  private msg(e: any, fallback = 'Something went wrong.'): string {
    return e?.error?.message || e?.message || fallback;
  }
}
