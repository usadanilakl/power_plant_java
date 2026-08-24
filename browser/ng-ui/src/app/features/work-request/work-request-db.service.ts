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
    return from(this.addWithQuotaRecovery(newWorkRequest));
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
    return from(this.updateWithQuotaRecovery(workRequest.id, changes));
  }

  /**
   * Upcoming requests that still need a JHA.
   *
   * This used to query `where('jhaStatus').equals('none')`, and nothing has ever written 'none' -
   * the v2 schema upgrade backfilled 'required' and new records leave the field undefined, which a
   * Dexie index skips entirely. The query therefore always returned an empty array, silently
   * emptying the JHA transfer list. Same predicate as getWorkRequestsNeedingJha now, expressed the
   * way that actually matches.
   */
  getWorkRequestWithoutJha(): Observable<WorkRequest[]> {
    return this.getWorkRequestsNeedingJha();
  }

  getWorkRequestsNeedingJha(): Observable<WorkRequest[]> {
    return from(
      liveQuery(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.indexedDbService.workRequests
          .filter(wr => {
            const isFuture = new Date(wr.dateOfWork) >= today;
            const needsJha = !wr.jhaStatus || wr.jhaStatus !== 'Completed';
            const notRevoked = wr.status !== 'revoked';
            return isFuture && needsJha && notRevoked;
          })
          .toArray();
      })
    );
  }

  deleteWorkRequest(id: number): Observable<void> {
    return from(this.indexedDbService.workRequests.delete(id));
  }

  private isQuotaError(error: any): boolean {
    if (error?.name === 'QuotaExceededError') return true;
    if (error?.inner?.name === 'QuotaExceededError') return true;
    if (error?.message?.includes?.('quota')) return true;
    return false;
  }

  private async stripOldestAttachments(): Promise<number> {
    const allWrs = await this.indexedDbService.workRequests
      .orderBy('createdAt')
      .toArray();

    const withAttachments = allWrs.filter(wr => wr.attachments?.length > 0);
    let freedCount = 0;

    for (const wr of withAttachments) {
      await this.indexedDbService.workRequests.update(wr.id, {
        attachments: [],
        updatedAt: new Date()
      });
      freedCount++;
    }

    return freedCount;
  }

  private async addWithQuotaRecovery(workRequest: WorkRequest): Promise<number> {
    try {
      return await this.indexedDbService.workRequests.add(workRequest);
    } catch (error) {
      if (!this.isQuotaError(error)) throw error;

      console.warn('[WorkRequestDB] Storage quota exceeded, cleaning up old attachments...');
      const freed = await this.stripOldestAttachments();

      if (freed > 0) {
        try {
          return await this.indexedDbService.workRequests.add(workRequest);
        } catch (retryError) {
          if (!this.isQuotaError(retryError)) throw retryError;
        }
      }

      console.warn('[WorkRequestDB] Still not enough space, saving without attachments');
      const stripped = new WorkRequest({ ...workRequest, attachments: [] });
      return await this.indexedDbService.workRequests.add(stripped);
    }
  }

  private async updateWithQuotaRecovery(id: number, changes: any): Promise<number> {
    try {
      return await this.indexedDbService.workRequests.update(id, changes);
    } catch (error) {
      if (!this.isQuotaError(error)) throw error;

      console.warn('[WorkRequestDB] Storage quota exceeded on update, cleaning up old attachments...');
      const freed = await this.stripOldestAttachments();

      if (freed > 0) {
        try {
          return await this.indexedDbService.workRequests.update(id, changes);
        } catch (retryError) {
          if (!this.isQuotaError(retryError)) throw retryError;
        }
      }

      console.warn('[WorkRequestDB] Still not enough space, updating without attachments');
      return await this.indexedDbService.workRequests.update(id, { ...changes, attachments: [] });
    }
  }
}
