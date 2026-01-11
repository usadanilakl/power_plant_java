import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ContextualGuideService } from '../../../services/guide/contextual-guide.service';
import {
  ContextualAction,
  ActionGroup,
  GuideSection,
  GuideSubsection,
} from '../../../services/guide/contextual-guide.model';

@Component({
  selector: 'app-contextual-guide-panel',
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
    <!-- Toggle Button (always visible, draggable) -->
    <div class="toggle-container" cdkDrag>
      <button
        class="guide-toggle-btn"
        [class.active]="isEnabled()"
        (click)="toggleGuide()"
        [matTooltip]="isEnabled() ? 'Disable Smart Helper' : 'Enable Smart Helper'"
        cdkDragHandle
      >
        <mat-icon>{{ isEnabled() ? 'assistant' : 'help_outline' }}</mat-icon>
      </button>
    </div>

    <!-- Contextual Panel (shown when enabled) -->
    @if (isEnabled()) {
      <div
        class="contextual-panel"
        [class.minimized]="!isExpanded()"
        cdkDrag
      >
        <!-- Header -->
        <div class="panel-header" cdkDragHandle>
          <div class="header-left">
            <mat-icon class="page-icon">{{ pageIcon() }}</mat-icon>
            <span class="page-name">{{ pageName() }}</span>
          </div>
          <div class="header-actions">
            <button
              mat-icon-button
              class="header-btn"
              (click)="toggleExpanded()"
              [matTooltip]="isExpanded() ? 'Minimize' : 'Expand'"
            >
              <mat-icon>{{ isExpanded() ? 'expand_more' : 'expand_less' }}</mat-icon>
            </button>
            <button
              mat-icon-button
              class="header-btn close-btn"
              (click)="toggleGuide()"
              matTooltip="Disable Helper"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        @if (isExpanded()) {
          <!-- Content -->
          <div class="panel-content">
            <!-- New Section-based UI -->
            @if (useSections()) {
              @if (sections().length === 0) {
                <div class="no-actions">
                  <mat-icon>info</mat-icon>
                  <span>No suggestions for current context</span>
                </div>
              } @else {
                @for (section of sections(); track section.id) {
                  <div class="guide-section">
                    <!-- Section Header (collapsible) -->
                    <button
                      class="section-header"
                      [class.expanded]="isSectionExpanded(section.id)"
                      (click)="toggleSection(section.id)"
                    >
                      <mat-icon class="section-icon">{{ section.icon }}</mat-icon>
                      <span class="section-title">{{ section.title }}</span>
                      <mat-icon class="section-chevron">
                        {{ isSectionExpanded(section.id) ? 'expand_less' : 'expand_more' }}
                      </mat-icon>
                    </button>

                    <!-- Section Content (shown when expanded) -->
                    @if (isSectionExpanded(section.id)) {
                      <div class="section-content">
                        <!-- Subsections -->
                        @if (getSubsections(section).length > 0) {
                          @for (subsection of getSubsections(section); track subsection.id) {
                            <div class="guide-subsection">
                              <!-- Subsection Header -->
                              <button
                                class="subsection-header"
                                [class.expanded]="isSubsectionExpanded(subsection.id)"
                                (click)="toggleSubsection(subsection.id)"
                              >
                                <mat-icon class="subsection-icon">{{ subsection.icon }}</mat-icon>
                                <span class="subsection-title">{{ subsection.title }}</span>
                                <mat-icon class="subsection-chevron">
                                  {{ isSubsectionExpanded(subsection.id) ? 'expand_less' : 'expand_more' }}
                                </mat-icon>
                              </button>

                              <!-- Subsection Actions -->
                              @if (isSubsectionExpanded(subsection.id)) {
                                <div class="subsection-actions">
                                  @for (action of getSubsectionActions(subsection); track action.id) {
                                    <button
                                      class="action-button"
                                      [class.selected]="selectedActionId() === action.id"
                                      [class.has-execute]="!!action.execute"
                                      (mouseenter)="selectAction(action.id)"
                                      (mouseleave)="clearSelection()"
                                      (click)="executeAction(action)"
                                    >
                                      <mat-icon class="action-icon">{{ action.icon }}</mat-icon>
                                      <div class="action-text">
                                        <span class="action-label">{{ action.label }}</span>
                                        <span class="action-description">{{ action.description }}</span>
                                      </div>
                                      @if (action.execute) {
                                        <mat-icon class="action-arrow">chevron_right</mat-icon>
                                      }
                                    </button>
                                  }
                                </div>
                              }
                            </div>
                          }
                        } @else {
                          <!-- Direct Actions (no subsections) -->
                          <div class="section-actions">
                            @for (action of getSectionActions(section); track action.id) {
                              <button
                                class="action-button"
                                [class.selected]="selectedActionId() === action.id"
                                [class.has-execute]="!!action.execute"
                                (mouseenter)="selectAction(action.id)"
                                (mouseleave)="clearSelection()"
                                (click)="executeAction(action)"
                              >
                                <mat-icon class="action-icon">{{ action.icon }}</mat-icon>
                                <div class="action-text">
                                  <span class="action-label">{{ action.label }}</span>
                                  <span class="action-description">{{ action.description }}</span>
                                </div>
                                @if (action.execute) {
                                  <mat-icon class="action-arrow">chevron_right</mat-icon>
                                }
                              </button>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              }
            } @else {
              <!-- Legacy ActionGroup-based UI -->
              @if (actionGroups().length === 0) {
                <div class="no-actions">
                  <mat-icon>info</mat-icon>
                  <span>No suggestions for current context</span>
                </div>
              } @else {
                @for (group of actionGroups(); track group.id) {
                  <div class="action-group">
                    <div class="group-header">
                      <mat-icon class="group-icon">{{ group.icon }}</mat-icon>
                      <span class="group-title">{{ group.title }}</span>
                    </div>
                    <div class="group-actions">
                      @for (action of getGroupActions(group); track action.id) {
                        <button
                          class="action-button"
                          [class.selected]="selectedActionId() === action.id"
                          [class.has-execute]="!!action.execute"
                          (mouseenter)="selectAction(action.id)"
                          (mouseleave)="clearSelection()"
                          (click)="executeAction(action)"
                        >
                          <mat-icon class="action-icon">{{ action.icon }}</mat-icon>
                          <div class="action-text">
                            <span class="action-label">{{ action.label }}</span>
                            <span class="action-description">{{ action.description }}</span>
                          </div>
                          @if (action.execute) {
                            <mat-icon class="action-arrow">chevron_right</mat-icon>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            }
          </div>

          <!-- Hint (shown when action is selected) -->
          @if (currentHint()) {
            <div class="hint-bar">
              <mat-icon>lightbulb</mat-icon>
              <span>{{ currentHint() }}</span>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .toggle-container {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 10001;
    }

    .guide-toggle-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: var(--primary-color, #1976d2);
      color: white;
      cursor: grab;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: background 0.3s ease, transform 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .guide-toggle-btn:hover {
      background: var(--primary-hover, #1565c0);
      transform: scale(1.05);
    }

    .guide-toggle-btn:active {
      cursor: grabbing;
    }

    .guide-toggle-btn.active {
      background: var(--success-color, #4caf50);
      animation: pulse-glow 2s infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); }
      50% { box-shadow: 0 4px 20px rgba(76, 175, 80, 0.6); }
    }

    .guide-toggle-btn mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .contextual-panel {
      position: fixed;
      top: 100px;
      left: 24px;
      width: 340px;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 150px);
      background: var(--surface-color, #ffffff);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      animation: slideIn 0.3s ease;
      display: flex;
      flex-direction: column;
      z-index: 10001;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .contextual-panel.minimized {
      width: auto;
      min-width: 180px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 8px 10px 14px;
      background: var(--primary-color, #1976d2);
      color: white;
      cursor: grab;
    }

    .panel-header:active {
      cursor: grabbing;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .page-name {
      font-size: 14px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .header-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
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

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    .no-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: var(--text-tertiary, #888);
      font-size: 13px;
    }

    .no-actions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ========== Section Styles ========== */

    .guide-section {
      border-bottom: 1px solid var(--border-light, #f0f0f0);
    }

    .guide-section:last-child {
      border-bottom: none;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 14px;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .section-header:hover {
      background: var(--hover-bg, #f5f5f5);
    }

    .section-header.expanded {
      background: var(--primary-light, #e3f2fd);
    }

    .section-icon {
      color: var(--primary-color, #1976d2);
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .section-title {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .section-chevron {
      color: var(--text-tertiary, #888);
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .section-content {
      padding: 0 0 8px 0;
      animation: expandIn 0.2s ease;
    }

    @keyframes expandIn {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 500px;
      }
    }

    /* ========== Subsection Styles ========== */

    .guide-subsection {
      margin-left: 12px;
      border-left: 2px solid var(--border-light, #e0e0e0);
    }

    .subsection-header {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .subsection-header:hover {
      background: var(--hover-bg, #fafafa);
    }

    .subsection-header.expanded {
      background: var(--primary-extra-light, #f3f9ff);
    }

    .subsection-icon {
      color: var(--text-secondary, #666);
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .subsection-title {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #555);
    }

    .subsection-chevron {
      color: var(--text-tertiary, #aaa);
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .subsection-actions {
      padding: 4px 0 4px 16px;
    }

    .section-actions {
      padding: 4px 0 4px 8px;
    }

    /* ========== Legacy Action Group Styles ========== */

    .action-group {
      margin-bottom: 4px;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--primary-color, #1976d2);
      letter-spacing: 0.5px;
    }

    .group-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .group-actions {
      display: flex;
      flex-direction: column;
    }

    /* ========== Action Button Styles ========== */

    .action-button {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      width: 100%;
      border-radius: 6px;
      margin: 1px 0;
    }

    .action-button:hover,
    .action-button.selected {
      background: var(--primary-light, #e3f2fd);
    }

    .action-button.has-execute:hover {
      background: var(--success-bg, #e8f5e9);
    }

    .action-icon {
      color: var(--primary-color, #1976d2);
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .action-button.has-execute .action-icon {
      color: var(--success-color, #4caf50);
    }

    .action-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .action-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .action-description {
      font-size: 10px;
      color: var(--text-tertiary, #888);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .action-arrow {
      color: var(--success-color, #4caf50);
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* ========== Hint Bar ========== */

    .hint-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--warning-bg, #fff8e1);
      border-top: 1px solid var(--border-color, #e0e0e0);
      font-size: 12px;
      color: var(--text-secondary, #666);
    }

    .hint-bar mat-icon {
      color: var(--warning-color, #f9a825);
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* ========== Mobile Responsiveness ========== */

    @media (max-width: 480px) {
      .toggle-container {
        bottom: 16px;
        left: 16px;
      }

      .contextual-panel {
        top: auto;
        bottom: 80px;
        left: 16px;
        width: calc(100vw - 32px);
        max-height: 50vh;
      }

      .guide-toggle-btn {
        width: 48px;
        height: 48px;
      }

      .guide-toggle-btn mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
  `],
})
export class ContextualGuidePanelComponent {
  protected guideService = inject(ContextualGuideService);

  // Expose service signals
  isEnabled = computed(() => this.guideService.isEnabled());
  isExpanded = computed(() => this.guideService.isExpanded());
  selectedActionId = computed(() => this.guideService.selectedActionId());
  pageName = computed(() => this.guideService.currentPageName());
  pageIcon = computed(() => this.guideService.currentPageIcon());

  // New section-based signals
  useSections = computed(() => this.guideService.useSections());
  sections = computed(() => this.guideService.availableSections());

  // Legacy action groups
  actionGroups = computed(() => this.guideService.availableActionGroups());
  availableActions = computed(() => this.guideService.availableActions());

  currentHint = computed(() => {
    const selectedId = this.selectedActionId();
    if (!selectedId) return null;

    // Search in sections first
    for (const section of this.sections()) {
      // Check section actions
      if (section.actions) {
        const action = section.actions.find(a => a.id === selectedId);
        if (action?.hint) return action.hint;
      }
      // Check subsection actions
      if (section.subsections) {
        for (const sub of section.subsections) {
          const action = sub.actions.find(a => a.id === selectedId);
          if (action?.hint) return action.hint;
        }
      }
    }

    // Fallback to legacy actions
    const action = this.availableActions().find(a => a.id === selectedId);
    return action?.hint ?? null;
  });

  toggleGuide(): void {
    this.guideService.toggle();
  }

  toggleExpanded(): void {
    this.guideService.toggleExpanded();
  }

  // Section methods
  isSectionExpanded(sectionId: string): boolean {
    return this.guideService.isSectionExpanded(sectionId);
  }

  toggleSection(sectionId: string): void {
    this.guideService.toggleSection(sectionId);
  }

  getSubsections(section: GuideSection): GuideSubsection[] {
    return this.guideService.getAvailableSubsections(section);
  }

  getSectionActions(section: GuideSection): ContextualAction[] {
    return this.guideService.getSectionActions(section);
  }

  // Subsection methods
  isSubsectionExpanded(subsectionId: string): boolean {
    return this.guideService.isSubsectionExpanded(subsectionId);
  }

  toggleSubsection(subsectionId: string): void {
    this.guideService.toggleSubsection(subsectionId);
  }

  getSubsectionActions(subsection: GuideSubsection): ContextualAction[] {
    return this.guideService.getSubsectionActions(subsection);
  }

  // Action methods
  selectAction(actionId: string): void {
    this.guideService.selectAction(actionId);
  }

  clearSelection(): void {
    this.guideService.selectAction(null);
  }

  executeAction(action: ContextualAction): void {
    this.guideService.executeAction(action);
  }

  // Legacy method for action groups
  getGroupActions(group: ActionGroup): ContextualAction[] {
    const context = this.guideService.currentContext();
    return group.actions
      .filter(action => action.isAvailable(context))
      .sort((a, b) => b.priority - a.priority);
  }
}
