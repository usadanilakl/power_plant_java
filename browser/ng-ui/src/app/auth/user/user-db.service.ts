import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../services/indexed-db.service';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { IUser, User } from '../../models/auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserDbService {

  constructor(private indexedDbService: IndexedDbService) { }

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

  deleteUser(id: number): Observable<void> {
    return from(this.indexedDbService.users.delete(id));
  }
}