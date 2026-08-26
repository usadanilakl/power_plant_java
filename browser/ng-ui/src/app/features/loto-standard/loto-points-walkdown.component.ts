import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { GlobalMessageService } from '../../services/global-message.service';
import { HapticsService } from '../../services/haptics.service';
import { WakeLockService } from '../../services/wake-lock.service';
import { PortalToBodyDirective } from '../../shared/portal-to-body.directive';
import { LotoDrawingService } from './loto-drawing.service';
import { LotoDrawingViewerComponent } from './loto-drawing-viewer.component';
import { LotoPointActionsComponent } from './loto-point-actions.component';
import { LotoPointApiService } from './loto-point-api.service';
import { LotoStandardApiService } from './loto-standard-api.service';
import {
  LotoPointRef, LotoStandard, PointChecklist, PointCorrection, PointDrawing,
  PositionOptions, WalkdownGroup, WalkdownGroupBy, groupPointsForWalkdown,
  pointChecklistComplete, pointHasNegative,
} from './loto-standard.model';

/**
 * Loto Points Walkdown — a standard-independent walkdown of a PILE of LOTO points.
 *
 * <p>Two entry modes, both feeding the same summary-list + per-point dialog UX as the
 * LOTO Standard walkdown:
 *   1. Pick one or more LOTO Standards → union of all their points
 *   2. Pick a Location Value (or type a System name) → every point matching
 *
 * <p>Contrast with the standard walkdown:
 *   - No LotoStandard context, no snapshot, no verify/walkdown transition
 *   - Pass/Fail answers are IN-MEMORY ONLY (session state) — for the walker to track progress
 *   - Persistent evidence is {@code LotoPoint.isVerified} (per point) plus any inline corrections
 *   - Corrections + isVerified save PER-TAP (POST /api/pwa/secured/loto-points/{id}/apply-correction)
 *
 * <p>Deliberately doesn't cache anything offline — this is an ad-hoc field verification tool,
 * not a checklist-of-record; if the walker loses signal they can retry, and the persistent
 * isVerified/inline fixes that already saved stay saved.
 */
@Component({
  selector: 'app-loto-points-walkdown',
  standalone: true,
  imports: [MainLayoutComponent, LotoDrawingViewerComponent, LotoPointActionsComponent, PortalToBodyDirective],
  template: `
    <app-main-layout [header]="'LOTO Points Walkdown'">
      <ng-container main-content>
        <div class="w-container">
          <button class="w-back" (click)="back()">← Home</button>

          @if (!pileLoaded()) {
            <!-- Entry selector -->
            <h1 class="w-title">Walk down LOTO points</h1>
            <p class="w-hint">Choose what to walk down — pick one or more standards, a location, or a system.
              The picked points come back as one pile you can group by location or system.</p>

            <div class="w-picker">
              <h2 class="w-h2">By LOTO Standards</h2>
              @if (loadingStandards()) {
                <p class="w-msg">Loading standards…</p>
              } @else if (allStandards().length === 0) {
                <p class="w-msg">No standards found.</p>
              } @else {
                <input class="w-search" type="search" placeholder="Filter standards…"
                       [value]="stdSearch()" (input)="stdSearch.set($any($event.target).value)">
                <!-- Select-all / clear-all for the visible standards (respects the search filter). -->
                <label class="w-std-row w-std-all">
                  <input type="checkbox"
                         [checked]="allVisibleStandardsPicked()"
                         [indeterminate]="someVisibleStandardsPicked() && !allVisibleStandardsPicked()"
                         (change)="toggleAllVisibleStandards($any($event.target).checked)">
                  <span class="w-std-name">
                    {{ allVisibleStandardsPicked() ? 'Clear all' : 'Select all' }}
                    ({{ filteredStandards().length }})
                  </span>
                </label>
                <div class="w-std-list">
                  @for (s of filteredStandards(); track s.id) {
                    <label class="w-std-row">
                      <input type="checkbox" [checked]="isStandardPicked(s.id)"
                             (change)="toggleStandard(s.id, $any($event.target).checked)">
                      <span class="w-std-name">{{ s.name || ('Standard #' + s.id) }}</span>
                      <span class="w-std-meta">{{ s.developmentStatus?.name || 'Draft' }} · {{ s.lotoPoints?.length || 0 }} pts</span>
                    </label>
                  }
                </div>
              }
            </div>

            <div class="w-picker">
              <h2 class="w-h2">By Location (any of)</h2>
              <select class="w-inline-input w-multi" multiple size="6"
                      (change)="onMultiIds('location', $any($event.target))">
                @for (o of positions().location; track o.id) {
                  <option [value]="o.id" [selected]="pickedLocationIds().includes(o.id)">{{ o.name }}</option>
                }
              </select>
              <p class="w-multi-hint">Tap to toggle. Multiple selected → OR match.</p>
            </div>

            <div class="w-picker">
              <h2 class="w-h2">By Equipment Type (any of)</h2>
              @if (positions().eqType.length === 0) {
                <p class="w-msg">No equipment-type values configured.</p>
              } @else {
                <select class="w-inline-input w-multi" multiple size="6"
                        (change)="onMultiIds('eqType', $any($event.target))">
                  @for (o of positions().eqType; track o.id) {
                    <option [value]="o.id" [selected]="pickedEqTypeIds().includes(o.id)">{{ o.name }}</option>
                  }
                </select>
                <p class="w-multi-hint">Tap to toggle. Multiple selected → OR match.</p>
              }
            </div>

            <div class="w-picker">
              <h2 class="w-h2">By System (any of)</h2>
              @if (loadingSystems()) {
                <p class="w-msg">Loading systems…</p>
              } @else {
                <select class="w-inline-input w-multi" multiple size="6"
                        (change)="onMultiStrings('system', $any($event.target))">
                  @for (s of allSystems(); track s) {
                    <option [value]="s" [selected]="pickedSystems().includes(s)">{{ s }}</option>
                  }
                </select>
                <p class="w-multi-hint">Tap to toggle. Multiple selected → OR match.</p>
              }
            </div>

            <details class="w-picker w-more-filters">
              <summary>More filters (tag / description / positions / unit)</summary>
              <label class="w-field-lbl">Tag contains
                <input class="w-inline-input" type="text" [value]="pickedTag()" (input)="pickedTag.set($any($event.target).value)"
                       placeholder="e.g. 89G">
              </label>
              <label class="w-field-lbl">Description contains
                <input class="w-inline-input" type="text" [value]="pickedDescription()" (input)="pickedDescription.set($any($event.target).value)"
                       placeholder="e.g. breaker">
              </label>
              <label class="w-field-lbl">Specific location contains
                <input class="w-inline-input" type="text" [value]="pickedSpecificLocation()" (input)="pickedSpecificLocation.set($any($event.target).value)">
              </label>
              <label class="w-field-lbl">Unit
                <select class="w-inline-input" [value]="pickedUnit() ?? ''" (change)="pickedUnit.set($any($event.target).value || null)">
                  <option value="">— any —</option>
                  @for (u of allUnits(); track u) {
                    <option [value]="u" [selected]="u === pickedUnit()">{{ u }}</option>
                  }
                </select>
              </label>
              <label class="w-field-lbl">Isolation position
                <select class="w-inline-input" [value]="pickedIsoPosId() ?? ''" (change)="pickedIsoPosId.set(numOrNull($any($event.target).value))">
                  <option value="">— any —</option>
                  @for (o of positions().isoPos; track o.id) {
                    <option [value]="o.id" [selected]="o.id === pickedIsoPosId()">{{ o.name }}</option>
                  }
                </select>
              </label>
              <label class="w-field-lbl">Restored position
                <select class="w-inline-input" [value]="pickedNormPosId() ?? ''" (change)="pickedNormPosId.set(numOrNull($any($event.target).value))">
                  <option value="">— any —</option>
                  @for (o of positions().normPos; track o.id) {
                    <option [value]="o.id" [selected]="o.id === pickedNormPosId()">{{ o.name }}</option>
                  }
                </select>
              </label>
            </details>

            @if (loadPileError()) { <p class="w-msg w-error">{{ loadPileError() }}</p> }

            <button class="w-finish-btn" [disabled]="!canLoadPile() || loadingPile()" (click)="loadPile()">
              {{ loadingPile() ? 'Loading…' : 'Load points' }}
            </button>
            @if (canLoadPile()) {
              <button class="w-save w-save-secondary" (click)="clearFilters()">Clear all filters</button>
            }
          } @else if (submitted()) {
            <div class="w-done">
              <div class="w-done-icon">✓</div>
              <p class="w-done-title">Walkdown session ended.</p>
              <button class="w-save" (click)="resetPile()">Pick different points</button>
              <button class="w-save w-save-secondary" (click)="back()">Back to home</button>
            </div>
          } @else {
            <div class="w-pile-head">
              <h1 class="w-title">{{ points().length }} point(s) — walk down</h1>
              <button class="w-back w-inline-back" (click)="resetPile()">Change selection</button>
            </div>
            <p class="w-hint">Pass/Fail marks are IN-MEMORY only — for tracking progress this session.
              Inline edits and <b>Point verified</b> save to the LOTO point immediately.</p>

            <div class="w-groupbar" role="tablist" aria-label="Group and sort points">
              <button class="w-groupbtn" [class.active]="groupBy() === 'system'" (click)="groupBy.set('system')">System</button>
              <button class="w-groupbtn" [class.active]="groupBy() === 'location'" (click)="groupBy.set('location')">Location</button>
              <button class="w-groupbtn" [class.active]="groupBy() === 'eqType'" (click)="groupBy.set('eqType')">Equipment type</button>
            </div>

            @for (g of groups(); track g.key) {
              <details class="w-group" [open]="g.status !== 'pass'">
                <summary class="w-group-summary" [attr.data-status]="g.status">
                  <span class="w-group-label">{{ g.label }}</span>
                  <span class="w-group-meta">
                    <span class="w-group-count">{{ g.points.length }}</span>
                    <span class="w-group-badge" [attr.data-status]="g.status">{{ groupStatusLabel(g.status) }}</span>
                  </span>
                </summary>
                <div class="w-group-list">
                  @for (p of g.points; track p.id) {
                    <button class="w-row" [attr.data-status]="rowStatus(p.id)"
                            [attr.data-verified]="p.isVerified === true"
                            (click)="openPointDialog(p.id)">
                      <span class="w-row-tag">{{ corrTag(p) || '—' }}</span>
                      <span class="w-row-desc">{{ corrDesc(p) || '(no description)' }}</span>
                      <span class="w-row-loc">{{ locName(p) || corrSpecific(p) || '—' }}</span>
                      <span class="w-row-status" [attr.data-status]="rowStatus(p.id)">
                        @if (p.isVerified === true) { ✓ Verified } @else { {{ rowStatusLabel(p.id) }} }
                      </span>
                    </button>
                  }
                </div>
              </details>
            }

            <div class="w-sticky">
              <div class="w-sticky-progress">
                <span>{{ verifiedCount() }} / {{ points().length }} verified</span>
                <span>· {{ passedCount() }} passing this session</span>
              </div>
              <button class="w-finish-btn" (click)="finish()">Finish session</button>
            </div>
          }

          <!-- Per-point dialog — same shape as loto-standard-walkdown, but every mutation
               is either in-memory (checks) or immediately saved via applyPointCorrection. -->
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

                  <div class="w-field-row">
                    <div class="w-field-value">
                      <input class="w-inline-input" type="text" [value]="corrTag(ap)"
                             (change)="saveTag(ap.id, $any($event.target).value)">
                      <span class="w-field-caption">Tag numbers match</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'tagNumbersMatch') === true"
                              (click)="setCheck(ap.id, 'tagNumbersMatch', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'tagNumbersMatch') === false"
                              (click)="setCheck(ap.id, 'tagNumbersMatch', false)">Fail</button>
                    </span>
                  </div>

                  <div class="w-field-row w-field-editonly">
                    <div class="w-field-value">
                      <input class="w-inline-input" type="text" [value]="corrDesc(ap)" placeholder="Description"
                             (change)="saveDescription(ap.id, $any($event.target).value)">
                      <span class="w-field-caption">Description</span>
                    </div>
                  </div>

                  <div class="w-field-row">
                    <div class="w-field-value w-field-value-wide">
                      <span class="w-field-caption">Metal tag present</span>
                    </div>
                    <span class="w-mini-toggle">
                      <button class="w-yn pass" [class.active]="corrLabeled(ap) === true"
                              (click)="setFlagAndCheck(ap.id, 'isLabeled', 'metalTagPresent', true)">Yes</button>
                      <button class="w-yn fail" [class.active]="corrLabeled(ap) === false"
                              (click)="setFlagAndCheck(ap.id, 'isLabeled', 'metalTagPresent', false)">No</button>
                    </span>
                  </div>

                  <div class="w-field-row">
                    <div class="w-field-value">
                      <select class="w-inline-input" [value]="corrIso(ap)"
                              (change)="savePosition(ap.id, 'isoPosId', $any($event.target).value)">
                        <option value="">—</option>
                        @for (o of positions().isoPos; track o.id) {
                          <option [value]="o.id" [selected]="o.id === corrIso(ap)">{{ o.name }}</option>
                        }
                      </select>
                      <span class="w-field-caption">Isolation position correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'isolationPositionCorrect') === true"
                              (click)="setCheck(ap.id, 'isolationPositionCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'isolationPositionCorrect') === false"
                              (click)="setCheck(ap.id, 'isolationPositionCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <div class="w-field-row">
                    <div class="w-field-value">
                      <select class="w-inline-input" [value]="corrNorm(ap)"
                              (change)="savePosition(ap.id, 'normPosId', $any($event.target).value)">
                        <option value="">—</option>
                        @for (o of positions().normPos; track o.id) {
                          <option [value]="o.id" [selected]="o.id === corrNorm(ap)">{{ o.name }}</option>
                        }
                      </select>
                      <span class="w-field-caption">Restored position correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'restoredPositionCorrect') === true"
                              (click)="setCheck(ap.id, 'restoredPositionCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'restoredPositionCorrect') === false"
                              (click)="setCheck(ap.id, 'restoredPositionCorrect', false)">Fail</button>
                    </span>
                  </div>

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

                  <div class="w-field-row">
                    <div class="w-field-value">
                      <input class="w-inline-input" type="text" [value]="corrSpecific(ap)" placeholder="Specific location"
                             (change)="saveSpecificLocation(ap.id, $any($event.target).value)">
                      <span class="w-field-caption">Specific location correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'specificLocationCorrect') === true"
                              (click)="setCheck(ap.id, 'specificLocationCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'specificLocationCorrect') === false"
                              (click)="setCheck(ap.id, 'specificLocationCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <div class="w-field-row">
                    <div class="w-field-value">
                      <select class="w-inline-input" [value]="corrLocation(ap)"
                              (change)="savePosition(ap.id, 'locationId', $any($event.target).value)">
                        <option value="">—</option>
                        @for (o of positions().location; track o.id) {
                          <option [value]="o.id" [selected]="o.id === corrLocation(ap)">{{ o.name }}</option>
                        }
                      </select>
                      <span class="w-field-caption">Location correct</span>
                    </div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'locationCorrect') === true"
                              (click)="setCheck(ap.id, 'locationCorrect', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'locationCorrect') === false"
                              (click)="setCheck(ap.id, 'locationCorrect', false)">Fail</button>
                    </span>
                  </div>

                  <div class="w-field-row">
                    <div class="w-field-value w-field-value-wide">
                      <span class="w-field-caption">Equipment lockable</span>
                    </div>
                    <span class="w-mini-toggle">
                      <button class="w-yn pass" [class.active]="corrLockable(ap) === true"
                              (click)="setFlagAndCheck(ap.id, 'isLockable', 'equipmentLockable', true)">Yes</button>
                      <button class="w-yn fail" [class.active]="corrLockable(ap) === false"
                              (click)="setFlagAndCheck(ap.id, 'isLockable', 'equipmentLockable', false)">No</button>
                    </span>
                  </div>

                  <div class="w-field-row w-field-standalone">
                    <div class="w-field-value"><span class="w-field-caption">Equipment accessible</span></div>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(ap.id, 'equipmentAccessible') === true"
                              (click)="setCheck(ap.id, 'equipmentAccessible', true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(ap.id, 'equipmentAccessible') === false"
                              (click)="setCheck(ap.id, 'equipmentAccessible', false)">Fail</button>
                    </span>
                  </div>

                  <!-- isVerified — visible only when every check passes, saved immediately. -->
                  @if (rowStatus(ap.id) === 'pass') {
                    <div class="w-field-row w-verified-row">
                      <div class="w-field-value w-field-value-wide">
                        <span class="w-field-caption">Point verified</span>
                        <span class="w-hint">Persistent on the LOTO Point — saves as soon as you tap.</span>
                      </div>
                      <span class="w-mini-toggle">
                        <button class="w-yn pass" [class.active]="ap.isVerified === true"
                                (click)="saveVerified(ap.id, true)">Yes</button>
                        <button class="w-yn fail" [class.active]="ap.isVerified === false"
                                (click)="saveVerified(ap.id, false)">No</button>
                      </span>
                    </div>
                  }

                  <app-loto-point-actions [pointId]="ap.id" [pointLabel]="corrTag(ap) || null" />
                </div>

                <div class="w-dialog-foot">
                  <span class="w-dialog-status" [attr.data-status]="rowStatus(ap.id)">{{ rowStatusLabel(ap.id) }}</span>
                  <button class="w-save" (click)="closePointDialog()">Done</button>
                </div>
              </div>
            </div>
          }

          @if (viewerPoint(); as vp) {
            <app-loto-drawing-viewer [drawings]="drawingsForPoint(vp.pointId)" [title]="vp.tag"
                                     (close)="viewerPoint.set(null)"></app-loto-drawing-viewer>
          }

          @if (flash()) { <div class="w-flash" [class.err]="flashErr()">{{ flash() }}</div> }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .w-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 0.5rem; }
    .w-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .w-inline-back { margin-left: auto; }
    .w-msg { text-align: center; color: var(--secondary-text); padding: 1rem; }
    .w-error { color: var(--danger-text); }
    .w-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-text); margin: 0.4rem 0 0.5rem; }
    .w-hint { color: var(--secondary-text); font-size: 0.85rem; font-style: italic; margin: 0 0 0.75rem; }
    .w-h2 { font-size: 1rem; font-weight: 700; color: var(--primary-text); margin: 1rem 0 0.5rem; }
    .w-picker { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.75rem; margin-bottom: 0.75rem; background: var(--card-bg, var(--secondary-background)); }
    .w-picker .w-h2 { margin-top: 0; }
    .w-more-filters summary { cursor: pointer; color: var(--accent-color); font-weight: 700; padding: 0.4rem 0; min-height: 44px; display: flex; align-items: center; }
    .w-field-lbl { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.72rem; color: var(--secondary-text); text-transform: uppercase; letter-spacing: 0.02em; margin: 0.55rem 0; }
    .w-multi { min-height: 8rem; padding: 0.25rem; }
    .w-multi-hint { font-size: 0.72rem; color: var(--secondary-text); font-style: italic; margin: 0.35rem 0 0; }
    .w-std-all { border-bottom: 1px solid var(--border-color); font-weight: 700; background: var(--secondary-background); }
    .w-search { width: 100%; box-sizing: border-box; padding: 0.5rem 0.7rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--secondary-background); color: var(--primary-text); font: inherit; margin-bottom: 0.5rem; }
    .w-std-list { display: flex; flex-direction: column; gap: 0.25rem; max-height: 40vh; overflow-y: auto; }
    .w-std-row { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: center; padding: 0.4rem; border-radius: 6px; cursor: pointer; min-height: 44px; }
    .w-std-row:hover { background: var(--hover-bg, rgba(255,255,255,0.03)); }
    .w-std-name { color: var(--primary-text); font-size: 0.9rem; font-weight: 500; }
    .w-std-meta { color: var(--secondary-text); font-size: 0.75rem; }
    .w-finish-btn { width: 100%; min-height: 52px; background: var(--success-solid); color: var(--on-solid); border: none; border-radius: 10px; padding: 0.8rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 0.5rem; }
    .w-finish-btn:disabled { opacity: 0.5; cursor: default; }
    .w-pile-head { display: flex; align-items: baseline; justify-content: space-between; }

    /* Groups, rows, and dialog reuse the class shapes from the sibling loto-standard-walkdown
       component. Duplicated here (rather than styleUrl'd) so tree-shaking doesn't leak across. */
    .w-groupbar { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.4rem 0 0.75rem; }
    .w-groupbtn { min-height: 40px; padding: 0.4rem 0.85rem; border: 1px solid var(--border-color); background: transparent; color: var(--secondary-text); border-radius: 999px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit; }
    .w-groupbtn.active { background: var(--accent-color); border-color: var(--accent-color); color: var(--on-solid); }
    .w-group { border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 0.5rem; overflow: hidden; background: var(--card-bg, var(--secondary-background)); }
    .w-group[open] > .w-group-summary { border-bottom: 1px solid var(--border-color); }
    .w-group-summary { list-style: none; padding: 0.55rem 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; cursor: pointer; min-height: 44px; }
    .w-group-summary::-webkit-details-marker { display: none; }
    .w-group-label { font-weight: 700; color: var(--primary-text); font-size: 0.92rem; flex: 1; }
    .w-group-meta { display: flex; align-items: center; gap: 0.5rem; }
    .w-group-count { color: var(--secondary-text); font-size: 0.75rem; }
    .w-group-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; white-space: nowrap; }
    .w-group-badge[data-status="pass"] { background: var(--success-solid); color: var(--on-solid); }
    .w-group-badge[data-status="fail"] { background: var(--danger-solid); color: var(--on-solid); }
    .w-group-badge[data-status="incomplete"] { background: var(--border-color); color: var(--primary-text); }
    .w-group-list { display: flex; flex-direction: column; }
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
    .w-row[data-verified="true"] { background: rgba(76,175,80,0.08); }
    .w-tag { font-weight: 700; color: var(--primary-text); }
    .w-flag-missing { font-size: 0.72rem; font-weight: 700; color: var(--warning-text); white-space: nowrap; }
    .w-drawing-btn { background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); border-radius: 8px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-check-btns { display: flex; gap: 0.4rem; flex-shrink: 0; }
    .w-yn { min-height: 44px; min-width: 64px; border: 1px solid var(--border-color); background: transparent; color: var(--secondary-text); border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-yn.pass.active { background: var(--success-solid); border-color: var(--success-solid); color: var(--on-solid); }
    .w-yn.fail.active { background: var(--danger-solid); border-color: var(--danger-solid); color: var(--on-solid); }
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
    .w-field-row { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); }
    .w-field-row:last-child { border-bottom: none; }
    .w-field-row.w-field-standalone .w-field-value { color: var(--primary-text); font-weight: 500; }
    .w-field-row.w-field-editonly { justify-content: flex-start; }
    .w-field-value { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; min-width: 0; }
    .w-field-value-wide { flex: 1; }
    .w-field-caption { font-size: 0.72rem; color: var(--secondary-text); text-transform: uppercase; letter-spacing: 0.02em; }
    .w-inline-input { padding: 0.45rem 0.55rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--secondary-background); color: var(--primary-text); font: inherit; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
    .w-inline-span { color: var(--primary-text); font-size: 0.9rem; font-weight: 500; overflow-wrap: anywhere; }
    .w-mini-toggle { display: inline-flex; gap: 0.3rem; }
    .w-verified-row { border-top: 2px solid var(--accent-color); margin-top: 0.4rem; padding-top: 0.6rem; }
    .w-verified-row .w-field-caption { color: var(--accent-color); }
    .w-sticky { position: sticky; bottom: 0; margin: 0 -1rem; padding: 0.6rem 1rem calc(0.6rem + env(safe-area-inset-bottom, 0px)); background: var(--primary-background); border-top: 1px solid var(--border-color); box-shadow: 0 -2px 10px rgba(0,0,0,0.08); }
    .w-sticky-progress { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; font-size: 0.8rem; color: var(--secondary-text); margin-bottom: 0.45rem; }
    .w-flash { position: fixed; bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px)); left: 50%; transform: translateX(-50%); background: var(--primary-text); color: var(--primary-background); padding: 0.6rem 1.1rem; border-radius: 999px; font-size: 0.85rem; box-shadow: 0 3px 12px rgba(0,0,0,0.3); z-index: 50; max-width: 90%; text-align: center; }
    .w-flash.err { background: var(--danger-solid); color: var(--on-solid); }
    .w-done { text-align: center; padding: 2.5rem 1rem; }
    .w-done-icon { width: 3.5rem; height: 3.5rem; line-height: 3.5rem; margin: 0 auto 0.75rem; border-radius: 50%; background: var(--success-solid); color: var(--on-solid); font-size: 2rem; }
    .w-done-title { color: var(--primary-text); font-size: 1.05rem; margin-bottom: 1.25rem; }
    .w-save { background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; margin: 0.3rem; }
    .w-save-secondary { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); }
  `],
})
export class LotoPointsWalkdownComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private pointApi = inject(LotoPointApiService);
  private drawingService = inject(LotoDrawingService);
  private messageService = inject(GlobalMessageService);
  private haptics = inject(HapticsService);
  private wakeLock = inject(WakeLockService).bindTo();

  // ── Entry selector state ─────────────────────────────────────────────────
  allStandards = signal<LotoStandard[]>([]);
  loadingStandards = signal(true);
  stdSearch = signal('');
  filteredStandards = computed(() => {
    const term = this.stdSearch().trim().toLowerCase();
    const list = this.allStandards();
    if (!term) return list;
    return list.filter(s => (s.name ?? '').toLowerCase().includes(term));
  });
  private pickedStandardIds = signal<Set<number>>(new Set());
  isStandardPicked = (id: number): boolean => this.pickedStandardIds().has(id);
  toggleStandard(id: number, checked: boolean): void {
    const next = new Set(this.pickedStandardIds());
    if (checked) next.add(id); else next.delete(id);
    this.pickedStandardIds.set(next);
  }

  allSystems = signal<string[]>([]);
  allUnits = signal<string[]>([]);
  loadingSystems = signal(true);
  pickedSystems = signal<string[]>([]);
  pickedLocationIds = signal<number[]>([]);
  pickedEqTypeIds = signal<number[]>([]);
  pickedTag = signal('');
  pickedDescription = signal('');
  pickedSpecificLocation = signal('');
  pickedUnit = signal<string | null>(null);
  pickedIsoPosId = signal<number | null>(null);
  pickedNormPosId = signal<number | null>(null);
  positions = signal<PositionOptions>({ isoPos: [], normPos: [], location: [], eqType: [] });

  canLoadPile = computed(() =>
    this.pickedStandardIds().size > 0
      || this.pickedLocationIds().length > 0
      || this.pickedEqTypeIds().length > 0
      || this.pickedSystems().length > 0
      || !!this.pickedTag().trim()
      || !!this.pickedDescription().trim()
      || !!this.pickedSpecificLocation().trim()
      || !!(this.pickedUnit() ?? '').trim()
      || this.pickedIsoPosId() != null
      || this.pickedNormPosId() != null);

  numOrNull(v: string): number | null { return v ? Number(v) : null; }

  clearFilters(): void {
    this.pickedStandardIds.set(new Set());
    this.pickedSystems.set([]);
    this.pickedLocationIds.set([]);
    this.pickedEqTypeIds.set([]);
    this.pickedTag.set('');
    this.pickedDescription.set('');
    this.pickedSpecificLocation.set('');
    this.pickedUnit.set(null);
    this.pickedIsoPosId.set(null);
    this.pickedNormPosId.set(null);
    this.loadPileError.set(null);
  }

  // ── Multi-select helpers for <select multiple> — collect selected option values ──

  /** Read every selected <option> value from a native multi-select and push it into the target signal. */
  onMultiIds(field: 'location' | 'eqType', el: HTMLSelectElement): void {
    const ids = Array.from(el.selectedOptions).map(o => Number(o.value)).filter(n => !Number.isNaN(n));
    if (field === 'location') this.pickedLocationIds.set(ids);
    else this.pickedEqTypeIds.set(ids);
  }
  onMultiStrings(field: 'system', el: HTMLSelectElement): void {
    const vals = Array.from(el.selectedOptions).map(o => o.value).filter(s => !!s);
    if (field === 'system') this.pickedSystems.set(vals);
  }

  // ── Select-all / clear-all standards (honors the current stdSearch filter) ──

  allVisibleStandardsPicked(): boolean {
    const vis = this.filteredStandards();
    if (vis.length === 0) return false;
    const picked = this.pickedStandardIds();
    return vis.every(s => picked.has(s.id));
  }
  someVisibleStandardsPicked(): boolean {
    const picked = this.pickedStandardIds();
    return this.filteredStandards().some(s => picked.has(s.id));
  }
  toggleAllVisibleStandards(check: boolean): void {
    const next = new Set(this.pickedStandardIds());
    const vis = this.filteredStandards();
    if (check) {
      for (const s of vis) next.add(s.id);
    } else {
      for (const s of vis) next.delete(s.id);
    }
    this.pickedStandardIds.set(next);
  }

  // ── Pile / walkdown state ────────────────────────────────────────────────
  points = signal<LotoPointRef[]>([]);
  loadingPile = signal(false);
  loadPileError = signal<string | null>(null);
  pileLoaded = computed(() => this.points().length > 0);
  submitted = signal(false);

  /** In-memory checklist answers — NOT persisted; a fresh session starts blank. */
  pointResults = signal<Record<string, PointChecklist>>({});
  /** In-memory correction snapshot (used for the dialog's "pending" display before a save round-trips). */
  corrections = signal<Record<string, PointCorrection>>({});

  groupBy = signal<WalkdownGroupBy>('system');
  groups = computed<WalkdownGroup[]>(() =>
    // Fake a LotoStandard shell so we can reuse the shared grouping helper.
    groupPointsForWalkdown({ id: 0, lotoPoints: this.points() } as LotoStandard,
      this.groupBy(), this.pointResults())
  );

  activePointId = signal<number | null>(null);
  activePoint = computed<LotoPointRef | null>(() => {
    const id = this.activePointId();
    if (id == null) return null;
    return this.points().find(p => p.id === id) ?? null;
  });
  openPointDialog(pointId: number): void {
    // [appPortalToBody] on the .w-dialog-backdrop moves it to <body> when @if creates it and
    // locks background scroll — the fix pattern used by the Maximo WO detail modal. Without
    // this the modal is trapped by main-layout's transformed ancestor (a new containing block
    // for position:fixed) and would render outside the current viewport.
    this.activePointId.set(pointId);
    this.haptics.tap('tap');
  }
  closePointDialog(): void { this.activePointId.set(null); }

  viewerPoint = signal<{ pointId: number; tag: string } | null>(null);
  /**
   * Descriptors per point, resolved once after the pile loads via {@link LotoPointApiService.getDrawingsForPoints}.
   * The points-pile isn't tied to one standard, so we bypass the standard-scoped precache and pass descriptors
   * straight into {@code <app-loto-drawing-viewer [drawings]>} — the viewer's per-file image bytes still flow
   * through {@link LotoDrawingService.imageObjectUrl}, so the blob cache is shared with the standard walkdown.
   */
  private pointDrawings = signal<Record<number, PointDrawing[]>>({});
  hasDrawing(pointId: number): boolean { return (this.pointDrawings()[pointId]?.length ?? 0) > 0; }
  drawingsForPoint(pointId: number): PointDrawing[] { return this.pointDrawings()[pointId] ?? []; }
  openDrawing(p: LotoPointRef): void {
    if (!this.hasDrawing(p.id)) return;
    this.viewerPoint.set({ pointId: p.id, tag: this.corrTag(p) || String(p.id) });
  }

  flash = signal<string | null>(null);
  flashErr = signal(false);
  private showFlash(text: string, isErr = false): void {
    this.flash.set(text); this.flashErr.set(isErr);
    setTimeout(() => { if (this.flash() === text) this.flash.set(null); }, 3000);
  }

  // ── Helpers reused across the dialog ─────────────────────────────────────
  checkValue(pointId: number, key: keyof PointChecklist): boolean | null | undefined {
    return this.pointResults()[String(pointId)]?.[key] as boolean | null | undefined;
  }
  setCheck(pointId: number, key: keyof PointChecklist, value: boolean): void {
    const results = { ...this.pointResults() };
    const cur = { ...(results[String(pointId)] ?? {}) };
    const cleared = cur[key] === value;
    (cur[key] as boolean | null) = cleared ? null : value;
    results[String(pointId)] = cur;
    this.pointResults.set(results);
    this.haptics.tap(cleared ? 'tap' : value ? 'success' : 'warn');
  }
  comment(pointId: number): string { return this.pointResults()[String(pointId)]?.comment ?? ''; }
  pointNegative(pointId: number): boolean { return pointHasNegative(this.pointResults()[String(pointId)]); }
  pointComplete(pointId: number): boolean { return pointChecklistComplete(this.pointResults()[String(pointId)]); }

  rowStatus(pointId: number): 'pass' | 'fail' | 'incomplete' {
    const c = this.pointResults()[String(pointId)];
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

  // Correction reads — pending correction first, then persisted point value.
  corrTag(p: LotoPointRef): string { return this.corrections()[String(p.id)]?.tagNumber ?? p.tagNumber ?? ''; }
  corrDesc(p: LotoPointRef): string { return this.corrections()[String(p.id)]?.description ?? p.description ?? ''; }
  corrSpecific(p: LotoPointRef): string { return this.corrections()[String(p.id)]?.specificLocation ?? p.specificLocation ?? ''; }
  corrIso(p: LotoPointRef): number | '' {
    const c = this.corrections()[String(p.id)];
    return (c?.isoPosId ?? p.isoPos?.id) ?? '';
  }
  corrNorm(p: LotoPointRef): number | '' {
    const c = this.corrections()[String(p.id)];
    return (c?.normPosId ?? p.normPos?.id) ?? '';
  }
  corrLocation(p: LotoPointRef): number | '' {
    const c = this.corrections()[String(p.id)];
    return (c?.locationId ?? p.location?.id) ?? '';
  }
  corrLabeled(p: LotoPointRef): boolean | null {
    const cv = this.corrections()[String(p.id)]?.isLabeled;
    return cv === undefined ? (p.isLabeled ?? null) : cv;
  }
  corrLockable(p: LotoPointRef): boolean | null {
    const cv = this.corrections()[String(p.id)]?.isLockable;
    return cv === undefined ? (p.isLockable ?? null) : cv;
  }
  locName(p: LotoPointRef): string {
    const cid = this.corrections()[String(p.id)]?.locationId;
    if (cid) return this.positions().location.find(o => o.id === cid)?.name ?? '';
    return p.location?.name ?? '';
  }

  // ── Immediate-save helpers ──────────────────────────────────────────────
  saveTag(pointId: number, value: string): void {
    this.applyAndSave(pointId, { tagNumber: value }, `Tag saved`);
  }
  saveDescription(pointId: number, value: string): void {
    this.applyAndSave(pointId, { description: value }, `Description saved`);
  }
  saveSpecificLocation(pointId: number, value: string): void {
    this.applyAndSave(pointId, { specificLocation: value }, `Specific location saved`);
  }
  savePosition(pointId: number, field: 'isoPosId' | 'normPosId' | 'locationId', value: string): void {
    const id = value ? Number(value) : null;
    this.applyAndSave(pointId, { [field]: id } as PointCorrection,
      field === 'locationId' ? 'Location saved' : field === 'isoPosId' ? 'Isolation saved' : 'Restored saved');
  }
  setFlagAndCheck(pointId: number, flagField: 'isLockable' | 'isLabeled',
                  checkField: keyof PointChecklist, value: boolean): void {
    // Mirror the clear-on-retap semantics from the standard walkdown.
    const cur = this.corrections()[String(pointId)] ?? {};
    const cleared = cur[flagField] === value;
    const nextVal: boolean | null = cleared ? null : value;
    this.applyAndSave(pointId, { [flagField]: nextVal } as PointCorrection,
      cleared ? 'Cleared' : flagField === 'isLabeled' ? (value ? 'Labeled' : 'Not labeled') : (value ? 'Lockable' : 'Not lockable'));
    // Set the paired checklist answer too (in-memory).
    const results = { ...this.pointResults() };
    const cl = { ...(results[String(pointId)] ?? {}) };
    (cl[checkField] as boolean | null) = nextVal;
    results[String(pointId)] = cl;
    this.pointResults.set(results);
    this.haptics.tap(cleared ? 'tap' : value ? 'success' : 'warn');
  }
  saveVerified(pointId: number, value: boolean): void {
    if (this.rowStatus(pointId) !== 'pass') return;
    // Retap the active side clears — same UX as the standard walkdown's setCorrVerified.
    const current = this.points().find(p => p.id === pointId)?.isVerified === true;
    const shouldClear = current === value;
    const nextVal = shouldClear ? null : value;
    this.applyAndSave(pointId, { isVerified: nextVal }, nextVal === true ? 'Verified' : nextVal === false ? 'Un-verified' : 'Cleared');
  }

  /** POST one correction + optimistically update local point cache from the server response. */
  private applyAndSave(pointId: number, patch: PointCorrection, successLabel: string): void {
    // Stash pending into corrections so the dialog reflects the new value immediately.
    const c = { ...this.corrections() };
    c[String(pointId)] = { ...(c[String(pointId)] ?? {}), ...patch };
    this.corrections.set(c);

    this.api.applyPointCorrection(pointId, patch).subscribe({
      next: (fresh) => {
        if (fresh) {
          // Merge the server-returned point back into the pile so isVerified / persisted values
          // reflect what's now on the record. Wipes the pending correction for this row.
          this.points.set(this.points().map(p => p.id === pointId ? { ...p, ...fresh } as LotoPointRef : p));
          const cn = { ...this.corrections() }; delete cn[String(pointId)]; this.corrections.set(cn);
        }
        this.showFlash(successLabel);
      },
      error: (err) => {
        // Roll back the pending correction — the server didn't take it.
        const cn = { ...this.corrections() }; delete cn[String(pointId)]; this.corrections.set(cn);
        this.showFlash(err?.error?.message ?? err?.message ?? 'Save failed', true);
      },
    });
  }

  // ── Progress metrics for the sticky footer ────────────────────────────────
  verifiedCount = computed(() => this.points().filter(p => p.isVerified === true).length);
  passedCount = computed(() => this.points().filter(p => this.rowStatus(p.id) === 'pass').length);

  ngOnInit(): void {
    // Load pickers in parallel — they're independent.
    forkJoin({
      stds: this.api.getAll().pipe(catchError(() => of([] as LotoStandard[]))),
      pos: this.api.getPositions().pipe(catchError(() => of(null))),
      sys: this.api.getPointSystems().pipe(catchError(() => of([] as string[]))),
      opts: this.api.getPointFilterOptions().pipe(catchError(() => of({ units: [] as string[] }))),
    }).subscribe(({ stds, pos, sys, opts }) => {
      this.allStandards.set(stds);
      this.loadingStandards.set(false);
      if (pos) this.positions.set(pos);
      this.allSystems.set(sys);
      this.allUnits.set(opts.units);
      this.loadingSystems.set(false);
    });
  }

  loadPile(): void {
    this.loadPileError.set(null);
    this.loadingPile.set(true);
    this.api.getPointsPile({
      standardIds: [...this.pickedStandardIds()],
      locationIds: this.pickedLocationIds(),
      eqTypeIds: this.pickedEqTypeIds(),
      isoPosId: this.pickedIsoPosId(),
      normPosId: this.pickedNormPosId(),
      systems: this.pickedSystems(),
      unit: this.pickedUnit(),
      tagNumber: this.pickedTag(),
      description: this.pickedDescription(),
      specificLocation: this.pickedSpecificLocation(),
    }).subscribe({
      next: (pts) => {
        this.loadingPile.set(false);
        if (!pts.length) { this.loadPileError.set('No LOTO points match the selection.'); return; }
        this.points.set(pts);
        // Fresh session — start with empty checklist + no pending corrections.
        this.pointResults.set({});
        this.corrections.set({});
        this.pointDrawings.set({});
        this.loadDrawingsForPile();
      },
      error: (err) => {
        this.loadingPile.set(false);
        this.loadPileError.set(err?.error?.message ?? err?.message ?? 'Failed to load points.');
      },
    });
  }

  resetPile(): void {
    this.points.set([]);
    this.pointResults.set({});
    this.corrections.set({});
    this.pointDrawings.set({});
    this.submitted.set(false);
    this.activePointId.set(null);
  }

  /**
   * Fetch drawing descriptors for every point in the pile in one round-trip and index them by point id.
   * Fire-and-forget: a failure just leaves {@code pointDrawings} empty, which the UI already handles
   * ("No drawing on file"). The viewer's image bytes still route through {@link LotoDrawingService}, so
   * the shared IndexedDB blob cache is populated on first open.
   */
  private loadDrawingsForPile(): void {
    const ids = this.points().map(p => p.id).filter(id => id != null);
    if (!ids.length) return;
    this.pointApi.getDrawingsForPoints(ids).subscribe({
      next: (list) => {
        const byPoint: Record<number, PointDrawing[]> = {};
        for (const d of list ?? []) {
          if (d.pointId == null) continue;
          (byPoint[d.pointId] ??= []).push(d);
        }
        this.pointDrawings.set(byPoint);
      },
      error: () => { /* keep the "no drawing" UI — nothing else depends on this */ },
    });
  }

  finish(): void { this.submitted.set(true); }

  back(): void { history.back(); }
}
