/** Mirrors backend dto/rounds/* records and the Round* entities (authoring side). */

export type RoundAnswerType = 'READING' | 'PASS_FAIL' | 'TEXT' | 'CHOICE' | 'SELECTOR';
export type RoundCadence = 'PER_SHIFT' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type RoundShift = 'DAY' | 'NIGHT' | 'EITHER';
export type StagingStatus = 'NEW' | 'PROCESSED' | 'IGNORED';

export const ANSWER_TYPES: RoundAnswerType[] = ['READING', 'PASS_FAIL', 'TEXT', 'CHOICE', 'SELECTOR'];
export const CADENCES: RoundCadence[] = ['PER_SHIFT', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'];
export const SHIFTS: RoundShift[] = ['DAY', 'NIGHT', 'EITHER'];

/** One WebView-AMS column parsed into staging (backend ImportedRoundQuestionDto). */
export interface ImportedRoundQuestion {
  id: number;
  sourceWebviewKey: string;
  sourceRaw: string | null;
  category: string | null;
  tagCode: string | null;
  prompt: string | null;
  lowLimit: number | null;
  highLimit: number | null;
  unit: string | null;
  suggestedType: RoundAnswerType | null;
  status: StagingStatus;
  generatedQuestionId: number | null;
  changedSinceProcessed: boolean;
}

/** An editable round question (backend RoundQuestionDto). */
export interface RoundQuestion {
  id: number;
  roundId: number | null;
  orderIndex: number | null;
  prompt: string | null;
  answerType: RoundAnswerType | null;
  physicalObjectId: number | null;
  tagCode: string | null;
  unit: string | null;
  lowLimit: number | null;
  highLimit: number | null;
  expectedValue: string | null;
  trackIssues: boolean;
  choicesJson: string | null;
  category: string | null;
  sourceWebviewKey: string | null;
  predecessorQuestionId: number | null;
  showWhenOp: string | null;
  showWhenValue: string | null;
}

/** A round definition (backend RoundDto). */
export interface Round {
  id: number;
  name: string | null;
  description: string | null;
  area: string | null;
  cadence: RoundCadence | null;
  shift: RoundShift | null;
  intervalHours: number | null;
  active: boolean;
  sourceTemplate: string | null;
  questionCount: number;
  questions: RoundQuestion[] | null;
}

/** POST /ng/rounds-admin/staging/{id}/generate  body (id is the staging row; omit stagingId in body). */
export interface GenerateQuestionRequest {
  stagingId?: number | null;
  roundId: number;
  physicalObjectId?: number | null;
  prompt?: string | null;
  answerType?: RoundAnswerType | null;
  unit?: string | null;
  lowLimit?: number | null;
  highLimit?: number | null;
  expectedValue?: string | null;
  trackIssues?: boolean | null;
  choicesJson?: string | null;
}

export interface CreateRoundRequest {
  name: string;
  description?: string | null;
  area?: string | null;
  cadence?: RoundCadence | null;
  shift?: RoundShift | null;
  intervalHours?: number | null;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  message: string;
}

/** An out-of-range issue (backend RoundIssueDto) for the desktop Active Out-of-Range dashboard. */
export interface RoundIssue {
  id: number;
  questionId: number;
  physicalObjectId: number | null;
  questionPrompt: string | null;
  category: string | null;
  unit: string | null;
  status: string | null;
  openedAt: string | null;
  openedBy: string | null;
  firstComment: string | null;
  lastSeenAt: string | null;
  lastValue: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  commentCount: number;
}

export interface RoundIssueComment {
  id: number;
  text: string | null;
  author: string | null;
  createdAt: string | null;
}
