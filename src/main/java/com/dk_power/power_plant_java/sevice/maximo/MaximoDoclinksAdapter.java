package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoDoclinkDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.longVal;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;

/**
 * Doclinks (attachments) on a parent record (asset / SR / WO).
 * Maximo exposes them at "{parent}/{href}/doclinks". Upload is multipart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoDoclinksAdapter {

    private final MaximoAccessService access;

    public List<MaximoDoclinkDto> list(String parentObjectStructure, String parentHref) {
        String url = access.subUrl(parentObjectStructure, parentHref, "doclinks");
        Map<String, Object> body = access.getMap(url, null);
        return mapAll(members(body));
    }

    /**
     * Upload a file as a doclink on the parent record.
     *
     * @param parentObjectStructure e.g. "mxasset", "mxapisr", "mxapiwodetail"
     * @param parentHref            href id of the parent record
     * @param fileName              display name (also used as filename)
     * @param contentType           MIME type ("application/pdf", "image/png", etc.)
     * @param bytes                 file bytes
     * @param doctype               Maximo doctype/category (e.g. "Attachments"); null = Maximo default
     * @return the freshly-created doclink record
     */
    public MaximoDoclinkDto upload(String parentObjectStructure,
                                   String parentHref,
                                   String fileName,
                                   String contentType,
                                   byte[] bytes,
                                   String doctype) {
        String url = access.subUrl(parentObjectStructure, parentHref, "doclinks");

        ByteArrayResource fileResource = new ByteArrayResource(bytes) {
            @Override public String getFilename() { return fileName; }
        };

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.parseMediaType(
                contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE));

        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("uploadfile", new HttpEntity<>(fileResource, fileHeaders));
        parts.add("urlname", fileName);
        if (doctype != null && !doctype.isBlank()) parts.add("doctype", doctype);

        HttpHeaders multipartHeaders = new HttpHeaders();
        multipartHeaders.setContentType(MediaType.MULTIPART_FORM_DATA);
        multipartHeaders.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        multipartHeaders.set("Properties", "*");

        Map<String, Object> created = access.postMultipart(url,
                new HttpEntity<>(parts, multipartHeaders));
        log.info("[Maximo] Uploaded doclink to {}/{} name={}", parentObjectStructure, parentHref, fileName);
        return map(created);
    }

    /** Download a doclink's bytes by following its serve URL. */
    public byte[] download(MaximoDoclinkDto doclink) {
        if (doclink == null || doclink.getUrl() == null) return new byte[0];
        return access.getBytes(doclink.getUrl());
    }

    private List<MaximoDoclinkDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoDoclinkDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoDoclinkDto map(Map<String, Object> row) {
        MaximoDoclinkDto d = new MaximoDoclinkDto();
        d.setHref(hrefId(row));
        d.setDocument(str(row, "document"));
        d.setDescription(str(row, "description"));
        d.setUrlname(str(row, "urlname"));
        d.setUrl(str(row, "url"));
        d.setUrltype(str(row, "urltype"));
        d.setDoctype(str(row, "doctype"));
        d.setDoclinksid(longVal(row, "doclinksid"));
        return d;
    }
}
