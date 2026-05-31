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

    public OnLocationClient(@Value("${onlocation.api.key}") String apiKey,
                            @Value("${onlocation.base.url:https://api.whosonlocation.com/v1}") String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    /**
     * Pull the full contractor directory and enrich each entry with its primary
     * org/company name. One row per OnLocation member.
     */
    public List<ContractorDto> getContractors() {
        JsonNode members = get("/sp/member");
        JsonNode orgs = get("/sp/org");

        Map<String, String> orgNames = indexOrgs(orgs);
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
                    .company(extractCompany(m, orgNames))
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

    private Map<String, String> indexOrgs(JsonNode orgs) {
        Map<String, String> map = new HashMap<>();
        for (JsonNode o : unwrap(orgs)) {
            String id = asText(o, "id");
            String name = firstNonBlank(asText(o, "name"), asText(o, "company_name"), asText(o, "org_name"));
            if (id != null && name != null) map.put(id, name);
        }
        return map;
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

    private String extractCompany(JsonNode member, Map<String, String> orgNames) {
        JsonNode spOrgs = member.get("sp_orgs");
        if (spOrgs != null && spOrgs.isArray() && spOrgs.size() > 0) {
            JsonNode primary = spOrgs.get(0);
            String embedded = asText(primary, "name");
            if (embedded != null && !embedded.isBlank()) return embedded;
            String embeddedId = asText(primary, "id");
            if (embeddedId != null && orgNames.containsKey(embeddedId)) return orgNames.get(embeddedId);
        }
        return firstNonBlank(asText(member, "company"), "Contractor");
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
