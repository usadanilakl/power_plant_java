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

    // The input value is a string 'YYYY-MM-DD'.
    // new Date(control.value) can have timezone issues.
    // A reliable way is to construct the date from parts in local time.
    const parts = control.value.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    const selectedDate = new Date(year, month, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to compare only the date part

    if (selectedDate < today) {
      return { pastDate: { value: control.value } };
    }

    return null;
  };
}