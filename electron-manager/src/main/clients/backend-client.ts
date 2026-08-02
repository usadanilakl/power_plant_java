/**
 * Tiny HTTP client for talking to the local Spring Boot instance. Targets
 * localhost only so the backend's DesktopAutoAuthFilter takes care of auth via
 * the OS user — no token plumbing required.
 *
 * Used by IPC handlers that mirror Electron-collected state (schedule, contacts,
 * contractors) into the local H2 so the existing sync system can replicate it.
 */

import * as http from 'http';
import { DEFAULT_SPRING_BOOT_CONFIG } from '../constants';

const DEFAULT_TIMEOUT_MS = 15_000;

export function backendBaseUrl(): string {
  return `http://localhost:${DEFAULT_SPRING_BOOT_CONFIG.port}`;
}

export async function backendGet<T = any>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return request('GET', path, undefined, timeoutMs);
}

export async function backendPost<T = any>(
  path: string, body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS, extraHeaders?: Record<string, string>
): Promise<T> {
  return request('POST', path, body, timeoutMs, extraHeaders);
}

function request<T>(
  method: 'GET' | 'POST', path: string, body: unknown, timeoutMs: number, extraHeaders?: Record<string, string>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(backendBaseUrl() + path);
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = { Accept: 'application/json', ...(extraHeaders || {}) };
    if (payload !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + (url.search || ''),
        method,
        headers,
        timeout: timeoutMs
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Backend ${method} ${path} -> HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
            return;
          }
          try {
            resolve(data ? JSON.parse(data) as T : undefined as any);
          } catch (err: any) {
            reject(new Error(`Backend ${method} ${path} returned non-JSON: ${err.message}`));
          }
        });
      }
    );
    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error(`Backend ${method} ${path} timed out`)); });
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}
