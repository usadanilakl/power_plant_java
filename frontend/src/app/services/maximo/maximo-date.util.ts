/**
 * Conversion between Maximo's OSLC datetime format (ISO 8601 with TZ offset, e.g.
 * "2022-01-01T08:30:00-05:00") and the HTML5 <input type="datetime-local"> format
 * ("2022-01-01T08:30", local time, no TZ).
 *
 * Pure functions — no Angular deps — so they're shared by the SR page, WO page,
 * and both API-test criteria panels.
 */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Maximo ISO 8601 → "yyyy-MM-ddTHH:mm" suitable for <input type="datetime-local">. */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
       + `T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * datetime-local "yyyy-MM-ddTHH:mm" → ISO 8601 with browser's local TZ offset
 * and zero seconds, e.g. "2022-01-01T08:30:00-05:00".
 *
 * Returns "" if input is empty or unparseable.
 */
export function fromDatetimeLocal(local: string | null | undefined): string {
  if (!local) return '';
  const d = new Date(local);
  if (isNaN(d.getTime())) return '';

  const offsetMin = -d.getTimezoneOffset();          // east of UTC is positive
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const offH = pad2(Math.floor(absMin / 60));
  const offM = pad2(absMin % 60);

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
       + `T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
       + `${sign}${offH}:${offM}`;
}
