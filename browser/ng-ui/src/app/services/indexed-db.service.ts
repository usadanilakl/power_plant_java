import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { IWorkRequest, WorkRequest } from '../models/permits/work-request.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService extends Dexie {
  // Define a table for work requests. The '!' asserts that it will be initialized in the constructor.
  workRequests!: Table<WorkRequest, number>;

  constructor() {
    // 1. Database Name
    super('PowerPlantDB');

    // 2. Define Schema
    this.version(1).stores({
      // '++id' for auto-incrementing primary key.
      // The other fields are indexed for faster queries.
      workRequests: '++id, status, createdAt, updatedAt'
    });
  }

  // --- Work Request Methods ---

  async addWorkRequest(workRequestData: Partial<IWorkRequest>): Promise<number> {
    const newWorkRequest = new WorkRequest(workRequestData);
    return this.workRequests.add(newWorkRequest);
  }

  async getAllWorkRequests(): Promise<WorkRequest[]> {
    // Sort by creation date in descending order
    return this.workRequests.orderBy('createdAt').reverse().toArray();
  }

  async getWorkRequestById(id: number): Promise<WorkRequest | undefined> {
    return this.workRequests.get(id);
  }

  async updateWorkRequest(id: number, changes: Partial<WorkRequest>): Promise<number> {
    return this.workRequests.update(id, changes);
  }

  async deleteWorkRequest(id: number): Promise<void> {
    return this.workRequests.delete(id);
  }
}