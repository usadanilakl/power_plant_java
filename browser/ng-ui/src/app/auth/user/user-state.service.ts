import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { UserApiService } from './user-api.service';
import { UserLocalStorageService } from './user-local-storage.service';
import { UserDbService } from './user-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalMessageService } from '../../services/global-message.service';
import { User } from '../../models/auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {

  userApiService = inject(UserApiService);
  userLocalStorageService = inject(UserLocalStorageService);
  userDbService = inject(UserDbService);
  globalMessageService = inject(GlobalMessageService);
  destroyRef = inject(DestroyRef)

  constructor() {
    this.loadUsers();
    this.loadFromLocalStorage();
  }

  private allUsersSubject = new BehaviorSubject<User[]>([]);
  allUsers$ = this.allUsersSubject.asObservable();

  private selectedUserSubject = new BehaviorSubject<User>(new User());
  selectedUser$ = this.selectedUserSubject.asObservable();

  loadUsers() {
    // this.userDbService.getAllUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    //   next: (users) => this.allUsersSubject.next(users),
    //   error: (error) => this.globalMessageService.showMessage('Error loading users from DB', 'red', 20000)
    // });

    this.userApiService.getUsers().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        // Handle different response structures
        const users = Array.isArray(response) ? response : (response?.data || response?.value || []);
        
        // Map to User model instances
        const userInstances = users.map((userData: any) => new User(userData));
        
        this.addUsersToList(userInstances);
      },
      error: (error) => {
        console.error('Error loading users from API:', error);
        this.globalMessageService.showMessage('Error loading users from API', 'red', 20000);
      }
    });
  }

  addUsersToList(users: User[]): void {
    const currentUsers = this.allUsersSubject.getValue();
    const userMap = new Map(currentUsers.map(u => [u.id, u]));

    users.forEach(newUser => {
      userMap.set(newUser.id, newUser);
    });

    const updatedUsers = Array.from(userMap.values());
    this.allUsersSubject.next(updatedUsers);
  }

  selectUser(user: User) {
    this.selectedUserSubject.next(user);
  }

  getSelectedUser(): User {
    return this.selectedUserSubject.value;
  }

  saveDraft(user: User) {
    this.userLocalStorageService.saveDraft(user);
  }

  loadFromLocalStorage() {
    const draft = this.userLocalStorageService.loadDraft();
    if (draft) {
      this.selectUser(new User(draft));
    }
  }

  createNewUser(user: User) {
    this.globalMessageService.showMessage('Creating user...', 'white', 20000);
    this.userApiService.createUser(user).pipe(
      switchMap(response => {
        console.log('Creation successful!', response);
        const updatedUser = new User({ ...user, id: response.id, status: 'active' });
        return this.userDbService.addUser(updatedUser).pipe(
          tap(() => {
            this.selectUser(updatedUser);
            this.userLocalStorageService.clearDraft();
            this.addUsersToList([updatedUser]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.globalMessageService.showMessage('User created successfully.', 'green');
      },
      error: (err) => {
        console.error('Creation failed!', err);
        this.globalMessageService.showMessage('Failed to create user. Please try again.', 'red');
      }
    });
  }

  updateUser(user: User) {
    this.globalMessageService.showMessage('Updating user...', 'white', 20000);
    this.userApiService.updateUser(user).pipe(
      switchMap(response => {
        console.log('Update successful!', response);
        const updatedUser = new User({ ...user });
        return this.userDbService.updateUser(updatedUser).pipe(
          tap(() => {
            this.selectUser(updatedUser);
            this.addUsersToList([updatedUser]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.globalMessageService.showMessage('User updated successfully.', 'green');
      },
      error: (err) => {
        console.error('Update failed!', err);
        this.globalMessageService.showMessage('Failed to update user. Please try again.', 'red');
      }
    });
  }

  deleteSelectedUser() {
    const userToDelete = this.getSelectedUser();
    if (!userToDelete || !userToDelete.id) {
      this.globalMessageService.showMessage('No user selected for deletion.', 'red');
      return;
    }

    this.globalMessageService.showMessage('Deleting user...', 'white', 20000);
    // Assuming an API call to delete/deactivate the user
    // For now, we'll just update the status locally
    const updatedUser = new User({ ...userToDelete, status: 'deleted' });

    this.userDbService.updateUser(updatedUser).pipe(
      tap(() => {
        this.selectUser(new User()); // Clear selection
        // Update the list by replacing the user
        const currentUsers = this.allUsersSubject.getValue();
        const index = currentUsers.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.allUsersSubject.next([...currentUsers]);
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.globalMessageService.showMessage('User deleted successfully.', 'green');
      },
      error: (err) => {
        console.error('Deletion failed!', err);
        this.globalMessageService.showMessage('Failed to delete user.', 'red');
      }
    });
  }
}