package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Cross-source aggregations that combine local User data with Maximo queries.
 * Today: only "WOs assigned to Lead Operators". Future bundles (open SRs for a
 * crew, WOs for an asset group, etc.) plug in here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoBundleService {

    public static final String LEAD_OPERATOR_ROLE = "LEAD_OPERATOR";

    private final UserRepo userRepo;
    private final MaximoWorkOrderAdapter workOrders;

    /**
     * All active local users whose role list contains LEAD_OPERATOR.
     * Filtering happens in memory because `users.role` is a comma-separated string —
     * JPA can't do an exact match on a substring without a brittle LIKE clause.
     */
    public List<User> leadOperators() {
        return userRepo.findByIsActiveTrue().stream()
                .filter(u -> u.hasRole(LEAD_OPERATOR_ROLE))
                .sorted(Comparator.comparing(
                        u -> u.getName() == null ? "" : u.getName().toLowerCase()))
                .collect(Collectors.toList());
    }

    /**
     * All work orders Maximo has assigned to ANY Lead Operator (by `spi:lead`).
     * Single Maximo call via OSLC `in [...]`. Returns empty list if no Lead Operators
     * exist locally or none have a Maximo personid.
     *
     * @param status optional Maximo status filter (e.g. "APPR"); null/blank = all statuses
     */
    public List<MaximoWorkOrderDto> leadOperatorWorkOrders(int pageSize, String status) {
        List<String> personIds = leadOperators().stream()
                .map(User::getMaximoPersonid)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
        if (personIds.isEmpty()) {
            log.debug("[Bundle] No Lead Operators have a Maximo personid; returning empty list");
            return List.of();
        }
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setLeadIn(personIds);
        if (status != null && !status.isBlank()) c.setStatus(status);
        return workOrders.listByCriteria(c, pageSize);
    }

    /** Back-compat: no status filter. */
    public List<MaximoWorkOrderDto> leadOperatorWorkOrders(int pageSize) {
        return leadOperatorWorkOrders(pageSize, null);
    }
}
