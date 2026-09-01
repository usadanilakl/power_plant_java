import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { WrDetailDialogService } from './wr-detail-dialog.service';
import { RfWorkRequestApiService } from '../../features/permit-builder/work-request/refactored/services/rf-work-request-api.service';
import { CorrespondenceDialogService } from '../correspondence-dialog/correspondence-dialog.service';
import { AttachmentDialogService } from '../attachment-dialog/attachment-dialog.service';
import { ProcessWrDialogService } from '../process-wr-dialog/process-wr-dialog.service';
import { WorkRequestDto } from '../../models/permits/work-request.model';
import { JhaDto } from '../../models/permits/jha.model';
import { hotWorkTierLabel, hotWorkTypeLabels } from '../../models/permits/hot-work.model';
import { RfJhaApiService } from '../../features/permit-builder/jha/refactored/services/rf-jha-api.service';

@Component({
  selector: 'app-wr-detail-dialog',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  template: `
    @if (dialogService.isVisible()) {
      <app-rf-popup-projection
        [isOpen]="true"
        [title]="'Work Request Details'"
        [size]="'medium'"
        [zIndex]="20000"
        (close)="close()">

        <div class="wr-detail-content">
          @if (isLoading()) {
            <div class="loading-state">
              <span class="material-icons spinning">refresh</span>
              Loading work request details...
            </div>
          } @else if (workRequest()) {
            <!-- Status header -->
            <div class="detail-status-row">
              <span class="status-chip" [ngClass]="'status-' + (workRequest()!.status || '').toLowerCase()">
                {{ workRequest()!.status || 'Unknown' }}
              </span>
              @if (workRequest()!.hasJha) {
                <span class="jha-badge">JHA</span>
              }
              @if ((workRequest()!.attachmentCount ?? 0) > 0) {
                <span class="attachment-badge">{{ workRequest()!.attachmentCount }} attachment(s)</span>
              }
              <!-- The requester either could not place their work on the map or the request came
                   in from a source that carries no area. Permits are seeded from the area's
                   constant hazards and lock-outs, so this has to be settled before processing. -->
              @if (workRequest()!.areaNotSpecified) {
                <span class="area-missing-badge" title="Set the work area on the work request form before generating permits">
                  Area not set
                </span>
              }
            </div>

            <!-- Detail grid -->
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">{{ workRequest()!.getDate() || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">{{ workRequest()!.timeOfWorkToBePerformed || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested By</span>
                <span class="detail-value">{{ workRequest()!.requestedBy || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Company</span>
                <span class="detail-value">{{ workRequest()!.company || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Work Area</span>
                <span class="detail-value" [class.value-missing]="!workRequest()!.workArea?.name">
                  {{ workRequest()!.workArea?.name || 'Not set — requester could not place it' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Main Work Scope</span>
                <span class="detail-value">{{ workRequest()!.workCategory?.name || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">{{ workRequest()!.location || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Affected Equipment</span>
                <span class="detail-value">{{ workRequest()!.affectedEquipment || '---' }}</span>
              </div>
              <div class="detail-row full-width">
                <span class="detail-label">Work Scope</span>
                <span class="detail-value">{{ workRequest()!.workScope || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Foreman</span>
                <span class="detail-value">{{ workRequest()!.foreman || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fire Watch</span>
                <span class="detail-value">{{ workRequest()!.fireWatch || '---' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">LOTO Required</span>
                <span class="detail-value" [class.flag-yes]="workRequest()!.isLotoRequired">
                  {{ workRequest()!.isLotoRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Hot Work Required</span>
                <span class="detail-value" [class.flag-yes]="workRequest()!.isHotWorkRequired">
                  {{ workRequest()!.isHotWorkRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Confined Space Required</span>
                <span class="detail-value" [class.flag-yes]="workRequest()!.isConfinedSpaceEntryRequired">
                  {{ workRequest()!.isConfinedSpaceEntryRequired ? 'Yes' : 'No' }}
                </span>
              </div>
              @if (workRequest()!.isConfinedSpaceEntryRequired) {
                <div class="detail-row">
                  <span class="detail-label">Space</span>
                  <span class="detail-value">{{ workRequest()!.space || '---' }}</span>
                </div>
              }
              <div class="detail-row">
                <span class="detail-label">SharePoint ID</span>
                <span class="detail-value">{{ workRequest()!.sharepointId || '---' }}</span>
              </div>
            </div>

            <!-- Hot work detail, including the hexavalent chromium worksheet. Surfaced next to the
                 hazards because the score is what an operator needs when deciding controls and PPE
                 for the Hot Work permit. -->
            @if (workRequest()!.isHotWorkRequired && hotWorkTypes().length > 0) {
              <div class="hazard-section">
                <div class="section-title">Hot Work</div>
                <div class="hazard-chips">
                  @for (type of hotWorkTypes(); track type) {
                    <span class="hazard-chip">{{ type }}</span>
                  }
                </div>
                @if (workRequest()!.hotWorkProfile?.welding) {
                  <div class="crvi-block">
                    <div class="hazard-group">Hexavalent chromium assessment</div>
                    @if (crviAssessed()) {
                      <div class="crvi-row">
                        <span class="crvi-label">Hot work method</span>
                        <span class="crvi-value">{{ fumeLabel() }}</span>
                      </div>
                      <div class="crvi-row">
                        <span class="crvi-label">Base metal chrome content</span>
                        <span class="crvi-value">{{ chromeLabel() }}</span>
                      </div>
                      <div class="crvi-row score">
                        <span class="crvi-label">Exposure score (method &times; chrome)</span>
                        <span class="crvi-value score-value">{{ workRequest()!.hotWorkExposureScore }}</span>
                      </div>
                    } @else {
                      <!-- Welding is declared but the worksheet was not completed. Say so rather
                           than showing a 0, which would read as "assessed, and low". -->
                      <div class="crvi-missing">
                        Welding declared but the Cr(VI) worksheet was not completed &mdash; assess before issuing the Hot Work permit.
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Who to ring about this. Distinct from Requested By, which names who the work is
                 FOR — this is the person who actually submitted it. -->
            @if (hasSubmitter()) {
              <div class="hazard-section">
                <div class="section-title">Submitted by</div>
                <div class="submitter-grid">
                  @if (workRequest()!.submitterName) {
                    <span class="submitter-label">Name</span>
                    <span>{{ workRequest()!.submitterName }}</span>
                  }
                  @if (workRequest()!.submitterCompany) {
                    <span class="submitter-label">Company</span>
                    <span>{{ workRequest()!.submitterCompany }}</span>
                  }
                  @if (workRequest()!.submitterEmail) {
                    <span class="submitter-label">Email</span>
                    <a [href]="'mailto:' + workRequest()!.submitterEmail">{{ workRequest()!.submitterEmail }}</a>
                  }
                  @if (workRequest()!.submitterPhone) {
                    <span class="submitter-label">Phone</span>
                    <a [href]="'tel:' + workRequest()!.submitterPhone">{{ workRequest()!.submitterPhone }}</a>
                  }
                  @if (workRequest()!.timeSubmitted) {
                    <span class="submitter-label">Submitted</span>
                    <span>{{ workRequest()!.timeSubmitted }}</span>
                  }
                </div>
              </div>
            }

            <!-- Every area the request covers, and what is planned in each.
                 This decides how many Confined Space and Hot Work permits get generated, and it
                 was not shown anywhere: WorkRequest.setWorkAreas derives the request-level
                 "Yes"/"No" from these rows and only ever turns them ON, so a three-area request
                 where two need entry collapsed to a single Yes with no way to see the count. -->
            @if (workAreaRows().length > 0) {
              <div class="hazard-section">
                <div class="section-title">Work areas ({{ workAreaRows().length }})</div>
                @for (area of workAreaRows(); track area.id) {
                  <div class="area-row">
                    <span class="area-name">{{ area.name }}</span>
                    @if (area.primary) { <span class="area-tag area-tag-main">main</span> }
                    @if (area.confinedSpaceEntry) {
                      <span class="area-tag area-tag-cs">
                        Confined space entry{{ area.spaceName ? ': ' + area.spaceName : '' }}
                      </span>
                    }
                    @if (area.hotWork) { <span class="area-tag area-tag-hw">Hot work</span> }
                  </div>
                }
              </div>
            }

            <!-- What the requester declared. These seed the Safe Work / Hot Work / Confined Space
                 permits generated from this request, merged with the work area's own constants -
                 so an operator reviewing here is seeing exactly what will be pre-ticked. -->
            @if (declaredHazardBlocks().length > 0) {
              <div class="hazard-section">
                <div class="section-title">Declared by requester</div>
                @for (block of declaredHazardBlocks(); track block.group) {
                  <div class="hazard-block">
                    <div class="hazard-group">{{ block.group }}</div>
                    <div class="hazard-chips">
                      @for (item of block.items; track item) {
                        <span class="hazard-chip">{{ item }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Review JHA. The lifecycle calls for reviewing the JHA before generating permits,
                 and the only signal here used to be a badge with nothing behind it - the operator
                 had to leave for the separate JHA page and find it by hand. -->
            @if (jhas().length > 0) {
              <div class="jha-section">
                <div class="section-title">JHA</div>
                @for (jha of jhas(); track jha.id) {
                  <div class="jha-row">
                    <div class="jha-info">
                      <span class="jha-name">{{ jha.jobName || 'JHA #' + jha.id }}</span>
                      <span class="jha-meta">
                        {{ jha.analysisBy || 'Unknown analyst' }}
                        @if (jha.date) { · {{ jha.date }} }
                        @if (jha.status) { · {{ jha.status }} }
                      </span>
                    </div>
                    <button class="action-btn btn-jha" (click)="viewJha(jha)">
                      <span class="material-icons">description</span> View
                    </button>
                  </div>
                }
              </div>
            } @else if (workRequest()!.hasJha) {
              <div class="jha-section">
                <div class="section-title">JHA</div>
                <p class="jha-empty">A JHA is linked to this request but could not be loaded.</p>
              </div>
            }

            <!-- Action buttons. The lifecycle half is suppressed when the dialog was opened to
                 read a request rather than act on it — see WrDetailDialogService.showActions. -->
            <div class="action-bar">
              @if (dialogService.showActions()) {
              <button class="action-btn btn-process"
                      (click)="processWorkRequest()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">play_arrow</span> Process
              </button>
              <button class="action-btn btn-processed"
                      (click)="markAsProcessed()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">check_circle</span> Mark as Processed
              </button>
              <button class="action-btn btn-cancel"
                      (click)="cancelPermit()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">cancel</span> Cancel Permit
              </button>
              <!-- The lifecycle lists Revoke as a work-request action, but it lived only in the
                   table's right-click menu - invisible to anyone working from this dialog. -->
              <button class="action-btn btn-revoke"
                      (click)="revokeWorkRequest()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">block</span> Revoke
              </button>
              <button class="action-btn btn-details"
                      (click)="requestMoreDetails()"
                      [disabled]="actionInProgress()">
                <span class="material-icons">email</span> Request Details
              </button>
              }
              <button class="action-btn btn-correspondence"
                      (click)="viewCorrespondence()">
                <span class="material-icons">mail_outline</span> Correspondence
              </button>
              @if ((workRequest()!.attachmentCount ?? 0) > 0) {
                <button class="action-btn btn-attachments"
                        (click)="viewAttachments()">
                  <span class="material-icons">attach_file</span> Attachments
                </button>
              }
              <button class="action-btn btn-close" (click)="close()">Close</button>
            </div>
          } @else {
            <div class="empty-state">Work request not found.</div>
          }
        </div>

      </app-rf-popup-projection>
    }
  `,
  styles: [`
    .wr-detail-content {
      padding: 16px;
      min-width: 480px;
      max-width: 620px;
      background: var(--primary-background, #fff);
      color: var(--primary-text, #212529);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .status-chip {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .status-new { background-color: #fef3c7; color: #92400e; }
    .status-active { background-color: var(--status-complete, #d4edda); color: #166534; }
    .status-processed { background-color: #dbeafe; color: #1e40af; }
    .status-cancelled { background-color: var(--status-not-processed, #e0e0e0); color: #546e7a; }
    .status-revoked { background-color: #fce4ec; color: #b71c1c; }
    .status-updated { background-color: #fef3c7; color: #92400e; }
    .status-expired { background-color: #fecaca; color: #991b1b; }

    .jha-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--status-complete, #d4edda);
      color: #166534;
      font-weight: 600;
    }

    .attachment-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--secondary-background, #f0f2f5);
      border: 1px solid var(--border-color, #dee2e6);
      color: var(--secondary-text, #6c757d);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color, #dee2e6);
    }

    .detail-row.full-width { grid-column: 1 / -1; }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text, #6c757d);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }

    .detail-value {
      font-size: 14px;
      color: var(--primary-text, #212529);
    }

    .flag-yes {
      color: #b71c1c;
      font-weight: 600;
    }

    .value-missing { color: #b26a00; font-style: italic; }

    .area-missing-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #fff3cd;
      color: #92400e;
      border: 1px solid #f0d38a;
      font-weight: 600;
      cursor: help;
    }

    .submitter-grid {
      display: grid; grid-template-columns: auto 1fr; gap: 4px 14px;
      font-size: 13px; align-items: baseline;
    }
    .submitter-label { color: var(--secondary-text, #666); }

    .area-row {
      display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
      padding: 5px 0;
    }
    .area-name { font-weight: 600; }
    .area-tag {
      font-size: 11px; border-radius: 10px; padding: 1px 8px;
      background: #eceff1; color: #37474f;
    }
    .area-tag-main { background: #1976d2; color: #fff; text-transform: uppercase; letter-spacing: .5px; }
    .area-tag-cs { background: #fff3e0; color: #e65100; }
    .area-tag-hw { background: #ffebee; color: #b71c1c; }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text, #6c757d);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
    }

    .hazard-section, .jha-section {
      padding-top: 10px;
      border-top: 1px solid var(--border-color, #dee2e6);
    }

    .hazard-block { margin-bottom: 8px; }
    .hazard-group { font-size: 12px; font-weight: 600; color: var(--primary-text, #212529); margin-bottom: 4px; }
    .hazard-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .hazard-chip {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 10px;
      background: #fdeaea;
      color: #922;
      border: 1px solid #f2c9c9;
    }

    .crvi-block { margin-top: 8px; }
    .crvi-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 3px 0;
      font-size: 12px;
    }
    .crvi-label { color: var(--secondary-text, #6c757d); }
    .crvi-value { color: var(--primary-text, #212529); font-weight: 500; }
    .crvi-row.score { border-top: 1px solid var(--border-color, #dee2e6); margin-top: 4px; padding-top: 6px; }
    .score-value { font-size: 14px; font-weight: 700; }
    .crvi-missing {
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 4px;
      background: #fff3cd;
      color: #92400e;
      border: 1px solid #f0d38a;
    }

    .jha-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 0;
    }
    .jha-info { display: flex; flex-direction: column; min-width: 0; }
    .jha-name { font-size: 13px; color: var(--primary-text, #212529); font-weight: 500; }
    .jha-meta { font-size: 11px; color: var(--secondary-text, #6c757d); }
    .jha-empty { font-size: 12px; color: var(--secondary-text, #6c757d); font-style: italic; margin: 0; }
    .btn-jha { border-color: #4caf50; color: #2e7d32; flex-shrink: 0; }
    .btn-jha:hover { background: #e8f5e9; }
    .btn-revoke { border-color: #ad1457; color: #ad1457; }
    .btn-revoke:hover { background: #fce4ec; }

    .action-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border-color, #dee2e6);
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 7px 14px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      transition: all 150ms ease;
    }

    .action-btn:hover { background: var(--hover-color, #f0f2f5); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn .material-icons { font-size: 16px; }

    .btn-process { border-color: #2196f3; color: #1565c0; }
    .btn-process:hover { background: #e3f2fd; }
    .btn-processed { border-color: #4caf50; color: #2e7d32; }
    .btn-processed:hover { background: #e8f5e9; }
    .btn-cancel { border-color: #ef5350; color: #c62828; }
    .btn-cancel:hover { background: #ffebee; }
    .btn-close { margin-left: auto; }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text, #6c757d);
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class WrDetailDialogComponent {
  dialogService = inject(WrDetailDialogService);
  private wrApiService = inject(RfWorkRequestApiService);
  private correspondenceDialogService = inject(CorrespondenceDialogService);
  private attachmentDialogService = inject(AttachmentDialogService);
  private processWrDialogService = inject(ProcessWrDialogService);
  private jhaApiService = inject(RfJhaApiService);

  workRequest = signal<WorkRequestDto | null>(null);
  jhas = signal<JhaDto[]>([]);
  isLoading = signal(false);
  actionInProgress = signal(false);

  /**
   * Labels for every hazard the requester ticked, grouped the way the permits group them.
   *
   * Derived from the raw boolean objects rather than a parallel label list on the server, so
   * adding a hazard to the shared POJO surfaces here with no second place to update. Hot Work and
   * Confined Space blocks are suppressed unless the request actually calls for that work - a stray
   * tick under a "No" answer is noise, not a hazard.
   */
  declaredHazardBlocks = computed(() => {
    const wr = this.workRequest();
    if (!wr) return [];
    const blocks = [
      { group: 'Safety Hazards', source: wr.declaredHazards, include: true },
      { group: 'Hot Work Precautions', source: wr.declaredHotWorkMeasures, include: !!wr.isHotWorkRequired },
      { group: 'Confined Space Hazards', source: wr.declaredConfinedSpaceHazards, include: !!wr.isConfinedSpaceEntryRequired },
    ];
    return blocks
      .filter(b => b.include && b.source)
      .map(b => ({ group: b.group, items: WrDetailDialogComponent.tickedLabels(b.source) }))
      .filter(b => b.items.length > 0);
  });

  /** Whether anything is known about who submitted this. */
  hasSubmitter = computed(() => {
    const wr = this.workRequest();
    return !!(wr?.submitterName || wr?.submitterEmail || wr?.submitterPhone
      || wr?.submitterCompany || wr?.timeSubmitted);
  });

  /** The areas this request covers, with what is planned in each. Empty for a single-area request
   *  made before multi-area existed, which is correct — there is nothing extra to report. */
  workAreaRows = computed(() => this.workRequest()?.workAreas ?? []);

  /** Hot work types the requester ticked, as readable labels. */
  hotWorkTypes = computed(() => hotWorkTypeLabels(this.workRequest()?.hotWorkProfile));

  /** Was the Cr(VI) worksheet actually completed? A score of 0 means unanswered, not "low". */
  crviAssessed = computed(() => (this.workRequest()?.hotWorkExposureScore ?? 0) > 0);

  fumeLabel = computed(() => hotWorkTierLabel(this.workRequest()?.hotWorkProfile?.fumeLevel));
  chromeLabel = computed(() => hotWorkTierLabel(this.workRequest()?.hotWorkProfile?.chromeContent));

  /** Ticked keys, turned into something readable: `highNoise` -> `High Noise`. */
  private static tickedLabels(source: any): string[] {
    return Object.entries(source ?? {})
      .filter(([, value]) => value === true)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim());
  }

  private openSub = this.dialogService.onOpen$.subscribe(() => this.loadWorkRequest());

  loadWorkRequest(): void {
    const id = this.dialogService.workRequestId();
    if (!id) return;

    this.isLoading.set(true);
    this.jhas.set([]);
    this.wrApiService.getWorkRequestById(id).subscribe({
      next: (response) => {
        this.workRequest.set(
          response.responseData ? WorkRequestDto.fromJson(response.responseData) : null
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.workRequest.set(null);
        this.isLoading.set(false);
      }
    });
    this.loadJhas(id);
  }

  private loadJhas(workRequestId: number): void {
    this.jhaApiService.getJhasByWorkRequest(workRequestId).subscribe({
      next: (response) => this.jhas.set((response.responseData ?? []).map(j => JhaDto.fromJson(j))),
      // Best-effort: the rest of the dialog is still useful without it, and hasJha already tells
      // the operator one exists.
      error: () => this.jhas.set([])
    });
  }

  /**
   * Open a JHA's attachments — in practice the captured form image or the uploaded document, which
   * is what an operator actually needs to read before generating permits.
   */
  viewJha(jha: JhaDto): void {
    if (!jha.id) return;
    this.attachmentDialogService.open('Jha', jha.id, `JHA — ${jha.jobName || '#' + jha.id}`);
  }

  revokeWorkRequest(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    const confirmed = confirm(
      `Revoke this work request?\n\n` +
      `Work Scope: ${wr.workScope}\nLocation: ${wr.location}`
    );
    if (!confirmed) return;
    this.actionInProgress.set(true);
    this.wrApiService.revokeWorkRequest(wr.id).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.dialogService.notifyAction();
        this.close();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  refreshIfOpen(wrId: number): void {
    if (this.dialogService.isVisible() && this.dialogService.workRequestId() === wrId) {
      this.loadWorkRequest();
    }
  }

  markAsProcessed(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    this.actionInProgress.set(true);
    this.wrApiService.changeStatus(wr.id, 'Processed').subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.dialogService.notifyAction();
        this.close();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  cancelPermit(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    const confirmed = confirm(
      `Are you sure you want to cancel this work request?\n\n` +
      `Work Scope: ${wr.workScope}\nLocation: ${wr.location}`
    );
    if (!confirmed) return;
    this.actionInProgress.set(true);
    this.wrApiService.cancelWorkRequest(wr.id).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.dialogService.notifyAction();
        this.close();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  requestMoreDetails(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    const message = prompt('Optional: Add details about what information is needed');
    if (message === null) return;
    this.actionInProgress.set(true);
    this.wrApiService.requestMoreDetails(wr.id, message || undefined).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.dialogService.notifyAction();
        this.loadWorkRequest();
      },
      error: () => this.actionInProgress.set(false)
    });
  }

  processWorkRequest(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    this.close();
    this.processWrDialogService.open(wr.id);
  }

  viewCorrespondence(): void {
    const wr = this.workRequest();
    if (!wr?.id) return;
    this.correspondenceDialogService.open('WorkRequest', wr.id);
  }

  viewAttachments(): void {
    const wr = this.workRequest();
    if (!wr?.id || !wr.attachmentCount) return;
    this.attachmentDialogService.open('WorkRequest', wr.id);
  }

  close(): void {
    this.dialogService.close();
  }
}
