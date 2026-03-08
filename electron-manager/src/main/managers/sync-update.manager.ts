/**
 * SyncUpdateManager — Subscribes to the local Spring Boot SSE endpoint
 * (/api/sync-updates/stream) and forwards entity change notifications
 * to the Electron renderer via a callback.
 *
 * When sync changes arrive from the central server and are applied to the
 * local H2 database, Spring Boot broadcasts SSE "entity_updated" events.
 * This manager receives those events and notifies the renderer so it can
 * refresh its UI (e.g., fire impairment list, home page counts).
 */

import * as http from 'http';

const RECONNECT_DELAY_MS = 5_000;

export class SyncUpdateManager {
  private request: http.ClientRequest | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connected = false;
  private port = 0;
  private onEntityUpdated: (entityType: string, entityId: number) => void;

  constructor(onEntityUpdated: (entityType: string, entityId: number) => void) {
    this.onEntityUpdated = onEntityUpdated;
  }

  public connect(port: number): void {
    if (this.connected && this.port === port) return;
    this.port = port;
    this.doConnect();
  }

  public disconnect(): void {
    this.connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.request) {
      this.request.destroy();
      this.request = null;
    }
    console.log('[SyncUpdate] Disconnected');
  }

  private doConnect(): void {
    if (this.request) {
      this.request.destroy();
      this.request = null;
    }

    const url = `http://localhost:${this.port}/api/sync-updates/stream`;
    console.log(`[SyncUpdate] Connecting to SSE at ${url}`);

    this.request = http.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[SyncUpdate] SSE returned status ${res.statusCode}`);
        res.resume();
        this.scheduleReconnect();
        return;
      }

      this.connected = true;
      console.log('[SyncUpdate] Connected to SSE');

      let buffer = '';
      let currentEvent = '';
      let currentData = '';

      res.setEncoding('utf-8');
      res.on('data', (chunk: string) => {
        buffer += chunk;

        // Parse SSE format: lines separated by \n
        // event: <name>\n
        // data: <json>\n
        // \n  (empty line = end of event)
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            currentData += line.substring(5).trim();
          } else if (line === '') {
            // Empty line = end of event block
            if (currentEvent && currentData) {
              this.handleEvent(currentEvent, currentData);
            }
            currentEvent = '';
            currentData = '';
          }
        }
      });

      res.on('end', () => {
        console.log('[SyncUpdate] SSE connection ended');
        this.connected = false;
        this.request = null;
        this.scheduleReconnect();
      });

      res.on('error', (err) => {
        console.warn('[SyncUpdate] SSE stream error:', err.message);
        this.connected = false;
        this.request = null;
        this.scheduleReconnect();
      });
    });

    this.request.on('error', (err) => {
      console.warn('[SyncUpdate] SSE connection error:', err.message);
      this.connected = false;
      this.request = null;
      this.scheduleReconnect();
    });

    this.request.on('timeout', () => {
      console.warn('[SyncUpdate] SSE connection timeout');
      this.request?.destroy();
      this.request = null;
      this.connected = false;
      this.scheduleReconnect();
    });
  }

  private handleEvent(event: string, data: string): void {
    if (event === 'connected') {
      console.log('[SyncUpdate] SSE server confirmed connection');
      return;
    }

    if (event === 'entity_updated') {
      try {
        const payload = JSON.parse(data);
        const entityType = payload.entityType as string;
        const entityId = payload.entityId as number;
        if (entityType && entityId != null) {
          this.onEntityUpdated(entityType, entityId);
        }
      } catch (err: any) {
        console.warn('[SyncUpdate] Failed to parse entity_updated:', err.message);
      }
      return;
    }

    // Ignore other events (sync_complete, heartbeat, etc.)
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.port > 0) {
        this.doConnect();
      }
    }, RECONNECT_DELAY_MS);
  }
}
