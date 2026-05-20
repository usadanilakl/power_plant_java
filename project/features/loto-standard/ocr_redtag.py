"""
OCR pipeline for Red Tag standard table images.

Reads the per-standard PNG screenshots extracted from LOTO Standards.pdf,
runs RapidOCR, reconstructs the 6-column table, and emits a draft seed
JSON. Column assignment is by x-center proportion of the image width;
multiple text boxes in the description column are concatenated.

Columns: Tag# | Attachment | Description | PNID | Isolated Pos | Normal Pos
"""
import json
import os
import sys
from rapidocr_onnxruntime import RapidOCR

SRC = os.path.join(os.path.dirname(__file__), "rt-images")
ENGINE = RapidOCR()

# x-center proportion boundaries for the 6 columns (calibrated from page 1).
COL_BOUNDS = [0.07, 0.24, 0.53, 0.73, 0.87]  # 5 cuts -> 6 columns

HEADER_TOKENS = {"tag", "attachment", "isolation", "device", "description",
                 "pnid", "isolated", "normal", "position"}


def column_of(xc_frac):
    for i, b in enumerate(COL_BOUNDS):
        if xc_frac < b:
            return i
    return 5


def ocr_image(path):
    """Return list of (y_center, x_center_frac, text) for an image."""
    result, _ = ENGINE(path)
    if not result:
        return [], 1
    # image width: max x across all boxes (good enough proxy)
    width = max(max(p[0] for p in box) for box, _, _ in result)
    items = []
    for box, text, score in result:
        xs = [p[0] for p in box]
        ys = [p[1] for p in box]
        items.append((sum(ys) / 4.0, (sum(xs) / 4.0) / width, text.strip()))
    return items, width


def group_rows(items, tol=12):
    """Cluster OCR items into rows by y proximity."""
    items = sorted(items, key=lambda t: t[0])
    rows = []
    for y, xf, text in items:
        if rows and abs(rows[-1][0] - y) <= tol:
            rows[-1][1].append((xf, text))
        else:
            rows.append([y, [(xf, text)]])
    return rows


def is_header(cells):
    joined = " ".join(t for _, t in cells).lower()
    hits = sum(1 for tok in HEADER_TOKENS if tok in joined)
    return hits >= 2


def parse_table(image_files):
    """Parse one standard (possibly several stacked images) into rows."""
    rows_out = []
    for fn in image_files:
        path = os.path.join(SRC, fn)
        if not os.path.exists(path):
            continue
        items, _ = ocr_image(path)
        for _y, cells in group_rows(items):
            if is_header(cells):
                continue
            cols = {0: [], 1: [], 2: [], 3: [], 4: [], 5: []}
            for xf, text in sorted(cells, key=lambda c: c[0]):
                cols[column_of(xf)].append(text)
            desc = " ".join(cols[2]).strip()
            pnid = " ".join(cols[3]).strip()
            isolated = " ".join(cols[4]).strip()
            normal = " ".join(cols[5]).strip()
            # Skip empty / non-data rows (no description and no pnid).
            if not desc and not pnid:
                continue
            rows_out.append({
                "tagType": "Danger",
                "description": desc,
                "pnid": pnid,
                "isolatedPosition": isolated,
                "normalPosition": normal,
            })
    # number the rows
    for i, r in enumerate(rows_out, start=1):
        r2 = {"rowNumber": i}
        r2.update(r)
        rows_out[i - 1] = r2
    return rows_out


def unit_of(name):
    n = name.lower()
    if n.startswith("u2") or "unit 2" in n:
        return "U2"
    if n.startswith("u1") or "unit 1" in n:
        return "U1"
    return "BOP"


def main():
    with open(os.path.join(SRC, "mapping.json")) as f:
        mapping = json.load(f)
    # First 4 already hand-transcribed in seed.json — skip them here.
    done = {"u2-generator-ccw", "unit-2-generator", "unit-2-gsu", "unit-2-seal-oil"}
    out = []
    for m in mapping:
        if m["slug"] in done:
            continue
        rows = parse_table(m["images"])
        out.append({
            "name": m["name"].strip(),
            "unit": unit_of(m["name"]),
            "image": m["images"][0] if m["images"] else None,
            "rows": rows,
        })
        print(f"  {m['name']:46s} {len(rows):3d} rows", file=sys.stderr)
    with open(os.path.join(os.path.dirname(__file__), "ocr-draft.json"), "w") as f:
        json.dump(out, f, indent=1)
    print(f"\nwrote ocr-draft.json — {len(out)} standards", file=sys.stderr)


if __name__ == "__main__":
    main()
