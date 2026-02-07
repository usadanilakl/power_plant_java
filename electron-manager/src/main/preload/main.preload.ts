/**
 * Preload script - Exposes safe APIs to the renderer process via contextBridge.
 * Uses shared types from src/shared/types.ts (single source of truth).
 */

import { contextBridge, ipcRenderer } from 'electron';
import * as events from '../ipc/events';
import type { AppStatus, IpcResult, FireImpairment } from '../../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Identity
  isElectron: true,
  platform: process.platform,

  // Spring Boot control (single app)
  startApp: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_APP_START),
  stopApp: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_APP_STOP),
  restartApp: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_APP_RESTART),
  getAppStatus: (): Promise<AppStatus> => ipcRenderer.invoke(events.IPC_APP_GET_STATUS),
  getAppLogs: (): Promise<string[]> => ipcRenderer.invoke(events.IPC_APP_GET_LOGS),
  openAppUrl: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_OPEN_APP_URL),

  // Real-time subscriptions
  onAppStatusChange: (callback: (status: AppStatus) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, status: AppStatus) => callback(status);
    ipcRenderer.on(events.IPC_APP_STATUS_CHANGED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_APP_STATUS_CHANGED, sub); };
  },

  onAppLog: (callback: (line: string) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, line: string) => callback(line);
    ipcRenderer.on(events.IPC_APP_LOG, sub);
    return () => { ipcRenderer.removeListener(events.IPC_APP_LOG, sub); };
  },

  // Window control
  closeWindow: () => ipcRenderer.invoke(events.IPC_WINDOW_CLOSE),
  minimizeWindow: () => ipcRenderer.send(events.IPC_WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(events.IPC_WINDOW_MAXIMIZE),

  // Fire Impairment
  fireImpList: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_LIST),
  fireImpCreate: (dto: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_CREATE, dto),
  fireImpOpenForm: (formData: Record<string, string>): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_FIRE_IMP_OPEN_FORM, formData),

  // General
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(events.IPC_GET_APP_VERSION),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(events.IPC_OPEN_EXTERNAL, url),
  relaunchApp: () => ipcRenderer.send(events.IPC_RELAUNCH),
  quit: () => ipcRenderer.send(events.IPC_QUIT)
});
