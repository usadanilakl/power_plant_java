export type RecurrenceCadence = 'DAY' | 'WEEK' | 'MONTH' | 'OTHER';
export type ShiftPreference = 'DAY' | 'NIGHT' | 'EITHER';

export interface RecurringPm {
  id: number;
  pmKey: string;
  pmnum: string;
  pmDescription: string;
  lead: string;
  cadence: RecurrenceCadence | null;
  intervalDays: number | null;
  classificationLocked: boolean;
  shift: ShiftPreference;
  preferredDayOfWeek: number | null;   // ISO 1=Mon..7=Sun
  occurrenceCount: number | null;
  lastWonum: string;
  lastTargetDate: string | null;
  catalogRefreshedAt: string | null;
}

export interface PmPersonOption {
  personid: string;
  name: string;
}

/** A lead operator's identity, so the schedule peek can flag which roster people are leads. */
export interface PmLead {
  id: number;
  name: string;
  scheduleName: string | null;
  personid: string | null;
}

export interface PmPendingAssignment {
  href: string;
  wonum: string;
  pmnum: string;
  description: string;
  status: string;
  recurring: boolean;
  targetDate: string;
  shift: ShiftPreference;
  cadence: RecurrenceCadence | null;
  currentLead: string;
  proposedPersonid: string | null;
  proposedName: string | null;
  note: string | null;
  candidates: PmPersonOption[];
}

export interface PmAssignItem {
  href: string;
  personid?: string;
}

export interface PmAssignRequest {
  items: PmAssignItem[];
  memo?: string;
}

/** Minimal shift-roster shape for the schedule render (mirrors backend ShiftDayDto). */
export interface ShiftEntry {
  name: string;
  group: string;
  userId: number | null;
  matchConfidence: number | null;
}

export interface ShiftDay {
  id: number;
  date: string;
  year: number;
  dayShift: ShiftEntry[];
  nightShift: ShiftEntry[];
  unscheduled: ShiftEntry[];
  pto: ShiftEntry[];
  training: ShiftEntry[];
  onCallManagerName: string | null;
  onCallManagerUserId: number | null;
  source: string | null;
  lastSyncedAt: string | null;
}
