import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/**
 * Validator to check if the date is not in the past.
 * Time part is ignored.
 */
export function futureOrPresentDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate empty values, let 'required' validator handle it
    }

    let selectedDate: Date;

    if (control.value instanceof Date) {
      selectedDate = control.value;
    } else if (typeof control.value === 'string') {
      // The input value is a string 'YYYY-MM-DD'.
      // new Date(control.value) can have timezone issues.
      // A reliable way is to construct the date from parts in local time.
      const parts = control.value.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      selectedDate = new Date(year, month, day);
    } else {
      // If the value is neither a Date object nor a string, it's an invalid type for this validator.
      return { invalidDateType: { value: control.value } };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to compare only the date part

    if (selectedDate < today) {
      return { pastDate: { value: control.value } };
    }

    return null;
  };
}
/**
 * Rejects a time already past, but only when the chosen date is today.
 *
 * The acceptance criteria say a work request may not be scheduled in the past. The date validator
 * above enforces that at day granularity, so "today at 06:00" submitted at 15:00 sailed through -
 * the request looked live, and then the expiry sweep closed it that same night.
 *
 * Reads the date from a sibling control, so it re-runs whenever the date changes.
 */
export function futureTimeIfTodayValidator(dateControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const time = control.value;
    if (!time || typeof time !== 'string') return null;

    const dateControl = control.parent?.get(dateControlName);
    const dateValue = dateControl?.value;
    if (!dateValue) return null;

    const dateStr = dateValue instanceof Date
      ? `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`
      : String(dateValue).slice(0, 10);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (dateStr !== todayStr) return null;

    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const chosen = new Date();
    chosen.setHours(hours, minutes, 0, 0);
    return chosen < now ? { pastTime: { value: time } } : null;
  };
}

/**
 * Requires at least one box ticked in a checkbox-group.
 *
 * `Validators.required` is useless on these: the control's value is an object, and `{}` — every box
 * unticked — is truthy, so required passes and the form submits with nothing selected. This checks
 * the values instead of the container.
 *
 * Lives here beside the other cross-cutting validators rather than in a hazard-specific file,
 * because it applies to any object-mode checkbox-group.
 */
export function atLeastOneCheckedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'object') return { atLeastOneRequired: true };
    const ticked = Object.values(value).some(v => v === true);
    return ticked ? null : { atLeastOneRequired: true };
  };
}
