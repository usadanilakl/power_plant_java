# EtaPro Bundled Defaults

This directory holds the files that get packaged with the Electron installer and
provisioned into the desktop user's managed working directory on first launch.

## What gets shipped

| File | Overwrite policy | Notes |
|------|------------------|-------|
| `etapro-scrape.ps1` | **Always overwritten on startup** | Treated as code — users should not edit. Any fix ships with the next installer. |
| `template-live.xlsx` | **Copy only if missing** | Contains plant-specific GetEPCurrent formulas with historian IP. Gitignored — operators must drop a working copy here before building the installer. |
| `template-history.xlsx` | **Copy only if missing** | Contains plant-specific Calculated Values array formulas. Gitignored — same rationale. |

## Why the templates are gitignored

Both templates contain **plant-specific configuration** inside the formulas:
- EtaPro historian IP address (e.g. `192.168.190.85`)
- Source/archive name parameter
- Point IDs in row 1 (for history) or column A (for live), though these get
  overwritten dynamically by the Java scraper at runtime

We don't want this leaking into the public repo, and we also want each plant's
deployment to be able to ship its own templates without merge conflicts.

## How operators prepare a build

Before running `npm run build` or `npm run dist`:

1. Obtain or create `template-live.xlsx` and `template-history.xlsx` following
   the steps in [project/features/etapro-scraper/setup-guide.md](../../project/features/etapro-scraper/setup-guide.md)
2. Drop them into this directory (`electron-manager/etapro-defaults/`)
3. Build normally

The electron-builder config includes this entire directory as `extraResources`,
so all three files end up in the packaged installer under
`resources/etapro-defaults/`.

## What happens on first launch (desktop user perspective)

When the user starts the app for the first time, `app.ts` calls
`provisionEtaProDefaults()` which:

1. Creates `<workingDir>/scripts/` and `<workingDir>/etapro/{output,signal}/`
2. Always copies `etapro-scrape.ps1` → `<workingDir>/scripts/etapro-scrape.ps1`
3. For each template, copies to `<workingDir>/etapro/template-*.xlsx` **only
   if that file doesn't already exist** — preserving any customizations the
   user made after the first install

## What happens if the templates are missing from the bundle?

- The provisioning step logs a warning and continues (Electron does not abort)
- The Java backend starts normally but `EtaProScraperEngine.init()` logs its own
  warning about missing templates
- First scrape attempt fails with a clear error message
- User must manually drop templates into `<workingDir>/etapro/` and retry

This is by design: desktop users get a usable app shell even if the build
machine didn't have the templates.
