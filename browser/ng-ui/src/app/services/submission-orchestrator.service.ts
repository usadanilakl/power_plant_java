import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { ServerApiService, PwaSubmissionResult, PwaWorkRequestDto } from './server-api.service';
import { PowerAutomateService } from './power-automate.service';
import { UserSetupService } from './user-setup.service';
import { WorkRequest } from '../models/permits/work-request.model';
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

    return this.tryServer(dto).pipe(
      catchError(serverError => {
        console.warn('[Orchestrator] Server failed, trying Power Automate:', serverError.message);
        return this.tryPowerAutomate(workRequest, dto.localUuid);
      })
    );
  }

  private tryServer(dto: PwaWorkRequestDto): Observable<SubmissionResult> {
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

  private tryPowerAutomate(workRequest: WorkRequest, localUuid: string): Observable<SubmissionResult> {
    const paRequest = {
      url: '',
      workForm: workRequest.convertToPaModel(),
      actionType: 'save' as const
    };

    return this.powerAutomate.submitForm(paRequest).pipe(
      map((response: any) => ({
        success: true,
        method: 'powerAutomate' as const,
        sharepointId: response?.id,
        localUuid,
        message: 'Submitted successfully via Power Automate.'
      })),
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

  generateEmailContent(workRequest: WorkRequest): { subject: string; body: string; mailto: string } {
    const userData = this.userSetup.getUserData();
    const subject = `Work Request: ${workRequest.workScope?.substring(0, 50) || 'New Request'}`;

    let body = workRequest.getEmailBody();
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
