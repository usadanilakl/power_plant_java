import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { CurrentWorkRequestService } from '../../../../services/current-items-services/current-work-requests.service';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { DailyPermitPackageService } from '../../../../services/permits/daily-permit-package.service';
import { JobLogDto } from '../../../../models/permits/job-log.model';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';

@Component({
  selector: 'app-rf-job-log-form',
  standalone: true,
  imports: [RfReactiveFormComponent, FormsModule],
  template: `
    <div class="job-log-container">

      @if(errorMessage()) {
        <div class="error-banner" (click)="errorMessage.set('')">
          {{ errorMessage() }} <span class="dismiss">(click to dismiss)</span>
        </div>
      }

      <app-rf-reactive-form
        [fields]="fields()"
        [entity]="entity()"
        [title]="'Job Log'"
        [submitButtonText]="isExistingJob() ? 'Update' : 'Create'"
        [deleteButtonText]="isExistingJob() ? 'Delete' : ''"
        (formSubmit)="onSubmit($event)"
        (formDelete)="onDelete()"
      ></app-rf-reactive-form>

      @if(isExistingJob()) {
        <div class="job-status-section">
          <span class="status-badge" [attr.data-status]="jobStatus()">{{ jobStatus() }}</span>
          @switch(jobStatus()) {
            @case('Open') {
              <span class="status-hint">Activate a package to move job to Active</span>
            }
            @case('Active') {
              <span class="status-hint">Close all packages to close the job</span>
            }
          }
          @if(jobStatus() !== 'Closed' && canCloseJob()) {
            <button class="status-btn close" (click)="closeJob()">Close Job</button>
          }
        </div>

        <div class="packages-section">
          <div class="packages-header">
            <h3>Daily Packages ({{ packages().length }})</h3>
            <div class="header-actions">
              <button class="merge-btn" (click)="openMergeDialog()">Merge Into...</button>
              <button class="create-package-btn" (click)="isAddPackageDialogOpen.set(true)">+ Add Package</button>
            </div>
          </div>

          @if(packages().length > 0) {
            <div class="package-cards">
              @for(pkg of packages(); track pkg.id) {
                <div class="package-card">
                  <div class="package-info" (click)="openPackage(pkg)">
                    <div class="pkg-header">
                      <span class="pkg-name">{{ pkg.permitNumber || pkg.name || 'Package #' + pkg.id }}</span>
                      <span class="pkg-date">{{ pkg.date || '' }}</span>
                      <span class="status-badge" [attr.data-status]="pkg.packageStatus?.name || 'Building'">
                        {{ pkg.packageStatus?.name || 'Building' }}
                      </span>
                    </div>
                    @if (getPackageLocation(pkg) || getPackageWorkScope(pkg)) {
                      <div class="pkg-details">
                        @if (getPackageLocation(pkg)) {
                          <span class="pkg-location">{{ getPackageLocation(pkg) }}</span>
                        }
                        @if (getPackageWorkScope(pkg)) {
                          <span class="pkg-scope">{{ getPackageWorkScope(pkg) }}</span>
                        }
                      </div>
                    }
                  </div>
                  <div class="package-actions-inline">
                    @switch(pkg.packageStatus?.name || 'Building') {
                      @case('Building') {
                        <button class="status-btn activate" (click)="activatePackage(pkg)">Activate</button>
                      }
                      @case('Active') {
                        <button class="status-btn test" (click)="putPackageUnderTest(pkg)">Test</button>
                        <button class="status-btn close" (click)="openPackageClosureDialog(pkg)">Close</button>
                      }
                      @case('Test') {
                        <button class="status-btn activate" (click)="activatePackage(pkg)">Reactivate</button>
                        <button class="status-btn close" (click)="openPackageClosureDialog(pkg)">Close</button>
                      }
                    }
                    <button class="action-btn move" (click)="openMoveDialog(pkg)" title="Move to another job">&#8594;</button>
                    <button class="action-btn detach" (click)="detachPackage(pkg)" title="Detach from job">x</button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="no-packages">No packages attached to this job yet.</p>
          }
        </div>
      }

      @if(isAddPackageDialogOpen()) {
        <div class="dialog-overlay" (click)="isAddPackageDialogOpen.set(false)">
          <div class="dialog add-package-dialog" (click)="$event.stopPropagation()">
            <h3>Add Package to Job</h3>

            <div class="add-option" (click)="createEmptyPackage()">
              <span class="option-icon">+</span>
              <div>
                <strong>Create Empty Package</strong>
                <p>Start with a blank package and add permits manually</p>
              </div>
            </div>

            <div class="tab-bar">
              <button class="tab-btn" [class.active]="addPackageTab() === 'workRequests'" (click)="addPackageTab.set('workRequests')">
                Work Requests ({{ activeWorkRequests().length }})
              </button>
              <button class="tab-btn" [class.active]="addPackageTab() === 'reissue'" (click)="addPackageTab.set('reissue')">
                Reissue Package ({{ reissueablePackages().length }})
              </button>
            </div>

            <div class="tab-content">
              @if(addPackageTab() === 'workRequests') {
                @if(activeWorkRequests().length > 0) {
                  <div class="tab-list">
                    @for(wr of activeWorkRequests(); track wr.id) {
                      <div class="list-item" (click)="generateFromSelectedWorkRequest(wr)">
                        <div class="item-main">
                          <span class="item-name">{{ wr.name || 'WR #' + wr.id }}</span>
                          <span class="item-detail">{{ wr.company || '' }} {{ wr.foreman ? '- ' + wr.foreman : '' }}</span>
                        </div>
                        <div class="item-sub">{{ wr.workScope || '' }}</div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="tab-empty">No active work requests available.</p>
                }
              }

              @if(addPackageTab() === 'reissue') {
                @if(reissueablePackages().length > 0) {
                  <div class="tab-list">
                    @for(pkg of reissueablePackages(); track pkg.id) {
                      <div class="list-item" (click)="reissuePackage(pkg)">
                        <div class="item-main">
                          <span class="item-name">{{ pkg.permitNumber || pkg.name || 'Package #' + pkg.id }}</span>
                          <span class="status-badge" [attr.data-status]="pkg.packageStatus?.name || 'Building'">
                            {{ pkg.packageStatus?.name || 'Building' }}
                          </span>
                        </div>
                        <div class="item-sub">{{ pkg.date || 'No Date' }}</div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="tab-empty">No packages available for reissue.</p>
                }
              }
            </div>

            <button class="cancel-btn" (click)="isAddPackageDialogOpen.set(false)">Cancel</button>
          </div>
        </div>
      }

      @if(isClosureDialogOpen()) {
        <div class="dialog-overlay" (click)="isClosureDialogOpen.set(false)">
          <div class="dialog closure-dialog" (click)="$event.stopPropagation()">
            <h3>Close Package: {{ closingPackage()?.permitNumber || closingPackage()?.name }}</h3>
            <div class="closure-field">
              <label><input type="checkbox" [(ngModel)]="closureWorkCompleted"> Work Completed</label>
            </div>
            <div class="closure-field">
              <label>Comments:</label>
              <textarea [(ngModel)]="closureComments" rows="3"></textarea>
            </div>
            <div class="closure-field">
              <label><input type="checkbox" [(ngModel)]="closureScopeChanged"> Scope Changed</label>
            </div>
            @if(closureScopeChanged) {
              <div class="closure-field">
                <label>Scope Details:</label>
                <textarea [(ngModel)]="closureScopeDetails" rows="2"></textarea>
              </div>
            }
            @if(!closureWorkCompleted) {
              <div class="closure-field">
                <label>Continue Date:</label>
                <input type="date" [(ngModel)]="closureContinueDate">
              </div>
            }
            <div class="dialog-actions">
              <button class="confirm-btn" (click)="confirmPackageClosure()">Close Package</button>
              <button class="cancel-btn" (click)="isClosureDialogOpen.set(false)">Cancel</button>
            </div>
          </div>
        </div>
      }

      @if(isMoveDialogOpen()) {
        <div class="dialog-overlay" (click)="isMoveDialogOpen.set(false)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <h3>Move Package to Job</h3>
            @if(otherJobs().length > 0) {
              <div class="tab-list">
                @for(job of otherJobs(); track job.id) {
                  <div class="list-item" (click)="moveToJob(job)">
                    <div class="item-main">
                      <span class="item-name">{{ job.permitNumber || job.name || 'Job #' + job.id }}</span>
                      <span class="status-badge" [attr.data-status]="job.jobStatus?.name || 'Open'">
                        {{ job.jobStatus?.name || 'Open' }}
                      </span>
                    </div>
                    <div class="item-sub">{{ job.company || '' }} {{ job.foreman ? '- ' + job.foreman : '' }}</div>
                  </div>
                }
              </div>
            } @else {
              <p class="tab-empty">No other jobs available.</p>
            }
            <button class="cancel-btn" (click)="isMoveDialogOpen.set(false)">Cancel</button>
          </div>
        </div>
      }

      @if(isMergeDialogOpen()) {
        <div class="dialog-overlay" (click)="isMergeDialogOpen.set(false)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <h3>Merge Into Another Job</h3>
            <p class="merge-hint">All packages from this job will be moved to the selected job. This job will be deleted.</p>
            @if(otherJobs().length > 0) {
              <div class="tab-list">
                @for(job of otherJobs(); track job.id) {
                  <div class="list-item" (click)="mergeIntoJob(job)">
                    <div class="item-main">
                      <span class="item-name">{{ job.permitNumber || job.name || 'Job #' + job.id }}</span>
                      <span class="status-badge" [attr.data-status]="job.jobStatus?.name || 'Open'">
                        {{ job.jobStatus?.name || 'Open' }}
                      </span>
                    </div>
                    <div class="item-sub">{{ job.company || '' }} {{ job.foreman ? '- ' + job.foreman : '' }}</div>
                  </div>
                }
              </div>
            } @else {
              <p class="tab-empty">No other jobs available.</p>
            }
            <button class="cancel-btn" (click)="isMergeDialogOpen.set(false)">Cancel</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .job-log-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; }

    /* Error banner */
    .error-banner { padding: 8px 12px; background: #f44336; color: white; border-radius: 4px; cursor: pointer; font-size: 13px; margin: 0 12px; }
    .error-banner .dismiss { opacity: 0.7; font-size: 11px; }

    /* Job status section */
    .job-status-section { display: flex; align-items: center; gap: 12px; padding: 0 12px; }
    .status-hint { color: #888; font-size: 12px; font-style: italic; }

    /* Status badges */
    .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge[data-status="Open"] { background: rgba(33, 150, 243, 0.15); color: #64b5f6; border: 1px solid rgba(33, 150, 243, 0.3); }
    .status-badge[data-status="Active"] { background: rgba(76, 175, 80, 0.15); color: #81c784; border: 1px solid rgba(76, 175, 80, 0.3); }
    .status-badge[data-status="Building"] { background: rgba(255, 152, 0, 0.15); color: #ffb74d; border: 1px solid rgba(255, 152, 0, 0.3); }
    .status-badge[data-status="Test"] { background: rgba(156, 39, 176, 0.15); color: #ce93d8; border: 1px solid rgba(156, 39, 176, 0.3); }
    .status-badge[data-status="Closed"] { background: rgba(158, 158, 158, 0.15); color: #bdbdbd; border: 1px solid rgba(158, 158, 158, 0.3); }

    /* Status action buttons */
    .status-btn { padding: 4px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; color: white; }
    .status-btn.activate { background: #4CAF50; }
    .status-btn.activate:hover { background: #45a049; }
    .status-btn.test { background: #9C27B0; }
    .status-btn.test:hover { background: #7B1FA2; }
    .status-btn.close { background: #f44336; }
    .status-btn.close:hover { background: #d32f2f; }

    /* Packages section */
    .packages-section { padding: 0 12px; }
    .packages-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .packages-header h3 { margin: 0; font-size: 14px; }
    .header-actions { display: flex; gap: 8px; }
    .create-package-btn { padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .create-package-btn:hover { background: #45a049; }
    .merge-btn { padding: 4px 12px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .merge-btn:hover { background: #F57C00; }
    .merge-hint { color: #888; font-size: 12px; margin: 0 0 8px; }
    .reissue-btn { padding: 4px 12px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .reissue-btn:hover { background: #F57C00; }
    .no-packages { color: #888; font-style: italic; font-size: 13px; }

    /* Package cards */
    .package-cards { display: flex; flex-direction: column; gap: 6px; }
    .package-card { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #1e1e1e; border: 1px solid #333; border-radius: 6px; transition: border-color 0.2s; }
    .package-card:hover { border-color: #555; }
    .package-info { display: flex; flex-direction: column; gap: 4px; cursor: pointer; flex: 1; min-width: 0; }
    .pkg-header { display: flex; align-items: center; gap: 12px; }
    .pkg-name { font-size: 13px; font-weight: 500; color: #ddd; }
    .pkg-date { font-size: 12px; color: #888; }
    .pkg-details { display: flex; gap: 12px; font-size: 11px; min-width: 0; }
    .pkg-location { color: #64b5f6; white-space: nowrap; }
    .pkg-scope { color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .package-actions-inline { display: flex; align-items: center; gap: 6px; }
    .action-btn { width: 22px; height: 22px; padding: 0; background: transparent; border: 1px solid #555; border-radius: 4px; color: #999; cursor: pointer; font-size: 12px; line-height: 20px; text-align: center; }
    .action-btn.move:hover { border-color: #64b5f6; color: #64b5f6; }
    .action-btn.detach:hover { border-color: #f44336; color: #f44336; }

    /* Dialog overlay */
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 16px; min-width: 300px; max-width: 500px; }
    .dialog h3 { margin: 0 0 12px; font-size: 14px; color: #ccc; }
    .reissue-item { padding: 8px 12px; margin: 4px 0; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-size: 13px; color: #ddd; }
    .reissue-item:hover { background: #333; border-color: #FF9800; }

    /* Tab bar */
    .tab-bar { display: flex; gap: 0; margin: 10px 0 0; border-bottom: 1px solid #444; }
    .tab-btn { flex: 1; padding: 8px 12px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #888; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .tab-btn:hover { color: #ccc; }
    .tab-btn.active { color: #64b5f6; border-bottom-color: #64b5f6; }
    .tab-content { max-height: 300px; overflow-y: auto; }
    .tab-list { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
    .list-item { padding: 8px 12px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; cursor: pointer; }
    .list-item:hover { background: #333; border-color: #64b5f6; }
    .item-main { display: flex; align-items: center; gap: 8px; }
    .item-name { font-size: 13px; font-weight: 500; color: #ddd; }
    .item-detail { font-size: 11px; color: #888; }
    .item-sub { font-size: 11px; color: #777; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tab-empty { color: #888; font-style: italic; font-size: 13px; padding: 12px 0; text-align: center; }

    /* Add package dialog */
    .add-package-dialog { min-width: 400px; }
    .add-option { display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin: 6px 0; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; cursor: pointer; }
    .add-option:hover { background: #333; border-color: #4CAF50; }
    .add-option strong { font-size: 13px; color: #ddd; display: block; }
    .add-option p { margin: 2px 0 0; font-size: 11px; color: #888; }
    .option-icon { font-size: 18px; width: 28px; text-align: center; color: #64b5f6; flex-shrink: 0; }
    .add-option-group { margin: 6px 0; }
    .option-group-label { display: flex; align-items: center; gap: 12px; padding: 8px 12px; font-size: 13px; color: #ccc; }

    /* Closure dialog */
    .closure-dialog { min-width: 400px; }
    .closure-field { margin-bottom: 10px; }
    .closure-field label { display: block; font-size: 13px; color: #ccc; margin-bottom: 4px; }
    .closure-field textarea, .closure-field input[type="date"] { width: 100%; padding: 6px 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #ddd; font-size: 13px; box-sizing: border-box; }
    .closure-field input[type="checkbox"] { margin-right: 6px; }

    /* Dialog actions */
    .dialog-actions { display: flex; gap: 8px; margin-top: 12px; }
    .confirm-btn { padding: 6px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .confirm-btn:hover { background: #d32f2f; }
    .cancel-btn { padding: 6px 16px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .cancel-btn:hover { background: #666; }
  `],
})
export class RfJobLogFormComponent {
  private currentService = inject(CurrentJobLogService);
  private dailyPermitPackageService = inject(DailyPermitPackageService);
  private currentWorkRequestService = inject(CurrentWorkRequestService);
  private currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => JobLogDto.toFormFields(this.entity()) as RfFormField[]);
  packages = this.currentService.packages;
  closedPackages = computed(() =>
    this.packages().filter(p => p.packageStatus?.name === 'Closed')
  );

  // Use permitNumber to detect loaded jobs (id can be 0 which is falsy)
  isExistingJob = computed(() => !!this.entity().permitNumber || !!this.entity().name || !!this.entity().foreman);

  // Job status
  jobStatus = computed(() => this.entity().jobStatus?.name ?? 'Open');
  canCloseJob = computed(() => {
    const pkgs = this.packages();
    return pkgs.length > 0 && pkgs.every(p => (p.packageStatus?.name ?? 'Building') === 'Closed');
  });

  // Add package dialog
  isAddPackageDialogOpen = signal(false);
  addPackageTab = signal<'workRequests' | 'reissue'>('workRequests');
  activeWorkRequests = toSignal(this.currentWorkRequestService.allActiveRequests$, { initialValue: [] as WorkRequestDto[] });
  reissueablePackages = this.currentDailyPermitPackageService.allPackages;

  // Closure dialog
  isClosureDialogOpen = signal(false);
  closingPackage = signal<DailyPermitPackageDto | null>(null);
  closureWorkCompleted = false;
  closureComments = '';
  closureScopeChanged = false;
  closureScopeDetails = '';
  closureContinueDate = '';

  // Move package dialog
  isMoveDialogOpen = signal(false);
  movingPackageId = signal<number>(0);

  // Merge dialog
  isMergeDialogOpen = signal(false);

  // All jobs for move/merge target selection
  allJobLogs = toSignal(this.currentService.allJobLogs$, { initialValue: [] as JobLogDto[] });
  otherJobs = computed(() => this.allJobLogs().filter(j => j.id !== this.entity().id));

  // Error feedback
  errorMessage = signal('');

  onSubmit(formData: any): void {
    this.currentService.saveJobLog(formData);
  }

  onDelete(): void {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    this.currentService.deleteJob(this.entity().id);
  }

  createEmptyPackage(): void {
    this.isAddPackageDialogOpen.set(false);
    this.currentService.createPackageForJob();
  }

  generateFromWorkRequest(): void {
    this.isAddPackageDialogOpen.set(false);
    this.currentService.createPackageForJob();
    setTimeout(() => {
      const pkgs = this.packages();
      const newPkg = pkgs[pkgs.length - 1];
      if (newPkg) this.currentService.navigateToPackage(newPkg.id);
    }, 1000);
  }

  generateFromSelectedWorkRequest(wr: WorkRequestDto): void {
    const job = this.entity();
    if (job.id == null) return;
    this.isAddPackageDialogOpen.set(false);
    this.currentService.processWorkRequest(job.id.toString(), wr.id.toString()).subscribe({
      error: (err) => this.errorMessage.set(err.error?.message || 'Failed to process work request')
    });
  }

  openPackage(pkg: DailyPermitPackageDto): void {
    this.currentService.navigateToPackage(pkg.id);
  }

  detachPackage(pkg: DailyPermitPackageDto): void {
    this.currentService.detachPackageFromJob(pkg.id);
  }

  closeJob(): void {
    this.currentService.closeJob();
  }

  // --- Package status actions ---

  activatePackage(pkg: DailyPermitPackageDto): void {
    this.dailyPermitPackageService.activatePackage(pkg.id).subscribe({
      next: () => this.refreshCurrentJob(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Activation failed')
    });
  }

  putPackageUnderTest(pkg: DailyPermitPackageDto): void {
    this.dailyPermitPackageService.putPackageUnderTest(pkg.id).subscribe({
      next: () => this.refreshCurrentJob(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Test failed')
    });
  }

  openPackageClosureDialog(pkg: DailyPermitPackageDto): void {
    this.closingPackage.set(pkg);
    this.closureWorkCompleted = false;
    this.closureComments = '';
    this.closureScopeChanged = false;
    this.closureScopeDetails = '';
    this.closureContinueDate = '';
    this.isClosureDialogOpen.set(true);
  }

  confirmPackageClosure(): void {
    const pkg = this.closingPackage();
    if (!pkg) return;
    this.dailyPermitPackageService.closePackage(pkg.id, {
      workCompleted: this.closureWorkCompleted,
      closureComments: this.closureComments,
      scopeChanged: this.closureScopeChanged,
      closureScopeDetails: this.closureScopeDetails,
      continueDate: this.closureContinueDate,
    }).subscribe({
      next: () => {
        this.isClosureDialogOpen.set(false);
        this.refreshCurrentJob();
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Closure failed')
    });
  }

  // --- Reissue ---

  reissuePackage(sourcePkg: DailyPermitPackageDto): void {
    this.isAddPackageDialogOpen.set(false);
    this.currentService.createPackageForJob();
    setTimeout(() => {
      const pkgs = this.packages();
      const newPkg = pkgs[pkgs.length - 1];
      if (newPkg && sourcePkg) {
        this.dailyPermitPackageService.reissuePermits(sourcePkg.id, newPkg.id).subscribe({
          next: () => this.refreshCurrentJob(),
          error: (err) => this.errorMessage.set(err.error?.message || 'Reissue failed')
        });
      }
    }, 1000);
  }

  // --- Move package ---

  openMoveDialog(pkg: DailyPermitPackageDto): void {
    this.movingPackageId.set(pkg.id);
    this.isMoveDialogOpen.set(true);
  }

  moveToJob(targetJob: JobLogDto): void {
    this.isMoveDialogOpen.set(false);
    this.currentService.movePackageToJob(this.movingPackageId(), targetJob.id);
  }

  // --- Merge jobs ---

  openMergeDialog(): void {
    this.isMergeDialogOpen.set(true);
  }

  mergeIntoJob(targetJob: JobLogDto): void {
    if (!confirm(`Merge all packages into "${targetJob.permitNumber || targetJob.name || 'Job #' + targetJob.id}"? This job will be deleted.`)) return;
    this.isMergeDialogOpen.set(false);
    this.currentService.mergeCurrentJobInto(targetJob.id);
  }

  getPackageLocation(pkg: DailyPermitPackageDto): string {
    const permit = pkg.workRequests?.[0] || pkg.safeWorks?.[0] || pkg.hotWorks?.[0] || pkg.confinedSpaces?.[0];
    return (permit as any)?.location || '';
  }

  getPackageWorkScope(pkg: DailyPermitPackageDto): string {
    const permit = pkg.workRequests?.[0] || pkg.safeWorks?.[0] || pkg.hotWorks?.[0] || pkg.confinedSpaces?.[0];
    const scope = (permit as any)?.workScope || '';
    return scope.length > 60 ? scope.substring(0, 60) + '...' : scope;
  }

  private refreshCurrentJob(): void {
    const job = this.entity();
    this.currentService.setCurrentJobLog(job.id);
  }
}
