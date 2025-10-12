function validateDateTimeNotInPastInCentralTime(dateString, timeString) {
    const timeZone = 'America/Chicago';

    // Get the current date and time in the Central Time Zone
    const now = new Date();
    const nowInCentralTime = new Date(now.toLocaleString('en-US', { timeZone }));

    // Create a Date object from the user's input.
    // By combining date and time strings, we create a date that JavaScript
    // will initially interpret in the browser's local timezone.
    const selectedDateTime = new Date(`${dateString}T${timeString}`);

    // Get the user's selected date and time as if it were in the Central Time Zone.
    // We do this by taking the local time components and creating a new date string
    // that represents that same "wall clock" time in the target timezone.
    const selectedDateTimeInCentralTime = new Date(selectedDateTime.toLocaleString('en-US', { timeZone }));

    // Compare the two dates.
    return selectedDateTimeInCentralTime >= nowInCentralTime;
}

function validateForm(){
    const dateInput = document.querySelector('input[name="dateOfWork"]');
    const timeInput = document.querySelector('input[name="timeOfWork"]');
    const date = dateInput.value;
    const time = timeInput.value;

    if (!validateDateTimeNotInPastInCentralTime(date, time)) {
        alert('Date and time cannot be in the past in Central Time.');
        return false; // Indicate validation failure
    }

    return true; // Indicate validation success
}