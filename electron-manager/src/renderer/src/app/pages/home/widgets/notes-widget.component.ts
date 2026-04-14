import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NoteItem {
  id: number;
  text: string;
  createdAt: number;
}

const NOTES_STORAGE_KEY = 'dk-widget-notes';

@Component({
  selector: 'app-notes-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="widget-card" [class.compact]="cols === 1 && rows === 1">
      <div class="widget-header">
        <span class="material-icons widget-icon" style="color: #f59e0b">sticky_note_2</span>
        <h3>Notes</h3>
        <span class="note-count" *ngIf="notes.length > 1">({{ currentIndex + 1 }}/{{ notes.length }})</span>
        <div class="header-actions" *ngIf="!editMode">
          <button class="icon-btn" (click)="addNote()" title="Add note">
            <span class="material-icons">add</span>
          </button>
        </div>
      </div>

      <!-- Compact: show first note preview -->
      <div class="note-preview" *ngIf="cols === 1 && rows === 1 && notes.length > 0">
        <span class="preview-text">{{ notes[currentIndex].text || 'Empty note' }}</span>
      </div>
      <div class="note-preview empty" *ngIf="cols === 1 && rows === 1 && notes.length === 0">
        <span class="preview-text">Click + to add a note</span>
      </div>

      <!-- Expanded: full editor -->
      <div class="notes-body" *ngIf="cols >= 2 || rows >= 2">
        <!-- Navigation tabs -->
        <div class="note-tabs" *ngIf="notes.length > 1">
          <button class="tab-btn" *ngFor="let note of notes; let i = index"
                  [class.active]="i === currentIndex"
                  (click)="currentIndex = i">
            {{ i + 1 }}
          </button>
        </div>

        <!-- Current note editor -->
        <div class="note-editor" *ngIf="notes.length > 0">
          <textarea class="note-textarea"
                    [(ngModel)]="notes[currentIndex].text"
                    (ngModelChange)="saveNotes()"
                    placeholder="Type your note here..."
                    [readonly]="editMode"></textarea>
          <div class="note-footer">
            <span class="note-date">{{ formatDate(notes[currentIndex].createdAt) }}</span>
            <button class="delete-note-btn" (click)="deleteNote(currentIndex)" *ngIf="!editMode && notes.length > 0">
              <span class="material-icons">delete_outline</span>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="notes.length === 0">
          <span class="material-icons empty-icon">sticky_note_2</span>
          <span>No notes yet</span>
          <button class="add-first-btn" (click)="addNote()" *ngIf="!editMode">Add Note</button>
        </div>
      </div>

      <!-- Compact navigation -->
      <div class="compact-nav" *ngIf="cols === 1 && rows === 1 && notes.length > 1 && !editMode">
        <button class="nav-btn" (click)="prevNote()" [disabled]="currentIndex === 0">
          <span class="material-icons">chevron_left</span>
        </button>
        <button class="nav-btn" (click)="nextNote()" [disabled]="currentIndex === notes.length - 1">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow: hidden;
    }
    .widget-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    :host { display: block; height: 100%; }
    .widget-header { display: flex; align-items: center; gap: 8px; }
    .widget-icon { font-size: 22px; }
    .widget-header h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .note-count { font-size: 11px; color: var(--text-muted); }
    .header-actions { margin-left: auto; }
    .icon-btn {
      background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0;
    }
    .icon-btn:hover { color: var(--accent-primary); }
    .icon-btn .material-icons { font-size: 18px; }

    .note-preview { margin-top: 4px; }
    .preview-text {
      font-size: 12px; color: var(--text-secondary);
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
      white-space: pre-wrap; word-break: break-word;
    }
    .note-preview.empty .preview-text { color: var(--text-muted); font-style: italic; }

    .notes-body { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }

    .note-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .tab-btn {
      width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border-color);
      background: var(--bg-secondary); color: var(--text-muted); font-size: 11px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .tab-btn.active { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
    .tab-btn:hover:not(.active) { border-color: var(--text-muted); }

    .note-editor { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .note-textarea {
      flex: 1; min-height: 60px; resize: none;
      background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px;
      color: var(--text-primary); padding: 10px; font-size: 13px; font-family: inherit;
      line-height: 1.5; outline: none;
    }
    .note-textarea:focus { border-color: var(--accent-primary); }
    .note-textarea[readonly] { opacity: 0.6; }
    .note-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .note-date { font-size: 10px; color: var(--text-muted); }
    .delete-note-btn {
      background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0;
    }
    .delete-note-btn:hover { color: var(--accent-error); }
    .delete-note-btn .material-icons { font-size: 16px; }

    .empty-state {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; color: var(--text-muted); font-size: 13px;
    }
    .empty-icon { font-size: 32px; opacity: 0.3; }
    .add-first-btn {
      background: var(--accent-primary); color: #fff; border: none; border-radius: 6px;
      padding: 6px 14px; font-size: 12px; cursor: pointer;
    }

    .compact-nav { display: flex; justify-content: center; gap: 4px; }
    .nav-btn {
      background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0;
    }
    .nav-btn:hover:not(:disabled) { color: var(--text-primary); }
    .nav-btn:disabled { opacity: 0.3; cursor: default; }
    .nav-btn .material-icons { font-size: 18px; }
  `]
})
export class NotesWidgetComponent implements OnInit {
  @Input() cols = 1;
  @Input() rows = 1;
  @Input() editMode = false;

  notes: NoteItem[] = [];
  currentIndex = 0;
  private nextId = 1;

  ngOnInit(): void {
    this.loadNotes();
  }

  addNote(): void {
    const note: NoteItem = { id: this.nextId++, text: '', createdAt: Date.now() };
    this.notes.push(note);
    this.currentIndex = this.notes.length - 1;
    this.saveNotes();
  }

  deleteNote(index: number): void {
    this.notes.splice(index, 1);
    if (this.currentIndex >= this.notes.length) {
      this.currentIndex = Math.max(0, this.notes.length - 1);
    }
    this.saveNotes();
  }

  prevNote(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextNote(): void {
    if (this.currentIndex < this.notes.length - 1) this.currentIndex++;
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  saveNotes(): void {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(this.notes));
  }

  private loadNotes(): void {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!raw) return;
      this.notes = JSON.parse(raw);
      this.nextId = this.notes.length > 0 ? Math.max(...this.notes.map(n => n.id)) + 1 : 1;
    } catch {}
  }
}
