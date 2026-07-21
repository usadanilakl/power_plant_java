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
  manuallyAdded?: boolean;              // operator manually converted a WO to a recurring task
  formKey?: string | null;             // legacy: first assigned form (mirrors formKeys[0]), or null
  formKeys?: string[];                 // all assigned completion forms; the operator picks one at completion
}

export interface PmPersonOption {
  personid: string;
  name: string;
}

/** One real Maximo WO matching a recurring PM, for the catalog's history/upcoming timeline. */
export interface PmOccurrence {
  wonum: string;
  href: string;
  status: string;
  date: string | null;   // yyyy-MM-dd (effective date)
  lead: string;
  open: boolean;         // true = WSCH/WAPPR/APPR/INPRG (upcoming/active); false = history
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
  recurringPmId: number | null;        // matched RecurringPm catalog row id (null if not recurring) — enables inline shift/day edit
  targetDate: string;                  // Target Start (yyyy-MM-dd)
  targetFinish: string;                // Target Finish / period-end (yyyy-MM-dd; >= targetDate)
  shift: ShiftPreference;
  cadence: RecurrenceCadence | null;
  preferredDayOfWeek: number | null;   // ISO 1=Mon..7=Sun; non-null = date snapped to this weekday
  currentLead: string;
  proposedPersonid: string | null;
  proposedName: string | null;
  note: string | null;
  candidates: PmPersonOption[];
}

export interface PmAssignItem {
  href: string;
  personid?: string;
  targetDate?: string;    // yyyy-MM-dd; when set, written to the WO's Target Start
  targetFinish?: string;  // yyyy-MM-dd; written with targetDate as the WO's Target Finish
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
