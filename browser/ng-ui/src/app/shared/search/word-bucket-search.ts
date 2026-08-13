/**
 * Word-bucket matching: the query is split on whitespace into tokens ("buckets") and each token is
 * matched as a substring against a row's searchable fields.
 *
 * - `AND` — every token must appear somewhere in the row (tokens may land in different fields), so
 *   `pt 101 turbine` matches tag "PT-101" + location "Turbine Hall".
 * - `OR` — at least one token appears somewhere in the row.
 *
 * Note this is row-wide AND. `TableComponent`'s own global search uses a stricter per-field AND
 * (all tokens must sit in ONE field); that behaviour is relied on by the other feature tables and is
 * left alone. For searching a 3000-row instrument register by tag + description + location at once,
 * row-wide AND is what people actually mean when they type two words.
 */
export type SearchLogic = 'AND' | 'OR';

export function tokenizeQuery(query: string | null | undefined): string[] {
  return (query ?? '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * @param fields the row's searchable values (already the ones worth matching — pass only meaningful
 *               columns, not every property, or ids and timestamps produce phantom hits)
 */
export function matchesTokens(fields: (string | null | undefined)[], tokens: string[], logic: SearchLogic): boolean {
  if (tokens.length === 0) return true;
  const haystack = fields.map(f => (f ?? '').toLowerCase());
  return logic === 'AND'
    ? tokens.every(token => haystack.some(value => value.includes(token)))
    : tokens.some(token => haystack.some(value => value.includes(token)));
}
