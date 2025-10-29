import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { IUser, User } from '../../models/auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserDbService {

  constructor(
    private indexedDbService: IndexedDbService
  ) { }

  addUser(userData: Partial<IUser>): Observable<number> {
    const { id, ...requestData } = userData;
    const newUser = new User(requestData);
    return from(this.indexedDbService.users.add(newUser));
  }

  getAllUsers(): Observable<User[]> {
    // liveQuery makes this Observable automatically emit new values when the underlying data changes.
    return from(liveQuery(() =>
      this.indexedDbService.users.orderBy('createdAt').reverse().toArray()
    ));
  }

  getUserById(id: number): Observable<User | undefined> {
    return from(liveQuery(() => this.indexedDbService.users.get(id)));
  }

  updateUser(user: Partial<IUser> & { id: number }): Observable<number> {
    const changes = {
      ...user,
      updatedAt: new Date()
    };
    return from(this.indexedDbService.users.update(user.id, changes));
  }

  updateUserBySharepointId(user: User): Observable<number> {
    const sharedPointId = user.sharepointId;
    if(!sharedPointId) throw new Error('No sharepointId provided');
    return from(
      this.indexedDbService.users
        .where('sharepointId')
        .equals(user.sharepointId!)
        .first()
        .then(existingUser => {
          const updatedUser = new User({
            ...user,
            id: existingUser?.id, // Use existing id if found, undefined if not
            updatedAt: new Date()
          });
          
          // put() will update if id exists, or add if id is undefined
          return this.indexedDbService.users.put(updatedUser);
        })
    );
  }
  
  updateUsersBySharepointId(users: User[]): Observable<void> {
    return from(
      this.indexedDbService.users.toArray().then(existingUsers => {
        const usersToUpdate = users.map(newUser => {
          // Find existing user by sharepointId
          const existing = existingUsers.find(u => u.sharepointId === newUser.sharepointId);
          return existing 
            ? new User({ ...newUser, id: existing.id, updatedAt: new Date() })
            : new User({ ...newUser, updatedAt: new Date() });
        });
        return this.indexedDbService.users.bulkPut(usersToUpdate);
      }).then(() => undefined)
    );
  }

  deleteUser(id: number): Observable<void> {
    return from(this.indexedDbService.users.delete(id));
  }

  getBySharepointId(ID: number): Observable<User | undefined> {
    return from(
      this.indexedDbService.users.where('sharepointId').equals(ID).first()
    );
  }
}