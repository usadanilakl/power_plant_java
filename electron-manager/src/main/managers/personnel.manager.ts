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
 *   Group labels (A, B, C, D, Relief) appear in column A, spanning 2+ person pairs
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
const CONTACTS_PATH = '/sites/JG/External/60 - Operations/EMERGENCY CONTACT LIST - EDITED 11_2024.xlsx';

const CACHE_TTL = 30 * 60_000;
const VALID_SHIFTS: Set<string> = new Set(['D', 'N', 'U', 'P', 'T']);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

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
      const isDayShift = hour >= 6 && hour < 18;
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
      console.log('[Personnel] Downloading contacts from SharePoint...');
      const buffer = await this.sharepoint.downloadFile(CONTACTS_PATH);
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
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Find month block
    const monthRange = this.findMonthColumns(data, currentMonth);
    if (!monthRange) {
      console.warn(`[Personnel] Could not find month ${MONTH_NAMES[currentMonth]} in schedule`);
      return [];
    }

    console.log(`[Personnel] Month: ${MONTH_NAMES[currentMonth]}, nameCol: ${monthRange.nameCol}, groupCol: ${monthRange.groupCol}, dayRange: ${monthRange.startCol}-${monthRange.endCol}, dayNumberRow: ${monthRange.dayNumberRow}, monthFoundAt: row=${monthRange._debugRow} col=${monthRange._debugCol}`);

    // Log the day number row around the found range
    const dayRowData = data[monthRange.dayNumberRow];
    const dayNums = [];
    for (let c = Math.max(0, monthRange.startCol - 2); c <= Math.min(monthRange.endCol + 2, dayRowData.length - 1); c++) {
      dayNums.push(`[${c}]=${dayRowData[c]}`);
    }
    console.log(`[Personnel] Day number row: ${dayNums.join(', ')}`);

    // Find today's column
    const todayCol = this.findDayColumn(data[monthRange.dayNumberRow], monthRange.startCol, monthRange.endCol, currentDay);
    console.log(`[Personnel] Today col for day ${currentDay}: ${todayCol}`);

    // Log rows — show cols 0-2 (fixed group/name area) + name col + today
    const debugDayStart = todayCol >= 0 ? todayCol : monthRange.startCol;
    for (let r = monthRange.dataStartRow - 1; r < Math.min(monthRange.dataStartRow + 30, data.length); r++) {
      const cols: string[] = [];
      // Show first few columns (fixed group area)
      for (let c = 0; c <= Math.min(3, data[r].length - 1); c++) {
        cols.push(`[${c}]="${String(data[r][c] || '').trim()}"`);
      }
      // Show cols 93-99 to find the actual group/name columns for this month
      for (let c = 93; c <= 99; c++) {
        cols.push(`[${c}]="${String(data[r][c] || '').trim()}"`);
      }
      for (let c = debugDayStart; c <= Math.min(debugDayStart + 2, monthRange.endCol); c++) {
        cols.push(`day[${c}]="${String(data[r][c] || '').trim()}"`);
      }
      console.log(`[Personnel] Row ${r}: ${cols.join(' ')}`);
    }

    // Build 7-day range
    const scheduleDays: { col: number; date: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const targetDate = new Date(now);
      targetDate.setDate(currentDay + d);
      const targetDay = targetDate.getDate();
      const targetMonth = targetDate.getMonth();

      let range = monthRange;
      if (targetMonth !== currentMonth) {
        const nextRange = this.findMonthColumns(data, targetMonth);
        if (!nextRange) break;
        range = nextRange;
      }

      const col = this.findDayColumn(data[range.dayNumberRow], range.startCol, range.endCol, targetDay);
      if (col >= 0) {
        scheduleDays.push({ col, date: targetDate.toISOString().split('T')[0] });
      }
    }

    // Parse personnel — each person occupies 2 rows (shift row + overflow row)
    // Groups and names are in FIXED columns 0 and 1 (frozen pane), not in the month-relative columns
    const FIXED_GROUP_COL = 0;
    const FIXED_NAME_COL = 1;
    const entries: PersonnelEntry[] = [];
    let currentGroup = '';

    for (let r = monthRange.dataStartRow; r < data.length; r++) {
      // Check for group label in fixed group column
      const groupCell = String(data[r][FIXED_GROUP_COL] || '').trim();
      if (groupCell && /^[A-D]$|^Relief$/i.test(groupCell)) {
        currentGroup = groupCell.length === 1 ? groupCell.toUpperCase() : groupCell;
      }

      // Check for name in fixed name column
      const nameCell = String(data[r][FIXED_NAME_COL] || '').trim();
      if (!nameCell) continue;

      // Skip if this looks like a header/label row (day-of-week names, month names, etc.)
      if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|January|February|March|April|May|June|July|August|September|October|November|December|Outage)/i.test(nameCell)) {
        continue;
      }
      // Skip pure numbers (day numbers that might appear in name column)
      if (/^\d+$/.test(nameCell)) continue;

      // This is a person row — read shifts from this row
      // Also check the row below for override shifts (P, U on second line)
      const todayShift = this.getBestShift(data, r, todayCol);

      const schedule = scheduleDays.map(sd => ({
        date: sd.date,
        shift: this.getBestShift(data, r, sd.col),
      }));

      entries.push({ name: nameCell, group: currentGroup, todayShift, schedule });
      console.log(`[Personnel] Person: "${nameCell}" group=${currentGroup} today=${todayShift} schedule=[${schedule.map(s => s.shift || '-').join(',')}] (row ${r})`);

      // Skip the second row of this person's pair
      r++;
    }

    return entries;
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
    dayNumberRow: number; dataStartRow: number; _debugRow?: number; _debugCol?: number;
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

          console.log(`[Personnel] findMonthColumns("${monthName}"): found at row=${r} col=${c}, firstDayCol=${firstDayCol}, lastDayCol=${lastDayCol}, nameCol=${nameCol}, groupCol=${groupCol}`);

          return {
            startCol: firstDayCol,
            endCol: lastDayCol,
            nameCol,
            groupCol,
            dayNumberRow,
            dataStartRow: dayNumberRow + 1,
            _debugRow: r,
            _debugCol: c,
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
    return rows
      .filter(row => row['Name'] || row['name'] || row['First Name'] || row['Last Name'])
      .map(row => ({
        name: row['Name'] || `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
        title: row['Title'] || row['Position'] || '',
        phone: row['Phone'] || row['Work Phone'] || '',
        cell: row['Cell'] || row['Cell Phone'] || row['Mobile'] || '',
        email: row['Email'] || row['E-mail'] || '',
      }))
      .filter(c => c.name);
  }
}
