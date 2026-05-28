"""Append batch-2 Red Tag standards (Loto Standards 2.pdf) to seed.json + stage images."""
import json, os, fitz

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "rt-images2")
RES = os.path.join(HERE, "..", "..", "..", "src", "main", "resources", "red-tag-standards")
RES_IMAGES = os.path.join(RES, "images")
VERIFY = "OCR/hand-read draft — verify rows against the source image."


def rows(*tuples):
    """(description, pnid, isolatedPosition, normalPosition)."""
    return [{"rowNumber": i + 1, "tagType": "Danger", "description": d,
             "pnid": p, "isolatedPosition": iso, "normalPosition": norm}
            for i, (d, p, iso, norm) in enumerate(tuples)]


# image filename (in SRC) -> stitched/copied output name in resources
IMAGES = {
    "demin-water-pumps": ["demin-water-pumps-1.png"],
    "service-water": ["service-water-1.png"],
    "instrument-air-compressor-alpha": ["instrument-air-compressor-alpha-1.png"],
    "instrument-air-compressor-bravo": ["instrument-air-compressor-bravo-1.png"],
    "air-dryer-alpha": ["air-dryer-alpha-1.png"],
    "air-dryer-bravo": ["air-dryer-bravo-1.png"],
    "aux-boiler-inspection": ["aux-boiler-inspection-1.png", "aux-boiler-inspection-2.png"],
}

BATCH2 = [
    {"name": "Demin water pumps", "unit": "BOP", "slug": "demin-water-pumps", "note": None, "rows": rows(
        ("DEMIN WATER PUMP MTR A", "00-DWS-MPM-01A", "CLOSED", "CLOSED"),
        ("DEMIN WATER PUMP MTR B", "00-DWS-MPM-01B", "CLOSED", "CLOSED"),
        ("DEMIN WATER PUMP MTR C", "00-DWS-MPM-01C", "CLOSED", "CLOSED"),
        ("DEMIN OUTLET TANK ISOLATION", "00-VDWS605", "OPEN", "OPEN"),
        ("Demin pump A discharge outlet valve", "00-VDWS808", "OPEN", "OPEN"),
        ("Demin pump B discharge outlet valve", "00-VDWS819", "OPEN", "OPEN"),
        ("Demin pump C discharge outlet valve", "00-VDWS830", "OPEN", "OPEN"),
        ("DEMIN PUMP A SUCTION ISO", "00-VDWS800", "", "OPEN"),
        ("Demin Pump B Suction ISO", "00-VDWS-811", "CLOSED", "OPEN"),
        ("Demin Pump C Suction ISO", "00-DWS822", "CLOSED", "OPEN"),
    )},
    {"name": "Service water", "unit": "BOP", "slug": "service-water", "note": None, "rows": rows(
        ("SERVICE WATER PUMP MOTOR A", "00-SWS-MPM-01A", "OPEN", "CLOSED"),
        ("SERVICE WATER PUMP MTR B", "00-SWS-MPM-01B", "OPEN", "CLOSED"),
        ("SERVICE WATER PUMP \"A\" SUCTION ISOLATION", "00-VSWS800", "CLOSED", "OPEN"),
        ("SERVICE WATER PUMP \"B\" SUCTION ISOLATION", "00-VSWS811", "CLOSED", "OPEN"),
        ("SWS TANK ISOLATION - PUMP RECIRC", "00-VSWS605", "CLOSED", "OPEN"),
        ("SWS Recirc drain", "00-VSWS686", "OPEN", "CLOSED"),
        ("Sodium Hypochlorite Discharge Isolation", "00-VDWT650F", "CLOSED", "OPEN"),
    )},
    {"name": "Instrument Air compressor Alpha", "unit": "BOP", "slug": "instrument-air-compressor-alpha", "note": None, "rows": rows(
        ("AIR COMPRESSOR A", "01-INA-PNL-01A", "OPEN", "CLOSED"),
        ("AIR COMPRESSOR 01A ISOLATION", "00-VINA636", "CLOSED", "OPEN"),
        ("INSTRUMENT AIR DRAIN", "00-VINA670", "OPEN", "CLOSED"),
    )},
    {"name": "Instrument Air compressor Bravo", "unit": "BOP", "slug": "instrument-air-compressor-bravo", "note": None, "rows": rows(
        ("AIR COMPRESSOR B", "00-INA-CMP-01B", "OPEN", "CLOSED"),
        ("AIR COMPRESSOR 01B ISOLATION", "00-VINA648", "CLOSED", "OPEN"),
        ("COMPRESSED AIR DRAIN", "00-VINA615", "OPEN", "CLOSED"),
    )},
    {"name": "Air Dryer Alpha", "unit": "BOP", "slug": "air-dryer-alpha", "note": None, "rows": rows(
        ("Air Dryer A PWR FEED", "00-INA-CPL-02A", "OPEN", "CLOSED"),
        ("Inlet to A Dryer", "VINA-612", "CLOSED", "OPEN"),
        ("Outlet to A Dryer", "VINA-624", "CLOSED", "OPEN"),
        ("A AIR DRYER INA DRAIN", "00-VINA676", "OPEN", "CLOSED"),
    )},
    {"name": "Air Dryer Bravo", "unit": "BOP", "slug": "air-dryer-bravo", "note": None, "rows": rows(
        ("AIR DRYER B PWR FEED", "00-INA-CPL-02B", "OPEN", "CLOSED"),
        ("Inlet to B Dryer", "VINA622", "CLOSED", "OPEN"),
        ("Outlet to 01B Dryer", "VINA626", "CLOSED", "OPEN"),
        ("INLET B AIR DRYER INA DRAIN", "00-VINA716", "OPEN", "CLOSED"),
    )},
    {"name": "Aux Boiler inspection", "unit": "BOP", "slug": "aux-boiler-inspection", "note": VERIFY, "rows": rows(
        ("AUX BOILER NATURAL GAS MAIN LINE MANUAL VALVE", "00-VAXS800", "CLOSED", "OPEN"),
        ("AUX BOILER COMBUSTION AIR FAN", "00-AXS-MFN-01", "OPEN", "CLOSED"),
        ("AUX BOILER FEED PUMP MTR 1", "00-AXS-MPM-01A", "OPEN", "CLOSED"),
        ("AUX BOILER FEED PUMP MTR 2", "00-AXS-VFD-01B", "OPEN", "CLOSED"),
        ("AUX BLR FEED WTR ISOLATION MOV 480VAC", "00-MOV-AXS-900", "OPEN", "CLOSED"),
        ("AUX BOILER ECONOMIZER LOWER HEADER DRAIN VALVE", "00-VAXS910", "OPEN", "CLOSED"),
        ("AUX BOILER ECONOMIZER OUTLET HEADER VENT VALVE", "00-VAXS909", "OPEN", "CLOSED"),
        ("AUX BOILER BOTTOM BLOWDOWN VALVE (WEST)", "00-VAXS938", "OPEN", "CLOSED"),
        ("AUX BOILER BOTTOM BLOWDOWN VALVE (EAST)", "00-VAXS939", "OPEN", "CLOSED"),
        ("AUX BOILER BOTTOM BLOWDOWN DRAIN VALVE", "00-VAXS940", "OPEN", "CLOSED"),
        ("AUX BOILER BLOCK VALVE BEFORE BACK PRESSURE CONTROL VALVE", "00-V-AXS623", "CLOSED", "OPEN"),
        ("BYPASS VALVE FOR BACK PRESSURE CONTROL VALVE", "00-V-AXS624", "CLOSED", "OPEN"),
        ("DOWN STREAM BACK PRESSURE CONTROL VALVE ISO AXS625", "00-VAXS625", "CLOSED", "OPEN"),
        ("Aux Boiler Main Gas Manual Isolation (Outside)", "00-VFGS228", "CLOSED", "OPEN"),
        ("CCF AUX BLR Ammonia feed pmp CPL 480V VAC Brk 1/3/5", "00-CCF-CPL-01", "OPEN", "CLOSED"),
        ("Demin Supply Block Valve", "00-V-AXS978", "CLOSED", "OPEN"),
        ("Demin Supply Root Valve", "00-V-AXS975", "CLOSED", "OPEN"),
        ("Demin Supply Bypass valve", "00-V-AXS979", "CLOSED", "CLOSED"),
        ("Demin Supply drain After Regulator", "00-V-AXS-977", "OPEN", "CLOSED"),
        ("BOILER DA MAKEUP WTR LCV OUTLET DRAIN VALVE", "00-VAXS980", "OPEN", "CLOSED"),
        ("AUX BLR MAIN STEAM STOP MOV 480VAC", "00-MOV-AXS901", "OPEN", "CLOSED"),
        ("00-MOV-AXS901 HANDWHEEL", "00-MOV-AXS901", "CLOSED", "CLOSED"),
        ("BOILER DRUM MAIN STEAM OUTLET VALVE", "00-V-AXS948", "CLOSED", "OPEN"),
        ("AUX BOILER DRUM VENT", "00-VAXS914", "OPEN", "CLOSED"),
        ("ROOT VALVE TO THE START UP VENT VALVES", "00-VAXS953", "CLOSED", "OPEN"),
        ("AUX BLR 120 VAC PWR (PLC Panel)", "00-AXS-CPL-01", "OPEN", "CLOSED"),
        ("Aux Boiler DA Storage Drain", "00-V-AXS959", "OPEN", "CLOSED"),
        ("Aux Boiler BD Tank Drain", "00-V-AXS944", "OPEN", "CLOSED"),
        ("Aux Boiler BD Quench Water ISO", "00-VAXS946", "CLOSED", "OPEN"),
        ("Aux Boiler BD Quench Water Bypass", "00-V-AXS947", "CLOSED", "CLOSED"),
        ("Inlet Fuel gas vent (next to Y strainer YTS-832)", "00-VAXS833", "OPEN", "CLOSED"),
        ("Root INA manual Iso", "VINA463", "CLOSED", "OPEN"),
        ("INA vent downstream Vina463", "", "OPEN", "CLOSED"),
        ("INA iso to flame scanner 1 & 2", "00-VAXS857", "CLOSED", "OPEN"),
        ("INA iso to ignitor", "00-VAXS856", "CLOSED", "OPEN"),
        ("INA to East sight glass sweep air", "VINA425", "CLOSED", "OPEN"),
        ("AIR SUPPLY TO WEST BOTTOM BLOWDOWN VALVE", "00-VINA-145", "OPEN", "OPEN"),
        ("AIR SUPPLY TO EAST BOTTOM BLOWDOWN VALVE", "00-VINA-189", "OPEN", "OPEN"),
    )},
]


def stage_image(slug):
    files = [os.path.join(SRC, f) for f in IMAGES[slug] if os.path.exists(os.path.join(SRC, f))]
    if not files:
        return slug + ".png"
    pages = [fitz.Pixmap(f) for f in files]
    w = max(p.width for p in pages); h = sum(p.height for p in pages)
    doc = fitz.open(); page = doc.new_page(width=w, height=h)
    y = 0
    for p in pages:
        page.insert_image(fitz.Rect(0, y, p.width, y + p.height), pixmap=p); y += p.height
    out = slug + ".png"
    page.get_pixmap().save(os.path.join(RES_IMAGES, out))
    return out


def main():
    seed = json.load(open(os.path.join(RES, "seed.json")))
    existing = {s["name"] for s in seed}
    added = 0
    for std in BATCH2:
        if std["name"] in existing:
            print("skip (dup name):", std["name"]); continue
        img = stage_image(std["slug"])
        seed.append({"name": std["name"], "unit": std["unit"], "image": img,
                     "rows": std["rows"], "importNotes": std["note"]})
        added += 1
    json.dump(seed, open(os.path.join(RES, "seed.json"), "w"), indent=1)
    total_rows = sum(len(s["rows"]) for s in seed)
    print(f"added {added} standards; seed.json now {len(seed)} standards, {total_rows} rows")


if __name__ == "__main__":
    main()
