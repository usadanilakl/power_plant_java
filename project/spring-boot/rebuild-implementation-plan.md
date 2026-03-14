# Rebuild Implementation Plan (Doc-Aligned)

## Objective
Rebuild backend from scratch with clean structure, implementing only what is defined in documentation-first V1 scope.

## Source of Truth (must be frozen before coding)
1. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\v1-scope.md`
2. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\v1-implementation-plan.md`
3. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\overview.md`
4. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\field-change.md`
5. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\change-tracking.md`
6. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\change-application.md`
7. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\hub-protocol.md`
8. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\client-protocol.md`
9. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\sync-context.md`
10. `C:\Users\usada\my_projects\dk_power_plant\project\spring-boot\sync\dedup.md`

## Non-Negotiable Rules
1. No implementation outside V1 entity cut.
2. No legacy package reuse unless explicitly listed in docs.
3. Every PR/step must include a doc-trace section: `Doc -> Implemented classes/endpoints/tests`.
4. If docs and implementation conflict, stop and patch docs first.
5. Build tool: Maven only.

## Step-by-Step Execution

### Step 1 - Repo Bootstrap (no business logic)
Deliverables:
1. New clean Spring Boot module skeleton (Maven, Java 21).
2. Package structure matching docs (`sync/model`, `sync/tracking`, `sync/apply`, `sync/hub`, `sync/client`, etc.).
3. Profiles and config split (`local`, `hub`).
4. CI command baseline: `mvn -q -DskipTests compile` and `mvn test`.
Gate:
1. App starts with empty context in both profiles.

### Step 2 - Persistence Baseline (Flyway + Base)
Deliverables:
1. `BaseEntity` contract.
2. Flyway migrations V1/V2/V3 per scope doc.
3. Seed categories limited to V1 set.
Gate:
1. Clean DB migration succeeds on H2 and PostgreSQL.
2. Migration test passes in Maven.

### Step 3 - V1 Core Domain CRUD
Deliverables:
1. Entities/repos/services/controllers/DTOs/mappers for:
   - Category, Value
   - PlantSystem
   - PlantComponent
   - ComponentConnection
2. Endpoint names and DTO names exactly as frozen naming contract.
Gate:
1. CRUD integration tests for each entity.
2. OpenAPI spec generated and validated.

### Step 4 - Document Domain
Deliverables:
1. Document, FileVersion, PidMarker full backend.
2. Upload/download endpoints.
3. File storage strategy per docs.
Gate:
1. Upload/download integration tests pass.

### Step 5 - Auth Boundary (V1 only)
Deliverables:
1. Desktop auto-auth + LAN login.
2. User and role model as documented.
3. AccessGrant/password reset deferred (not implemented).
Gate:
1. Security tests for admin/operator/viewer access.

### Step 6 - FieldChange Foundation
Deliverables:
1. FieldChange model and repository.
2. Entity change tracking listeners.
3. Sync loop prevention (`SyncContext`) per docs.
Gate:
1. Unit + integration tests prove no echo-loop and per-field change creation.

### Step 7 - Sync Apply Engine
Deliverables:
1. Multi-pass incoming change application pipeline.
2. LWW conflict resolver.
3. Dependency-ordered processing.
4. Dedup module per natural keys.
Gate:
1. Two-node simulation tests for merge and conflict scenarios.

### Step 8 - Hub Protocol
Deliverables:
1. Hub REST endpoints (`push`, `pull`, status/clients as documented).
2. Hub SSE stream and broadcast behavior.
3. Client registry and retention/maintenance jobs.
Gate:
1. Contract tests for all hub endpoints.
2. SSE reconnection test.

### Step 9 - Client Protocol
Deliverables:
1. Client push/pull service and scheduler.
2. Reconnect and backlog sync behavior.
3. Cold-resync path.
Gate:
1. End-to-end sync test across hub + 2 clients.

### Step 10 - Admin FieldChange History Tool
Deliverables:
1. Admin APIs for version timeline by entity.
2. Field diff between versions from FieldChange only.
3. Admin UI page for timeline + diff.
Gate:
1. Acceptance test: modify entity multiple times, timeline/diffs accurate.

### Step 11 - OpenAPI + Frontend Wiring
Deliverables:
1. OpenAPI generation in Maven lifecycle/profile.
2. Angular generated client integration for V1 endpoints.
Gate:
1. Frontend build and integration tests pass.

### Step 12 - Release Readiness
Deliverables:
1. Regression suite, smoke tests, docs update.
2. Deployment runbook.
3. Cut `v1.0.0-rc1`.
Gate:
1. Go/No-Go checklist signed off.

## Delivery Cadence
1. Implement one step at a time.
2. After each step: demo + test evidence + doc traceability.
3. Only then proceed to next step.

## First Execution Command Set (when coding starts)
1. Initialize clean module and parent POM.
2. Add Flyway + SpringDoc + MapStruct + Testcontainers.
3. Implement only Step 1 and Step 2.
