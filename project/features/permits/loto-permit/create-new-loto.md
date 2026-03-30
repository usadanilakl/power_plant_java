# Create New LOTO Permit

## Box & Lock Inventory

### Physical Boxes (72 total)
| Boxes    | Set Size | Notes |
|----------|----------|-------|
| 1-5, 24  | 20 locks | All locks numbered same as box |
| 6-23, 25-32 | 10 locks | All locks numbered same as box |
| 33-38    | 50 locks | All locks numbered same as box |
| 39-72    | 0 (no set) | Use single locks only |

### Single Locks
- Numbered 200-399 (200 total)
- Not tied to any box
- Used for small LOTOs (≤5 points) or to supplement sets

## Auto-Assignment Rules

### ≤5 isolation points
1. Assign box from 39-72 (no lock set)
2. Assign single locks (200-399) — one per point

### >5 isolation points
1. Find the smallest available set box that covers all points
   - e.g., 7 points → box with 10-lock set
   - e.g., 15 points → box with 20-lock set
2. If no single set covers all points, use the largest available set + singles for overflow
   - e.g., 22 points → box with 20-lock set + 2 single locks
3. All set locks from that box are assigned to the LOTO
4. Remaining points get single locks

## Seeding
- `LockInventorySeedService` seeds box set sizes and creates all Lock entities
- Triggered via `POST /ng/loto-boxes/seed-inventory` or on app startup via `LotoBoxInitializationService`
- Idempotent — only seeds if lock count is 0

## On LOTO Close
- All locks (set + single) are released back to inventory
- Box is released and LED set to dark blue (Closed)
