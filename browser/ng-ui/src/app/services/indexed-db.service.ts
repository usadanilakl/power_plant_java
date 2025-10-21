import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { IWorkRequest, WorkRequest } from '../models/permits/work-request.model';
import { IJha, Jha } from '../models/permits/jha.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService extends Dexie {
  workRequests!: Table<WorkRequest, number>;
  jhas!: Table<Jha, number>;

  constructor() {
    // 1. Database Name
    super('PermitsDB');

    // 2. Define Schema
    this.version(1).stores({
      // '++id' for auto-incrementing primary key.
      // The other fields are indexed for faster queries.
      workRequests: '++id, status, createdAt, updatedAt',
      jhas: '++id, status, createdAt, updatedAt'
    });

    // Version 2: Added jhaStatus to workRequests and provided an upgrade function
    this.version(2).stores({
      workRequests: '++id, status, jhaStatus, createdAt, updatedAt'
    }).upgrade(tx => {
      // This upgrade function will be executed when a client's database is upgraded from version 1 to 2.
      // We will iterate over all existing work requests and add the new 'jhaStatus' property.
      return tx.table('workRequests').toCollection().modify(workRequest => {
        // Set a default value for the new field on existing records.
        workRequest.jhaStatus = 'required';
      });
    });

    // 3. Map tables to classes
    this.workRequests.mapToClass(WorkRequest);
    this.jhas.mapToClass(Jha);
  }
}