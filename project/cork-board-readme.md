# Cork-Board Rules

This folder feeds the Cork-Board card and Cork-Board page in DK Power Manager.

## Supported Files

Add only these file types:

- PDF: `.pdf`
- Images: `.jpg`, `.jpeg`

Other files can stay in the folder, but the app will not display them.

## Display Order

Use a number at the start of the filename to control the order.

Examples:

```text
001 - Daily Operating Notes.pdf
002 - Heat Stress Reminder.jpg
003 - Contractor Parking Map.pdf
```

Lower numbers display first.

You can also use these forms:

```text
order-10 - Safety Bulletin.pdf
index-20 - Shift Meal Signup.jpg
sort-30 - Training Reminder.pdf
```

## Important Items

Add `IMPORTANT` or `URGENT` anywhere in the filename to move the item to the top and make it stand out.

Examples:

```text
IMPORTANT - 001 - Safety Alert.pdf
URGENT - 002 - Weather Watch.jpg
```

Important items show an orange badge and attention border in the app.

## Pinned Items

Add `PINNED` or `PIN` anywhere in the filename to keep the item near the top.

Examples:

```text
PINNED - 001 - Shift Schedule.pdf
PIN - 002 - Control Room Contacts.jpg
```

Pinned items show a blue badge in the app.

## Expiration Dates

Add `EXPIRES`, `EXPIRE`, or `EXP` with a date to hide an item automatically after that date.

Use this date format:

```text
YYYY-MM-DD
```

Examples:

```text
EXPIRES-2026-08-01 - Heat Stress Reminder.pdf
EXP 2026-08-01 - Contractor Parking Map.jpg
IMPORTANT - 001 - EXPIRES-2026-08-01 - Safety Alert.pdf
```

Items stay visible through the expiration date. Starting the next day, the app stops showing them.

## Combining Rules

You can combine priority words, order numbers, and expiration dates.

Examples:

```text
IMPORTANT - 001 - EXPIRES-2026-08-01 - Fire Watch Notice.pdf
PINNED - 002 - EXPIRES-2026-08-15 - Outage Map.jpg
003 - General Reminder.pdf
```

The app sorts items like this:

1. Important or pinned items first.
2. Then by the order number, lowest first.
3. Then by newest modified date.
4. Then by title.

## Clean Display Names

The app hides control words from the displayed title.

For example:

```text
IMPORTANT - 001 - Fire Watch Notice.pdf
EXPIRES-2026-08-01 - Fire Watch Notice.pdf
```

Displays as:

```text
Fire Watch Notice
```

## Good Practices

- Keep filenames short and clear.
- Use three-digit order numbers like `001`, `002`, `003`.
- Use `IMPORTANT` only for items people should notice right away.
- Add `EXPIRES-YYYY-MM-DD` to temporary notices.
- Remove old files when they are no longer needed.
- Prefer PDF for notices and JPG for simple visual boards or screenshots.

## Action Items

Use Action Items when people need to respond, not just view a notice.

Action Items are created inside DK Power Manager on the Cork-Board page. They are stored in two SharePoint lists:

- `Cork Board Actions`
- `Cork Board Responses`

The app creates these lists automatically if SharePoint permissions allow it.

## Action Item Types

Use these types:

- Acknowledge: people enter their name and confirm they saw the item.
- Poll: people choose one answer from a list of options.
- Signup: people choose a slot or sign up for a task.

## Action Item Rules

- Keep the title short and clear.
- Add details only when the title is not enough.
- Add an expiration date for temporary prompts.
- For polls, add at least two options.
- For signup sheets, put one slot or task per line.
- Each person has one active response per action item. If they submit again, their previous response is updated.
- Action items disappear from the app after the expiration date.

## Action Item Examples

Poll options:

```text
Day shift
Night shift
Either shift
```

Signup options:

```text
Monday lunch pickup
Tuesday lunch pickup
Wednesday lunch pickup
```

Acknowledge examples:

```text
Read and acknowledge the outage parking notice
Read and acknowledge the updated radio call list
```

## Quick Templates

```text
001 - Title.pdf
IMPORTANT - 001 - Title.pdf
PINNED - 001 - Title.jpg
EXPIRES-2026-08-01 - Title.pdf
IMPORTANT - 001 - EXPIRES-2026-08-01 - Title.pdf
order-10 - Title.pdf
```
