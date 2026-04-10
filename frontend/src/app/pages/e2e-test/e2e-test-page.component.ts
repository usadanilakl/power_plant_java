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

type FlowType = 'permits' | 'files' | 'file-detailed';

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

  get currentSteps(): TestStep[] {
    if (this.selectedFlow === 'permits') return this.permitSteps;
    if (this.selectedFlow === 'files') return this.fileSteps;
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
    } else {
      this.fdFileTypeId = this.fdVendorId = null;
      this.fdAllowedExtensions = [];
      this.fdPdfFileId = this.fdPngFileId = this.fdManualFileId = null;
      this.fdHashAfterPdfA = this.fdHashAfterPdfB = null;
      this.fdHashAfterOverrideToPng = this.fdHashAfterMetaUpdate = this.fdHashPng = null;
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
