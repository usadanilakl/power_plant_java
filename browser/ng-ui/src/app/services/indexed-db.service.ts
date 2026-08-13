import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { IWorkRequest, WorkRequest } from '../models/permits/work-request.model';
import { IJha, Jha } from '../models/permits/jha.model';
import { Space } from '../models/permits/space.model';
import { User } from '../models/auth/user.model';
import { Instrument } from '../models/equipment/instrument.model';
import { InstrumentLogEntry, InstrumentLogOutboxItem } from '../models/equipment/instrument-log.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService extends Dexie {
  workRequests!: Table<WorkRequest, number>;
  jhas!: Table<Jha, number>;
  spaces!: Table<Space, number>;
  users!: Table<User, number>;
  instruments!: Table<Instrument, number>;
  instrumentLogs!: Table<InstrumentLogEntry, number>;
  instrumentLogOutbox!: Table<InstrumentLogOutboxItem, number>;

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

    // Version 3: Added spaces table
    this.version(3).stores({
      spaces: '++id, status, createdAt, updatedAt'
    });

    // Version 4: Added users table
    this.version(4).stores({
      users: '++id, status, createdAt, updatedAt'
    });

    // Version 5: Added sharepointId index to users table
    this.version(5).stores({
      users: '++id, sharepointId, email, status, createdAt, updatedAt'
    });

    // Version 6: Added sharepointId index to spaces table
    this.version(6).stores({
      spaces: '++id, sharepointId, status, createdAt, updatedAt'
    });

    // Version 7: Added localUuid indexes for dedup, submissionStatus for WR/JHA
    this.version(7).stores({
      workRequests: '++id, localUuid, sharepointId, status, submissionStatus, jhaStatus, createdAt, updatedAt',
      jhas: '++id, localUuid, sharepointId, status, submissionStatus, createdAt, updatedAt'
    }).upgrade(tx => {
      return tx.table('jhas').toCollection().modify(jha => {
        if (!jha.localUuid) jha.localUuid = crypto.randomUUID();
        if (!jha.submissionStatus) jha.submissionStatus = 'draft';
        if (!jha.attachments) jha.attachments = [];
      });
    });

    // Version 8: Instrumentation cache tables
    this.version(8).stores({
      instruments: '++id, tagNumber, sharepointId, localUuid, currentStatus, updatedAt',
      instrumentLogs: '++id, instrumentTagNumber, localUuid, status, date, time, createdAt, updatedAt'
    });

    // Version 9: Instrument log outbox — logs captured offline (or when every submission route
    // failed) live here until a flush succeeds. Survives reload/app-close, unlike the old
    // single-draft-in-localStorage + "please email it yourself" fallback.
    this.version(9).stores({
      instrumentLogOutbox: '++id, localUuid, instrumentTagNumber, createdAt'
    });

    // 3. Map tables to classes
    this.workRequests.mapToClass(WorkRequest);
    this.jhas.mapToClass(Jha);
    this.spaces.mapToClass(Space);
    this.users.mapToClass(User);
    this.instruments.mapToClass(Instrument);
    this.instrumentLogs.mapToClass(InstrumentLogEntry);
  }
}
