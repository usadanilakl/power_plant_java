/**
 * Normalisation applied to permit payloads immediately before they go over the wire.
 *
 * `WorkAreaSelectComponent` is a ControlValueAccessor that writes a BARE NUMERIC id into its
 * form control, but `BasePermitDto.workArea` is a `WorkAreaDto`, and every DTO inherits
 * `@JsonIdentityInfo(generator = PropertyGenerator.class, property = "id")` from `BaseDto`. A
 * scalar sitting in that slot is therefore read by Jackson as an *object-id reference* rather
 * than an object — which resolves to nothing and fails deserialization for the whole request.
 *
 * Separately, an object of the shape `{id: 0}` (what `new WorkAreaDto()` produces, since BaseDto
 * sets `id = data.id || 0`) used to pass the server's `getId() != null` guard, miss on
 * `findById(0)`, and then be assigned unconditionally — silently UNLINKING the permit's work
 * area. The mappers now guard against id 0, and this strips it before it is ever sent.
 */
export function normalizePermitPayload<T extends Record<string, any>>(dto: T): T {
  if (!dto || typeof dto !== 'object') return dto;

  const wa = (dto as any).workArea;

  if (typeof wa === 'number') {
    // Bare id from work-area-select -> the object shape Jackson expects.
    return { ...(dto as any), workArea: wa > 0 ? { id: wa } : null } as T;
  }

  if (wa && typeof wa === 'object' && !wa.id) {
    // Placeholder `new WorkAreaDto()` (id 0 / null) means "no work area", not "work area 0".
    return { ...(dto as any), workArea: null } as T;
  }

  return dto;
}

/** Convenience for the `save-all` endpoints, which take an array. */
export function normalizePermitPayloads<T extends Record<string, any>>(dtos: T[]): T[] {
  return Array.isArray(dtos) ? dtos.map(normalizePermitPayload) : dtos;
}
