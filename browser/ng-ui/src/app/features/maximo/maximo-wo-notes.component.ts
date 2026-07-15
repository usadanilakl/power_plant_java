import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { MaximoApiService } from './maximo-api.service';
import { MaximoWorklog } from './maximo.model';

/**
 * Worklog notes for a work order: read the existing notes and add a new one (summary + optional details).
 * Online-only — Maximo is the store. Kept as its own component so the WO sheet's Notes tab is thin.
 */
@Component({
  selector: 'app-maximo-wo-notes',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (loading()) { <p class="wn-msg">Loading notes…</p> }
    @else {
      @if (error()) { <p class="wn-err">{{ error() }}</p> }
      @if (notes().length === 0 && !error()) { <p class="wn-msg">No notes yet.</p> }
      <div class="wn-list">
        @for (n of notes(); track n.worklogid || n.href || n.createdate) {
          <div class="wn-item">
            <div class="wn-top">
              <span class="wn-by">{{ n.createby || '—' }}</span>
              @if (n.createdate) { <span class="wn-date">{{ n.createdate | date:'MMM d, h:mm a' }}</span> }
            </div>
            @if (n.description) { <div class="wn-sum">{{ n.description }}</div> }
            @if (n.longDescription) { <div class="wn-det">{{ n.longDescription }}</div> }
          </div>
        }
      </div>
    }

    <div class="wn-add">
      <input class="wn-in" type="text" [value]="summary()" (input)="summary.set($any($event.target).value)" placeholder="New note (summary)">
      <textarea class="wn-in" rows="2" [value]="details()" (input)="details.set($any($event.target).value)" placeholder="Details (optional)"></textarea>
      @if (addError()) { <p class="wn-err">{{ addError() }}</p> }
      <button class="wn-btn" [disabled]="adding() || !summary().trim()" (click)="add()">
        {{ adding() ? 'Adding…' : 'Add note' }}
      </button>
    </div>
  `,
  styles: [`
    .wn-msg { text-align: center; color: var(--secondary-text, #888); padding: 1rem; font-size: 0.9rem; }
    .wn-err { color: #e74c3c; font-size: 0.85rem; margin: 0.3rem 0; }
    .wn-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.9rem; }
    .wn-item { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.55rem 0.7rem; }
    .wn-top { display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem; }
    .wn-by { font-size: 0.78rem; font-weight: 700; color: var(--primary-text); }
    .wn-date { font-size: 0.72rem; color: var(--secondary-text, #888); }
    .wn-sum { font-size: 0.88rem; color: var(--primary-text); }
    .wn-det { font-size: 0.82rem; color: var(--secondary-text, #aaa); white-space: pre-wrap; margin-top: 0.15rem; }
    .wn-add { display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.7rem; }
    .wn-in { padding: 0.55rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem;
      background: var(--secondary-background); color: var(--primary-text); font-family: inherit; box-sizing: border-box; }
    .wn-btn { background: var(--accent-color, #2980b9); color: #fff; border: none; border-radius: 10px; padding: 0.7rem;
      font-size: 0.95rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .wn-btn:disabled { opacity: 0.55; cursor: default; }
  `]
})
export class MaximoWoNotesComponent implements OnInit {
  @Input({ required: true }) href!: string;

  private api = inject(MaximoApiService);

  loading = signal(true);
  notes = signal<MaximoWorklog[]>([]);
  error = signal<string | null>(null);

  summary = signal('');
  details = signal('');
  adding = signal(false);
  addError = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.listWoWorklog(this.href).subscribe({
      next: n => { this.notes.set(n); this.loading.set(false); },
      error: () => { this.error.set('Could not load notes — check your connection.'); this.loading.set(false); }
    });
  }

  add(): void {
    const s = this.summary().trim();
    if (!s || this.adding()) return;
    this.adding.set(true); this.addError.set(null);
    this.api.addWoWorklog(this.href, s, this.details().trim() || undefined).subscribe({
      next: list => { this.notes.set(list); this.summary.set(''); this.details.set(''); this.adding.set(false); },
      error: () => { this.addError.set('Could not add the note — check your connection.'); this.adding.set(false); }
    });
  }
}
