import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, switchMap, of, catchError, from, concatMap } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { MaximoApiService } from './maximo-api.service';
import { CreateMaximoServiceRequest, MaximoLocation } from './maximo.model';
import { MaximoTreePickerComponent } from './maximo-tree-picker.component';

@Component({
  selector: 'app-maximo-sr-create',
  standalone: true,
  imports: [MainLayoutComponent, MaximoTreePickerComponent],
  template: `
    <app-main-layout [header]="'New Request'">
      <ng-container main-content>
        <div class="sc-container">
          <button class="sc-back" (click)="back()">← Maximo</button>

          @if (createdTicket()) {
            <div class="sc-done">
              <div class="sc-done-icon">✓</div>
              <p class="sc-done-title">Request submitted</p>
              <p class="sc-done-id">{{ createdTicket() }}</p>
              <div class="sc-done-actions">
                <button class="sc-btn" (click)="reset()">New request</button>
                <button class="sc-btn alt" (click)="back()">Back to Maximo</button>
              </div>
            </div>
          } @else {
            <label class="sc-field">Description <span class="sc-req">*</span>
              <textarea rows="2" [value]="description()" (input)="description.set($any($event.target).value)"
                        placeholder="What's the problem?"></textarea>
            </label>

            <label class="sc-field">Details
              <textarea rows="3" [value]="longDescription()" (input)="longDescription.set($any($event.target).value)"
                        placeholder="Any extra detail (optional)"></textarea>
            </label>

            <label class="sc-field">Priority
              <select [value]="priority()" (change)="priority.set($any($event.target).value)">
                <option value="1">1 — Highest</option>
                <option value="2">2 — High</option>
                <option value="3">3 — Medium</option>
                <option value="4">4 — Low</option>
                <option value="5">5 — Lowest</option>
              </select>
            </label>

            <!-- Location / asset (optional): ONE tree pick fills both. Manual escape hatch for codes not yet seeded. -->
            <div class="sc-la-head">
              <span>Location / Asset (optional)</span>
              <button type="button" class="sc-link" (click)="toggleManual()">
                {{ manualEntry() ? 'use plant tree' : 'type manually' }}
              </button>
            </div>

            @if (!manualEntry()) {
              <app-maximo-tree-picker mode="both" [assetnum]="assetnum()" [location]="location()"
                                      (selection)="onTreePick($event)"></app-maximo-tree-picker>
            } @else {
              <label class="sc-field">Asset
                <input type="text" [value]="assetnum()" (input)="assetnum.set($any($event.target).value)"
                       placeholder="Asset / tag number">
              </label>

              <label class="sc-field">Location
                <input type="text" [value]="locationQuery()" (input)="onLocationInput($event)"
                       placeholder="Search a location">
              </label>
              @if (location()) { <p class="sc-picked">Location: <b>{{ location() }}</b> <button class="sc-clear" (click)="clearLocation()">clear</button></p> }
              @if (locResults().length) {
                <div class="sc-loc-results">
                  @for (l of locResults(); track l.location) {
                    <button class="sc-loc" (click)="pickLocation(l)"><b>{{ l.location }}</b> {{ l.description }}</button>
                  }
                </div>
              }
            }

            <label class="sc-field">Attachments <span class="sc-cap-hint">images · video · PDF · Word · Excel</span>
              <input type="file" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx" multiple (change)="onPhotos($event)">
            </label>
            @if (photos().length) {
              <div class="sc-thumbs">
                @for (p of photos(); track p.url; let i = $index) {
                  <div class="sc-thumb" [class.sc-file]="fileKind(p.file) === 'other'">
                    @switch (fileKind(p.file)) {
                      @case ('image') { <img [src]="p.url" alt="attachment"> }
                      @case ('video') { <video [src]="p.url" muted playsinline></video> }
                      @default { <span class="sc-fileic">{{ fileIcon(p.file) }}</span><span class="sc-filename">{{ p.file.name }}</span> }
                    }
                    <button class="sc-thumb-x" (click)="removePhoto(i)">✕</button>
                  </div>
                }
              </div>
            }

            @if (error()) { <p class="sc-err">{{ error() }}</p> }

            <button class="sc-submit" [disabled]="!canSubmit() || submitting()" (click)="submit()">
              {{ submitting() ? (uploadStatus() || 'Submitting…') : 'Submit request' }}
            </button>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .sc-container { padding: 1rem; max-width: 640px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 3rem; }
    .sc-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; margin-bottom: 0.5rem; }
    .sc-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.9rem; }
    .sc-field textarea, .sc-field input, .sc-field select { padding: 0.6rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; font-weight: 400; box-sizing: border-box; }
    .sc-req { color: #e74c3c; }
    .sc-picked { font-size: 0.85rem; color: var(--primary-text); margin: -0.4rem 0 0.9rem; }
    .sc-clear { background: none; border: none; color: var(--accent-color); font-size: 0.78rem; cursor: pointer; }
    .sc-loc-results { display: flex; flex-direction: column; gap: 0.3rem; margin: -0.4rem 0 0.9rem; max-height: 220px; overflow-y: auto; }
    .sc-loc { text-align: left; background: var(--card-bg, var(--secondary-background)); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem 0.6rem; font-size: 0.82rem; color: var(--primary-text); cursor: pointer; font-family: inherit; }
    .sc-la-head { display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.5rem; }
    .sc-link { background: none; border: none; color: var(--accent-color); font-size: 0.78rem; cursor: pointer; font-family: inherit; }
    .sc-thumbs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: -0.4rem 0 0.9rem; }
    .sc-thumb { position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); }
    .sc-thumb img, .sc-thumb video { width: 100%; height: 100%; object-fit: cover; background: #000; }
    .sc-thumb.sc-file { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: var(--secondary-background); padding: 3px; box-sizing: border-box; }
    .sc-fileic { font-size: 1.7rem; line-height: 1; }
    .sc-filename { font-size: 0.52rem; color: var(--secondary-text, #888); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sc-cap-hint { font-weight: 400; font-size: 0.7rem; color: var(--secondary-text, #888); }
    .sc-thumb-x { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.7rem; cursor: pointer; line-height: 1; }
    .sc-err { color: #e74c3c; font-size: 0.85rem; margin: 0 0 0.8rem; }
    .sc-submit { width: 100%; background: #27ae60; color: #fff; border: none; border-radius: 10px; padding: 0.85rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .sc-submit:disabled { opacity: 0.5; cursor: default; }
    .sc-done { text-align: center; padding: 2.5rem 1rem; }
    .sc-done-icon { width: 3.5rem; height: 3.5rem; line-height: 3.5rem; margin: 0 auto 0.75rem; border-radius: 50%; background: #27ae60; color: #fff; font-size: 2rem; }
    .sc-done-title { color: var(--primary-text); font-size: 1.1rem; font-weight: 700; margin: 0 0 0.25rem; }
    .sc-done-id { color: var(--secondary-text, #888); margin: 0 0 1.5rem; }
    .sc-done-actions { display: flex; gap: 0.6rem; justify-content: center; }
    .sc-btn { background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .sc-btn.alt { background: transparent; color: var(--accent-color); border: 1px solid var(--accent-color); }
  `]
})
export class MaximoSrCreateComponent implements OnDestroy {
  private api = inject(MaximoApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  description = signal('');
  longDescription = signal('');
  priority = signal('3');
  assetnum = signal('');
  location = signal('');
  locationQuery = signal('');
  locResults = signal<MaximoLocation[]>([]);
  // The Maximo-seeded plant tree is the default SR-target picker (app-maximo-tree-picker); manual free-text is
  // the escape hatch for a brand-new code not yet in the seeded tree.
  manualEntry = signal(false);
  photos = signal<{ file: File; url: string }[]>([]);
  submitting = signal(false);
  uploadStatus = signal<string | null>(null);
  error = signal<string | null>(null);
  createdTicket = signal<string | null>(null);

  private locSearch$ = new Subject<string>();

  constructor() {
    this.locSearch$.pipe(
      debounceTime(300),
      switchMap(q => q.trim().length < 2 ? of([]) : this.api.searchLocations(q.trim()).pipe(catchError(() => of([]))))
    ).subscribe(res => this.locResults.set(res));

    // Prefill from a deep-link (e.g. "Report to Maximo" on a Rounds object / out-of-range issue).
    const qp = this.route.snapshot.queryParamMap;
    const asset = qp.get('assetnum'); if (asset) this.assetnum.set(asset);
    const loc = qp.get('location'); if (loc) { this.location.set(loc); this.locationQuery.set(loc); }
    const desc = qp.get('description'); if (desc) this.description.set(desc);
    const long = qp.get('longDescription'); if (long) this.longDescription.set(long);
  }

  canSubmit(): boolean { return this.description().trim().length > 0; }

  onLocationInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.locationQuery.set(v);
    this.locSearch$.next(v);
  }
  pickLocation(l: MaximoLocation): void {
    this.location.set(l.location);
    this.locationQuery.set(l.location);
    this.locResults.set([]);
  }
  clearLocation(): void { this.location.set(''); this.locationQuery.set(''); this.locResults.set([]); }

  // ── Plant-tree SR-target picker ────────────────────────────────────────────

  toggleManual(): void { this.manualEntry.update(v => !v); }

  /** One tree pick fills the SR target: equipment → asset + its location; location node → location, no asset. */
  onTreePick(sel: { assetnum: string; location: string }): void {
    this.assetnum.set(sel.assetnum);
    this.location.set(sel.location);
    this.locationQuery.set(sel.location);
  }

  onPhotos(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    const added = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    this.photos.set([...this.photos(), ...added]);
    (e.target as HTMLInputElement).value = '';
  }
  removePhoto(i: number): void {
    const list = [...this.photos()];
    const [removed] = list.splice(i, 1);
    if (removed) URL.revokeObjectURL(removed.url);
    this.photos.set(list);
  }

  /** Classify a picked file for preview: images get a thumbnail, videos a frame, everything else a doc chip. */
  fileKind(f: File): 'image' | 'video' | 'other' {
    const t = (f.type || '').toLowerCase();
    if (t.startsWith('image/')) return 'image';
    if (t.startsWith('video/')) return 'video';
    return 'other';
  }
  /** Emoji for a non-media attachment, by extension (pdf / word / excel / other). */
  fileIcon(f: File): string {
    const n = (f.name || '').toLowerCase();
    if (n.endsWith('.pdf')) return '📄';
    if (n.endsWith('.xls') || n.endsWith('.xlsx') || n.endsWith('.csv')) return '📊';
    if (n.endsWith('.doc') || n.endsWith('.docx')) return '📝';
    return '📎';
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const body: CreateMaximoServiceRequest = {
      description: this.description().trim(),
      longDescription: this.longDescription().trim() || undefined,
      priority: this.priority(),
      assetnum: this.assetnum().trim() || undefined,
      location: this.location() || undefined,
    };
    this.submitting.set(true); this.error.set(null); this.uploadStatus.set(null);
    this.api.createServiceRequest(body).subscribe({
      next: sr => {
        if (!sr?.ticketid || !sr.href) {
          this.submitting.set(false);
          this.error.set('Submitted, but no ticket id came back. Check Maximo.');
          return;
        }
        const photos = this.photos();
        if (!photos.length) { this.finish(sr.ticketid); return; }
        // SR is created — upload photos best-effort (a failure doesn't undo the SR).
        let done = 0;
        this.uploadStatus.set(`Uploading attachment 1/${photos.length}…`);
        from(photos).pipe(
          concatMap(p => this.api.uploadSrAttachment(sr.href, p.file))
        ).subscribe({
          next: () => { done++; if (done < photos.length) this.uploadStatus.set(`Uploading attachment ${done + 1}/${photos.length}…`); },
          complete: () => this.finish(sr.ticketid),
        });
      },
      error: e => { this.submitting.set(false); this.error.set(e?.error?.message || e?.message || 'Submit failed. Try again when you have signal.'); }
    });
  }

  private finish(ticket: string): void {
    this.submitting.set(false);
    this.uploadStatus.set(null);
    this.revokePhotos();
    this.photos.set([]);
    this.createdTicket.set(ticket);
  }

  reset(): void {
    this.description.set(''); this.longDescription.set(''); this.priority.set('3');
    this.assetnum.set(''); this.location.set(''); this.locationQuery.set(''); this.locResults.set([]);
    this.revokePhotos(); this.photos.set([]);
    this.error.set(null); this.createdTicket.set(null); this.uploadStatus.set(null);
  }
  back(): void { this.router.navigate(['/maximo']); }

  ngOnDestroy(): void { this.revokePhotos(); }
  private revokePhotos(): void { for (const p of this.photos()) URL.revokeObjectURL(p.url); }
}
