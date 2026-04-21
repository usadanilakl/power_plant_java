import { Injectable, signal, computed } from '@angular/core';

export type WidgetId =
  | 'fire-impairment'
  | 'gate-log'
  | 'weather'
  | 'pjm'
  | 'permits'
  | 'external-links'
  | 'contacts'
  | 'paging-system'
  | 'clock'
  | 'notes'
  | 'personnel'
  | 'toi';

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  icon: string;
  iconColor: string;
  description: string;
  minCols: number;
  minRows: number;
  defaultCols: number;
  defaultRows: number;
  requiresSpringBoot: boolean;
}

export interface WidgetPlacement {
  widgetId: WidgetId;
  visible: boolean;
  x: number;
  y: number;
  cols: number;
  rows: number;
  settings?: Record<string, any>;
}

export interface SavedLayout {
  version: 3;
  widgets: WidgetPlacement[];
}

export interface LayoutPreset {
  name: string;
  widgets: WidgetPlacement[];
}

const STORAGE_KEY = 'dk-dashboard-layout-v3';

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: 'fire-impairment', title: 'Fire Impairment', icon: 'local_fire_department', iconColor: '#ef4444', description: 'Manage fire protection impairments', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: true },
  { id: 'gate-log', title: 'Gate Log', icon: 'badge', iconColor: '#06b6d4', description: 'Monitor site access and personnel', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'weather', title: 'Weather', icon: 'thunderstorm', iconColor: '#f59e0b', description: 'Lightning and weather monitoring', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'pjm', title: 'PJM', icon: 'bolt', iconColor: '#eab308', description: 'Grid pricing and power data', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'permits', title: 'Permits', icon: 'assignment', iconColor: '#8b5cf6', description: 'Work requests, LOTOs, permits', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: true },
  { id: 'external-links', title: 'External Links', icon: 'open_in_new', iconColor: '#3b82f6', description: 'SharePoint, Maximo, and other tools', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'contacts', title: 'Contacts', icon: 'contacts', iconColor: '#10b981', description: 'Plant contact information', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'paging-system', title: 'Paging System', icon: 'campaign', iconColor: '#f97316', description: 'PA system extension numbers', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'clock', title: 'Clock & Timers', icon: 'schedule', iconColor: '#6366f1', description: 'Clock, shift timer, reminders', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'notes', title: 'Notes', icon: 'sticky_note_2', iconColor: '#f59e0b', description: 'Quick notes and reminders', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'personnel', title: 'Personnel', icon: 'groups', iconColor: '#8b5cf6', description: 'Shift schedule and roster', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
  { id: 'toi', title: 'TOI/TMOD', icon: 'description', iconColor: '#10b981', description: 'Active TOI/TMOD documents', minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1, requiresSpringBoot: false },
];

// 3-column grid, auto-placed top-to-bottom left-to-right
function buildDefaultPreset(): WidgetPlacement[] {
  const cols = 3;
  const order: WidgetId[] = [
    'fire-impairment', 'gate-log', 'weather',
    'pjm', 'permits', 'external-links',
    'contacts', 'paging-system', 'clock',
    'notes', 'personnel', 'toi',
  ];
  return order.map((id, i) => ({
    widgetId: id,
    visible: true,
    x: i % cols,
    y: Math.floor(i / cols),
    cols: 1,
    rows: 1,
  }));
}

function buildOperationsPreset(): WidgetPlacement[] {
  return [
    { widgetId: 'fire-impairment', visible: true, x: 0, y: 0, cols: 2, rows: 1 },
    { widgetId: 'weather', visible: true, x: 2, y: 0, cols: 1, rows: 2 },
    { widgetId: 'pjm', visible: true, x: 0, y: 1, cols: 1, rows: 1 },
    { widgetId: 'gate-log', visible: true, x: 1, y: 1, cols: 1, rows: 1 },
    { widgetId: 'permits', visible: true, x: 0, y: 2, cols: 1, rows: 1 },
    { widgetId: 'clock', visible: true, x: 1, y: 2, cols: 1, rows: 1 },
    { widgetId: 'notes', visible: true, x: 2, y: 2, cols: 1, rows: 1 },
    { widgetId: 'personnel', visible: true, x: 0, y: 3, cols: 2, rows: 1 },
    { widgetId: 'contacts', visible: false, x: 2, y: 3, cols: 1, rows: 1 },
    { widgetId: 'external-links', visible: false, x: 0, y: 4, cols: 1, rows: 1 },
    { widgetId: 'paging-system', visible: false, x: 1, y: 4, cols: 1, rows: 1 },
  ];
}

function buildCompactPreset(): WidgetPlacement[] {
  return [
    { widgetId: 'weather', visible: true, x: 0, y: 0, cols: 1, rows: 1 },
    { widgetId: 'pjm', visible: true, x: 1, y: 0, cols: 1, rows: 1 },
    { widgetId: 'fire-impairment', visible: true, x: 2, y: 0, cols: 1, rows: 1 },
    { widgetId: 'permits', visible: true, x: 0, y: 1, cols: 1, rows: 1 },
    { widgetId: 'gate-log', visible: true, x: 1, y: 1, cols: 1, rows: 1 },
    { widgetId: 'external-links', visible: true, x: 2, y: 1, cols: 1, rows: 1 },
    { widgetId: 'clock', visible: true, x: 0, y: 2, cols: 1, rows: 1 },
    { widgetId: 'personnel', visible: true, x: 1, y: 2, cols: 1, rows: 1 },
    { widgetId: 'notes', visible: false, x: 2, y: 2, cols: 1, rows: 1 },
    { widgetId: 'contacts', visible: false, x: 0, y: 3, cols: 1, rows: 1 },
    { widgetId: 'paging-system', visible: false, x: 1, y: 3, cols: 1, rows: 1 },
  ];
}

const PRESET_DEFAULT = buildDefaultPreset();

const PRESETS: LayoutPreset[] = [
  { name: 'Default', widgets: PRESET_DEFAULT },
  { name: 'Operations Focus', widgets: buildOperationsPreset() },
  { name: 'Compact', widgets: buildCompactPreset() },
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
      if (parsed.version !== 3 || !Array.isArray(parsed.widgets)) return;
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
    const saved: SavedLayout = { version: 3, widgets: sanitized };
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
      result.push({
        widgetId: w.widgetId,
        visible: !!w.visible,
        x: w.x ?? 0,
        y: w.y ?? 0,
        cols: Math.max(w.cols ?? def.defaultCols, def.minCols),
        rows: Math.max(w.rows ?? def.defaultRows, def.minRows),
        settings: w.settings,
      });
    }

    // Add any missing widgets with defaults at the bottom
    let nextY = result.length > 0 ? Math.max(...result.map(w => w.y + w.rows)) : 0;
    let nextX = 0;
    for (const def of WIDGET_REGISTRY) {
      if (!seen.has(def.id)) {
        result.push({
          widgetId: def.id, visible: true,
          x: nextX, y: nextY, cols: def.defaultCols, rows: def.defaultRows,
        });
        nextX++;
        if (nextX >= 3) { nextX = 0; nextY++; }
      }
    }

    return result;
  }

  private layoutsMatch(a: WidgetPlacement[], b: WidgetPlacement[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((w, i) =>
      w.widgetId === b[i].widgetId &&
      w.visible === b[i].visible &&
      w.x === b[i].x && w.y === b[i].y &&
      w.cols === b[i].cols && w.rows === b[i].rows
    );
  }
}
