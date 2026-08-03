import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { IAttachment } from '../models/permits/attachment.model';
import { ServerApiService } from './server-api.service';
import { AuthService } from '../auth/auth.service';

// 'instrument' covers BOTH the instrument register (getState/getAllInstruments/addInstrument) and the
// instrument log (addInstrumentationLog) — they share one Power Automate flow, demuxed by actionType.
export type PaEntityType = 'workRequest' | 'jha' | 'confinedSpace' | 'instrument' | 'fieldList' | 'inventory' | 'sds' | 'qualifications';

export interface PaV2Request {
  actionType: string;
  /** Optional sub-entity discriminator for multi-list flows (e.g. Inventory: "item" | "usage"). */
  entity?: string;
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

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Submits to a V2 Power Automate flow using the new unified schema.
   */
  submitV2(entityType: PaEntityType, request: PaV2Request): Observable<PaV2Response> {
    return this.postToPa(entityType, request, request.actionType);
  }

  /**
   * Passthrough variant of {@link submitV2}: routes through the SAME gateway/direct + JWT plumbing but
   * forwards {@code body} verbatim as the payload. Use for targets whose Power Automate flow predates
   * the V2 `{actionType,data,...}` schema and must receive their ORIGINAL body unchanged — e.g. the
   * instrument log's `{ instrumentationLog, actionType, localUuid, attachments }`. The flow needs no edits.
   */
  submitV2Raw(entityType: PaEntityType, body: Record<string, any>): Observable<PaV2Response> {
    return this.postToPa(entityType, body, body?.['actionType']);
  }

  private postToPa(entityType: PaEntityType, payload: any, actionLabel?: string): Observable<PaV2Response> {
    const gatewayUrl = (environment as any).paGatewayUrl;
    let url: string;
    let body: any;

    if (gatewayUrl) {
      // Centralized auth: post to ONE gateway flow that verifies the JWT (via the verify-jwt edge
      // function) and forwards to the real, URL-gated target flow. The target flow URLs then live only
      // in the gateway (server-side), never in this bundle.
      //
      // Authorization policy lives ONLY in the gateway flow: it decides which target+actionType combos
      // are public (e.g. workRequest/create, qualifications/getByUser) vs. which require a valid token.
      // So we always forward — no client-side gate to keep in sync. A signed-out user hitting a
      // protected op simply gets a 401 back from the gateway. token:'' for anonymous keeps the
      // {target,token,payload} contract stable (the gateway treats empty/invalid as "not authenticated").
      const token = this.authService.getToken();
      url = gatewayUrl;
      body = { target: entityType, token: token ?? '', payload };
      console.log(`[PA V2] Submitting ${entityType} via auth gateway:`, actionLabel);
    } else {
      const flowUrl = this.getV2FlowUrl(entityType);
      if (!flowUrl) {
        return throwError(() => new Error(`No V2 flow URL configured for entity type: ${entityType}`));
      }
      url = flowUrl;
      body = payload;
      console.log(`[PA V2] Submitting ${entityType}:`, actionLabel);
    }

    return this.http.post<PaV2Response>(url, body).pipe(
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
    // When the gateway is configured it fronts all targets, so per-entity direct URLs are optional.
    return !!(environment as any).paGatewayUrl || !!this.getV2FlowUrl(entityType);
  }

  private getV2FlowUrl(entityType: PaEntityType): string {
    const urls = (environment as any).paFlowUrls;
    if (!urls) return '';
    return urls[entityType] || '';
  }

}
