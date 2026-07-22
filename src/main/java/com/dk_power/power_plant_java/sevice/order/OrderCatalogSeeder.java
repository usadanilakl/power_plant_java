package com.dk_power.power_plant_java.sevice.order;

import com.dk_power.power_plant_java.dto.order.OrderCatalogItemDto;
import com.dk_power.power_plant_java.dto.order.OrderPresetDto;
import com.dk_power.power_plant_java.dto.order.OrderTextOptionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Seeds the vendor catalog from {@code project/features/users/communication/email/email-reorder.mc}. Idempotent
 * (upsert by itemKey via {@link OrderLedger#saveCatalogItem}), so it is safe to re-run. Triggered on demand
 * (NgOrderingController) rather than hub-gated at boot, because the Ordering feature runs on each desktop's local
 * backend and never as a hub.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderCatalogSeeder {

    private final OrderLedger ledger;

    /** Upsert the curated vendor catalog. Returns the items as seeded. */
    public List<OrderCatalogItemDto> seed() {
        List<OrderCatalogItemDto> items = List.of(
                co2(), hydrogen(), deminTrailers(), deminChemicals(), dieselGasoline());
        for (OrderCatalogItemDto item : items) {
            ledger.saveCatalogItem(item);
            log.info("[OrderCatalogSeeder] upserted catalog item '{}'", item.getItemKey());
        }
        return items;
    }

    private OrderCatalogItemDto co2() {
        return OrderCatalogItemDto.builder()
                .itemKey("co2").displayName("CO2").vendor("MacCarb")
                .contactEmail("dmccarthy@maccarb.com")
                .blanketPoNumber("J25-3572").unit("LBS")
                .defaultQtyPresets(List.of(
                        preset("Mini-bulk tank", null),
                        preset("Fire-protection tank", null)))
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
                .displayName("Demin Plant Chemicals (Bleach, Caustic, Sodium Bisulfite)")
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
                .itemKey("diesel_gasoline").displayName("Diesel / Gasoline").vendor("Blu Petroleum")
                .contactEmail("orders@blupetroleum.com")
                .bodyNote("For diesel, specify \"Ultra Low Sulfur\".")
                .blanketPoNumber("J25-3551").unit("Gallons")
                .defaultQtyPresets(List.of(
                        preset("Diesel cube (small)", 250.0),
                        preset("Diesel cube (large)", 525.0),
                        preset("Gasoline cube", 250.0),
                        preset("DEF cube", 250.0),
                        preset("EDG", null),
                        preset("DFP", null)))
                .textOptions(List.of(
                        seasonal("Winterized fuel (Oct–Apr)", "Please provide winterized fuel.", 10, 4),
                        free()))
                .active(true).sortOrder(5).build();
    }

    private static OrderPresetDto preset(String label, Double qty) {
        return OrderPresetDto.builder().label(label).defaultQty(qty).build();
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
