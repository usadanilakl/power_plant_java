import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { SimEquipmentDto } from '../models/sim-equipment.model';

@Injectable({ providedIn: 'root' })
export class SimEquipmentApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/sim-equipment`;
  readonly equipmentMap = signal<Map<number, SimEquipmentDto>>(new Map());
  readonly equipmentList = computed(() => [...this.equipmentMap().values()]);

  getAll(): Observable<SpringApiResponse<SimEquipmentDto[]>> {
    return this.http.get<SpringApiResponse<SimEquipmentDto[]>>(`${this.baseUrl}/get-all`);
  }

  getById(id: number): Observable<SpringApiResponse<SimEquipmentDto>> {
    return this.http.get<SpringApiResponse<SimEquipmentDto>>(`${this.baseUrl}/get-by-id/${id}`);
  }

  search(query: string): Observable<SpringApiResponse<SimEquipmentDto[]>> {
    return this.http.get<SpringApiResponse<SimEquipmentDto[]>>(`${this.baseUrl}/search`, {
      params: { q: query },
    });
  }

  findBySource(type: string, id: number): Observable<SpringApiResponse<SimEquipmentDto>> {
    return this.http.get<SpringApiResponse<SimEquipmentDto>>(`${this.baseUrl}/by-source`, {
      params: { type, id: id.toString() },
    });
  }

  create(dto: SimEquipmentDto): Observable<SpringApiResponse<SimEquipmentDto>> {
    return this.http.post<SpringApiResponse<SimEquipmentDto>>(this.baseUrl, dto);
  }

  fromLotoPoint(lotoPointId: number): Observable<SpringApiResponse<SimEquipmentDto>> {
    return this.http.post<SpringApiResponse<SimEquipmentDto>>(`${this.baseUrl}/from-loto-point/${lotoPointId}`, {});
  }

  fromEquipment(equipmentId: number): Observable<SpringApiResponse<SimEquipmentDto>> {
    return this.http.post<SpringApiResponse<SimEquipmentDto>>(`${this.baseUrl}/from-equipment/${equipmentId}`, {});
  }

  update(id: number, dto: SimEquipmentDto): Observable<SpringApiResponse<SimEquipmentDto>> {
    return this.http.put<SpringApiResponse<SimEquipmentDto>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  loadAllIntoCache(): void {
    this.getAll().subscribe({
      next: (res) => {
        const next = new Map<number, SimEquipmentDto>();
        for (const eq of res.responseData || []) {
          if (eq.id != null) next.set(eq.id, eq);
        }
        this.equipmentMap.set(next);
      },
    });
  }

  upsertCached(dto: SimEquipmentDto): void {
    if (dto.id == null) return;
    this.equipmentMap.update(current => {
      const next = new Map(current);
      next.set(dto.id!, dto);
      return next;
    });
  }

  removeCached(id: number): void {
    this.equipmentMap.update(current => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }

  getCachedById(id: number | null | undefined): SimEquipmentDto | null {
    if (id == null) return null;
    return this.equipmentMap().get(id) ?? null;
  }
}
