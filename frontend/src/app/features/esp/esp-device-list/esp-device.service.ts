import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { EspDeviceDto } from '../../../models/esp/esp-device.model';

@Injectable({
  providedIn: 'root'
})
export class EspDeviceService {
  private apiUrl = `${environment.apiUrl}/esp-devices`;

  constructor(private http: HttpClient) {}

  /**
   * Get all ESP devices
   */
  getAllEspDevices(): Observable<SpringApiResponse<EspDeviceDto[]>> {
    return this.http.get<SpringApiResponse<EspDeviceDto[]>>(`${this.apiUrl}/all`);
  }

  /**
   * Get all active ESP devices
   */
  getAllActiveEspDevices(): Observable<SpringApiResponse<EspDeviceDto[]>> {
    return this.http.get<SpringApiResponse<EspDeviceDto[]>>(`${this.apiUrl}/active`);
  }

  /**
   * Get ESP device by ID
   */
  getEspDeviceById(id: number): Observable<SpringApiResponse<EspDeviceDto>> {
    return this.http.get<SpringApiResponse<EspDeviceDto>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new ESP device
   */
  createEspDevice(device: EspDeviceDto): Observable<SpringApiResponse<EspDeviceDto>> {
    return this.http.post<SpringApiResponse<EspDeviceDto>>(this.apiUrl, device.toJson());
  }

  /**
   * Update ESP device
   */
  updateEspDevice(id: number, device: EspDeviceDto): Observable<SpringApiResponse<EspDeviceDto>> {
    return this.http.put<SpringApiResponse<EspDeviceDto>>(`${this.apiUrl}/${id}`, device.toJson());
  }

  /**
   * Delete ESP device
   */
  deleteEspDevice(id: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Check if ESP device is reachable
   */
  checkConnection(id: number): Observable<SpringApiResponse<boolean>> {
    return this.http.get<SpringApiResponse<boolean>>(`${this.apiUrl}/${id}/check-connection`);
  }

  /**
   * Get ESP device status
   */
  getEspStatus(id: number): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(`${this.apiUrl}/${id}/status`);
  }

  /**
   * Initialize ESP device
   */
  initializeEspDevice(id: number): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/${id}/initialize`, null);
  }

  /**
   * Turn off all LEDs on ESP device
   */
  turnOffAllLeds(id: number): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/${id}/turn-off-leds`, null);
  }

  /**
   * Initialize all active ESP devices
   */
  initializeAllEspDevices(): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/initialize-all`, null);
  }
}
