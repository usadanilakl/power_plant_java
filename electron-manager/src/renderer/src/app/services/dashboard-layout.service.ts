import { Injectable, signal, computed } from '@angular/core';

export type WidgetId =
  | 'fire-impairment'
  | 'gate-log'
  | 'weather'
  | 'pjm'
  | 'permits'
  | 'external-links'
  | 'contacts'
  | 'paging-system';

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  icon: string;
  iconColor: string;
  description: string;
  defaultColSpan: 1 | 2;
  allowedColSpans: (1 | 2)[];
  requiresSpringBoot: boolean;
}

export interface WidgetPlacement {
  widgetId: WidgetId;
  visible: boolean;
  colSpan: 1 | 2;
}

export interface SavedLayout {
  version: 2;
  widgets: WidgetPlacement[];
}

export interface LayoutPreset {
  name: string;
  widgets: WidgetPlacement[];
}

const STORAGE_KEY = 'dk-dashboard-layout-v2';

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: 'fire-impairment', title: 'Fire Impairment', icon: 'local_fire_department', iconColor: '#ef4444', description: 'Manage fire protection impairments', defaultColSpan: 1, allowedColSpans: [1, 2], requiresSpringBoot: true },
  { id: 'gate-log', title: 'Gate Log', icon: 'badge', iconColor: '#06b6d4', description: 'Monitor site access and personnel', defaultColSpan: 1, allowedColSpans: [1, 2], requiresSpringBoot: false },
  { id: 'weather', title: 'Weather', icon: 'thunderstorm', iconColor: '#f59e0b', description: 'Lightning and weather monitoring', defaultColSpan: 1, allowedColSpans: [1, 2], requiresSpringBoot: false },
  { id: 'pjm', title: 'PJM', icon: 'bolt', iconColor: '#eab308', description: 'Grid pricing and power data', defaultColSpan: 1, allowedColSpans: [1, 2], requiresSpringBoot: false },
  { id: 'permits', title: 'Permits', icon: 'assignment', iconColor: '#8b5cf6', description: 'Work requests, LOTOs, permits', defaultColSpan: 1, allowedColSpans: [1], requiresSpringBoot: true },
  { id: 'external-links', title: 'External Links', icon: 'open_in_new', iconColor: '#3b82f6', description: 'SharePoint, Maximo, and other tools', defaultColSpan: 1, allowedColSpans: [1], requiresSpringBoot: false },
  { id: 'contacts', title: 'Contacts', icon: 'contacts', iconColor: '#10b981', description: 'Plant contact information', defaultColSpan: 1, allowedColSpans: [1], requiresSpringBoot: false },
  { id: 'paging-system', title: 'Paging System', icon: 'campaign', iconColor: '#f97316', description: 'PA system extension numbers', defaultColSpan: 1, allowedColSpans: [1], requiresSpringBoot: false },
];

const PRESET_DEFAULT: WidgetPlacement[] = WIDGET_REGISTRY.map(w => ({
  widgetId: w.id,
  visible: true,
  colSpan: w.defaultColSpan,
}));

const PRESET_OPERATIONS: WidgetPlacement[] = [
  { widgetId: 'fire-impairment', visible: true, colSpan: 2 },
  { widgetId: 'weather', visible: true, colSpan: 2 },
  { widgetId: 'pjm', visible: true, colSpan: 1 },
  { widgetId: 'gate-log', visible: true, colSpan: 1 },
  { widgetId: 'permits', visible: true, colSpan: 1 },
  { widgetId: 'contacts', visible: false, colSpan: 1 },
  { widgetId: 'external-links', visible: false, colSpan: 1 },
  { widgetId: 'paging-system', visible: false, colSpan: 1 },
];

const PRESET_COMPACT: WidgetPlacement[] = [
  { widgetId: 'weather', visible: true, colSpan: 1 },
  { widgetId: 'pjm', visible: true, colSpan: 1 },
  { widgetId: 'fire-impairment', visible: true, colSpan: 1 },
  { widgetId: 'permits', visible: true, colSpan: 1 },
  { widgetId: 'gate-log', visible: true, colSpan: 1 },
  { widgetId: 'external-links', visible: true, colSpan: 1 },
  { widgetId: 'contacts', visible: false, colSpan: 1 },
  { widgetId: 'paging-system', visible: false, colSpan: 1 },
];

const PRESETS: LayoutPreset[] = [
  { name: 'Default', widgets: PRESET_DEFAULT },
  { name: 'Operations Focus', widgets: PRESET_OPERATIONS },
  { name: 'Compact', widgets: PRESET_COMPACT },
];

@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {
  private readonly _layout = signal<WidgetPlacement[]>(structuredClone(PRESET_DEFAULT));
  readonly layout = this._layout.asReadonly();

  readonly currentPresetName = computed(() => {
    const current = this._layout();
    for (const preset of PRESETS) {
      if (this.layoutsMatch(current, preset.widgets)) {
        return preset.name;
      }
    }
    return 'Custom';
  });

  constructor() {
    this.loadOrDefault();
  }

  loadOrDefault(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: SavedLayout = JSON.parse(raw);
      if (parsed.version !== 2 || !Array.isArray(parsed.widgets)) return;
      this._layout.set(this.sanitize(parsed.widgets));
    } catch {
      // Corrupt data — keep default
    }
  }

  startEditing(): WidgetPlacement[] {
    return structuredClone(this._layout());
  }

  save(draft: WidgetPlacement[]): void {
    const sanitized = this.sanitize(draft);
    this._layout.set(sanitized);
    const saved: SavedLayout = { version: 2, widgets: sanitized };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  getPresets(): LayoutPreset[] {
    return PRESETS.map(p => ({ name: p.name, widgets: structuredClone(p.widgets) }));
  }

  getWidgetDefinition(id: WidgetId): WidgetDefinition | undefined {
    return WIDGET_REGISTRY.find(w => w.id === id);
  }

  private sanitize(widgets: WidgetPlacement[]): WidgetPlacement[] {
    const validIds = new Set<WidgetId>(WIDGET_REGISTRY.map(w => w.id));
    const result: WidgetPlacement[] = [];
    const seen = new Set<WidgetId>();

    for (const w of widgets) {
      if (!validIds.has(w.widgetId) || seen.has(w.widgetId)) continue;
      seen.add(w.widgetId);
      const def = WIDGET_REGISTRY.find(d => d.id === w.widgetId)!;
      const colSpan = def.allowedColSpans.includes(w.colSpan) ? w.colSpan : def.defaultColSpan;
      result.push({ widgetId: w.widgetId, visible: !!w.visible, colSpan });
    }

    // Add any missing widgets with defaults
    for (const def of WIDGET_REGISTRY) {
      if (!seen.has(def.id)) {
        result.push({ widgetId: def.id, visible: true, colSpan: def.defaultColSpan });
      }
    }

    return result;
  }

  private layoutsMatch(a: WidgetPlacement[], b: WidgetPlacement[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((w, i) =>
      w.widgetId === b[i].widgetId &&
      w.visible === b[i].visible &&
      w.colSpan === b[i].colSpan
    );
  }
}
