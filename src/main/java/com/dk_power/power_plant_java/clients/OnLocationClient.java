package com.dk_power.power_plant_java.clients;

import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Hub-only fetcher for the OnLocation (WhosOnLocation) contractor directory.
 *
 * Mirrors {@code electron-manager/src/main/managers/gate-log.manager.ts} so the
 * hub can independently reconcile contractors against the local User table on a
 * schedule, with Electron unavailable.
 *
 * Activated only when {@code onlocation.api.key} is configured — non-hub
 * deployments do not need this bean.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "onlocation.api.key")
public class OnLocationClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String baseUrl;
    /** Numeric id of the OnLocation custom field holding the employer name (tenant-specific). */
    private final String companyFieldId;

    public OnLocationClient(@Value("${onlocation.api.key}") String apiKey,
                            @Value("${onlocation.base.url:https://api.whosonlocation.com/v1}") String baseUrl,
                            @Value("${onlocation.company.customfield.id:3135}") String companyFieldId) {
        this.apiKey = apiKey;
        this.companyFieldId = companyFieldId;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    /**
     * Pull the full contractor directory and enrich each entry with its primary
     * org/company name. One row per OnLocation member.
     */
    public List<ContractorDto> getContractors() {
        JsonNode members = get("/sp/member");
        List<JsonNode> memberList = unwrap(members);
        List<ContractorDto> result = new ArrayList<>(memberList.size());

        for (JsonNode m : memberList) {
            String id = asText(m, "id");
            if (id == null) continue;
            result.add(ContractorDto.builder()
                    .onLocationMemberId(id)
                    .name(extractName(m))
                    .email(coalesce(asText(m, "email"), asText(m, "altemail")))
                    .phone(coalesce(asText(m, "mobile"), asText(m, "phone")))
                    .company(extractCompany(m))
                    .title(asText(m, "title"))
                    .validFrom(asText(m, "valid_from"))
                    .validTo(asText(m, "valid_to"))
                    .status(asText(m, "status"))
                    .build());
        }
        log.info("[OnLocation] Fetched {} contractors", result.size());
        return result;
    }

    private JsonNode get(String path) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "APIKEY " + apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> req = new HttpEntity<>(headers);
        ResponseEntity<String> resp = restTemplate.exchange(baseUrl + path, HttpMethod.GET, req, String.class);
        try {
            return objectMapper.readTree(resp.getBody());
        } catch (Exception e) {
            throw new RuntimeException("OnLocation parse failed for " + path + ": " + e.getMessage(), e);
        }
    }

    /** OnLocation responses are usually a single-key wrapper around the array. */
    private List<JsonNode> unwrap(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return List.of();
        if (node.isArray()) return toList(node);
        Iterator<String> it = node.fieldNames();
        while (it.hasNext()) {
            JsonNode child = node.get(it.next());
            if (child != null && child.isArray()) return toList(child);
        }
        return List.of();
    }

    private List<JsonNode> toList(JsonNode array) {
        List<JsonNode> out = new ArrayList<>();
        array.forEach(out::add);
        return out;
    }

    private String extractName(JsonNode member) {
        String name = asText(member, "name");
        if (name != null && !name.isBlank()) return name;
        String first = asText(member, "first_name");
        String last = asText(member, "last_name");
        return firstNonBlank(combine(first, last), "Unknown");
    }

    /**
     * The contractor's employer.
     *
     * <p>NOT {@code sp_orgs} — that is the OnLocation *organization*, which for this tenant is the
     * site itself: all 1764 members return "Jackson Generation", so using it made the column
     * meaningless (and newer members carry an empty {@code sp_orgs} anyway). The employer lives in a
     * per-tenant custom field, keyed by numeric id in the {@code customfields} object.
     *
     * <p>Returns null rather than a filler like "Contractor" when unset: most records are still
     * blank in OnLocation, and a blank cell reads as "not recorded" while "Contractor" reads as a
     * real answer.
     */
    private String extractCompany(JsonNode member) {
        JsonNode custom = member.get("customfields");
        if (custom != null && custom.isObject()) {
            String value = asText(custom, companyFieldId);
            if (value != null) return value;
        }
        return asText(member, "company");
    }

    private static String asText(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode child = node.get(field);
        if (child == null || child.isNull()) return null;
        String v = child.asText(null);
        return (v == null || v.isBlank()) ? null : v;
    }

    private static String combine(String a, String b) {
        if (a == null && b == null) return null;
        return ((a == null ? "" : a) + " " + (b == null ? "" : b)).trim();
    }

    private static String coalesce(String... vals) {
        for (String v : vals) if (v != null && !v.isBlank()) return v;
        return null;
    }

    private static String firstNonBlank(String... vals) {
        return coalesce(vals);
    }
}
