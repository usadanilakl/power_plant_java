package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
import com.dk_power.power_plant_java.dto.order.OrderPresetDto;
import com.dk_power.power_plant_java.dto.order.OrderTextOptionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Seeds the vendor catalog from {@code project/features/users/communication/email/email-reorder.mc}. Creates
 * ONLY the items that don't exist yet — it never overwrites an existing item, so manual edits (vendor emails, PO#s,
 * tank capacities set in Catalog Admin) survive a re-seed. Triggered on demand (NgOrderingController) rather than
 * hub-gated at boot, because the Ordering feature runs on each desktop's local backend and never as a hub.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderCatalogSeeder {

    private final OrderLedger ledger;

    /** Create any missing catalog items (leaving existing ones — and their manual edits — untouched). Returns those created. */
    public List<OrderCatalogItemDto> seed() {
        Set<String> existing = ledger.listCatalog().stream()
                .map(OrderCatalogItemDto::getItemKey)
                .filter(k -> k != null)
                .collect(Collectors.toSet());
        List<OrderCatalogItemDto> defaults = List.of(
                co2(), hydrogen(), deminTrailers(), deminChemicals(), dieselGasoline(), labReagents());
        List<OrderCatalogItemDto> created = new ArrayList<>();
        for (OrderCatalogItemDto item : defaults) {
            if (existing.contains(item.getItemKey())) {
                log.info("[OrderCatalogSeeder] '{}' already exists — preserving manual edits", item.getItemKey());
                continue;
            }
            created.add(ledger.saveCatalogItem(item));
            log.info("[OrderCatalogSeeder] seeded catalog item '{}'", item.getItemKey());
        }
        return created;
    }

    private OrderCatalogItemDto co2() {
        // FILL: order = sum(capacity − current level) across the CO2 tanks. Capacities set in Catalog Admin (unknown here).
        return OrderCatalogItemDto.builder()
                .itemKey("co2").displayName("CO2").vendor("MacCarb")
                .contactEmail("dmccarthy@maccarb.com")
                .blanketPoNumber("J25-3572").unit("LBS")
                .orderMode("FILL")
                .defaultQtyPresets(List.of(
                        tank("Mini-bulk tank", null, "CO2"),
                        tank("Fire-protection tank", null, "CO2")))
                .textOptions(List.of(free()))
                .active(true).sortOrder(1).build();
    }

    private OrderCatalogItemDto hydrogen() {
        return OrderCatalogItemDto.builder()
                .itemKey("hydrogen").displayName("Hydrogen").vendor("Airgas")
                .contactEmail("michael.flanigan@airgas.com")
                .blanketPoNumber("J25-3579")
                .textOptions(List.of(
                        fixed("Trailer swap", "One of the trailers is empty and it needs to be swapped out."),
                        free()))
                .active(true).sortOrder(2).build();
    }

    private OrderCatalogItemDto deminTrailers() {
        // Contact is TBD in the spec — seed inactive so it can't be ordered until a vendor email is set.
        return OrderCatalogItemDto.builder()
                .itemKey("demin_trailers").displayName("Demin Trailers / Polishers").vendor("TBD")
                .blanketPoNumber("J25-3580")
                .active(false).sortOrder(3).build();
    }

    private OrderCatalogItemDto deminChemicals() {
        return OrderCatalogItemDto.builder()
                .itemKey("demin_chemicals")
                .displayName("Bleach, Caustic, Sodium Bisulfite")
                .vendor("Univar Solutions")
                .contactEmail("CustSol-BCDMB@univarsolutions.com")
                .ccEmails("Kevin.kornblith@univarsolutions.com")
                .bodyNote("Tag @Greg Voigt in body of message")
                .blanketPoNumber("J25-3574").unit("Gallons")
                .defaultQtyPresets(List.of(
                        preset("Bleach", null),
                        preset("Caustic", null),
                        preset("Sodium Bisulfite", null)))
                .textOptions(List.of(free()))
                .active(true).sortOrder(4).build();
    }

    private OrderCatalogItemDto dieselGasoline() {
        return OrderCatalogItemDto.builder()
                .itemKey("diesel_gasoline").displayName("Diesel, Gasoline, DEF").vendor("Blu Petroleum")
                .contactEmail("orders@blupetroleum.com")
                .bodyNote("For diesel, specify \"Ultra Low Sulfur\".")
                .blanketPoNumber("J25-3551").unit("Gallons")
                .orderMode("FILL")
                .defaultQtyPresets(List.of(
                        tank("Diesel cube (small)", 250.0, "Diesel"),
                        tank("Diesel cube (large)", 525.0, "Diesel"),
                        tank("EDG", null, "Diesel"),
                        tank("DFP", null, "Diesel"),
                        tank("Gasoline cube", 250.0, "Gasoline"),
                        tank("DEF cube", 250.0, "DEF")))
                .textOptions(List.of(
                        seasonal("Winterized fuel (Oct–Apr)", "Please provide winterized fuel.", 10, 4),
                        free()))
                .active(true).sortOrder(5).build();
    }

    /**
     * Lab reagents (Hach) — the reagent list from the CHEM_LAB_INVENTORY Maximo form, as quick-add presets. Seeded
     * INACTIVE: the vendor order email + PO live in the Maximo form's cfg_* today, so set them in Catalog Admin and
     * toggle Active to order from here. (Lab orders placed from the Maximo inventory PM are recorded to the ledger
     * under this same {@code lab_reagents} key, so they show in Order History either way.)
     */
    private OrderCatalogItemDto labReagents() {
        return OrderCatalogItemDto.builder()
                .itemKey("lab_reagents").displayName("Lab Reagents").vendor("Hach")
                .active(false)
                .defaultQtyPresets(List.of(
                        preset("FerroZine Iron Reagent (230149), 500 mL", null),
                        preset("DPD Free Chlorine Powder Pillows (2105569), 100 packets", null),
                        preset("DPD Total Chlorine Powder Pillows (2105669), 100 packets", null),
                        preset("Molybdate 3 Reagent Solution (199532), 100 mL", null),
                        preset("Citric Acid Reagent Solution (2254232), 100 mL", null),
                        preset("Amino Acid F Reagent (2386442), 100 mL", null),
                        preset("pH 4.0 Standard (2283449), 500 mL", null),
                        preset("pH 7.0 Standard (2283549), 500 mL", null),
                        preset("pH 10.0 Standard (2283649), 500 mL", null),
                        preset("1000 mS Conductivity Standard (1440026), 500 mL", null),
                        preset("1.0 mg/L Iron Standard (13949), 500 mL", null),
                        preset("1.0 mg/L Silica Standard (110649), 500 mL", null),
                        preset("pH Storage Solution (2756549), 500 mL", null),
                        preset("Silica Analyzer reagent - Yellow", null),
                        preset("Silica Analyzer reagent - Blue", null),
                        preset("Silica Analyzer reagent - Green", null),
                        preset("Silica Analyzer reagent - Red", null),
                        preset("Silica Analyzer reagent - Powder", null)))
                .textOptions(List.of(free()))
                .sortOrder(6).build();
    }

    private static OrderPresetDto preset(String label, Double qty) {
        return OrderPresetDto.builder().label(label).defaultQty(qty).build();
    }

    /** A FILL-mode equipment/tank preset: a fixed {@code capacity} of a {@code product}. */
    private static OrderPresetDto tank(String label, Double capacity, String product) {
        return OrderPresetDto.builder().label(label).capacity(capacity).product(product).build();
    }

    private static OrderTextOptionDto free() {
        return OrderTextOptionDto.builder().kind("FREE").label("Additional notes").build();
    }

    private static OrderTextOptionDto fixed(String label, String text) {
        return OrderTextOptionDto.builder().kind("FIXED").label(label).text(text).build();
    }

    private static OrderTextOptionDto seasonal(String label, String text, int monthFrom, int monthTo) {
        return OrderTextOptionDto.builder().kind("SEASONAL").label(label).text(text)
                .monthFrom(monthFrom).monthTo(monthTo).build();
    }
}
