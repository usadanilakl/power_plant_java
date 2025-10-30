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

    updateSpaceBySharepointId(space: Space): Observable<number> {
      const sharepointId = space.sharepointId;
      if(!sharepointId) throw new Error('No sharepointId provided');
      return from(
        this.indexedDbService.spaces
          .where('sharepointId')
          .equals(space.sharepointId!)
          .first()
          .then(existingSpace => {
            const updatedSpace = new Space({
              ...space,
              id: existingSpace?.id, // Use existing id if found, undefined if not
              updatedAt: new Date()
            });
            
            // put() will update if id exists, or add if id is undefined
            return this.indexedDbService.spaces.put(updatedSpace);
          })
      );
    }
    
    updateSpacesBySharepointId(spaces: Space[]): Observable<void> {
      return from(
        this.indexedDbService.spaces.toArray().then(existingSpaces => {
          const spacesToUpdate = spaces.map(newSpace => {
            // Find existing space by sharepointId
            const existing = existingSpaces.find(s => s.sharepointId === newSpace.sharepointId);
            return existing 
              ? new Space({ ...newSpace, id: existing.id, updatedAt: new Date() })
              : new Space({ ...newSpace, updatedAt: new Date() });
          });
          return this.indexedDbService.spaces.bulkPut(spacesToUpdate);
        }).then(() => undefined)
      );
    }
    
    getBySharepointId(ID: number): Observable<Space | undefined> {
      return from(
        this.indexedDbService.spaces.where('sharepointId').equals(ID).first()
      );
    }

  deleteSpace(id: number): Observable<void> {
    return from(this.indexedDbService.spaces.delete(id));
  }
}