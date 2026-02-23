import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { ServerApiService, PwaSubmissionResult, PwaWorkRequestDto, PwaJhaDto } from './server-api.service';
import { PowerAutomateService } from './power-automate.service';
import { UserSetupService } from './user-setup.service';
import { WorkRequest } from '../models/permits/work-request.model';
import { Jha } from '../models/permits/jha.model';
import { environment } from '../../environments/environment';

export interface SubmissionResult {
  success: boolean;
  method: 'server' | 'powerAutomate' | 'email';
  sharepointId?: string;
  localUuid: string;
  message?: string;
  requiresEmail?: boolean;
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
      []
    );
    paRequest.actionType = 'update';
    paRequest.id = workRequest.sharepointId;

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
      attachments: []
    };
    const encoded = btoa(JSON.stringify(dto));
    return `${environment.serverUrl}/api/pwa/work-request/submit-from-email?data=${encoded}`;
  }

  generateEmailContent(workRequest: WorkRequest): { subject: string; body: string; mailto: string; submitLink: string } {
    const userData = this.userSetup.getUserData();
    const subject = `Work Request: ${workRequest.workScope?.substring(0, 50) || 'New Request'}`;
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

  generateJhaEmailContent(jha: Jha): { subject: string; body: string; mailto: string } {
    const userData = this.userSetup.getUserData();
    const subject = `JHA: ${jha.jobName?.substring(0, 50) || 'New JHA'}`;

    let body = jha.getEmailBody();
    if (userData) {
      body += `\n--- Submitter Info ---\n`;
      body += `Name: ${userData.name}\n`;
      body += `Email: ${userData.email}\n`;
      body += `Phone: ${userData.phone}\n`;
      body += `Company: ${userData.company}\n`;
    }

    const mailto = this.buildMailtoUrl(subject, body);
    return { subject, body, mailto };
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
