import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { E2eTestService } from '../../services/e2e-test.service';
import { firstValueFrom } from 'rxjs';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  error?: string;
}

@Component({
  selector: 'app-e2e-test-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="e2e-container">
          <div class="e2e-header">
            <h2>E2E Test Runner</h2>
            <div class="run-id-display">
              <span class="label">Run ID:</span>
              <code>{{ runId }}</code>
              <button class="btn btn-sm" (click)="regenerateRunId()" [disabled]="isRunning">New ID</button>
            </div>
          </div>

          <div class="controls">
            <button class="btn btn-primary" (click)="runAll()" [disabled]="isRunning">
              {{ isRunning ? 'Running...' : 'Run All Steps' }}
            </button>
            <button class="btn btn-secondary" (click)="resetAll()" [disabled]="isRunning">Reset</button>
          </div>

          <div class="steps-container">
            <div class="step-card" *ngFor="let step of steps; let i = index">
              <div class="step-header">
                <span class="step-number">{{ i + 1 }}</span>
                <span class="step-name">{{ step.name }}</span>
                <span class="step-status" [class]="step.status">
                  {{ step.status === 'pending' ? '--' : step.status === 'running' ? 'Running...' : step.status === 'success' ? 'OK' : 'FAIL' }}
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
    .run-id-display {
      display: flex; align-items: center; gap: 10px;
      background: #f5f5f5; padding: 8px 14px; border-radius: 6px; font-size: 14px;
    }
    .run-id-display .label { font-weight: 600; color: #666; }
    .run-id-display code { background: #fff; padding: 2px 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px; }
    .controls { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn {
      padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer;
      font-size: 14px; font-weight: 500; transition: background 0.2s;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #1976d2; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #1565c0; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-secondary:hover:not(:disabled) { background: #d0d0d0; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .btn-outline { background: transparent; border: 1px solid #bbb; color: #555; }
    .btn-outline:hover:not(:disabled) { background: #f0f0f0; }
    .steps-container { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .step-card {
      border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px;
      background: #fff; transition: border-color 0.2s;
    }
    .step-header { display: flex; align-items: center; gap: 12px; }
    .step-number {
      width: 28px; height: 28px; border-radius: 50%; background: #e3f2fd;
      color: #1976d2; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .step-name { flex: 1; font-weight: 500; color: #333; }
    .step-status {
      font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 12px;
      text-transform: uppercase; min-width: 70px; text-align: center;
    }
    .step-status.pending { background: #f5f5f5; color: #999; }
    .step-status.running { background: #fff3e0; color: #e65100; }
    .step-status.success { background: #e8f5e9; color: #2e7d32; }
    .step-status.error { background: #ffebee; color: #c62828; }
    .step-result { margin-top: 8px; }
    .step-result pre {
      background: #f5f5f5; padding: 8px 12px; border-radius: 4px;
      font-size: 12px; color: #2e7d32; white-space: pre-wrap; margin: 0;
    }
    .step-error { margin-top: 8px; }
    .step-error pre {
      background: #fff5f5; padding: 8px 12px; border-radius: 4px;
      font-size: 12px; color: #c62828; white-space: pre-wrap; margin: 0;
    }
    .log-section h3 { color: #555; margin-bottom: 8px; font-size: 15px; }
    .log-area {
      background: #1e1e1e; color: #d4d4d4; padding: 14px; border-radius: 8px;
      max-height: 300px; overflow-y: auto; font-family: 'Consolas', 'Courier New', monospace;
      font-size: 12px;
    }
    .log-entry { padding: 2px 0; display: flex; gap: 8px; }
    .log-entry.error .log-msg { color: #f44336; }
    .log-entry.success .log-msg { color: #66bb6a; }
    .log-entry.info .log-msg { color: #42a5f5; }
    .log-time { color: #888; flex-shrink: 0; }
    .log-msg { word-break: break-all; }
    .log-empty { color: #888; font-style: italic; }
  `]
})
export class E2eTestPageComponent {
  private api = inject(E2eTestService);

  runId = this.generateRunId();
  isRunning = false;
  logEntries: { time: string; message: string; level: string }[] = [];

  // State tracked across steps
  private createdWrId: string | null = null;
  private createdJobId: string | null = null;
  private createdPackageId: string | null = null;
  private createdSafeWorkId: string | null = null;
  private createdHotWorkId: string | null = null;
  private createdConfinedSpaceId: string | null = null;

  steps: TestStep[] = [
    { name: 'Create Work Request', status: 'pending' },
    { name: 'Create Job & Process WR into Package', status: 'pending' },
    { name: 'Create SafeWork Permit', status: 'pending' },
    { name: 'Create HotWork Permit', status: 'pending' },
    { name: 'Create ConfinedSpace Permit', status: 'pending' },
    { name: 'Attach All Permits to Package', status: 'pending' },
  ];

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

  resetAll(): void {
    this.steps.forEach(s => { s.status = 'pending'; s.result = undefined; s.error = undefined; });
    this.logEntries = [];
    this.createdWrId = null;
    this.createdJobId = null;
    this.createdPackageId = null;
    this.createdSafeWorkId = null;
    this.createdHotWorkId = null;
    this.createdConfinedSpaceId = null;
    this.regenerateRunId();
  }

  canRunStep(index: number): boolean {
    if (index === 0) return true;
    // Steps 1+ depend on prior steps completing
    return this.steps[index - 1].status === 'success';
  }

  async runAll(): Promise<void> {
    this.isRunning = true;
    this.log('info', `=== Starting E2E run: ${this.runId} ===`);
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i].status === 'success') continue;
      await this.runSingleStep(i);
      if (this.steps[i].status === 'error') {
        this.log('error', `Run stopped at step ${i + 1} due to error.`);
        break;
      }
    }
    this.isRunning = false;
    this.log('info', `=== E2E run finished ===`);
  }

  async runSingleStep(index: number): Promise<void> {
    const step = this.steps[index];
    step.status = 'running';
    step.result = undefined;
    step.error = undefined;
    this.log('info', `Step ${index + 1}: ${step.name}...`);

    try {
      switch (index) {
        case 0: await this.stepCreateWorkRequest(step); break;
        case 1: await this.stepCreateJobAndProcessWR(step); break;
        case 2: await this.stepCreateSafeWork(step); break;
        case 3: await this.stepCreateHotWork(step); break;
        case 4: await this.stepCreateConfinedSpace(step); break;
        case 5: await this.stepAttachPermits(step); break;
      }
      step.status = 'success';
      this.log('success', `Step ${index + 1}: ${step.name} - OK`);
    } catch (e: any) {
      step.status = 'error';
      step.error = e?.error?.message || e?.message || JSON.stringify(e);
      this.log('error', `Step ${index + 1}: ${step.name} - FAILED: ${step.error}`);
    }
  }

  // ==================== Step Implementations ====================

  private async stepCreateWorkRequest(step: TestStep): Promise<void> {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    const payload = [{
      dateOfWorkToBePerformed: dateStr,
      timeOfWorkToBePerformed: '08:00',
      requestedBy: `Test User [${this.runId}]`,
      company: `Test Company [${this.runId}]`,
      location: `Unit 2 Turbine Hall [${this.runId}]`,
      workScope: `E2E Test Work Scope [${this.runId}]`,
      foreman: `Test Foreman [${this.runId}]`,
      affectedEquipment: `Test Equipment [${this.runId}]`,
      isHotWorkRequired: true,
      isLotoRequired: true,
      isConfinedSpaceEntryRequired: true,
      status: 'Active'
    }];

    const res = await firstValueFrom(this.api.createWorkRequest(payload));
    const wr = res.responseData?.[0];
    if (!wr?.id) throw new Error('No WR ID returned');
    this.createdWrId = String(wr.id);
    step.result = `WR created: ID=${wr.id}, permitNumber=${wr.permitNumber || 'N/A'}`;
  }

  private async stepCreateJobAndProcessWR(step: TestStep): Promise<void> {
    if (!this.createdWrId) throw new Error('No WR ID from previous step');

    // Create job
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    const jobPayload = {
      workScope: `E2E Test Job [${this.runId}]`,
      company: `Test Company [${this.runId}]`,
      foreman: `Test Foreman [${this.runId}]`,
      location: `Unit 2 Turbine Hall [${this.runId}]`,
      startDate: dateStr
    };

    const jobRes = await firstValueFrom(this.api.createJob(jobPayload));
    const job = jobRes.responseData;
    if (!job?.id) throw new Error('No Job ID returned');
    this.createdJobId = String(job.id);
    this.log('info', `  Job created: ID=${job.id}, permitNumber=${job.permitNumber || 'N/A'}`);

    // Process WR into job (creates package automatically)
    const processRes = await firstValueFrom(this.api.processWorkRequest(this.createdJobId, this.createdWrId));
    const updatedJob = processRes.responseData;
    const packages = updatedJob?.packages;
    if (packages && packages.length > 0) {
      // Find the package that was just created (last one)
      const pkg = packages[packages.length - 1];
      this.createdPackageId = String(pkg.id);
      step.result = `Job ID=${this.createdJobId}, Package ID=${this.createdPackageId}, permitNumber=${pkg.permitNumber || 'N/A'}`;
    } else {
      throw new Error('No package created from processWorkRequest');
    }
  }

  private async stepCreateSafeWork(step: TestStep): Promise<void> {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    const payload = {
      date: dateStr,
      time: '08:00',
      companyPerson: `Test Company/Test Person [${this.runId}]`,
      location: `Unit 2 Turbine Hall [${this.runId}]`,
      workScope: `E2E SafeWork Scope [${this.runId}]`,
      specialInstructions: `E2E test instructions [${this.runId}]`,
      requestedBy: `Test Requestor [${this.runId}]`,
      hazards: {
        highTemp: true, highPressure: false, energized: true, storedEnergy: false,
        eyeHazard: true, egressAccess: false, ergonomicHazard: false,
        fallingObject: true, highNoise: false, dustParticulate: false,
        combustibleDust: false, fireHazard: true, hotSurface: false,
        slippery: false, ventilationRequired: true, lightingRestrictions: false,
        chemicalExposure: false, liftingHazard: false, handTraps: false
      },
      permits: {
        safeWorkPermit: true, hotWorkPermit: true, confinedSpacePermit: true,
        lotoRequired: true, excavationPermit: false, ventingPermit: false
      },
      ppe: {
        hardHat: true, safetyGlasses: true, steelToeBoots: true,
        hearingProtection: false, gloves: true, frClothing: true,
        faceShield: false, respirator: false, fallProtection: false
      }
    };

    const res = await firstValueFrom(this.api.createSafeWork(payload));
    const sw = res.responseData;
    if (!sw?.id) throw new Error('No SafeWork ID returned');
    this.createdSafeWorkId = String(sw.id);
    step.result = `SafeWork created: ID=${sw.id}, permitNumber=${sw.permitNumber || 'N/A'}`;
  }

  private async stepCreateHotWork(step: TestStep): Promise<void> {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    const payload = {
      date: dateStr,
      foreman: `Test Foreman [${this.runId}]`,
      fireWatch: `Test FireWatch [${this.runId}]`,
      meterModel: 'MSA Altair 5X',
      meterNum: `E2E-${this.runId.slice(-4)}`,
      specialInstructions: `E2E hot work instructions [${this.runId}]`,
      location: `Unit 2 Turbine Hall [${this.runId}]`,
      workScope: `E2E HotWork Scope [${this.runId}]`,
      isFireWatchRequired: true,
      timeOfInitialTest: '07:30',
      initialTestResult: 'Pass',
      measures: {
        fireExtinguisher: true, fireHoses: true, sprinklerProtection: false,
        coverFloors: true, coverWalls: false, coverCeilings: false,
        moveEquipment: true, coverEquipment: false,
        shutdownDucts: false, coverOpenings: true,
        monitorAdjacentAreas: true, monitorFloorAbove: false,
        monitorFloorBelow: false, assignFireWatch: true,
        fireWatchDuration: '60 min'
      }
    };

    const res = await firstValueFrom(this.api.createHotWork(payload));
    const hw = res.responseData;
    if (!hw?.id) throw new Error('No HotWork ID returned');
    this.createdHotWorkId = String(hw.id);
    step.result = `HotWork created: ID=${hw.id}, permitNumber=${hw.permitNumber || 'N/A'}`;
  }

  private async stepCreateConfinedSpace(step: TestStep): Promise<void> {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    const payload = {
      date: dateStr,
      time: '08:00',
      space: `Condenser A Waterbox [${this.runId}]`,
      issuedTo: `Test Worker [${this.runId}]`,
      duration: '4 hours',
      meterModel: 'MSA Altair 5X',
      meterNum: `E2E-${this.runId.slice(-4)}`,
      calibrated: 'Yes',
      oxygen: '20.9',
      lel: '0',
      hydrogenSulfide: '0',
      carbonMonoxide: '0',
      ammonia: '0',
      timeOfSample: '07:45',
      testerInitials: 'E2E',
      workScope: `E2E ConfinedSpace Scope [${this.runId}]`,
      hazards: {
        oxygenDeficiency: true, oxygenEnrichment: false,
        flammableGas: false, toxicGas: true,
        mechanicalHazard: true, electricalHazard: false,
        thermalHazard: false, engulfment: false,
        fallHazard: true, noiseHazard: false
      },
      precautions: {
        lockoutTagout: true, lineBreaking: false,
        ventilation: true, monitoring: true,
        communication: true, rescuePlan: true,
        hotWorkPermit: false, standbyPerson: true
      },
      ppe: {
        hardHat: true, safetyGlasses: true, steelToeBoots: true,
        gloves: true, respirator: true, harness: true,
        lifeline: true, coveralls: false
      }
    };

    const res = await firstValueFrom(this.api.createConfinedSpace(payload));
    const cs = res.responseData;
    if (!cs?.id) throw new Error('No ConfinedSpace ID returned');
    this.createdConfinedSpaceId = String(cs.id);
    step.result = `ConfinedSpace created: ID=${cs.id}, permitNumber=${cs.permitNumber || 'N/A'}`;
  }

  private async stepAttachPermits(step: TestStep): Promise<void> {
    if (!this.createdPackageId) throw new Error('No Package ID from previous steps');

    const payload: any = { id: Number(this.createdPackageId) };

    // Attach permits by ID sets
    if (this.createdSafeWorkId) payload.safeWorkIds = [Number(this.createdSafeWorkId)];
    if (this.createdHotWorkId) payload.hotWorkIds = [Number(this.createdHotWorkId)];
    if (this.createdConfinedSpaceId) payload.confinedSpaceIds = [Number(this.createdConfinedSpaceId)];

    const res = await firstValueFrom(this.api.updatePackage(this.createdPackageId, payload));
    const pkg = res.responseData;

    const counts = [
      pkg?.safeWorks?.length ? `${pkg.safeWorks.length} SafeWork` : null,
      pkg?.hotWorks?.length ? `${pkg.hotWorks.length} HotWork` : null,
      pkg?.confinedSpaces?.length ? `${pkg.confinedSpaces.length} ConfinedSpace` : null,
      pkg?.workRequests?.length ? `${pkg.workRequests.length} WR` : null,
    ].filter(Boolean).join(', ');

    step.result = `Package ${this.createdPackageId} updated. Contains: ${counts || 'permits attached'}`;
  }

  // ==================== Logging ====================

  private log(level: string, message: string): void {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    this.logEntries.push({ time, message, level });
  }
}
