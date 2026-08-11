package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoDoclinkDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.describedBy;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.hrefId;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.longVal;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.str;
import static com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.strRaw;

/**
 * Doclinks (attachments) on a parent record (asset / SR / WO).
 * Maximo exposes them at "{parent}/{href}/doclinks". Upload is multipart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MaximoDoclinksAdapter {

    private final MaximoAccessService access;
    private final HeicImageConverter heicConverter;

    public List<MaximoDoclinkDto> list(String parentObjectStructure, String parentHref) {
        String url = access.subUrl(parentObjectStructure, parentHref, "doclinks");
        Map<String, Object> body = access.getMap(url, null);
        return mapAll(members(body));
    }

    /**
     * Upload a file as a doclink on the parent record.
     *
     * On this Maximo instance, the multipart upload endpoint NPEs (BMXAA1649E). The OSLC
     * binary-body upload works: file bytes go in the request body, headers carry the
     * filename ("slug") and doctype ("x-document-meta" — plain string, NOT JSON despite
     * the header name suggesting otherwise). Maximo's 201 response has an empty body and
     * the new doclink URL in Location, so we parse the id from there.
     *
     * @param parentObjectStructure e.g. "mxasset", "mxapisr", "mxapiwodetail"
     * @param parentHref            href id of the parent record
     * @param fileName              display name (also used as the slug filename)
     * @param contentType           MIME type ("application/pdf", "image/png", etc.)
     * @param bytes                 file bytes
     * @param doctype               Maximo doctype (Document Folder); REQUIRED, defaults to "Attachments" if blank
     * @return a stub doclink with id, filename, doctype, mime, size populated.
     *         Call list(...) afterwards to get full metadata if needed.
     */
    public MaximoDoclinkDto upload(String parentObjectStructure,
                                   String parentHref,
                                   String fileName,
                                   String contentType,
                                   byte[] bytes,
                                   String doctype) {
        // iPhone HEIC → JPEG (Maximo rejects HEIC + it won't render off-Apple). No-op for anything else.
        HeicImageConverter.Result conv = heicConverter.ensureJpeg(bytes, fileName, contentType);
        bytes = conv.bytes();
        fileName = conv.fileName();
        contentType = conv.contentType();

        String url = access.subUrl(parentObjectStructure, parentHref, "doclinks");
        String mime = (contentType != null && !contentType.isBlank())
                ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        String docFolder = (doctype != null && !doctype.isBlank()) ? doctype : "Attachments";

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType(mime));
        h.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        h.set("slug", fileName);
        h.set("x-document-meta", docFolder);

        ResponseEntity<Void> resp = access.postBinary(url, bytes, h);
        String docId = extractIdFromLocation(resp.getHeaders().getFirst(HttpHeaders.LOCATION));
        // A real doclink create answers 201 with the new URL in Location. A 2xx with no Location means Maximo
        // did NOT persist an attachment — fail loudly rather than return a stub the caller reports as "uploaded".
        if (docId == null || docId.isBlank()) {
            throw new IllegalStateException("Maximo accepted the request but created no attachment (no Location) on "
                    + parentObjectStructure + "/" + parentHref + " — the object structure may not expose doclinks.");
        }
        log.info("[Maximo] Uploaded doclink to {}/{} name={} id={}", parentObjectStructure, parentHref, fileName, docId);

        MaximoDoclinkDto d = new MaximoDoclinkDto();
        d.setHref(docId);
        d.setUrlname(fileName);
        d.setDoctype(docFolder);
        d.setUrltype("FILE");
        d.setMimeType(mime);
        d.setSize((long) bytes.length);
        return d;
    }

    /** Last segment of "https://.../doclinks/21974" → "21974". */
    private static String extractIdFromLocation(String location) {
        if (location == null) return null;
        int slash = location.lastIndexOf('/');
        return slash >= 0 ? location.substring(slash + 1) : location;
    }

    /** Download a doclink's bytes by following its serve URL. */
    public byte[] download(MaximoDoclinkDto doclink) {
        if (doclink == null || doclink.getUrl() == null) return new byte[0];
        return access.getBytes(doclink.getUrl());
    }

    /**
     * Stream a doclink's binary along with its content-type/length headers.
     * Maximo serves the binary at "{parent}/{parentHref}/doclinks/{doclinkId}".
     */
    public org.springframework.http.ResponseEntity<byte[]> streamBinary(
            String parentObjectStructure, String parentHref, String doclinkId) {
        String url = access.subUrl(parentObjectStructure, parentHref, "doclinks") + "/" + doclinkId;
        return access.getBinaryWithHeaders(url);
    }

    private List<MaximoDoclinkDto> mapAll(List<Map<String, Object>> rows) {
        List<MaximoDoclinkDto> out = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) out.add(map(row));
        return out;
    }

    private MaximoDoclinkDto map(Map<String, Object> row) {
        // Doclink records have a top-level row with rdf:about (resource URL whose last segment is the doclink id),
        // and the actual metadata one level deep inside "wdrs:describedBy".
        Map<String, Object> meta = describedBy(row);

        MaximoDoclinkDto d = new MaximoDoclinkDto();
        d.setHref(hrefId(row));                                            // e.g. "21934"
        d.setDocument(strRaw(meta, "dcterms:identifier", "spi:document"));
        d.setTitle(strRaw(meta, "dcterms:title"));
        d.setDescription(strRaw(meta, "dcterms:description", "spi:description"));
        d.setUrlname(strRaw(meta, "spi:fileName", "spi:urlname"));
        d.setUrl(strRaw(meta, "spi:url"));                                 // populated for WEB-type links only
        d.setUrltype(strRaw(meta, "spi:urlType", "spi:urltype"));
        d.setDoctype(strRaw(meta, "spi:docType", "spi:doctype"));
        d.setDoclinksid(longVal(meta, "docinfoid"));
        d.setMimeType(extractMimeLabel(meta));
        d.setSize(parseLong(strRaw(meta, "oslc_cm:attachmentSize")));
        d.setCreatedDate(strRaw(meta, "dcterms:created"));
        d.setModifiedDate(strRaw(meta, "dcterms:modified"));
        d.setCreateby(strRaw(meta, "spi:createby"));
        // Fallback: keep legacy str() lookup if nothing turned up (in case Maximo flattens the response in some flow)
        if (d.getUrlname() == null) d.setUrlname(str(row, "urlname"));
        return d;
    }

    private static Long parseLong(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Long.parseLong(s); }
        catch (NumberFormatException e) {
            try { return (long) Double.parseDouble(s); }
            catch (NumberFormatException ex) { return null; }
        }
    }

    /** dcterms:format is itself an object with rdfs:label = "image/jpeg" or similar. */
    @SuppressWarnings("unchecked")
    private static String extractMimeLabel(Map<String, Object> meta) {
        if (meta == null) return null;
        Object format = meta.get("dcterms:format");
        if (format instanceof Map<?, ?> m) {
            Object label = ((Map<String, Object>) m).get("rdfs:label");
            return label == null ? null : label.toString();
        }
        return null;
    }
}
