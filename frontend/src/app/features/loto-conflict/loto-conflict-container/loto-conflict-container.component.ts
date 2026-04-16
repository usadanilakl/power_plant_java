import { Component, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoConflictStateService } from '../services/loto-conflict-state.service';
import { LotoConflictApiService } from '../services/loto-conflict-api.service';
import { LotoConflictLeftPanelComponent } from '../loto-conflict-left-panel/loto-conflict-left-panel.component';
import { LotoConflictRightPanelComponent } from '../loto-conflict-right-panel/loto-conflict-right-panel.component';
import { LotoConflictMergeComponent } from '../loto-conflict-merge/loto-conflict-merge.component';
import { LotoConflictDetailComponent } from '../loto-conflict-detail/loto-conflict-detail.component';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { RfFloatingWindowComponent } from '../../../shared/rf-floating-window/rf-floating-window.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loto-conflict-container',
  standalone: true,
  imports: [
    CommonModule,
    LotoConflictLeftPanelComponent,
    LotoConflictRightPanelComponent,
    LotoConflictMergeComponent,
    LotoConflictDetailComponent,
    MainLayoutComponent,
    RouterMenuComponent,
    RfFloatingWindowComponent,
    MatProgressBarModule,
  ],
  templateUrl: './loto-conflict-container.component.html',
  styleUrl: './loto-conflict-container.component.css',
})
export class LotoConflictContainerComponent implements OnInit, OnDestroy {
  protected state = inject(LotoConflictStateService);
  private api = inject(LotoConflictApiService);

  isResizing = signal<boolean>(false);
  private startX = 0;
  private startWidth = 0;

  ngOnInit(): void {
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.state.reset();
  }

  loadSummary(): void {
    this.api.getSummary().subscribe({
      next: (res) => {
        if (res.responseData) {
          this.state.conflictSummary.set(res.responseData);
        }
      },
      error: (err) => console.error('Failed to load conflict summary:', err),
    });
  }

  // ========== Resize Handling ==========

  onDividerMouseDown(event: MouseEvent): void {
    this.isResizing.set(true);
    this.startX = event.clientX;
    this.startWidth = this.state.leftPanelWidth();
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing()) return;
    const delta = event.clientX - this.startX;
    const newWidth = Math.max(300, Math.min(800, this.startWidth + delta));
    this.state.leftPanelWidth.set(newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing.set(false);
  }
}
