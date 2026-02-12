/**
 * SpringBootManager - Manages the single main Spring Boot application process.
 * Handles starting, stopping, health monitoring, and log capture.
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import * as http from 'http';
import { AppState, AppStatus } from '../../shared/types';
import {
  DEFAULT_SPRING_BOOT_CONFIG,
  HEALTH_CHECK_INTERVAL,
  HEALTH_CHECK_TIMEOUT,
  STARTUP_HEALTH_DELAY,
  GRACEFUL_SHUTDOWN_TIMEOUT,
  MAX_LOG_LINES
} from '../constants';
import { getWorkingDir, getJavaPath } from '../paths';
import { DeviceConfigManager } from './device-config.manager';

export class SpringBootManager {
  private process: ChildProcess | null = null;
  private state: AppState = 'stopped';
  private pid?: number;
  private startedAt?: Date;
  private lastHealthCheck?: Date;
  private healthStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
  private logs: string[] = [];
  private error?: string;
  private healthCheckInterval?: NodeJS.Timeout;
  private statusCallback: (status: AppStatus) => void;
  private logCallback?: (line: string) => void;
  private deviceConfigManager: DeviceConfigManager;

  constructor(
    statusCallback: (status: AppStatus) => void,
    logCallback?: (line: string) => void
  ) {
    this.statusCallback = statusCallback;
    this.logCallback = logCallback;
    this.deviceConfigManager = new DeviceConfigManager();
  }

  public getDeviceConfigManager(): DeviceConfigManager {
    return this.deviceConfigManager;
  }

  public async start(): Promise<void> {
    if (this.state === 'running' || this.state === 'starting') {
      throw new Error(`Spring Boot is already ${this.state}`);
    }

    this.updateState('starting');
    this.logs = [];
    this.error = undefined;

    const config = DEFAULT_SPRING_BOOT_CONFIG;
    const workingDir = getWorkingDir();
    const jarPath = path.join(workingDir, config.jar);

    // Validate JAR exists
    if (!fs.existsSync(jarPath)) {
      this.error = `JAR not found: ${jarPath}`;
      this.updateState('error');
      throw new Error(this.error);
    }

    // Check for port conflict (e.g. previous user's session left Spring Boot running)
    const portInUse = await this.isPortInUse(config.port);
    if (portInUse) {
      console.log(`Port ${config.port} is already in use — stopping existing instance...`);
      this.addLog(`Port ${config.port} in use — stopping existing instance`);
      await this.killProcessOnPort(config.port);
      // Final check: ensure port is actually free after kill attempts
      const stillInUse = await this.isPortInUse(config.port);
      if (stillInUse) {
        const freed = await this.waitForPortFree(config.port, 5_000);
        if (!freed) {
          this.error = `Port ${config.port} is still in use after attempting to stop existing instance`;
          this.updateState('error');
          throw new Error(this.error);
        }
      }
      this.addLog('Previous instance stopped, port is now free');
    }

    // Build environment with device config
    const deviceConfig = this.deviceConfigManager.getConfig();
    const spawnEnv: Record<string, string> = { ...process.env as Record<string, string> };
    if (deviceConfig) {
      spawnEnv.DEVICE_CONFIG = deviceConfig.machineId.toLowerCase();
      console.log(`  Device: ${deviceConfig.deviceName} (#${deviceConfig.deviceNumber}, DEVICE_CONFIG=${spawnEnv.DEVICE_CONFIG})`);
    } else {
      console.log('  Device: NOT CONFIGURED — Spring Boot will use fallback device 9');
    }

    console.log(`Starting Spring Boot...`);
    console.log(`  Working dir: ${workingDir}`);
    console.log(`  JAR: ${jarPath}`);

    try {
      const proc = spawn(getJavaPath(), ['-jar', config.jar], {
        cwd: workingDir,
        env: spawnEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      this.process = proc;
      this.pid = proc.pid;
      this.startedAt = new Date();

      // Capture stdout
      proc.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          this.addLog(`[OUT] ${line}`);
        }
      });

      // Capture stderr
      proc.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          this.addLog(`[ERR] ${line}`);
        }
      });

      // Handle process exit
      proc.on('exit', (code, signal) => {
        console.log(`Spring Boot exited (code: ${code}, signal: ${signal})`);
        this.addLog(`Process exited with code ${code}`);
        this.stopHealthCheck();
        this.process = null;
        this.pid = undefined;
        this.startedAt = undefined;

        if (this.state !== 'stopping') {
          this.error = `Process exited unexpectedly (code: ${code})`;
          this.updateState('error');
        } else {
          this.updateState('stopped');
        }
      });

      proc.on('error', (err) => {
        console.error('Error starting Spring Boot:', err);
        this.addLog(`[ERROR] ${err.message}`);
        this.error = err.message;
        this.updateState('error');
      });

      // Start health checks after delay
      setTimeout(() => {
        if (this.state === 'starting' || this.state === 'running') {
          this.startHealthCheck();
        }
      }, STARTUP_HEALTH_DELAY);

    } catch (err: any) {
      this.error = err.message;
      this.updateState('error');
      throw err;
    }
  }

  public async stop(): Promise<void> {
    if (this.state === 'stopped') return;

    this.updateState('stopping');
    this.stopHealthCheck();

    if (this.process && !this.process.killed) {
      return new Promise((resolve) => {
        const proc = this.process!;

        const killTimeout = setTimeout(() => {
          if (!proc.killed) {
            console.log('Force killing Spring Boot...');
            proc.kill('SIGKILL');
          }
        }, GRACEFUL_SHUTDOWN_TIMEOUT);

        proc.once('exit', () => {
          clearTimeout(killTimeout);
          this.process = null;
          this.pid = undefined;
          this.startedAt = undefined;
          this.updateState('stopped');
          resolve();
        });

        console.log('Stopping Spring Boot...');
        if (process.platform === 'win32' && this.pid) {
          spawn('taskkill', ['/pid', this.pid.toString()]);
        } else {
          proc.kill('SIGTERM');
        }
      });
    } else {
      this.process = null;
      this.pid = undefined;
      this.startedAt = undefined;
      this.updateState('stopped');
    }
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  public getStatus(): AppStatus {
    return {
      state: this.state,
      port: DEFAULT_SPRING_BOOT_CONFIG.port,
      pid: this.pid,
      uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : undefined,
      lastHealthCheck: this.lastHealthCheck?.toISOString(),
      healthStatus: this.healthStatus,
      error: this.error
    };
  }

  public isRunning(): boolean {
    return this.state === 'running' || this.state === 'starting';
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  public shouldAutoStart(): boolean {
    return DEFAULT_SPRING_BOOT_CONFIG.autoStart;
  }

  /**
   * Add a log entry to the buffer and broadcast to renderer.
   * Used internally for Spring Boot stdout/stderr, and externally for Electron logs.
   */
  public addLog(line: string): void {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${line}`;
    this.logs.push(entry);

    if (this.logs.length > MAX_LOG_LINES) {
      this.logs = this.logs.slice(-MAX_LOG_LINES);
    }

    this.logCallback?.(entry);
  }

  // Private methods

  private updateState(state: AppState): void {
    this.state = state;
    this.statusCallback(this.getStatus());
  }

  private startHealthCheck(): void {
    this.stopHealthCheck();

    const check = () => {
      if (this.state === 'stopped' || this.state === 'stopping') {
        this.stopHealthCheck();
        return;
      }
      this.performHealthCheck();
    };

    check();
    this.healthCheckInterval = setInterval(check, HEALTH_CHECK_INTERVAL);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(true));
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      server.listen(port, '127.0.0.1');
    });
  }

  private async killProcessOnPort(port: number): Promise<void> {
    // 1. Try graceful shutdown via Spring Boot actuator endpoint
    const shutdownOk = await this.requestActuatorShutdown(port);
    if (shutdownOk) {
      console.log('Actuator shutdown request accepted — waiting for process to exit');
      this.addLog('Sent shutdown request to existing instance');
      const freed = await this.waitForPortFree(port, 8_000);
      if (freed) return; // Graceful shutdown succeeded
      console.log('Actuator shutdown did not free port in time — falling back to taskkill');
      this.addLog('Graceful shutdown timed out — force stopping');
    }

    // 2. Fallback: find PID via netstat and kill it
    if (process.platform !== 'win32') return;

    try {
      const output = execSync(
        `netstat -ano | findstr :${port} | findstr LISTENING`,
        { encoding: 'utf-8' }
      );
      const pids = new Set<string>();
      for (const line of output.trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }

      for (const pid of pids) {
        console.log(`Force killing process on port ${port} (PID: ${pid})`);
        this.addLog(`Force killing PID ${pid} on port ${port}`);
        try {
          execSync(`taskkill /pid ${pid} /f`, { encoding: 'utf-8' });
        } catch { /* process may have already exited */ }
      }
    } catch {
      // No process found on port
    }
  }

  private requestActuatorShutdown(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/actuator/shutdown',
          method: 'POST',
          timeout: 5_000,
          headers: { 'Content-Type': 'application/json' }
        },
        (res) => {
          res.resume();
          resolve(res.statusCode !== undefined && res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  }

  private waitForPortFree(port: number, timeoutMs: number = 10_000): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (Date.now() - start > timeoutMs) {
          resolve(false);
          return;
        }
        const server = net.createServer();
        server.once('error', () => {
          setTimeout(check, 500);
        });
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        server.listen(port, '127.0.0.1');
      };
      check();
    });
  }

  private performHealthCheck(): void {
    const config = DEFAULT_SPRING_BOOT_CONFIG;
    const url = new URL(config.healthUrl);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'GET',
        timeout: HEALTH_CHECK_TIMEOUT
      },
      (res) => {
        this.lastHealthCheck = new Date();
        const wasStarting = this.state === 'starting';

        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          this.healthStatus = 'healthy';
          if (wasStarting) {
            this.updateState('running');
            return; // updateState already emits callback
          }
        } else {
          this.healthStatus = 'unhealthy';
        }

        this.statusCallback(this.getStatus());
      }
    );

    req.on('error', () => {
      this.lastHealthCheck = new Date();
      this.healthStatus = 'unhealthy';
    });

    req.on('timeout', () => {
      req.destroy();
      this.lastHealthCheck = new Date();
      this.healthStatus = 'unhealthy';
    });

    req.end();
  }
}
