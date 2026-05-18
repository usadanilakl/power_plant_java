import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../models/user.model';
import { Option } from '../../../models/option.model';

@Injectable({ providedIn: 'root' })
export class RfUserOptionService {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  private allUsers = signal<UserDto[]>([]);
  private loaded = false;

  /** All active users as Option[] for dropdowns */
  userOptions = computed<Option[]>(() =>
    this.allUsers().map(u => u.toOption())
  );

  constructor() {
    // Refresh cache when a user is updated or deleted
    this.userService.userUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUsers());

    this.userService.userDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUsers());
  }

  /** Get options signal, loading on first access */
  getUserOptions(): Option[] {
    if (!this.loaded) {
      this.loadUsers();
    }
    return this.userOptions();
  }

  /** Look up a user by ID from cache */
  getUserById(id: number): UserDto | undefined {
    if (!this.loaded) {
      this.loadUsers();
    }
    return this.allUsers().find(u => u.id === id);
  }

  /**
   * Look up a user by any of: email, username, display name. Used by the
   * Lifecycle / Procedure Log tables to render signing initials next to
   * audit field values (which are stored as the principal name = email).
   */
  getUserByIdentity(identity: string | null | undefined): UserDto | undefined {
    if (!identity) return undefined;
    if (!this.loaded) this.loadUsers();
    const key = identity.trim().toLowerCase();
    return this.allUsers().find(u =>
      (u.email && u.email.toLowerCase() === key)
      || (u.username && u.username.toLowerCase() === key)
      || (u.name && u.name.toLowerCase() === key)
    );
  }

  /** Force reload from server */
  refreshUsers(): void {
    this.loaded = false;
    this.loadUsers();
  }

  /** Get options filtered by role */
  getFilteredOptions(roleFilter: string): Option[] {
    if (!this.loaded) {
      this.loadUsers();
    }
    return this.allUsers()
      .filter(u => u.roles?.includes(roleFilter))
      .map(u => u.toOption());
  }

  private loadUsers(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.userService.getAllOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const users = (response.responseData || []).map(u => UserDto.fromJson(u));
          this.allUsers.set(users);
        },
        error: (err) => {
          console.error('Failed to load user options:', err);
          this.loaded = false;
        }
      });
  }
}
