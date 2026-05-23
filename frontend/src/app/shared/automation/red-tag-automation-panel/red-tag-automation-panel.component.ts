import { Component, HostListener, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RedTagAutomationService } from '../../../services/automation/red-tag-automation.service';

/**
 * Compact live-progress panel for the rebuilt Red Tag automation.
 * Binds to {@link RedTagAutomationService}; renders only while a session exists.
 *
 * <p>Each step row has two run buttons:
 * <ul>
 *   <li>⏩ — re-run the build starting at that step (later steps run too).</li>
 *   <li>▶ — run only that one step.</li>
 * </ul>
 * Press <b>Esc</b> to pause a running build.
 */
@Component({
  selector: 'app-red-tag-automation-panel',
  standalone: true,
  template: `
    @if (rt.session(); as session) {
      <div class="rt-panel" [class.failed]="rt.isFailed()" [class.done]="rt.isCompleted()">
        <div class="rt-head">
          <span class="rt-title">{{ session.packageName }}</span>
          <span class="rt-status">{{ session.status }}</span>
          <span class="rt-hint" title="Esc pauses a running build">Esc=pause</span>
          <button class="rt-x" type="button" (click)="rt.disconnect()" title="Hide">✕</button>
        </div>

        <div class="rt-bar"><div class="rt-fill" [style.width.%]="rt.progressPercent()"></div></div>

        <ul class="rt-steps">
          @for (step of session.steps; let i = $index; track step.id) {
            <li class="rt-step" [attr.data-status]="step.status">
              <span class="rt-dot"></span>
              <span class="rt-name">{{ step.name }}</span>
              <button type="button" class="rt-step-run"
                      title="Re-run from this step (later steps run too)"
                      (click)="runFromHere(i)">⏩</button>
              <button type="button" class="rt-step-run"
                      title="Run only this step"
                      (click)="runOnly(i)">▶</button>
              @if (step.errorMessage) { <span class="rt-err">{{ step.errorMessage }}</span> }
            </li>
          }
        </ul>

        <div class="rt-actions">
          @if (rt.isRunning()) {
            <button type="button" (click)="run(rt.pause())">Pause (Esc)</button>
            <button type="button" (click)="run(rt.stop())">Stop</button>
          }
          @if (rt.isPaused()) {
            <button type="button" (click)="run(rt.resume())">Resume</button>
            <button type="button" (click)="run(rt.stop())">Stop</button>
          }
          @if (rt.isFailed()) {
            <button type="button" (click)="run(rt.retryStep())">Retry step</button>
            <button type="button" (click)="run(rt.skipStep())">Skip step</button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .rt-panel { border: 1px solid #c9c9c9; border-radius: 6px; background: #fff;
      padding: 10px 12px; margin-top: 10px; font-size: 13px; max-width: 520px; }
    .rt-panel.failed { border-color: #d23; }
    .rt-panel.done { border-color: #2a8; }
    .rt-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .rt-title { font-weight: 600; flex: 1; }
    .rt-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #eee; }
    .rt-hint { font-size: 10px; color: #888; }
    .rt-x { border: none; background: none; cursor: pointer; color: #888; }
    .rt-bar { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .rt-fill { height: 100%; background: #2a8; transition: width .3s; }
    .rt-steps { list-style: none; margin: 8px 0 0; padding: 0; }
    .rt-step { display: flex; align-items: center; gap: 6px; padding: 3px 0; }
    .rt-dot { width: 9px; height: 9px; border-radius: 50%; background: #ccc; flex: none; }
    .rt-step[data-status="RUNNING"] .rt-dot { background: #f0a500; }
    .rt-step[data-status="SUCCESS"] .rt-dot { background: #2a8; }
    .rt-step[data-status="FAILED"]  .rt-dot { background: #d23; }
    .rt-step[data-status="SKIPPED"] .rt-dot { background: #99a; }
    .rt-name { flex: 1; }
    .rt-step-run { border: 1px solid #ddd; background: #f7f7f7; cursor: pointer;
      font-size: 11px; padding: 0 6px; height: 18px; border-radius: 3px; line-height: 1; }
    .rt-step-run:hover { background: #ececec; }
    .rt-err { color: #d23; font-size: 11px; flex-basis: 100%; padding-left: 17px; }
    .rt-actions { display: flex; gap: 8px; margin-top: 8px; }
    .rt-actions button { padding: 4px 10px; cursor: pointer; }
  `]
})
export class RedTagAutomationPanelComponent {
  rt = inject(RedTagAutomationService);

  /** Re-runs the build starting at this step; later steps also execute. */
  runFromHere(stepIndex: number): void {
    this.run(this.rt.restartFromStep(stepIndex));
  }

  /** Runs only this single step (later steps marked SKIPPED). */
  runOnly(stepIndex: number): void {
    this.run(this.rt.restartFromStep(stepIndex, true));
  }

  /** Subscribe-and-forget for fire-and-forget control calls. */
  run(obs: Observable<unknown>): void {
    obs.subscribe({ error: () => {} });
  }

  /** Esc pauses a running build (no-op when paused/failed/idle). */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.rt.isRunning()) {
      this.run(this.rt.pause());
    }
  }
}
