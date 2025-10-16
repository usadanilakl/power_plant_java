import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { IWorkRequest, WorkRequest } from '../../models/permits/work-request.model';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestDbService {

  constructor(private indexedDbService: IndexedDbService) { }

  async addWorkRequest(workRequestData: Partial<IWorkRequest>): Promise<number> {
    const newWorkRequest = new WorkRequest(workRequestData);
    return this.indexedDbService.workRequests.add(newWorkRequest);
  }

  async getAllWorkRequests(): Promise<WorkRequest[]> {
    // Sort by creation date in descending order
    return this.indexedDbService.workRequests.orderBy('createdAt').reverse().toArray();
  }

  async getWorkRequestById(id: number): Promise<WorkRequest | undefined> {
    return this.indexedDbService.workRequests.get(id);
  }

  async updateWorkRequest(id: number, changes: Partial<WorkRequest>): Promise<number> {
    return this.indexedDbService.workRequests.update(id, changes);
  }

  async deleteWorkRequest(id: number): Promise<void> {
    return this.indexedDbService.workRequests.delete(id);
  }
}