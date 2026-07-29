import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NewsService } from '../../services/news.service';
import { FeedItem, FeedCategory } from '../../services/electron.service';

interface CategoryMeta { icon: string; color: string; label: string; }

/**
 * Updates / News — a merged, newest-first feed of recent plant activity (work requests, plant
 * conversations, schedule changes, PJM day-ahead). Opening the page clears the unread badge but
 * still highlights the items that were new on entry. Cards deep-link into the relevant surface.
 */
@Component({
  selector: 'app-updates',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="updates">
      <header class="hd">
        <div class="title">
          <span class="material-icons">campaign</span>
          <h1>Updates</h1>
          <span class="badge" *ngIf="unread() > 0">{{ unread() }} new</span>
        </div>
        <button class="refresh" (click)="refresh()" [disabled]="refreshing" title="Refresh">
          <span class="material-icons" [class.spin]="refreshing">refresh</span>
        </button>
      </header>

      <div class="list" *ngIf="news.items().length; else empty">
        <button
          *ngFor="let item of news.items()"
          class="card"
          [class.new]="isNew(item)"
          [class.link]="linkable(item)"
          (click)="open(item)">
          <span class="chip" [style.background]="meta(item.category).color">
            <span class="material-icons">{{ meta(item.category).icon }}</span>
          </span>
          <span class="body">
            <span class="row1">
              <span class="cat">{{ meta(item.category).label }}</span>
              <span class="dot" *ngIf="item.changeType">·</span>
              <span class="ct" *ngIf="item.changeType">{{ item.changeType === 'NEW' ? 'New' : 'Updated' }}</span>
              <span class="new-dot" *ngIf="isNew(item)" title="New since you last looked"></span>
            </span>
            <span class="ttl" [class.warn]="item.severity === 'warning'">{{ item.title }}</span>
            <span class="sub" *ngIf="item.summary">{{ item.summary }}</span>
            <span class="meta">
              <span *ngIf="item.actor">{{ item.actor }}</span>
              <span class="sep" *ngIf="item.actor">•</span>
              <span>{{ ago(item.timestamp) }}</span>
            </span>
          </span>
          <span class="go material-icons" *ngIf="linkable(item)">chevron_right</span>
        </button>
      </div>

      <ng-template #empty>
        <div class="empty">
          <span class="material-icons">inbox</span>
          <p>No recent updates.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display:block; height:100%; overflow:auto; }
    .updates { max-width: 860px; margin: 0 auto; padding: 16px; }
    .hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .title { display:flex; align-items:center; gap:8px; }
    .title h1 { font-size:20px; margin:0; font-weight:600; }
    .title .material-icons { color:#f59e0b; }
    .badge { background:#ef4444; color:#fff; font-size:12px; font-weight:600; padding:2px 8px; border-radius:10px; }
    .refresh { background:transparent; border:1px solid var(--border,#3a3a44); border-radius:8px; padding:6px; cursor:pointer; color:inherit; }
    .refresh:disabled { opacity:.5; cursor:default; }
    .refresh .material-icons { display:block; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .list { display:flex; flex-direction:column; gap:8px; }
    .card {
      display:flex; align-items:flex-start; gap:12px; width:100%; text-align:left;
      background: var(--card, rgba(255,255,255,0.03)); border:1px solid var(--border,#2c2c34);
      border-radius:10px; padding:12px; cursor:default; color:inherit; font:inherit;
      transition: background .15s, border-color .15s;
    }
    .card.link { cursor:pointer; }
    .card.link:hover { background: rgba(255,255,255,0.06); border-color:#4a4a55; }
    .card.new { border-left:3px solid #ef4444; }

    .chip { flex:0 0 auto; width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .chip .material-icons { color:#fff; font-size:20px; }

    .body { display:flex; flex-direction:column; gap:2px; min-width:0; flex:1; }
    .row1 { display:flex; align-items:center; gap:6px; font-size:11px; text-transform:uppercase; letter-spacing:.04em; opacity:.7; }
    .row1 .cat { font-weight:700; }
    .new-dot { width:7px; height:7px; border-radius:50%; background:#ef4444; margin-left:2px; }
    .ttl { font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ttl.warn { color:#f59e0b; }
    .sub { font-size:13px; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .meta { font-size:12px; opacity:.6; display:flex; gap:6px; margin-top:2px; }

    .go { align-self:center; opacity:.5; }
    .empty { text-align:center; opacity:.6; padding:48px 0; }
    .empty .material-icons { font-size:40px; display:block; margin-bottom:8px; }
  `]
})
export class UpdatesComponent implements OnInit {

  private newIds = new Set<string>();
  refreshing = false;

  private readonly categoryMeta: Record<FeedCategory, CategoryMeta> = {
    WORK_REQUEST: { icon: 'assignment',   color: '#3b82f6', label: 'Work Request' },
    CONVERSATION: { icon: 'forum',        color: '#8b5cf6', label: 'Conversation' },
    SCHEDULE:     { icon: 'event',        color: '#10b981', label: 'Schedule' },
    PJM:          { icon: 'bolt',         color: '#f59e0b', label: 'PJM Day-Ahead' },
    CORK_BOARD:   { icon: 'push_pin',     color: '#38bdf8', label: 'Cork-Board' },
  };

  constructor(public news: NewsService, private router: Router) {}

  ngOnInit(): void {
    // Snapshot what's unread on entry (to highlight), then clear the badge.
    this.newIds = new Set(this.news.items().filter(i => this.news.isUnread(i)).map(i => i.id));
    this.news.markAllSeen();
  }

  unread(): number { return this.newIds.size; }

  isNew(item: FeedItem): boolean { return this.newIds.has(item.id); }

  meta(cat: FeedCategory): CategoryMeta { return this.categoryMeta[cat]; }

  async refresh(): Promise<void> {
    this.refreshing = true;
    try { await this.news.refresh(); } finally { this.refreshing = false; }
  }

  linkable(item: FeedItem): boolean { return !!this.linkFor(item); }

  open(item: FeedItem): void {
    const t = this.linkFor(item);
    if (!t) return;
    if (t.route) this.router.navigate([t.route]);
    else if (t.app) this.router.navigate(['/pid-app'], { queryParams: { path: t.app } });
  }

  /** Deep-link target per category. SCHEDULE has no standalone page → informational only. */
  private linkFor(item: FeedItem): { route?: string; app?: string } | null {
    switch (item.category) {
      case 'WORK_REQUEST': return { app: 'permit-builder/work-requests' };
      case 'CONVERSATION': return { app: 'plant-chat' };
      case 'PJM':          return { route: '/pjm' };
      case 'CORK_BOARD':   return { route: '/cork-board' };
      default:             return null;
    }
  }

  ago(iso: string): string {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(t).toLocaleDateString();
  }
}
