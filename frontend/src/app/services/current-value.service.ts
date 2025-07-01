import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';
import { ValueDto } from '../models/value.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { environment } from '../../environments/environment';
import { CategoryDto } from '../models/category.model';
import { ValueService } from './value.service';
import { Option } from '../models/option.model';

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

  private allCategoriesSubject = new BehaviorSubject<CategoryDto[]>([]);
  private allCategories$: Observable<CategoryDto[]>;

  private currentValuesSubject = new BehaviorSubject<ValueDto[]>([]);
  currentValues$: Observable<ValueDto[]> = this.currentValuesSubject.asObservable();

  private valueService = inject(ValueService);

  constructor(private http: HttpClient) {
    this.allData$ = this.allDataSubject.asObservable();
    this.loadAllData();
    this.allCategories$ = this.allCategoriesSubject.asObservable();
    this.loadAllCategories();
  }
  
  private loadAllData() {
    this.http.get<SpringApiResponse<ValueDto[]>>(this.url + '/all-values').pipe(
      map(response => {
        this.currentValuesSubject.next(response.responseData)
        return response.responseData
      }),
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

  private loadAllCategories() {
    this.valueService.getAllCategories().pipe(
      tap(response => {
        console.log('Loaded categories:', response.responseData);
        this.allCategoriesSubject.next(response.responseData);
      }),
      catchError(error => {
        console.error('Error loading categories:', error);
        return of([]);
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

  
  updateValue(valueId: number, newName: string): Observable<ValueDto> {
    return this.valueService.updateValue(valueId,newName).pipe(
      map(response => response.responseData),
      tap(updatedValue => {
        // Update the value in the local state
        const currentData = {...this.allDataSubject.value};
        for (const category in currentData) {
          const index = currentData[category].findIndex(v => v.id === valueId);
          if (index !== -1) {
            currentData[category][index] = updatedValue;
            break;
          }
        }
        this.allDataSubject.next(currentData);
  
        // Update the currentValuesSubject
        const currentValues = this.currentValuesSubject.value;
        const valueIndex = currentValues.findIndex(v => v.id === valueId);
        if (valueIndex !== -1) {
          const updatedValues = [...currentValues];
          updatedValues[valueIndex] = updatedValue;
          this.currentValuesSubject.next(updatedValues);
        }
      }),
      catchError(error => {
        console.error('Error updating value:', error);
        return throwError(() => new Error('Failed to update value'));
      })
    );
  }

  deleteValueAndTransfer(valueIdToDelete: number, transferToValueId: number): Observable<SpringApiResponse<any>> {
    return this.valueService.deleteValueAndTransfer(valueIdToDelete, transferToValueId).pipe(
      tap(result => {
        // Update the local state
        const currentData = {...this.allDataSubject.value};
        for (const category in currentData) {
          // Remove the deleted value
          currentData[category] = currentData[category].filter(v => v.id !== valueIdToDelete);
        }
        this.allDataSubject.next(currentData);
  
        // Update the currentValuesSubject
        const currentValues = this.currentValuesSubject.value.filter(v => v.id !== valueIdToDelete);
        this.currentValuesSubject.next(currentValues);
  
        console.log('Value deleted and items transferred:', result);
      }),
      catchError(error => {
        console.error('Error deleting value and transferring items:', error);
        return throwError(() => new Error('Failed to delete value and transfer items'));
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

  getAllCategoryDtos(): Observable<CategoryDto[]> {
    return this.allCategories$;
  }

  getAllValueDtos(): Observable<ValueDto[]> {
    return this.currentValues$;
  }

  // If you need to expose the entire dataset as an Observable
  getAllData(): Observable<CategoryData> {
    return this.allData$;
  }

  getValuesByCategory(category: string): Observable<ValueDto[]> {
    console.log("All data: ", this.allDataSubject.value);
    return this.allData$.pipe(
      map(data => data[category] || []),
      shareReplay(1)
    );
  }

  getOptionsByCategory(category: string): Observable<Option[]> {
    return this.getValuesByCategory(category).pipe(
      map(values => values.map(v => ({ value: v.id, label: v.name })))
    );
  }

}