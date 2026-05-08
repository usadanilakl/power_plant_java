/**
 * PersonnelManager - Downloads and parses the OPS Schedule Excel from SharePoint.
 *
 * Excel structure (per month block):
 *   Row 0: Month name (merged across day columns)
 *   Row 1: Day-of-week headers (Wed, Thu, Fri, ...)
 *   Row 2: Day numbers (1, 2, 3, ...)
 *   Then personnel rows in pairs:
 *     - Row with name (col B) + shift codes across day columns
 *     - Second row (sometimes has override codes like P, U)
 *   Group labels (A, B, C, D, Relief, On Call Manager) appear in the group column,
 *   normalized to A/B/C/D/Rel/OCM. People rotate groups across months — each month's
 *   block has its own name->row layout, so shifts must be looked up per-month.
 *
 * Caches parsed data for 30 minutes.
 */

import * as XLSX from 'xlsx';
import { SharePointManager } from './sharepoint.manager';
import type { PersonnelEntry, PersonnelStatus, PersonnelContact, ShiftCode } from '../../shared/types';

function getSchedulePath(): string {
  const year = new Date().getFullYear();
  return `/sites/JG/External/60 - Operations/60.05 Ops schedule/${year}/OPS Schedule ${year}.xlsx`;
}
const CONTACTS_PATH = '/sites/JG/External/10 - Administration/PERSONNEL/EMERGENCY CONTACT LIST - EDITED 11_2024.xlsx';

const CACHE_TTL = 30 * 60_000;
const VALID_SHIFTS: Set<string> = new Set(['D', 'N', 'U', 'P', 'T', 'OCM']);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function normalizeGroupLabel(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[A-D]$/i.test(s)) return s.toUpperCase();
  if (/^rel(ief)?$/i.test(s)) return 'Rel';
  if (/^on\s*call\s*manager$/i.test(s) || /^ocm$/i.test(s)) return 'OCM';
  return null;
}

/**
 * Find a group label in a row, scanning the primary group column and nearby
 * columns to its LEFT only. Never scans into day-shift cells (right of nameCol),
 * because shift codes like "D" and "OCM" would false-match as group labels.
 */
function findGroupLabelInRow(row: any[], primaryCol: number): string | null {
  for (const c of [primaryCol, primaryCol - 1, primaryCol - 2]) {
    if (c < 0) continue;
    const found = normalizeGroupLabel(String(row[c] || ''));
    if (found) return found;
  }
  return null;
}

interface MonthMaps {
  nameToRow: Map<string, number>;
  rowToGroup: Map<number, string>;
  namesInOrder: string[];
}

export class PersonnelManager {
  private sharepoint: SharePointManager;
  private cachedPersonnel: PersonnelEntry[] | null = null;
  private cachedContacts: PersonnelContact[] | null = null;
  private cacheTime = 0;
  private contactsCacheTime = 0;
  private loading = false;

  constructor(sharepoint: SharePointManager) {
    this.sharepoint = sharepoint;
  }

  public async getPersonnelStatus(): Promise<PersonnelStatus> {
    if (!this.sharepoint.isConfigured()) {
      return { status: 'error', error: 'SharePoint not configured', onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    }

    try {
      const personnel = await this.getPersonnel();
      const now = new Date();
      const hour = now.getHours();
      // Shift change at 05:00 and 17:00 CT (machines are on-site in CT)
      const isDayShift = hour >= 5 && hour < 17;
      const currentShiftCode: ShiftCode = isDayShift ? 'D' : 'N';
      const currentShiftLabel = isDayShift ? 'Day Shift' : 'Night Shift';

      const onShiftNow = personnel.filter(p => p.todayShift === currentShiftCode);

      return {
        status: 'available',
        lastUpdate: new Date(this.cacheTime).toISOString(),
        onShiftNow,
        allPersonnel: personnel,
        currentShiftLabel,
      };
    } catch (err: any) {
      console.error('[Personnel] Error:', err.message);
      return { status: 'error', error: err.message, onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    }
  }

  public async getContacts(): Promise<PersonnelContact[]> {
    if (this.cachedContacts && Date.now() - this.contactsCacheTime < CACHE_TTL) {
      return this.cachedContacts;
    }
    try {
      console.log(`[Personnel] Downloading contacts from SharePoint: ${CONTACTS_PATH}`);
      const buffer = await this.sharepoint.downloadFile(CONTACTS_PATH);
      console.log(`[Personnel] Contacts downloaded: ${buffer.length} bytes`);
      this.cachedContacts = this.parseContacts(buffer);
      this.contactsCacheTime = Date.now();
      console.log(`[Personnel] Parsed ${this.cachedContacts.length} contacts`);
      return this.cachedContacts;
    } catch (err: any) {
      console.error('[Personnel] Failed to load contacts:', err.message);
      return this.cachedContacts || [];
    }
  }

  private async getPersonnel(): Promise<PersonnelEntry[]> {
    if (this.cachedPersonnel && Date.now() - this.cacheTime < CACHE_TTL) {
      return this.cachedPersonnel;
    }
    if (this.loading) return this.cachedPersonnel || [];

    this.loading = true;
    try {
      console.log('[Personnel] Downloading schedule from SharePoint...');
      const schedulePath = getSchedulePath();
      console.log(`[Personnel] Schedule path: ${schedulePath}`);
      const buffer = await this.sharepoint.downloadFile(schedulePath);
      this.cachedPersonnel = this.parseSchedule(buffer);
      this.cacheTime = Date.now();
      console.log(`[Personnel] Parsed ${this.cachedPersonnel.length} personnel entries`);
      return this.cachedPersonnel;
    } finally {
      this.loading = false;
    }
  }

  public async refresh(): Promise<PersonnelStatus> {
    this.cachedPersonnel = null;
    this.cacheTime = 0;
    return this.getPersonnelStatus();
  }

  // ── Schedule Parsing ────────────────────────────────────────────────────

  private parseSchedule(buffer: Buffer): PersonnelEntry[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    console.log(`[Personnel] Workbook sheets: ${workbook.SheetNames.join(', ')}`);

    // Pick the correct sheet based on whether the current year is a leap year
    const year = new Date().getFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const targetSheetName = isLeapYear ? 'Leap' : 'Non Leap';
    const sheet = workbook.Sheets[targetSheetName] || workbook.Sheets[workbook.SheetNames[0]];
    console.log(`[Personnel] Using sheet: "${targetSheetName}" (${year}, leap=${isLeapYear})`);
    if (!sheet) throw new Error('Schedule workbook has no sheets');

    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`[Personnel] Sheet has ${data.length} rows, ${data[0]?.length || 0} cols`);
    if (data.length < 5) throw new Error('Schedule sheet has too few rows');

    const now = new Date();
    const hour = now.getHours();
    // Between midnight and 5 AM, the active shift started yesterday at 17:00
    const shiftDate = (hour < 5) ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
    const currentMonth = shiftDate.getMonth();
    const currentDay = shiftDate.getDate();

    const monthRange = this.findMonthColumns(data, currentMonth);
    if (!monthRange) {
      console.warn(`[Personnel] Could not find month ${MONTH_NAMES[currentMonth]} in schedule`);
      return [];
    }

    const todayCol = this.findDayColumn(data[monthRange.dayNumberRow], monthRange.startCol, monthRange.endCol, currentDay);

    // Resolve the column ranges for ALL 12 months so the page can browse any month
    type MonthRange = NonNullable<ReturnType<typeof this.findMonthColumns>>;
    const monthRanges = new Map<number, MonthRange>();
    monthRanges.set(currentMonth, monthRange);
    for (let m = 0; m < 12; m++) {
      if (m === currentMonth) continue;
      const r = this.findMonthColumns(data, m);
      if (r) monthRanges.set(m, r);
    }

    // Build schedule days for the entire calendar year (Jan 1 → Dec 31).
    // Skip months whose layout couldn't be resolved (instead of bailing out).
    const scheduleDays: { col: number; date: string; month: number }[] = [];
    const startDate = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = Math.round((endOfYear.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    for (let d = 0; d < totalDays; d++) {
      const targetDate = new Date(year, 0, 1 + d);
      const targetMonth = targetDate.getMonth();
      const range = monthRanges.get(targetMonth);
      if (!range) continue;

      const col = this.findDayColumn(data[range.dayNumberRow], range.startCol, range.endCol, targetDate.getDate());
      if (col >= 0) {
        const y = targetDate.getFullYear();
        const mm = String(targetMonth + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        scheduleDays.push({ col, date: `${y}-${mm}-${dd}`, month: targetMonth });
      }
    }

    // For each month present (current + all schedule months), build a name->row + row->group map.
    // Names rotate between groups across months, so each month has its own row layout.
    const monthMaps = new Map<number, MonthMaps>();
    for (const [mIdx, range] of monthRanges.entries()) {
      const m = this.buildMonthMaps(data, range);
      monthMaps.set(mIdx, m);

      // Diagnostic: log the group breakdown for each month so we can spot months where
      // a known group (e.g. Rel) wasn't detected and people were misbucketed.
      const groupCounts: Record<string, number> = {};
      for (const grp of m.rowToGroup.values()) {
        groupCounts[grp || '(empty)'] = (groupCounts[grp || '(empty)'] || 0) + 1;
      }
      console.log(`[Personnel] ${MONTH_NAMES[mIdx]} group breakdown:`, groupCounts);
    }

    const currentMaps = monthMaps.get(currentMonth);
    if (!currentMaps) return [];

    // Iterate canonical roster from current month (preserves current-month order)
    const entries: PersonnelEntry[] = [];
    for (const name of currentMaps.namesInOrder) {
      const currentRow = currentMaps.nameToRow.get(name)!;
      const currentGroup = currentMaps.rowToGroup.get(currentRow) || '';

      const todayShift = this.getBestShift(data, currentRow, todayCol);

      // For each scheduled day, look up the person's row in THAT day's month
      const schedule = scheduleDays.map(sd => {
        const mMap = monthMaps.get(sd.month);
        const row = (mMap && sd.month !== currentMonth)
          ? (mMap.nameToRow.get(name) ?? currentRow)
          : currentRow;
        return { date: sd.date, shift: this.getBestShift(data, row, sd.col) };
      });

      // Track group per month for visual indication of rotation,
      // and per-month row index so the page can preserve spreadsheet order
      // (top=lead, middle=CRO, bottom=AO) for each month independently.
      const groupByMonth: Record<string, string> = {};
      const monthOrder: Record<string, number> = {};
      for (const [mIdx, mMap] of monthMaps.entries()) {
        const mRow = mMap.nameToRow.get(name);
        if (mRow !== undefined) {
          const grp = mMap.rowToGroup.get(mRow);
          if (grp) groupByMonth[String(mIdx)] = grp;
          const idx = mMap.namesInOrder.indexOf(name);
          if (idx >= 0) monthOrder[String(mIdx)] = idx;
        }
      }

      entries.push({ name, group: currentGroup, todayShift, schedule, groupByMonth, monthOrder });
    }

    return entries;
  }

  /**
   * Build name→row and row→group maps for a single month's data block.
   * Each person occupies 2 rows in the spreadsheet (main shift + override).
   */
  private buildMonthMaps(
    data: any[][],
    range: { groupCol: number; nameCol: number; dataStartRow: number }
  ): MonthMaps {
    const nameToRow = new Map<string, number>();
    const rowToGroup = new Map<number, string>();
    const namesInOrder: string[] = [];
    let currentGroup = '';

    for (let r = range.dataStartRow; r < data.length; r++) {
      const normalized = findGroupLabelInRow(data[r], range.groupCol);
      if (normalized) currentGroup = normalized;

      const nameCell = String(data[r][range.nameCol] || '').trim();
      if (!nameCell) continue;
      if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|January|February|March|April|May|June|July|August|September|October|November|December|Outage)/i.test(nameCell)) continue;
      if (/^\d+$/.test(nameCell)) continue;

      nameToRow.set(nameCell, r);
      rowToGroup.set(r, currentGroup);
      namesInOrder.push(nameCell);
      r++; // Skip the second row of this person's pair
    }

    return { nameToRow, rowToGroup, namesInOrder };
  }

  /**
   * Get the effective shift for a person at a given column.
   * Checks the main row first, then the row below (override row).
   * The override row takes precedence if it has a valid shift code.
   */
  private getBestShift(data: any[][], row: number, col: number): ShiftCode {
    if (col < 0) return '';
    const main = String(data[row]?.[col] || '').trim().toUpperCase();
    const override = String(data[row + 1]?.[col] || '').trim().toUpperCase();

    // Override row (P, U, T) takes priority if present
    if (VALID_SHIFTS.has(override)) return override as ShiftCode;
    if (VALID_SHIFTS.has(main)) return main as ShiftCode;
    return '';
  }

  private findMonthColumns(data: any[][], month: number): {
    startCol: number; endCol: number; nameCol: number; groupCol: number;
    dayNumberRow: number; dataStartRow: number;
  } | null {
    const monthName = MONTH_NAMES[month];

    // Scan first ~5 rows looking for the month name
    for (let r = 0; r < Math.min(data.length, 5); r++) {
      for (let c = 0; c < data[r].length; c++) {
        const cell = String(data[r][c] || '').trim();
        if (cell.toLowerCase() === monthName.toLowerCase()) {
          // Structure:
          //   Row r:   month name (merged)
          //   Row r+1: day-of-week headers
          //   Row r+2: day numbers (1, 2, 3, ...)
          //   Row r+3+: person data

          const dayNumberRow = r + 2;
          if (dayNumberRow >= data.length) return null;

          // Find first and last day columns — start scanning near the month header column
          let firstDayCol = -1;
          let lastDayCol = -1;

          // Start from the month header column (c) — day numbers are within this month's block
          // April has 30 days, months have 28-31 days. Stop when day numbers reset to 1.
          for (let dc = c; dc < data[dayNumberRow].length; dc++) {
            const val = Number(data[dayNumberRow][dc]);
            if (!isNaN(val) && val >= 1 && val <= 31) {
              if (firstDayCol < 0) {
                firstDayCol = dc;
              } else if (val === 1 && lastDayCol >= 0) {
                // Day numbers reset to 1 — we've entered the next month
                break;
              }
              lastDayCol = dc;
            }
          }

          if (firstDayCol < 0) return null;

          // Group column and name column are to the left of the day columns
          // From the screenshot: group is 2 cols before first day, name is 1 col before
          // But this varies — find them by looking at the data rows
          let groupCol = firstDayCol - 2;
          let nameCol = firstDayCol - 1;
          if (groupCol < 0) groupCol = 0;
          if (nameCol < 0) nameCol = 0;

          // Verify by checking if the expected name column has text in data rows
          // Look at a few rows below dayNumberRow to confirm
          let nameFound = false;
          for (let testR = dayNumberRow + 1; testR < Math.min(dayNumberRow + 10, data.length); testR++) {
            const testName = String(data[testR][nameCol] || '').trim();
            if (testName && !/^\d+$/.test(testName) && !VALID_SHIFTS.has(testName.toUpperCase())) {
              nameFound = true;
              break;
            }
          }

          // If name wasn't found at nameCol, try scanning columns left of firstDayCol
          if (!nameFound) {
            for (let nc = firstDayCol - 1; nc >= Math.max(0, firstDayCol - 5); nc--) {
              for (let testR = dayNumberRow + 1; testR < Math.min(dayNumberRow + 10, data.length); testR++) {
                const testName = String(data[testR][nc] || '').trim();
                if (testName && testName.length > 1 && !/^\d+$/.test(testName) && !VALID_SHIFTS.has(testName.toUpperCase())) {
                  nameCol = nc;
                  groupCol = nc > 0 ? nc - 1 : 0;
                  nameFound = true;
                  break;
                }
              }
              if (nameFound) break;
            }
          }


          return {
            startCol: firstDayCol,
            endCol: lastDayCol,
            nameCol,
            groupCol,
            dayNumberRow,
            dataStartRow: dayNumberRow + 1,
          };
        }
      }
    }
    return null;
  }

  private findDayColumn(dayRow: any[], startCol: number, endCol: number, targetDay: number): number {
    for (let c = startCol; c <= endCol; c++) {
      const val = Number(dayRow[c]);
      if (val === targetDay) return c;
    }
    return -1;
  }

  // ── Contacts Parsing ────────────────────────────────────────────────────

  private parseContacts(buffer: Buffer): PersonnelContact[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return [];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    // Column headers may contain newlines (e.g., "Primary Phone\nNumber")
    // Normalize keys by replacing newlines with spaces
    const normalized = rows.map(row => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        clean[k.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()] = v;
      }
      return clean;
    });

    return normalized
      .filter(row => row['Employee'])
      .map(row => ({
        name: String(row['Employee'] || '').trim(),
        title: String(row['Title'] || '').trim(),
        phone: String(row['Primary Phone Number'] || '').trim(),
        secondaryPhone: String(row['Secondary Number'] || '').trim(),
        emergencyContact: String(row['Emergency Contact'] || '').trim(),
        emergencyPhone: String(row['Emergency Contact Phone'] || '').trim(),
        emergencyRelation: String(row["Contact's Relation"] || '').trim(),
      }))
      .filter(c => c.name);
  }
}
