import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';

interface AvailableBox {
  id: number;
  number: number;
  setSize?: number | null;
}

/**
 * Change-box dialog. Lets a Control Authority move a LOTO to a different lock
 * box, atomically detaching the current one (releases old locks, repaints old
 * box to Closed), linking the new one, auto-assigning locks against the new
 * box, and repainting the new box in the LOTO's current status colour.
 *
 * <p>Fills the gap where the LOTO form had no way to correct an auto-assigned
 * box — operators previously had to hand-edit the box_number scalar, which
 * left the old {@code loto_box.loto} FK pointing at the LOTO and both boxes
 * lit at once.
 */
@Component({
  selector: 'app-change-box-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="scrim" (click)="onCancel()"></div>
  <div class="modal" role="dialog" aria-modal="true">
    <header>
      <h2>Change Lock Box</h2>
      <p class="hint">
        Move LOTO <b>#{{ lotoId }}</b> from box
        <b>{{ currentBoxNumber ?? '—' }}</b> to a new box. Locks + LED colour
        move with the LOTO. Control Authority only.
      </p>
    </header>
    <div class="body">
      <label>
        Available boxes
        <select [(ngModel)]="selectedBoxNumber" [disabled]="loading()">
          <option [ngValue]="null">— pick a box —</option>
          <option *ngFor="let b of available()"
                  [ngValue]="b.number">
            #{{ b.number }}<span *ngIf="b.setSize">
              — set of {{ b.setSize }}</span>
          </option>
        </select>
      </label>
      <p class="mini muted" *ngIf="loading()">Loading available boxes…</p>
      <p class="mini muted" *ngIf="!loading() && available().length === 0">
        No boxes are currently available. Close a LOTO first.
      </p>
      <div *ngIf="error()" class="err">{{ error() }}</div>
    </div>
    <footer>
      <button class="btn" (click)="onCancel()" [disabled]="submitting()">Cancel</button>
      <button class="btn primary" (click)="onSubmit()"
              [disabled]="submitting() || selectedBoxNumber == null">
        {{ submitting() ? 'Moving…' : 'Move to box ' + (selectedBoxNumber ?? '?') }}
      </button>
    </footer>
  </div>
  `,
  styles: [`
    .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 9998; }
    .modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 9999; background: #1e1e1e; color: #eee;
      border: 1px solid #444; border-radius: 8px;
      width: min(480px, 95vw); max-height: 90vh; overflow: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    header { padding: 14px 18px; border-bottom: 1px solid #333; }
    header h2 { margin: 0 0 4px; font-size: 1.1rem; }
    .hint { margin: 0; color: #aaa; font-size: 0.85rem; }
    .body { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: #ccc; }
    select {
      background: #2a2a2a; color: #eee; border: 1px solid #444;
      padding: 5px 8px; border-radius: 4px; font: inherit;
    }
    .mini { font-size: 0.8rem; }
    .muted { color: #888; }
    .err { color: #f6a6a6; font-size: 0.85rem; }
    footer {
      padding: 12px 18px; border-top: 1px solid #333;
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn {
      padding: 6px 14px; border: 1px solid #4a4a4a; background: #2a2a2a;
      color: #eee; border-radius: 4px; cursor: pointer;
    }
    .btn:hover { background: #3a3a3a; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn.primary { background: #2f5aa8; border-color: #3a70cc; }
    .btn.primary:hover:not(:disabled) { background: #3a70cc; }
  `]
})
export class ChangeBoxDialogComponent implements OnInit {
  private http = inject(HttpClient);

  @Input({ required: true }) lotoId!: number;
  @Input() currentBoxNumber?: number | null;

  /** Emits {@code true} if the box was successfully changed. */
  @Output() closed = new EventEmitter<boolean>();

  readonly available = signal<AvailableBox[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  selectedBoxNumber: number | null = null;

  ngOnInit(): void {
    this.http.get<SpringApiResponse<AvailableBox[]>>(`${environment.apiUrl}/loto-boxes/available`)
      .subscribe({
        next: (res) => {
          this.available.set(res.responseData ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? err?.message ?? 'Could not load available boxes');
        }
      });
  }

  onCancel() { this.closed.emit(false); }

  onSubmit() {
    if (this.selectedBoxNumber == null) return;
    this.submitting.set(true);
    this.error.set(null);
    this.http.put<SpringApiResponse<unknown>>(
      `${environment.apiUrl}/lotos/${this.lotoId}/change-box`,
      { boxNumber: this.selectedBoxNumber }
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closed.emit(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set((err?.error?.message ?? err?.message ?? 'Change failed').toString());
      }
    });
  }
}
