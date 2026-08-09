# Sync Test Lab — 3-node isolated harness

How to recreate the isolated hub + 2-client lab used to validate CRDT sync (convergence, offline
catch-up, load, field-level merge) **without touching production SharePoint / Supabase**. Built
2026-08-09; see [[sync_catchup_perf_2026_08_09]] and `m2m-membership-convergence.md` for what it found.

## Why isolated

Testing against the real desktop/hub is unsafe: the Electron manager restarts a desktop backend when
its sync is toggled, and a `prod,hub,server` hub auto-pushes to **real SharePoint and Supabase**. This
lab runs 3 standalone Spring backends (no Electron) in throwaway dirs with fresh H2 DBs and **all
external egress disabled**, so it can't corrupt production data and can be killed/deleted freely.

## Prerequisites

- The executable boot jar: `mvn clean package -DskipTests` → `target/power_plant_java-1.jar`.
  (Do NOT rebuild while the lab is running — the JVMs lock the jar and repackage fails with "Unable to
  rename …jar to …jar.original", leaving a non-executable jar. Stop the instances first.)
- Java 21 on PATH.
- The jar bundles `application-secrets.properties`, so fresh dirs start out of the box.

## Layout (base `C:\Users\usada\ppsl`)

```
ppsl/
  launch.sh          # start an instance (hub|clientA|clientB)
  loadgen.sh         # generate varied CRUD backlog against a port
  perfcap.sh         # sample heap/Hikari/read-latency for all 3 nodes into a CSV
  hub/      machine-id.properties (device.number=10, machine.id=SYNCLABHUB)
  clientA/  machine-id.properties (device.number=11, machine.id=SYNCLABA) + sync-config.properties
  clientB/  machine-id.properties (device.number=12, machine.id=SYNCLABB) + sync-config.properties
```

Each instance's working dir holds its own `db/proddb`, `machine-id.properties`, `backend-port.txt`,
`logs/` — all relative to CWD, which is why device number and DB are naturally isolated per dir.

### Identity files
- `hub/machine-id.properties`: `device.number=10` / `machine.id=SYNCLABHUB` / `device.name=SYNCLABHUB`
- `clientA`: device 11 / SYNCLABA; `clientB`: device 12 / SYNCLABB (must be unique — else ID collisions).
- Each client's `sync-config.properties`: `sync.server.url=http://localhost:8090` + `sync.server.enabled=true`
  (belt-and-suspenders — this file overrides the @Value so a client can never point at the prod hub).

### Ports & profiles
- **hub**: `prod,hub,server`, port **8090** (overrides the server profile's 8085 for isolation). The
  `server` profile matches production behavior (X-Forwarded trust; harmless locally). `sync.role=hub` +
  `sync.server.enabled=false` come from the `hub` profile.
- **clientA/B**: `prod`, ports **8091 / 8092**, `--sync.server.url=http://localhost:8090`.

## The external-egress kill (baked into `launch.sh`)

Every instance is launched with these args so **no test data can reach production**:

```
--jwt.allow-key-bootstrap=true                              # let a fresh hub mint its RS256 keypair
--sharepoint.sync.enabled=false                             # disable the SP orchestrator
--sharepoint.site.hostname=sharepoint-disabled-for-test.invalid
--pa.flow.work-request-url=  ...jha-url= ...field-list-url= ...inventory-url= ...sds-url= ...qualifications-url=
--supabase.enabled=false --supabase.url=                    # Supabase admin/auth + PWA sink inert
--pwa.data-target=none                                      # loto/work-area PWA publish goes nowhere
--etapro.enabled=false --etapro.api.enabled=false           # no Excel/COM scraper competing for CPU
```
Verified in the hub log: `Supabase Admin client DISABLED`, `PlantChatAudit Disabled`, and the SharePoint
cert parse FAILS (`data/certificate.pfx` absent in a fresh dir) — so both channels are unreachable even
if a code path tried. The fresh dir having no cert is a second layer of protection.

## Scripts

### launch.sh
```bash
#!/bin/bash
BASE=/c/Users/usada/ppsl
JAR="C:/Users/usada/my_projects/power_plant_java/target/power_plant_java-1.jar"
KILL="--jwt.allow-key-bootstrap=true \
--sharepoint.sync.enabled=false --sharepoint.site.hostname=sharepoint-disabled-for-test.invalid \
--pa.flow.work-request-url= --pa.flow.jha-url= --pa.flow.field-list-url= --pa.flow.inventory-url= --pa.flow.sds-url= --pa.flow.qualifications-url= \
--supabase.enabled=false --supabase.url= --pwa.data-target=none \
--etapro.enabled=false --etapro.api.enabled=false"
name=$1
case $name in
  hub)     profile="prod,hub,server"; port=8090; mid=SYNCLABHUB ;;
  clientA) profile="prod";            port=8091; mid=SYNCLABA ;;
  clientB) profile="prod";            port=8092; mid=SYNCLABB ;;
  *) echo "unknown instance: $name"; exit 1 ;;
esac
cd "$BASE/$name" || exit 1
nohup java -jar "$JAR" --spring.profiles.active=$profile --server.port=$port \
  --sync.machine.id=$mid --sync.machine.name=$mid $KILL > startup.log 2>&1 &
echo "$name PID=$! port=$port profile=$profile"
```

### loadgen.sh `<port> <prefix> <count>`
Creates `<count>` loto points (12-way concurrent), updates ~20% (scalar), creates ~count/50 loto
standards each linking 10 points (M2M), deletes ~10% (each cascades via `deleteLotoPointSafely`). Every
op goes through the real service/emission path. (Full script in the lab dir.)

### perfcap.sh `<out.csv>`
Every ~2s samples, per node: `jvm.memory.used(heap)`, `hikaricp.connections.active/pending`, and the wall
time of a normal paginated read (`readMs` = the "app laggs" symptom). Stops when `STOP_PERF` file appears.
`hikaricp.connections.pending > 0` == requests BLOCKED on a DB connection.

## Setup

```bash
mkdir -p /c/Users/usada/ppsl/{hub,clientA,clientB}
# write the 3 machine-id.properties + 2 sync-config.properties (see Identity files above)
# write launch.sh / loadgen.sh / perfcap.sh
bash launch.sh hub      # wait ~30s → curl :8090/actuator/health = UP
bash launch.sh clientA; bash launch.sh clientB
```

## Operating the lab

- **Take a node offline (down):** `Stop-Process -Force` via PowerShell on the port owner
  (`Get-NetTCPConnection -LocalPort 8092`). Git Bash `kill` is unreliable on Windows PIDs; PowerShell is
  reliable. `actuator/shutdown` is auth-blocked.
- **Read metrics:** `curl :PORT/actuator/metrics/hikaricp.connections.pending` etc. (exposed).
- **Catch-up progress (added instrumentation):** grep the client sync log for
  `server_sync.catchup.session_complete` → `durationS`, `applied`, `throughputPerSec`, `peakPending`.
- **Count convergence:** `curl :PORT/ng/loto-points/paginated?page=1&pageSize=1` → `totalElements`
  (grep `"totalElements":[0-9]+`, NOT the first number — that's a row id).

## Scenarios run (2026-08-09) — all validated

1. Change on a client → converges to hub + other client (<4s).
2. Clients offline → change on hub → restart → catch-up.
3. Hub offline → **different fields** of same point edited on each client → start hub → field-level merge.
5. Hub offline → ~1000 varied CRUD on each client → start hub → time sync + heap/GC/Hikari + read latency.
6. **(key)** One client offline while a backlog builds on the hub → returns → characterize catch-up.
   Root cause: relationship changes targeting soft-deleted entities defer 15×→dead-letter. Fixed
   (no-op-ack + continuous-drain): 604s→98s, 778→0 dead-letters.

## Teardown

```powershell
foreach ($p in 8090,8091,8092) { (Get-NetTCPConnection -LocalPort $p -EA SilentlyContinue).OwningProcess | % { Stop-Process -Id $_ -Force -EA SilentlyContinue } }
Remove-Item -Recurse -Force C:\Users\usada\ppsl
```

## Gotchas learned
- Rebuilding the jar while instances run → repackage rename fails → non-executable jar. Stop first.
- Git Bash `kill <winpid>` often no-ops; use PowerShell `Stop-Process -Force`.
- `totalElements` extraction: filter `"totalElements":` first; the raw first integer is a row id.
- Three fresh instances each run startup seeders (admin users, reference data) that cross-sync — expect a
  ~9k-change convergence on first boot before the lab is quiet.
