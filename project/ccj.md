One plant, one screen: A homegrown platform that unifies O&M, permitting, and market data
By [Your Name], [Title], [Plant Name] ([XXX]-MW combined cycle, [City, State])

The challenge
Like most combined-cycle facilities, we ran the plant on a patchwork of disconnected systems. Maintenance lived in Maximo. Documents and forms lived in SharePoint and on shared drives. Performance data came out of EtaPRO. Market and dispatch data came from PJM. And our most safety-critical workflows — LOTO, work permits, and job hazard analyses — still moved on paper and in spreadsheets.

The cost of that fragmentation was quiet but constant. Operators and technicians re-keyed the same information into three or four places. People walked back to a workstation to look something up because the data wasn't in the field. Permit and LOTO packages were rebuilt from scratch each time instead of reused. And when network or a vendor portal was down, work stopped. No single screen told you the true state of the plant.

The solution
Rather than buy another siloed tool, we built one in-house: a unified digital operations platform that consolidates maintenance, permitting, safety, performance, and market data into a single interface — and, critically, keeps working when the network doesn't.

Key design choices:

Offline-first, local by default. Each workstation runs its own local copy of the application and database. Losing the network never stops work; data is always saved locally first.
Automatic, conflict-free sync. Every local instance synchronizes in real time with a central hub. Merging happens at the individual-field level, so two people editing the same record never overwrite each other's work — a persistent problem with shared spreadsheets.
Digitized LOTO, permits, and JHAs. Lockout points, permits, and hazard analyses are built from reusable templates instead of paper, with the plant's equipment data behind them. What used to be rebuilt every time is now assembled in minutes.
Integrations, not another silo. The platform pulls Maximo work orders and PMs, SharePoint documents, EtaPRO performance data, and PJM market data into one place — including automatically routing recurring preventive-maintenance tasks to the correct on-shift operator.
A field-ready mobile app. Technicians submit work requests and JHAs — with photos — from their phones, so issues are captured where they're found instead of at a desk later.
The entire system was developed and is maintained by plant staff, which means it speaks the language of how we actually run the unit and can change as fast as our operation does.

The results
[Fill in: e.g., hours/week saved on permit and LOTO preparation]
[Fill in: reduction in duplicate data entry / paperwork errors]
[Fill in: any safety or compliance improvement — e.g., fewer permit rework events]
[Fill in: licensing/software cost avoided vs. commercial alternatives]
(These need real numbers or honest qualitative statements — reviewers and readers trust specifics.)

Why it's transferable
Nothing here is unique to our equipment. Any combined-cycle plant juggling a CMMS, a document store, performance monitoring, market data, and paper safety processes faces the same fragmentation. The lesson we'd share is that a thin, in-house integration layer — offline-capable and built around how crews actually work — can tie existing systems together without a large capital project or a rip-and-replace.