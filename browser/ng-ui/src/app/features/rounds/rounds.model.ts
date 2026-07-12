/** Mirrors backend dto/rounds/RoundPerformDtos. */

export type RoundAnswerType = 'READING' | 'PASS_FAIL' | 'TEXT' | 'CHOICE' | 'SELECTOR';

export interface RoundListItem {
  id: number;
  name: string | null;
  area: string | null;
  cadence: string | null;
  shift: string | null;
  questionCount: number;
  myActiveInstanceId: number | null;
  grabbedBy: string | null;
  lastPerformedAt: string | null;
  due: boolean;
}

export interface OpenIssueRef {
  issueId: number;
  openedAt: string | null;
  openedBy: string | null;
  firstComment: string | null;
  lastValue: string | null;
}

export interface QuestionForPerform {
  id: number;
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
  openIssue: OpenIssueRef | null;
  predecessorQuestionId: number | null;
  showWhenOp: string | null;
  showWhenValue: string | null;
}

export interface RoundPerform {
  id: number;
  name: string | null;
  area: string | null;
  cadence: string | null;
  shift: string | null;
  instanceId: number | null;
  questions: QuestionForPerform[];
}

export interface GrabResult {
  instanceId: number;
  roundId: number;
  startedAt: string | null;
  alreadyOwned: boolean;
}

export interface AnswerInput {
  questionId: number;
  value: string | null;
  numericValue?: number | null;
  comment?: string | null;
}

export interface SubmitRoundRequest {
  shift?: string | null;
  notes?: string | null;
  answers: AnswerInput[];
}

export interface SubmitResult {
  instanceId: number;
  answersSaved: number;
  issuesOpened: number;
  issuesResolved: number;
  issuesOngoing: number;
  warnings: string[];
}

export interface RoundIssueDto {
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

export interface IssueCommentDto {
  id: number;
  text: string | null;
  author: string | null;
  createdAt: string | null;
}

export interface AnswerHistory {
  answeredAt: string | null;
  value: string | null;
  numericValue: number | null;
  outOfRange: boolean;
  instanceShift: string | null;
}

/**
 * A round being performed, persisted to localStorage. {@code draft} = in-progress autosave (restored on reopen);
 * {@code pending} = submitted while offline, queued to flush on reconnect; {@code failed} = server rejected
 * (validation/conflict) and needs the user. Answers keyed by questionId. {@code savedAt} is epoch millis (the
 * LocalStorage reviver coerces ISO strings to Dates — keep timestamps numeric).
 */
export interface RoundDraft {
  instanceId: number;
  roundId: number;
  roundName: string | null;
  answers: Record<number, { value: string; comment: string }>;
  notes: string;
  savedAt: number;
  status: 'draft' | 'pending' | 'failed';
  lastError?: string | null;
}

/** Parse a question's choicesJson (JSON array) into options; tolerant of nulls/bad JSON. */
export function parseChoices(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(x => String(x)) : [];
  } catch {
    return [];
  }
}

/**
 * Whether a question should be shown, given the current answers. A question with a predecessor shows only when the
 * predecessor is itself visible AND its answer satisfies the condition (ANSWERED / EQUALS / NOT_EQUALS). Recurses up
 * the dependency chain with a depth guard against accidental cycles; a dangling predecessor is treated as "show".
 */
export function isQuestionVisible(
  q: QuestionForPerform,
  qById: Map<number, QuestionForPerform>,
  valueOf: (id: number) => string,
  depth = 0,
): boolean {
  if (q.predecessorQuestionId == null) return true;
  if (depth > 50) return true;
  const pred = qById.get(q.predecessorQuestionId);
  if (!pred) return true;
  if (!isQuestionVisible(pred, qById, valueOf, depth + 1)) return false;
  const pv = (valueOf(pred.id) ?? '').trim();
  const op = (q.showWhenOp || 'ANSWERED').toUpperCase();
  if (op === 'ANSWERED') return pv !== '';
  if (pv === '') return false;
  const target = (q.showWhenValue ?? '').trim().toLowerCase();
  if (op === 'EQUALS') return pv.toLowerCase() === target;
  if (op === 'NOT_EQUALS') return pv.toLowerCase() !== target;
  return true;
}

/** Client-side mirror of the server out-of-range rule (drives live highlight + comment-required gating). */
export function isOutOfRange(q: QuestionForPerform, value: string | null, numericValue: number | null): boolean {
  if (q.answerType === 'READING') {
    const n = numericValue != null ? numericValue : (value != null && value.trim() !== '' ? Number(value) : NaN);
    if (isNaN(n)) return false;
    if (q.lowLimit != null && n < q.lowLimit) return true;
    if (q.highLimit != null && n > q.highLimit) return true;
    return false;
  }
  if (q.expectedValue && q.expectedValue.trim() !== '') {
    return value == null || value.trim().toLowerCase() !== q.expectedValue.trim().toLowerCase();
  }
  return false;
}
