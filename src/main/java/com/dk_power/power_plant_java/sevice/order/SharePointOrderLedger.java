package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
import com.dk_power.power_plant_java.dto.order.OrderLineDto;
import com.dk_power.power_plant_java.dto.order.OrderPresetDto;
import com.dk_power.power_plant_java.dto.order.OrderRecordDto;
import com.dk_power.power_plant_java.dto.order.OrderTextOptionDto;
import com.dk_power.power_plant_java.dto.order.ReorderSuggestionDto;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointCertificateAccess;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointListProvisioner;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * SharePoint-list implementation of {@link OrderLedger}, using the certificate REST client directly (cert-only, off
 * the CRDT sync bus). Three lists — {@code Orders}, {@code OrderCatalog}, {@code OrderSuggestions} — are declared in
 * {@code SharePointListProvisioner.getAllListDefinitions()} and ensured on first use here. Columns use space-free
 * PascalCase names so the SharePoint internal name equals the Title (no {@code _x0020_} encoding); JSON-shaped columns
 * (lines, presets, text options) are stored in multi-line NOTE columns.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SharePointOrderLedger implements OrderLedger {

    static final String ORDERS_LIST = "Orders";
    static final String CATALOG_LIST = "OrderCatalog";
    static final String SUGGESTIONS_LIST = "OrderSuggestions";

    private final SharePointCertificateAccess sp;
    private final SharePointListProvisioner provisioner;
    private final ObjectMapper mapper;

    private final AtomicBoolean provisioned = new AtomicBoolean(false);

    @Override
    public boolean isAvailable() {
        return sp.isAvailable();
    }

    /** Ensure the three lists + columns exist (idempotent, best-effort). Retries next call if it fails (e.g. offline). */
    private void ensureProvisioned() {
        if (provisioned.get()) return;
        try {
            provisioner.provisionSingle(ORDERS_LIST);
            provisioner.provisionSingle(CATALOG_LIST);
            provisioner.provisionSingle(SUGGESTIONS_LIST);
            provisioned.set(true);
        } catch (Exception e) {
            log.warn("[OrderLedger] list provisioning ensure failed (will retry on next use): {}", e.getMessage());
        }
    }

    // ── Catalog ──────────────────────────────────────────────

    @Override
    public List<OrderCatalogItemDto> listCatalog() {
        ensureProvisioned();
        return sp.getListItems(CATALOG_LIST).stream()
                .map(this::catalogFromNode)
                .sorted(Comparator.comparingInt(c -> c.getSortOrder() == null ? Integer.MAX_VALUE : c.getSortOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public OrderCatalogItemDto saveCatalogItem(OrderCatalogItemDto item) {
        ensureProvisioned();
        Map<String, Object> body = catalogToMap(item);
        String existingId = findCatalogItemId(item.getItemKey());   // SharePoint has no native upsert → read-then-decide
        if (existingId != null) {
            sp.updateListItem(CATALOG_LIST, existingId, body);
            item.setSharepointId(existingId);
        } else {
            item.setSharepointId(sp.createListItem(CATALOG_LIST, body));
        }
        return item;
    }

    @Override
    public void deleteCatalogItem(String itemKey) {
        ensureProvisioned();
        String id = findCatalogItemId(itemKey);
        if (id != null) sp.deleteListItem(CATALOG_LIST, id);
    }

    private String findCatalogItemId(String itemKey) {
        if (isBlank(itemKey)) return null;
        for (JsonNode n : sp.getListItems(CATALOG_LIST, "ItemKey eq '" + odata(itemKey) + "'")) {
            String id = itemId(n);
            if (id != null) return id;
        }
        return null;
    }

    // ── Orders (history) ─────────────────────────────────────

    @Override
    public OrderRecordDto recordOrder(OrderRecordDto order) {
        ensureProvisioned();
        if (isBlank(order.getPwaId())) order.setPwaId(UUID.randomUUID().toString());
        if (isBlank(order.getOrderDate())) order.setOrderDate(LocalDateTime.now().toString());
        order.setSharepointId(sp.createListItem(ORDERS_LIST, orderToMap(order)));
        return order;
    }

    @Override
    public List<OrderRecordDto> listOrders() {
        ensureProvisioned();
        return sp.getListItems(ORDERS_LIST).stream()
                .map(this::orderFromNode)
                .sorted(Comparator.comparing((OrderRecordDto o) -> nz(o.getOrderDate())).reversed())
                .collect(Collectors.toList());
    }

    // ── Reorder suggestions ──────────────────────────────────

    @Override
    public ReorderSuggestionDto addSuggestion(ReorderSuggestionDto s) {
        ensureProvisioned();
        if (isBlank(s.getPwaId())) s.setPwaId(UUID.randomUUID().toString());
        if (isBlank(s.getSuggestedAt())) s.setSuggestedAt(LocalDateTime.now().toString());
        if (isBlank(s.getStatus())) s.setStatus("OPEN");
        s.setSharepointId(sp.createListItem(SUGGESTIONS_LIST, suggestionToMap(s)));
        return s;
    }

    @Override
    public List<ReorderSuggestionDto> listSuggestions(boolean openOnly) {
        ensureProvisioned();
        String filter = openOnly ? "Status eq 'OPEN'" : null;
        return sp.getListItems(SUGGESTIONS_LIST, filter).stream()
                .map(this::suggestionFromNode)
                .sorted(Comparator.comparing((ReorderSuggestionDto s) -> nz(s.getSuggestedAt())).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public ReorderSuggestionDto updateSuggestionStatus(String sharepointId, String status) {
        ensureProvisioned();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Status", orEmpty(status));
        sp.updateListItem(SUGGESTIONS_LIST, sharepointId, body);
        ReorderSuggestionDto dto = new ReorderSuggestionDto();
        dto.setSharepointId(sharepointId);
        dto.setStatus(status);
        return dto;
    }

    // ── mapping: catalog ─────────────────────────────────────

    private Map<String, Object> catalogToMap(OrderCatalogItemDto c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Title", orEmpty(c.getDisplayName()));   // mandatory built-in column
        m.put("ItemKey", orEmpty(c.getItemKey()));
        m.put("DisplayName", orEmpty(c.getDisplayName()));
        m.put("Vendor", orEmpty(c.getVendor()));
        m.put("ContactEmail", orEmpty(c.getContactEmail()));
        m.put("CcEmails", orEmpty(c.getCcEmails()));
        m.put("BodyNote", orEmpty(c.getBodyNote()));
        m.put("BlanketPoNumber", orEmpty(c.getBlanketPoNumber()));
        m.put("Unit", orEmpty(c.getUnit()));
        m.put("DefaultQtyPresets", writeJson(c.getDefaultQtyPresets()));
        m.put("TextOptions", writeJson(c.getTextOptions()));
        m.put("Active", c.isActive());
        m.put("SortOrder", c.getSortOrder() == null ? "" : c.getSortOrder().toString());
        return m;
    }

    private OrderCatalogItemDto catalogFromNode(JsonNode n) {
        return OrderCatalogItemDto.builder()
                .sharepointId(itemId(n))
                .itemKey(txt(n, "ItemKey"))
                .displayName(txt(n, "DisplayName"))
                .vendor(txt(n, "Vendor"))
                .contactEmail(txt(n, "ContactEmail"))
                .ccEmails(txt(n, "CcEmails"))
                .bodyNote(txt(n, "BodyNote"))
                .blanketPoNumber(txt(n, "BlanketPoNumber"))
                .unit(txt(n, "Unit"))
                .defaultQtyPresets(readList(txt(n, "DefaultQtyPresets"), new TypeReference<List<OrderPresetDto>>() {}))
                .textOptions(readList(txt(n, "TextOptions"), new TypeReference<List<OrderTextOptionDto>>() {}))
                .active(n.path("Active").asBoolean(true))
                .sortOrder(parseInt(txt(n, "SortOrder")))
                .build();
    }

    // ── mapping: order ───────────────────────────────────────

    private Map<String, Object> orderToMap(OrderRecordDto o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Title", orEmpty(o.getVendor()) + (isBlank(o.getPoNumber()) ? "" : " — PO " + o.getPoNumber()));
        m.put("PwaId", orEmpty(o.getPwaId()));
        m.put("OrderDate", orEmpty(o.getOrderDate()));
        m.put("OrderedBy", orEmpty(o.getOrderedBy()));
        m.put("Vendor", orEmpty(o.getVendor()));
        m.put("CatalogItemKey", orEmpty(o.getCatalogItemKey()));
        m.put("PoNumber", orEmpty(o.getPoNumber()));
        m.put("Recipient", orEmpty(o.getRecipient()));
        m.put("Cc", orEmpty(o.getCc()));
        m.put("Subject", orEmpty(o.getSubject()));
        m.put("LinesJson", writeJson(o.getLines()));
        m.put("EmailSent", o.isEmailSent());
        m.put("EmailError", orEmpty(o.getEmailError()));
        m.put("SourceSuggestionId", orEmpty(o.getSourceSuggestionId()));
        m.put("Status", orEmpty(o.getStatus()));
        return m;
    }

    private OrderRecordDto orderFromNode(JsonNode n) {
        return OrderRecordDto.builder()
                .sharepointId(itemId(n))
                .pwaId(txt(n, "PwaId"))
                .orderDate(txt(n, "OrderDate"))
                .orderedBy(txt(n, "OrderedBy"))
                .vendor(txt(n, "Vendor"))
                .catalogItemKey(txt(n, "CatalogItemKey"))
                .poNumber(txt(n, "PoNumber"))
                .recipient(txt(n, "Recipient"))
                .cc(txt(n, "Cc"))
                .subject(txt(n, "Subject"))
                .lines(readList(txt(n, "LinesJson"), new TypeReference<List<OrderLineDto>>() {}))
                .emailSent(n.path("EmailSent").asBoolean(false))
                .emailError(txt(n, "EmailError"))
                .sourceSuggestionId(txt(n, "SourceSuggestionId"))
                .status(txt(n, "Status"))
                .build();
    }

    // ── mapping: suggestion ──────────────────────────────────

    private Map<String, Object> suggestionToMap(ReorderSuggestionDto s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Title", orEmpty(s.getCatalogItemKey()));
        m.put("PwaId", orEmpty(s.getPwaId()));
        m.put("SuggestedAt", orEmpty(s.getSuggestedAt()));
        m.put("CatalogItemKey", orEmpty(s.getCatalogItemKey()));
        m.put("Source", orEmpty(s.getSource()));
        m.put("RoundQuestionId", orEmpty(s.getRoundQuestionId()));
        m.put("Reading", orEmpty(s.getReading()));
        m.put("LowLimit", orEmpty(s.getLowLimit()));
        m.put("SuggestedQty", orEmpty(s.getSuggestedQty()));
        m.put("Reason", orEmpty(s.getReason()));
        m.put("Status", orEmpty(s.getStatus()));
        m.put("ResultingOrderId", orEmpty(s.getResultingOrderId()));
        return m;
    }

    private ReorderSuggestionDto suggestionFromNode(JsonNode n) {
        return ReorderSuggestionDto.builder()
                .sharepointId(itemId(n))
                .pwaId(txt(n, "PwaId"))
                .suggestedAt(txt(n, "SuggestedAt"))
                .catalogItemKey(txt(n, "CatalogItemKey"))
                .source(txt(n, "Source"))
                .roundQuestionId(txt(n, "RoundQuestionId"))
                .reading(txt(n, "Reading"))
                .lowLimit(txt(n, "LowLimit"))
                .suggestedQty(txt(n, "SuggestedQty"))
                .reason(txt(n, "Reason"))
                .status(txt(n, "Status"))
                .resultingOrderId(txt(n, "ResultingOrderId"))
                .build();
    }

    // ── helpers ──────────────────────────────────────────────

    private String writeJson(Object o) {
        try {
            return o == null ? "" : mapper.writeValueAsString(o);
        } catch (Exception e) {
            log.warn("[OrderLedger] JSON serialize failed: {}", e.getMessage());
            return "";
        }
    }

    private <T> List<T> readList(String json, TypeReference<List<T>> type) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return mapper.readValue(json, type);
        } catch (Exception e) {
            log.warn("[OrderLedger] JSON parse failed: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private static String itemId(JsonNode n) {
        return n.path("ID").asText(n.path("Id").asText(null));
    }

    private static String txt(JsonNode n, String field) {
        return n.path(field).asText(null);
    }

    private static Integer parseInt(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String orEmpty(String s) { return s == null ? "" : s; }
    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private static String nz(String s) { return s == null ? "" : s; }
    /** Escape a value for embedding in an OData string literal ('' = literal apostrophe). */
    private static String odata(String s) { return s.replace("'", "''"); }
}
