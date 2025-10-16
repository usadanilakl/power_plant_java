import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout, catchError, of, Observable, throwError } from 'rxjs';
import { PowerAutomateRequest } from '../models/api/power-automate-request.model';

@Injectable({
  providedIn: 'root'
})
export class PowerAutomateService {

    private permitsUrl = 'https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms';

  constructor(private http: HttpClient) { }

  /**
   * Submits form data to a Power Automate workflow.
   * @param request - The configuration for the request.
   * @returns An observable that emits the response from Power Automate.
   */
  submitForm<T>(request: PowerAutomateRequest<T>): Observable<any> {
    const { data, entityKey, actionType } = request;
    let { url } = request;

    if(!url || url === '') {
        url = this.permitsUrl;
    }

    const body = {
      actionType,
      [entityKey]: data
    };

    return this.http.post(url, body).pipe(
      timeout(15000), // 15-second timeout
      catchError((error: any) => {
        if (error.name === 'TimeoutError') {
          console.error('Request timed out.');
          // Here you could call a notification service for a specific timeout message
          // this.notificationService.showError('Submission is taking too long. Please check your connection and try again.');
        } else {
          console.error('Error submitting form to Power Automate:', error.message);
          // this.notificationService.showError('Failed to submit request. Please try again.');
        }
        // Re-throw the error to be handled by the subscriber
        return throwError(() => error);
      })
    );
  }
}