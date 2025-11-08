import { Injectable } from '@angular/core';
import { 
  createRxDatabase, 
  addRxPlugin, 
  RxDatabase, 
  RxCollection 
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

// Import Schemas and Document Types

import { LotoPointActionDocType, lotoPointActionSchema } from '../../models/permits/loto/loto-point-action.schema';
import { LotoDocType, lotoSchema } from '../../models/permits/loto/loto.schema';
import { UserDocType, userSchema } from '../../models/auth/user.schema';
import { environment } from '../../../environment';
import { LotoPointDocType, lotoPointSchema } from '../../models/permits/loto/loto-point.schema';


// Define Collection types for strong typing
export type UserCollection = RxCollection<UserDocType>;
export type LotoCollection = RxCollection<LotoDocType>;
export type LotoPointCollection = RxCollection<LotoPointDocType>;
export type LotoPointActionCollection = RxCollection<LotoPointActionDocType>;



// Define the Database Collections type
export type MyDatabaseCollections = {
  users: UserCollection;
  lotos: LotoCollection;
  lotopoints: LotoPointCollection;
  lotopointactions: LotoPointActionCollection;
};

// Define the Database type
export type MyDatabase = RxDatabase<MyDatabaseCollections>;

// --- Database Creation ---
let dbPromise: Promise<MyDatabase> | null = null;

const createDb = async (): Promise<MyDatabase> => {
  if (environment.isDev) {
    // We only add the dev-mode plugin in development
    await addRxPlugin(RxDBDevModePlugin);
  }

  const db = await createRxDatabase<MyDatabaseCollections>({
    name: 'permitsdb', // The name of the database
    storage: getRxStorageDexie(),
    multiInstance: true, // Recommended for browser environments
    ignoreDuplicate: true // Ignores re-creation if another tab already created it
  });

  await db.addCollections({
    users: {
      schema: userSchema
    },
    lotos: {
      schema: lotoSchema
    },
    lotopoints: {
      schema: lotoPointSchema
    },
    lotopointactions: {
      schema: lotoPointActionSchema
    }
  });

  return db;
};

// --- Service ---
@Injectable({
  providedIn: 'root'
})
export class RxdbService {
  constructor() {}

  /**
   * This is the main point of contact to the database.
   * It will create the database if it doesn't exist.
   */
  getDb(): Promise<MyDatabase> {
    if (!dbPromise) {
      dbPromise = createDb();
    }
    return dbPromise;
  }
}