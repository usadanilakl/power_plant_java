import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { IJha, Jha } from '../../models/permits/jha.model';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';


@Injectable({
  providedIn: 'root'
})
export class JhaDbService {

  constructor(private indexedDbService: IndexedDbService) { }

  addJha(jhaData: Partial<IJha>): Observable<number> {
    const { id, ...requestData } = jhaData;
    const newJha = new Jha(requestData);
    return from(this.indexedDbService.jhas.add(newJha));
  }

  getAllJhas(): Observable<Jha[]> {
    // liveQuery makes this Observable automatically emit new values when the underlying data changes.
    return from(liveQuery(() =>
      this.indexedDbService.jhas.orderBy('createdAt').reverse().toArray()
    ));
  }

  getJhaById(id: number): Observable<Jha | undefined> {
    return from(liveQuery(() => this.indexedDbService.jhas.get(id)));
  }

  updateJha(jha: Partial<IJha> & { id: number }): Observable<number> {
    const changes = {
      ...jha,
      updatedAt: new Date()
    };
    return from(this.indexedDbService.jhas.update(jha.id, changes));
  }

  deleteJha(id: number): Observable<void> {
    return from(this.indexedDbService.jhas.delete(id));
  }
}