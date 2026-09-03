import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoWorkOrder, MaximoWorklog } from '../../../models/maximo/maximo.models';
import { LotoLink } from '../maximo-wo-loto-link.service';

/**
 * Outage Items — the work orders Maximo flags as outage work (Outage Type = PLAN "Planned Outage" or
 * SNOW "Short Notice Outage Work"). Two ways to work the list:
 *   • Flat (default): filter (type / location / LOTO-assigned / has-logs / log-time) and multi-select WOs to
 *     bulk-assign one LOTO to all of them (links each + posts a "Covered by LOTO: …" worklog to each).
 *   • Grouped by LOTO: every WO under the non-closed LOTO covering it, plus a "Not covered by any LOTO" bucket —
 *     the at-a-glance "what's still exposed" view.
 *
 * "Covered" = the WO is on a non-closed LOTO's structured link OR a LOTO number appears in its LOTO worklog
 * (computed server-side; see MaximoOutageCoverageService). Each WO can still carry LOTO isolation notes.
 */
@Component({
  selector: 'app-maximo-outage-items-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent],
  template: `
    <app-main-layout header="Maximo — Outage Items">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="oi-page">
          <div class="oi-head">
            <p class="oi-sub">Planned (PLAN) &amp; short-notice (SNOW) outage work orders and their LOTO coverage.</p>
            <div class="oi-head-right">
              <div class="oi-toggle">
                <button [class.on]="view() === 'flat'" (click)="view.set('flat')">List</button>
                <button [class.on]="view() === 'grouped'" (click)="view.set('grouped')">Group by LOTO</button>
              </div>
              <button class="oi-refresh" [disabled]="loading()" (click)="load()">{{ loading() ? 'Loading…' : '↻ Refresh' }}</button>
            </div>
          </div>

          @if (error()) { <p class="oi-err">{{ error() }}</p> }

          @if (loading() && !wos().length) { <p class="oi-msg">Loading outage work orders…</p> }
          @else if (!wos().length && !error()) { <p class="oi-msg">No outage work orders found.</p> }
          @else if (wos().length) {
            <!-- Shared filters (both views) -->
            <div class="oi-filters">
              <select [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)">
                <option value="">All types</option>
                <option value="PLAN">PLAN — Planned</option>
                <option value="SNOW">SNOW — Short Notice</option>
              </select>
              <select [value]="unitFilter()" (change)="unitFilter.set($any($event.target).value)" title="Unit (from location code)">
                <option value="">All units</option>
                @for (u of unitOptions(); track u.key) { <option [value]="u.key">{{ u.label }}</option> }
              </select>
              <select [value]="locationFilter()" (change)="locationFilter.set($any($event.target).value)">
                <option value="">All locations</option>
                @for (l of locationOptions(); track l) { <option [value]="l">{{ l }}</option> }
              </select>
              <input class="oi-search" type="search" placeholder="Search tag, WO #, description…"
                     [value]="search()" (input)="search.set($any($event.target).value)">
            </div>

            @if (view() === 'flat') {
              <!-- Flat-only filters -->
              <div class="oi-filters">
                <select [value]="coveredFilter()" (change)="coveredFilter.set($any($event.target).value)" title="LOTO assigned">
                  <option value="">LOTO assigned: any</option>
                  <option value="yes">🔒 Has non-closed LOTO</option>
                  <option value="no">⚠ No LOTO</option>
                </select>
                <select [value]="logsFilter()" (change)="logsFilter.set($any($event.target).value)" title="LOTO log entries">
                  <option value="">LOTO logs: any</option>
                  <option value="yes">Has LOTO logs</option>
                  <option value="no">No LOTO logs</option>
                </select>
                <label class="oi-datef">Log after
                  <input type="date" [value]="logAfter()" (change)="logAfter.set($any($event.target).value)">
                </label>
                <label class="oi-datef">Log before
                  <input type="date" [value]="logBefore()" (change)="logBefore.set($any($event.target).value)">
                </label>
                <select [value]="sortBy()" (change)="sortBy.set($any($event.target).value)" title="Sort by">
                  <option value="reported">Sort: Newest reported</option>
                  <option value="target">Sort: Target start</option>
                  <option value="wonum">Sort: WO #</option>
                  <option value="type">Sort: Type (PLAN/SNOW)</option>
                  <option value="status">Sort: Status</option>
                  <option value="location">Sort: Location</option>
                  <option value="uncovered">Sort: Uncovered first</option>
                </select>
              </div>

              <div class="oi-count">
                <label class="oi-selall">
                  <input type="checkbox" [checked]="allVisibleSelected()" (change)="toggleSelectAll()"> Select all
                </label>
                Showing {{ flatSorted().length }} of {{ wos().length }}
              </div>
              @if (!flatSorted().length) { <p class="oi-msg">No outage work orders match your filters.</p> }

              <div class="oi-list">
                @for (wo of flatSorted(); track wo.href) {
                  <div class="oi-card">
                    <div class="oi-rowwrap" [class.sel]="selected().has(wo.href)">
                      <input type="checkbox" class="oi-check" [checked]="selected().has(wo.href)" (change)="toggleSelect(wo)">
                      <button class="oi-row" (click)="toggle(wo)">
                        <span class="oi-badge" [class.snow]="wo.outageType === 'SNOW'">{{ wo.outageType || '—' }}</span>
                        <span class="oi-wonum">{{ wo.wonum }}</span>
                        <span class="oi-desc">{{ wo.description || '(no description)' }}</span>
                        <span class="oi-status">{{ wo.status }}</span>
                        <span class="oi-loc" [title]="wo.assetnum ? ('Asset ' + wo.assetnum + (wo.location ? ' · ' + wo.location : '')) : wo.location">{{ wo.assetnum || wo.location }}</span>
                        <span class="oi-cover-cell">
                          @if (wo.covered) { <span class="oi-cov" title="Covered by a non-closed LOTO">🔒 LOTO</span> }
                          @else { <span class="oi-nocov" title="No non-closed LOTO covers this WO">⚠ none</span> }
                          @if (wo.lotoNoteCount) { <span class="oi-loto" title="LOTO log entries">📝 {{ wo.lotoNoteCount }}</span> }
                        </span>
                        <span class="oi-caret">{{ expanded() === wo.href ? '▾' : '▸' }}</span>
                      </button>
                    </div>

                    @if (expanded() === wo.href) {
                      <div class="oi-body">
                        <div class="oi-fulldesc">
                          <div class="oi-fulldesc-title">{{ wo.description || '(no description)' }}</div>
                          @if (wo.longDescription) { <div class="oi-fulldesc-body">{{ wo.longDescription }}</div> }
                          <div class="oi-fulldesc-meta">
                            {{ wo.wonum }}@if (wo.assetnum) { · Asset {{ wo.assetnum }} }@if (wo.location) { · {{ wo.location }} }@if (unitKey(wo.location) === '1' || unitKey(wo.location) === '2') { · Unit {{ unitKey(wo.location) }} }
                          </div>
                        </div>
                        <button class="oi-detail-btn" (click)="detailWo.set(wo)">🗂 Full WO details — attachments · notes · dates · tasks · history</button>
                        <div class="oi-meta">
                          @if (wo.targetStart) { <span>🗓 {{ wo.targetStart | date:'medium' }}</span> }
                          @if (wo.leadCraft) { <span>👷 {{ wo.leadCraft }}</span> }
                          @if (wo.worktype) { <span>🏷 {{ wo.worktype }}</span> }
                        </div>

                        @if (coveringLotos(wo).length) {
                          <div class="oi-cov-list">
                            <span class="oi-cov-lbl">Covered by:</span>
                            @for (l of coveringLotos(wo); track l.id) {
                              <span class="oi-cov-chip">🔒 {{ l.permitNumber || ('LOTO ' + l.id) }}@if (l.redTagNum) { · RT {{ l.redTagNum }} }@if (l.boxNumber != null) { · Box {{ l.boxNumber }} }</span>
                            }
                          </div>
                        }

                        <h4 class="oi-h">🔒 LOTO isolation notes</h4>
                        @if (notesLoading()[wo.href]) { <p class="oi-msg">Loading notes…</p> }
                        @else if (!(notes()[wo.href]?.length)) { <p class="oi-none">No isolation notes yet.</p> }
                        @else {
                          <ul class="oi-notes">
                            @for (n of notes()[wo.href]; track n.href) {
                              <li class="oi-note">
                                <div class="oi-note-txt">{{ n.longDescription || n.description }}</div>
                                <div class="oi-note-meta">{{ n.createby }} · {{ n.createdate | date:'short' }}</div>
                              </li>
                            }
                          </ul>
                        }

                        <div class="oi-add">
                          <textarea rows="2" placeholder="What needs to be isolated (LOTO)…"
                                    [ngModel]="draft()[wo.href] || ''" (ngModelChange)="setDraft(wo.href, $event)"></textarea>
                          <button class="oi-save" [disabled]="saving() === wo.href || !(draft()[wo.href] || '').trim()"
                                  (click)="addNote(wo)">
                            {{ saving() === wo.href ? 'Saving…' : '+ Add isolation note' }}
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <!-- Grouped by non-closed LOTO -->
              <div class="oi-count">{{ grouped().groups.length }} LOTO group(s) · {{ grouped().uncovered.length }} not covered</div>
              <div class="oi-list">
                @for (g of grouped().groups; track g.loto.id) {
                  <div class="oi-group">
                    <button class="oi-ghead" (click)="toggleGroup(g.loto.id)">
                      <span class="oi-gcaret">{{ isGroupOpen(g.loto.id) ? '▾' : '▸' }}</span>
                      <span class="oi-gname">🔒 {{ g.loto.permitNumber || ('LOTO ' + g.loto.id) }}</span>
                      <span class="oi-gmeta">
                        @if (g.loto.equipmentSystem) { {{ g.loto.equipmentSystem }} · }@if (g.loto.redTagNum) { RT {{ g.loto.redTagNum }} · }@if (g.loto.boxNumber != null) { Box {{ g.loto.boxNumber }} · }{{ g.loto.status }}
                      </span>
                      <span class="oi-gcount">{{ g.wos.length }}</span>
                    </button>
                    @if (isGroupOpen(g.loto.id)) {
                      <div class="oi-gbody">
                        @for (wo of g.wos; track wo.href) {
                          <button class="oi-grow" (click)="detailWo.set(wo)">
                            <span class="oi-badge" [class.snow]="wo.outageType === 'SNOW'">{{ wo.outageType || '—' }}</span>
                            <span class="oi-wonum">{{ wo.wonum }}</span>
                            <span class="oi-desc">{{ wo.description || '(no description)' }}</span>
                            <span class="oi-loc">{{ wo.assetnum || wo.location }}</span>
                            <span class="oi-status">{{ wo.status }}</span>
                            @if (wo.lotoNoteCount) { <span class="oi-loto">📝 {{ wo.lotoNoteCount }}</span> }
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
                <div class="oi-group oi-group-warn">
                  <button class="oi-ghead" (click)="toggleGroup('uncovered')">
                    <span class="oi-gcaret">{{ isGroupOpen('uncovered') ? '▾' : '▸' }}</span>
                    <span class="oi-gname">⚠ Not covered by any LOTO</span>
                    <span class="oi-gmeta">these outage WOs have no non-closed LOTO</span>
                    <span class="oi-gcount">{{ grouped().uncovered.length }}</span>
                  </button>
                  @if (isGroupOpen('uncovered')) {
                    <div class="oi-gbody">
                      @if (!grouped().uncovered.length) { <p class="oi-none oi-gpad">Everything shown is covered. 🎉</p> }
                      @for (wo of grouped().uncovered; track wo.href) {
                        <button class="oi-grow" (click)="detailWo.set(wo)">
                          <span class="oi-badge" [class.snow]="wo.outageType === 'SNOW'">{{ wo.outageType || '—' }}</span>
                          <span class="oi-wonum">{{ wo.wonum }}</span>
                          <span class="oi-desc">{{ wo.description || '(no description)' }}</span>
                          <span class="oi-loc">{{ wo.assetnum || wo.location }}</span>
                          <span class="oi-status">{{ wo.status }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }

          <!-- Bulk-assign bar (flat view, when rows are selected) -->
          @if (view() === 'flat' && selectedCount() > 0) {
            <div class="oi-bar">
              <span class="oi-bar-n">{{ selectedCount() }} selected</span>
              <select class="oi-bar-loto" [value]="assignLotoId() ?? ''" (change)="assignLotoId.set($any($event.target).value ? +$any($event.target).value : null)">
                <option value="">Choose a LOTO…</option>
                @for (l of lotosSorted(); track l.id) {
                  <option [value]="l.id">{{ l.permitNumber || ('LOTO ' + l.id) }}{{ l.equipmentSystem ? ' — ' + l.equipmentSystem : '' }}{{ l.redTagNum ? ' · RT ' + l.redTagNum : '' }} ({{ l.status }})</option>
                }
              </select>
              <button class="oi-bar-assign" [disabled]="!assignLotoId() || assigning()" (click)="assign()">
                {{ assigning() ? 'Assigning…' : 'Assign LOTO' }}
              </button>
              <button class="oi-bar-clear" (click)="clearSelection()">Clear</button>
              @if (assignMsg()) { <span class="oi-bar-msg">{{ assignMsg() }}</span> }
            </div>
          }

          @if (detailWo(); as d) {
            <app-maximo-detail-dialog [parent]="'wo'" [wo]="d" (completed)="load()" (closed)="detailWo.set(null)"></app-maximo-detail-dialog>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .oi-page { padding: 0.5rem 0.75rem 4rem; max-width: 1100px; margin: 0 auto; }
    .oi-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0.5rem 0 1rem; }
    .oi-head-right { display: flex; align-items: center; gap: 0.6rem; }
    .oi-sub { color: var(--secondary-text, #888); font-size: 0.9rem; margin: 0; }
    .oi-toggle { display: inline-flex; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .oi-toggle button { background: transparent; border: none; color: var(--primary-text); padding: 0.4rem 0.75rem; font-weight: 700; font-size: 0.82rem; cursor: pointer; font-family: inherit; }
    .oi-toggle button.on { background: var(--accent-color, #26C6DA); color: #fff; }
    .oi-refresh { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.45rem 0.7rem; font-weight: 700; cursor: pointer; }
    .oi-err { background: rgba(239,83,80,0.12); border: 1px solid #ef5350; border-radius: 8px; padding: 0.6rem 0.7rem; color: var(--primary-text); }
    .oi-msg, .oi-none { color: var(--secondary-text, #888); font-size: 0.9rem; }
    .oi-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem; align-items: center; }
    .oi-filters select, .oi-search, .oi-datef input { border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.55rem; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .oi-search { flex: 1 1 220px; min-width: 180px; }
    .oi-datef { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; color: var(--secondary-text, #888); }
    .oi-count { color: var(--secondary-text, #888); font-size: 0.78rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.9rem; }
    .oi-selall { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; }
    .oi-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .oi-card { border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; background: var(--secondary-background); }
    .oi-rowwrap { display: flex; align-items: center; gap: 0.5rem; padding-left: 0.6rem; }
    .oi-rowwrap.sel { background: rgba(38,198,218,0.10); }
    .oi-check { width: 1.05rem; height: 1.05rem; flex: none; cursor: pointer; }
    .oi-row { flex: 1 1 auto; min-width: 0; display: grid; grid-template-columns: 64px 100px 1fr 76px 120px 108px 20px; gap: 0.6rem; align-items: center; text-align: left;
              background: transparent; border: none; color: var(--primary-text); padding: 0.6rem 0.8rem 0.6rem 0.2rem; cursor: pointer; font-family: inherit; font-size: 0.9rem; }
    .oi-cover-cell { text-align: right; display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center; }
    .oi-cov { font-size: 0.7rem; font-weight: 700; color: #fff; background: #2e9e5b; padding: 0.15rem 0.35rem; border-radius: 6px; white-space: nowrap; }
    .oi-nocov { font-size: 0.7rem; font-weight: 700; color: #fff; background: #e08a2e; padding: 0.15rem 0.35rem; border-radius: 6px; white-space: nowrap; }
    .oi-loto { font-size: 0.7rem; font-weight: 700; color: #fff; background: #7E57C2; padding: 0.15rem 0.35rem; border-radius: 6px; white-space: nowrap; }
    .oi-badge { font-weight: 800; font-size: 0.72rem; text-align: center; padding: 0.2rem 0; border-radius: 6px; background: #42A5F5; color: #fff; }
    .oi-badge.snow { background: #EC407A; }
    .oi-wonum { font-weight: 700; }
    .oi-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .oi-status { font-size: 0.78rem; color: var(--secondary-text, #888); }
    .oi-loc { font-size: 0.78rem; color: var(--secondary-text, #888); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .oi-caret { text-align: center; color: var(--secondary-text, #888); }
    .oi-body { padding: 0.4rem 0.9rem 0.9rem; border-top: 1px solid var(--border-color); }
    .oi-fulldesc { margin: 0.5rem 0 0.3rem; padding: 0.55rem 0.7rem; background: var(--card-bg, rgba(127,127,127,0.06)); border: 1px solid var(--border-color); border-radius: 8px; }
    .oi-fulldesc-title { font-weight: 700; font-size: 0.92rem; color: var(--primary-text); }
    .oi-fulldesc-body { margin-top: 0.35rem; white-space: pre-wrap; font-size: 0.85rem; color: var(--primary-text); line-height: 1.4; }
    .oi-fulldesc-meta { margin-top: 0.4rem; font-size: 0.75rem; color: var(--secondary-text, #888); }
    .oi-detail-btn { margin: 0.6rem 0 0.2rem; background: transparent; border: 1px solid var(--accent-color, #26C6DA); color: var(--accent-color, #26C6DA); border-radius: 8px; padding: 0.45rem 0.8rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
    .oi-meta { display: flex; flex-wrap: wrap; gap: 0.8rem; color: var(--secondary-text, #888); font-size: 0.8rem; margin: 0.5rem 0; }
    .oi-cov-list { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin: 0.3rem 0; }
    .oi-cov-lbl { font-size: 0.78rem; color: var(--secondary-text, #888); font-weight: 700; }
    .oi-cov-chip { font-size: 0.74rem; font-weight: 700; color: #fff; background: #2e9e5b; padding: 0.15rem 0.45rem; border-radius: 8px; }
    .oi-h { margin: 0.6rem 0 0.4rem; font-size: 0.9rem; }
    .oi-notes { list-style: none; padding: 0; margin: 0 0 0.6rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .oi-note { border-left: 3px solid #EC407A; background: var(--card-bg, rgba(236,64,122,0.06)); border-radius: 0 6px 6px 0; padding: 0.4rem 0.6rem; }
    .oi-note-txt { white-space: pre-wrap; font-size: 0.88rem; }
    .oi-note-meta { font-size: 0.72rem; color: var(--secondary-text, #888); margin-top: 0.2rem; }
    .oi-add { display: flex; flex-direction: column; gap: 0.4rem; }
    .oi-add textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); resize: vertical; }
    .oi-save { align-self: flex-start; background: #EC407A; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 0.8rem; font-weight: 700; cursor: pointer; }
    .oi-save:disabled { opacity: 0.5; cursor: default; }
    /* Grouped view */
    .oi-group { border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; background: var(--secondary-background); }
    .oi-group-warn { border-color: #e08a2e; }
    .oi-ghead { width: 100%; display: grid; grid-template-columns: 20px 1fr auto 44px; gap: 0.6rem; align-items: center; text-align: left; background: transparent; border: none; color: var(--primary-text); padding: 0.6rem 0.8rem; cursor: pointer; font-family: inherit; }
    .oi-gcaret { color: var(--secondary-text, #888); }
    .oi-gname { font-weight: 800; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .oi-gmeta { font-size: 0.76rem; color: var(--secondary-text, #888); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .oi-gcount { font-weight: 800; font-size: 0.82rem; color: #fff; background: #7E57C2; border-radius: 999px; padding: 0.1rem 0.5rem; text-align: center; }
    .oi-group-warn .oi-gcount { background: #e08a2e; }
    .oi-gbody { border-top: 1px solid var(--border-color); display: flex; flex-direction: column; }
    .oi-gpad { padding: 0.5rem 0.9rem; }
    .oi-grow { display: grid; grid-template-columns: 64px 100px 1fr 120px 76px auto; gap: 0.6rem; align-items: center; text-align: left; background: transparent; border: none; border-top: 1px solid var(--border-color); color: var(--primary-text); padding: 0.5rem 0.9rem; cursor: pointer; font-family: inherit; font-size: 0.88rem; }
    .oi-grow:first-child { border-top: none; }
    /* Bulk-assign bar */
    .oi-bar { position: sticky; bottom: 0; margin-top: 0.8rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; background: var(--card-bg, var(--secondary-background)); border: 1px solid var(--accent-color, #26C6DA); border-radius: 10px; padding: 0.6rem 0.8rem; box-shadow: 0 4px 14px rgba(0,0,0,0.18); }
    .oi-bar-n { font-weight: 800; }
    .oi-bar-loto { flex: 1 1 280px; min-width: 200px; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.55rem; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .oi-bar-assign { background: #2e9e5b; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.9rem; font-weight: 800; cursor: pointer; }
    .oi-bar-assign:disabled { opacity: 0.5; cursor: default; }
    .oi-bar-clear { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.5rem 0.8rem; font-weight: 700; cursor: pointer; }
    .oi-bar-msg { font-size: 0.82rem; color: var(--secondary-text, #888); }
  `]
})
export class MaximoOutageItemsPageComponent implements OnInit {
  private api = inject(MaximoApiService);

  wos = signal<MaximoWorkOrder[]>([]);
  lotos = signal<LotoLink[]>([]);          // non-closed LOTO catalog (grouping headers + assign picker)
  loading = signal(false);
  error = signal<string | null>(null);
  expanded = signal<string | null>(null);
  view = signal<'flat' | 'grouped'>('flat');

  // Client-side filters over the loaded set (all open outage WOs are loaded, so filtering is instant).
  search = signal('');
  typeFilter = signal('');
  locationFilter = signal('');
  unitFilter = signal('');      // '' = all; '1'/'2'/'0'/'x' — derived from the location code prefix
  coveredFilter = signal('');   // '' | 'yes' (has non-closed LOTO) | 'no'
  logsFilter = signal('');      // '' | 'yes' (has LOTO logs) | 'no'
  logAfter = signal('');        // yyyy-MM-dd — a LOTO log entry on/after this date
  logBefore = signal('');       // yyyy-MM-dd — a LOTO log entry on/before this date
  sortBy = signal('reported');

  // Bulk-assign
  selected = signal<Set<string>>(new Set());   // WO hrefs
  assignLotoId = signal<number | null>(null);
  assigning = signal(false);
  assignMsg = signal<string | null>(null);

  // Grouped view
  expandedGroups = signal<Set<string>>(new Set(['uncovered']));

  locationOptions = computed(() => [...new Set(this.wos().map(w => w.location).filter(Boolean))].sort());
  lotosSorted = computed(() => [...this.lotos()].sort((a, b) => (a.permitNumber || '').localeCompare(b.permitNumber || '')));

  /** Unit derived from the Maximo location code prefix (01-…=Unit 1, 02-…=Unit 2, 00-…=Common; else Other). */
  unitKey(loc?: string): string {
    const seg = (loc || '').trim().split('-')[0].toUpperCase();
    if (seg === '01' || seg === 'U1' || seg === '1') return '1';
    if (seg === '02' || seg === 'U2' || seg === '2') return '2';
    if (seg === '00' || seg === '0') return '0';
    return loc ? 'x' : '';   // 'x' = a location that doesn't encode a unit; '' = no location at all
  }
  private unitLabel(key: string): string {
    return key === '1' ? 'Unit 1' : key === '2' ? 'Unit 2' : key === '0' ? 'Common (BOP)' : key === 'x' ? 'Other / unclassified' : '';
  }
  /** Distinct units actually present among the loaded outage WOs, in a stable order. */
  unitOptions = computed(() => {
    const order = ['1', '2', '0', 'x'];
    const present = new Set(this.wos().map(w => this.unitKey(w.location)).filter(Boolean));
    return order.filter(k => present.has(k)).map(key => ({ key, label: this.unitLabel(key) }));
  });

  /** Shared filters (type / location / search) — applied in BOTH views. */
  baseFiltered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const t = this.typeFilter();
    const loc = this.locationFilter();
    const unit = this.unitFilter();
    return this.wos().filter(w =>
      (!t || w.outageType === t) &&
      (!loc || w.location === loc) &&
      (!unit || this.unitKey(w.location) === unit) &&
      (!q || [w.wonum, w.description, w.assetnum].some(f => (f || '').toLowerCase().includes(q))));
  });

  /** Flat view = baseFiltered + coverage/log filters. */
  flatFiltered = computed(() => {
    const cf = this.coveredFilter();
    const lf = this.logsFilter();
    const after = this.logAfter();
    const before = this.logBefore();
    return this.baseFiltered().filter(w =>
      (!cf || (cf === 'yes' ? !!w.covered : !w.covered)) &&
      (!lf || (lf === 'yes' ? !!w.lotoNoteCount : !w.lotoNoteCount)) &&
      (!after || ((w.lotoNoteLatest || '').slice(0, 10) >= after)) &&
      (!before || (!!w.lotoNoteEarliest && w.lotoNoteEarliest.slice(0, 10) <= before)));
  });

  flatSorted = computed(() => {
    const list = [...this.flatFiltered()];
    const s = (v?: string) => v || '';
    switch (this.sortBy()) {
      case 'target':    list.sort((a, b) => s(a.targetStart).localeCompare(s(b.targetStart))); break;
      case 'wonum':     list.sort((a, b) => s(a.wonum).localeCompare(s(b.wonum))); break;
      case 'type':      list.sort((a, b) => s(a.outageType).localeCompare(s(b.outageType))); break;
      case 'status':    list.sort((a, b) => s(a.status).localeCompare(s(b.status))); break;
      case 'location':  list.sort((a, b) => s(a.location).localeCompare(s(b.location))); break;
      case 'uncovered': list.sort((a, b) => (a.covered ? 1 : 0) - (b.covered ? 1 : 0)); break;
      default:          list.sort((a, b) => s(b.reportdate).localeCompare(s(a.reportdate)));
    }
    return list;
  });

  /** Grouped view: WOs bucketed under each covering non-closed LOTO, plus the uncovered bucket. */
  grouped = computed(() => {
    const items = this.baseFiltered();
    const byLoto = new Map<number, MaximoWorkOrder[]>();
    const uncovered: MaximoWorkOrder[] = [];
    for (const w of items) {
      const ids = w.coveringLotoIds ?? [];
      if (!ids.length) { uncovered.push(w); continue; }
      for (const id of ids) {
        const arr = byLoto.get(id) ?? [];
        arr.push(w);
        byLoto.set(id, arr);
      }
    }
    const groups = this.lotosSorted()
      .filter(l => byLoto.has(l.id))
      .map(l => ({ loto: l, wos: byLoto.get(l.id)! }));
    return { groups, uncovered };
  });

  notes = signal<Record<string, MaximoWorklog[]>>({});
  notesLoading = signal<Record<string, boolean>>({});
  draft = signal<Record<string, string>>({});
  saving = signal<string | null>(null);
  detailWo = signal<MaximoWorkOrder | null>(null);   // the WO whose full tabbed detail dialog is open

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.getOutageCoverage(300).subscribe({
      next: res => { this.wos.set(res.items ?? []); this.lotos.set(res.lotos ?? []); this.loading.set(false); },
      error: () => { this.error.set('Couldn’t load outage work orders — Maximo may be unreachable. Tap Refresh to retry.'); this.loading.set(false); }
    });
  }

  // ── Coverage helpers ──────────────────────────────────────────────────────────
  coveringLotos(wo: MaximoWorkOrder): LotoLink[] {
    const ids = new Set(wo.coveringLotoIds ?? []);
    return this.lotos().filter(l => ids.has(l.id));
  }

  // ── Multi-select + bulk-assign ─────────────────────────────────────────────────
  selectedCount = computed(() => this.selected().size);
  allVisibleSelected = computed(() => {
    const f = this.flatSorted();
    return f.length > 0 && f.every(w => this.selected().has(w.href));
  });
  toggleSelect(wo: MaximoWorkOrder): void {
    const s = new Set(this.selected());
    if (s.has(wo.href)) s.delete(wo.href); else s.add(wo.href);
    this.selected.set(s);
    this.assignMsg.set(null);
  }
  toggleSelectAll(): void {
    const f = this.flatSorted();
    const s = new Set(this.selected());
    if (f.every(w => s.has(w.href))) f.forEach(w => s.delete(w.href));
    else f.forEach(w => s.add(w.href));
    this.selected.set(s);
  }
  clearSelection(): void { this.selected.set(new Set()); this.assignLotoId.set(null); this.assignMsg.set(null); }

  assign(): void {
    const id = this.assignLotoId();
    if (!id || this.assigning()) return;
    const targets = this.wos()
      .filter(w => this.selected().has(w.href))
      .map(w => ({ wonum: w.wonum, href: w.href }));
    if (!targets.length) return;
    this.assigning.set(true); this.assignMsg.set(null);
    this.api.assignLoto(id, targets).subscribe({
      next: res => {
        this.assigning.set(false);
        const parts = [`${res?.newlyLinked ?? 0} linked`];
        if (res?.alreadyLinked) parts.push(`${res.alreadyLinked} already linked`);
        if (res?.commentsWritten) parts.push(`${res.commentsWritten} comment(s) added`);
        if (res?.commentFailures?.length) parts.push(`${res.commentFailures.length} comment(s) failed`);
        this.assignMsg.set(parts.join(' · '));
        this.selected.set(new Set());
        this.assignLotoId.set(null);
        this.load();   // refresh coverage flags + linkedWonums
      },
      error: e => { this.assigning.set(false); this.assignMsg.set(e?.error?.message || 'Assign failed — Maximo may be unreachable.'); }
    });
  }

  // ── Grouped view ────────────────────────────────────────────────────────────────
  isGroupOpen(key: number | string): boolean { return this.expandedGroups().has(String(key)); }
  toggleGroup(key: number | string): void {
    const s = new Set(this.expandedGroups());
    const k = String(key);
    if (s.has(k)) s.delete(k); else s.add(k);
    this.expandedGroups.set(s);
  }

  // ── Card expand + isolation notes ────────────────────────────────────────────────
  toggle(wo: MaximoWorkOrder): void {
    if (this.expanded() === wo.href) { this.expanded.set(null); return; }
    this.expanded.set(wo.href);
    if (this.notes()[wo.href] === undefined) this.loadNotes(wo.href);
  }

  private loadNotes(href: string): void {
    this.notesLoading.set({ ...this.notesLoading(), [href]: true });
    this.api.getLotoNotes(href).subscribe({
      next: n => { this.notes.set({ ...this.notes(), [href]: n }); this.syncCount(href, n.length); this.notesLoading.set({ ...this.notesLoading(), [href]: false }); },
      error: () => { this.notes.set({ ...this.notes(), [href]: [] }); this.notesLoading.set({ ...this.notesLoading(), [href]: false }); }
    });
  }

  setDraft(href: string, v: string): void { this.draft.set({ ...this.draft(), [href]: v }); }

  /** Keep the card's LOTO log count in sync with the loaded notes. */
  private syncCount(href: string, count: number): void {
    this.wos.set(this.wos().map(w => w.href === href ? { ...w, lotoNoteCount: count } : w));
  }

  addNote(wo: MaximoWorkOrder): void {
    const text = (this.draft()[wo.href] || '').trim();
    if (!text || this.saving() === wo.href) return;
    this.saving.set(wo.href); this.error.set(null);
    this.api.addLotoNote(wo.href, text).subscribe({
      next: n => {
        this.notes.set({ ...this.notes(), [wo.href]: n });
        this.syncCount(wo.href, n.length);
        this.setDraft(wo.href, '');
        this.saving.set(null);
      },
      error: () => { this.error.set('Could not save the isolation note.'); this.saving.set(null); }
    });
  }
}
