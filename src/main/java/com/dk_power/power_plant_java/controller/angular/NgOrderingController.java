package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
import com.dk_power.power_plant_java.dto.order.OrderPreviewDto;
import com.dk_power.power_plant_java.dto.order.OrderRecordDto;
import com.dk_power.power_plant_java.dto.order.PlaceOrderRequestDto;
import com.dk_power.power_plant_java.dto.order.ReorderSuggestionDto;
import com.dk_power.power_plant_java.sevice.order.OrderCatalogSeeder;
import com.dk_power.power_plant_java.sevice.order.OrderLedger;
import com.dk_power.power_plant_java.sevice.order.OrderingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Ordering feature — Stage 2 surface: read the catalog / order history / suggestions and seed the catalog.
 * The Place-Order + catalog-admin write flows land in Stage 3. Reads/writes go through the hub-independent
 * {@link OrderLedger} (SharePoint certificate REST). Access gating (fullAccessGuard) is applied on the frontend route.
 */
@Slf4j
@RestController
@RequestMapping("/ng/ordering")
@RequiredArgsConstructor
public class NgOrderingController {

    private final OrderLedger ledger;
    private final OrderCatalogSeeder seeder;
    private final OrderingService orderingService;

    /** Whether the ordering ledger (SharePoint) is reachable right now. */
    @GetMapping("/status")
    public ResponseEntity<NgApiResponse<Boolean>> status() {
        return ResponseEntity.ok(new NgApiResponse<>(ledger.isAvailable(), "ok"));
    }

    /** Idempotent upsert of the curated vendor catalog from email-reorder.mc. */
    @PostMapping("/catalog/seed")
    public ResponseEntity<NgApiResponse<List<OrderCatalogItemDto>>> seedCatalog() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(seeder.seed(), "seeded"));
        } catch (Exception e) {
            log.warn("[Ordering] catalog seed failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/catalog")
    public ResponseEntity<NgApiResponse<List<OrderCatalogItemDto>>> catalog() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ledger.listCatalog(), "ok"));
        } catch (Exception e) {
            log.warn("[Ordering] list catalog failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<NgApiResponse<List<OrderRecordDto>>> orders() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ledger.listOrders(), "ok"));
        } catch (Exception e) {
            log.warn("[Ordering] list orders failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<NgApiResponse<List<ReorderSuggestionDto>>> suggestions(
            @RequestParam(name = "openOnly", defaultValue = "true") boolean openOnly) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ledger.listSuggestions(openOnly), "ok"));
        } catch (Exception e) {
            log.warn("[Ordering] list suggestions failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Dry-run: render exactly what would be sent (subject/recipients/body) without sending. */
    @PostMapping("/place-order/preview")
    public ResponseEntity<NgApiResponse<OrderPreviewDto>> previewOrder(@RequestBody PlaceOrderRequestDto req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(orderingService.preview(req), "ok"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.warn("[Ordering] preview failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Place a vendor order: compose + send the email and record it to the ledger. Caller confirms first. */
    @PostMapping("/place-order")
    public ResponseEntity<NgApiResponse<OrderRecordDto>> placeOrder(@RequestBody PlaceOrderRequestDto req) {
        try {
            OrderRecordDto record = orderingService.placeOrder(req);
            return ResponseEntity.ok(new NgApiResponse<>(record, record.isEmailSent() ? "sent" : "not-sent"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.warn("[Ordering] place-order failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Create or update a catalog item (upsert by itemKey) — catalog admin editor. */
    @PostMapping("/catalog")
    public ResponseEntity<NgApiResponse<OrderCatalogItemDto>> saveCatalogItem(@RequestBody OrderCatalogItemDto item) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ledger.saveCatalogItem(item), "saved"));
        } catch (Exception e) {
            log.warn("[Ordering] save catalog item failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/catalog/{itemKey}")
    public ResponseEntity<NgApiResponse<String>> deleteCatalogItem(@PathVariable String itemKey) {
        try {
            ledger.deleteCatalogItem(itemKey);
            return ResponseEntity.ok(new NgApiResponse<>(itemKey, "deleted"));
        } catch (Exception e) {
            log.warn("[Ordering] delete catalog item failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Update a reorder suggestion's status (e.g. DISMISSED). */
    @PostMapping("/suggestions/{id}/status")
    public ResponseEntity<NgApiResponse<ReorderSuggestionDto>> updateSuggestionStatus(
            @PathVariable String id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ledger.updateSuggestionStatus(id, status), "ok"));
        } catch (Exception e) {
            log.warn("[Ordering] update suggestion status failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
