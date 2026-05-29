import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfSdsApiService } from '../services/rf-sds-api.service';
import { RfSdsStateService } from '../services/rf-sds-state.service';
import { RfSdsPrintService } from '../services/rf-sds-print.service';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

interface HeldFile { fileName: string; contentType: string; base64Content: string; }
interface Attachment { id: number; fileName: string; contentType: string; base64Content: string; }

/**
 * Guided "new SDS arrived" intake wizard (desktop only). Walks the operator through:
 * names → locations → attach PDF → save + approve suggested address → generate sheets + manual-steps
 * checklist → confirm → status Filed. Transient UI; the record's status tracks completion.
 */
@Component({
  selector: 'app-rf-sds-wizard',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  template: `
    <app-rf-popup-projection [isOpen]="true" (close)="close.emit()">
      <div class="wizard">
        <div class="wiz-header">
          <h2>Process SDS — {{ primaryName() }}</h2>
          <button class="x" (click)="close.emit()">&times;</button>
        </div>

        <div class="steps">
          @for (s of stepLabels; track s; let i = $index) {
            <div class="step-pill" [class.active]="step() === i + 1" [class.done]="step() > i + 1">
              {{ i + 1 }}. {{ s }}
            </div>
          }
        </div>

        @if (errorMsg()) { <div class="error">{{ errorMsg() }}</div> }

        <div class="wiz-body">
          @switch (step()) {
            @case (1) {
              <label class="lbl">Chemical names / aliases (one per line)</label>
              <textarea class="ta" rows="5" [value]="names()" (input)="names.set($any($event.target).value)"
                        placeholder="Primary name on the first line, aliases below"></textarea>
            }
            @case (2) {
              <label class="lbl">Storage locations (one per line)</label>
              <textarea class="ta" rows="5" [value]="locations()" (input)="locations.set($any($event.target).value)"
                        placeholder="Where the chemical is stored"></textarea>
            }
            @case (3) {
              <label class="lbl">SDS document (PDF)</label>
              @if (existingAttachments().length > 0) {
                <div class="att-list">
                  @for (a of existingAttachments(); track a.id) {
                    <div class="att">&#x1F4CE; {{ a.fileName }}</div>
                  }
                </div>
              }
              @if (heldFiles().length > 0) {
                <div class="att-list">
                  @for (f of heldFiles(); track f.fileName) {
                    <div class="att new">&#x2795; {{ f.fileName }} (pending save)</div>
                  }
                </div>
              }
              @if (existingAttachments().length === 0 && heldFiles().length === 0) {
                <div class="muted">No SDS document attached yet.</div>
              }
              <label class="file-btn">
                + Add PDF
                <input type="file" hidden multiple accept="application/pdf,.pdf,image/*" (change)="onFilesSelected($event)">
              </label>
            }
            @case (4) {
              <label class="lbl">Filing address (suggested — approve or edit)</label>
              <div class="addr-row">
                <div class="addr-field">
                  <span>Book</span>
                  <input type="number" [value]="bookNumber() ?? ''" (input)="bookNumber.set(num($event))">
                </div>
                <div class="addr-field">
                  <span>Section</span>
                  <input type="number" [value]="sectionNumber() ?? ''" (input)="sectionNumber.set(num($event))">
                </div>
                <button class="newbook" (click)="onStartNewBook()">+ Start new book</button>
              </div>
              <label class="lbl">Processed by</label>
              <input class="txt" [value]="processedByName()" (input)="processedByName.set($any($event.target).value)"
                     placeholder="Your name">
              <div class="reminder">
                &#9888; Before filing the paper, confirm the last section already used in
                <strong>Book {{ bookNumber() ?? '—' }}</strong>. If Section {{ sectionNumber() ?? '—' }} is
                taken, bump it before saving.
              </div>
            }
            @case (5) {
              <p class="gen-intro">Generate and print the documents, then tick each step:</p>
              <div class="checklist">
                <label class="check">
                  <input type="checkbox" [checked]="checkTitle()" (change)="checkTitle.set($any($event.target).checked)">
                  Print the <strong>title sheet</strong>
                  <button class="gen-btn" (click)="onPrintTitle()">Print title sheet</button>
                </label>
                <label class="check">
                  <input type="checkbox" [checked]="checkIndex()" (change)="checkIndex.set($any($event.target).checked)">
                  Print the <strong>index sheet</strong> for the books
                  <button class="gen-btn" (click)="onPrintIndex()">Print index</button>
                </label>
                <label class="check">
                  <input type="checkbox" [checked]="checkPdf()" (change)="checkPdf.set($any($event.target).checked)">
                  Print the <strong>SDS PDF</strong>
                  <button class="gen-btn" (click)="onOpenPdf()">Open SDS PDF</button>
                </label>
              </div>
            }
            @case (6) {
              <p class="gen-intro">Confirm everything is correct, then file:</p>
              <div class="overview">
                <div><span>Names:</span> {{ allNames().join(', ') }}</div>
                <div><span>Locations:</span> {{ splitLocations().join(', ') || '—' }}</div>
                <div><span>Address:</span> Book {{ bookNumber() ?? '—' }} / Section {{ sectionNumber() ?? '—' }}</div>
                <div><span>Processed by:</span> {{ processedByName() || '—' }}</div>
                <div><span>Documents:</span> {{ totalAttachmentCount() }} attached</div>
              </div>
              <label class="check confirm">
                <input type="checkbox" [checked]="confirmCorrect()" (change)="confirmCorrect.set($any($event.target).checked)">
                I confirm all manual steps are done and all data is correct.
              </label>
            }
          }
        </div>

        <div class="wiz-footer">
          <button class="nav" [disabled]="step() === 1 || saving()" (click)="back()">Back</button>
          <span class="spacer"></span>
          @if (step() < 4) {
            <button class="nav primary" [disabled]="!canAdvance()" (click)="next()">Next</button>
          } @else if (step() === 4) {
            <button class="nav primary" [disabled]="saving()" (click)="onSave()">
              {{ saving() ? 'Saving...' : 'Save & continue' }}
            </button>
          } @else if (step() === 5) {
            <button class="nav primary" [disabled]="!allChecked()" (click)="step.set(6)">Next</button>
          } @else {
            <button class="nav primary" [disabled]="!confirmCorrect() || saving()" (click)="onFinish()">
              {{ saving() ? 'Filing...' : 'Finish & mark Filed' }}
            </button>
          }
        </div>
      </div>
    </app-rf-popup-projection>
  `,
  styles: [`
    .wizard { padding: 20px; width: 560px; max-width: 90vw; max-height: 82vh; overflow-y: auto; }
    .wiz-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .wiz-header h2 { font-size: 18px; margin: 0; flex: 1; }
    .x { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--primary-text); }
    .steps { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
    .step-pill { font-size: 11px; padding: 3px 8px; border-radius: 12px; background: var(--secondary-background);
      color: var(--secondary-text); border: 1px solid var(--border-color); }
    .step-pill.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .step-pill.done { background: var(--status-complete); color: var(--primary-text); border-color: var(--status-complete); }
    .error { background: var(--error-bg, #ffebee); color: var(--error-text, #c62828); padding: 8px 12px;
      border-radius: 6px; font-size: 13px; margin-bottom: 10px; }
    .wiz-body { min-height: 220px; }
    .lbl { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text);
      text-transform: uppercase; letter-spacing: 0.3px; margin: 10px 0 4px; }
    .ta, .txt { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--input-bg, var(--card-background)); color: var(--primary-text);
      font-family: inherit; font-size: 14px; }
    .muted { color: var(--secondary-text); font-style: italic; font-size: 13px; margin: 8px 0; }
    .att-list { display: flex; flex-direction: column; gap: 4px; margin: 6px 0; }
    .att { font-size: 13px; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; }
    .att.new { border-style: dashed; color: var(--accent-color); }
    .file-btn { display: inline-flex; align-items: center; margin-top: 10px; padding: 6px 14px;
      border: 1px solid var(--accent-color); border-radius: 4px; background: var(--card-background);
      color: var(--accent-color); cursor: pointer; font-size: 13px; }
    .addr-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .addr-field { display: flex; flex-direction: column; gap: 4px; }
    .addr-field span { font-size: 12px; color: var(--secondary-text); }
    .addr-field input { width: 90px; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;
      background: var(--input-bg, var(--card-background)); color: var(--primary-text); font-size: 14px; }
    .newbook { padding: 8px 12px; border: 1px solid var(--accent-color); border-radius: 4px;
      background: var(--card-background); color: var(--accent-color); cursor: pointer; font-size: 12px; }
    .reminder { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; border-radius: 6px;
      padding: 8px 12px; font-size: 12px; line-height: 1.4; margin-top: 12px; }
    .gen-intro { font-size: 13px; color: var(--secondary-text); }
    .checklist { display: flex; flex-direction: column; gap: 10px; }
    .check { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--primary-text);
      padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-background); }
    .check input[type="checkbox"] { width: 18px; height: 18px; flex-shrink: 0; cursor: pointer;
      accent-color: var(--accent-color); margin: 0; }
    .check .gen-btn { margin-left: auto; padding: 6px 14px; border: 1px solid var(--accent-color);
      border-radius: 6px; background: var(--card-background); color: var(--accent-color); cursor: pointer;
      font-size: 12px; white-space: nowrap; }
    .check .gen-btn:hover { background: var(--secondary-background); }
    .check.confirm { margin-top: 14px; font-weight: 600; border-color: var(--accent-color); }
    .overview { display: flex; flex-direction: column; gap: 6px; font-size: 14px; padding: 10px 12px;
      background: var(--secondary-background); border-radius: 8px; }
    .overview span { font-weight: 600; color: var(--secondary-text); margin-right: 6px; }
    .wiz-footer { display: flex; align-items: center; gap: 8px; margin-top: 18px; padding-top: 12px;
      border-top: 1px solid var(--border-color); }
    .spacer { flex: 1; }
    .nav { padding: 8px 18px; border: 1px solid var(--border-color); border-radius: 6px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 14px; }
    .nav.primary { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .nav:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class RfSdsWizardComponent implements OnInit {
  item = input<SdsChemicalDto | null>(null);
  close = output<void>();
  filed = output<void>();

  private api = inject(RfSdsApiService);
  private stateService = inject(RfSdsStateService);
  private printService = inject(RfSdsPrintService);

  readonly stepLabels = ['Names', 'Locations', 'PDF', 'Address', 'Print', 'Confirm'];

  step = signal(1);
  names = signal('');
  locations = signal('');
  bookNumber = signal<number | null>(null);
  sectionNumber = signal<number | null>(null);
  processedByName = signal('');
  heldFiles = signal<HeldFile[]>([]);
  existingAttachments = signal<Attachment[]>([]);
  savedId = signal<number | null>(null);
  saving = signal(false);
  errorMsg = signal('');

  checkTitle = signal(false);
  checkIndex = signal(false);
  checkPdf = signal(false);
  confirmCorrect = signal(false);

  allNames = computed(() => splitLines(this.names()));
  primaryName = computed(() => this.allNames()[0] || 'New chemical');
  allChecked = computed(() => this.checkTitle() && this.checkIndex() && this.checkPdf());

  ngOnInit(): void {
    const it = this.item();
    if (it) {
      this.names.set(it.names || '');
      this.locations.set(it.locations || '');
      this.processedByName.set(it.processedByName || '');
      this.bookNumber.set(it.bookNumber);
      this.sectionNumber.set(it.sectionNumber);
      this.savedId.set(it.id || null);
      if (it.id) this.loadAttachments(it.id);
      if (it.bookNumber == null && it.sectionNumber == null) this.fetchSuggestion();
    } else {
      this.fetchSuggestion();
    }
  }

  private fetchSuggestion(): void {
    this.api.getSuggestedAddress().subscribe({
      next: res => {
        const a = res.responseData;
        if (a && this.bookNumber() == null) {
          this.bookNumber.set(a.bookNumber);
          this.sectionNumber.set(a.sectionNumber);
        }
      },
      error: () => {}
    });
  }

  private loadAttachments(id: number): void {
    this.api.getAttachments(id).subscribe({
      next: res => this.existingAttachments.set(res.responseData || []),
      error: () => {}
    });
  }

  splitLocations(): string[] { return splitLines(this.locations()); }
  totalAttachmentCount(): number { return this.existingAttachments().length + this.heldFiles().length; }

  num(event: Event): number | null {
    const v = (event.target as HTMLInputElement).value;
    return v === '' ? null : Number(v);
  }

  canAdvance(): boolean {
    if (this.step() === 1) return this.allNames().length > 0;
    return true;
  }

  next(): void {
    this.errorMsg.set('');
    if (this.step() === 1 && this.allNames().length === 0) {
      this.errorMsg.set('Enter at least one chemical name.');
      return;
    }
    this.step.update(s => Math.min(6, s + 1));
  }

  back(): void {
    this.errorMsg.set('');
    this.step.update(s => Math.max(1, s - 1));
  }

  onStartNewBook(): void {
    this.bookNumber.set((this.bookNumber() ?? 0) + 1);
    this.sectionNumber.set(1);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.heldFiles.update(list => [...list, {
          fileName: file.name, contentType: file.type || 'application/pdf', base64Content: base64
        }]);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  /** Step 4 → 5: persist the record (status Pending), upload any held files, then advance. */
  onSave(): void {
    if (this.allNames().length === 0) { this.errorMsg.set('Enter at least one chemical name.'); this.step.set(1); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    const dto = new SdsChemicalDto({
      id: this.savedId() ?? 0,
      names: this.names(),
      locations: this.locations(),
      bookNumber: this.bookNumber(),
      sectionNumber: this.sectionNumber(),
      processedByName: this.processedByName(),
      statusName: 'Pending',
    });

    this.api.save(dto).subscribe({
      next: res => {
        const saved = res.responseData;
        const id = saved?.id ?? this.savedId();
        if (id) this.savedId.set(id);
        this.uploadHeldThenAdvance(id ?? null);
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set('Save failed: ' + err.message);
      }
    });
  }

  private uploadHeldThenAdvance(id: number | null): void {
    const held = this.heldFiles();
    if (!id || held.length === 0) {
      if (id) this.loadAttachments(id);
      this.saving.set(false);
      this.step.set(5);
      return;
    }
    let remaining = held.length;
    for (const f of held) {
      this.api.uploadAttachment(id, f).subscribe({
        next: () => { if (--remaining === 0) this.finishUpload(id); },
        error: () => { if (--remaining === 0) this.finishUpload(id); }
      });
    }
  }

  private finishUpload(id: number): void {
    this.heldFiles.set([]);
    this.loadAttachments(id);
    this.saving.set(false);
    this.step.set(5);
  }

  onPrintTitle(): void {
    this.printService.printTitleSheet(this.buildDto());
    this.checkTitle.set(true);
  }

  onPrintIndex(): void {
    this.api.getAll().subscribe({
      next: res => {
        const items = (res.responseData || []).map((i: any) => SdsChemicalDto.fromJson(i));
        this.printService.printMasterIndex(items);
        this.checkIndex.set(true);
      },
      error: () => {}
    });
  }

  onOpenPdf(): void {
    const pdf = this.existingAttachments().find(a => isPdf(a.contentType, a.fileName))
      || this.existingAttachments()[0];
    const held = this.heldFiles().find(f => isPdf(f.contentType, f.fileName)) || this.heldFiles()[0];
    const chosen = pdf
      ? { contentType: pdf.contentType, base64: pdf.base64Content }
      : (held ? { contentType: held.contentType, base64: held.base64Content } : null);
    if (!chosen || !chosen.base64) { this.errorMsg.set('No SDS document attached to print.'); return; }

    // Use a Blob URL, not a data: URL — browsers block/fail to open large data URLs in a new tab.
    const url = base64ToBlobUrl(chosen.base64, chosen.contentType || 'application/pdf');
    if (!url) { this.errorMsg.set('Could not open the SDS document.'); return; }
    const win = window.open(url, '_blank');
    if (!win) { this.errorMsg.set('Pop-up blocked — allow pop-ups to open/print the SDS PDF.'); }
    this.checkPdf.set(true);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  onFinish(): void {
    const id = this.savedId();
    if (!id) return;
    this.saving.set(true);
    this.api.changeStatus(id, 'Filed').subscribe({
      next: () => {
        this.saving.set(false);
        this.stateService.loadAll();
        this.filed.emit();
        this.close.emit();
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set('Could not mark Filed: ' + err.message);
      }
    });
  }

  private buildDto(): SdsChemicalDto {
    return new SdsChemicalDto({
      id: this.savedId() ?? 0,
      names: this.names(),
      locations: this.locations(),
      bookNumber: this.bookNumber(),
      sectionNumber: this.sectionNumber(),
      processedByName: this.processedByName(),
      statusName: 'Filed',
    });
  }
}

function splitLines(text: string | null | undefined): string[] {
  return (text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}
function isPdf(contentType: string | undefined, fileName: string | undefined): boolean {
  return (contentType || '').includes('pdf') || (fileName || '').toLowerCase().endsWith('.pdf');
}
function base64ToBlobUrl(base64: string, contentType: string): string | null {
  try {
    const clean = base64.startsWith('data:') ? (base64.split(',')[1] || '') : base64;
    const byteChars = atob(clean);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: contentType || 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
