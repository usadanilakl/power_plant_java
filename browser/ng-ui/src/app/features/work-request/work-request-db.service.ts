import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { IWorkRequest, WorkRequest } from '../../models/permits/work-request.model';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestDbService {

  constructor(private indexedDbService: IndexedDbService) { }

  addWorkRequest(workRequestData: Partial<IWorkRequest>): Observable<number> {
    const { id, ...requestData } = workRequestData;
    const newWorkRequest = new WorkRequest(requestData);
    return from(this.indexedDbService.workRequests.add(newWorkRequest));
  }

  getAllWorkRequests(): Observable<WorkRequest[]> {
    // liveQuery makes this Observable automatically emit new values when the underlying data changes.
    return from(liveQuery(() =>
      this.indexedDbService.workRequests.orderBy('createdAt').reverse().toArray()
    ));
  }

  getWorkRequestById(id: number): Observable<WorkRequest | undefined> {
    return from(liveQuery(() => this.indexedDbService.workRequests.get(id)));
  }

  updateWorkRequest(workRequest: Partial<IWorkRequest> & { id: number }): Observable<number> {
    const changes = {
      ...workRequest,
      updatedAt: new Date()
    };
    return from(this.indexedDbService.workRequests.update(workRequest.id, changes));
  }

  deleteWorkRequest(id: number): Observable<void> {
    return from(this.indexedDbService.workRequests.delete(id));
  }
}