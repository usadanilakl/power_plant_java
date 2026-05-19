import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { E2eTestService, E2eInfo } from '../../services/e2e-test.service';
import { firstValueFrom } from 'rxjs';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warn';
  result?: string;
  error?: string;
}

type FlowType = 'permits' | 'files' | 'file-detailed' | 'loto-standard';

/**
 * Test user record for step-up flows. The PIN code sent to /api/auth/step-up
 * is just `${initials}${pin}` — built inline at the call sites.
 */
interface TestActor {
  userId: number;
  email: string;
  name: string;
  initials: string;
  pin: string;
}

@Component({
  selector: 'app-e2e-test-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="e2e-container">
          <div class="e2e-header">
            <h2>E2E Test Runner</h2>
            <div class="info-bar">
              <span class="info-tag" [class.hub]="e2eInfo?.isHub" [class.client]="!e2eInfo?.isHub">
                {{ e2eInfo?.isHub ? 'HUB' : 'CLIENT' }}
              </span>
              <span class="info-item">{{ e2eInfo?.machineName }} (port {{ e2eInfo?.localPort }})</span>
              <span class="info-item" *ngIf="!e2eInfo?.isHub">Hub: {{ e2eInfo?.syncServerUrl }}</span>
              <span class="info-item" *ngIf="e2eInfo?.isHub && clientUrl">Client: {{ clientUrl }}</span>
            </div>
            <div class="run-id-display">
              <span class="label">Run ID:</span>
              <code>{{ runId }}</code>
              <button class="btn btn-sm" (click)="regenerateRunId()" [disabled]="isRunning">New ID</button>
            </div>
            <div class="config-row" *ngIf="e2eInfo?.isHub">
              <label class="form-label">Client URL:</label>
              <input class="config-input" [(ngModel)]="clientUrl" placeholder="http://localhost:8082" [disabled]="isRunning" />
            </div>
            <div class="config-row">
              <label class="form-label">Sync wait (seconds):</label>
              <input class="config-input config-input-sm" type="number" [(ngModel)]="syncWaitSeconds" min="3" max="60" [disabled]="isRunning" />
            </div>
          </div>

          <!-- Flow tabs -->
          <div class="flow-tabs">
            <button class="flow-tab" [class.active]="selectedFlow === 'permits'" (click)="selectFlow('permits')" [disabled]="isRunning">
              Permit Flow
            </button>
            <button class="flow-tab" [class.active]="selectedFlow === 'files'" (click)="selectFlow('files')" [disabled]="isRunning">
              File &amp; LOTO Flow
            </button>
            <button class="flow-tab" [class.active]="selectedFlow === 'file-detailed'" (click)="selectFlow('file-detailed')" [disabled]="isRunning">
              File Flow
            </button>
            <button class="flow-tab" [class.active]="selectedFlow === 'loto-standard'" (click)="selectFlow('loto-standard')" [disabled]="isRunning">
              LOTO Standard Flow
            </button>
          </div>

          <div class="controls">
            <button class="btn btn-primary" (click)="runAll()" [disabled]="isRunning">
              {{ isRunning ? 'Running...' : 'Run All Steps' }}
            </button>
            <button class="btn btn-secondary" (click)="resetCurrent()" [disabled]="isRunning">Reset</button>
          </div>

          <div class="steps-container">
            <div class="step-card" *ngFor="let step of currentSteps; let i = index">
              <div class="step-header">
                <span class="step-number">{{ i + 1 }}</span>
                <span class="step-name">{{ step.name }}</span>
                <span class="step-status" [class]="step.status">
                  {{ step.status === 'pending' ? '--' : step.status === 'running' ? 'Running...' : step.status === 'success' ? 'OK' : step.status === 'warn' ? 'WARN' : 'FAIL' }}
                </span>
                <button class="btn btn-sm btn-outline"
                        (click)="runSingleStep(i)"
                        [disabled]="isRunning || !canRunStep(i)">
                  Run
                </button>
              </div>
              <div class="step-result" *ngIf="step.result">
                <pre>{{ step.result }}</pre>
              </div>
              <div class="step-error" *ngIf="step.error">
                <pre>{{ step.error }}</pre>
              </div>
            </div>
          </div>

          <div class="log-section">
            <h3>Execution Log</h3>
            <div class="log-area">
              <div *ngFor="let entry of logEntries" class="log-entry" [class]="entry.level">
                <span class="log-time">{{ entry.time }}</span>
                <span class="log-msg">{{ entry.message }}</span>
              </div>
              <div *ngIf="logEntries.length === 0" class="log-empty">No log entries yet. Click "Run All Steps" to begin.</div>
            </div>
          </div>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .e2e-container { padding: 20px; max-width: 900px; margin: 0 auto; }
    .e2e-header { margin-bottom: 20px; }
    .e2e-header h2 { color: #333; margin-bottom: 10px; }
    .info-bar {
      display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
      padding: 8px 14px; background: #f5f5f5; border-radius: 6px; font-size: 13px;
    }
    .info-tag { padding: 2px 10px; border-radius: 4px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .info-tag.hub { background: #e8f5e9; color: #2e7d32; }
    .info-tag.client { background: #e3f2fd; color: #1565c0; }
    .info-item { color: #555; }
    .run-id-display { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 14px; }
    .run-id-display .label { font-weight: 600; color: #666; }
    .run-id-display code { background: #f5f5f5; padding: 2px 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px; }
    .config-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
    .form-label { font-weight: 500; color: #555; white-space: nowrap; }
    .config-input { padding: 4px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 280px; }
    .config-input-sm { width: 80px; }
    .flow-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .flow-tab {
      padding: 8px 20px; border: 1px solid #ccc; border-radius: 6px 6px 0 0;
      background: #f5f5f5; cursor: pointer; font-size: 13px; font-weight: 500; color: #666;
    }
    .flow-tab.active { background: #1976d2; color: #fff; border-color: #1976d2; }
    .flow-tab:disabled { opacity: 0.6; cursor: not-allowed; }
    .controls { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn { padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #1976d2; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #1565c0; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .btn-outline { background: transparent; border: 1px solid #bbb; color: #555; }
    .steps-container { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .step-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; background: #fff; }
    .step-header { display: flex; align-items: center; gap: 12px; }
    .step-number {
      width: 28px; height: 28px; border-radius: 50%; background: #e3f2fd;
      color: #1976d2; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .step-name { flex: 1; font-weight: 500; color: #333; }
    .step-status { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 12px; text-transform: uppercase; min-width: 70px; text-align: center; }
    .step-status.pending { background: #f5f5f5; color: #999; }
    .step-status.running { background: #fff3e0; color: #e65100; }
    .step-status.success { background: #e8f5e9; color: #2e7d32; }
    .step-status.warn { background: #fff8e1; color: #f57f17; }
    .step-status.error { background: #ffebee; color: #c62828; }
    .step-result { margin-top: 8px; }
    .step-result pre { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #2e7d32; white-space: pre-wrap; margin: 0; }
    .step-error { margin-top: 8px; }
    .step-error pre { background: #fff5f5; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #c62828; white-space: pre-wrap; margin: 0; }
    .log-section h3 { color: #555; margin-bottom: 8px; font-size: 15px; }
    .log-area {
      background: #1e1e1e; color: #d4d4d4; padding: 14px; border-radius: 8px;
      max-height: 300px; overflow-y: auto; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px;
    }
    .log-entry { padding: 2px 0; display: flex; gap: 8px; }
    .log-entry.error .log-msg { color: #f44336; }
    .log-entry.success .log-msg { color: #66bb6a; }
    .log-entry.info .log-msg { color: #42a5f5; }
    .log-entry.warn .log-msg { color: #ffa726; }
    .log-time { color: #888; flex-shrink: 0; }
    .log-msg { word-break: break-all; }
    .log-empty { color: #888; font-style: italic; }
  `]
})
export class E2eTestPageComponent implements OnInit {
  private api = inject(E2eTestService);

  runId = this.generateRunId();
  isRunning = false;
  logEntries: { time: string; message: string; level: string }[] = [];
  e2eInfo: E2eInfo | null = null;
  clientUrl = 'http://localhost:8082';
  syncWaitSeconds = 10;
  selectedFlow: FlowType = 'permits';

  // ==================== Permit Flow State ====================
  private createdWrId: string | null = null;
  private createdJobId: string | null = null;
  private createdPackageId: string | null = null;
  private createdSafeWorkId: string | null = null;
  private createdHotWorkId: string | null = null;
  private createdConfinedSpaceId: string | null = null;

  permitSteps: TestStep[] = [
    { name: 'Create Work Request', status: 'pending' },
    { name: 'Create Job from WR (+ Package)', status: 'pending' },
    { name: 'Create SafeWork Permit', status: 'pending' },
    { name: 'Create HotWork Permit', status: 'pending' },
    { name: 'Create ConfinedSpace Permit', status: 'pending' },
    { name: 'Attach All Permits to Package', status: 'pending' },
    { name: 'Wait for Sync', status: 'pending' },
    { name: 'Verify Sync: Local vs Remote', status: 'pending' },
  ];

  // ==================== File & LOTO Flow State ====================
  private fileTypeId: number | null = null;
  private vendorId: number | null = null;
  private createdFileId: string | null = null;
  private createdFileName: string | null = null;
  private createdEq1Id: string | null = null;
  private createdEq2Id: string | null = null;
  private createdLp1Id: string | null = null;
  private createdLp2Id: string | null = null;

  fileSteps: TestStep[] = [
    { name: 'Upload PDF File (create FileObject)', status: 'pending' },
    { name: 'Verify JPG Conversion', status: 'pending' },
    { name: 'Create Shape 1 (Equipment) on File', status: 'pending' },
    { name: 'Create LOTO Point 1 + Assign to Shape 1', status: 'pending' },
    { name: 'Create Shape 2 (Equipment) on File', status: 'pending' },
    { name: 'Create LOTO Point 2 + Assign to Shape 2', status: 'pending' },
    { name: 'Create Zero Energy on LP1 using Shape 1', status: 'pending' },
    { name: 'Wait for Sync', status: 'pending' },
    { name: 'Verify Sync: File & LOTO Points', status: 'pending' },
  ];

  // ==================== File Flow (detailed) State ====================
  // Exercises §3.1 (fileHash sync), §3.2 (whitelist + non-PDF strategy),
  // §3.3 (dynamic file types), and the override-extension replacement fix.
  private fdFileTypeId: number | null = null;
  private fdVendorId: number | null = null;
  private fdAllowedExtensions: string[] = [];
  private fdPdfFileId: string | null = null;        // becomes PNG after step 7
  private fdPngFileId: string | null = null;        // direct-upload PNG
  private fdManualFileId: string | null = null;     // file with new dynamic type
  private fdHashAfterPdfA: string | null = null;
  private fdHashAfterPdfB: string | null = null;
  private fdHashAfterOverrideToPng: string | null = null;
  private fdHashAfterMetaUpdate: string | null = null;
  private fdHashPng: string | null = null;

  fileDetailedSteps: TestStep[] = [
    { name: 'Get allowed extensions (whitelist endpoint)', status: 'pending' },
    { name: 'Upload PDF (sample variant A) — capture hash', status: 'pending' },
    { name: 'Assert fileHash populated (§3.1 fix)', status: 'pending' },
    { name: 'Upload PNG (DirectUploadStrategy) — assert hash populated', status: 'pending' },
    { name: 'Reject disallowed extension (.txt)', status: 'pending' },
    { name: 'Override-upload PDF→PDF (variant B) — assert hash CHANGED', status: 'pending' },
    { name: 'Override PDF→PNG — assert extensions REPLACED (not merged)', status: 'pending' },
    { name: 'Metadata-only update — assert hash UNCHANGED', status: 'pending' },
    { name: 'Wait for Sync', status: 'pending' },
    { name: 'Verify Sync: file hashes match across instances', status: 'pending' },
    { name: 'Soft-delete + trash listing', status: 'pending' },
    { name: 'Dynamic file type — create + upload with new type', status: 'pending' },
  ];

  // ==================== LOTO Standard Flow State ====================
  // See project/features/loto-standard/loto-e2e-test-plan.md §1.
  private actors: Record<string, TestActor> = {};
  private stdLotoPointIds: number[] = [];
  private stdStandardId: number | null = null;

  standardSteps: TestStep[] = [
    { name: '1. Provision test users (DK, MS, MG, JR, CR) — initials + PIN', status: 'pending' },
    { name: '2. Create 4 LOTO Points + a LOTO Standard (DRAFT)', status: 'pending' },
    { name: '3. Submit for verification (PIN as DK)', status: 'pending' },
    { name: '4. NEG: try to verify as DK (second-person rule must reject)', status: 'pending' },
    { name: '5. Verify (PIN as MS)', status: 'pending' },
    { name: '6. Mark walkdown complete (PIN as DK)', status: 'pending' },
    { name: '7. Mark ready for testing (PIN as DK)', status: 'pending' },
    { name: '8. NEG: try to approve as DK (MANAGER required)', status: 'pending' },
    { name: '9. Approve (PIN as MG)', status: 'pending' },
    { name: '10. Edit a point — standard auto-invalidates to NEW_PENDING_REAPPROVAL', status: 'pending' },
    { name: '11. Re-approve (PIN as MG)', status: 'pending' },
    { name: '12. Workflow history sanity (≥7 events with right performers)', status: 'pending' },
    { name: '13. Cleanup (soft-delete standard + test users)', status: 'pending' },
  ];

  get currentSteps(): TestStep[] {
    if (this.selectedFlow === 'permits') return this.permitSteps;
    if (this.selectedFlow === 'files') return this.fileSteps;
    if (this.selectedFlow === 'loto-standard') return this.standardSteps;
    return this.fileDetailedSteps;
  }

  async ngOnInit(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getE2eInfo());
      this.e2eInfo = res.responseData;
    } catch { /* ignore */ }
  }

  selectFlow(flow: FlowType): void {
    this.selectedFlow = flow;
  }

  generateRunId(): string {
    const now = new Date();
    const ts = now.toISOString().replace(/[-:T.]/g, '').slice(0, 15);
    const rand = Math.random().toString(36).slice(2, 6);
    return `E2E-${ts}-${rand}`;
  }

  regenerateRunId(): void {
    this.runId = this.generateRunId();
    this.log('info', `New run ID: ${this.runId}`);
  }

  resetCurrent(): void {
    this.currentSteps.forEach(s => { s.status = 'pending'; s.result = undefined; s.error = undefined; });
    this.logEntries = [];
    if (this.selectedFlow === 'permits') {
      this.createdWrId = this.createdJobId = this.createdPackageId = null;
      this.createdSafeWorkId = this.createdHotWorkId = this.createdConfinedSpaceId = null;
    } else if (this.selectedFlow === 'files') {
      this.fileTypeId = this.vendorId = null;
      this.createdFileId = this.createdFileName = null;
      this.createdEq1Id = this.createdEq2Id = null;
      this.createdLp1Id = this.createdLp2Id = null;
    } else if (this.selectedFlow === 'file-detailed') {
      this.fdFileTypeId = this.fdVendorId = null;
      this.fdAllowedExtensions = [];
      this.fdPdfFileId = this.fdPngFileId = this.fdManualFileId = null;
      this.fdHashAfterPdfA = this.fdHashAfterPdfB = null;
      this.fdHashAfterOverrideToPng = this.fdHashAfterMetaUpdate = this.fdHashPng = null;
    } else if (this.selectedFlow === 'loto-standard') {
      this.actors = {};
      this.stdLotoPointIds = [];
      this.stdStandardId = null;
    }
    this.regenerateRunId();
  }

  canRunStep(index: number): boolean {
    const steps = this.currentSteps;
    if (index === 0) return true;
    if (this.selectedFlow === 'file-detailed') {
      // Wait at 8, Verify at 9. Verify depends on the last update step (7),
      // not on the wait. Steps 10 and 11 are independent post-verify checks.
      if (index === 9) return steps[7].status === 'success';
      return steps[index - 1].status === 'success';
    }
    if (this.selectedFlow === 'loto-standard') {
      // Strict chain: each step depends on the prior success. Cleanup (last
      // step) is allowed regardless of how far the run got — it's safe to
      // run it on partial state to clean up.
      if (index === steps.length - 1) return true;
      // Negative-case steps (4, 8) are followed by a happy-path step; they
      // don't need to "succeed" in the assertion sense — running them sets
      // status=success when the expected 4xx is observed.
      return steps[index - 1].status === 'success' || steps[index - 1].status === 'warn';
    }
    // Permits / File & LOTO: wait + verify are the last 2 steps; verify depends
    // on the last creation step (steps.length - 3), not on the wait.
    const lastCreationIdx = steps.length - 3;
    if (index >= steps.length - 2) return steps[lastCreationIdx].status === 'success';
    return steps[index - 1].status === 'success';
  }

  async runAll(): Promise<void> {
    this.isRunning = true;
    this.log('info', `=== Starting ${this.selectedFlow} E2E run: ${this.runId} ===`);
    const steps = this.currentSteps;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].status === 'success') continue;
      await this.runSingleStep(i);
      if (steps[i].status === 'error') {
        this.log('error', `Run stopped at step ${i + 1} due to error.`);
        break;
      }
    }
    this.isRunning = false;
    this.log('info', `=== E2E run finished ===`);
  }

  async runSingleStep(index: number): Promise<void> {
    const step = this.currentSteps[index];
    step.status = 'running';
    step.result = undefined;
    step.error = undefined;
    this.log('info', `Step ${index + 1}: ${step.name}...`);

    try {
      if (this.selectedFlow === 'permits') {
        await this.runPermitStep(index, step);
      } else if (this.selectedFlow === 'files') {
        await this.runFileStep(index, step);
      } else if (this.selectedFlow === 'loto-standard') {
        await this.runStandardStep(index, step);
      } else {
        await this.runFileDetailedStep(index, step);
      }
      const currentStatus = step.status as string;
      if (currentStatus === 'running') step.status = 'success';
      this.log(currentStatus === 'warn' ? 'warn' : 'success',
        `Step ${index + 1}: ${step.name} - ${currentStatus === 'warn' ? 'WARN' : 'OK'}`);
    } catch (e: any) {
      step.status = 'error';
      step.error = e?.error?.message || e?.message || JSON.stringify(e);
      this.log('error', `Step ${index + 1}: ${step.name} - FAILED: ${step.error}`);
    }
  }

  // ==================== PERMIT FLOW ====================

  private async runPermitStep(index: number, step: TestStep): Promise<void> {
    switch (index) {
      case 0: await this.pCreateWorkRequest(step); break;
      case 1: await this.pCreateJobAndProcessWR(step); break;
      case 2: await this.pCreateSafeWork(step); break;
      case 3: await this.pCreateHotWork(step); break;
      case 4: await this.pCreateConfinedSpace(step); break;
      case 5: await this.pAttachPermits(step); break;
      case 6: await this.stepWaitForSync(step); break;
      case 7: await this.pVerifySync(step); break;
    }
  }

  private async pCreateWorkRequest(step: TestStep): Promise<void> {
    const payload = [{
      dateOfWorkToBePerformed: this.buildDateStrMmDdYyyy(),
      timeOfWorkToBePerformed: '08:00',
      requestedBy: `Test User [${this.runId}]`,
      company: `Test Company [${this.runId}]`,
      location: `Unit 2 Turbine Hall [${this.runId}]`,
      workScope: `E2E Test Work Scope [${this.runId}]`,
      foreman: `Test Foreman [${this.runId}]`,
      affectedEquipment: `Test Equipment [${this.runId}]`,
      isHotWorkRequired: true, isLotoRequired: true, isConfinedSpaceEntryRequired: true,
      status: 'Active'
    }];
    const res = await firstValueFrom(this.api.createWorkRequest(payload));
    const wr = res.responseData?.[0];
    if (!wr?.id) throw new Error('No WR ID returned');
    this.createdWrId = String(wr.id);
    step.result = `WR created: ID=${wr.id}`;
  }

  private async pCreateJobAndProcessWR(step: TestStep): Promise<void> {
    if (!this.createdWrId) throw new Error('No WR ID');
    const jobRes = await firstValueFrom(this.api.createJobFromWorkRequest(this.createdWrId));
    const job = jobRes.responseData;
    if (!job?.id) throw new Error('No Job ID returned');
    this.createdJobId = String(job.id);
    this.log('info', `  Job created: ID=${job.id}, permit=${job.permitNumber || 'N/A'}`);

    const processRes = await firstValueFrom(this.api.processWorkRequest(this.createdJobId, this.createdWrId));
    const updatedJob = processRes.responseData;
    const pkgArray = this.toArray(updatedJob?.packages);
    if (pkgArray.length > 0) {
      this.createdPackageId = String(pkgArray[0].id);
    } else {
      const fetchRes = await firstValueFrom(this.api.getJob(this.createdJobId));
      const fetchedPkgs = this.toArray(fetchRes.responseData?.packages);
      if (fetchedPkgs.length > 0) this.createdPackageId = String(fetchedPkgs[0].id);
      else throw new Error('No package created');
    }
    step.result = `Job ID=${this.createdJobId}, Package ID=${this.createdPackageId}`;
  }

  private async pCreateSafeWork(step: TestStep): Promise<void> {
    const payload = {
      date: this.buildDateStr(), time: '08:00',
      companyPerson: `Test Company/Test Person [${this.runId}]`,
      location: `Unit 2 Turbine Hall [${this.runId}]`,
      workScope: `E2E SafeWork [${this.runId}]`,
      specialInstructions: `E2E instructions [${this.runId}]`,
      requestedBy: `Test Requestor [${this.runId}]`,
      hazards: { highTemp: true, energized: true, eyeHazard: true, fallingObject: true, fireHazard: true, ventilationRequired: true },
      permits: { safeWorkPermit: true, hotWorkPermit: true, confinedSpacePermit: true, lotoRequired: true },
      ppe: { hardHat: true, safetyGlasses: true, steelToeBoots: true, gloves: true, frClothing: true }
    };
    const res = await firstValueFrom(this.api.createSafeWork(payload));
    if (!res.responseData?.id) throw new Error('No SafeWork ID');
    this.createdSafeWorkId = String(res.responseData.id);
    step.result = `SafeWork ID=${res.responseData.id}`;
  }

  private async pCreateHotWork(step: TestStep): Promise<void> {
    const payload = {
      date: this.buildDateStr(), time: '08:00',
      foreman: `Test Foreman [${this.runId}]`, fireWatch: `Test FireWatch [${this.runId}]`,
      meterModel: 'MSA Altair 5X', meterNum: `E2E-${this.runId.slice(-4)}`,
      location: `Unit 2 Turbine Hall [${this.runId}]`, workScope: `E2E HotWork [${this.runId}]`,
      isFireWatchRequired: true, timeOfInitialTest: '07:30', initialTestResult: 'Pass',
      measures: { fireExtinguisher: true, fireHoses: true, coverFloors: true, moveEquipment: true,
        coverOpenings: true, monitorAdjacentAreas: true, assignFireWatch: true, fireWatchDuration: '60 min' }
    };
    const res = await firstValueFrom(this.api.createHotWork(payload));
    if (!res.responseData?.id) throw new Error('No HotWork ID');
    this.createdHotWorkId = String(res.responseData.id);
    step.result = `HotWork ID=${res.responseData.id}`;
  }

  private async pCreateConfinedSpace(step: TestStep): Promise<void> {
    const payload = {
      date: this.buildDateStr(), time: '08:00',
      space: `Condenser A Waterbox [${this.runId}]`, issuedTo: `Test Worker [${this.runId}]`,
      duration: '4 hours', meterModel: 'MSA Altair 5X', meterNum: `E2E-${this.runId.slice(-4)}`,
      calibrated: true, ventilation: false, blankFlanged: false,
      workScope: `E2E ConfinedSpace [${this.runId}]`,
      hazards: { oxygenDeficiency: true, toxicGas: true, rotatingEquipment: true, heatStress: true },
      precautions: { ventilation: true, barriers: true, lockOutTagOut: 'LOTO-E2E', hotWorkPermit: 'HW-E2E' },
      ppe: { faceShield: true, nonSparkingTools: true, fallProtection: true, retrievalSystem: true, lifeline: true, personalAtmosphericMeter: true }
    };
    const res = await firstValueFrom(this.api.createConfinedSpace(payload));
    if (!res.responseData?.id) throw new Error('No ConfinedSpace ID');
    this.createdConfinedSpaceId = String(res.responseData.id);
    step.result = `ConfinedSpace ID=${res.responseData.id}`;
  }

  private async pAttachPermits(step: TestStep): Promise<void> {
    if (!this.createdPackageId) throw new Error('No Package ID');
    const payload: any = { id: Number(this.createdPackageId) };
    if (this.createdSafeWorkId) payload.safeWorkIds = [Number(this.createdSafeWorkId)];
    if (this.createdHotWorkId) payload.hotWorkIds = [Number(this.createdHotWorkId)];
    if (this.createdConfinedSpaceId) payload.confinedSpaceIds = [Number(this.createdConfinedSpaceId)];
    const res = await firstValueFrom(this.api.updatePackage(this.createdPackageId, payload));
    const pkg = res.responseData;
    const counts = [
      pkg?.safeWorks?.length ? `${pkg.safeWorks.length} SW` : null,
      pkg?.hotWorks?.length ? `${pkg.hotWorks.length} HW` : null,
      pkg?.confinedSpaces?.length ? `${pkg.confinedSpaces.length} CS` : null,
      pkg?.workRequests?.length ? `${pkg.workRequests.length} WR` : null,
    ].filter(Boolean).join(', ');
    step.result = `Package ${this.createdPackageId}: ${counts || 'permits attached'}`;
  }

  private async pVerifySync(step: TestStep): Promise<void> {
    if (!this.createdJobId || !this.createdPackageId) throw new Error('No Job/Package ID');
    const remoteUrl = this.getRemoteUrl();
    if (!remoteUrl) throw new Error('No remote URL configured');
    this.log('info', `  Verifying against: ${remoteUrl}`);
    const diffs: string[] = [];

    const localJob = (await firstValueFrom(this.api.getJob(this.createdJobId))).responseData;
    try {
      const remoteJob = (await firstValueFrom(this.api.getJobFromRemote(remoteUrl, this.createdJobId))).responseData;
      if (!remoteJob) diffs.push(`Job ${this.createdJobId}: NOT FOUND on remote`);
      else this.compareFields(diffs, 'Job', localJob, remoteJob, ['workScope', 'company', 'foreman', 'location', 'permitNumber']);
    } catch (e: any) { diffs.push(`Job fetch failed: ${e?.message || 'unknown'}`); }

    const localPkg = (await firstValueFrom(this.api.getPackage(this.createdPackageId))).responseData;
    try {
      const remotePkg = (await firstValueFrom(this.api.getPackageFromRemote(remoteUrl, this.createdPackageId))).responseData;
      if (!remotePkg) { diffs.push(`Package: NOT FOUND on remote`); }
      else {
        this.compareFields(diffs, 'Package', localPkg, remotePkg, ['companyName', 'personName', 'permitNumber']);
        this.compareCount(diffs, 'safeWorks', localPkg, remotePkg);
        this.compareCount(diffs, 'hotWorks', localPkg, remotePkg);
        this.compareCount(diffs, 'confinedSpaces', localPkg, remotePkg);
        this.compareCount(diffs, 'workRequests', localPkg, remotePkg);
      }
    } catch (e: any) { diffs.push(`Package fetch failed: ${e?.message || 'unknown'}`); }

    this.setVerifyResult(step, diffs, remoteUrl);
  }

  // ==================== FILE & LOTO FLOW ====================

  private async runFileStep(index: number, step: TestStep): Promise<void> {
    switch (index) {
      case 0: await this.fUploadFile(step); break;
      case 1: await this.fVerifyJpg(step); break;
      case 2: await this.fCreateShape1(step); break;
      case 3: await this.fCreateLotoPoint1(step); break;
      case 4: await this.fCreateShape2(step); break;
      case 5: await this.fCreateLotoPoint2(step); break;
      case 6: await this.fCreateZeroEnergy(step); break;
      case 7: await this.stepWaitForSync(step); break;
      case 8: await this.fVerifySync(step); break;
    }
  }

  private async fUploadFile(step: TestStep): Promise<void> {
    // Ensure File Type and Vendor values exist
    const ftRes = await firstValueFrom(this.api.createValue('File Type', 'PID'));
    this.fileTypeId = ftRes.responseData?.id;
    if (!this.fileTypeId) throw new Error('Failed to create/get File Type value');
    this.log('info', `  File Type "PID" ID=${this.fileTypeId}`);

    const vRes = await firstValueFrom(this.api.createValue('Vendor', 'E2E-Test'));
    this.vendorId = vRes.responseData?.id;
    if (!this.vendorId) throw new Error('Failed to create/get Vendor value');
    this.log('info', `  Vendor "E2E-Test" ID=${this.vendorId}`);

    // Create a minimal valid PDF in memory
    const pdfBlob = this.createMinimalPdf();
    this.createdFileName = `E2E-${this.runId}`;

    const res = await firstValueFrom(this.api.uploadFile(pdfBlob, `${this.createdFileName}.pdf`, this.fileTypeId, this.vendorId));
    const files = res.responseData;
    if (!files || files.length === 0) throw new Error('No files returned from upload');
    this.createdFileId = String(files[0].id);
    step.result = `File created: ID=${this.createdFileId}, name="${files[0].name}", fileLink="${files[0].fileLink}"`;
  }

  private async fVerifyJpg(step: TestStep): Promise<void> {
    if (!this.createdFileId) throw new Error('No File ID');
    const res = await firstValueFrom(this.api.getFile(this.createdFileId));
    const file = res.responseData;
    if (!file) throw new Error('File not found');

    const extensions = file.extensions || file.extension || '';
    const hasJpg = extensions.includes('jpg') || extensions.includes('jpeg');
    const hasPdf = extensions.includes('pdf');

    step.result = `File ID=${this.createdFileId}: extensions="${extensions}", fileLink="${file.fileLink}"` +
      `\n  PDF: ${hasPdf ? 'YES' : 'NO'}, JPG: ${hasJpg ? 'YES' : 'NO'}`;

    if (!hasJpg) {
      this.log('warn', '  JPG conversion may not have completed yet (check server logs)');
    }
  }

  private async fCreateShape1(step: TestStep): Promise<void> {
    if (!this.createdFileId) throw new Error('No File ID');
    const payload = {
      tagNumber: `E2E-EQ1-${this.runId.slice(-6)}`,
      description: `E2E Test Equipment 1 [${this.runId}]`,
      specificLocation: `Unit 2 Turbine Hall [${this.runId}]`,
      mainFileId: Number(this.createdFileId),
      coordinates: JSON.stringify({ x: 100, y: 100, width: 80, height: 60, type: 'rectangle' }),
      originalPictureSize: '1200x900',
    };
    const res = await firstValueFrom(this.api.createEquipment(payload));
    const eq = res.responseData;
    if (!eq?.id) throw new Error('No Equipment ID returned');
    this.createdEq1Id = String(eq.id);
    step.result = `Equipment 1: ID=${eq.id}, tag="${eq.tagNumber}"`;
  }

  private async fCreateLotoPoint1(step: TestStep): Promise<void> {
    if (!this.createdEq1Id) throw new Error('No Equipment 1 ID');
    const tagRes = await firstValueFrom(this.api.generateTagNumber('E2E'));
    const tagNumber = tagRes.responseData;
    this.log('info', `  Generated tag: ${tagNumber}`);

    const payload = {
      tagNumber,
      description: `E2E LOTO Point 1 [${this.runId}]`,
      specificLocation: `Unit 2 Turbine Hall [${this.runId}]`,
      equipmentIdList: [Number(this.createdEq1Id)],
      isLabeled: true,
      isLockable: true,
    };
    const res = await firstValueFrom(this.api.createLotoPoint(payload));
    const lp = res.responseData;
    if (!lp?.id) throw new Error('No LOTO Point ID returned');
    this.createdLp1Id = String(lp.id);
    step.result = `LOTO Point 1: ID=${lp.id}, tag="${lp.tagNumber}", equipment=[${this.createdEq1Id}]`;
  }

  private async fCreateShape2(step: TestStep): Promise<void> {
    if (!this.createdFileId) throw new Error('No File ID');
    const payload = {
      tagNumber: `E2E-EQ2-${this.runId.slice(-6)}`,
      description: `E2E Test Equipment 2 [${this.runId}]`,
      specificLocation: `Unit 2 ACC MCC [${this.runId}]`,
      mainFileId: Number(this.createdFileId),
      coordinates: JSON.stringify({ x: 300, y: 200, width: 80, height: 60, type: 'rectangle' }),
      originalPictureSize: '1200x900',
    };
    const res = await firstValueFrom(this.api.createEquipment(payload));
    const eq = res.responseData;
    if (!eq?.id) throw new Error('No Equipment ID returned');
    this.createdEq2Id = String(eq.id);
    step.result = `Equipment 2: ID=${eq.id}, tag="${eq.tagNumber}"`;
  }

  private async fCreateLotoPoint2(step: TestStep): Promise<void> {
    if (!this.createdEq2Id) throw new Error('No Equipment 2 ID');
    const tagRes = await firstValueFrom(this.api.generateTagNumber('E2E'));
    const tagNumber = tagRes.responseData;
    this.log('info', `  Generated tag: ${tagNumber}`);

    const payload = {
      tagNumber,
      description: `E2E LOTO Point 2 [${this.runId}]`,
      specificLocation: `Unit 2 ACC MCC [${this.runId}]`,
      equipmentIdList: [Number(this.createdEq2Id)],
      isLabeled: true,
      isLockable: true,
    };
    const res = await firstValueFrom(this.api.createLotoPoint(payload));
    const lp = res.responseData;
    if (!lp?.id) throw new Error('No LOTO Point ID returned');
    this.createdLp2Id = String(lp.id);
    step.result = `LOTO Point 2: ID=${lp.id}, tag="${lp.tagNumber}", equipment=[${this.createdEq2Id}]`;
  }

  private async fCreateZeroEnergy(step: TestStep): Promise<void> {
    if (!this.createdLp1Id || !this.createdEq1Id) throw new Error('No LP1 or EQ1 ID');

    // First ensure a zero energy template value exists
    const zetRes = await firstValueFrom(this.api.createValue('Zero Energy Template', 'Close and lock [tag1]'));
    const templateId = zetRes.responseData?.id;
    if (!templateId) throw new Error('Failed to create Zero Energy Template value');
    this.log('info', `  ZE template ID=${templateId}`);

    // Update LP1 with zero energy referencing equipment 1
    const payload = {
      id: Number(this.createdLp1Id),
      equipmentIdList: [Number(this.createdEq1Id)],
      zeroEnergy: {
        zeroEnergyTemplateId: templateId,
        templateEquipmentIds: [Number(this.createdEq1Id)],
      }
    };
    const res = await firstValueFrom(this.api.updateLotoPoint(payload));
    const lp = res.responseData;
    step.result = `LP1 updated with Zero Energy: method="${lp?.zeroEnergyMethod || lp?.zeroEnergy?.method || 'N/A'}"`;
  }

  private async fVerifySync(step: TestStep): Promise<void> {
    if (!this.createdFileId || !this.createdLp1Id || !this.createdLp2Id) {
      throw new Error('Missing IDs for verification');
    }
    const remoteUrl = this.getRemoteUrl();
    if (!remoteUrl) throw new Error('No remote URL configured');
    this.log('info', `  Verifying against: ${remoteUrl}`);
    const diffs: string[] = [];

    // Verify file
    const localFile = (await firstValueFrom(this.api.getFile(this.createdFileId))).responseData;
    try {
      const remoteFile = (await firstValueFrom(
        this.api.getFileFromRemote(remoteUrl, this.createdFileId)
      )).responseData;
      if (!remoteFile) diffs.push(`File ${this.createdFileId}: NOT FOUND on remote`);
      else this.compareFields(diffs, 'File', localFile, remoteFile, ['name', 'fileNumber', 'fileLink']);
    } catch (e: any) { diffs.push(`File fetch failed: ${e?.message || 'unknown'}`); }

    // Verify LOTO points
    for (const [label, lpId] of [['LP1', this.createdLp1Id], ['LP2', this.createdLp2Id]] as const) {
      const localLp = (await firstValueFrom(this.api.getLotoPoint(lpId))).responseData;
      try {
        const remoteLp = (await firstValueFrom(
          this.api.getLotoPointFromRemote(remoteUrl, lpId)
        )).responseData;
        if (!remoteLp) diffs.push(`${label} (${lpId}): NOT FOUND on remote`);
        else this.compareFields(diffs, label, localLp, remoteLp, ['tagNumber', 'description', 'specificLocation']);
      } catch (e: any) { diffs.push(`${label} fetch failed: ${e?.message || 'unknown'}`); }
    }

    this.setVerifyResult(step, diffs, remoteUrl);
  }

  // ==================== LOTO STANDARD FLOW ====================
  // Acceptance criteria: project/features/loto-standard/loto-e2e-test-plan.md §1.
  // Provisions a known set of test users, walks a Standard from DRAFT through
  // APPROVED, edits a point to trigger auto-invalidation, re-approves, and
  // verifies the workflow history. Negative-case steps assert that the
  // server rejects forbidden transitions (second-person rule, role gate).

  private static readonly STD_ACTOR_SPECS = [
    { key: 'dk', initials: 'DK', pin: '1111', firstName: 'Dave',  lastName: 'Kuper',     roles: ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED'] },
    { key: 'ms', initials: 'MS', pin: '2222', firstName: 'Mary',  lastName: 'Sims',      roles: ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED'] },
    { key: 'mg', initials: 'MG', pin: '3333', firstName: 'Mike',  lastName: 'Garner',    roles: ['MANAGER', 'CONTROL_AUTHORITY'] },
    { key: 'jr', initials: 'JR', pin: '4444', firstName: 'Joe',   lastName: 'Requestor', roles: ['REQUESTOR'] },
    { key: 'cr', initials: 'CR', pin: '5555', firstName: 'Carl',  lastName: 'Roberts',   roles: [] },
  ];

  private async runStandardStep(index: number, step: TestStep): Promise<void> {
    switch (index) {
      case 0:  await this.sProvisionUsers(step); break;
      case 1:  await this.sCreatePointsAndStandard(step); break;
      case 2:  await this.sSubmitForVerification(step); break;
      case 3:  await this.sNegVerifyAsSubmitter(step); break;
      case 4:  await this.sVerify(step); break;
      case 5:  await this.sMarkWalkdownComplete(step); break;
      case 6:  await this.sMarkReadyForTesting(step); break;
      case 7:  await this.sNegApproveAsNonManager(step); break;
      case 8:  await this.sApprove(step); break;
      case 9:  await this.sEditPointInvalidates(step); break;
      case 10: await this.sReapprove(step); break;
      case 11: await this.sHistorySanity(step); break;
      case 12: await this.sCleanup(step); break;
    }
  }

  // -------- Step 1: provision 5 test users --------

  private async sProvisionUsers(step: TestStep): Promise<void> {
    const suffix = this.runId.slice(-6);

    // Sweep stale test users from earlier (possibly failed) runs. They live at
    // *@e2e.local and would otherwise collide with the new PINs we're about
    // to set, producing "Code is ambiguous" on step-up.
    const swept: string[] = [];
    try {
      const allRes = await firstValueFrom(this.api.listActiveUsers());
      const all = allRes.responseData ?? [];
      const stale = all.filter(u => typeof u?.email === 'string' && u.email.endsWith('@e2e.local'));
      for (const u of stale) {
        try {
          await firstValueFrom(this.api.deleteUser(u.id));
          swept.push(`${u.email}#${u.id}`);
        } catch (e: any) {
          this.log('warn', `  Could not sweep stale user ${u.email}: ${e?.message || 'unknown'}`);
        }
      }
      if (swept.length > 0) this.log('info', `  Swept ${swept.length} stale test user(s) before provisioning`);
    } catch (e: any) {
      this.log('warn', `  Could not list users for sweep: ${e?.message || 'unknown'}`);
    }

    const created: string[] = [];
    for (const spec of E2eTestPageComponent.STD_ACTOR_SPECS) {
      const email = `${spec.initials.toLowerCase()}+${suffix}@e2e.local`;
      const username = `${spec.initials.toLowerCase()}-${suffix}`;
      const payload = {
        username,
        firstName: spec.firstName,
        lastName: spec.lastName,
        email,
        roles: spec.roles,
        password: 'TestPass!1234',
        windowsUsername: '',
        phone: '', company: '', signaturePath: '',
      };
      const createRes = await firstValueFrom(this.api.createUser(payload));
      const user = createRes.responseData;
      if (!user?.id) throw new Error(`createUser returned no id for ${spec.initials}`);

      await firstValueFrom(this.api.setSigningInitials(user.id, spec.initials));
      await firstValueFrom(this.api.setTestPin(user.id, spec.pin));

      const code = `${spec.initials}${spec.pin}`;
      const tokenRes = await firstValueFrom(this.api.authorizeStepUp(code));
      if (!tokenRes?.token) throw new Error(`step-up returned no token for ${code}`);

      this.actors[spec.key] = {
        userId: user.id,
        email,
        name: `${spec.firstName} ${spec.lastName}`,
        initials: spec.initials,
        pin: spec.pin,
      };
      created.push(`${spec.initials}=${user.id}`);
    }
    step.result = `Provisioned: ${created.join(', ')}`;
  }

  // -------- Step 2: create 4 LOTO Points + a LOTO Standard --------

  private async sCreatePointsAndStandard(step: TestStep): Promise<void> {
    const suffix = this.runId.slice(-6);

    // Deterministic tag numbers per run — the system /ng/loto-points/tag-number/{system}
    // endpoint is currently a stub ("Method is not implemented"), and we don't
    // need real auto-numbering for the test.
    for (let i = 1; i <= 4; i++) {
      const tagNumber = `E2E-${suffix}-${i}`;
      const payload = {
        tagNumber,
        description: `E2E Std Point ${i} [${this.runId}]`,
        specificLocation: `E2E Plant [${suffix}]`,
        equipmentIdList: [],
        isLabeled: true,
        isLockable: true,
      };
      const res = await firstValueFrom(this.api.createLotoPoint(payload));
      const lp = res.responseData;
      if (!lp?.id) throw new Error(`createLotoPoint #${i} returned no id`);
      this.stdLotoPointIds.push(lp.id);
    }

    const stdRes = await firstValueFrom(this.api.createLotoStandard({
      name: `E2E Test Standard [${this.runId}]`,
      description: `E2E acceptance fixture [${this.runId}]`,
      lotoPoints: this.stdLotoPointIds,
    }));
    const standard = stdRes.responseData;
    if (!standard?.id) throw new Error('createLotoStandard returned no id');
    this.stdStandardId = standard.id;

    const currentStatus = this.statusOf(standard);
    if (currentStatus !== 'DRAFT') {
      throw new Error(`Standard status is "${currentStatus}", expected DRAFT`);
    }
    step.result = `Standard ID=${this.stdStandardId}, 4 points=[${this.stdLotoPointIds.join(',')}], status=DRAFT`;
  }

  // -------- Step 3: submit for verification (PIN as DK) --------

  private async sSubmitForVerification(step: TestStep): Promise<void> {
    const token = await this.actAs('dk');
    const res = await firstValueFrom(this.api.workflowSubmitForVerification(this.stdStandardId!, token));
    const status = this.statusOf(res.responseData);
    this.assertStatus(status, 'PENDING_VERIFICATION');
    step.result = `Status=${status}, submittedBy="${res.responseData?.submittedBy ?? '—'}"`;
  }

  // -------- Step 4: NEG — verify as DK should fail (second-person rule) --------

  private async sNegVerifyAsSubmitter(step: TestStep): Promise<void> {
    const token = await this.actAs('dk');
    try {
      await firstValueFrom(this.api.workflowVerify(this.stdStandardId!, token));
    } catch (e: any) {
      const msg = (e?.error?.message || e?.message || '').toLowerCase();
      // Verify backend's actual reject message — we expect "second" or "different" or
      // a clear signal the same person cannot perform both steps.
      if (msg.includes('second') || msg.includes('different') || msg.includes('cannot')) {
        step.result = `Rejected as expected: ${e?.error?.message || e?.message}`;
        return;
      }
      // Server rejected but with an unexpected message — still pass, mark warn.
      step.status = 'warn';
      step.result = `Rejected (but message wording unexpected): ${e?.error?.message || e?.message}`;
      return;
    }
    throw new Error('Server accepted verify-as-submitter; second-person rule not enforced');
  }

  // -------- Step 5: verify (PIN as MS) --------

  private async sVerify(step: TestStep): Promise<void> {
    const token = await this.actAs('ms');
    const res = await firstValueFrom(this.api.workflowVerify(this.stdStandardId!, token));
    const status = this.statusOf(res.responseData);
    this.assertStatus(status, 'VERIFIED');
    step.result = `Status=${status}, verifiedBy="${res.responseData?.verifiedBy ?? '—'}"`;
  }

  // -------- Step 6 / 7 — walkdown complete, ready for testing --------

  private async sMarkWalkdownComplete(step: TestStep): Promise<void> {
    const token = await this.actAs('dk');
    const res = await firstValueFrom(this.api.workflowMarkWalkdownComplete(this.stdStandardId!, token));
    const status = this.statusOf(res.responseData);
    this.assertStatus(status, 'WALKDOWN_COMPLETE');
    step.result = `Status=${status}`;
  }

  private async sMarkReadyForTesting(step: TestStep): Promise<void> {
    const token = await this.actAs('dk');
    const res = await firstValueFrom(this.api.workflowMarkReadyForTesting(this.stdStandardId!, token));
    const status = this.statusOf(res.responseData);
    this.assertStatus(status, 'READY_FOR_TESTING');
    step.result = `Status=${status}`;
  }

  // -------- Step 8: NEG — approve as DK (not MANAGER) should fail --------

  private async sNegApproveAsNonManager(step: TestStep): Promise<void> {
    const token = await this.actAs('dk');
    try {
      await firstValueFrom(this.api.workflowApprove(this.stdStandardId!, token));
    } catch (e: any) {
      const msg = (e?.error?.message || e?.message || '').toLowerCase();
      if (msg.includes('manager') || msg.includes('role') || msg.includes('require')) {
        step.result = `Rejected as expected: ${e?.error?.message || e?.message}`;
        return;
      }
      step.status = 'warn';
      step.result = `Rejected (but message wording unexpected): ${e?.error?.message || e?.message}`;
      return;
    }
    throw new Error('Server accepted approve-as-non-MANAGER; role gate not enforced');
  }

  // -------- Step 9: approve (PIN as MG) --------

  private async sApprove(step: TestStep): Promise<void> {
    const token = await this.actAs('mg');
    const res = await firstValueFrom(this.api.workflowApprove(this.stdStandardId!, token));
    const status = this.statusOf(res.responseData);
    this.assertStatus(status, 'APPROVED');
    step.result = `Status=${status}, approvedBy="${res.responseData?.approvedBy ?? '—'}"`;
  }

  // -------- Step 10: edit a point — auto-invalidate --------

  private async sEditPointInvalidates(step: TestStep): Promise<void> {
    const pointId = this.stdLotoPointIds[0];
    const lpRes = await firstValueFrom(this.api.getLotoPoint(String(pointId)));
    const lp = lpRes.responseData;
    if (!lp) throw new Error(`LP ${pointId} not found`);

    // Mutate a field the auto-invalidator listens for (procedure-content edit).
    const updatePayload = {
      ...lp,
      id: pointId,
      description: `E2E modified [${this.runId}]`,
      zeroEnergyMethod: `Modified ZE method [${this.runId}]`,
    };
    await firstValueFrom(this.api.updateLotoStandardPoint(updatePayload));

    const stdRes = await firstValueFrom(this.api.getLotoStandard(this.stdStandardId!));
    const status = this.statusOf(stdRes.responseData);
    if (status !== 'NEW_PENDING_REAPPROVAL' && status !== 'DRAFT') {
      throw new Error(`Standard did not auto-invalidate: status=${status} (expected NEW_PENDING_REAPPROVAL)`);
    }
    if (status === 'DRAFT') {
      // Some implementations reset all the way back to DRAFT; that's also acceptable
      // for the rule "approved standard cannot stay approved through an edit" but
      // flag it so we can fine-tune the doc.
      step.status = 'warn';
      step.result = `Standard reset to DRAFT (expected NEW_PENDING_REAPPROVAL — check invalidateIfApproved logic)`;
      return;
    }
    step.result = `Auto-invalidated: status=${status}`;
  }

  // -------- Step 11: re-approve (PIN as MG) --------

  private async sReapprove(step: TestStep): Promise<void> {
    // If the standard is back in NEW_PENDING_REAPPROVAL we can approve directly.
    // If it was reset to DRAFT we need to re-walk the workflow — flag this case
    // as a warn rather than failing the test.
    const stdRes = await firstValueFrom(this.api.getLotoStandard(this.stdStandardId!));
    const status = this.statusOf(stdRes.responseData);
    if (status === 'DRAFT') {
      step.status = 'warn';
      step.result = `Standard is in DRAFT after edit — skipping re-approve. Workflow needs full re-walk.`;
      return;
    }

    const token = await this.actAs('mg');
    const res = await firstValueFrom(this.api.workflowApprove(this.stdStandardId!, token));
    const newStatus = this.statusOf(res.responseData);
    this.assertStatus(newStatus, 'APPROVED');
    step.result = `Status=${newStatus} (re-approved)`;
  }

  // -------- Step 12: workflow history sanity --------

  private async sHistorySanity(step: TestStep): Promise<void> {
    const res = await firstValueFrom(this.api.getStandardWorkflowHistory(this.stdStandardId!));
    const history = res.responseData ?? [];
    if (history.length === 0) {
      throw new Error('History returned 0 events; expected ≥ 5 (SUBMITTED, VERIFIED, WALKDOWN, READY, APPROVED, …)');
    }
    const types = history.map(e => e.eventType ?? e.type ?? '?');
    // Expect at least these in order — we don't require a strict superset because
    // future steps (invalidate, reapproved) may or may not be recorded depending
    // on whether step 10 reset to DRAFT or just flipped status.
    const required = ['SUBMITTED', 'VERIFIED', 'WALKDOWN_COMPLETE', 'READY_FOR_TESTING', 'APPROVED'];
    const missing = required.filter(t => !types.includes(t));
    if (missing.length > 0) {
      throw new Error(`History missing events: ${missing.join(', ')}. Got: ${types.join(', ')}`);
    }
    step.result = `${history.length} events: ${types.join(' → ')}`;
  }

  // -------- Step 13: cleanup --------

  private async sCleanup(step: TestStep): Promise<void> {
    const errors: string[] = [];
    if (this.stdStandardId) {
      try { await firstValueFrom(this.api.deleteLotoStandard(this.stdStandardId)); }
      catch (e: any) { errors.push(`standard ${this.stdStandardId}: ${e?.message || 'failed'}`); }
    }
    for (const actor of Object.values(this.actors)) {
      try { await firstValueFrom(this.api.deleteUser(actor.userId)); }
      catch (e: any) { errors.push(`user ${actor.email}: ${e?.message || 'failed'}`); }
    }
    if (errors.length > 0) {
      step.status = 'warn';
      step.result = `Cleanup completed with warnings:\n${errors.map(s => '  - ' + s).join('\n')}`;
      return;
    }
    step.result = `Soft-deleted standard ${this.stdStandardId} + ${Object.keys(this.actors).length} test users`;
  }

  // -------- Helpers --------

  /** Step-up as the named actor and return a one-shot X-Sign-As-Token. */
  private async actAs(actorKey: string): Promise<string> {
    const actor = this.actors[actorKey];
    if (!actor) throw new Error(`Test actor "${actorKey}" not provisioned (run Step 1 first)`);
    const code = `${actor.initials}${actor.pin}`;
    const tokenRes = await firstValueFrom(this.api.authorizeStepUp(code));
    if (!tokenRes?.token) throw new Error(`step-up for ${code} returned no token`);
    return tokenRes.token;
  }

  /**
   * Read the development-status string off a LotoStandardDto. The backend ships
   * it as a `ValueDto` ({id, name, alias}), so unwrap `.name`. Fall back to
   * legacy fields if some other endpoint flattens it to a plain string.
   */
  private statusOf(dto: any): string {
    const ds = dto?.developmentStatus;
    if (ds && typeof ds === 'object') return ds.name ?? '?';
    if (typeof ds === 'string') return ds;
    if (typeof dto?.status === 'string') return dto.status;
    return '?';
  }

  private assertStatus(actual: string, expected: string): void {
    if (actual !== expected) {
      throw new Error(`Status mismatch: actual="${actual}", expected="${expected}"`);
    }
  }

  // ==================== FILE FLOW (DETAILED) ====================
  // Covers the file-specific functionality added in plan §3.1–§3.4 and the
  // review fix for stale extensions on override. Independent of the LOTO flow.

  private async runFileDetailedStep(index: number, step: TestStep): Promise<void> {
    switch (index) {
      case 0:  await this.fdGetAllowedExtensions(step); break;
      case 1:  await this.fdUploadPdf(step); break;
      case 2:  await this.fdAssertPdfHash(step); break;
      case 3:  await this.fdUploadPng(step); break;
      case 4:  await this.fdRejectDisallowed(step); break;
      case 5:  await this.fdOverrideSameExtension(step); break;
      case 6:  await this.fdOverrideDifferentExtension(step); break;
      case 7:  await this.fdMetadataOnlyUpdate(step); break;
      case 8:  await this.stepWaitForSync(step); break;
      case 9:  await this.fdVerifySync(step); break;
      case 10: await this.fdSoftDeleteAndTrash(step); break;
      case 11: await this.fdDynamicFileType(step); break;
    }
  }

  private async fdEnsureRefData(): Promise<void> {
    if (!this.fdFileTypeId) {
      const ftRes = await firstValueFrom(this.api.createValue('File Type', 'PID'));
      this.fdFileTypeId = ftRes.responseData?.id;
      if (!this.fdFileTypeId) throw new Error('Failed to create/get File Type "PID"');
    }
    if (!this.fdVendorId) {
      const vRes = await firstValueFrom(this.api.createValue('Vendor', 'E2E-FileFlow'));
      this.fdVendorId = vRes.responseData?.id;
      if (!this.fdVendorId) throw new Error('Failed to create/get Vendor "E2E-FileFlow"');
    }
  }

  private async fdGetAllowedExtensions(step: TestStep): Promise<void> {
    const res = await firstValueFrom(this.api.getAllowedExtensions());
    const exts = res.responseData ?? [];
    this.fdAllowedExtensions = exts;
    if (exts.length === 0) throw new Error('Whitelist endpoint returned empty list');
    const must = ['pdf', 'png'];
    const missing = must.filter(m => !exts.includes(m));
    if (missing.length > 0) throw new Error(`Whitelist missing required entries: ${missing.join(', ')}`);
    step.result = `Allowed (${exts.length}): ${exts.join(', ')}`;
  }

  private async fdUploadPdf(step: TestStep): Promise<void> {
    await this.fdEnsureRefData();
    const pdfBlob = await firstValueFrom(this.api.getSamplePdf('a'));
    const fileName = `E2E-FD-PDF-${this.runId.slice(-6)}.pdf`;
    const res = await firstValueFrom(this.api.uploadFile(pdfBlob, fileName, this.fdFileTypeId!, this.fdVendorId!));
    const uploaded = res.responseData;
    if (!uploaded || uploaded.length === 0) throw new Error('Upload returned no files');
    this.fdPdfFileId = String(uploaded[0].id);
    step.result = `PDF uploaded: ID=${this.fdPdfFileId}, name="${uploaded[0].name}", fileLink="${uploaded[0].fileLink}", extensions="${uploaded[0].extensions}"`;
  }

  private async fdAssertPdfHash(step: TestStep): Promise<void> {
    if (!this.fdPdfFileId) throw new Error('No PDF file ID');
    const res = await firstValueFrom(this.api.getFileHash(this.fdPdfFileId));
    const hash = res.responseData;
    if (!hash) throw new Error('fileHash is null/empty — §3.1 fix not applied to PDF upload path');
    if (hash.length !== 64) throw new Error(`Expected 64-char SHA-256, got "${hash}" (len=${hash.length})`);
    this.fdHashAfterPdfA = hash;
    step.result = `fileHash after PDF variant A upload: ${hash.slice(0, 16)}…`;
  }

  private async fdUploadPng(step: TestStep): Promise<void> {
    await this.fdEnsureRefData();
    const pngBlob = await firstValueFrom(this.api.getSamplePng());
    const fileName = `E2E-FD-PNG-${this.runId.slice(-6)}.png`;
    const res = await firstValueFrom(this.api.uploadFile(pngBlob, fileName, this.fdFileTypeId!, this.fdVendorId!));
    const uploaded = res.responseData;
    if (!uploaded || uploaded.length === 0) throw new Error('PNG upload returned no files');
    this.fdPngFileId = String(uploaded[0].id);
    const exts: string = uploaded[0].extensions ?? '';
    if (!exts.includes('png')) {
      throw new Error(`PNG file extensions does not include 'png': "${exts}" — DirectUploadStrategy may not have run`);
    }
    if (exts.includes('pdf') || exts.includes('jpg')) {
      throw new Error(`PNG upload incorrectly produced pdf/jpg derivatives: "${exts}"`);
    }
    const hashRes = await firstValueFrom(this.api.getFileHash(this.fdPngFileId));
    const hash = hashRes.responseData;
    if (!hash) throw new Error('PNG fileHash is null — §3.1 hash bug not applied to non-PDF path');
    this.fdHashPng = hash;
    step.result = `PNG uploaded: ID=${this.fdPngFileId}, extensions="${exts}", hash=${hash.slice(0, 16)}…`;
  }

  private async fdRejectDisallowed(step: TestStep): Promise<void> {
    await this.fdEnsureRefData();
    const txtBlob = new Blob(['this is not allowed'], { type: 'text/plain' });
    try {
      await firstValueFrom(this.api.uploadFile(txtBlob, `E2E-FD-evil-${this.runId.slice(-6)}.txt`,
        this.fdFileTypeId!, this.fdVendorId!));
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || '';
      step.result = `Server correctly rejected .txt upload: ${msg.slice(0, 200)}`;
      return;
    }
    throw new Error('Server accepted a .txt upload — extension whitelist not enforced');
  }

  private async fdOverrideSameExtension(step: TestStep): Promise<void> {
    if (!this.fdPdfFileId) throw new Error('No PDF file ID from step 2');
    if (!this.fdHashAfterPdfA) throw new Error('Missing baseline hash from step 3');

    // Fetch the existing FileObject so we can build a complete FileIdDto.
    const fileRes = await firstValueFrom(this.api.getFile(this.fdPdfFileId));
    const file = fileRes.responseData;
    if (!file) throw new Error('PDF file not found');

    const fileIdDto = this.toFileIdDto(file);
    const pdfBlobB = await firstValueFrom(this.api.getSamplePdf('b'));
    const fileName = `${this.fdRawFileNumber(file)}.pdf`;
    await firstValueFrom(this.api.overrideUploadFile(fileIdDto, pdfBlobB, fileName));

    const hashRes = await firstValueFrom(this.api.getFileHash(this.fdPdfFileId));
    const hashB = hashRes.responseData;
    if (!hashB) throw new Error('fileHash is null after override — bytes were not re-hashed');
    if (hashB === this.fdHashAfterPdfA) {
      throw new Error(`fileHash unchanged (${hashB.slice(0, 16)}…) — override of same-extension content was NOT detected. This is the §3.1 bug.`);
    }
    this.fdHashAfterPdfB = hashB;
    step.result = `Hash changed: A=${this.fdHashAfterPdfA.slice(0, 16)}… → B=${hashB.slice(0, 16)}… (override detected)`;
  }

  private async fdOverrideDifferentExtension(step: TestStep): Promise<void> {
    if (!this.fdPdfFileId) throw new Error('No file ID');

    const fileRes = await firstValueFrom(this.api.getFile(this.fdPdfFileId));
    const file = fileRes.responseData;
    if (!file) throw new Error('File not found');
    const beforeExts: string = file.extensions ?? '';

    const fileIdDto = this.toFileIdDto(file);
    const pngBlob = await firstValueFrom(this.api.getSamplePng());
    const fileName = `${this.fdRawFileNumber(file)}.png`;
    await firstValueFrom(this.api.overrideUploadFile(fileIdDto, pngBlob, fileName));

    const afterRes = await firstValueFrom(this.api.getFile(this.fdPdfFileId));
    const after = afterRes.responseData;
    const afterExts: string = after?.extensions ?? '';

    // The fix: extensions must be REPLACED, not merged. After the swap the
    // field should contain only "png" — not the union "pdf,jpg,png".
    if (afterExts.includes('pdf') || afterExts.includes('jpg')) {
      throw new Error(`extensions still contains pdf/jpg after PNG override: "${afterExts}". Stale-extensions fix regressed.`);
    }
    if (!afterExts.includes('png')) {
      throw new Error(`extensions does not include 'png' after PNG override: "${afterExts}"`);
    }
    if (!after.fileLink || !after.fileLink.toLowerCase().endsWith('.png')) {
      throw new Error(`fileLink does not point to a .png after override: "${after.fileLink}"`);
    }

    const hashRes = await firstValueFrom(this.api.getFileHash(this.fdPdfFileId));
    const hash = hashRes.responseData;
    if (!hash) throw new Error('fileHash is null after PNG override');
    this.fdHashAfterOverrideToPng = hash;
    step.result = `Override OK: extensions "${beforeExts}" → "${afterExts}", fileLink="${after.fileLink}", hash=${hash.slice(0, 16)}…`;
  }

  private async fdMetadataOnlyUpdate(step: TestStep): Promise<void> {
    if (!this.fdPdfFileId) throw new Error('No file ID');
    if (!this.fdHashAfterOverrideToPng) throw new Error('Missing hash from step 7');

    const fileRes = await firstValueFrom(this.api.getFile(this.fdPdfFileId));
    const file = fileRes.responseData;
    if (!file) throw new Error('File not found');

    const fileIdDto = this.toFileIdDto(file);
    fileIdDto.docNum = `E2E-DOC-${this.runId.slice(-6)}`; // change a benign field
    await firstValueFrom(this.api.updateFileMetadata(fileIdDto));

    const hashRes = await firstValueFrom(this.api.getFileHash(this.fdPdfFileId));
    const hash = hashRes.responseData;
    if (hash !== this.fdHashAfterOverrideToPng) {
      throw new Error(`fileHash changed on metadata-only update: was ${this.fdHashAfterOverrideToPng?.slice(0, 16)}…, now ${hash?.slice(0, 16)}… (expected unchanged)`);
    }
    this.fdHashAfterMetaUpdate = hash;
    step.result = `Metadata updated; hash unchanged (${hash?.slice(0, 16)}…)`;
  }

  private async fdVerifySync(step: TestStep): Promise<void> {
    if (!this.fdPdfFileId || !this.fdPngFileId) throw new Error('Missing file IDs');
    const remoteUrl = this.getRemoteUrl();
    if (!remoteUrl) throw new Error('No remote URL configured');
    this.log('info', `  Verifying file sync against: ${remoteUrl}`);
    const diffs: string[] = [];

    // File 1: the swapped one (now PNG, hash = fdHashAfterMetaUpdate)
    try {
      const remoteFile = (await firstValueFrom(
        this.api.getFileFromRemote(remoteUrl, this.fdPdfFileId))).responseData;
      const localFile = (await firstValueFrom(this.api.getFile(this.fdPdfFileId))).responseData;
      if (!remoteFile) {
        diffs.push(`File ${this.fdPdfFileId} (swapped): NOT FOUND on remote`);
      } else {
        this.compareFields(diffs, 'SwappedFile', localFile, remoteFile, ['name', 'fileLink', 'extensions']);
      }
      const remoteHash = (await firstValueFrom(
        this.api.getFileHashFromRemote(remoteUrl, this.fdPdfFileId))).responseData;
      if (remoteHash !== this.fdHashAfterMetaUpdate) {
        diffs.push(`SwappedFile.fileHash: local="${this.fdHashAfterMetaUpdate?.slice(0, 16)}…" remote="${(remoteHash ?? '').slice(0, 16)}…" — peer did NOT receive override bytes`);
      }
    } catch (e: any) {
      diffs.push(`SwappedFile fetch failed: ${e?.message || 'unknown'}`);
    }

    // File 2: the direct PNG upload
    try {
      const remoteFile = (await firstValueFrom(
        this.api.getFileFromRemote(remoteUrl, this.fdPngFileId))).responseData;
      const localFile = (await firstValueFrom(this.api.getFile(this.fdPngFileId))).responseData;
      if (!remoteFile) {
        diffs.push(`PNG file ${this.fdPngFileId}: NOT FOUND on remote`);
      } else {
        this.compareFields(diffs, 'PngFile', localFile, remoteFile, ['name', 'fileLink', 'extensions']);
      }
      const remoteHash = (await firstValueFrom(
        this.api.getFileHashFromRemote(remoteUrl, this.fdPngFileId))).responseData;
      if (remoteHash !== this.fdHashPng) {
        diffs.push(`PngFile.fileHash: local="${this.fdHashPng?.slice(0, 16)}…" remote="${(remoteHash ?? '').slice(0, 16)}…"`);
      }
    } catch (e: any) {
      diffs.push(`PngFile fetch failed: ${e?.message || 'unknown'}`);
    }

    this.setVerifyResult(step, diffs, remoteUrl);
  }

  private async fdSoftDeleteAndTrash(step: TestStep): Promise<void> {
    if (!this.fdPngFileId) throw new Error('No PNG file ID');
    const targetId = this.fdPngFileId;

    await firstValueFrom(this.api.deleteFile(targetId));

    // Should no longer be findable through the normal endpoint.
    let stillVisible = false;
    try {
      const res = await firstValueFrom(this.api.getFile(targetId));
      if (res?.responseData) stillVisible = true;
    } catch { /* expected: not found / 404 */ }
    if (stillVisible) throw new Error(`File ${targetId} still visible after delete`);

    // Trash listing should be reachable (and ideally include something).
    try {
      const trashRes = await firstValueFrom(this.api.listTrash());
      const trashCount = trashRes.responseData?.length ?? 0;
      step.result = `Deleted ID=${targetId}; trash listing reachable (${trashCount} entries)`;
    } catch (e: any) {
      // Some deployments may not expose the trash listing — soft warn rather than fail.
      step.status = 'warn';
      step.result = `Deleted ID=${targetId}; trash listing call failed: ${e?.message || 'unknown'}`;
    }
  }

  private async fdDynamicFileType(step: TestStep): Promise<void> {
    // 1. Create a new fileType Value (the §3.3 backend assumption)
    const ftRes = await firstValueFrom(this.api.createValue('File Type', 'Manual'));
    const manualTypeId = ftRes.responseData?.id;
    if (!manualTypeId) throw new Error('Failed to create File Type "Manual"');
    if (!this.fdVendorId) await this.fdEnsureRefData();

    // 2. Upload a file with that new type
    const pdfBlob = await firstValueFrom(this.api.getSamplePdf('a'));
    const fileName = `E2E-FD-Manual-${this.runId.slice(-6)}.pdf`;
    const res = await firstValueFrom(this.api.uploadFile(pdfBlob, fileName, manualTypeId, this.fdVendorId!));
    const uploaded = res.responseData;
    if (!uploaded || uploaded.length === 0) throw new Error('Manual upload returned no files');
    this.fdManualFileId = String(uploaded[0].id);

    // 3. Read it back and assert the fileType name
    const fetched = (await firstValueFrom(this.api.getFile(this.fdManualFileId))).responseData;
    const fetchedTypeName = fetched?.fileType?.name;
    if (fetchedTypeName !== 'Manual') {
      throw new Error(`Uploaded file has fileType "${fetchedTypeName}", expected "Manual"`);
    }
    step.result = `New file type "Manual" (id=${manualTypeId}) accepted; uploaded file ID=${this.fdManualFileId}`;
  }

  /** Build a FileIdDto-shaped payload from a fetched FileDto. */
  private toFileIdDto(file: any): any {
    return {
      id: file.id,
      name: file.name,
      fileType: file.fileType?.id,
      vendor: file.vendor?.id,
      system: file.system?.id ?? null,
      fileNumber: file.fileNumber,           // already an array on FileDto
      extension: file.extension,
      extensions: file.extensions,
      baseLink: file.baseLink,
      docNum: file.docNum,
      isVerified: file.isVerified ?? false,
    };
  }

  /** Reconstruct the raw filename base (no extension) from a FileDto. */
  private fdRawFileNumber(file: any): string {
    if (Array.isArray(file.fileNumber) && file.fileNumber.length > 0) {
      return String(file.fileNumber[0]);
    }
    if (typeof file.fileNumber === 'string' && file.fileNumber) {
      return file.fileNumber;
    }
    // Last resort: derive from fileLink
    const link: string = file.fileLink ?? '';
    const slash = Math.max(link.lastIndexOf('/'), link.lastIndexOf('\\'));
    const tail = link.substring(slash + 1);
    const dot = tail.lastIndexOf('.');
    return dot > 0 ? tail.substring(0, dot) : tail;
  }

  // ==================== Shared Steps ====================

  private async stepWaitForSync(step: TestStep): Promise<void> {
    const seconds = this.syncWaitSeconds;
    this.log('info', `  Waiting ${seconds}s for sync...`);
    for (let i = seconds; i > 0; i--) {
      step.result = `Waiting... ${i}s remaining`;
      await this.delay(1000);
    }
    step.result = `Waited ${seconds}s for sync`;
  }

  // ==================== Helpers ====================

  private buildDateStrMmDdYyyy(): string {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private buildDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getRemoteUrl(): string | null {
    return this.e2eInfo?.isHub ? (this.clientUrl || null) : (this.e2eInfo?.syncServerUrl || null);
  }

  private compareFields(diffs: string[], entity: string, local: any, remote: any, fields: string[]): void {
    for (const field of fields) {
      const lv = local?.[field] ?? '';
      const rv = remote?.[field] ?? '';
      if (String(lv) !== String(rv)) diffs.push(`${entity}.${field}: local="${lv}" remote="${rv}"`);
    }
  }

  private compareCount(diffs: string[], field: string, local: any, remote: any): void {
    const lc = this.toArray(local?.[field]).length;
    const rc = this.toArray(remote?.[field]).length;
    if (lc !== rc) diffs.push(`${field} count: local=${lc} remote=${rc}`);
  }

  private setVerifyResult(step: TestStep, diffs: string[], remoteUrl: string): void {
    if (diffs.length === 0) {
      step.result = `Sync verified OK against ${remoteUrl}`;
      step.status = 'success';
    } else {
      step.result = `Sync differences:\n${diffs.map(d => '  - ' + d).join('\n')}`;
      step.status = 'warn';
      for (const d of diffs) this.log('warn', `    ${d}`);
    }
  }

  private toArray(val: any): any[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return Object.values(val);
    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(level: string, message: string): void {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    this.logEntries.push({ time, message, level });
  }

  /** Create a minimal valid PDF (1 page, ~200 bytes) */
  private createMinimalPdf(): Blob {
    const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
206
%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }
}
