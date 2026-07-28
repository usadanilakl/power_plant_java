/**
 * A node of a searchable, expandable tree — the minimal shape the ng-ui {@code TreeMenuComponent} needs.
 * Ported from the desktop `models/ui/nested-item.model.ts` (trimmed to what the PWA tree picker uses).
 */
export interface NestedItem {
  id: string | number;
  name: string;
  subtitle?: string;      // secondary text (holds the raw Maximo code so search matches it)
  values?: NestedItem[];  // children
  isExpanded?: boolean;
  objectType: string;
  color: string;
}
