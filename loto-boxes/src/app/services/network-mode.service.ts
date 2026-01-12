import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription, firstValueFrom, timeout, catchError, of } from 'rxjs';
import { StorageService } from './storage.service';

export enum NetworkMode {
  OFFLINE = 'offline',       // No network, read-only from localStorage
  ESP_ONLY = 'esp-only',     // ESP controllers reachable, no server
  SERVER = 'server'          // Server available (future)
}

export interface ControllerStatus {
  id: number;
  ip: string;
  online: boolean;
  lastChecked: Date;
}

const ESP_CONTROLLER_IPS = [
  { id: 1, ip: '192.168.190.145' },
  { id: 2, ip: '192.168.190.146' }
];

const SERVER_URL = '/api/health'; // Future server endpoint
const PING_INTERVAL_MS = 30000; // Check every 30 seconds
const PING_TIMEOUT_MS = 5000;

@Injectable({
  providedIn: 'root'
})
export class NetworkModeService implements OnDestroy {

  // Current network mode
  private _networkMode = signal<NetworkMode>(NetworkMode.OFFLINE);
  readonly networkMode = this._networkMode.asReadonly();

  // Controller statuses
  private _controllerStatuses = signal<Map<number, ControllerStatus>>(new Map());
  readonly controllerStatuses = this._controllerStatuses.asReadonly();

  // Server availability
  private _serverAvailable = signal<boolean>(false);
  readonly serverAvailable = this._serverAvailable.asReadonly();

  // Last check timestamp
  private _lastCheck = signal<Date | null>(null);
  readonly lastCheck = this._lastCheck.asReadonly();

  // Computed: Is any ESP controller online?
  readonly hasEspConnection = computed(() => {
    const statuses = this._controllerStatuses();
    return Array.from(statuses.values()).some(s => s.online);
  });

  // Computed: Are all ESP controllers online?
  readonly allEspOnline = computed(() => {
    const statuses = this._controllerStatuses();
    if (statuses.size === 0) return false;
    return Array.from(statuses.values()).every(s => s.online);
  });

  // Computed: Is read-only mode active?
  readonly isReadOnly = computed(() => {
    return this._networkMode() === NetworkMode.OFFLINE;
  });

  // Computed: Can control boxes?
  readonly canControl = computed(() => {
    const mode = this._networkMode();
    return mode === NetworkMode.ESP_ONLY || mode === NetworkMode.SERVER;
  });

  private pingSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    this.initializeControllerStatuses();
    this.startPeriodicCheck();
    // Initial check
    this.checkAllConnections();
  }

  ngOnDestroy(): void {
    this.stopPeriodicCheck();
  }

  /**
   * Initialize controller status map
   */
  private initializeControllerStatuses(): void {
    const statuses = new Map<number, ControllerStatus>();
    ESP_CONTROLLER_IPS.forEach(controller => {
      statuses.set(controller.id, {
        id: controller.id,
        ip: controller.ip,
        online: false,
        lastChecked: new Date()
      });
    });
    this._controllerStatuses.set(statuses);
  }

  /**
   * Start periodic connection checking
   */
  private startPeriodicCheck(): void {
    this.pingSubscription = interval(PING_INTERVAL_MS).subscribe(() => {
      this.checkAllConnections();
    });
  }

  /**
   * Stop periodic checking
   */
  private stopPeriodicCheck(): void {
    this.pingSubscription?.unsubscribe();
    this.pingSubscription = null;
  }

  /**
   * Check all connections and update network mode
   */
  async checkAllConnections(): Promise<void> {
    // Check ESP controllers
    await this.checkEspControllers();

    // Check server (for future use)
    await this.checkServer();

    // Update network mode based on connectivity
    this.updateNetworkMode();

    this._lastCheck.set(new Date());
  }

  /**
   * Check ESP controller connectivity
   */
  private async checkEspControllers(): Promise<void> {
    const statuses = new Map(this._controllerStatuses());

    const checks = ESP_CONTROLLER_IPS.map(async controller => {
      const online = await this.pingEsp(controller.ip);
      statuses.set(controller.id, {
        id: controller.id,
        ip: controller.ip,
        online,
        lastChecked: new Date()
      });
    });

    await Promise.all(checks);
    this._controllerStatuses.set(statuses);
  }

  /**
   * Ping a single ESP controller
   */
  private async pingEsp(ip: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.get(`http://${ip}/json/info`, { responseType: 'json' }).pipe(
          timeout(PING_TIMEOUT_MS),
          catchError(() => of(null))
        )
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check server availability (for future use)
   */
  private async checkServer(): Promise<void> {
    // For now, server is not set up
    // This will be enabled when server is available
    this._serverAvailable.set(false);

    // Future implementation:
    // try {
    //   await firstValueFrom(
    //     this.http.get(SERVER_URL).pipe(
    //       timeout(PING_TIMEOUT_MS),
    //       catchError(() => of(null))
    //     )
    //   );
    //   this._serverAvailable.set(true);
    // } catch {
    //   this._serverAvailable.set(false);
    // }
  }

  /**
   * Update network mode based on current connectivity
   */
  private updateNetworkMode(): void {
    const previousMode = this._networkMode();
    let newMode: NetworkMode;

    if (this._serverAvailable()) {
      newMode = NetworkMode.SERVER;
    } else if (this.hasEspConnection()) {
      newMode = NetworkMode.ESP_ONLY;
    } else {
      newMode = NetworkMode.OFFLINE;
    }

    if (newMode !== previousMode) {
      this._networkMode.set(newMode);
      this.storage.saveNetworkMode(newMode);
      console.log(`Network mode changed: ${previousMode} -> ${newMode}`);
    }
  }

  /**
   * Force a manual connection check
   */
  async refresh(): Promise<void> {
    await this.checkAllConnections();
  }

  /**
   * Get controller status by ID
   */
  getControllerStatus(controllerId: number): ControllerStatus | undefined {
    return this._controllerStatuses().get(controllerId);
  }

  /**
   * Get network mode display label
   */
  getNetworkModeLabel(): string {
    switch (this._networkMode()) {
      case NetworkMode.OFFLINE:
        return 'Offline (Read-Only)';
      case NetworkMode.ESP_ONLY:
        return 'ESP Controllers';
      case NetworkMode.SERVER:
        return 'Server Connected';
      default:
        return 'Unknown';
    }
  }
}
