import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';
import { ValueDto } from '../models/value.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { environment } from '../../environments/environment';
import { CategoryDto } from '../models/category.model';
import { ValueService } from './value.service';

interface CategoryData {
  [category: string]: ValueDto[];
}

@Injectable({
  providedIn: 'root'
})
export class CurrentValueService {
  private url = environment.apiUrl + '/values';
  private allDataSubject = new BehaviorSubject<CategoryData>({});
  private allData$: Observable<CategoryData>;

  private valueService = inject(ValueService);

  constructor(private http: HttpClient) {
    this.allData$ = this.allDataSubject.asObservable();
    this.loadAllData();
  }
  
  private loadAllData() {
    this.http.get<SpringApiResponse<ValueDto[]>>(this.url + '/all-values').pipe(
      map(response => response.responseData),
      map(values => {
        const categoryData: CategoryData = {};
        values.forEach(value => {
          if (!categoryData[value.category.alias]) {
            categoryData[value.category.alias] = [];
          }
          categoryData[value.category.alias].push(value);
        });
        return categoryData;
      }),
      tap(data => this.allDataSubject.next(data)),
      catchError(error => {
        console.error('Error loading data:', error);
        return of({});
      }),
      shareReplay(1)
    ).subscribe();
  }

  updateCategoryWithNewValue(category: string, newValueName: string) {
    const currentData = this.allDataSubject.value;
    if (!currentData[category]) {
      currentData[category] = [];
    }

    const categoryDto = new CategoryDto({ name: category, alias: category });
    const newValue = new ValueDto({ name: newValueName, category: categoryDto });
    currentData[category].push(newValue);
    this.allDataSubject.next({...currentData});

    // Optionally, you can also send this update to the server
    return this.valueService.addValueToCategoryByName(category,newValueName).pipe(
      tap(response => {
        // Update the local data with the server response if needed
        const updatedValue = response.responseData;
        const updatedData = {...this.allDataSubject.value};
        const index = updatedData[category].findIndex(v => v.id === updatedValue.id);
        if (index !== -1) {
          updatedData[category][index] = updatedValue;
        } else {
          updatedData[category].push(updatedValue);
        }
        this.allDataSubject.next(updatedData);
      }),
      catchError(error => {
        console.error('Error updating category:', error);
        // Revert the local change if the server update fails
        this.allDataSubject.next(currentData);
        return of(null);
      })
    );
  }

  reloadAllData() {
    console.log('Reloading all data...');
    this.loadAllData();
  }

  // You can add more methods here as needed, for example:
  getAllCategories(): string[] {
    return Object.keys(this.allDataSubject.value);
  }

  // If you need to expose the entire dataset as an Observable
  getAllData(): Observable<CategoryData> {
    return this.allData$;
  }

  getValuesByCategory(category: string): Observable<ValueDto[]> {
    return this.allData$.pipe(
      map(data => data[category] || []),
      shareReplay(1)
    );
  }
}