# Device Identity & Configuration

Each machine running the app needs a unique identity for two purposes:
1. **ID generation** — device number (1-9) partitions the ID space so locally-created entities never collide across machines.
2. **Sync tracking** — machine ID and device name are stamped on every `FieldChange` so the sync engine knows where a change originated.

## Property files

Four files participate, two at the project root (runtime) and two on the classpath (build-time):

| File | Location | Written by | Read by | Contents |
|------|----------|-----------|---------|----------|
| `machine-id.properties` | Project root (`./`) | Electron (`DeviceConfigManager`) | Spring Boot (`SyncConfig`, `DevicePrefixedIdGenerator`) | `device.number`, `device.name`, `machine.id` |
| `sync-config.properties` | Project root (`./`) | Electron (`DeviceConfigManager`) + Spring Boot (`SyncConfig.saveSyncServerConfig()`) | Spring Boot (`SyncConfig`) | `sync.server.url`, `sync.server.enabled` |
| `device-configs/*.properties` | `src/main/resources/device-configs/` | Developer (checked into git) | Spring Boot (via `spring.config.import`) | `device.number`, `device.name` |
| `device-config.json` | Electron working dir (`managed_apps/pid/`) | Electron (`DeviceConfigManager`) | Electron (`DeviceConfigManager`) | Full `DeviceConfig` object (JSON) |

### machine-id.properties (example)

```properties
# Device identity for sync and ID generation — managed by Electron
device.name=opi
device.number=2
machine.id=OPI
```

### sync-config.properties (example)

```properties
# Sync server configuration — managed by Electron
sync.server.url=http://192.168.12.146:8090
sync.server.enabled=true
```

### device-configs/*.properties (checked in)

Pre-defined profiles for known machines. Selected by the `DEVICE_CONFIG` environment variable.

| File | device.number | device.name |
|------|--------------|-------------|
| `opi.properties` | 2 | opi |
| `ao-tablet.properties` | 3 | AO Tablet |
| `cro-tablet.properties` | 4 | CRO Tablet |
| `home-pc.properties` | 2 | Home PC |

Imported by [application.properties:50](../../../src/main/resources/application.properties#L50):

```properties
spring.config.import=optional:classpath:device-configs/${DEVICE_CONFIG:opi}.properties
```

If `DEVICE_CONFIG` is not set, defaults to `opi`.

## Electron side — how config is set

### Settings UI

[settings.component.ts](../../../electron-manager/src/renderer/src/app/pages/settings/settings.component.ts) provides the Device Identity section. Three registration paths:

1. **Server-based** — user enters device name + sync server URL, UI fetches `GET /api/sync/device-registry` to show taken/available numbers (1-9), user picks one, UI calls `POST /api/sync/device-registry` to register, receives assigned `DeviceConfig`.
2. **Reuse existing** — device registry shows previously registered devices; user clicks "Use" to adopt one.
3. **Manual offline** — user picks a device number (1-9) manually without server contact.

All three paths end with `DeviceConfigManager.saveConfig(config)`.

### DeviceConfigManager

[device-config.manager.ts](../../../electron-manager/src/main/managers/device-config.manager.ts)

`saveConfig()` writes three files:

```
saveConfig(config)
  ├─ device-config.json        ← Electron's own persistent store
  ├─ machine-id.properties     ← for Spring Boot (device.number, device.name, machine.id)
  └─ sync-config.properties    ← for Spring Boot (sync.server.url, sync.server.enabled)
```

On startup (`load()`), if `device-config.json` exists it also:
- Re-writes `machine-id.properties` to ensure it's in sync
- Reads `sync-config.properties` — if the URL differs from `device-config.json` (e.g. Spring Boot's REST API changed it), adopts the file's value and updates `device-config.json`
- Re-writes `sync-config.properties` to ensure it's in sync

**machineId derivation:** `deviceName.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/g, '')` — e.g. "AO Tablet" becomes `AO-TABLET`.

### SpringBootManager — passing config to the JAR

[spring-boot.manager.ts:90-97](../../../electron-manager/src/main/managers/spring-boot.manager.ts#L90-L97)

When spawning the Java process:

```typescript
const spawnEnv = { ...process.env };
if (deviceConfig) {
  spawnEnv.DEVICE_CONFIG = deviceConfig.machineId.toLowerCase();  // e.g. "opi"
}
spawn('java', ['-jar', jarPath], { env: spawnEnv, cwd: workingDir });
```

This env var causes Spring Boot to import `device-configs/opi.properties` from the classpath.

### IPC bridge

[handlers.ts:234-259](../../../electron-manager/src/main/ipc/handlers.ts#L234-L259) registers four IPC channels:

| IPC Event | Handler |
|-----------|---------|
| `device:get-config` | Returns current `DeviceConfig` |
| `device:save-config` | Calls `DeviceConfigManager.saveConfig()` |
| `device:fetch-registry` | Calls `DeviceConfigManager.fetchDeviceRegistry()` |
| `device:register` | Calls `DeviceConfigManager.registerWithServer()` |

Exposed to the renderer via [main.preload.ts:66-73](../../../electron-manager/src/main/preload/main.preload.ts#L66-L73) as `window.electronAPI.getDeviceConfig()`, etc.

## Spring Boot side — how config is read

### SyncConfig (@PostConstruct)

[SyncConfig.java](../../../src/main/java/com/dk_power/power_plant_java/config/SyncConfig.java)

Fields injected by Spring `@Value`:

```java
@Value("${device.number:0}")    private int deviceNumber;
@Value("${device.name:}")       private String deviceName;
@Value("${sync.machine.id:}")   private String machineId;
@Value("${sync.server.url:}")   private String syncServerUrl;
@Value("${sync.server.enabled:false}") private boolean syncServerEnabled;
```

`@PostConstruct init()` applies a layered loading strategy:

```
1. @Value injection from application.properties + imported device-configs/*.properties
       ↓
2. loadDeviceIdentityFromFile()
   └─ reads ./machine-id.properties
   └─ overwrites device.number, device.name, machine.id ONLY if current value is empty/0
       ↓
3. If deviceNumber > 0 && deviceName present:
   └─ derive machineId from deviceName if not already set (same algorithm as Electron)
   └─ saveDeviceIdentityToFile() — persists back to machine-id.properties
       ↓
4. If still no machineId:
   └─ loadOrCreateMachineId() — generates UUID substring, saves to machine-id.properties
       ↓
5. loadSyncServerConfigFromFile() (non-hub mode only)
   └─ reads ./sync-config.properties
   └─ file values OVERRIDE @Value-injected values from application.properties
```

The priority is: **machine-id.properties file > classpath device-configs > application.properties defaults > auto-generated**.

For sync server URL, the priority is: **sync-config.properties file > application.properties** (for non-hub mode).

### DevicePrefixedIdGenerator

[DevicePrefixedIdGenerator.java](../../../src/main/java/com/dk_power/power_plant_java/config/DevicePrefixedIdGenerator.java)

Reads `device.number` directly from `./machine-id.properties` (not from Spring's `@Value` — the generator runs outside the Spring context as a Hibernate `IdentifierGenerator`).

**ID formula:**

```
generated_id = device_number * 1,000,000,000 + sequence_value
```

| Device # | ID range |
|----------|----------|
| 1 | 1,000,000,001 – 1,999,999,999 |
| 2 | 2,000,000,001 – 2,999,999,999 |
| 3 | 3,000,000,001 – 3,999,999,999 |
| ... | ... |
| 9 (fallback) | 9,000,000,001 – 9,999,999,999 |

The device number is cached in a static field after first read (synchronized, one read per JVM lifetime).

If `machine-id.properties` is missing or `device.number` is not in range 1-9, the generator falls back to **device 9** and logs a prominent `ERROR`:

```
=== DEVICE NUMBER NOT CONFIGURED ===
device.number not found in ./machine-id.properties. Using fallback device 9.
Set DEVICE_CONFIG env var or configure device via Electron Settings.
IDs generated with fallback device may conflict with other machines!
=====================================
```

### Where device identity is used at runtime

| Consumer | Field(s) used | Purpose |
|----------|--------------|---------|
| `DevicePrefixedIdGenerator` | `device.number` | Partition ID space per machine |
| `FieldChange` entity | `originMachineId`, `originMachineName` | Track which machine originated each field change |
| `Peer` entity | `machineId` (PK), `deviceNumber`, `machineName` | Peer discovery and device-number conflict detection |
| `HubClientInfo` | `deviceNumber` | Hub tracks connected clients |
| `SyncConfig` | all fields | Injected across sync services for identification in SSE, REST calls, logging |

## Startup flow diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│  ELECTRON                                                             │
│                                                                       │
│  1. DeviceConfigManager.load()                                        │
│     └─ reads device-config.json                                       │
│     └─ re-writes machine-id.properties (ensure sync)                  │
│     └─ re-writes sync-config.properties (ensure sync)                 │
│                                                                       │
│  2. SpringBootManager.start()                                         │
│     └─ reads deviceConfig.machineId                                   │
│     └─ sets env DEVICE_CONFIG = machineId.toLowerCase()               │
│     └─ spawns: java -jar power_plant_java-1.jar                      │
└───────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│  SPRING BOOT                                                          │
│                                                                       │
│  3. application.properties loads                                      │
│     └─ spring.config.import imports device-configs/${DEVICE_CONFIG}    │
│     └─ @Value injects device.number, device.name, sync.machine.id     │
│                                                                       │
│  4. SyncConfig.init() (@PostConstruct)                                │
│     └─ loadDeviceIdentityFromFile()     ← reads machine-id.properties │
│     └─ derives machineId if needed                                    │
│     └─ saveDeviceIdentityToFile()       ← writes machine-id.properties│
│     └─ loadSyncServerConfigFromFile()   ← reads sync-config.properties│
│     └─ logs DEVICE IDENTITY + SYNC CONFIG blocks                      │
│                                                                       │
│  5. DevicePrefixedIdGenerator (first entity save)                     │
│     └─ reads device.number from machine-id.properties (cached)        │
│     └─ generates IDs: deviceNumber * 1B + sequence                    │
└───────────────────────────────────────────────────────────────────────┘
```

## Hub-peer mode difference

When a machine runs as hub (`sync.role=hub`):
- `SyncConfig.init()` **skips** loading `sync-config.properties` — the hub IS the server, so its sync config comes from the Spring profile only.
- `SyncConfig.saveSyncServerConfig()` is a no-op in hub mode.
- Device identity (`machine-id.properties`) still applies — the hub needs its own device number for ID generation and change tracking.

## Fallback behavior

| Scenario | Result |
|----------|--------|
| `device-config.json` missing (Electron) | `DeviceConfigManager.isConfigured()` returns false; Spring Boot warned but starts |
| `machine-id.properties` missing | `SyncConfig` auto-generates UUID-based machineId and saves it; `DevicePrefixedIdGenerator` uses fallback device 9 |
| `device.number` out of range (not 1-9) | `DevicePrefixedIdGenerator` uses fallback device 9 with ERROR log |
| `DEVICE_CONFIG` env var not set | Spring Boot imports `device-configs/opi.properties` (the default) |
| Sync server unreachable during setup | Settings UI offers Manual Setup (offline) as fallback |
| Same device number on two machines | `Peer.deviceNumberConflict` field flags the collision |

## Key source files

| File | Role |
|------|------|
| [SyncConfig.java](../../../src/main/java/com/dk_power/power_plant_java/config/SyncConfig.java) | Central config bean — loads, merges, and persists device identity + sync config |
| [DevicePrefixedIdGenerator.java](../../../src/main/java/com/dk_power/power_plant_java/config/DevicePrefixedIdGenerator.java) | Hibernate ID generator — reads device.number for ID partitioning |
| [device-config.manager.ts](../../../electron-manager/src/main/managers/device-config.manager.ts) | Electron-side config manager — writes all .properties files |
| [spring-boot.manager.ts](../../../electron-manager/src/main/managers/spring-boot.manager.ts) | Sets DEVICE_CONFIG env var when spawning JAR |
| [settings.component.ts](../../../electron-manager/src/renderer/src/app/pages/settings/settings.component.ts) | Angular UI for device setup |
| [handlers.ts](../../../electron-manager/src/main/ipc/handlers.ts) | IPC bridge between renderer and DeviceConfigManager |
| [FieldChange.java](../../../src/main/java/com/dk_power/power_plant_java/entities/sync/FieldChange.java) | Stores originMachineId/originMachineName per change |
| [Peer.java](../../../src/main/java/com/dk_power/power_plant_java/entities/sync/Peer.java) | Peer discovery entity with deviceNumber conflict detection |
