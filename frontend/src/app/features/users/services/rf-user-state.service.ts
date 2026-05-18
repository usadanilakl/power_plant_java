import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../models/user.model';
import { RfUserOptionService } from './rf-user-option.service';

@Injectable({ providedIn: 'root' })
export class RfUserStateService {

  private userService = inject(UserService);
  private userOptionService = inject(RfUserOptionService);
  private destroyRef = inject(DestroyRef);

  private allUsersSubject = new BehaviorSubject<UserDto[]>([]);
  allUsers$ = this.allUsersSubject.asObservable();

  selectedItem = signal<UserDto | null>(null);
  isFormOpen = signal(false);
  isLoading = signal(false);

  constructor() {
    this.userService.userUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(updated => {
      const current = this.allUsersSubject.value;
      const index = current.findIndex(u => u.id === updated.id);
      if (index >= 0) {
        current[index] = updated;
        this.allUsersSubject.next([...current]);
      } else {
        this.allUsersSubject.next([updated, ...current]);
      }
    });

    this.userService.userDeleted$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(id => {
      const current = this.allUsersSubject.value;
      this.allUsersSubject.next(current.filter(u => u.id !== id));
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.userService.getUsers(1, 200).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const users = (res.responseData?.content ?? []).map((u: any) => UserDto.fromJson(u));
        this.allUsersSubject.next(users);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('[Users] Failed to load:', err.message);
        this.allUsersSubject.next([]);
        this.isLoading.set(false);
      }
    });
  }

  openForm(user: UserDto): void {
    this.selectedItem.set(user);
    this.isFormOpen.set(true);
  }

  openNewForm(): void {
    this.selectedItem.set(new UserDto());
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedItem.set(null);
  }

  submitForm(formData: any): void {
    const selectedUser = this.selectedItem();
    const isNew = !selectedUser?.id || selectedUser.id === 0;

    // signing_initials lives on a dedicated admin endpoint (/api/auth/admin/users/:id/initials).
    // Pull it out of the main payload — it will be persisted as a follow-up call.
    const desiredInitials = (formData.signingInitials ?? '').toString().trim().toUpperCase();
    const initialsChanged = (selectedUser?.signingInitials ?? '') !== desiredInitials;
    const mainPayload = { ...formData };
    delete mainPayload.signingInitials;

    if (isNew) {
      this.userService.createUser(mainPayload).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: res => {
          if (res.responseData) {
            const created = UserDto.fromJson(res.responseData);
            this.userService.userUpdated$.next(created);
            this.userOptionService.refreshUsers();
            if (desiredInitials) {
              this.persistInitials(created.id, desiredInitials);
            } else {
              this.closeForm();
            }
          }
        },
        error: err => console.error('[Users] Create failed:', err)
      });
    } else {
      this.userService.updateUser(String(selectedUser.id), mainPayload).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: res => {
          if (res.responseData) {
            const updated = UserDto.fromJson(res.responseData);
            this.userService.userUpdated$.next(updated);
            this.userOptionService.refreshUsers();
            if (initialsChanged && desiredInitials) {
              this.persistInitials(updated.id, desiredInitials);
            } else {
              this.closeForm();
            }
          }
        },
        error: err => console.error('[Users] Update failed:', err)
      });
    }
  }

  /** Save initials via the dedicated admin endpoint after the main user save. */
  private persistInitials(userId: number, initials: string): void {
    this.userService.setSigningInitials(userId, initials).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        // Re-fetch the row so the table column reflects the new initials.
        const current = this.allUsersSubject.value;
        const u = current.find(x => x.id === userId);
        if (u) {
          u.signingInitials = initials;
          this.allUsersSubject.next([...current]);
        }
        this.closeForm();
      },
      error: err => {
        alert('User saved but initials failed: ' + (err?.error?.message ?? err?.message ?? 'unknown'));
        this.closeForm();
      }
    });
  }

  /**
   * Admin: generate a fresh PIN for a user. Returns a promise resolving to the
   * one-time cleartext PIN. Caller is responsible for displaying it once.
   */
  generatePinForUser(userId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.userService.resetUserPin(userId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: res => {
          // Refresh user in local cache so pin-status badge updates
          const current = this.allUsersSubject.value;
          const u = current.find(x => x.id === userId);
          if (u) {
            u.pinSetAt = new Date().toISOString();
            u.pinLockedUntil = null;
            this.allUsersSubject.next([...current]);
          }
          resolve(res.pin);
        },
        error: err => reject(err?.error?.message ?? err?.message ?? 'Failed to generate PIN')
      });
    });
  }

  deleteUser(id: number): void {
    this.userService.deleteUser(String(id)).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.userService.userDeleted$.next(id);
        this.userOptionService.refreshUsers();
        this.closeForm();
      },
      error: err => console.error('[Users] Delete failed:', err)
    });
  }

  seedPlantUsers(): void {
    this.userService.seedPlantUsers().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadAll();
        this.userOptionService.refreshUsers();
      },
      error: err => console.error('[Users] Seed failed:', err)
    });
  }
}
