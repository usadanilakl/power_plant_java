import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TestResult {
  success: boolean;
  message: string;
  count: number;
  durationMs: number;
  changesPerSecond: number;
  testDataCount: number;
  pendingChanges: number;
}

export interface TestMetrics {
  testDataCount: number;
  pendingChanges: number;
  totalChanges: number;
  totalGenerated: number;
  totalCleared: number;
  totalSyncTests: number;
  serverSyncEnabled: boolean;
  machineId: string;
  machineName: string;
}

export interface TestRun {
  operation: string;
  testType: string;
  count: number;
  durationMs: number;
  success: boolean;
  timestamp: string;
}

export interface TestType {
  id: string;
  name: string;
  description: string;
  endpoint?: string;
}

export interface TestTypes {
  syntheticTests: TestType[];
  existingEntityTests: TestType[];
}

@Injectable({
  providedIn: 'root'
})
export class SyncTestService {
  private apiUrl = `${environment.baseApiUrl}/api/sync-test`;

  constructor(private http: HttpClient) {}

  // ==================== TEST DATA GENERATION ====================

  generateTestData(count: number, testType: string): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/generate?count=${count}&testType=${testType}`,
      {}
    );
  }

  generateMixedChanges(creates: number, updates: number, deletes: number): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/generate/mixed?creates=${creates}&updates=${updates}&deletes=${deletes}`,
      {}
    );
  }

  // ==================== SYNC OPERATIONS ====================

  triggerSync(): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.apiUrl}/sync`, {});
  }

  runFullCycle(count: number, testType: string): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/full-cycle?count=${count}&testType=${testType}`,
      {}
    );
  }

  // ==================== EXISTING ENTITY TESTS ====================

  testEquipment(revert: boolean = true): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/test/equipment?revert=${revert}`,
      {}
    );
  }

  testLotoPoints(revert: boolean = true): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/test/loto-points?revert=${revert}`,
      {}
    );
  }

  testFileObjects(revert: boolean = true): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/test/file-objects?revert=${revert}`,
      {}
    );
  }

  testAllEntities(revert: boolean = true): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/test/all-entities?revert=${revert}`,
      {}
    );
  }

  testEntity(type: string, field: string, revert: boolean = true): Observable<TestResult> {
    return this.http.post<TestResult>(
      `${this.apiUrl}/test/entity?type=${type}&field=${field}&revert=${revert}`,
      {}
    );
  }

  // ==================== CLEANUP ====================

  clearAllTestData(): Observable<TestResult> {
    return this.http.delete<TestResult>(`${this.apiUrl}/clear`);
  }

  clearTestDataByType(testType: string): Observable<TestResult> {
    return this.http.delete<TestResult>(`${this.apiUrl}/clear/${testType}`);
  }

  // ==================== METRICS & STATUS ====================

  getMetrics(): Observable<TestMetrics> {
    return this.http.get<TestMetrics>(`${this.apiUrl}/metrics`);
  }

  getHistory(): Observable<TestRun[]> {
    return this.http.get<TestRun[]>(`${this.apiUrl}/history`);
  }

  getStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/status`);
  }

  getEntityCounts(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/entity-counts`);
  }

  getTestTypes(): Observable<TestTypes> {
    return this.http.get<TestTypes>(`${this.apiUrl}/test-types`);
  }
}
