import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { ISpace, Space } from '../../models/permits/space.model';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class SpaceDbService {

  constructor(private indexedDbService: IndexedDbService) { }

  addSpace(spaceData: Partial<ISpace>): Observable<number> {
    const { id, ...requestData } = spaceData;
    const newSpace = new Space(requestData);
    return from(this.indexedDbService.spaces.add(newSpace));
  }

  getAllSpaces(): Observable<Space[]> {
    // liveQuery makes this Observable automatically emit new values when the underlying data changes.
    return from(liveQuery(() =>
      this.indexedDbService.spaces.orderBy('createdAt').reverse().toArray()
    ));
  }

  getSpaceById(id: number): Observable<Space | undefined> {
    return from(liveQuery(() => this.indexedDbService.spaces.get(id)));
  }

  updateSpace(space: Partial<ISpace> & { id: number }): Observable<number> {
    const changes = {
      ...space,
      updatedAt: new Date()
    };
    return from(this.indexedDbService.spaces.update(space.id, changes));
  }

  deleteSpace(id: number): Observable<void> {
    return from(this.indexedDbService.spaces.delete(id));
  }
}