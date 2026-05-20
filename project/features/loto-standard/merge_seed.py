"""
Build the final Red Tag standards seed: 4 hand-transcribed standards
(already in seed.json) + 7 hand-transcribed small tables + 35 OCR-drafted
standards. Also copies/stitches every standard's source image into
src/main/resources/red-tag-standards/images/.
"""
import json
import os
import fitz

HERE = os.path.dirname(__file__)
RT_IMAGES = os.path.join(HERE, "rt-images")
RES = os.path.join(HERE, "..", "..", "..", "src", "main", "resources", "red-tag-standards")
RES_IMAGES = os.path.join(RES, "images")
os.makedirs(RES_IMAGES, exist_ok=True)

OCR_NOTE = "OCR draft — verify rows against the source image."


def rows(*tuples):
    """Each tuple: (description, pnid, isolatedPosition, normalPosition)."""
    return [
        {"rowNumber": i + 1, "tagType": "Danger", "description": d,
         "pnid": p, "isolatedPosition": iso, "normalPosition": norm}
        for i, (d, p, iso, norm) in enumerate(tuples)
    ]


# ── 7 hand-transcribed small standards (OCR returned nothing for these) ──────
HAND = {
    "u2-fuel-gas-performance-heater-flow-meter": rows(
        ("U2 fgph flow meter upstream of bypass isolation", "02-V-FGS003-JG", "CLOSED", "OPEN"),
        ("U2 GAS FLOW METER BYPASS", "02-VFGS122", "CLOSED", "CLOSED"),
        ("U2 GAS FLOW METER INLET", "02-VFGS113", "CLOSED", "OPEN"),
        ("UNIT 2 GAS FLOW METER VENT (SAMPLE)", "02-VFGS116", "OPEN", "CLOSED"),
    ),
    "u2-co2-fire-protection": rows(
        ("CO2 ACTUATION LINE ISOLATION VALVE", "02SGJ02AA001", "CLOSED", "OPEN"),
        ("CO2 TO GAS TURBINE ENCLOSURE ISOLATION VALVE", "02SGJ02AA103", "CLOSED", "OPEN"),
        ("SLIP RING HOUSING ISOLATION VALVE", "02SGJ02AA202", "CLOSED", "OPEN"),
    ),
    "unit-2-ups-system-annual-pm": rows(
        ("Unit 2 UPS Bypass Switch Q500", "02-LVF-UPS-01, SW Q500", "Bypass", "AUTO"),
        ("02-LVF-UPS-01", "02-LVF-UPS-01, BR #4", "OPEN", "CLOSED"),
        ("02-LVF-UPS-01, Unit 2 UPS System, Fuse F6", "02-LVF-UPS-01, F6", "OFF", "ON"),
    ),
    "unit-2-ignitor-2026": rows(
        ("GT IGNITION EXCITER", "02MBM01GU001", "OPEN", "CLOSED"),
        ("INA to GT ignitors", "02QFF11AA112", "CLOSED", "OPEN"),
    ),
    "u1-fuel-gas-performance-heater-flow-meter": rows(
        ("UNIT 1 GAS FLOW METER INLET", "01-VFGS113", "CLOSED", "OPEN"),
        ("FLOW METER BYPASS", "01-VFGS122", "CLOSED", "CLOSED"),
        ("UNIT 1 GAS TURBINE ENCLOSURE FUEL VENT", "01-VFGS177", "OPEN", "CLOSED"),
        ("UNIT 1 GAS TURBINE ENCLOSURE FUEL VENT", "01-VFGS178", "OPEN", "CLOSED"),
    ),
    "bop-air-compressor-alpha": rows(
        ("AIR COMPRESSOR A", "01-INA-PNL-01A", "OPEN", "CLOSED"),
        ("AIR COMPRESSOR 01A ISOLATION", "00-VINA636", "CLOSED", "OPEN"),
        ("INSTRUMENT AIR DRAIN", "00-VINA670", "OPEN", "CLOSED"),
    ),
    "air-compressor-bravo": rows(
        ("AIR COMPRESSOR B", "00-INA-CMP-01B", "OPEN", "CLOSED"),
        ("AIR COMPRESSOR 01B ISOLATION", "00-VINA648", "CLOSED", "OPEN"),
        ("COMPRESSED AIR DRAIN", "00-VINA615", "CLOSED", "OPEN"),
    ),
}

HAND_FIRST4 = {"u2-generator-ccw", "unit-2-generator", "unit-2-gsu", "unit-2-seal-oil"}


def stitch_image(image_files, out_path):
    """Copy a single image, or stitch several vertically, to out_path."""
    pages = [fitz.Pixmap(os.path.join(RT_IMAGES, f)) for f in image_files
             if os.path.exists(os.path.join(RT_IMAGES, f))]
    if not pages:
        return False
    w = max(p.width for p in pages)
    h = sum(p.height for p in pages)
    doc = fitz.open()
    page = doc.new_page(width=w, height=h)
    y = 0
    for p in pages:
        page.insert_image(fitz.Rect(0, y, p.width, y + p.height), pixmap=p)
        y += p.height
    page.get_pixmap().save(out_path)
    return True


def main():
    mapping = json.load(open(os.path.join(RT_IMAGES, "mapping.json")))
    by_slug = {m["slug"]: m for m in mapping}
    existing = {s["name"]: s for s in json.load(open(os.path.join(RES, "seed.json")))}
    ocr = {s["name"]: s for s in json.load(open(os.path.join(HERE, "ocr-draft.json")))}

    final = []
    for m in mapping:
        slug, name = m["slug"], m["name"].strip()
        image_name = slug + ".png"
        stitch_image(m["images"], os.path.join(RES_IMAGES, image_name))

        if slug in HAND_FIRST4:
            # Keep the verified hand transcription already in seed.json.
            entry = existing[name]
            entry["image"] = image_name
            final.append(entry)
        elif slug in HAND:
            final.append({"name": name, "unit": unit_of(name), "image": image_name,
                          "rows": HAND[slug], "importNotes": None})
        else:
            o = ocr.get(name, {"rows": []})
            final.append({"name": name, "unit": unit_of(name), "image": image_name,
                          "rows": o["rows"], "importNotes": OCR_NOTE})

    json.dump(final, open(os.path.join(RES, "seed.json"), "w"), indent=1)
    total_rows = sum(len(s["rows"]) for s in final)
    print(f"seed.json: {len(final)} standards, {total_rows} total rows")
    print(f"images: {len(os.listdir(RES_IMAGES))} files in resources")


def unit_of(name):
    n = name.lower()
    if n.startswith("u2") or "unit 2" in n:
        return "U2"
    if n.startswith("u1") or "unit 1" in n:
        return "U1"
    return "BOP"


if __name__ == "__main__":
    main()
