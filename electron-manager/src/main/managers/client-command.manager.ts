import { SpringBootManager } from './spring-boot.manager';

type CmdConfig = { syncServerUrl?: string; machineId?: string } | null | undefined;

/**
 * Polls the hub for an immediate command targeting THIS client (SHUTDOWN / RESTART) and executes it against
 * the local Spring Boot jar, then acknowledges it so it runs exactly once. This is the running-client half of
 * the hub's "Clients" control panel — distinct from the next-boot update directive (served by
 * /api/update/check). Commands are issued by an admin via POST /ng/sync/clients/{machineId}/command.
 */
export class ClientCommandManager {
  private timer?: NodeJS.Timeout;
  private busy = false;

  constructor(
    private readonly getConfig: () => CmdConfig,
    private readonly springBoot: SpringBootManager
  ) {}

  start(intervalMs = 30_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => { this.poll().catch(() => { /* logged inside */ }); }, intervalMs);
    console.log(`ClientCommandManager: polling the hub for commands every ${Math.round(intervalMs / 1000)}s`);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
  }

  private async poll(): Promise<void> {
    if (this.busy) return; // don't overlap a stop/restart in progress
    const cfg = this.getConfig();
    if (!cfg?.syncServerUrl || !cfg?.machineId) return;
    this.busy = true;
    try {
      const cmd = await this.fetchCommand(cfg.syncServerUrl, cfg.machineId);
      if (!cmd || !cmd.command || !cmd.id) return;
      console.log(`ClientCommandManager: executing hub command ${cmd.command} (${cmd.id})`);
      try {
        await this.execute(cmd.command);
      } catch (e: any) {
        console.warn(`ClientCommandManager: command ${cmd.command} failed: ${e?.message || e}`);
        return; // don't ack a failed command — the hub keeps it pending for a retry
      }
      // Ack AFTER executing (the ack is an HTTP call to the hub, unaffected by stopping the local jar).
      await this.ack(cfg.syncServerUrl, cfg.machineId, cmd.id);
    } catch (e: any) {
      console.warn(`ClientCommandManager: poll error: ${e?.message || e}`);
    } finally {
      this.busy = false;
    }
  }

  private async execute(command: string): Promise<void> {
    if (command === 'SHUTDOWN') {
      await this.springBoot.stop();
    } else if (command === 'RESTART') {
      await this.springBoot.stop();
      await this.springBoot.start();
    } else {
      console.warn(`ClientCommandManager: unknown command '${command}' — ignoring`);
    }
  }

  private fetchCommand(serverUrl: string, machineId: string): Promise<{ command: string | null; id?: string } | null> {
    return new Promise((resolve) => {
      try {
        const u = new URL('/api/sync/clients/command', serverUrl);
        const mod = u.protocol === 'https:' ? require('https') : require('http');
        const req = mod.request({
          hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname, method: 'GET', headers: { 'X-Machine-Id': machineId }, timeout: 10_000
        }, (res: any) => {
          let data = '';
          res.on('data', (c: any) => { data += c; });
          res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
      } catch { resolve(null); }
    });
  }

  private ack(serverUrl: string, machineId: string, id: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const u = new URL('/api/sync/clients/command-applied', serverUrl);
        const mod = u.protocol === 'https:' ? require('https') : require('http');
        const payload = JSON.stringify({ id });
        const req = mod.request({
          hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname, method: 'POST',
          headers: { 'X-Machine-Id': machineId, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          timeout: 10_000
        }, (res: any) => { res.resume(); res.on('end', () => resolve()); });
        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
        req.write(payload);
        req.end();
      } catch { resolve(); }
    });
  }
}
