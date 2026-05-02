import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RedTagProgressService, AutomationStep } from '../../../services/automation/red-tag-progress.service';
import { RedTagControlService } from '../../../services/automation/red-tag-control.service';
import { CurrentDailyPermitPackageService } from '../../../services/current-items-services/current-daily-permit-package.service';

@Component({
  selector: 'app-red-tag-progress-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './red-tag-progress-panel.component.html',
  styleUrl: './red-tag-progress-panel.component.css'
})
export class RedTagProgressPanelComponent implements OnInit, OnDestroy {
  progressService = inject(RedTagProgressService);
  controlService = inject(RedTagControlService);
  currentPackageService = inject(CurrentDailyPermitPackageService);

  manualConfirmation = false;

  @ViewChild('stepList') stepListRef!: ElementRef<HTMLDivElement>;

  private autoScrollEffect = effect(() => {
    const session = this.progressService.session();
    if (session && session.currentStepIndex >= 0) {
      setTimeout(() => this.scrollToCurrentStep(), 50);
    }
  });

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && (this.progressService.isRunning() || this.progressService.isPaused())) {
      event.preventDefault();
      this.stop();
    }
  }

  ngOnInit(): void {
    this.progressService.connect();

    // Clear stale session if it belongs to a different package
    const currentPkg = this.currentPackageService.currentDailyPacksge();
    const session = this.progressService.session();
    if (session && currentPkg && session.packageId !== currentPkg.id) {
      this.progressService.session.set(null);
    }

    this.controlService.getManualConfirmation().subscribe({
      next: (res) => { if (res.responseData !== null) this.manualConfirmation = res.responseData; }
    });
  }

  ngOnDestroy(): void {
    this.progressService.disconnect();
  }

  start(): void {
    const pkg = this.currentPackageService.currentDailyPacksge();
    if (pkg?.id) {
      this.controlService.startBuild(pkg.id).subscribe();
    }
  }

  pause(): void {
    this.controlService.pauseBuild().subscribe();
  }

  resume(): void {
    this.controlService.resumeBuild().subscribe();
  }

  stop(): void {
    this.controlService.stopBuild().subscribe();
  }

  retryStep(): void {
    this.controlService.retryStep().subscribe();
  }

  skipStep(): void {
    this.controlService.skipStep().subscribe();
  }

  toggleManualConfirmation(): void {
    this.manualConfirmation = !this.manualConfirmation;
    this.controlService.toggleManualConfirmation(this.manualConfirmation).subscribe();
  }

  formatDuration(step: AutomationStep): string {
    if (!step.endTimeMs || !step.startTimeMs) return '';
    const ms = step.endTimeMs - step.startTimeMs;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'setup': return 'Setup';
      case 'loto': return 'LOTO';
      case 'hotWork': return 'Hot Work';
      case 'confinedSpace': return 'Confined Space';
      case 'safeWork': return 'Safe Work';
      case 'association': return 'Associate';
      default: return category;
    }
  }

  private scrollToCurrentStep(): void {
    if (!this.stepListRef?.nativeElement) return;
    const container = this.stepListRef.nativeElement;
    const currentEl = container.querySelector('.step-item.current');
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
