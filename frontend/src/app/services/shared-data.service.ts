import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { shareReplay, tap } from 'rxjs/operators';
import { ValueDto } from '../models/value.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private systemsSubject = new BehaviorSubject<any[]>([]);
  private equipmentTypesSubject = new BehaviorSubject<any[]>([]);
  private fileTypeSubject = new BehaviorSubject<any[]>([]);

  systems$: Observable<any[]> = this.systemsSubject.asObservable();
  equipmentTypes$: Observable<any[]> = this.equipmentTypesSubject.asObservable();
  fileTypes$: Observable<any[]> = this.fileTypeSubject.asObservable();

  private cachedSystems$: Observable<any[]> | null = null;
  private cachedEquipmentTypes$: Observable<any[]> | null = null;
  private cachedFileTypes$: Observable<any[]> | null = null;

  private url = environment.apiUrl+'/values';

  constructor(private http: HttpClient) {}


  loadSystems(): Observable<any[]> {
    if (!this.cachedSystems$) {
      this.cachedSystems$ = this.http.get<any[]>('/of-category/system').pipe(
        tap(data => this.systemsSubject.next(data)),
        shareReplay(1)
      );
    }
    return this.cachedSystems$;
  }

  loadEquipmentTypes(): Observable<any[]> {
    if (!this.cachedEquipmentTypes$) {
      this.cachedEquipmentTypes$ = this.http.get<any[]>('/of-category/equipmentType').pipe(
        tap(data => this.equipmentTypesSubject.next(data)),
        shareReplay(1)
      );
    }
    return this.cachedEquipmentTypes$;
  }

  loadFileTypes(): Observable<any[]> {
    if (!this.cachedFileTypes$) {
      this.cachedFileTypes$ = this.http.get<any[]>(this.url+'/of-category/fileType').pipe(
        tap(data => this.fileTypeSubject.next(data)),
        shareReplay(1)
      );
    }
    return this.cachedFileTypes$;
  }

  updateSystems(systems: any[]) {
    this.systemsSubject.next(systems);
  }

  updateEquipmentTypes(types: any[]) {
    this.equipmentTypesSubject.next(types);
  }

  updateFileTypes(fileTypes: any[]) {
    this.fileTypeSubject.next(fileTypes);
  }

  clearCache() {
    this.cachedSystems$ = null;
    this.cachedEquipmentTypes$ = null;
    this.cachedFileTypes$ = null;
  }
}