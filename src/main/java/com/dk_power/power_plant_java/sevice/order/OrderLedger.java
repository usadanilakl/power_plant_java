package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
import com.dk_power.power_plant_java.dto.order.OrderRecordDto;
import com.dk_power.power_plant_java.dto.order.ReorderSuggestionDto;

import java.util.List;

/**
 * The hub-independent store for the Ordering feature: vendor catalog, order history, and reorder suggestions.
 * Intentionally NOT the CRDT sync bus — the backing store is an M365 cloud ledger reachable from any desktop's
 * local backend, so history + catalog are consistent across machines without the plant hub.
 * The recommended implementation is {@link SharePointOrderLedger} (certificate REST); the interface leaves room
 * for a mailbox-backed alternative.
 */
public interface OrderLedger {

    /** Whether the backing store is currently reachable. */
    boolean isAvailable();

    // ── Catalog ──────────────────────────────────────────────
    List<OrderCatalogItemDto> listCatalog();

    /** Look up one catalog item by its stable {@code itemKey}, or null. */
    default OrderCatalogItemDto getCatalogItem(String itemKey) {
        if (itemKey == null) return null;
        return listCatalog().stream()
                .filter(c -> itemKey.equals(c.getItemKey()))
                .findFirst()
                .orElse(null);
    }

    /** Idempotent upsert by {@code itemKey}. */
    OrderCatalogItemDto saveCatalogItem(OrderCatalogItemDto item);

    void deleteCatalogItem(String itemKey);

    // ── Orders (history) ─────────────────────────────────────
    /** Append a placed order to the ledger; stamps id/date if absent. */
    OrderRecordDto recordOrder(OrderRecordDto order);

    /** Order history, newest first. */
    List<OrderRecordDto> listOrders();

    // ── Reorder suggestions ──────────────────────────────────
    ReorderSuggestionDto addSuggestion(ReorderSuggestionDto suggestion);

    List<ReorderSuggestionDto> listSuggestions(boolean openOnly);

    ReorderSuggestionDto updateSuggestionStatus(String sharepointId, String status);
}
