import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../models/user.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';
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

  // ── Paginated table state (mirrors RfLotoPointStateService) ──
  private pageSize = 50;
  private currentPage = 1;

  private loadedUsersSubject = new BehaviorSubject<UserDto[]>([]);
  /** Items shown in {@code <app-table>} — accumulates as the user scrolls/searches. */
  loadedUsers$ = this.loadedUsersSubject.asObservable();

  private currentSearchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  currentSearchCriteria$ = this.currentSearchCriteriaSubject.asObservable();

  /** Column-filter dropdown values for the currently-focused column. */
  currentColumnUniqueItems = signal<string[]>([]);
  loadingUniqueItems = signal<boolean>(false);
  private uniqueValuesCache = new Map<string, { values: string[]; page: number; hasMore: boolean }>();

  constructor() {
    this.userService.userUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(updated => {
      this.upsertInSubject(this.allUsersSubject, updated);
      this.upsertInSubject(this.loadedUsersSubject, updated);
    });

    this.userService.userDeleted$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(id => {
      this.allUsersSubject.next(this.allUsersSubject.value.filter(u => u.id !== id));
      this.loadedUsersSubject.next(this.loadedUsersSubject.value.filter(u => u.id !== id));
    });
  }

  private upsertInSubject(subj: BehaviorSubject<UserDto[]>, item: UserDto): void {
    const current = subj.value;
    const i = current.findIndex(u => u.id === item.id);
    if (i >= 0) {
      const next = [...current];
      next[i] = item;
      subj.next(next);
    } else {
      subj.next([item, ...current]);
    }
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
        this.loadedUsersSubject.next([]);
        this.currentPage = 1;
        this.loadInitialPaginated();
        this.userOptionService.refreshUsers();
      },
      error: err => console.error('[Users] Seed failed:', err)
    });
  }

  // ─── Paginated table API (matches RfLotoPointStateService contract) ─────────

  /** Initial fetch — page 1, no filters. */
  loadInitialPaginated(): void {
    this.isLoading.set(true);
    this.userService.getUsers(1, this.pageSize).pipe(
      tap(res => {
        const users = ((res.responseData?.content as any[]) ?? []).map(u => UserDto.fromJson(u));
        this.loadedUsersSubject.next(users);
        this.currentPage = 2;
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('[Users] paginated load failed:', err);
        this.isLoading.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  addLoadedUsers(items: UserDto[]): void {
    const current = this.loadedUsersSubject.value;
    this.loadedUsersSubject.next([...current, ...items]);
  }

  clearLoaded(): void {
    this.loadedUsersSubject.next([]);
    this.currentPage = 1;
  }

  getCurrentPage(): number { return this.currentPage; }
  incrementPage(): void { this.currentPage++; }
  resetPage(): void { this.currentPage = 1; }
  getPageSize(): number { return this.pageSize; }

  setSearchCriteria(criteria: SearchCriteria | null): void {
    this.currentSearchCriteriaSubject.next(criteria);
  }

  getCurrentSearchCriteria(): SearchCriteria | null {
    return this.currentSearchCriteriaSubject.value;
  }

  /**
   * Load distinct values for one column, refining as the user types. The current
   * column filters are sent as the base so the dropdown respects other active filters.
   */
  loadUniqueItems(columnKey: string, searchString: string): void {
    const cacheKey = `${columnKey}:${searchString}`;
    this.loadingUniqueItems.set(true);

    const criteria = this.buildFiltersForUniqueValues(columnKey, searchString);

    this.userService
      .getFilteredUniqueValuesOfColumn(columnKey, criteria, 1, this.pageSize)
      .pipe(
        tap(res => {
          const values = res.responseData?.content ?? [];
          this.currentColumnUniqueItems.set(values);
          this.uniqueValuesCache.set(cacheKey, {
            values,
            page: 1,
            hasMore: !res.responseData?.last,
          });
          this.loadingUniqueItems.set(false);
        }),
        catchError(err => {
          console.error(`[Users] unique items load for ${columnKey} failed:`, err);
          this.loadingUniqueItems.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe();
  }

  loadMoreUniqueItems(columnKey: string, searchString: string): void {
    const cacheKey = `${columnKey}:${searchString}`;
    const cached = this.uniqueValuesCache.get(cacheKey);
    if (!cached || !cached.hasMore) return;

    this.loadingUniqueItems.set(true);
    const nextPage = cached.page + 1;
    const criteria = this.buildFiltersForUniqueValues(columnKey, searchString);

    this.userService
      .getFilteredUniqueValuesOfColumn(columnKey, criteria, nextPage, this.pageSize)
      .pipe(
        tap(res => {
          const newValues = res.responseData?.content ?? [];
          if (newValues.length === 0) {
            this.uniqueValuesCache.set(cacheKey, { ...cached, hasMore: false });
            this.loadingUniqueItems.set(false);
            return;
          }
          const merged = [...cached.values, ...newValues];
          this.currentColumnUniqueItems.set(merged);
          this.uniqueValuesCache.set(cacheKey, {
            values: merged,
            page: nextPage,
            hasMore: !res.responseData?.last,
          });
          this.loadingUniqueItems.set(false);
        }),
        catchError(err => {
          console.error(`[Users] load-more unique items for ${columnKey} failed:`, err);
          this.loadingUniqueItems.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe();
  }

  clearUniqueValuesCache(): void {
    this.uniqueValuesCache.clear();
    this.currentColumnUniqueItems.set([]);
  }

  private buildFiltersForUniqueValues(columnKey: string, searchString: string): SearchCriteria {
    const current = this.getCurrentSearchCriteria();
    const baseFilters = current?.filters ? { ...current.filters } : {};
    if (searchString && searchString.trim() !== '') {
      baseFilters[columnKey] = searchString;
    }
    return {
      ...(current ?? ({} as SearchCriteria)),
      type: current?.type ?? ('column' as any),
      filters: baseFilters,
    };
  }
}
