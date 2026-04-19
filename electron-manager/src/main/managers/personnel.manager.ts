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
const CONTACTS_PATH = '/sites/JG/External/10 - Administration/PERSONNEL/EMERGENCY CONTACT LIST - EDITED 11_2024.xlsx';

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

    // Parse the Rotation sheet to get month-specific group assignments
    const rotationMap = this.parseRotation(workbook);

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

    // Build schedule days — rest of the year
    const scheduleDays: { col: number; date: string }[] = [];
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const totalDays = Math.ceil((endOfYear.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const monthRangeCache = new Map<number, ReturnType<typeof this.findMonthColumns>>();
    monthRangeCache.set(currentMonth, monthRange);

    for (let d = 0; d < totalDays; d++) {
      const targetDate = new Date(now);
      targetDate.setDate(currentDay + d);
      const targetDay = targetDate.getDate();
      const targetMonth = targetDate.getMonth();

      let range = monthRange;
      if (targetMonth !== currentMonth) {
        if (!monthRangeCache.has(targetMonth)) {
          monthRangeCache.set(targetMonth, this.findMonthColumns(data, targetMonth));
        }
        const cached = monthRangeCache.get(targetMonth);
        if (!cached) break;
        range = cached;
      }

      const col = this.findDayColumn(data[range.dayNumberRow], range.startCol, range.endCol, targetDay);
      if (col >= 0) {
        scheduleDays.push({ col, date: targetDate.toISOString().split('T')[0] });
      }
    }

    // Parse personnel — each person occupies 2 rows (shift row + overflow row)
    // Use MONTH-SPECIFIC group+name columns, not the fixed cols 0/1 which have January's layout
    const NAME_COL = monthRange.nameCol;
    const GROUP_COL = monthRange.groupCol;
    const entries: PersonnelEntry[] = [];
    let currentGroup = '';

    for (let r = monthRange.dataStartRow; r < data.length; r++) {
      // Track group from month-specific group column
      const groupCell = String(data[r][GROUP_COL] || '').trim();
      if (groupCell && /^[A-D]$|^Relief$/i.test(groupCell)) {
        currentGroup = groupCell.length === 1 ? groupCell.toUpperCase() : groupCell;
      }

      // Check for name in month-specific name column
      const nameCell = String(data[r][NAME_COL] || '').trim();
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

      const group = currentGroup;
      entries.push({ name: nameCell, group, todayShift, schedule });
      console.log(`[Personnel] Person: "${nameCell}" group=${group} today=${todayShift} schedule=[${schedule.map(s => s.shift || '-').join(',')}] (row ${r})`);

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

  // ── Rotation Parsing ─────────────────────────────────────────────────────

  /**
   * Parse the "Rotation" sheet to determine which group each person belongs to
   * for the current month. Returns a map of name -> group.
   */
  private parseRotation(workbook: XLSX.WorkBook): Map<string, string> {
    const map = new Map<string, string>();
    const rotSheet = workbook.Sheets['Rotation'];
    if (!rotSheet) {
      console.log('[Personnel] No Rotation sheet found — using fallback groups');
      return map;
    }

    const rotData: any[][] = XLSX.utils.sheet_to_json(rotSheet, { header: 1, defval: '' });
    console.log(`[Personnel] Rotation sheet: ${rotData.length} rows, ${rotData[0]?.length || 0} cols`);

    // Log first 20 rows to understand structure
    for (let r = 0; r < Math.min(rotData.length, 20); r++) {
      const cells = [];
      for (let c = 0; c < Math.min(rotData[r].length, 15); c++) {
        const v = String(rotData[r][c] || '').trim();
        if (v) cells.push(`[${c}]="${v}"`);
      }
      if (cells.length > 0) console.log(`[Personnel] Rot row ${r}: ${cells.join(' ')}`);
    }

    // Try to find current month column and map names to groups
    // Common structures:
    //   Row 0: headers (Month, Name, Group) or (Name, Jan, Feb, Mar, ...)
    //   Subsequent rows: data
    const currentMonth = new Date().getMonth();
    const monthName = MONTH_NAMES[currentMonth];

    // Strategy 1: Month names as column headers (Name, Jan, Feb, ..., Dec)
    const headerRow = rotData[0] || [];
    let monthCol = -1;
    let nameCol = -1;

    for (let c = 0; c < headerRow.length; c++) {
      const h = String(headerRow[c] || '').trim().toLowerCase();
      if (h === monthName.toLowerCase() || h === monthName.substring(0, 3).toLowerCase()) {
        monthCol = c;
      }
      if (h === 'name' || h === 'person' || h === 'employee') {
        nameCol = c;
      }
    }

    if (monthCol >= 0) {
      // Found month as column header — each row has name + group per month
      if (nameCol < 0) nameCol = 0; // assume first col is name
      for (let r = 1; r < rotData.length; r++) {
        const name = String(rotData[r][nameCol] || '').trim();
        const group = String(rotData[r][monthCol] || '').trim();
        if (name && group) {
          map.set(name, group);
        }
      }
      console.log(`[Personnel] Rotation: found ${map.size} name->group mappings (month col ${monthCol})`);
      return map;
    }

    // Strategy 2: Months as rows, groups as values
    // Look for the month name in any cell and read the adjacent data
    for (let r = 0; r < rotData.length; r++) {
      for (let c = 0; c < rotData[r].length; c++) {
        const cell = String(rotData[r][c] || '').trim();
        if (cell.toLowerCase() === monthName.toLowerCase()) {
          // Found month — try to read group assignments from this row or section
          console.log(`[Personnel] Rotation: found "${monthName}" at row ${r} col ${c}`);
          // Read subsequent cells as group:name pairs or similar
          // This needs more structure analysis
          break;
        }
      }
    }

    console.log(`[Personnel] Rotation: could not parse — using fallback groups`);
    return map;
  }

  // ── Contacts Parsing ────────────────────────────────────────────────────

  private parseContacts(buffer: Buffer): PersonnelContact[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return [];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    console.log(`[Personnel] Contacts: ${rows.length} rows, keys: ${rows[0] ? Object.keys(rows[0]).map(k => JSON.stringify(k)).join(', ') : 'none'}`);

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
