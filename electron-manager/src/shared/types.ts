/**
 * Shared type definitions used by both Electron main process and Angular renderer.
 * This is the single source of truth for all IPC-related types.
 */

// Spring Boot app states
export type AppState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface AppStatus {
  state: AppState;
  port: number;
  pid?: number;
  uptime?: number;         // milliseconds since start
  lastHealthCheck?: string; // ISO date string (serializable)
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
}

// WebView targets
export type WebViewTarget = 'fm-global' | 'gate-website' | 'weather' | 'pjm';

export interface WebViewRequest {
  target: WebViewTarget;
  url: string;
  data?: Record<string, string>; // Form data to inject
}

// Fire Impairment
export interface FireImpairment {
  id?: number;
  name: string;
  email: string;
  emailCc?: string;
  clientName: string;
  phone?: string;
  streetAddress?: string;
  state?: string;
  city?: string;
  country?: string;
  office?: string;
  indexNumber?: string;
  valveNumber?: string;
  areaProtected?: string;
  protectionType?: string;
  reason?: string;
  precautions?: string;
  submissionDate?: string;
  predictedRestorationDate?: string;
  closedDate?: string;
  isActive: boolean;
  url?: string;
}

// Gate Log
export interface GateLogEntry {
  name: string;
  company: string;
  checkIn?: string;
  checkOut?: string;
  location?: string;
}

// Weather
export interface WeatherStatus {
  lightningDistance?: string;
  unit?: string;
  lastUpdate?: string;
  status: 'loading' | 'available' | 'unavailable';
}

// PJM
export interface PjmStatus {
  lmpPrice?: number;
  unit: string;
  lastUpdate?: string;
  status: 'loading' | 'available' | 'unavailable';
}

// IPC Result wrapper
export interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Settings
export interface AppSettings {
  springBoot: {
    jar: string;
    port: number;
    workingDir: string;
    healthUrl: string;
    autoStart: boolean;
    javaPath: string;  // 'java' or full path
  };
  syncServer: {
    url: string;
    enabled: boolean;
  };
  features: {
    weatherEnabled: boolean;
    pjmEnabled: boolean;
    gateLogEnabled: boolean;
    fireImpairmentEnabled: boolean;
  };
}
