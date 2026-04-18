import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, timeout, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorkRequest } from '../models/permits/work-request.model';
import { Jha } from '../models/permits/jha.model';
import { IAttachment } from '../models/permits/attachment.model';

export interface PwaSubmissionResult {
  success: boolean;
  sharepointId?: string;
  method: 'server' | 'powerAutomate' | 'email' | 'local' | 'duplicate' | 'merge_required' | 'merge';
  message?: string;
  localUuid: string;
  requiresMerge?: boolean;
  conflictType?: string;
}

export interface PwaStatusResult {
  localUuid: string;
  sharepointId?: string;
  status: string;
  submittedAt?: Date;
  submissionMethod?: string;
}

export interface PwaWorkRequestDto {
  localUuid: string;
  sharepointId?: string;
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLotoRequired: boolean;
  isHotWorkRequired: boolean;
  isConfinedSpaceEntryRequired: boolean;
  foremanName?: string;
  fireWatchName?: string;
  spaceToBeEntered?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  timeSubmitted: string;
  workCategoryName?: string;
  workAreaId?: number;
  workAreaName?: string;
  attachments: { fileName: string; contentType: string; base64Content: string }[];
}

export interface PwaUserRegistrationDto {
  pwaUserUuid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  password: string;
}

export interface PwaRegistrationResult {
  success: boolean;
  status: 'created' | 'already_exists' | 'email_taken' | 'error';
  message: string;
  isActive: boolean;
}

export interface PwaRegistrationStatus {
  registered: boolean;
  isActive: boolean;
}

export interface PwaLoginResponse {
  token: string;
  expiresIn: number;
  user: { id: number; name: string; email: string; role: string; permissionLevel: string };
}

export interface PwaServerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  permissionLevel: string;
  isActive: boolean;
  hasSignature?: boolean;
}

export interface PwaConversationDto {
  id: number;
  entityType: string;
  entityId: number;
  initiatorId: number;
  responderId: number | null;
  initiatorName: string;
  responderName: string | null;
  subject: string;
  status: string;
  lastMessageAt: string;
  initiatorUnreadCount: number;
  responderUnreadCount: number;
  currentUserUnreadCount: number;
}

export interface PwaMessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface PwaWorkCategoryProfileDto {
  id: number;
  workCategory: { id: number; name: string } | null;
  standardHazards: { [key: string]: boolean | string } | null;
  standardHotWorkMeasures: { [key: string]: boolean } | null;
  standardConfinedSpaceHazards: { [key: string]: boolean | string } | null;
}

export interface PwaInstrumentLogDto {
  localUuid: string;
  instrumentTagNumber: string;
  instrumentDescription: string;
  status: string;
  date: string;
  time: string;
  name: string;
  comment: string;
  attachments?: { fileName: string; contentType: string; base64Content: string }[];
}

export interface PwaInstrumentDto {
  id?: number;
  tagNumber: string;
  description: string;
  vendor: string;
  location: string;
  type: string;
  currentStatus?: string;
  lastUpdatedDate?: string;
  lastUpdatedTime?: string;
  lastUpdatedBy?: string;
  lastComment?: string;
  sharepointId?: string;
  localUuid?: string;
  mergePolicy?: 'merge' | 'skip' | 'none';
}

export interface PwaInstrumentStateDto {
  itemCount: number;
  lastModified?: string;
  version: string;
}

export interface PwaJhaDto {
  localUuid: string;
  workRequestLocalUuid?: string;
  workRequestSharepointId?: string;
  jobName: string;
  applicability: string;
  analysisBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
  ppe: string;
  loto: string;
  confinedSpace: string;
  hazCom: string;
  handAndPowerTools: string;
  specialTools: string;
  jobSteps: { sequence: number; description: string; hazard: string; safetyMeasures: string }[];
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  timeSubmitted: string;
  attachments: { fileName: string; contentType: string; base64Content: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ServerApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.serverUrl;

  submitWorkRequest(dto: PwaWorkRequestDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/work-request/submit`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  submitJha(dto: PwaJhaDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/jha/submit`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getWorkRequestStatus(localUuid: string): Observable<PwaStatusResult | null> {
    return this.http.get<{ responseData: PwaStatusResult }>(`${this.baseUrl}/api/pwa/work-request/status/${localUuid}`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(err => {
        if (err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  revokeWorkRequest(sharepointId: string, localUuid: string): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/work-request/revoke`, { sharepointId, localUuid }).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  revokeJha(sharepointId: string, localUuid: string): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/jha/revoke`, { sharepointId, localUuid }).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  updateWorkRequest(dto: PwaWorkRequestDto): Observable<PwaSubmissionResult> {
    return this.http.put<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/work-request/update`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  sendFallbackEmail(subject: string, body: string, attachments: { fileName: string; contentType: string; base64Content: string }[]): Observable<string> {
    return this.http.post<{ responseData: string }>(`${this.baseUrl}/api/pwa/email/send-fallback`, {
      subject, body, attachments
    }).pipe(
      timeout(20000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getInstruments(): Observable<PwaInstrumentDto[]> {
    return this.http.get<{ responseData: PwaInstrumentDto[] }>(`${this.baseUrl}/api/pwa/instruments/get-all`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getInstrumentsState(): Observable<PwaInstrumentStateDto> {
    return this.http.get<{ responseData: PwaInstrumentStateDto }>(`${this.baseUrl}/api/pwa/instruments/state`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getWorkAreas(): Observable<{ id: number; name: string; description: string; isConfinedSpace?: boolean }[]> {
    return this.http.get<{ responseData: { id: number; name: string; description: string; isConfinedSpace?: boolean }[] }>(
      `${this.baseUrl}/api/pwa/work-request/work-areas`
    ).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getWorkAreaShapes(): Observable<{ id: number; coordinates: string; originalPictureSize: string; label: string; workAreaIds: number[] }[]> {
    return this.http.get<{ responseData: { id: number; coordinates: string; originalPictureSize: string; label: string; workAreaIds: number[] }[] }>(
      `${this.baseUrl}/api/pwa/work-request/work-area-shapes`
    ).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getWorkCategories(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ responseData: { id: number; name: string }[] }>(
      `${this.baseUrl}/api/pwa/work-request/categories`
    ).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getWorkCategoryProfiles(): Observable<PwaWorkCategoryProfileDto[]> {
    return this.http.get<{ responseData: PwaWorkCategoryProfileDto[] }>(
      `${this.baseUrl}/api/pwa/work-category-hazards/all`
    ).pipe(
      timeout(10000),
      map(response => response.responseData || []),
      catchError(() => of([]))
    );
  }

  getWorkCategoryProfileByName(name: string): Observable<PwaWorkCategoryProfileDto | null> {
    return this.http.get<{ responseData: PwaWorkCategoryProfileDto }>(
      `${this.baseUrl}/api/pwa/work-category-hazards/by-category-name/${encodeURIComponent(name)}`
    ).pipe(
      timeout(10000),
      map(response => response.responseData || null),
      catchError(() => of(null))
    );
  }

  createInstrument(dto: PwaInstrumentDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/instruments/create`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  submitInstrumentLog(dto: PwaInstrumentLogDto): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(`${this.baseUrl}/api/pwa/instrument-log/submit`, dto).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getInstrumentLogsByTag(tagNumber: string): Observable<PwaInstrumentLogDto[]> {
    return this.http.get<{ responseData: PwaInstrumentLogDto[] }>(`${this.baseUrl}/api/pwa/instrument-log/by-instrument/${encodeURIComponent(tagNumber)}`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  registerUser(dto: PwaUserRegistrationDto): Observable<PwaRegistrationResult> {
    return this.http.post<{ responseData: PwaRegistrationResult }>(`${this.baseUrl}/api/pwa/user/register`, dto).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  checkRegistrationStatus(pwaUserUuid: string): Observable<PwaRegistrationStatus | null> {
    return this.http.get<{ responseData: PwaRegistrationStatus }>(`${this.baseUrl}/api/pwa/user/status/${pwaUserUuid}`).pipe(
      timeout(5000),
      map(response => response.responseData),
      catchError(() => of(null))
    );
  }

  // ============ PWA Auth ============

  lookupUser(credential: string): Observable<{ status: string; isActive?: boolean; name?: string; email?: string }> {
    return this.http.post<{ status: string; isActive?: boolean; name?: string; email?: string }>(
      `${this.baseUrl}/api/pwa/auth/lookup`, { credential }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  forgotPassword(credential: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/auth/forgot-password`, { email: credential }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/auth/reset-password`, { token, newPassword }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  pwaLogin(email: string, password: string): Observable<PwaLoginResponse> {
    return this.http.post<PwaLoginResponse>(`${this.baseUrl}/api/pwa/auth/login`, { email, password }).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  pwaRefreshToken(token: string): Observable<PwaLoginResponse> {
    return this.http.post<PwaLoginResponse>(`${this.baseUrl}/api/pwa/auth/refresh`, { token }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ============ PWA Secured Profile ============

  getProfile(): Observable<PwaServerProfile> {
    return this.http.get<PwaServerProfile>(`${this.baseUrl}/api/pwa/secured/profile`).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  updateProfile(data: { name?: string; email?: string; phone?: string; company?: string }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/api/pwa/secured/profile`, data).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/api/pwa/secured/change-password`, {
      currentPassword, newPassword
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ============ PWA Secured Permits ============

  getMyPermits(): Observable<{ permits: any[] }> {
    return this.http.get<{ permits: any[] }>(`${this.baseUrl}/api/pwa/secured/my-permits`).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getPermitDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/pwa/secured/my-permits/${id}`).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  signOnPermit(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/pwa/secured/permits/${id}/sign-on`, {}).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  signOffPermit(id: number, comments?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/pwa/secured/permits/${id}/sign-off`, { comments }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ============ Conversations / Messaging ============

  getMyConversations(): Observable<PwaConversationDto[]> {
    return this.http.get<{ responseData: PwaConversationDto[] }>(`${this.baseUrl}/api/pwa/secured/conversations/my`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getConversationMessages(conversationId: number): Observable<PwaMessageDto[]> {
    return this.http.get<{ responseData: PwaMessageDto[] }>(`${this.baseUrl}/api/pwa/secured/conversations/${conversationId}/messages`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getConversationsForEntity(entityType: string, entityId: number): Observable<PwaConversationDto[]> {
    return this.http.get<{ responseData: PwaConversationDto[] }>(`${this.baseUrl}/api/pwa/secured/conversations/for-entity/${entityType}/${entityId}`).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  startConversation(body: { entityType: string; entityId: number; responderId?: number; subject: string; initialMessageContent: string }): Observable<PwaConversationDto> {
    return this.http.post<{ responseData: PwaConversationDto }>(`${this.baseUrl}/api/pwa/secured/conversations/start`, body).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  sendMessage(conversationId: number, content: string): Observable<PwaMessageDto> {
    return this.http.post<{ responseData: PwaMessageDto }>(`${this.baseUrl}/api/pwa/secured/conversations/${conversationId}/send`, { content }).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  markConversationRead(conversationId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/pwa/secured/conversations/${conversationId}/mark-read`, {}).pipe(
      timeout(5000),
      catchError(this.handleError)
    );
  }

  startConversationFromWr(sharepointId: string, message: string, subject?: string): Observable<PwaConversationDto> {
    return this.http.post<{ responseData: PwaConversationDto }>(`${this.baseUrl}/api/pwa/secured/conversations/start-from-wr`, {
      sharepointId, message, subject
    }).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getUnreadMessageCount(): Observable<number> {
    return this.http.get<{ responseData: number }>(`${this.baseUrl}/api/pwa/secured/conversations/unread-count`).pipe(
      timeout(5000),
      map(response => response.responseData),
      catchError(() => of(0))
    );
  }

  // ============ Notifications ============

  getNotifications(): Observable<{ unreadCount: number; notifications: any[] }> {
    return this.http.get<{ unreadCount: number; notifications: any[] }>(`${this.baseUrl}/api/pwa/secured/notifications`).pipe(
      timeout(5000),
      catchError(() => of({ unreadCount: 0, notifications: [] }))
    );
  }

  markNotificationsRead(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/pwa/secured/notifications/mark-read`, {}).pipe(
      timeout(5000),
      catchError(this.handleError)
    );
  }

  // ============ Signature (file-based) ============

  /** Upload signature for authenticated user */
  uploadSignature(base64Data: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/api/pwa/secured/signature`, { signature: base64Data }).pipe(
      timeout(15000),
      catchError(this.handleError)
    );
  }

  /** Upload signature by pwaUserUuid (unauthenticated, for initial registration) */
  uploadSignatureByUuid(pwaUserUuid: string, base64Data: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/api/pwa/user/signature/${pwaUserUuid}`, { signature: base64Data }).pipe(
      timeout(15000),
      catchError(this.handleError)
    );
  }

  /** Download signature as base64 data URL for authenticated user */
  getSignature(): Observable<{ hasSignature: boolean; signature?: string }> {
    return this.http.get<{ hasSignature: boolean; signature?: string }>(`${this.baseUrl}/api/pwa/secured/signature`).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  isAvailable(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/api/pwa/work-request/health`, { responseType: 'text' }).pipe(
      timeout(5000),
      map(() => true),
      catchError(() => of(false))
    );
  }

  convertWorkRequestToDto(workRequest: WorkRequest, userData: { name: string; email: string; phone: string; company: string }): PwaWorkRequestDto {
    // Extract local date components (avoids UTC date shift from toISOString)
    let dateStr: string;
    if (workRequest.dateOfWork instanceof Date) {
      const d = workRequest.dateOfWork;
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      dateStr = String(workRequest.dateOfWork || '');
    }

    return {
      localUuid: workRequest.localUuid || crypto.randomUUID(),
      sharepointId: workRequest.sharepointId || '',
      company: workRequest.company || '',
      dateOfWork: dateStr,
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
      submitterName: userData.name,
      submitterEmail: userData.email,
      submitterPhone: userData.phone,
      submitterCompany: userData.company,
      timeSubmitted: ServerApiService.formatCentralTime(new Date()),
      workCategoryName: workRequest.workCategoryName || undefined,
      workAreaId: workRequest.workAreaId || undefined,
      workAreaName: workRequest.workAreaName || undefined,
      attachments: this.convertAttachments(workRequest.attachments)
    };
  }

  convertJhaToDto(jha: Jha, userData: { name: string; email: string; phone: string; company: string }): PwaJhaDto {
    return {
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
      submitterName: userData.name,
      submitterEmail: userData.email,
      submitterPhone: userData.phone,
      submitterCompany: userData.company,
      timeSubmitted: ServerApiService.formatCentralTime(new Date()),
      attachments: this.convertAttachments(jha.attachments)
    };
  }

  private convertAttachments(attachments: IAttachment[]): { fileName: string; contentType: string; base64Content: string }[] {
    if (!attachments || attachments.length === 0) return [];
    return attachments.map(a => ({
      fileName: a.fileName,
      contentType: a.contentType,
      base64Content: a.base64Content
    }));
  }

  /** Formats a Date as Central Time: MM/dd/yyyy hh:mm AM/PM */
  static formatCentralTime(date: Date): string {
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).replace(',', '');
  }

  // ====================== Equipment Data (for PWA picker) ======================

  getLotoPoints(): Observable<any[]> {
    return this.http.get<{ responseData: any[] }>(
      `${this.baseUrl}/api/pwa/field-list-item/loto-points`
    ).pipe(
      timeout(15000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  getLocations(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ responseData: { id: number; name: string }[] }>(
      `${this.baseUrl}/api/pwa/field-list-item/locations`
    ).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  // ====================== Field Lists ======================

  getFieldListTypes(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ responseData: { id: number; name: string }[] }>(
      `${this.baseUrl}/api/pwa/field-list-item/list-types`
    ).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  submitFieldListItem(payload: any): Observable<PwaSubmissionResult> {
    return this.http.post<{ responseData: PwaSubmissionResult }>(
      `${this.baseUrl}/api/pwa/field-list-item/submit`,
      payload
    ).pipe(
      timeout(30000),
      map(response => response.responseData)
    );
  }

  updateFieldListItem(payload: any): Observable<PwaSubmissionResult> {
    return this.http.put<{ responseData: PwaSubmissionResult }>(
      `${this.baseUrl}/api/pwa/field-list-item/update`,
      payload
    ).pipe(
      timeout(30000),
      map(response => response.responseData)
    );
  }

  getOpenFieldListItems(listType?: string): Observable<any[]> {
    const params = listType ? `?listType=${encodeURIComponent(listType)}` : '';
    return this.http.get<{ responseData: any[] }>(
      `${this.baseUrl}/api/pwa/secured/field-list/open-items${params}`
    ).pipe(
      timeout(15000),
      map(response => response.responseData || []),
      catchError(this.handleError)
    );
  }

  getFieldListItemStatus(localUuid: string): Observable<PwaStatusResult> {
    return this.http.get<{ responseData: PwaStatusResult }>(
      `${this.baseUrl}/api/pwa/field-list-item/status/${localUuid}`
    ).pipe(
      timeout(10000),
      map(response => response.responseData),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Server request failed';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Server is unreachable';
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    // Only log unexpected errors — suppress noise from expected fallback failures
    if (error.status !== 0 && error.status !== 404 && !errorMessage.includes('Timeout')) {
      console.warn('[ServerAPI]', errorMessage);
    }
    return throwError(() => new Error(errorMessage));
  }
}
