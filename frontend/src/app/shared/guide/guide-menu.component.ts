import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { GuideService } from '../../services/guide/guide.service';
import { Guide, GuideCategory, GuideId } from '../../services/guide/guide.model';

@Component({
  selector: 'app-guide-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  template: `
    <!-- Floating Helper Button -->
    <div class="guide-menu-container" [class.has-active]="hasActiveGuide()">
      <!-- Active Guide Indicator -->
      @if (hasActiveGuide()) {
        <div class="active-guide-bar" [class.paused]="isPaused()">
          <div class="active-guide-info">
            <mat-icon>{{ getActiveGuideIcon() }}</mat-icon>
            <span class="active-guide-name">{{ getActiveGuideName() }}</span>
            @if (isPaused()) {
              <span class="paused-label">(Paused)</span>
            }
          </div>
          <button
            mat-icon-button
            class="bar-btn"
            (click)="togglePause()"
            [matTooltip]="isPaused() ? 'Resume Guide' : 'Pause Guide'"
          >
            <mat-icon>{{ isPaused() ? 'play_arrow' : 'pause' }}</mat-icon>
          </button>
          <button
            mat-icon-button
            class="bar-btn stop-guide-btn"
            (click)="stopGuide()"
            matTooltip="Stop Guide"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }

      <!-- Main Helper Button -->
      <button
        mat-fab
        [matMenuTriggerFor]="guideMenu"
        class="guide-trigger-btn"
        [class.active]="hasActiveGuide() && !isPaused()"
        [class.paused]="hasActiveGuide() && isPaused()"
        matTooltip="Guides & Help"
      >
        <mat-icon>{{ hasActiveGuide() ? 'assistant' : 'help_outline' }}</mat-icon>
      </button>
    </div>

    <!-- Guide Menu -->
    <mat-menu #guideMenu="matMenu" class="guide-menu">
      <div class="guide-menu-header">
        <mat-icon>school</mat-icon>
        <span>Interactive Guides</span>
      </div>

      @for (category of categories; track category.id) {
        <div class="guide-category">
          <div class="category-header">{{ category.name }}</div>
          @for (guide of getGuidesByCategory(category.id); track guide.id) {
            <button
              mat-menu-item
              (click)="toggleGuide(guide.id)"
              [class.active]="isGuideActive(guide.id)"
            >
              <mat-icon>{{ guide.icon }}</mat-icon>
              <span>{{ guide.name }}</span>
              @if (isGuideActive(guide.id)) {
                <mat-icon class="active-icon">radio_button_checked</mat-icon>
              }
            </button>
          }
        </div>
      }

      <div class="guide-menu-footer">
        <button mat-menu-item (click)="resetAll()">
          <mat-icon>refresh</mat-icon>
          <span>Reset All Progress</span>
        </button>
      </div>
    </mat-menu>
  `,
  styles: [
    `
      .guide-menu-container {
        position: fixed;
        bottom: 100px;
        right: 24px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .guide-trigger-btn {
        background-color: var(--primary-color, #1976d2);
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }

      .guide-trigger-btn:hover {
        background-color: var(--primary-hover, #1565c0);
        transform: scale(1.05);
      }

      .guide-trigger-btn.active {
        background-color: var(--success-color, #4caf50);
        animation: pulse-button 2s infinite;
      }

      @keyframes pulse-button {
        0% {
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
        }
      }

      .active-guide-bar {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--surface-color, white);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 24px;
        padding: 4px 4px 4px 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .active-guide-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-primary, #333);
      }

      .active-guide-info mat-icon {
        color: var(--success-color, #4caf50);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .active-guide-name {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .bar-btn {
        width: 32px;
        height: 32px;
        line-height: 32px;
      }

      .bar-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .active-guide-bar.paused {
        opacity: 0.7;
      }

      .paused-label {
        font-size: 12px;
        color: var(--text-tertiary, #888);
        font-style: italic;
      }

      .guide-trigger-btn.paused {
        background-color: var(--text-tertiary, #888);
        animation: none;
      }

      .guide-menu-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .guide-menu-header mat-icon {
        color: var(--primary-color, #1976d2);
      }

      .guide-category {
        padding: 4px 0;
      }

      .category-header {
        padding: 8px 16px 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-tertiary, #888);
        letter-spacing: 0.5px;
      }

      button.active {
        background-color: var(--success-bg, rgba(76, 175, 80, 0.1));
      }

      .active-icon {
        margin-left: auto;
        color: var(--success-color, #4caf50);
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .guide-menu-footer {
        border-top: 1px solid var(--border-color, #e0e0e0);
        margin-top: 4px;
        padding-top: 4px;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .guide-menu-container {
          bottom: 16px;
          right: 16px;
        }

        .active-guide-bar {
          max-width: calc(100vw - 100px);
        }

        .active-guide-name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    `,
  ],
})
export class GuideMenuComponent implements OnInit {
  private guideService = inject(GuideService);

  categories = [
    { id: 'loto' as GuideCategory, name: 'LOTO' },
    { id: 'files' as GuideCategory, name: 'Files' },
    { id: 'equipment' as GuideCategory, name: 'Equipment' },
    { id: 'general' as GuideCategory, name: 'General' },
  ];

  availableGuides = signal<Guide[]>([]);

  hasActiveGuide = computed(() => this.guideService.activeGuide() !== null);
  isPaused = computed(() => this.guideService.isPaused());

  togglePause(): void {
    this.guideService.togglePause();
  }

  ngOnInit(): void {
    // Guides are now registered in GuideService constructor
    this.availableGuides.set(this.guideService.availableGuides());
  }

  getGuidesByCategory(category: GuideCategory): Guide[] {
    return this.availableGuides().filter((g) => g.category === category);
  }

  toggleGuide(guideId: GuideId): void {
    this.guideService.toggleGuide(guideId);
  }

  stopGuide(): void {
    this.guideService.stopGuide();
  }

  isGuideActive(guideId: GuideId): boolean {
    return this.guideService.activeGuide() === guideId;
  }

  getActiveGuideName(): string {
    const guideId = this.guideService.activeGuide();
    if (!guideId) return '';
    const guide = this.guideService.getGuide(guideId);
    return guide?.name ?? '';
  }

  getActiveGuideIcon(): string {
    const guideId = this.guideService.activeGuide();
    if (!guideId) return 'help';
    const guide = this.guideService.getGuide(guideId);
    return guide?.icon ?? 'help';
  }

  resetAll(): void {
    this.guideService.resetAllProgress();
  }
}
