import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { DailyPermitPackageDto } from "../../models/permits/dailt-permit-package.model";

@Injectable({
  providedIn: 'root'
})
export class DailyPermitPackageService {
  private apiUrl = `${environment.apiUrl}/daily-permit-packages`;

  constructor(private http: HttpClient) {}

  getDailyPermitPackages(): Observable<SpringApiResponse<DailyPermitPackageDto[]>> {
    return this.http.get<SpringApiResponse<DailyPermitPackageDto[]>>(`${this.apiUrl}`);
  }

  getDailyPermitPackageById(id: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.get<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}`);
  }

  createDailyPermitPackage(permitPackage: DailyPermitPackageDto): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    const idModel = DailyPermitPackageDto.toIdModel(permitPackage);
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(this.apiUrl, idModel);
  }

  updateDailyPermitPackage(id: number, permitPackage: DailyPermitPackageDto): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.put<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}`, permitPackage);
  }

  deleteDailyPermitPackage(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  removePermitFromPackage(packageId: number, permitType: string, permitId: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.delete<SpringApiResponse<DailyPermitPackageDto>>(
      `${this.apiUrl}/${packageId}/permits/${permitType}/${permitId}`
    );
  }

  buildPermits(dailtyPermitPackage: DailyPermitPackageDto): Observable<SpringApiResponse<String>> {
    return this.http.post<SpringApiResponse<String>>(`${this.apiUrl}/build-permits`, dailtyPermitPackage);
  }
  buildPermitsById(packageId: string, whatToBuild: string = 'all', id: number = 0): Observable<SpringApiResponse<String>> {
    return this.http.get<SpringApiResponse<String>>(`${this.apiUrl}/build-permits/${packageId}/${whatToBuild}/${id}`);
  }
  reissuePermits(packageIdToReissue: number, targetPackageId: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/reissue-permits-from/${packageIdToReissue}/to/${targetPackageId}`, null);
  }
  reissuePermitsWithDate(packageIdToReissue: number, targetPackageId: number, date: string, time: string): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/reissue-permits-from/${packageIdToReissue}/to/${targetPackageId}`, { date, time });
  }
  reissueCurrentPackage(packageId: number, date: string, time: string): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${packageId}/reissue`, { date, time });
  }
  reissuePermitsByWorkRequestId(workRequestId: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/reissue-permits-by-work-request-id/${workRequestId}`, null);
  }

  activatePackage(id: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/activate`, {});
  }

  putPackageUnderTest(id: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/test`, {});
  }

  closePackage(id: number, closureData?: Record<string, any>): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/close`, closureData ?? {});
  }

  /**
   * Cancel a package — the work is not going ahead.
   *
   * <p>Not the same as Close (the work happened and finished) and not the same as Delete, which is
   * what operators were reaching for: that records no reason and writes no modification.
   *
   * @param cancelWorkRequests true (the default) also cancels the originating requests. False
   *   returns them to the operator queue, for when the package rather than the job was the mistake.
   */
  cancelPackage(id: number, reason: string, cancelWorkRequests = true): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(
      `${this.apiUrl}/${id}/cancel`, { reason, cancelWorkRequests });
  }

  foremanSignOn(id: number, body: { personName: string; company: string }): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/foreman-sign-on`, body);
  }

  foremanSignOff(id: number, body: { workCompleted: boolean; comments: string; scopeChanged: boolean; scopeDetails: string; continueDate: string; continueTime: string }): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/foreman-sign-off`, body);
  }

  generateContinuation(id: number): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/generate-continuation`, {});
  }

  signOnPerson(id: number, body: { personName: string; personRole: string; company: string }): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/sign-on`, body);
  }

  signOffPerson(id: number, body: { personName: string; comments: string }): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}/sign-off`, body);
  }

  applyDateTimeToPackagePermits(
    id: number,
    date: string,
    time: string
  ): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(
      `${this.apiUrl}/${id}/apply-date-time`,
      { date, time }
    );
  }
}
