import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../models/api/spring-api-response.model";
import { ValueDto } from "../models/value.model";
import { CategoryDto } from "../models/category.model";

@Injectable({
  providedIn: 'root'
})
export class ValueService {

  private apiUrl = `${environment.apiUrl}/values`;

  constructor(private http: HttpClient) {}  

  addValueToCategoryById(categoryId: string, value: string): Observable<SpringApiResponse<ValueDto>> {
    return this.http.post<SpringApiResponse<ValueDto>>(`${this.apiUrl}/add-to-category-by-id/${categoryId}`, value);
  }

    
  addValueToCategoryByName(categoryName: string, value: string, valueAlias: string = ''): Observable<SpringApiResponse<ValueDto>> {
      return this.http.post<SpringApiResponse<ValueDto>>(`${this.apiUrl}/add-to-category-by-name`,{category:categoryName, value:value, valueAlias:valueAlias});
    }

  getAllCategories(): Observable<SpringApiResponse<CategoryDto[]>> {
    return this.http.get<SpringApiResponse<CategoryDto[]>>(`${this.apiUrl}/categories`);
  }

  updateValue(valueId: number, newName: string, newAlias:string=""): Observable<SpringApiResponse<ValueDto>> {
    return this.http.put<SpringApiResponse<ValueDto>>(`${this.apiUrl}/${valueId}`, { name: newName, alias: newAlias });
  }

  deleteValueAndTransfer(valueIdToDelete: number, transferToValueId: number): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/delete-and-transfer`, {
      valueIdToDelete: valueIdToDelete,
      transferToValueId: transferToValueId
    });
  }

  /** Everything referencing this value, resolved to human labels and grouped by entity type. */
  getValueReferences(valueId: number): Observable<SpringApiResponse<ValueReferenceReport>> {
    return this.http.get<SpringApiResponse<ValueReferenceReport>>(`${this.apiUrl}/${valueId}/references`);
  }

  /**
   * Reference count for every value, keyed by value id. One call for the whole list — values with
   * no references are omitted, so treat a missing key as 0.
   */
  getValueReferenceCounts(): Observable<SpringApiResponse<Record<string, number>>> {
    return this.http.get<SpringApiResponse<Record<string, number>>>(`${this.apiUrl}/reference-counts`);
  }

  /** Move every reference onto another value. Returns how many rows moved. */
  repointValue(valueId: number, targetValueId: number): Observable<SpringApiResponse<number>> {
    return this.http.post<SpringApiResponse<number>>(`${this.apiUrl}/${valueId}/repoint/${targetValueId}`, {});
  }

  /** Soft-delete a value. Server rejects with 409 if anything still references it. */
  deleteValueIfUnreferenced(valueId: number): Observable<SpringApiResponse<string>> {
    return this.http.delete<SpringApiResponse<string>>(`${this.apiUrl}/${valueId}/safe`);
  }

}

export interface ValueReference {
  entityType: string;
  entityId: number;
  entityLabel: string;
  fieldName: string;
  collection: boolean;
}

export interface ValueReferenceGroup {
  entityType: string;
  fieldName: string;
  items: ValueReference[];
}

export interface ValueReferenceReport {
  valueId: number;
  totalCount: number;
  groups: ValueReferenceGroup[];
}