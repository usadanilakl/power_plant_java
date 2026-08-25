# LOTO point QR scan → P&ID

Where a scanned label lands, and what serves it.

## The link on the label

Printed and engraved labels encode `https://jgportal.jpowerusa.com/qr/{tagNumber}`
(`EngraverService.QR_BASE_URL`, `environment.qrBaseUrl`). **That URL never changes** — every label
already in the field depends on it, so the flow is changed by moving the redirect target, never the
encoded link.

## Flow

```
phone camera → https://<hub>/qr/{tag}          public, permitAll + @RestrictedAllowed
             → 302 to <pwa>/qr/{tag}            QrTrafficController.redirectToTagView
             → PWA route qr/:tag                authGuard → /login?returnUrl=… when signed out
             → GET /api/pwa/secured/qr/tag/{tag}   ROLE_PLANT / ROLE_ADMIN
             → drawing with the point circled
```

The hop itself stays open on purpose: a phone camera follows the URL before any app is involved, so
a gate there produces a browser error, not a login screen. The gate lives on the PWA's own endpoints.

**Why the PWA and not the desktop SPA.** The old target was `/app/qr/equipment/{tag}`, the hub-hosted
Angular app, which put a hub sign-in in front of every scan — an authority used for nothing else,
while the crew is already signed into the PWA for permits and LOTO. The desktop viewer still exists
at that URL and renders more (equipment detail panels, click-through shapes); it is just no longer
where a scanned label lands.

## Resolution rules

`PwaQrService.resolveTag`:

1. **LOTO points first** — `LotoPointRepo.findAllActiveByTagNumberIgnoreCase`.
2. **Equipment only as a fallback** — and only when no LOTO point carries the tag. Most tags exist as
   both, and a LOTO point resolves its drawings *through* those same Equipment rows, so returning
   both would offer two choices that open identical drawings.
3. **Every occurrence, not the first.** A point linked to three Equipment appears on three P&IDs and
   gets three viewer tabs. (The desktop resolver picks the first equipment with a drawing; this one
   does not.) Both paths share `PwaLotoDrawingService.descriptorsFor`.

An unknown tag is a 200 with an empty match list — a legitimate, cacheable answer.

## Connectors (off-page references)

`PwaLotoDrawingService.connectorsForFile` maps `FileConnector` rows for a file into tap targets.
Rectangles are **normalised server-side to fractions of the drawn-at image size**, so the viewer
places them in percentages and a connector cannot drift when the served JPG derivative is a different
pixel size than the image the shape was drawn on. Symbol/SVG rendering is deliberately not carried
over from the desktop — on a phone a labelled tap-target is the whole point.

Tapping one loads the target drawing as a browse frame (no highlight, since nothing on it was
scanned) and pushes a back frame, so a hop is undoable without leaving the scan.

## Offline

Two caches, already in place for the walkdown flows:

- **Drawing bytes** — `LotoDrawingService`, IndexedDB, keyed by file id and shared across sources, so
  a drawing precached by a standard walkdown opens instantly from a scan.
- **Descriptors + connectors** — `QrApiService`, localStorage, network-first with a 40-entry cap.

A label scanned once therefore opens again with no signal.

## Files

| Layer | File |
| --- | --- |
| Redirect | `controller/qr/QrTrafficController.java` |
| API | `controller/pwa/PwaQrController.java` (`/api/pwa/secured/qr`) |
| Resolution | `sevice/pwa/PwaQrService.java` |
| Shapes | `sevice/pwa/PwaLotoDrawingService.java` (`descriptorsFor`, `connectorsForFile`) |
| Authz | `config/SecurityConfigSpring.java` — `/api/pwa/secured/qr/**` → PLANT/ADMIN |
| PWA page | `browser/ng-ui/src/app/features/qr/` |
| PWA viewer | `browser/ng-ui/src/app/features/loto-standard/loto-drawing-viewer.component.ts` |

Drawing **bytes** are not served by the QR controller — the viewer fetches them through
`/api/pwa/secured/loto-standards/files/{fileId}/image`, which is gated to the same roles.

## Known limits

- A contractor (signed in, no ROLE_PLANT) gets a 403, which the page renders as a sentence rather
  than a blank screen. P&IDs are plant data; that is the intended bar.
- On iOS a home-screen PWA has its own storage bucket, and the camera opens Safari — so the first
  scan on an iPhone needs one sign-in *in Safari* even when the installed app is signed in. It
  persists afterwards (72h JWT). Android/Chrome shares the profile.
