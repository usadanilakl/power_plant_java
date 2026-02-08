/**
 * DeviceConfigManager - Manages device identity configuration.
 * Reads/writes device-config.json (Electron's config) and machine-id.properties (Spring Boot's config).
 * Queries sync server for device registry (taken/available device numbers).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { DeviceConfig, DeviceRegistryResponse, IpcResult } from '../../shared/types';
import { DEFAULT_SPRING_BOOT_CONFIG, DEFAULT_SYNC_SERVER } from '../constants';

const DEVICE_CONFIG_FILE = 'device-config.json';
const MACHINE_ID_FILE = 'machine-id.properties';

export class DeviceConfigManager {
  private config: DeviceConfig | null = null;
  private workingDir: string;

  constructor() {
    this.workingDir = this.resolveWorkingDir();
    this.load();
  }

  private resolveWorkingDir(): string {
    return path.resolve(__dirname, '..', '..', '..', '..', DEFAULT_SPRING_BOOT_CONFIG.workingDir);
  }

  /** Check if device is configured */
  public isConfigured(): boolean {
    return this.config !== null && this.config.deviceNumber > 0;
  }

  /** Get current device config (or null) */
  public getConfig(): DeviceConfig | null {
    return this.config;
  }

  /** Save device config and write machine-id.properties for Spring Boot */
  public saveConfig(config: DeviceConfig): void {
    this.config = config;

    // Save device-config.json (Electron's persistent config)
    const configPath = path.join(this.workingDir, DEVICE_CONFIG_FILE);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Saved device config to ${configPath}`);

    // Write machine-id.properties (Spring Boot reads this)
    this.writeMachineIdProperties(config);
  }

  /** Load device config from file */
  private load(): void {
    const configPath = path.join(this.workingDir, DEVICE_CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
      console.log('No device-config.json found — device not configured');
      this.config = null;
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (data.deviceNumber && data.deviceName && data.machineId) {
        this.config = data as DeviceConfig;
        console.log(`Loaded device config: ${this.config.deviceName} (device #${this.config.deviceNumber})`);
        // Ensure machine-id.properties is in sync
        this.writeMachineIdProperties(this.config);
      }
    } catch (err) {
      console.error('Error loading device-config.json:', err);
      this.config = null;
    }
  }

  /** Write machine-id.properties in Spring Boot's working directory */
  private writeMachineIdProperties(config: DeviceConfig): void {
    const propsPath = path.join(this.workingDir, MACHINE_ID_FILE);
    const content = [
      '# Device identity for sync and ID generation — managed by Electron',
      `# Written at ${new Date().toISOString()}`,
      `machine.id=${config.machineId}`,
      `device.number=${config.deviceNumber}`,
      `device.name=${config.deviceName}`,
    ].join('\n') + '\n';

    try {
      fs.writeFileSync(propsPath, content, 'utf-8');
      console.log(`Wrote machine-id.properties: device.number=${config.deviceNumber}, machine.id=${config.machineId}`);
    } catch (err) {
      console.error('Error writing machine-id.properties:', err);
    }
  }

  /** Query sync server for device registry (which numbers are taken) */
  public async fetchDeviceRegistry(syncServerUrl?: string): Promise<IpcResult<DeviceRegistryResponse>> {
    const serverUrl = syncServerUrl || this.config?.syncServerUrl || DEFAULT_SYNC_SERVER.url;

    return new Promise((resolve) => {
      try {
        const url = new URL(`${serverUrl}/api/sync/device-registry`);
        const req = http.request(
          {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: 'GET',
            timeout: 10000
          },
          (res) => {
            let body = '';
            res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
            res.on('end', () => {
              try {
                const data = JSON.parse(body) as DeviceRegistryResponse;
                resolve({ success: true, data });
              } catch {
                resolve({ success: false, error: 'Invalid response from server' });
              }
            });
          }
        );

        req.on('error', (err) => {
          resolve({ success: false, error: `Cannot reach sync server: ${err.message}` });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Sync server request timed out' });
        });

        req.end();
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /** Register a new device with the sync server */
  public async registerWithServer(
    deviceName: string,
    deviceNumber?: number,
    syncServerUrl?: string
  ): Promise<IpcResult<DeviceConfig>> {
    const serverUrl = syncServerUrl || this.config?.syncServerUrl || DEFAULT_SYNC_SERVER.url;

    return new Promise((resolve) => {
      try {
        const url = new URL(`${serverUrl}/api/sync/device-registry`);
        const body: Record<string, unknown> = { deviceName };
        if (deviceNumber) body.deviceNumber = deviceNumber;
        const json = JSON.stringify(body);

        const req = http.request(
          {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: 'POST',
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(json)
            }
          },
          (res) => {
            let responseBody = '';
            res.on('data', (chunk: Buffer) => { responseBody += chunk.toString(); });
            res.on('end', () => {
              try {
                const data = JSON.parse(responseBody);
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && data.deviceNumber) {
                  const config: DeviceConfig = {
                    deviceNumber: data.deviceNumber,
                    deviceName: data.deviceName,
                    machineId: data.machineId,
                    syncServerUrl: serverUrl,
                    configuredAt: new Date().toISOString()
                  };
                  resolve({ success: true, data: config });
                } else {
                  resolve({ success: false, error: data.error || data.message || `Registration failed (HTTP ${res.statusCode})` });
                }
              } catch {
                resolve({ success: false, error: `Invalid response from server (HTTP ${res.statusCode})` });
              }
            });
          }
        );

        req.on('error', (err) => {
          resolve({ success: false, error: `Cannot reach sync server: ${err.message}` });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Registration request timed out' });
        });

        req.write(json);
        req.end();
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /** Derive machineId from device name (same logic as server) */
  public static deriveMachineId(deviceName: string): string {
    const id = deviceName.toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9\-]/g, '');
    return id || 'UNKNOWN';
  }
}
