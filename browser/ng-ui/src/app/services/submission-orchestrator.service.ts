import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, timeout } from 'rxjs';
import { ServerApiService, PwaSubmissionResult, PwaWorkRequestDto, PwaJhaDto, PwaInstrumentLogDto, PwaInstrumentDto, PwaInstrumentStateDto } from './server-api.service';
import { PowerAutomateService } from './power-automate.service';
import { UserSetupService } from './user-setup.service';
import { WorkRequest } from '../models/permits/work-request.model';
import { Jha } from '../models/permits/jha.model';
import { InstrumentLogEntry } from '../models/equipment/instrument-log.model';
import { PowerAutomateRequest } from '../models/api/power-automate-request.model';
import { environment } from '../../environments/environment';

export interface SubmissionResult {
  success: boolean;
  method: 'server' | 'local' | 'duplicate' | 'powerAutomate' | 'email';
  sharepointId?: string;
  localUuid: string;
  message?: string;
  requiresEmail?: boolean;
  requiresMerge?: boolean;
  conflictType?: string;
}

export interface FetchResult {
  success: boolean;
  method: 'server' | 'powerAutomate' | 'static';
  instruments: PwaInstrumentDto[];
}

export interface InstrumentStateFetchResult {
  success: boolean;
  method: 'server' | 'powerAutomate' | 'cache';
  state?: PwaInstrumentStateDto;
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionOrchestratorService {
  private serverApi = inject(ServerApiService);
  private powerAutomate = inject(PowerAutomateService);
  private userSetup = inject(UserSetupService);

  submitWorkRequest(workRequest: WorkRequest): Observable<SubmissionResult> {
    const userData = this.userSetup.getUserData();
    if (!userData) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid: '',
        message: 'User data not configured. Please complete setup first.',
        requiresEmail: true
      });
    }

    const dto = this.serverApi.convertWorkRequestToDto(workRequest, {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      company: userData.company
    });

    return this.tryServerWr(dto).pipe(
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateWr(workRequest, dto.localUuid);
      })
    );
  }

  submitJha(jha: Jha): Observable<SubmissionResult> {
    const userData = this.userSetup.getUserData();
    if (!userData) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid: '',
        message: 'User data not configured. Please complete setup first.',
        requiresEmail: true
      });
    }

    const dto = this.serverApi.convertJhaToDto(jha, {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      company: userData.company
    });

    return this.tryServerJha(dto).pipe(
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for JHA, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateJha(jha, dto.localUuid);
      })
    );
  }

  private tryServerWr(dto: PwaWorkRequestDto): Observable<SubmissionResult> {
    return this.serverApi.submitWorkRequest(dto).pipe(
      map(response => ({
        success: response.success,
        method: 'server' as const,
        sharepointId: response.sharepointId,
        localUuid: response.localUuid,
        message: response.method === 'local'
          ? 'Saved locally. Will sync to SharePoint when available.'
          : 'Submitted successfully via server.'
      }))
    );
  }

  private tryServerJha(dto: PwaJhaDto): Observable<SubmissionResult> {
    return this.serverApi.submitJha(dto).pipe(
      map(response => ({
        success: response.success,
        method: 'server' as const,
        sharepointId: response.sharepointId,
        localUuid: response.localUuid,
        message: response.method === 'local'
          ? 'JHA saved locally. Will sync to SharePoint when available.'
          : 'JHA submitted successfully via server.'
      }))
    );
  }

  private tryPowerAutomateWr(workRequest: WorkRequest, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured('workRequest')) {
      return this.tryServerEmail(
        this.generateEmailContent(workRequest),
        workRequest.attachments,
        localUuid,
        'Power Automate not configured.'
      );
    }

    const userData = this.userSetup.getUserData()!;
    const paRequest = this.powerAutomate.buildCreateRequest(
      workRequest.convertToPaModel() as any,
      userData,
      workRequest.attachments
    );

    return this.powerAutomate.submitV2('workRequest', paRequest).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'PA V2 flow returned failure');
        }
        return {
          success: true,
          method: 'powerAutomate' as const,
          sharepointId: response.id,
          localUuid,
          message: 'Submitted successfully via Power Automate.'
        };
      }),
      catchError(paError => {
        console.warn('[Orchestrator] Power Automate failed:', paError.message);
        return this.tryServerEmail(
          this.generateEmailContent(workRequest),
          workRequest.attachments,
          localUuid,
          'Server and Power Automate failed.'
        );
      })
    );
  }

  private tryPowerAutomateJha(jha: Jha, localUuid: string): Observable<SubmissionResult> {
    if (this.powerAutomate.isV2Configured('jha')) {
      const userData = this.userSetup.getUserData()!;
      const paRequest = this.powerAutomate.buildCreateRequest(
        jha.convertToPaModel() as any,
        userData,
        jha.attachments
      );

      return this.powerAutomate.submitV2('jha', paRequest).pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'PA V2 JHA flow returned failure');
          }
          return {
            success: true,
            method: 'powerAutomate' as const,
            sharepointId: response.id,
            localUuid,
            message: 'JHA submitted successfully via Power Automate (V2).'
          };
        }),
        catchError(paError => {
          console.warn('[Orchestrator] PA V2 failed for JHA:', paError.message);
          return this.tryServerEmail(
            this.generateJhaEmailContent(jha),
            jha.attachments,
            localUuid,
            'Server and Power Automate failed for JHA.'
          );
        })
      );
    }

    return this.tryServerEmail(
      this.generateJhaEmailContent(jha),
      jha.attachments,
      localUuid,
      'JHA Power Automate flow not configured.'
    );
  }

  // ====================== Instrument Fetch & Create ======================

  fetchInstrumentsState(): Observable<InstrumentStateFetchResult> {
    return this.serverApi.getInstrumentsState().pipe(
      map(state => ({
        success: true,
        method: 'server' as const,
        state
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server fetch instrument state failed:', serverError.message);
        if (!this.powerAutomate.isV2Configured('instrument')) {
          return of({ success: false, method: 'cache' as const });
        }
        return this.powerAutomate.submitV2('instrument', { actionType: 'getState', data: {} }).pipe(
          map(response => {
            const row = Array.isArray(response.data) ? response.data[0] : undefined;
            if (!row) {
              return { success: false, method: 'cache' as const };
            }
            const itemCount = Number((row as any).itemCount ?? 0);
            const lastModified = (row as any).lastModified ? String((row as any).lastModified) : undefined;
            const version = String((row as any).version ?? `${itemCount}:${lastModified ?? 'none'}`);
            return {
              success: true,
              method: 'powerAutomate' as const,
              state: { itemCount, lastModified, version }
            };
          }),
          catchError(paError => {
            console.warn('[Orchestrator] PA fetch instrument state failed:', paError.message);
            return of({ success: false, method: 'cache' as const });
          })
        );
      })
    );
  }

  fetchInstruments(): Observable<FetchResult> {
    return this.serverApi.getInstruments().pipe(
      map(instruments => ({
        success: true,
        method: 'server' as const,
        instruments
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server fetch instruments failed, trying PA:', serverError.message);
        if (!this.powerAutomate.isV2Configured('instrument')) {
          return of({ success: false, method: 'static' as const, instruments: [] as PwaInstrumentDto[] });
        }
        return this.powerAutomate.submitV2('instrument', { actionType: 'getAllInstruments', data: {} }).pipe(
          map(response => ({
            success: true,
            method: 'powerAutomate' as const,
            instruments: (response.data || []) as PwaInstrumentDto[]
          })),
          catchError(paError => {
            console.warn('[Orchestrator] PA fetch instruments failed:', paError.message);
            return of({ success: false, method: 'static' as const, instruments: [] as PwaInstrumentDto[] });
          })
        );
      })
    );
  }

  fetchInstrumentLogs(tagNumber: string): Observable<PwaInstrumentLogDto[]> {
    if (!tagNumber) {
      return of([]);
    }
    return this.serverApi.getInstrumentLogsByTag(tagNumber).pipe(
      catchError((serverError) => {
        console.warn('[Orchestrator] Server fetch instrument logs failed:', serverError.message);
        return of([]);
      })
    );
  }

  createInstrument(dto: PwaInstrumentDto): Observable<SubmissionResult> {
    const localUuid = dto.localUuid || crypto.randomUUID();
    dto.localUuid = localUuid;

    return this.serverApi.createInstrument(dto).pipe(
      map(response => ({
        success: response.success,
        method: 'server' as const,
        sharepointId: response.sharepointId,
        localUuid,
        message: response.message,
        requiresMerge: response.requiresMerge,
        conflictType: response.conflictType
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server create instrument failed, trying PA:', serverError.message);
        if (!this.powerAutomate.isV2Configured('instrument')) {
          return this.tryServerEmail(
            { subject: `[PWA:INST] New Instrument: ${dto.tagNumber}`, body: this.generateInstrumentEmailBody(dto) },
            [],
            localUuid,
            'Instrument creation failed — server and PA unavailable.'
          );
        }
        return this.powerAutomate.submitV2('instrument', {
          actionType: 'addInstrument',
          data: {
            Tag_x0020_Number: dto.tagNumber,
            Description: dto.description,
            Vendor: dto.vendor,
            Location: dto.location,
            Type: dto.type,
            CurrentStatus: dto.currentStatus || 'Normal Operation',
            PwaId: localUuid
          }
        }).pipe(
          map(response => ({
            success: response.success,
            method: 'powerAutomate' as const,
            sharepointId: response.id,
            localUuid,
            message: 'Instrument created via Power Automate.'
          })),
          catchError(paError => {
            console.warn('[Orchestrator] PA create instrument failed:', paError.message);
            return this.tryServerEmail(
              { subject: `[PWA:INST] New Instrument: ${dto.tagNumber}`, body: this.generateInstrumentEmailBody(dto) },
              [],
              localUuid,
              'All instrument creation methods failed.'
            );
          })
        );
      })
    );
  }

  private generateInstrumentEmailBody(dto: PwaInstrumentDto): string {
    let body = `--- New Instrument ---\n`;
    body += `Tag Number: ${dto.tagNumber}\n`;
    body += `Description: ${dto.description}\n`;
    body += `Vendor: ${dto.vendor}\n`;
    body += `Location: ${dto.location}\n`;
    body += `Type: ${dto.type}\n`;

    const userData = this.userSetup.getUserData();
    if (userData) {
      body += `\n--- Submitter Info ---\n`;
      body += `Name: ${userData.name}\n`;
      body += `Email: ${userData.email}\n`;
    }
    return body;
  }

  // ====================== Instrument Log Submission ======================

  submitInstrumentLog(entry: InstrumentLogEntry): Observable<SubmissionResult> {
    const localUuid = entry.localUuid || crypto.randomUUID();
    entry.localUuid = localUuid;
    const dto = this.convertInstrumentLogToDto(entry);

    return this.tryServerInstrumentLog(dto).pipe(
      switchMap(serverResult => {
        if (serverResult.success && serverResult.method === 'local') {
          console.warn('[Orchestrator] Server stored instrument log locally only, trying PA V1 to reach SharePoint.');
          return this.tryPaInstrumentLog(entry, localUuid).pipe(
            // If PA also fails, keep the local-success result from server.
            catchError(() => of(serverResult))
          );
        }
        return of(serverResult);
      }),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for instrument log, trying PA V1:', serverError.message);
        return this.tryPaInstrumentLog(entry, localUuid);
      })
    );
  }

  private tryServerInstrumentLog(dto: PwaInstrumentLogDto): Observable<SubmissionResult> {
    return this.serverApi.submitInstrumentLog(dto).pipe(
      map(response => ({
        success: response.success,
        method: (response.method as SubmissionResult['method']) || 'server',
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || dto.localUuid,
        message: response.method === 'local'
          ? 'Instrument log saved locally. Will sync to SharePoint when available.'
          : 'Instrument log submitted successfully via server.'
      }))
    );
  }

  private tryPaInstrumentLog(entry: InstrumentLogEntry, localUuid: string): Observable<SubmissionResult> {
    const paUrl = (environment as any).paFlowUrls?.instrumentLog;
    const dtoAttachments = (entry.attachments || []).map(a => ({
      fileName: a.fileName, contentType: a.contentType, base64Content: a.base64Content
    }));

    if (!paUrl) {
      console.warn('[Orchestrator] No PA URL configured for instrumentLog, skipping to email.');
      return this.tryServerEmail(
        this.generateInstrumentLogEmailContent(entry),
        dtoAttachments,
        localUuid,
        'Instrument log PA flow not configured.'
      );
    }

    const request: PowerAutomateRequest<InstrumentLogEntry> = {
      url: paUrl,
      instrumentationLog: entry,
      actionType: 'addInstrumentationLog',
      localUuid,
      attachments: dtoAttachments
    };

    return this.powerAutomate.submitForm(request).pipe(
      map(() => ({
        success: true,
        method: 'powerAutomate' as const,
        localUuid,
        message: 'Instrument log submitted via Power Automate.'
      })),
      catchError(paError => {
        console.warn('[Orchestrator] PA V1 failed for instrument log:', paError.message);
        return this.tryServerEmail(
          this.generateInstrumentLogEmailContent(entry),
          dtoAttachments,
          localUuid,
          'Server and Power Automate failed for instrument log.'
        );
      })
    );
  }

  private convertInstrumentLogToDto(entry: InstrumentLogEntry): PwaInstrumentLogDto {
    let dateStr: string;
    if (entry.date instanceof Date) {
      const d = entry.date;
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      dateStr = String(entry.date || '');
    }

    return {
      localUuid: entry.localUuid || crypto.randomUUID(),
      instrumentTagNumber: entry.instrumentTagNumber || '',
      instrumentDescription: entry.instrumentDescription || '',
      status: entry.status || '',
      date: dateStr,
      time: entry.time || '',
      name: entry.name || '',
      comment: entry.comment || '',
      attachments: (entry.attachments || []).map(a => ({
        fileName: a.fileName,
        contentType: a.contentType,
        base64Content: a.base64Content
      })),
    };
  }

  private generateInstrumentLogEmailContent(entry: InstrumentLogEntry): { subject: string; body: string } {
    const subject = `[PWA:INST] Instrument Log: ${entry.instrumentTagNumber || 'Unknown'}`;
    let body = `--- Instrument Log Entry ---\n`;
    body += `Tag Number: ${entry.instrumentTagNumber}\n`;
    body += `Description: ${entry.instrumentDescription}\n`;
    body += `Status: ${entry.status}\n`;
    body += `Date: ${entry.date}\n`;
    body += `Time: ${entry.time}\n`;
    body += `Name: ${entry.name}\n`;
    body += `Comment: ${entry.comment}\n`;
    if (entry.attachments?.length) {
      body += `Attachments: ${entry.attachments.length} file(s) — not included in email, please retrieve from server.\n`;
    }

    const userData = this.userSetup.getUserData();
    if (userData) {
      body += `\n--- Submitter Info ---\n`;
      body += `Name: ${userData.name}\n`;
      body += `Email: ${userData.email}\n`;
      body += `Phone: ${userData.phone}\n`;
      body += `Company: ${userData.company}\n`;
    }
    return { subject, body };
  }

  generateInstrumentLogEmail(entry: InstrumentLogEntry): { subject: string; body: string; mailto: string } {
    const { subject, body } = this.generateInstrumentLogEmailContent(entry);
    const mailto = this.buildMailtoUrl(subject, body);
    return { subject, body, mailto };
  }

  // ====================== Revoke Methods ======================

  revokeWorkRequest(sharepointId: string, localUuid: string): Observable<SubmissionResult> {
    return this.serverApi.revokeWorkRequest(sharepointId, localUuid).pipe(
      map(response => ({
        success: true,
        method: 'server' as const,
        sharepointId,
        localUuid,
        message: 'Work request revoked successfully via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server revoke failed, trying PA V2:', serverError.message);
        return this.tryPaV2Revoke('workRequest', sharepointId, localUuid);
      })
    );
  }

  revokeJha(sharepointId: string, localUuid: string): Observable<SubmissionResult> {
    return this.serverApi.revokeJha(sharepointId, localUuid).pipe(
      map(response => ({
        success: true,
        method: 'server' as const,
        sharepointId,
        localUuid,
        message: 'JHA revoked successfully via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server JHA revoke failed, trying PA V2:', serverError.message);
        return this.tryPaV2Revoke('jha', sharepointId, localUuid);
      })
    );
  }

  private tryPaV2Revoke(entityType: 'workRequest' | 'jha', sharepointId: string, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured(entityType)) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'All revoke methods failed. Power Automate not configured.'
      });
    }
    return this.powerAutomate.submitV2(entityType, {
      actionType: 'update',
      id: sharepointId,
      data: { Status: 'Revoked' }
    } as any).pipe(
      map(response => ({
        success: response.success,
        method: 'powerAutomate' as const,
        sharepointId,
        localUuid,
        message: 'Revoked via Power Automate.'
      })),
      catchError(() => of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'All revoke methods failed.'
      }))
    );
  }

  // ====================== Update Methods ======================

  updateWorkRequest(workRequest: WorkRequest): Observable<SubmissionResult> {
    const userData = this.userSetup.getUserData();
    if (!userData) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid: workRequest.localUuid || '',
        message: 'User data not configured.'
      });
    }

    const dto = this.serverApi.convertWorkRequestToDto(workRequest, {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      company: userData.company
    });

    return this.serverApi.updateWorkRequest(dto).pipe(
      map(response => ({
        success: true,
        method: 'server' as const,
        sharepointId: response.sharepointId,
        localUuid: response.localUuid,
        message: 'Work request updated successfully via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server update failed, trying PA V2:', serverError.message);
        return this.tryPaV2Update(workRequest, dto.localUuid);
      })
    );
  }

  private tryPaV2Update(workRequest: WorkRequest, localUuid: string): Observable<SubmissionResult> {
    if (!workRequest.sharepointId || !this.powerAutomate.isV2Configured('workRequest')) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'All update methods failed.'
      });
    }

    const userData = this.userSetup.getUserData()!;
    const paRequest = this.powerAutomate.buildCreateRequest(
      workRequest.convertToPaModel() as any,
      userData,
      workRequest.attachments || []
    );
    paRequest.actionType = 'update';
    paRequest.id = workRequest.sharepointId;
    paRequest.data = { ...paRequest.data, Status: 'Updated' };

    return this.powerAutomate.submitV2('workRequest', paRequest).pipe(
      map(response => ({
        success: response.success,
        method: 'powerAutomate' as const,
        sharepointId: workRequest.sharepointId,
        localUuid,
        message: 'Updated via Power Automate.'
      })),
      catchError(() => of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'All update methods failed.'
      }))
    );
  }

  // ====================== Server Email Fallback ======================

  private tryServerEmail(
    emailContent: { subject: string; body: string },
    attachments: { fileName: string; contentType: string; base64Content: string }[],
    localUuid: string,
    context: string
  ): Observable<SubmissionResult> {
    const emailAttachments = (attachments || []).map(a => ({
      fileName: a.fileName,
      contentType: a.contentType,
      base64Content: a.base64Content
    }));

    return this.serverApi.sendFallbackEmail(emailContent.subject, emailContent.body, emailAttachments).pipe(
      map(() => ({
        success: true,
        method: 'email' as const,
        localUuid,
        message: 'Submitted via automated email to operations inbox.'
      })),
      catchError(emailError => {
        console.warn('[Orchestrator] Server email also failed:', emailError.message);
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: `${context} Please submit via email manually.`,
          requiresEmail: true
        });
      })
    );
  }

  // ====================== Email Content Generation ======================

  generateSubmitLink(workRequest: WorkRequest): string {
    const userData = this.userSetup.getUserData();
    const dto: Omit<PwaWorkRequestDto, 'attachments'> & { attachments: never[] } = {
      localUuid: workRequest.localUuid || crypto.randomUUID(),
      company: workRequest.company || '',
      dateOfWork: workRequest.dateOfWork instanceof Date
        ? `${workRequest.dateOfWork.getFullYear()}-${String(workRequest.dateOfWork.getMonth() + 1).padStart(2, '0')}-${String(workRequest.dateOfWork.getDate()).padStart(2, '0')}`
        : String(workRequest.dateOfWork || ''),
      timeOfWork: workRequest.timeOfWork || '',
      locationOfWork: workRequest.locationOfWork || '',
      workRequestedBy: workRequest.workRequestedBy || '',
      affectedEquipment: workRequest.affectedEquipment || '',
      workScope: workRequest.workScope || '',
      isLotoRequired: workRequest.isLOTORequired === 'Yes',
      isHotWorkRequired: workRequest.isHotWorkRequired === 'Yes',
      isConfinedSpaceEntryRequired: workRequest.isConfinedSpaceEntryRequired === 'Yes',
      foremanName: workRequest.foremanName,
      fireWatchName: workRequest.fireWatchName,
      spaceToBeEntered: workRequest.spaceToBeEntered,
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      submitterCompany: userData?.company || '',
      timeSubmitted: ServerApiService.formatCentralTime(new Date()),
      workCategoryName: workRequest.workCategoryName || undefined,
      workAreaId: workRequest.workAreaId || undefined,
      workAreaName: workRequest.workAreaName || undefined,
      attachments: []
    };
    const encoded = btoa(JSON.stringify(dto));
    return `${environment.serverUrl}/api/pwa/work-request/submit-from-email?data=${encoded}`;
  }

  generateEmailContent(workRequest: WorkRequest): { subject: string; body: string; mailto: string; submitLink: string } {
    const userData = this.userSetup.getUserData();
    const localUuid = workRequest.localUuid || crypto.randomUUID();
    const subject = `[PWA:WR:${localUuid}] Work Request: ${workRequest.workScope?.substring(0, 50) || 'New Request'}`;
    const submitLink = this.generateSubmitLink(workRequest);

    let body = workRequest.getEmailBody();
    if (userData) {
      body += `\n--- Submitter Info ---\n`;
      body += `Name: ${userData.name}\n`;
      body += `Email: ${userData.email}\n`;
      body += `Phone: ${userData.phone}\n`;
      body += `Company: ${userData.company}\n`;
    }
    body += `\n--- Auto-Submit Link ---\n`;
    body += `If the server is running, click to submit automatically:\n`;
    body += `${submitLink}\n`;

    const mailto = this.buildMailtoUrl(subject, body);
    return { subject, body, mailto, submitLink };
  }

  generateJhaSubmitLink(jha: Jha): string {
    const userData = this.userSetup.getUserData();
    const dto: Omit<PwaJhaDto, 'attachments'> & { attachments: never[] } = {
      localUuid: jha.localUuid || crypto.randomUUID(),
      workRequestLocalUuid: jha.workRequestLocalUuid,
      workRequestSharepointId: jha.workRequestSharepointId,
      jobName: jha.jobName || '',
      applicability: jha.applicability || '',
      analysisBy: jha.analysisBy || '',
      reviewedBy: jha.reviewedBy || '',
      approvedBy: jha.approvedBy || '',
      date: jha.date || '',
      ppe: jha.ppe || '',
      loto: jha.loto || '',
      confinedSpace: jha.confinedSpace || '',
      hazCom: jha.hazCom || '',
      handAndPowerTools: jha.handAndPowerTools || '',
      specialTools: jha.specialTools || '',
      jobSteps: (jha.jobSteps || []).map((step, i) => ({
        sequence: step.sequence || i + 1,
        description: step.description || '',
        hazard: step.hazard || '',
        safetyMeasures: step.safetyMeasures || ''
      })),
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      submitterCompany: userData?.company || '',
      timeSubmitted: ServerApiService.formatCentralTime(new Date()),
      attachments: []
    };
    const encoded = btoa(JSON.stringify(dto));
    return `${environment.serverUrl}/api/pwa/jha/submit-from-email?data=${encoded}`;
  }

  generateJhaEmailContent(jha: Jha): { subject: string; body: string; mailto: string; submitLink: string } {
    const userData = this.userSetup.getUserData();
    const localUuid = jha.localUuid || crypto.randomUUID();
    const subject = `[PWA:JHA:${localUuid}] JHA: ${jha.jobName?.substring(0, 50) || 'New JHA'}`;
    const submitLink = this.generateJhaSubmitLink(jha);

    let body = jha.getEmailBody();
    if (userData) {
      body += `\n--- Submitter Info ---\n`;
      body += `Name: ${userData.name}\n`;
      body += `Email: ${userData.email}\n`;
      body += `Phone: ${userData.phone}\n`;
      body += `Company: ${userData.company}\n`;
    }
    body += `\n--- Auto-Submit Link ---\n`;
    body += `If the server is running, click to submit automatically:\n`;
    body += `${submitLink}\n`;

    const mailto = this.buildMailtoUrl(subject, body);
    return { subject, body, mailto, submitLink };
  }

  // ====================== Field List ======================

  submitFieldListItem(payload: any): Observable<SubmissionResult> {
    const localUuid = payload.localUuid || crypto.randomUUID();
    payload.localUuid = localUuid;

    return this.serverApi.submitFieldListItem(payload).pipe(
      map(response => ({
        success: !!response.success,
        method: (response.method === 'local' ? 'local' : 'server') as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || localUuid,
        message: response.method === 'local'
          ? 'Saved on server. Will sync to SharePoint when available.'
          : 'Submitted successfully via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for field list, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateFieldList(payload, localUuid);
      })
    );
  }

  updateFieldListItem(payload: any): Observable<SubmissionResult> {
    return this.serverApi.updateFieldListItem(payload).pipe(
      map(response => ({
        success: response.success,
        method: 'server' as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || payload.localUuid,
        message: 'Updated successfully.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for field list update, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateFieldList({ ...payload, actionType: 'update' }, payload.localUuid);
      })
    );
  }

  // ====================== SDS Chemicals ======================

  submitSdsChemical(payload: any): Observable<SubmissionResult> {
    const localUuid = payload.localUuid || crypto.randomUUID();
    payload.localUuid = localUuid;

    return this.serverApi.submitSdsChemical(payload).pipe(
      map(response => ({
        success: !!response.success,
        method: (response.method === 'local' ? 'local' : 'server') as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || localUuid,
        message: response.method === 'local'
          ? 'Saved on server. Will sync to SharePoint when available.'
          : 'Submitted successfully via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for SDS, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateSds(payload, localUuid);
      })
    );
  }

  updateSdsChemical(payload: any): Observable<SubmissionResult> {
    return this.serverApi.updateSdsChemical(payload).pipe(
      map(response => ({
        success: response.success,
        method: 'server' as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || payload.localUuid,
        message: 'Updated successfully.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for SDS update, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateSds({ ...payload, actionType: 'update' }, payload.localUuid);
      })
    );
  }

  private tryPowerAutomateSds(payload: any, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured('sds')) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'Server unavailable and Power Automate not configured.',
        requiresEmail: true
      });
    }

    const primaryName = (payload.names || '').split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)[0] || '';
    const paData: Record<string, any> = {
      Title: primaryName,
      PwaId: localUuid,
      Names: payload.names || '',
      Locations: payload.locations || '',
      Status: payload.statusName || 'Pending',
      Notes: payload.notes || '',
      ProcessedByName: payload.processedByName || '',
      ProcessedByEmail: payload.processedByEmail || '',
      SubmitterName: payload.submitterName || '',
      SubmitterEmail: payload.submitterEmail || '',
      SubmitterPhone: payload.submitterPhone || '',
    };

    const paRequest = {
      actionType: payload.actionType || 'create',
      entity: 'chemical',
      id: payload.sharepointId,
      data: paData,
      attachments: (payload.attachments || []).map((a: any) => ({
        fileName: a.fileName || a.name,
        contentType: a.contentType || 'application/octet-stream',
        base64Content: a.base64Content || a.content
      }))
    };

    return this.powerAutomate.submitV2('sds', paRequest).pipe(
      map(response => {
        const isSuccess = response.success === true || String(response.success).toLowerCase() === 'true';
        return {
          success: isSuccess,
          method: 'powerAutomate' as const,
          sharepointId: response.id,
          localUuid,
          message: isSuccess
            ? 'Submitted directly to SharePoint via Power Automate.'
            : (response.message || 'Power Automate submission failed.')
        };
      }),
      catchError(paError => {
        console.error('[Orchestrator] PA also failed for SDS:', paError.message);
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: 'Both server and Power Automate unavailable. Item saved locally.',
          requiresEmail: true
        });
      })
    );
  }

  submitSdsAudit(payload: any): Observable<SubmissionResult> {
    const localUuid = payload.localUuid || crypto.randomUUID();
    payload.localUuid = localUuid;

    return this.serverApi.submitSdsAudit(payload).pipe(
      map(response => ({
        success: !!response.success,
        method: (response.method === 'local' ? 'local' : 'server') as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || localUuid,
        message: response.method === 'local'
          ? 'Audit saved on server. Will sync to SharePoint when available.'
          : 'Audit recorded via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for SDS audit, trying Power Automate:', serverError.message);
        return this.tryPowerAutomateSdsAudit(payload, localUuid);
      })
    );
  }

  private tryPowerAutomateSdsAudit(payload: any, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured('sds')) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'Server unavailable and Power Automate not configured. Audit saved locally.',
        requiresEmail: true
      });
    }

    const paData: Record<string, any> = {
      Title: payload.chemicalName || '',
      PwaId: localUuid,
      ChemicalSpId: payload.chemicalSharepointId || '',
      ChemicalLocalUuid: payload.chemicalLocalUuid || '',
      ChemicalName: payload.chemicalName || '',
      Action: payload.action || '',
      OldSnapshot: payload.oldSnapshot || '',
      AuditedByName: payload.auditedByName || '',
      AuditedByEmail: payload.auditedByEmail || '',
      Comments: payload.comments || '',
      Campaign: payload.campaign || '',
      AuditedAt: new Date().toISOString()
    };

    return this.powerAutomate.submitV2('sds', { actionType: 'create', entity: 'audit', data: paData, attachments: [] }).pipe(
      map(response => {
        const isSuccess = response.success === true || String(response.success).toLowerCase() === 'true';
        return {
          success: isSuccess,
          method: 'powerAutomate' as const,
          sharepointId: response.id,
          localUuid,
          message: isSuccess
            ? 'Audit recorded directly to SharePoint via Power Automate.'
            : (response.message || 'Power Automate submission failed.')
        };
      }),
      catchError(paError => {
        console.error('[Orchestrator] PA also failed for SDS audit:', paError.message);
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: 'Both server and Power Automate unavailable. Audit saved locally.',
          requiresEmail: true
        });
      })
    );
  }

  // ====================== Inventory ======================

  submitInventoryItem(payload: any): Observable<SubmissionResult> {
    const localUuid = payload.localUuid || crypto.randomUUID();
    payload.localUuid = localUuid;

    return this.serverApi.submitInventoryItem(payload).pipe(
      map(response => ({
        success: !!response.success,
        method: (response.method === 'local' ? 'local' : 'server') as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || localUuid,
        message: response.method === 'local'
          ? 'Saved on server. Will sync to SharePoint when available.'
          : 'Submitted successfully via server.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for inventory, trying PA:', serverError.message);
        return this.tryPowerAutomateInventory(payload, localUuid);
      })
    );
  }

  updateInventoryItem(payload: any): Observable<SubmissionResult> {
    return this.serverApi.updateInventoryItem(payload).pipe(
      map(response => ({
        success: response.success,
        method: 'server' as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || payload.localUuid,
        message: 'Updated successfully.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for inventory update, trying PA:', serverError.message);
        return this.tryPowerAutomateInventory({ ...payload, actionType: 'update' }, payload.localUuid);
      })
    );
  }

  recordInventoryUsage(payload: any): Observable<SubmissionResult> {
    const localUuid = payload.localUuid || crypto.randomUUID();
    payload.localUuid = localUuid;

    return this.serverApi.recordInventoryUsage(payload).pipe(
      map(response => ({
        success: !!response.success,
        method: 'server' as SubmissionResult['method'],
        sharepointId: response.sharepointId,
        localUuid: response.localUuid || localUuid,
        message: 'Usage recorded.'
      })),
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed for usage, trying PA:', serverError.message);
        return this.tryPowerAutomateInventoryUsage(payload, localUuid);
      })
    );
  }

  private tryPowerAutomateInventoryUsage(payload: any, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured('inventory')) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'Server unavailable and Power Automate not configured.',
        requiresEmail: true
      });
    }

    const paData: Record<string, any> = {
      Title: `${payload.qrToken || ''} — ${payload.eventType || ''} by ${payload.userName || ''}`,
      PwaId: localUuid,
      InventoryItemId: payload.inventoryItemId != null ? String(payload.inventoryItemId) : '',
      QrToken: payload.qrToken || '',
      UserName: payload.userName || '',
      UserEmail: payload.userEmail || '',
      Location: payload.location || '',
      Purpose: payload.purpose || '',
      Comments: payload.comments || '',
      EventType: payload.eventType || 'checkout',
      ScannedAt: payload.scannedAt || new Date().toISOString(),
      ReturnedAt: payload.returnedAt || ''
    };

    // Single Inventory flow — entity:"usage" routes to the "Inventory Usage" list
    const paRequest = {
      actionType: 'create',
      entity: 'usage',
      data: paData,
      attachments: []
    };

    return this.powerAutomate.submitV2('inventory', paRequest).pipe(
      map(response => {
        const isSuccess = response.success === true || String(response.success).toLowerCase() === 'true';
        return {
          success: isSuccess,
          method: 'powerAutomate' as const,
          sharepointId: response.id,
          localUuid,
          message: isSuccess
            ? 'Usage recorded directly to SharePoint via Power Automate.'
            : (response.message || 'Power Automate submission failed.')
        };
      }),
      catchError(paError => {
        console.error('[Orchestrator] PA also failed for inventory usage:', paError.message);
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: 'Both server and Power Automate unavailable. Usage saved locally.',
          requiresEmail: true
        });
      })
    );
  }

  private tryPowerAutomateInventory(payload: any, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured('inventory')) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'Server unavailable and Power Automate not configured.',
        requiresEmail: true
      });
    }

    const paData: Record<string, any> = {
      Title: payload.title || '',
      PwaId: localUuid,
      ItemType: payload.itemTypeName || '',
      Status: payload.statusName || 'Available',
      Location: payload.locationName || '',
      SerialNumber: payload.serialNumber || '',
      Manufacturer: payload.manufacturer || '',
      Model: payload.model || '',
      Description: payload.description || '',
      QrToken: payload.qrToken || '',
      CurrentLocation: payload.currentLocation || '',
      CurrentHolderName: payload.currentHolderName || '',
      CurrentHolderEmail: payload.currentHolderEmail || '',
      SubmitterName: payload.submitterName || '',
      SubmitterEmail: payload.submitterEmail || '',
      SubmitterPhone: payload.submitterPhone || '',
    };

    const paRequest = {
      actionType: payload.actionType || 'create',
      entity: 'item',
      id: payload.sharepointId,
      data: paData,
      attachments: (payload.attachments || []).map((a: any) => ({
        fileName: a.fileName || a.name,
        contentType: a.contentType || 'application/octet-stream',
        base64Content: a.base64Content || a.content
      }))
    };

    return this.powerAutomate.submitV2('inventory', paRequest).pipe(
      map(response => {
        const isSuccess = response.success === true || String(response.success).toLowerCase() === 'true';
        return {
          success: isSuccess,
          method: 'powerAutomate' as const,
          sharepointId: response.id,
          localUuid,
          message: isSuccess
            ? 'Submitted directly to SharePoint via Power Automate.'
            : (response.message || 'Power Automate submission failed.')
        };
      }),
      catchError(paError => {
        console.error('[Orchestrator] PA also failed for inventory:', paError.message);
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: 'Both server and Power Automate unavailable. Item saved locally.',
          requiresEmail: true
        });
      })
    );
  }

  /**
   * Get all active inventory items, with PA fallback when the hub is offline.
   * Falls through: hub (5s) → PA getAll (entity=item) → empty list.
   * PA returns SharePoint column names; we map them into the shape the
   * inventory UI expects (title/serialNumber/manufacturer/model/qrToken/etc).
   */
  getInventoryItems(type?: string): Observable<any[]> {
    console.log('[Inventory-Fallback] getInventoryItems called — new bundle is running');
    return this.serverApi.getActiveInventoryItems(type).pipe(
      // Tight budget: the server-api's internal 15s timeout is fine when the
      // hub is answering, but when it's off the browser can hang on a socket
      // for the full 15s. A 5s ceiling here cuts to fallback fast so the
      // user isn't staring at a spinner.
      timeout(5000),
      catchError(serverError => this.paInventoryFallback(type, serverError))
    );
  }

  private paInventoryFallback(type: string | undefined, serverError: any): Observable<any[]> {
    console.warn('[Inventory-Fallback] Hub failed, trying PA getAll:', serverError?.message || serverError);
    if (!this.powerAutomate.isV2Configured('inventory')) {
      console.error('[Inventory-Fallback] PA inventory flow is NOT configured (env.paFlowUrls.inventory is empty) — returning empty list');
      return of([]);
    }
    console.log('[Inventory-Fallback] POSTing to PA with actionType=getAll entity=item');
    const paRequest = {
      actionType: 'getAll',
      entity: 'item',
      data: {},
    };
    return this.powerAutomate.submitV2('inventory', paRequest).pipe(
      map(response => {
        const isSuccess = response?.success === true || String(response?.success).toLowerCase() === 'true';
        if (!isSuccess || !Array.isArray(response?.data)) {
          console.warn('[Inventory-Fallback] PA returned success=false or non-array data:', response?.message, response);
          return [];
        }
        console.log(`[Inventory-Fallback] PA returned ${response.data.length} rows`);
        let items = response.data.map((row: any) => this.mapPaInventoryItem(row));
        items = items.filter(it => it.statusName !== 'Retired');
        if (type) {
          items = items.filter(it => (it.itemTypeName || '').toLowerCase() === type.toLowerCase());
        }
        return items;
      }),
      catchError(paError => {
        console.error('[Inventory-Fallback] PA HTTP call itself failed:', paError?.message || paError);
        return of([]);
      })
    );
  }

  private mapPaInventoryItem(row: any): any {
    // Map SharePoint column names → the shape the PWA inventory UI expects.
    // Keep the SharePoint numeric ID as `sharepointId`; the UI keys off
    // qrToken for scan-lookup, so a missing hub `id` is not fatal.
    return {
      id: null,
      sharepointId: row.ID != null ? String(row.ID) : (row.Id != null ? String(row.Id) : null),
      localUuid: row.PwaId ?? null,
      title: row.Title ?? '',
      itemTypeName: row.ItemType ?? '',
      statusName: row.Status ?? 'Available',
      locationName: row.Location ?? '',
      serialNumber: row.SerialNumber ?? '',
      manufacturer: row.Manufacturer ?? '',
      model: row.Model ?? '',
      description: row.Description ?? '',
      qrToken: row.QrToken ?? '',
      currentLocation: row.CurrentLocation ?? '',
      currentHolderName: row.CurrentHolderName ?? '',
      currentHolderEmail: row.CurrentHolderEmail ?? '',
      submitterName: row.SubmitterName ?? '',
      submitterEmail: row.SubmitterEmail ?? '',
    };
  }

  private tryPowerAutomateFieldList(payload: any, localUuid: string): Observable<SubmissionResult> {
    if (!this.powerAutomate.isV2Configured('fieldList')) {
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'Server unavailable and Power Automate not configured.',
        requiresEmail: true
      });
    }

    const paData: Record<string, any> = {
      Title: payload.title || '',
      PwaId: localUuid,
      ListType: payload.listTypeName || '',
      Status: payload.statusName || 'Open',
      Location: payload.locationName || '',
      SpecificLocation: payload.specificLocation || '',
      Notes: payload.notes || '',
      DateObserved: payload.dateObserved || '',
      EquipmentTag: payload.equipmentTag || '',
      SubmitterName: payload.submitterName || '',
      SubmitterEmail: payload.submitterEmail || '',
      SubmitterPhone: payload.submitterPhone || '',
    };

    const paRequest = {
      actionType: 'create',
      data: paData,
      attachments: (payload.attachments || []).map((a: any) => ({
        fileName: a.fileName || a.name,
        contentType: a.contentType || 'application/octet-stream',
        base64Content: a.base64Content || a.content
      }))
    };

    return this.powerAutomate.submitV2('fieldList', paRequest).pipe(
      map(response => {
        // PA may return success as string "True"/"true" or boolean
        const isSuccess = response.success === true || String(response.success).toLowerCase() === 'true';
        return {
          success: isSuccess,
          method: 'powerAutomate' as const,
          sharepointId: response.id,
          localUuid,
          message: isSuccess
            ? 'Submitted directly to SharePoint via Power Automate.'
            : (response.message || 'Power Automate submission failed.')
        };
      }),
      catchError(paError => {
        console.error('[Orchestrator] Power Automate also failed for field list:', paError.message);
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: 'Both server and Power Automate unavailable. Item saved locally.',
          requiresEmail: true
        });
      })
    );
  }

  private buildMailtoUrl(subject: string, body: string): string {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const ccParam = environment.emailCcRecipients
      ? `&cc=${encodeURIComponent(environment.emailCcRecipients.replace(/;/g, ','))}`
      : '';
    return `mailto:${environment.emailRecipient}?subject=${encodedSubject}${ccParam}&body=${encodedBody}`;
  }
}
