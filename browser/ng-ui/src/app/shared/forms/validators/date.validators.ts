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