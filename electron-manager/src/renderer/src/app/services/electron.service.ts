import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Types matching the preload script API.
 * Mirrors src/shared/types.ts (can't import directly due to separate build).
 */
export type AppState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface AppStatus {
  state: AppState;
  port: number;
  pid?: number;
  uptime?: number;
  lastHealthCheck?: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
}

export interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ElectronAPI {
  isElectron: boolean;
  platform: string;

  // Spring Boot control (single app)
  startApp: () => Promise<IpcResult>;
  stopApp: () => Promise<IpcResult>;
  restartApp: () => Promise<IpcResult>;
  getAppStatus: () => Promise<AppStatus>;
  getAppLogs: () => Promise<string[]>;
  openAppUrl: () => Promise<IpcResult>;

  // Real-time subscriptions
  onAppStatusChange: (callback: (status: AppStatus) => void) => () => void;
  onAppLog: (callback: (line: string) => void) => () => void;

  // Fire Impairment
  fireImpList: () => Promise<IpcResult<any[]>>;
  fireImpCreate: (dto: any) => Promise<IpcResult<any>>;
  fireImpOpenForm: (formData: Record<string, string>) => Promise<IpcResult>;

  // Window control
  closeWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;

  // General
  getAppVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  relaunchApp: () => void;
  quit: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService implements OnDestroy {
  private _appStatus = new BehaviorSubject<AppStatus>({
    state: 'stopped',
    port: 0,
    healthStatus: 'unknown'
  });

  private _logs = new BehaviorSubject<string[]>([]);
  private unsubscribeStatus?: () => void;
  private unsubscribeLog?: () => void;

  constructor(private ngZone: NgZone) {
    if (this.isElectron) {
      this.initSubscriptions();
      this.loadInitialStatus();
    }
  }

  get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  get platform(): string {
    return window.electronAPI?.platform || 'web';
  }

  get appStatus$(): Observable<AppStatus> {
    return this._appStatus.asObservable();
  }

  get logs$(): Observable<string[]> {
    return this._logs.asObservable();
  }

  private async loadInitialStatus(): Promise<void> {
    try {
      const status = await window.electronAPI!.getAppStatus();
      this.ngZone.run(() => this._appStatus.next(status));

      const logs = await window.electronAPI!.getAppLogs();
      this.ngZone.run(() => this._logs.next(logs));
    } catch (error) {
      console.error('Failed to load initial status:', error);
    }
  }

  private initSubscriptions(): void {
    this.unsubscribeStatus = window.electronAPI!.onAppStatusChange((status) => {
      this.ngZone.run(() => this._appStatus.next(status));
    });

    this.unsubscribeLog = window.electronAPI!.onAppLog((line) => {
      this.ngZone.run(() => {
        const current = this._logs.value;
        this._logs.next([...current, line]);
      });
    });
  }

  // Spring Boot controls

  async startApp(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.startApp();
  }

  async stopApp(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.stopApp();
  }

  async restartApp(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.restartApp();
  }

  async openAppUrl(): Promise<void> {
    if (!this.isElectron) return;
    await window.electronAPI!.openAppUrl();
  }

  async refreshLogs(): Promise<void> {
    if (!this.isElectron) return;
    const logs = await window.electronAPI!.getAppLogs();
    this.ngZone.run(() => this._logs.next(logs));
  }

  // Fire Impairment

  async fireImpList(): Promise<IpcResult<any[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpList();
  }

  async fireImpCreate(dto: any): Promise<IpcResult<any>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpCreate(dto);
  }

  async fireImpOpenForm(formData: Record<string, string>): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpOpenForm(formData);
  }

  // Window controls

  closeWindow(): void {
    window.electronAPI?.closeWindow();
  }

  minimizeWindow(): void {
    window.electronAPI?.minimizeWindow();
  }

  maximizeWindow(): void {
    window.electronAPI?.maximizeWindow();
  }

  // General

  async getAppVersion(): Promise<string> {
    if (!this.isElectron) return 'dev';
    return window.electronAPI!.getAppVersion();
  }

  async openExternal(url: string): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI!.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }

  relaunchApp(): void {
    window.electronAPI?.relaunchApp();
  }

  quit(): void {
    window.electronAPI?.quit();
  }

  ngOnDestroy(): void {
    this.unsubscribeStatus?.();
    this.unsubscribeLog?.();
  }
}
