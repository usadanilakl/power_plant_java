# Zero Energy Method - Equipment Tag Number Substitution

## Overview

The Zero Energy method system now supports automatic substitution of equipment tag numbers into phrase templates. When a ZeroEnergy entity is converted to a DTO, placeholders like `[tag1]`, `[tag2]`, etc. are replaced with actual equipment tag numbers.

## How It Works

### 1. Phrase Storage (Frontend)

Phrases are created and stored as JSON in the `Value.alias` field:

```json
{
  "name": "Verify valve is closed",
  "rawText": "Verify that [tag1] and [tag2] are in the closed position",
  "segments": [
    { "type": "text", "content": "Verify that " },
    { "type": "placeholder", "content": "tag1", "placeholderIndex": 0 },
    { "type": "text", "content": " and " },
    { "type": "placeholder", "content": "tag2", "placeholderIndex": 1 },
    { "type": "text", "content": " are in the closed position" }
  ]
}
```

### 2. Equipment Reference Storage

The `ZeroEnergy` entity stores:
- `zeroEnergyTemplate` - Reference to the phrase template (Value entity)
- `templateEquipmentIds` - Comma-separated equipment IDs in sorted order (e.g., "112152,112345")

### 3. Substitution Logic (Backend)

When `ZeroEnergyMapper.convertToDto()` or `convertToIdDto()` is called:

1. **Parse JSON**: Extract segments from `zeroEnergyTemplate.alias`
2. **Load Equipment**: Fetch equipment entities by IDs from `templateEquipmentIds`
3. **Build Map**: Create a map of placeholder index → equipment tag number
4. **Substitute**: Iterate through segments and replace placeholders with actual tag numbers

Implementation in [ZeroEnergyMapper.java:147-221](src/main/java/com/dk_power/power_plant_java/mappers/ZeroEnergyMapper.java#L147-L221)

```java
private String buildResolvedMethod(ZeroEnergy entity) {
    // Parse JSON phrase data
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(phraseJson);

    // Load equipment and build tag number map
    Map<Integer, String> placeholderToTagNumber = new HashMap<>();
    for (int i = 0; i < equipmentIds.size(); i++) {
        equipmentService.findById(equipmentIds.get(i)).ifPresent(equipment -> {
            placeholderToTagNumber.put(i, equipment.getTagNumber());
        });
    }

    // Build resolved string
    for (JsonNode segment : segments) {
        if ("text".equals(type)) {
            result.append(content);
        } else if ("placeholder".equals(type)) {
            // Substitute with actual equipment tag number
            result.append(placeholderToTagNumber.get(placeholderIndex));
        }
    }

    return result.toString();
}
```

## Example Flow

### Input Data

**Phrase Template** (stored in Value.alias):
```
"Verify that [tag1] and [tag2] are in the closed position"
```

**Equipment References**:
- Equipment ID 112152 → Tag Number: "V-123"
- Equipment ID 112345 → Tag Number: "V-456"

**ZeroEnergy Entity**:
```java
zeroEnergyTemplate.id = 5
templateEquipmentIds = "112152,112345"
```

### Output (DTO)

When converting to DTO, the `method` field contains:
```
"Verify that V-123 and V-456 are in the closed position"
```

## Fallback Behavior

If equipment cannot be loaded or tag number is missing:
- Placeholder content is used: `[tag1]`, `[tag2]`, etc.

If JSON parsing fails:
- Falls back to raw text from `entity.getMethod()` if available
- Otherwise returns `null`

## Usage in Code

### Converting ZeroEnergy to DTO

```java
ZeroEnergy entity = /* loaded from database */;
ZeroEnergyDto dto = zeroEnergyMapper.convertToDto(entity);

// dto.getMethod() returns:
// "Verify that V-123 and V-456 are in the closed position"
```

### Converting to ID DTO

```java
ZeroEnergyIdDto idDto = zeroEnergyMapper.convertToIdDto(entity);

// idDto.getMethod() also has substituted values
```

## Integration with Deduplication

This substitution works seamlessly with the deduplication pattern:

1. **Create/Update LotoPoint**: Frontend sends equipment IDs
2. **Find or Create**: `NgZeroEnergyService.findOrCreate()` finds/creates ZeroEnergy
3. **Convert to DTO**: Mapper substitutes equipment tag numbers
4. **Return to Client**: Client receives fully resolved method text

## Key Files

- **Entity**: [ZeroEnergy.java](src/main/java/com/dk_power/power_plant_java/entities/loto/ZeroEnergy.java) - Data storage
- **Mapper**: [ZeroEnergyMapper.java](src/main/java/com/dk_power/power_plant_java/mappers/ZeroEnergyMapper.java) - Substitution logic
- **Frontend Component**: [zero-energy-phrase-builder.component.ts](frontend/src/app/shared/reactive-form/refactored/input-fields/zero-energy-phrase-builder/zero-energy-phrase-builder.component.ts) - Phrase creation UI

## Performance Considerations

- Equipment entities are loaded individually in a loop
- For large numbers of placeholders, consider batch loading equipment entities
- Parsing happens on every DTO conversion - could be cached if needed

## Future Enhancements

1. **Batch Equipment Loading**: Load all equipment in one query
2. **Caching**: Cache parsed phrase segments
3. **Validation**: Warn if equipment count doesn't match placeholder count
4. **Rich Substitution**: Support more metadata (description, location, etc.)