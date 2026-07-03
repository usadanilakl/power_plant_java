/**
 * MaximoOverviewManager — owns the per-device Maximo overview config
 * (managed_apps/pid/maximo-overview-config.json): which people this client's overview widget tracks.
 * Mirrors GateLogManager's config load/save. Purely a config store — the actual WO data is fetched
 * from Spring Boot (see the IPC_MAXIMO_OVERVIEW handler), which does the bucketing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_MAXIMO_OVERVIEW_CONFIG } from '../constants';
import { getWorkingDir } from '../paths';
import type { MaximoOverviewConfig } from '../../shared/types';

export class MaximoOverviewManager {
  private config: MaximoOverviewConfig;
  private configPath: string;

  constructor() {
    this.configPath = path.join(getWorkingDir(), 'maximo-overview-config.json');
    this.config = this.loadConfig();
  }

  public loadConfig(): MaximoOverviewConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return { ...DEFAULT_MAXIMO_OVERVIEW_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('Failed to load maximo-overview config, using defaults:', err);
    }
    return { ...DEFAULT_MAXIMO_OVERVIEW_CONFIG };
  }

  public saveConfig(config: MaximoOverviewConfig): void {
    // Normalize: keep only the known fields, drop blank/dup personids, and force 'leads' to carry no ids.
    const mode: MaximoOverviewConfig['mode'] = config?.mode === 'people' ? 'people' : 'leads';
    const personids = mode === 'people'
      ? Array.from(new Set((config?.personids ?? []).map(s => (s ?? '').trim()).filter(s => s.length > 0)))
      : [];
    this.config = { mode, personids, label: config?.label };
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    console.log(`Maximo overview config saved (mode=${mode}, ${personids.length} people)`);
  }

  public getConfig(): MaximoOverviewConfig {
    return { ...this.config };
  }
}
