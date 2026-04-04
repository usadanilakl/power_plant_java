import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError, Observable, throwError } from 'rxjs';
import { PowerAutomateRequest } from '../models/api/power-automate-request.model';
import { environment } from '../../environments/environment';
import { IAttachment } from '../models/permits/attachment.model';
import { ServerApiService } from './server-api.service';

export type PaEntityType = 'workRequest' | 'jha' | 'confinedSpace' | 'instrumentLog' | 'instrument' | 'fieldList';

export interface PaV2Request {
  actionType: string;
  id?: string;
  data: Record<string, any>;
  attachments?: { fileName: string; contentType: string; base64Content: string }[];
}

export interface PaV2Response {
  success: boolean;
  id?: string;
  data?: any[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PowerAutomateService {

  private permitsUrl = environment.powerAutomateUrl;

  constructor(private http: HttpClient) { }

  /**
   * Submits form data to an old (V1) Power Automate workflow.
   * Kept for backward compatibility with existing flows.
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

    console.log('Submitting form data to Power Automate (V1):', body);

    return this.http.post(paUrl, body).pipe(
      timeout(15000),
      catchError((error: any) => {
        if (error.name === 'TimeoutError') {
          console.error('Request timed out.');
        } else {
          console.error('Error submitting form to Power Automate:', error.message);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Submits to a V2 Power Automate flow using the new unified schema.
   */
  submitV2(entityType: PaEntityType, request: PaV2Request): Observable<PaV2Response> {
    const flowUrl = this.getV2FlowUrl(entityType);
    if (!flowUrl) {
      return throwError(() => new Error(`No V2 flow URL configured for entity type: ${entityType}`));
    }

    console.log(`[PA V2] Submitting ${entityType}:`, request.actionType);

    return this.http.post<PaV2Response>(flowUrl, request).pipe(
      timeout(60000), // 60s for attachment uploads
      catchError((error: any) => {
        if (error.name === 'TimeoutError') {
          console.error(`[PA V2] ${entityType} request timed out`);
        } else {
          console.error(`[PA V2] ${entityType} error:`, error.message);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Convenience: Build a V2 create request with contact info and attachments.
   */
  buildCreateRequest(
    data: Record<string, any>,
    userData: { name: string; email: string; phone: string; company: string },
    attachments?: IAttachment[]
  ): PaV2Request {
    return {
      actionType: 'create',
      data: {
        ...data,
        SubmitterName: userData.name,
        SubmitterEmail: userData.email,
        SubmitterPhone: userData.phone,
        SubmitterCompany: userData.company,
        TimeSubmitted: ServerApiService.formatCentralTime(new Date())
      },
      attachments: attachments?.map(a => ({
        fileName: a.fileName,
        contentType: a.contentType,
        base64Content: a.base64Content
      })) ?? []
    };
  }

  isV2Configured(entityType: PaEntityType): boolean {
    return !!this.getV2FlowUrl(entityType);
  }

  private getV2FlowUrl(entityType: PaEntityType): string {
    const urls = (environment as any).paFlowUrls;
    if (!urls) return '';
    return urls[entityType] || '';
  }

}
