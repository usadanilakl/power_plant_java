/** TOI/TMOD risk-assessment options + request shapes (mirrors backend ToiCreateRequest). */

export interface RiskOption { label: string; pts: number; }

export const TOI_PROBABILITY: RiskOption[] = [
  { label: 'Very Low', pts: -5 },
  { label: 'Low', pts: 0 },
  { label: 'Moderate', pts: 15 },
  { label: 'High', pts: 20 },
  { label: 'Very High', pts: 25 },
];

export type ToiSectionKey = 'safety' | 'environmental' | 'operations';

export const TOI_CONSEQUENCE: Record<ToiSectionKey, RiskOption[]> = {
  safety: [
    { label: 'No Possible Impact', pts: 5 },
    { label: 'Possible First Aid Case', pts: 10 },
    { label: 'Possible Minor Injury', pts: 15 },
    { label: 'Possible Serious Injury', pts: 20 },
    { label: 'Possible Loss of Life', pts: 25 },
  ],
  environmental: [
    { label: 'No Possible Impact', pts: 5 },
    { label: 'Possible Minor Impact', pts: 10 },
    { label: 'Possible Reportable Event', pts: 15 },
    { label: 'Possible NOV', pts: 20 },
    { label: 'Possible Significant (NOV / Outside Agency)', pts: 25 },
  ],
  operations: [
    { label: 'No Possible Impact to Equipment / Capacity / Contract', pts: 5 },
    { label: 'Possible Minor Operational Inconvenience', pts: 10 },
    { label: 'Possible Minor Equipment Damage', pts: 15 },
    { label: 'Possible Significant', pts: 20 },
    { label: 'Possible Loss of Life', pts: 25 },
  ],
};

export const TOI_SECTIONS: { key: ToiSectionKey; label: string }[] = [
  { key: 'safety', label: 'Safety' },
  { key: 'environmental', label: 'Environmental' },
  { key: 'operations', label: 'Operations (Reliability)' },
];

export function toiRiskLevel(total: number): string {
  return total <= 25 ? 'Low Risk' : total <= 45 ? 'Guarded Risk' : 'Serious Risk';
}

export interface ToiRiskSection {
  consequenceLabel: string; consequencePts: number | null;
  probabilityLabel: string; probabilityPts: number | null;
}

export interface ToiCreateRequest {
  title: string;
  location?: string; assetnum?: string; worktype?: string; siteid?: string;
  instructions?: string; riskIdentified?: string; countermeasures?: string;
  originator?: string; approvedBy?: string; approvedDate?: string; expectedCompletion?: string;
  safety: ToiRiskSection; environmental: ToiRiskSection; operations: ToiRiskSection;
}

export interface ToiUpdateRequest {
  title?: string; instructions?: string; location?: string; assetnum?: string; worktype?: string;
}

export const TOI_MARKER_CLOSED = 'TOI/TMOD-CLOSED';
export function toiIsClosed(description?: string): boolean {
  return !!description && description.includes(TOI_MARKER_CLOSED);
}
export function toiTitle(description?: string): string {
  return (description || '').replace(/^<<TOI\/TMOD[^>]*>>\s*/, '').trim() || '(untitled)';
}
