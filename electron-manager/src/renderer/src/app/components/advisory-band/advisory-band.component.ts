import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorkBoardActionCardComponent } from '../cork-board-action-card/cork-board-action-card.component';
import { CorkBoardAction, ElectronService } from '../../services/electron.service';

const COLLAPSE_KEY = 'advisoryBandCollapsed';
const ACTIONS_REFRESH_MS = 120_000; // cork-board actions are SharePoint-backed and change slowly

/**
 * Cork-board action-items bar. Mounts in the app shell (outside <router-outlet>) so it shows on
 * every page; a flex-shrink:0 sibling in the column-flow shell, so it displaces content downward
 * instead of covering it. Renders ONLY when there are active action items (episodic, attention-
 * demanding). Ambient weather + day-ahead status live in the header (HeaderStatusComponent).
 * Collapsible; collapse state persists in localStorage. Uses the shared cork-board action card
 * for inline respond.
 */
@Component({
  selector: 'app-advisory-band',
  standalone: true,
  imports: [CommonModule, CorkBoardActionCardComponent],
  template: `
    <div class="action-band" *ngIf="actions.length" [class.collapsed]="collapsed">
      <div class="band-head" (click)="toggleCollapse()">
        <span class="band-title">
          <span class="material-icons">add_task</span>
          Action Items
          <span class="count">{{ actions.length }}</span>
        </span>
        <span class="head-hint" *ngIf="collapsed && actions[0]">{{ actions[0].title }}</span>
        <button class="collapse-btn" [attr.aria-label]="collapsed ? 'Expand' : 'Collapse'">
          <span class="material-icons">{{ collapsed ? 'expand_more' : 'expand_less' }}</span>
        </button>
      </div>

      <div class="band-body" *ngIf="!collapsed">
        <app-cork-board-action-card
          *ngFor="let action of actions; trackBy: trackByActionId"
          [action]="action"
          (changed)="loadActions()"
        ></app-cork-board-action-card>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; flex-shrink: 0; }

    .action-band {
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      border-left: 3px solid var(--accent-primary);
    }

    .band-head {
      display: flex; align-items: center; gap: 12px;
      padding: 6px 14px; cursor: pointer; user-select: none;
    }
    .band-title {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; color: var(--accent-primary);
      text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0;
    }
    .band-title .material-icons { font-size: 16px; }
    .count {
      font-size: 11px; font-weight: 700; color: #fff;
      background: var(--accent-primary); border-radius: 999px;
      padding: 0 7px; min-width: 18px; text-align: center;
    }
    .head-hint {
      flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: 12px; color: var(--text-secondary);
    }
    .collapse-btn {
      margin-left: auto; background: none; border: none; color: var(--text-muted); cursor: pointer;
      display: inline-flex; align-items: center; padding: 2px; flex-shrink: 0;
    }
    .collapse-btn .material-icons { font-size: 20px; }

    .band-body {
      padding: 4px 14px 12px;
      max-height: 42vh; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
    }
  `],
})
export class AdvisoryBandComponent implements OnInit, OnDestroy {
  actions: CorkBoardAction[] = [];
  collapsed = false;

  private actionsTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private electron: ElectronService) {
    try { this.collapsed = localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { /* ignore */ }
  }

  ngOnInit(): void {
    this.loadActions();
    this.actionsTimer = setInterval(() => this.loadActions(), ACTIONS_REFRESH_MS);
  }

  ngOnDestroy(): void {
    if (this.actionsTimer) clearInterval(this.actionsTimer);
  }

  async loadActions(): Promise<void> {
    try {
      const res = await this.electron.corkBoardListActions();
      if (res.success && res.data) this.actions = res.data;
    } catch { /* leave prior list on transient failure */ }
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    try { localStorage.setItem(COLLAPSE_KEY, this.collapsed ? '1' : '0'); } catch { /* ignore */ }
  }

  trackByActionId(_i: number, action: CorkBoardAction): string {
    return action.id;
  }
}
