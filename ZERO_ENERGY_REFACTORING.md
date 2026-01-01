# ZeroEnergy Refactoring - Deduplication Pattern

## Overview

The ZeroEnergy system has been refactored to implement an **automatic deduplication pattern**. Instead of modifying ZeroEnergy items directly through the LotoPoint form, the system now intelligently reuses existing ZeroEnergy records when they match, or creates new ones when needed.

## Architecture

### The Problem (Before)

- Multiple LotoPoints could share the same ZeroEnergy (ManyToOne relationship)
- Editing one LotoPoint's ZeroEnergy would affect ALL LotoPoints using it
- No way to safely customize individual LotoPoints

### The Solution (After)

```
Client sends LotoPoint data with ZeroEnergy
         ↓
NgZeroEnergyService.findOrCreate(dto)
         ↓
    Normalize data (template ID + equipment IDs)
         ↓
    Search for existing match
         ↓
    ┌─────────────┬─────────────┐
    Found         Not Found
    ↓             ↓
    Reuse it      Create new
    └─────────────┴─────────────┘
         ↓
    Assign to LotoPoint
```

## Key Components

### 1. ZeroEnergy Entity Enhancements

**File**: `entities/loto/ZeroEnergy.java`

New methods:
- `setNormalizedEquipmentIds()` - Sorts and deduplicates equipment IDs for consistent storage
- `getSignature()` - Creates a unique signature for deduplication matching

### 2. NgZeroEnergyService

**File**: `sevice/angular/loto/NgZeroEnergyService.java`

New methods:
- `findOrCreate(ZeroEnergyDto)` - **Core deduplication logic**
- `getAllWithUsageCount()` - For admin UI
- `findOrphans()` - Find unused ZeroEnergy items
- `cleanupOrphans()` - Delete unused items

### 3. ZeroEnergyRepo

**File**: `repository/loto/ZeroEnergyRepo.java`

New queries:
- `findByTemplateAndEquipmentIds()` - Find matching ZeroEnergy
- `findOrphans()` - Find unused items
- `deleteOrphans()` - Cleanup unused items

### 4. LotoPointRepo

**File**: `repository/loto/LotoPointRepo.java`

New queries:
- `countByZeroEnergyId()` - Usage statistics
- `reassignZeroEnergy()` - For merging ZeroEnergy items

## How It Works

### When Saving a LotoPoint

```java
// Client sends LotoPointDto with embedded ZeroEnergyDto
LotoPointDto dto = /* from client */;

// In your mapper/service:
if (dto.getZeroEnergy() != null) {
    // Use findOrCreate to get or create ZeroEnergy
    ZeroEnergy zeroEnergy = ngZeroEnergyService.findOrCreate(dto.getZeroEnergy());

    // Assign to LotoPoint
    lotoPoint.setZeroEnergy(zeroEnergy);
}
```

### Deduplication Logic

The system matches ZeroEnergy items based on:
1. **Template ID** (from `zeroEnergyTemplate`)
2. **Equipment IDs** (sorted, comma-separated string)

Example:
```
Template ID: 123
Equipment IDs: [1, 2, 3]
Normalized: "1,2,3"

Matches:
✅ Template 123 + [1,2,3]
✅ Template 123 + [3,2,1] (sorted to "1,2,3")
✅ Template 123 + [2,1,3] (sorted to "1,2,3")

Does NOT match:
❌ Template 123 + [1,2,4] (different equipment)
❌ Template 456 + [1,2,3] (different template)
```

## Benefits

1. **Automatic Deduplication** - No duplicate data for identical verifications
2. **Immutable from LotoPoint Forms** - ZeroEnergy items are never modified through LotoPoint editing
3. **Safe Sharing** - Multiple LotoPoints can share without conflicts
4. **Efficient Storage** - Common phrases stored once
5. **Clean Separation** - LotoPoint form doesn't manage ZeroEnergy lifecycle

## Usage Patterns

### Creating a LotoPoint

```java
// Frontend sends:
{
  "tagNumber": "V-123",
  "description": "Main valve",
  "zeroEnergy": {
    "zeroEnergyTemplate": { "id": 5 },
    "templateEquipmentIds": [101, 102, 103]
  }
}

// Backend automatically:
// 1. Checks if ZeroEnergy with template=5 and equipment=[101,102,103] exists
// 2. If yes → reuses it
// 3. If no → creates new one
// 4. Assigns to LotoPoint
```

### Updating a LotoPoint

```java
// User changes equipment from [101, 102, 103] to [101, 102, 104]

// System will:
// 1. Look for ZeroEnergy with new signature
// 2. If found → reassign LotoPoint to existing ZeroEnergy
// 3. If not → create new ZeroEnergy
// 4. Old ZeroEnergy remains (other LotoPoints may still use it)
```

## Admin Features

### View All ZeroEnergy Items

```java
List<ZeroEnergyDto> all = ngZeroEnergyService.getAllWithUsageCount();
// Shows all unique ZeroEnergy combinations
```

### Find Unused Items

```java
List<ZeroEnergy> orphans = ngZeroEnergyService.findOrphans();
// Returns ZeroEnergy items not used by any LotoPoint
```

### Cleanup Unused Items

```java
int deleted = ngZeroEnergyService.cleanupOrphans();
// Deletes all orphaned ZeroEnergy items
// Can be run manually or scheduled
```

### Merge Similar Items

```java
// If you have duplicate ZeroEnergy items due to manual creation
lotoPointRepo.reassignZeroEnergy(sourceId, targetId);
// Reassigns all LotoPoints from source to target
zeroEnergyRepo.deleteById(sourceId);
```

## Migration Strategy

### For Existing Data

Current setup already works! The `@ManyToOne` relationship is preserved.

New behavior applies when:
- Creating new LotoPoints
- Updating existing LotoPoints

### Integration Points

Update your LotoPoint save logic to use `findOrCreate`:

```java
// Before:
ZeroEnergy ze = zeroEnergyMapper.convertToEntity(dto.getZeroEnergy());
ze = zeroEnergyRepo.save(ze);
lotoPoint.setZeroEnergy(ze);

// After:
ZeroEnergy ze = ngZeroEnergyService.findOrCreate(dto.getZeroEnergy());
lotoPoint.setZeroEnergy(ze);
```

## Future Enhancements

### 1. Admin UI
- View all ZeroEnergy items with usage counts
- Merge similar items
- Cleanup orphaned items
- Search and filter

### 2. Scheduled Cleanup
```java
@Scheduled(cron = "0 0 2 * * ?") // 2 AM daily
public void cleanupOrphans() {
    ngZeroEnergyService.cleanupOrphans();
}
```

### 3. Analytics
- Track most commonly used ZeroEnergy templates
- Identify patterns for standardization

## Database Schema

No schema changes required! The refactoring works with your existing structure:

```sql
-- LotoPoint table
zero_energy_id BIGINT REFERENCES zero_energy(id)

-- ZeroEnergy table
id BIGINT PRIMARY KEY
zero_energy_template_id BIGINT REFERENCES value(id)
template_loto_point_ids TEXT -- Comma-separated equipment IDs
```

## Testing

### Test Cases

1. **Create two LotoPoints with identical ZeroEnergy**
   - Should reuse the same ZeroEnergy entity

2. **Update LotoPoint to change equipment**
   - Should create/find new ZeroEnergy
   - Old ZeroEnergy should remain if other LotoPoints use it

3. **Delete all LotoPoints using a ZeroEnergy**
   - ZeroEnergy becomes orphaned
   - Can be cleaned up

4. **Normalization**
   - [1,2,3] and [3,2,1] should match
   - [1,2,3] and [1,2,4] should NOT match

## Questions & Answers

**Q: What if I want to modify a ZeroEnergy that multiple LotoPoints use?**

A: You can't directly modify it. Instead:
1. Create a new ZeroEnergy with the updated values
2. Use `reassignZeroEnergy()` to move LotoPoints to the new one
3. Delete the old one

Or create separate ZeroEnergy items for each variation.

**Q: How do I prevent duplicate ZeroEnergy items?**

A: The system does it automatically! When you save a LotoPoint, `findOrCreate()` checks for matches.

**Q: Can I still manually create ZeroEnergy items?**

A: Yes, but it's not recommended. Use the LotoPoint form - the system will create them as needed.

**Q: What happens to existing data?**

A: Nothing changes immediately. The new behavior applies when creating/updating LotoPoints going forward.

---

## Summary

This refactoring implements a clean, automatic deduplication pattern for ZeroEnergy management:

✅ **Automatic** - No manual ZeroEnergy management needed
✅ **Safe** - No accidental cross-LotoPoint modifications
✅ **Efficient** - Reuses identical data
✅ **Clean** - Clear separation of concerns
✅ **Backwards Compatible** - Works with existing data

The system now handles ZeroEnergy lifecycle automatically, freeing you to focus on LOTO point configuration without worrying about shared data integrity.
