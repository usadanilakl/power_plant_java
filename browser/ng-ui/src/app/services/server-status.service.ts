import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, interval, switchMap, distinctUntilChanged, filter, take } from 'rxjs';
import { ServerApiService } from './server-api.service';
import { UserSetupService } from './user-setup.service';

@Injectable({
  providedIn: 'root'
})
export class ServerStatusService {
  private serverApi = inject(ServerApiService);
  private userSetupService = inject(UserSetupService);
  private destroyRef = inject(DestroyRef);

  private isOnlineSubject = new BehaviorSubject<boolean>(false);
  isOnline$ = this.isOnlineSubject.asObservable();
  isOnline = toSignal(this.isOnline$, { initialValue: false });

  /** Password held in memory only for same-session retry */
  private pendingPassword: string | null = null;

  constructor() {
    // Initial check
    this.checkNow();

    // Poll every 30 seconds
    interval(30000).pipe(
      switchMap(() => this.serverApi.isAvailable()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(online => this.isOnlineSubject.next(online));

    // On offline → online transition, attempt pending registration
    this.isOnline$.pipe(
      distinctUntilChanged(),
      filter(online => online),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.retryPendingRegistration());
  }

  checkNow(): void {
    this.serverApi.isAvailable().pipe(take(1)).subscribe(online => {
      this.isOnlineSubject.next(online);
    });
  }

  /** Store password in memory for retry if registration fails due to server being offline */
  setPendingPassword(password: string): void {
    this.pendingPassword = password;
  }

  clearPendingPassword(): void {
    this.pendingPassword = null;
  }

  private retryPendingRegistration(): void {
    const userData = this.userSetupService.getUserData();
    if (!userData || userData.registeredOnServer || !this.pendingPassword) return;

    console.log('[ServerStatus] Server came online, retrying registration...');
    this.serverApi.registerUser({
      pwaUserUuid: userData.uuid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      company: userData.company,
      password: this.pendingPassword
    }).subscribe({
      next: (result) => {
        if (result.success) {
          this.userSetupService.markRegistered();
          this.pendingPassword = null;
          console.log('[ServerStatus] Auto-registration successful');
        }
      },
      error: (err) => console.error('[ServerStatus] Auto-registration failed:', err)
    });
  }
}
