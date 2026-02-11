import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout, catchError, of, Observable, throwError, delay, timer, switchMap } from 'rxjs';
import { PowerAutomateRequest } from '../models/api/power-automate-request.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PowerAutomateService {

  private permitsUrl = environment.powerAutomateUrl;

  constructor(private http: HttpClient) { }

  /**
   * Submits form data to a Power Automate workflow.
   * @param request - The configuration for the request.
   * @returns An observable that emits the response from Power Automate.
   */
  submitForm<T>(request: PowerAutomateRequest<T>): Observable<any> {

    const paUrl  = request.url || this.permitsUrl;
    const { url: requestUrl, ...requestBody } = request;

    // Filter out null, undefined, and empty string values from the body
    const body = Object.entries(requestBody).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        (acc as any)[key] = value;
      }
      return acc;
    }, {});


    console.log('Submitting form data to Power Automate:', body);
    console.log('Request URL:', paUrl);




    // return throwError(() => of('Error submitting form to Power Automate'))

    return this.http.post(paUrl, body).pipe(
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