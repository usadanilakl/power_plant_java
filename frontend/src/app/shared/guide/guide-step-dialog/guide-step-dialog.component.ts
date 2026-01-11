import { Component, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ReactiveGuideService } from '../../../services/guide/reactive-guide.service';
import { GuideBranch, GuideHint } from '../../../services/guide/reactive-guide.model';

@Component({
  selector: 'app-guide-step-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CdkDrag,
    CdkDragHandle,
  ],
  template: `
    @if (isVisible()) {
      <div
        class="guide-step-dialog"
        [class.minimized]="isMinimized()"
        [class.choice-mode]="isChoiceStep()"
        cdkDrag
        cdkDragBoundary="body"
      >
        <!-- Header (Drag Handle) -->
        <div class="dialog-header" cdkDragHandle>
          <div class="header-left">
            @if (currentStep()?.icon) {
              <mat-icon class="step-icon">{{ currentStep()?.icon }}</mat-icon>
            }
            <span class="guide-name">{{ guideName() }}</span>
          </div>
          <div class="header-actions">
            <button
              mat-icon-button
              class="header-btn"
              (click)="toggleMinimize()"
              [matTooltip]="isMinimized() ? 'Expand' : 'Minimize'"
            >
              <mat-icon>{{ isMinimized() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <button
              mat-icon-button
              class="header-btn"
              (click)="togglePause()"
              [matTooltip]="isPaused() ? 'Resume' : 'Pause'"
            >
              <mat-icon>{{ isPaused() ? 'play_arrow' : 'pause' }}</mat-icon>
            </button>
            <button
              mat-icon-button
              class="header-btn close-btn"
              (click)="stopGuide()"
              matTooltip="Stop Guide"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        @if (!isMinimized()) {
          <!-- Progress Bar -->
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress()"></div>
          </div>

          <!-- Content -->
          <div class="dialog-content">
            <!-- Step Title -->
            <h3 class="step-title">{{ currentStep()?.title }}</h3>

            <!-- Step Message -->
            <p class="step-message">{{ currentStep()?.message }}</p>

            <!-- Branch Options (for choice steps) -->
            @if (isChoiceStep() && currentStep()?.branches) {
              <div class="branch-options">
                @for (branch of currentStep()?.branches; track branch.id) {
                  <button
                    class="branch-button"
                    (click)="selectBranch(branch)"
                  >
                    <div class="branch-content">
                      @if (branch.icon) {
                        <mat-icon class="branch-icon">{{ branch.icon }}</mat-icon>
                      }
                      <div class="branch-text">
                        <span class="branch-label">{{ branch.label }}</span>
                        @if (branch.description) {
                          <span class="branch-description">{{ branch.description }}</span>
                        }
                      </div>
                    </div>
                    <mat-icon class="branch-arrow">chevron_right</mat-icon>
                  </button>
                }
              </div>
            }

            <!-- Hints -->
            @if (currentHints().length > 0) {
              <div class="hints-section">
                @for (hint of currentHints(); track $index) {
                  <div class="hint">
                    <mat-icon class="hint-icon">{{ hint.icon || 'lightbulb' }}</mat-icon>
                    <span class="hint-text">{{ hint.message }}</span>
                  </div>
                }
              </div>
            }

            <!-- Completion Indicator -->
            @if (isStepComplete() && !isChoiceStep()) {
              <div class="completion-indicator">
                <mat-icon>check_circle</mat-icon>
                <span>Step completed! Moving to next...</span>
              </div>
            }
          </div>

          <!-- Footer Actions -->
          <div class="dialog-footer">
            <div class="footer-left">
              @if (canGoBack()) {
                <button
                  mat-button
                  class="footer-btn back-btn"
                  (click)="goBack()"
                >
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
              }
            </div>
            <div class="footer-right">
              @if (!isChoiceStep() && !currentStep()?.isFinal) {
                <button
                  mat-button
                  class="footer-btn skip-btn"
                  (click)="skipStep()"
                >
                  Skip
                  <mat-icon>skip_next</mat-icon>
                </button>
              }
              @if (currentStep()?.isFinal) {
                <button
                  mat-flat-button
                  class="footer-btn finish-btn"
                  color="primary"
                  (click)="completeGuide()"
                >
                  <mat-icon>done_all</mat-icon>
                  Finish
                </button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .guide-step-dialog {
      position: fixed;
      bottom: 180px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 48px);
      background: var(--surface-color, #ffffff);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .guide-step-dialog.minimized {
      width: auto;
      min-width: 200px;
    }

    .guide-step-dialog.choice-mode {
      width: 420px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 8px 12px 16px;
      background: var(--primary-color, #1976d2);
      color: white;
      cursor: move;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .guide-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .header-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
      color: rgba(255, 255, 255, 0.9);
    }

    .header-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .header-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .close-btn:hover {
      background: rgba(255, 0, 0, 0.2);
    }

    .progress-bar {
      height: 3px;
      background: var(--border-color, #e0e0e0);
    }

    .progress-fill {
      height: 100%;
      background: var(--success-color, #4caf50);
      transition: width 0.3s ease;
    }

    .dialog-content {
      padding: 16px;
    }

    .step-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .step-message {
      margin: 0 0 16px 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-secondary, #666);
    }

    .branch-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .branch-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--surface-alt, #f5f5f5);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .branch-button:hover {
      background: var(--primary-light, #e3f2fd);
      border-color: var(--primary-color, #1976d2);
    }

    .branch-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .branch-icon {
      color: var(--primary-color, #1976d2);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .branch-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .branch-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .branch-description {
      font-size: 12px;
      color: var(--text-tertiary, #888);
    }

    .branch-arrow {
      color: var(--text-tertiary, #888);
    }

    .branch-button:hover .branch-arrow {
      color: var(--primary-color, #1976d2);
    }

    .hints-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--warning-bg, #fff8e1);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .hint {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .hint-icon {
      color: var(--warning-color, #f9a825);
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .hint-text {
      font-size: 13px;
      color: var(--text-secondary, #666);
      line-height: 1.4;
    }

    .completion-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--success-bg, #e8f5e9);
      border-radius: 8px;
      color: var(--success-color, #4caf50);
      animation: pulse 1s ease infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .completion-indicator mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .completion-indicator span {
      font-size: 14px;
      font-weight: 500;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--border-color, #e0e0e0);
    }

    .footer-left,
    .footer-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .footer-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .back-btn {
      color: var(--text-secondary, #666);
    }

    .skip-btn {
      color: var(--text-tertiary, #888);
    }

    .finish-btn {
      background: var(--success-color, #4caf50);
    }

    /* Mobile responsiveness */
    @media (max-width: 480px) {
      .guide-step-dialog {
        bottom: 16px;
        right: 16px;
        left: 16px;
        width: auto;
        max-width: none;
      }

      .guide-step-dialog.choice-mode {
        width: auto;
      }
    }
  `],
})
export class GuideStepDialogComponent {
  private guideService = inject(ReactiveGuideService);

  isMinimized = signal(false);

  // Computed values from service
  isVisible = computed(() => this.guideService.isGuideActive());
  isPaused = computed(() => this.guideService.isPaused());
  currentStep = computed(() => this.guideService.currentStep());
  progress = computed(() => this.guideService.progressPercentage());

  guideName = computed(() => {
    const guide = this.guideService.currentGuide();
    return guide?.name ?? 'Guide';
  });

  isChoiceStep = computed(() => {
    const step = this.currentStep();
    return step?.type === 'choice';
  });

  isStepComplete = computed(() => this.guideService.isCurrentStepComplete());

  canGoBack = computed(() => {
    const state = this.guideService.guideState();
    return state && state.stepHistory.length > 0;
  });

  currentHints = computed(() => {
    const step = this.currentStep();
    if (!step?.hints) return [];

    const isComplete = this.isStepComplete();
    return step.hints.filter(hint => {
      if (hint.showWhen === 'after') return isComplete;
      if (hint.showWhen === 'during') return !isComplete;
      return true; // Show if no showWhen specified
    });
  });

  toggleMinimize(): void {
    this.isMinimized.update(v => !v);
  }

  togglePause(): void {
    this.guideService.togglePause();
  }

  stopGuide(): void {
    if (confirm('Are you sure you want to stop this guide?')) {
      this.guideService.stopGuide();
    }
  }

  selectBranch(branch: GuideBranch): void {
    this.guideService.selectBranch(branch);
  }

  goBack(): void {
    this.guideService.goBack();
  }

  skipStep(): void {
    this.guideService.skipStep();
  }

  completeGuide(): void {
    this.guideService.completeGuide();
  }

  // Keyboard shortcuts
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isVisible() && !this.isMinimized()) {
      this.toggleMinimize();
    }
  }
}
