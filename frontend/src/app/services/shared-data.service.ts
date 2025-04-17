import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, tap } from 'rxjs/operators';
import { ValueDto } from '../models/value.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private systemsSubject = new BehaviorSubject<ValueDto[]>([]);
  private equipmentTypesSubject = new BehaviorSubject<ValueDto[]>([]);
  private fileTypeSubject = new BehaviorSubject<ValueDto[]>([]);
  private vendorsSubject = new BehaviorSubject<ValueDto[]>([]);

  systems$: Observable<ValueDto[]> = this.systemsSubject.asObservable();
  equipmentTypes$: Observable<ValueDto[]> = this.equipmentTypesSubject.asObservable();
  fileTypes$: Observable<ValueDto[]> = this.fileTypeSubject.asObservable();
  vendors$: Observable<ValueDto[]> = this.vendorsSubject.asObservable();

  private cachedSystems$: Observable<ValueDto[]> | null = null;
  private cachedEquipmentTypes$: Observable<ValueDto[]> | null = null;
  private cachedFileTypes$: Observable<ValueDto[]> | null = null;
  private cachedVendors$: Observable<ValueDto[]> | null = null;

  private url = environment.apiUrl + '/values';

  constructor(private http: HttpClient) {}

  private loadValuesOfCategory(category: string): Observable<ValueDto[]> {
    return this.http.get<SpringApiResponse<ValueDto[]>>(this.url + `/of-category/${category}`).pipe(
      map(response => response.responseData),
      shareReplay(1)
    );
  }

  loadSystems(): Observable<ValueDto[]> {
    if (!this.cachedSystems$) {
      this.cachedSystems$ = this.loadValuesOfCategory('system').pipe(
        tap(data => this.systemsSubject.next(data))
      );
    }
    return this.cachedSystems$;
  }

  loadEquipmentTypes(): Observable<ValueDto[]> {
    if (!this.cachedEquipmentTypes$) {
      this.cachedEquipmentTypes$ = this.loadValuesOfCategory('equipmentType').pipe(
        tap(data => this.equipmentTypesSubject.next(data))
      );
    }
    return this.cachedEquipmentTypes$;
  }

  loadFileTypes(): Observable<ValueDto[]> {
    if (!this.cachedFileTypes$) {
      this.cachedFileTypes$ = this.loadValuesOfCategory('fileType').pipe(
        tap(data => this.fileTypeSubject.next(data))
      );
    }
    return this.cachedFileTypes$;
  }

  loadVendors(): Observable<ValueDto[]> {
    if (!this.cachedVendors$) {
      this.cachedVendors$ = this.loadValuesOfCategory('vendor').pipe(
        tap(data => this.vendorsSubject.next(data))
      );
    }
    return this.cachedVendors$;
  }
  


  updateSystems(systems: ValueDto[]) {
    this.systemsSubject.next(systems);
  }

  updateEquipmentTypes(types: ValueDto[]) {
    this.equipmentTypesSubject.next(types);
  }

  updateFileTypes(fileTypes: ValueDto[]) {
    this.fileTypeSubject.next(fileTypes);
  }

  updateVendors(vendors: ValueDto[]) {
    this.fileTypeSubject.next(vendors);
  }



  clearCache() {
    this.cachedSystems$ = null;
    this.cachedEquipmentTypes$ = null;
    this.cachedFileTypes$ = null;
  }
}