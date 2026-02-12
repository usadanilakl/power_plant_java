import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
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
      return of({
        success: false,
        method: 'email' as const,
        localUuid,
        message: 'Power Automate flow not configured. Please submit via email.',
        requiresEmail: true
      });
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
        return of({
          success: false,
          method: 'email' as const,
          localUuid,
          message: 'All submission methods failed. Please submit via email.',
          requiresEmail: true
        });
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
          return of({
            success: false,
            method: 'email' as const,
            localUuid,
            message: 'All JHA submission methods failed. Please submit via email.',
            requiresEmail: true
          });
        })
      );
    }

    // No V1 fallback for JHA - it didn't exist before
    return of({
      success: false,
      method: 'email' as const,
      localUuid,
      message: 'JHA Power Automate flow not configured. Please submit via email.',
      requiresEmail: true
    });
  }

  generateSubmitLink(workRequest: WorkRequest): string {
    const userData = this.userSetup.getUserData();
    const dto: Omit<PwaWorkRequestDto, 'attachments'> & { attachments: never[] } = {
      localUuid: workRequest.localUuid || crypto.randomUUID(),
      company: workRequest.company || '',
      dateOfWork: workRequest.dateOfWork instanceof Date
        ? workRequest.dateOfWork.toISOString().split('T')[0]
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
      timeSubmitted: new Date().toISOString(),
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

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailto = `mailto:${environment.emailRecipient}?subject=${encodedSubject}&body=${encodedBody}`;

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

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailto = `mailto:${environment.emailRecipient}?subject=${encodedSubject}&body=${encodedBody}`;

    return { subject, body, mailto };
  }
}
