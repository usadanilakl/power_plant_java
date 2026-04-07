import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, interval, switchMap, distinctUntilChanged, filter, take, of, catchError } from 'rxjs';
import { ServerApiService } from './server-api.service';
import { UserSetupService } from './user-setup.service';
import { AuthService } from '../auth/auth.service';
import { EquipmentDataService } from './equipment-data.service';

@Injectable({
  providedIn: 'root'
})
export class ServerStatusService {
  private serverApi = inject(ServerApiService);
  private userSetupService = inject(UserSetupService);
  private authService = inject(AuthService);
  private equipmentData = inject(EquipmentDataService);
  private destroyRef = inject(DestroyRef);

  private isOnlineSubject = new BehaviorSubject<boolean>(false);
  isOnline$ = this.isOnlineSubject.asObservable();
  isOnline = toSignal(this.isOnline$, { initialValue: false });

  /** Password held in memory only for same-session retry */
  private pendingPassword: string | null = null;

  /** Notification badge count */
  unreadNotificationCount = signal(0);
  notifications = signal<any[]>([]);

  /** Message unread count */
  unreadMessageCount = signal(0);

  constructor() {
    // Initial check
    this.checkNow();

    // Poll every 30 seconds
    interval(30000).pipe(
      switchMap(() => this.serverApi.isAvailable()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(online => {
      this.isOnlineSubject.next(online);
      // Poll notifications when online and logged in
      if (online && this.authService.isLoggedIn()) {
        this.pollNotifications();
        this.pollUnreadMessages();
      }
    });

    // On offline → online transition, attempt pending registration
    this.isOnline$.pipe(
      distinctUntilChanged(),
      filter(online => online),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.retryPendingRegistration();
      this.equipmentData.retryFromServer();
    });
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

  markNotificationsRead(): void {
    this.serverApi.markNotificationsRead().subscribe({
      next: () => {
        this.unreadNotificationCount.set(0);
        this.notifications.set([]);
      }
    });
  }

  private pollNotifications(): void {
    this.serverApi.getNotifications().pipe(
      catchError(() => of(null))
    ).subscribe(result => {
      if (result) {
        this.unreadNotificationCount.set(result.unreadCount ?? 0);
        this.notifications.set(result.notifications ?? []);
      }
    });
  }

  private pollUnreadMessages(): void {
    this.serverApi.getUnreadMessageCount().pipe(
      catchError(() => of(0))
    ).subscribe(count => {
      this.unreadMessageCount.set(count ?? 0);
    });
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
