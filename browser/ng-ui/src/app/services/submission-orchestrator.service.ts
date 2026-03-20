import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
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

  private buildMailtoUrl(subject: string, body: string): string {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const ccParam = environment.emailCcRecipients
      ? `&cc=${encodeURIComponent(environment.emailCcRecipients.replace(/;/g, ','))}`
      : '';
    return `mailto:${environment.emailRecipient}?subject=${encodedSubject}${ccParam}&body=${encodedBody}`;
  }
}
