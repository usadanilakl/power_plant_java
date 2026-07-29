import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NewsService } from '../../../services/news.service';
import { FeedItem, FeedCategory } from '../../../services/electron.service';

/**
 * Home-dashboard card for the Updates/News feed. Shows the newest few items + an unread count;
 * clicking anywhere (outside edit mode) opens the full /updates page. Data comes from the shared
 * {@link NewsService} singleton, so no fetching happens here.
 */
@Component({
  selector: 'app-updates-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card" (click)="navigateToPage($event)">
      <div class="widget-header">
        <div class="header-left">
          <span class="material-icons widget-icon">campaign</span>
          <h3>Updates</h3>
          <span class="unread" *ngIf="news.unreadCount() > 0">{{ news.unreadCount() }} new</span>
        </div>
      </div>

      <div class="list" *ngIf="top().length; else empty">
        <div class="row" *ngFor="let item of top()">
          <span class="cdot" [style.background]="color(item.category)"></span>
          <span class="rttl" [title]="item.title">{{ item.title }}</span>
          <span class="rtime">{{ ago(item.timestamp) }}</span>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-hint">No recent updates</div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .widget-card {
      display: flex; flex-direction: column; gap: 10px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow: hidden; cursor: pointer;
    }
    .widget-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }

    .widget-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .header-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .widget-icon { font-size: 22px; color: #f59e0b; }
    .widget-header h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .unread {
      font-size: 11px; font-weight: 700; color: #fff; background: #ef4444;
      padding: 1px 7px; border-radius: 999px;
    }

    .list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .cdot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; }
    .rttl {
      flex: 1; min-width: 0; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .rtime { flex: 0 0 auto; color: var(--text-muted); font-size: 11px; }
    .empty-hint { font-size: 11px; color: var(--text-muted); }
  `]
})
export class UpdatesWidgetComponent {
  @Input() cols = 1;
  @Input() rows = 1;
  @Input() editMode = false;

  private readonly colors: Record<FeedCategory, string> = {
    WORK_REQUEST: '#3b82f6',
    CONVERSATION: '#8b5cf6',
    SCHEDULE: '#10b981',
    PJM: '#f59e0b',
    CORK_BOARD: '#38bdf8',
  };

  constructor(public news: NewsService, private router: Router) {}

  /** Newest items, capped to what fits a 1×2 card. */
  top(): FeedItem[] {
    const max = this.rows >= 2 ? 6 : 3;
    return this.news.items().slice(0, max);
  }

  color(cat: FeedCategory): string { return this.colors[cat]; }

  navigateToPage(event: Event): void {
    if (this.editMode) return;
    if ((event.target as HTMLElement).closest('button')) return;
    this.router.navigate(['/updates']);
  }

  ago(iso: string): string {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }
}
