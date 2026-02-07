import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FileService, TrashEntry, TrashStats } from '../../services/file.service';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.css']
})
export class TrashComponent implements OnInit {
  entries: TrashEntry[] = [];
  stats: TrashStats | null = null;
  loading = false;
  actionLoading: { [id: string]: boolean } = {};
  message: { text: string; type: 'success' | 'error' } | null = null;

  constructor(private fileService: FileService) {}

  ngOnInit(): void {
    this.loadTrash();
  }

  loadTrash(): void {
    this.loading = true;
    forkJoin([
      this.fileService.getTrash(),
      this.fileService.getTrashStats()
    ]).subscribe({
      next: ([entriesResponse, statsResponse]) => {
        this.entries = entriesResponse.responseData || [];
        this.stats = statsResponse.responseData || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load trash:', err);
        this.loading = false;
        this.showMessage('Failed to load trash', 'error');
      }
    });
  }

  restore(entry: TrashEntry): void {
    this.actionLoading[entry.id] = true;
    this.fileService.restoreFromTrash(entry.id).subscribe({
      next: (result) => {
        this.actionLoading[entry.id] = false;
        if (result.success) {
          this.showMessage(`Restored: ${entry.fileName}`, 'success');
          this.loadTrash();
        } else {
          this.showMessage(result.message || 'Failed to restore', 'error');
        }
      },
      error: (err) => {
        this.actionLoading[entry.id] = false;
        this.showMessage('Failed to restore file', 'error');
      }
    });
  }

  permanentlyDelete(entry: TrashEntry): void {
    if (!confirm(`Permanently delete "${entry.fileName}"? This cannot be undone.`)) {
      return;
    }

    this.actionLoading[entry.id] = true;
    this.fileService.permanentlyDeleteFromTrash(entry.id).subscribe({
      next: (result) => {
        this.actionLoading[entry.id] = false;
        if (result.success) {
          this.showMessage(`Permanently deleted: ${entry.fileName}`, 'success');
          this.loadTrash();
        } else {
          this.showMessage(result.message || 'Failed to delete', 'error');
        }
      },
      error: (err) => {
        this.actionLoading[entry.id] = false;
        this.showMessage('Failed to delete file', 'error');
      }
    });
  }

  emptyTrash(): void {
    if (this.entries.length === 0) {
      this.showMessage('Trash is already empty', 'error');
      return;
    }

    if (!confirm(`Permanently delete ALL ${this.entries.length} files in trash? This cannot be undone.`)) {
      return;
    }

    this.loading = true;
    this.fileService.emptyTrash().subscribe({
      next: (result) => {
        if (result.success) {
          this.showMessage(`Permanently deleted ${result.deletedCount} files`, 'success');
        }
        this.loadTrash();
      },
      error: (err) => {
        this.loading = false;
        this.showMessage('Failed to empty trash', 'error');
      }
    });
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  getDaysUntilDeletion(dateStr: string): number {
    if (!this.stats) return 0;
    const date = new Date(dateStr);
    const expiryDate = new Date(date.getTime() + this.stats.retentionDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  getSourceLabel(source: string): string {
    switch (source) {
      case 'user': return 'User deleted';
      case 'sync': return 'Sync cleanup';
      case 'cleanup': return 'Auto cleanup';
      default: return source;
    }
  }

  getSourceClass(source: string): string {
    switch (source) {
      case 'user': return 'source-user';
      case 'sync': return 'source-sync';
      case 'cleanup': return 'source-cleanup';
      default: return '';
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = { text, type };
    setTimeout(() => {
      this.message = null;
    }, 4000);
  }
}
