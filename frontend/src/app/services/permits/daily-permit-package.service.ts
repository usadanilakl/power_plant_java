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
    return this.http.post<SpringApiResponse<DailyPermitPackageDto>>(this.apiUrl, permitPackage);
  }

  updateDailyPermitPackage(id: number, permitPackage: DailyPermitPackageDto): Observable<SpringApiResponse<DailyPermitPackageDto>> {
    return this.http.put<SpringApiResponse<DailyPermitPackageDto>>(`${this.apiUrl}/${id}`, permitPackage);
  }

  deleteDailyPermitPackage(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
  buildPermits(dailtyPermitPackage: DailyPermitPackageDto): Observable<SpringApiResponse<String>> {
    return this.http.post<SpringApiResponse<String>>(`${this.apiUrl}/build-permits`, dailtyPermitPackage);
  }
  buildPermitsById(packageId: string): Observable<SpringApiResponse<String>> {
    return this.http.get<SpringApiResponse<String>>(`${this.apiUrl}/build-permits/${packageId}`);
  }
}