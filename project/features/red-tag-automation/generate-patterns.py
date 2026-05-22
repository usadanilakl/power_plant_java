#!/usr/bin/env python3
"""
Generate SikuliX pattern images for the Red Tag LOTO automation.

Each pattern is a small, DISTINCTIVE crop (a label / button / title / status text)
taken from the full-window screenshots in ./screenshots/. The automation locates
the crop on the live screen, then clicks at a pixel offset to reach the field
beside it (offsets live in the Java flow classes).

Re-run after recapturing any screenshot, or tweak a CROP box if a pattern
matches poorly. Output goes straight into the bundled resources folder.

Usage:  python generate-patterns.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")
# src/main/resources/automation/redtag/patterns  (relative to repo root)
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(REPO_ROOT, "src", "main", "resources", "automation", "redtag", "patterns")
CONTACT_SHEET = os.path.join(HERE, ".crop_tmp", "contact-sheet.png")

# (RedTagPattern enum name, source screenshot, relative output path, crop box x1,y1,x2,y2)
PATTERNS = [
    # ---- application shell -------------------------------------------------
    ("LOTO_PROCEDURES_TAB", "logged in home page with ungrouped list.png",
     "shell/loto-procedures-tab.png", (165, 88, 292, 110)),
    ("NEW_ISOLATION_BUTTON", "logged in home page with ungrouped list.png",
     "shell/new-isolation-button.png", (16, 52, 158, 88)),
    ("LOGIN_BUTTON", "home page (not logged in).png",
     "shell/login-button.png", (14, 258, 150, 296)),
    ("STATUS_NO_ONE_LOGGED_IN", "home page (not logged in).png",
     "shell/status-no-one-logged-in.png", (3, 1372, 120, 1392)),

    # ---- login dialog -----------------------------------------------------
    ("LOGIN_DIALOG_TITLE", "login dialog.png",
     "login/login-dialog-title.png", (1198, 610, 1362, 644)),
    ("LOGIN_USERNAME_LABEL", "login dialog.png",
     "login/username-label.png", (1155, 674, 1252, 696)),
    ("LOGIN_PASSWORD_LABEL", "login dialog.png",
     "login/password-label.png", (1162, 702, 1256, 724)),
    ("LOGIN_SUBMIT_BUTTON", "login dialog.png",
     "login/login-submit-button.png", (1206, 731, 1300, 757)),
    ("LOGIN_SIGNED_ON_OK", "correct login confirmation dialog.png",
     "login/signed-on-ok-button.png", (1249, 722, 1323, 752)),
    ("LOGIN_FAILED_DIALOG", "wrong password dialog.png",
     "login/login-failed-dialog.png", (1188, 658, 1372, 702)),
    ("LOGIN_FAILED_YES", "wrong password dialog.png",
     "login/login-failed-yes-button.png", (1208, 718, 1282, 748)),

    # ---- new LOTO selection ----------------------------------------------
    ("NEW_ISO_LOTO_OPTION", "button to initiate new loto.png",
     "loto/new-iso-loto-option.png", (154, 60, 264, 94)),
    ("ISSUE_LOTO_NO_STANDARD_BUTTON", "standards list.png",
     "loto/issue-loto-no-standard-button.png", (2404, 55, 2530, 111)),

    # ---- LOTO builder page -----------------------------------------------
    ("LOTO_BUILDER_TITLE", "ltot building page.png",
     "loto/builder-title.png", (8, 2, 124, 21)),
    ("LOTO_BUILDER_CONTINUE_BUTTON", "ltot building page.png",
     "loto/builder-continue-button.png", (20, 60, 130, 120)),
    ("LOTO_BUILDER_LOTO_TYPE_LABEL", "ltot building page.png",
     "loto/builder-loto-type-label.png", (224, 84, 304, 103)),
    ("LOTO_BUILDER_JOB_DESCRIPTION_LABEL", "ltot building page.png",
     "loto/builder-job-description-label.png", (213, 106, 304, 125)),
    ("LOTO_BUILDER_EQUIPMENT_DESCRIPTION_LABEL", "ltot building page.png",
     "loto/builder-equipment-description-label.png", (166, 166, 304, 185)),
    ("LOTO_BUILDER_ADD_DEVICE_MANUALLY_BUTTON", "ltot building page.png",
     "loto/builder-add-device-manually-button.png", (25, 429, 128, 460)),
    ("LOTO_NUMBER_COLUMN_HEADER", "logged in home page with ungrouped list.png",
     "loto/loto-number-column-header.png", (166, 147, 272, 169)),

    # ---- 'Add Device' dialog ---------------------------------------------
    ("ADD_DEVICE_TITLE", "add devie manually dialog.png",
     "add-device/title.png", (986, 430, 1062, 450)),
    ("ADD_DEVICE_DESCRIPTION_LABEL", "add devie manually dialog.png",
     "add-device/description-label.png", (1006, 500, 1170, 519)),
    ("ADD_DEVICE_LARGE_DESCRIPTION_LABEL", "add devie manually dialog.png",
     "add-device/large-description-label.png", (1006, 529, 1200, 548)),
    ("ADD_DEVICE_PNID_LABEL", "add devie manually dialog.png",
     "add-device/pnid-label.png", (1031, 607, 1170, 626)),
    ("ADD_DEVICE_LOCATION_LABEL", "add devie manually dialog.png",
     "add-device/location-label.png", (1024, 634, 1170, 653)),
    ("ADD_DEVICE_ISOLATED_POSITION_LABEL", "add devie manually dialog.png",
     "add-device/isolated-position-label.png", (1054, 706, 1170, 725)),
    ("ADD_DEVICE_NORMAL_POSITION_LABEL", "add devie manually dialog.png",
     "add-device/normal-position-label.png", (1306, 706, 1394, 725)),
    ("ADD_DEVICE_OK_BUTTON", "add devie manually dialog.png",
     "add-device/ok-button.png", (1368, 918, 1454, 950)),
]


def main():
    sources = {}
    crops = []
    for name, src, rel, box in PATTERNS:
        if src not in sources:
            sources[src] = Image.open(os.path.join(SHOTS, src)).convert("RGB")
        crop = sources[src].crop(box)
        target = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        crop.save(target)
        crops.append((name, crop))
        print(f"  {name:42s} -> {rel}  {crop.size}")

    build_contact_sheet(crops)
    print(f"\nGenerated {len(crops)} pattern image(s) into {OUT}")
    print(f"Contact sheet: {CONTACT_SHEET}")


def build_contact_sheet(crops):
    """Stacks every crop with its name for a single-glance visual review."""
    pad, label_w, row_h = 8, 360, 0
    rows = [(n, c) for n, c in crops]
    row_h = max(c.height for _, c in rows) + pad
    width = label_w + max(c.width for _, c in rows) + pad * 2
    height = row_h * len(rows) + pad
    sheet = Image.new("RGB", (width, height), (240, 240, 240))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(sheet)
    y = pad
    for name, crop in rows:
        draw.text((pad, y + 4), name, fill=(0, 0, 0))
        sheet.paste(crop, (label_w, y))
        draw.rectangle([label_w - 1, y - 1, label_w + crop.width, y + crop.height],
                       outline=(180, 0, 0))
        y += row_h
    os.makedirs(os.path.dirname(CONTACT_SHEET), exist_ok=True)
    sheet.save(CONTACT_SHEET)


if __name__ == "__main__":
    main()
