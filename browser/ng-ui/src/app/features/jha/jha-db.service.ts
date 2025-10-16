import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { IJha, Jha } from '../../models/permits/jha.model';


@Injectable({
  providedIn: 'root'
})
export class JhaDbService {

  constructor(private indexedDbService: IndexedDbService) { }

  async addJha(jhaData: Partial<IJha>): Promise<number> {
    const newJha = new Jha(jhaData);
    return this.indexedDbService.jhas.add(newJha);
  }

  async getAllJhas(): Promise<Jha[]> {
    return this.indexedDbService.jhas.orderBy('createdAt').reverse().toArray();
  }

  async getJhaById(id: number): Promise<Jha | undefined> {
    return this.indexedDbService.jhas.get(id);
  }

  async updateJha(id: number, changes: Partial<Jha>): Promise<number> {
    return this.indexedDbService.jhas.update(id, changes);
  }

  async deleteJha(id: number): Promise<void> {
    return this.indexedDbService.jhas.delete(id);
  }
}