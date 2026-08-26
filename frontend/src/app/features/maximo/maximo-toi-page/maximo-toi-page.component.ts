import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoLocationTreePickerComponent } from '../maximo-location-tree-picker/maximo-location-tree-picker.component';
import { MaximoWorkOrder, MaximoWorklog } from '../../../models/maximo/maximo.models';
import {
  TOI_SECTIONS, TOI_CONSEQUENCE, TOI_PROBABILITY, ToiSectionKey, RiskOption,
  toiRiskLevel, toiIsClosed, toiTitle, ToiCreateRequest,
} from '../../../models/maximo/toi.model';

type Mode = 'list' | 'create';
type Tab = 'active' | 'closed';
interface Sel { c: RiskOption | null; p: RiskOption | null; }

/** TOI/TMOD records (Temporary Operation Instruction / Temporary Modification) — Active/Closed tabs backed by
 *  Maximo WOs. Create (risk assessment + instruction form → first log note), add log notes, close (who + comments). */
@Component({
  selector: 'app-maximo-toi-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent,
    MaximoLocationTreePickerComponent],
  template: `
    <app-main-layout header="Maximo — TOI / TMOD">
      <ng-container header><app-router-menu [layout]="'row'"></app-router-menu></ng-container>
      <ng-container main-content>
        <div class="ti-page">
          <div class="ti-top">
            <p class="ti-sub">Temporary Operation Instructions / Temporary Modifications.</p>
            @if (mode() === 'list') { <button class="ti-new" (click)="startCreate()">+ New TOI/TMOD</button> }
            @else { <button class="ti-link" (click)="mode.set('list')">← Back to list</button> }
          </div>

          @if (mode() === 'list') {
            <div class="ti-tabs">
              <button class="ti-tab" [class.active]="tab() === 'active'" (click)="tab.set('active')">Active ({{ activeList().length }})</button>
              <button class="ti-tab" [class.active]="tab() === 'closed'" (click)="tab.set('closed')">Closed ({{ closedList().length }})</button>
              <button class="ti-refresh" [disabled]="loading()" (click)="load()">{{ loading() ? 'Loading…' : '↻ Refresh' }}</button>
            </div>

            @if (error()) { <p class="ti-err">{{ error() }}</p> }
            @if (loading() && !tois().length) { <p class="ti-msg">Loading…</p> }
            @else if (!visible().length) { <p class="ti-msg">No {{ tab() }} TOI/TMOD records.</p> }
            @else {
              @for (wo of visible(); track wo.href) {
                <div class="ti-card">
                  <button class="ti-row" (click)="toggle(wo)">
                    <span class="ti-title">{{ title(wo) }}</span>
                    <span class="ti-wonum">{{ wo.wonum }}</span>
                    <span class="ti-status">{{ wo.status }}</span>
                    <span class="ti-loc">{{ wo.location }}</span>
                    <span class="ti-caret">{{ expanded() === wo.href ? '▾' : '▸' }}</span>
                  </button>
                  @if (expanded() === wo.href) {
                    <div class="ti-body">
                      <div class="ti-btnrow">
                        <button class="ti-detail-btn" (click)="detailWo.set(wo)">🗂 Full WO details — attachments · notes · dates · tasks</button>
                        @if (!isClosed(wo)) { <button class="ti-edit-btn" (click)="startEdit(wo)">✎ Edit</button> }
                      </div>
                      <h4 class="ti-h">📝 Log</h4>
                      @if (notesLoading()[wo.href]) { <p class="ti-msg">Loading log…</p> }
                      @else if (!(notes()[wo.href]?.length)) { <p class="ti-none">No log entries.</p> }
                      @else {
                        @for (n of notes()[wo.href]; track n.href) {
                          <div class="ti-note" [class.rec]="isRecord(n)" [class.cls]="isClose(n)">
                            <div class="ti-note-hd">{{ n.description }}</div>
                            @if (n.longDescription) { <div class="ti-note-txt">{{ n.longDescription }}</div> }
                            <div class="ti-note-meta">{{ n.createby }} · {{ n.createdate | date:'short' }}</div>
                          </div>
                        }
                      }
                      @if (!isClosed(wo)) {
                        <textarea class="ti-ta" rows="2" placeholder="Add a log note…"
                                  [ngModel]="noteDraft()[wo.href] || ''" (ngModelChange)="setNoteDraft(wo.href, $event)"></textarea>
                        <div class="ti-actions">
                          <button class="ti-add" [disabled]="savingNote() === wo.href || !(noteDraft()[wo.href] || '').trim()" (click)="addNote(wo)">
                            {{ savingNote() === wo.href ? 'Adding…' : '+ Add note' }}
                          </button>
                          <button class="ti-close-btn" (click)="startClose(wo)">Close TOI/TMOD</button>
                        </div>
                      } @else { <p class="ti-closed-note">✓ Closed</p> }
                    </div>
                  }
                </div>
              }
            }
          }

          @if (mode() === 'create') {
            <div class="ti-form">
              <h3 class="ti-formh">New TOI / TMOD</h3>
              @if (createError()) { <p class="ti-err">{{ createError() }}</p> }
              <label class="ti-f">Title <span class="req">*</span>
                <input type="text" [ngModel]="cTitle()" (ngModelChange)="cTitle.set($event)" placeholder="e.g. U1 & U2 Start up / Shutdown / trip / spin cool">
              </label>
              <div class="ti-fh">Location / asset <span class="ti-fh-note">— pick an equipment tag to set both, or a location for location only</span></div>
              <app-maximo-location-tree-picker mode="both" [assetnum]="cAsset()" [location]="cLocation()" (selection)="onTreePick($event)"></app-maximo-location-tree-picker>
              @if (cLocation() || cAsset()) { <p class="ti-picked">{{ cAsset() ? 'Asset ' + cAsset() : '' }}{{ cAsset() && cLocation() ? ' · ' : '' }}{{ cLocation() ? 'Location ' + cLocation() : '' }}</p> }
              <div class="ti-row2">
                <label class="ti-f">Work type <input type="text" [ngModel]="cWorktype()" (ngModelChange)="cWorktype.set($event)" placeholder="optional"></label>
                <label class="ti-f">Originator <input type="text" [ngModel]="cOriginator()" (ngModelChange)="cOriginator.set($event)"></label>
              </div>

              <h4 class="ti-h">⚠ Risk Assessment</h4>
              <div class="ti-risks">
                @for (s of sections; track s.key) {
                  <div class="ti-risk">
                    <div class="ti-risk-hd">{{ s.label }} <span class="ti-risk-score">{{ sectionScore(s.key) }}</span></div>
                    <select (change)="setConsequence(s.key, $any($event.target).value)">
                      <option value="">Consequence…</option>
                      @for (o of consequences(s.key); track o.label; let i = $index) { <option [value]="i" [selected]="risk()[s.key].c?.label === o.label">{{ o.label }} ({{ o.pts }})</option> }
                    </select>
                    <select (change)="setProbability(s.key, $any($event.target).value)">
                      <option value="">Probability…</option>
                      @for (o of probabilities; track o.label; let i = $index) { <option [value]="i" [selected]="risk()[s.key].p?.label === o.label">{{ o.label }} ({{ o.pts }})</option> }
                    </select>
                  </div>
                }
              </div>
              <div class="ti-total" [class]="levelClass()">Total risk: {{ riskTotal() }} — {{ level() }}</div>

              <label class="ti-f">TOI/TMOD Instructions <textarea rows="4" [ngModel]="cInstructions()" (ngModelChange)="cInstructions.set($event)"></textarea></label>
              <label class="ti-f">Risk Identified <textarea rows="2" [ngModel]="cRiskIdentified()" (ngModelChange)="cRiskIdentified.set($event)"></textarea></label>
              <label class="ti-f">Countermeasures / Controls <textarea rows="2" [ngModel]="cCountermeasures()" (ngModelChange)="cCountermeasures.set($event)"></textarea></label>
              <div class="ti-row2">
                <label class="ti-f">Approved by <input type="text" [ngModel]="cApprovedBy()" (ngModelChange)="cApprovedBy.set($event)"></label>
                <label class="ti-f">Approved date <input type="date" [ngModel]="cApprovedDate()" (ngModelChange)="cApprovedDate.set($event)"></label>
              </div>
              <label class="ti-f">Expected completion <input type="date" [ngModel]="cExpectedCompletion()" (ngModelChange)="cExpectedCompletion.set($event)"></label>

              <button class="ti-submit" [disabled]="creating() || !cTitle().trim()" (click)="submitCreate()">
                {{ creating() ? 'Creating…' : 'Create TOI/TMOD' }}
              </button>
            </div>
          }
        </div>

        @if (editing(); as wo) {
          <div class="ti-backdrop" (click)="editing.set(null)">
            <div class="ti-modal" (click)="$event.stopPropagation()">
              <h3 class="ti-formh">Edit — {{ wo.wonum }}</h3>
              @if (editError()) { <p class="ti-err">{{ editError() }}</p> }
              <label class="ti-f">Title <span class="req">*</span><input type="text" [ngModel]="eTitle()" (ngModelChange)="eTitle.set($event)"></label>
              <div class="ti-fh">Location / asset <span class="ti-fh-note">— equipment tag sets both, location sets location only</span></div>
              <app-maximo-location-tree-picker mode="both" [assetnum]="eAsset()" [location]="eLocation()" (selection)="onEditTreePick($event)"></app-maximo-location-tree-picker>
              @if (eLocation() || eAsset()) { <p class="ti-picked">{{ eAsset() ? 'Asset ' + eAsset() : '' }}{{ eAsset() && eLocation() ? ' · ' : '' }}{{ eLocation() ? 'Location ' + eLocation() : '' }}</p> }
              <label class="ti-f">Work type <input type="text" [ngModel]="eWorktype()" (ngModelChange)="eWorktype.set($event)"></label>
              <label class="ti-f">Instructions <textarea rows="4" [ngModel]="eInstructions()" (ngModelChange)="eInstructions.set($event)"></textarea></label>
              <div class="ti-actions">
                <button class="ti-add" [disabled]="savingEdit() || !eTitle().trim()" (click)="submitEdit(wo)">{{ savingEdit() ? 'Saving…' : 'Save changes' }}</button>
                <button class="ti-close-btn" (click)="editing.set(null)">Cancel</button>
              </div>
            </div>
          </div>
        }

        @if (closing(); as wo) {
          <div class="ti-backdrop" (click)="closing.set(null)">
            <div class="ti-modal" (click)="$event.stopPropagation()">
              <h3 class="ti-formh">Close — {{ title(wo) }}</h3>
              @if (closeError()) { <p class="ti-err">{{ closeError() }}</p> }
              <label class="ti-f">Closed by <span class="req">*</span><input type="text" [ngModel]="closeBy()" (ngModelChange)="closeBy.set($event)"></label>
              <label class="ti-f">Comments <textarea rows="3" [ngModel]="closeComments()" (ngModelChange)="closeComments.set($event)"></textarea></label>
              <label class="ti-f">Attach documents (optional) <input type="file" multiple (change)="onCloseFiles($event)"></label>
              @if (closeFiles().length) { <p class="ti-picked">📎 {{ closeFiles().length }} file(s) will be attached</p> }
              <p class="ti-hint">Closing completes the work order (status → COMP).</p>
              <div class="ti-actions">
                <button class="ti-add" [disabled]="savingClose() || !closeBy().trim()" (click)="submitClose(wo)">{{ savingClose() ? 'Closing…' : 'Close it' }}</button>
                <button class="ti-close-btn" (click)="closing.set(null)">Cancel</button>
              </div>
            </div>
          </div>
        }

        @if (detailWo(); as d) {
          <app-maximo-detail-dialog [parent]="'wo'" [wo]="d" (completed)="load()" (closed)="detailWo.set(null)"></app-maximo-detail-dialog>
        }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .ti-page { padding: 0.5rem 0.75rem 2rem; max-width: 1000px; margin: 0 auto; }
    .ti-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
    .ti-sub { color: var(--secondary-text, #888); font-size: 0.9rem; margin: 0; }
    .ti-new { background: #27ae60; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.9rem; font-weight: 700; cursor: pointer; }
    .ti-link, .ti-refresh { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.45rem 0.7rem; font-weight: 700; cursor: pointer; }
    .ti-tabs { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }
    .ti-tab { background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 8px; padding: 0.45rem 0.9rem; font-weight: 700; cursor: pointer; }
    .ti-tab.active { background: var(--accent-color, #26C6DA); border-color: var(--accent-color, #26C6DA); color: #fff; }
    .ti-refresh { margin-left: auto; }
    .ti-err { background: rgba(239,83,80,0.12); border: 1px solid #ef5350; border-radius: 8px; padding: 0.6rem; color: var(--primary-text); }
    .ti-msg, .ti-none { color: var(--secondary-text, #888); font-size: 0.9rem; }
    .ti-card { border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; background: var(--secondary-background); margin-bottom: 0.5rem; }
    .ti-row { width: 100%; display: grid; grid-template-columns: 1fr 120px 84px 140px 20px; gap: 0.6rem; align-items: center; text-align: left; background: transparent; border: none; color: var(--primary-text); padding: 0.6rem 0.8rem; cursor: pointer; font-family: inherit; font-size: 0.9rem; }
    .ti-title { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ti-wonum { color: var(--secondary-text, #888); font-size: 0.82rem; }
    .ti-status { font-size: 0.78rem; color: var(--secondary-text, #888); }
    .ti-loc { font-size: 0.78rem; color: var(--secondary-text, #888); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ti-caret { text-align: center; color: var(--secondary-text, #888); }
    .ti-body { padding: 0.4rem 0.9rem 0.9rem; border-top: 1px solid var(--border-color); }
    .ti-btnrow { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 0.6rem 0; }
    .ti-detail-btn { background: transparent; border: 1px solid var(--accent-color, #26C6DA); color: var(--accent-color, #26C6DA); border-radius: 8px; padding: 0.45rem 0.8rem; font-weight: 700; cursor: pointer; }
    .ti-edit-btn { background: transparent; border: 1px solid #7E57C2; color: #7E57C2; border-radius: 8px; padding: 0.45rem 0.8rem; font-weight: 700; cursor: pointer; }
    .ti-fh { font-size: 0.82rem; color: var(--secondary-text, #888); margin: 0.3rem 0; }
    .ti-fh-note { font-weight: 400; font-size: 0.75rem; }
    .ti-h { margin: 0.6rem 0 0.4rem; font-size: 0.92rem; }
    .ti-note { border-left: 3px solid var(--border-color); padding: 0.4rem 0.6rem; margin-bottom: 0.4rem; background: var(--card-bg, rgba(127,127,127,0.06)); border-radius: 0 6px 6px 0; }
    .ti-note.rec { border-left-color: #42A5F5; } .ti-note.cls { border-left-color: #EC407A; }
    .ti-note-hd { font-weight: 700; font-size: 0.84rem; }
    .ti-note-txt { white-space: pre-wrap; font-size: 0.86rem; margin-top: 0.2rem; }
    .ti-note-meta { font-size: 0.72rem; color: var(--secondary-text, #888); margin-top: 0.2rem; }
    .ti-ta, .ti-f input, .ti-f textarea, .ti-risk select { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem; background: var(--secondary-background); color: var(--primary-text); }
    .ti-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .ti-add { background: var(--accent-color, #26C6DA); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.9rem; font-weight: 700; cursor: pointer; }
    .ti-close-btn { background: transparent; border: 1px solid #EC407A; color: #EC407A; border-radius: 8px; padding: 0.5rem 0.9rem; font-weight: 700; cursor: pointer; }
    .ti-closed-note { color: #EC407A; font-weight: 700; }
    .ti-form { max-width: 640px; }
    .ti-formh { font-size: 1.05rem; margin: 0.4rem 0 0.6rem; }
    .ti-f { display: block; font-size: 0.82rem; color: var(--secondary-text, #888); margin-bottom: 0.7rem; }
    .ti-f input, .ti-f textarea { margin-top: 0.25rem; }
    .req { color: #ef5350; }
    .ti-hint { font-size: 0.78rem; color: var(--secondary-text, #888); margin: 0.1rem 0 0.5rem; }
    .ti-picked { font-size: 0.8rem; color: var(--accent-color, #26C6DA); margin: 0.2rem 0 0.5rem; }
    .ti-row2 { display: flex; gap: 0.6rem; } .ti-row2 .ti-f { flex: 1; }
    .ti-risks { display: flex; flex-direction: column; gap: 0.5rem; }
    .ti-risk { border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; }
    .ti-risk-hd { display: flex; justify-content: space-between; font-weight: 700; font-size: 0.88rem; margin-bottom: 0.4rem; }
    .ti-risk-score { background: var(--secondary-background); border: 1px solid var(--border-color); border-radius: 6px; padding: 0 0.5rem; }
    .ti-risk select { margin-bottom: 0.35rem; }
    .ti-total { text-align: center; font-weight: 800; padding: 0.5rem; border-radius: 8px; margin: 0.6rem 0 0.9rem; }
    .ti-total.low { background: rgba(39,174,96,0.15); color: #27ae60; }
    .ti-total.guarded { background: rgba(230,126,34,0.15); color: #e67e22; }
    .ti-total.serious { background: rgba(239,83,80,0.15); color: #ef5350; }
    .ti-submit { background: #27ae60; color: #fff; border: none; border-radius: 8px; padding: 0.7rem 1.2rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; }
    .ti-submit:disabled, .ti-add:disabled { opacity: 0.5; }
    .ti-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 60; }
    .ti-modal { background: var(--secondary-background); border-radius: 12px; padding: 1.2rem; width: 100%; max-width: 480px; }
  `]
})
export class MaximoToiPageComponent implements OnInit {
  private api = inject(MaximoApiService);

  readonly sections = TOI_SECTIONS;
  readonly probabilities = TOI_PROBABILITY;

  mode = signal<Mode>('list');
  tab = signal<Tab>('active');
  tois = signal<MaximoWorkOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  expanded = signal<string | null>(null);
  notes = signal<Record<string, MaximoWorklog[]>>({});
  notesLoading = signal<Record<string, boolean>>({});
  noteDraft = signal<Record<string, string>>({});
  savingNote = signal<string | null>(null);
  detailWo = signal<MaximoWorkOrder | null>(null);

  closing = signal<MaximoWorkOrder | null>(null);
  closeBy = signal(''); closeComments = signal(''); closeFiles = signal<File[]>([]); savingClose = signal(false); closeError = signal<string | null>(null);

  editing = signal<MaximoWorkOrder | null>(null);
  eTitle = signal(''); eInstructions = signal(''); eLocation = signal(''); eAsset = signal(''); eWorktype = signal('');
  savingEdit = signal(false); editError = signal<string | null>(null);

  cTitle = signal(''); cLocation = signal(''); cAsset = signal(''); cWorktype = signal('');
  cOriginator = signal(''); cInstructions = signal(''); cRiskIdentified = signal(''); cCountermeasures = signal('');
  cApprovedBy = signal(''); cApprovedDate = signal(''); cExpectedCompletion = signal('');
  risk = signal<Record<ToiSectionKey, Sel>>({ safety: { c: null, p: null }, environmental: { c: null, p: null }, operations: { c: null, p: null } });
  creating = signal(false); createError = signal<string | null>(null);

  activeList = computed(() => this.tois().filter(w => !toiIsClosed(w.description)));
  closedList = computed(() => this.tois().filter(w => toiIsClosed(w.description)));
  visible = computed(() => this.tab() === 'active' ? this.activeList() : this.closedList());

  ngOnInit(): void { this.load(); }
  title(wo: MaximoWorkOrder): string { return toiTitle(wo.description); }
  isClosed(wo: MaximoWorkOrder): boolean { return toiIsClosed(wo.description); }
  isRecord(n: MaximoWorklog): boolean { return (n.description || '').toUpperCase().includes('TOI/TMOD RECORD'); }
  isClose(n: MaximoWorklog): boolean { return (n.description || '').toUpperCase().includes('TOI/TMOD CLOSED'); }
  consequences(k: ToiSectionKey): RiskOption[] { return TOI_CONSEQUENCE[k]; }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.listTois().subscribe({
      next: list => { this.tois.set(list); this.loading.set(false); },
      error: () => { this.error.set('Couldn’t load TOI/TMOD records — Maximo may be unreachable. Click Refresh to retry.'); this.loading.set(false); }
    });
  }
  toggle(wo: MaximoWorkOrder): void {
    if (this.expanded() === wo.href) { this.expanded.set(null); return; }
    this.expanded.set(wo.href);
    if (this.notes()[wo.href] === undefined) this.loadNotes(wo.href);
  }
  private loadNotes(href: string): void {
    this.notesLoading.set({ ...this.notesLoading(), [href]: true });
    this.api.getWoWorklog(href).subscribe({
      next: n => { this.notes.set({ ...this.notes(), [href]: n }); this.notesLoading.set({ ...this.notesLoading(), [href]: false }); },
      error: () => { this.notes.set({ ...this.notes(), [href]: [] }); this.notesLoading.set({ ...this.notesLoading(), [href]: false }); }
    });
  }
  setNoteDraft(href: string, v: string): void { this.noteDraft.set({ ...this.noteDraft(), [href]: v }); }
  addNote(wo: MaximoWorkOrder): void {
    const text = (this.noteDraft()[wo.href] || '').trim();
    if (!text || this.savingNote() === wo.href) return;
    this.savingNote.set(wo.href);
    this.api.addWoNote(wo.href, text).subscribe({
      next: n => { this.notes.set({ ...this.notes(), [wo.href]: n }); this.setNoteDraft(wo.href, ''); this.savingNote.set(null); },
      error: () => { this.error.set('Could not add the note.'); this.savingNote.set(null); }
    });
  }

  startEdit(wo: MaximoWorkOrder): void {
    this.editing.set(wo); this.editError.set(null);
    this.eTitle.set(this.title(wo)); this.eInstructions.set(wo.longDescription || '');
    this.eLocation.set(wo.location || ''); this.eAsset.set(wo.assetnum || ''); this.eWorktype.set(wo.worktype || '');
  }
  onEditTreePick(e: { assetnum: string; location: string }): void { this.eAsset.set(e.assetnum || ''); this.eLocation.set(e.location || ''); }
  submitEdit(wo: MaximoWorkOrder): void {
    if (!this.eTitle().trim() || this.savingEdit()) return;
    this.savingEdit.set(true); this.editError.set(null);
    this.api.updateToi(wo.href, {
      title: this.eTitle().trim(), instructions: this.eInstructions() || undefined,
      location: this.eLocation() || undefined, assetnum: this.eAsset() || undefined, worktype: this.eWorktype() || undefined,
    }).subscribe({
      next: () => { this.savingEdit.set(false); this.editing.set(null); this.expanded.set(null); this.load(); },
      error: () => { this.editError.set('Could not save changes.'); this.savingEdit.set(false); }
    });
  }

  startClose(wo: MaximoWorkOrder): void { this.closing.set(wo); this.closeBy.set(''); this.closeComments.set(''); this.closeFiles.set([]); this.closeError.set(null); }
  onCloseFiles(e: Event): void { this.closeFiles.set(Array.from((e.target as HTMLInputElement).files ?? [])); }
  submitClose(wo: MaximoWorkOrder): void {
    if (!this.closeBy().trim() || this.savingClose()) return;
    this.savingClose.set(true); this.closeError.set(null);
    const files = this.closeFiles();
    // Attach documents first (while the WO is still editable), THEN close (status → COMP).
    const uploads = files.length ? forkJoin(files.map(f => this.api.uploadAttachment('wo', wo.href, f))) : of([]);
    uploads.pipe(switchMap(() => this.api.closeToi(wo.href, this.closeBy().trim(), this.closeComments().trim()))).subscribe({
      next: () => { this.savingClose.set(false); this.closing.set(null); this.expanded.set(null); this.closeFiles.set([]); this.load(); },
      error: () => { this.closeError.set('Could not close — an attachment or the status change failed. Check the log.'); this.savingClose.set(false); }
    });
  }

  startCreate(): void {
    this.mode.set('create'); this.createError.set(null);
    this.cTitle.set(''); this.cLocation.set(''); this.cAsset.set(''); this.cWorktype.set('');
    this.cOriginator.set(''); this.cInstructions.set(''); this.cRiskIdentified.set(''); this.cCountermeasures.set('');
    this.cApprovedBy.set(''); this.cApprovedDate.set(''); this.cExpectedCompletion.set('');
    this.risk.set({ safety: { c: null, p: null }, environmental: { c: null, p: null }, operations: { c: null, p: null } });
  }
  onTreePick(e: { assetnum: string; location: string }): void { this.cAsset.set(e.assetnum || ''); this.cLocation.set(e.location || ''); }
  setConsequence(k: ToiSectionKey, idx: string): void {
    const o = idx === '' ? null : TOI_CONSEQUENCE[k][+idx];
    this.risk.set({ ...this.risk(), [k]: { ...this.risk()[k], c: o } });
  }
  setProbability(k: ToiSectionKey, idx: string): void {
    const o = idx === '' ? null : TOI_PROBABILITY[+idx];
    this.risk.set({ ...this.risk(), [k]: { ...this.risk()[k], p: o } });
  }
  sectionScore(k: ToiSectionKey): number { const s = this.risk()[k]; return (s.c?.pts ?? 0) + (s.p?.pts ?? 0); }
  riskTotal(): number { return this.sectionScore('safety') + this.sectionScore('environmental') + this.sectionScore('operations'); }
  level(): string { return toiRiskLevel(this.riskTotal()); }
  levelClass(): string { const l = this.level(); return l === 'Low Risk' ? 'low' : l === 'Guarded Risk' ? 'guarded' : 'serious'; }

  submitCreate(): void {
    const title = this.cTitle().trim();
    if (!title || this.creating()) return;
    this.creating.set(true); this.createError.set(null);
    const sec = (k: ToiSectionKey) => ({
      consequenceLabel: this.risk()[k].c?.label ?? '', consequencePts: this.risk()[k].c?.pts ?? null,
      probabilityLabel: this.risk()[k].p?.label ?? '', probabilityPts: this.risk()[k].p?.pts ?? null,
    });
    const req: ToiCreateRequest = {
      title, location: this.cLocation() || undefined, assetnum: this.cAsset() || undefined,
      worktype: this.cWorktype() || undefined, instructions: this.cInstructions() || undefined,
      riskIdentified: this.cRiskIdentified() || undefined, countermeasures: this.cCountermeasures() || undefined,
      originator: this.cOriginator() || undefined, approvedBy: this.cApprovedBy() || undefined,
      approvedDate: this.cApprovedDate() || undefined, expectedCompletion: this.cExpectedCompletion() || undefined,
      safety: sec('safety'), environmental: sec('environmental'), operations: sec('operations'),
    };
    this.api.createToi(req).subscribe({
      next: () => { this.creating.set(false); this.mode.set('list'); this.tab.set('active'); this.load(); },
      error: () => { this.createError.set('Could not create the TOI/TMOD.'); this.creating.set(false); }
    });
  }
}
