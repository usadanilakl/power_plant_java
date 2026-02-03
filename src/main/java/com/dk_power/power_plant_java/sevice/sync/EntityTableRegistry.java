package com.dk_power.power_plant_java.sevice.sync;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Central registry for entity type to database table name mappings.
 * Consolidates mappings that were previously duplicated across services.
 *
 * This handles entities with custom @Table annotations and provides
 * consistent mapping for sync operations, health checks, and full syncs.
 */
@Component
public class EntityTableRegistry {

    /**
     * Map of entity type name to database table name.
     * Table names are verified from @Table annotations in entity classes.
     */
    private static final Map<String, String> ENTITY_TYPE_TO_TABLE = Map.ofEntries(
        // Categories
        Map.entry("Category", "category"),
        Map.entry("Value", "val_table"),           // @Table(name = "val_table")

        // Files
        Map.entry("FileObject", "file_object"),

        // Equipment
        Map.entry("Equipment", "equipment"),
        Map.entry("HeatTrace", "heat_trace"),
        Map.entry("Highlight", "highlight"),
        Map.entry("ElectricalPanel", "electrical_panel"),
        Map.entry("EqBreaker", "eq_breaker"),
        Map.entry("HtPanel", "ht_panel"),
        Map.entry("HtBreaker", "ht_breaker"),

        // LOTO
        Map.entry("LotoPoint", "loto_point"),
        Map.entry("Loto", "loto"),
        Map.entry("LotoStandard", "loto_standard"),
        Map.entry("LotoSnapshot", "loto_snapshot"),
        Map.entry("LotoBox", "loto_boxes"),        // @Table(name = "loto_boxes")
        Map.entry("Lock", "lock"),
        Map.entry("ZeroEnergy", "zero_energy"),

        // Users
        Map.entry("User", "users"),                // @Table(name = "users")
        Map.entry("Role", "roles"),                // @Table(name = "roles")

        // ESP
        Map.entry("EspDevice", "esp_devices"),     // @Table(name = "esp_devices")
        Map.entry("LedStrip", "led_strips"),       // @Table(name = "led_strips")

        // Permits
        Map.entry("SafeWork", "safe_work"),
        Map.entry("HotWork", "hot_work"),          // @Table(name = "hot_work")
        Map.entry("ConfinedSpace", "confined_space"), // @Table(name = "confined_space")
        Map.entry("WorkRequest", "work_request"),  // @Table(name = "work_request")
        Map.entry("DailyPermitPackage", "daily_permit_package"),

        // Comments
        Map.entry("Comment", "comment")
    );

    /**
     * Entity types in dependency order for syncing.
     * Categories and Values first (base entities), then entities that reference them.
     */
    public static final List<String> SYNC_ORDER = List.of(
        "Category",
        "Value",
        "Comment",
        "User",
        "FileObject",
        "Equipment",
        "LotoPoint",
        "Loto",
        "LotoStandard",
        "LotoSnapshot",
        "LotoBox",
        "Lock",
        "ZeroEnergy",
        "HeatTrace",
        "Highlight",
        "ElectricalPanel",
        "EqBreaker",
        "HtPanel",
        "HtBreaker",
        "EspDevice",
        "LedStrip",
        "SafeWork",
        "HotWork",
        "ConfinedSpace",
        "WorkRequest",
        "DailyPermitPackage"
    );

    /**
     * Get the database table name for an entity type.
     *
     * @param entityType The entity type name (e.g., "FileObject", "Value")
     * @return The database table name
     */
    public String getTableName(String entityType) {
        String tableName = ENTITY_TYPE_TO_TABLE.get(entityType);
        if (tableName != null) {
            return tableName;
        }
        // Fallback: Convert CamelCase to snake_case for unknown entities
        return entityType.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    /**
     * Get all registered entity types.
     *
     * @return Set of all entity type names
     */
    public Set<String> getAllEntityTypes() {
        return ENTITY_TYPE_TO_TABLE.keySet();
    }

    /**
     * Get the entity type to table name map.
     *
     * @return Unmodifiable map of entity types to table names
     */
    public Map<String, String> getEntityTypeToTableMap() {
        return ENTITY_TYPE_TO_TABLE;
    }

    /**
     * Get entity types in sync order.
     *
     * @return List of entity types in dependency order
     */
    public List<String> getSyncOrder() {
        return SYNC_ORDER;
    }

    /**
     * Check if an entity type is registered.
     *
     * @param entityType The entity type to check
     * @return true if the entity type is registered
     */
    public boolean isRegistered(String entityType) {
        return ENTITY_TYPE_TO_TABLE.containsKey(entityType);
    }
}
