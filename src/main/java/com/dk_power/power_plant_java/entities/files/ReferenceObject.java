package com.dk_power.power_plant_java.entities.files;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.Map;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReferenceObject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String tagNumbers;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String fileNumbers;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String characteristics;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String references;

    private static final ObjectMapper mapper = new ObjectMapper();

    // Helper methods for tagNumbers
    public void setTagNumbersList(List<String> list) throws Exception {
        this.tagNumbers = mapper.writeValueAsString(list);
    }

    public List<String> getTagNumbersList() throws Exception {
        if (this.tagNumbers == null) return null;
        return mapper.readValue(this.tagNumbers, new TypeReference<List<String>>(){});
    }

    // Helper methods for fileNumbers
    public void setFileNumbersList(List<String> list) throws Exception {
        this.fileNumbers = mapper.writeValueAsString(list);
    }

    public List<String> getFileNumbersList() throws Exception {
        if (this.fileNumbers == null) return null;
        return mapper.readValue(this.fileNumbers, new TypeReference<List<String>>(){});
    }

    // Helper methods for characteristics
    public void setCharacteristicsMap(Map<String, String> map) throws Exception {
        this.characteristics = mapper.writeValueAsString(map);
    }

    public Map<String, String> getCharacteristicsMap() throws Exception {
        if (this.characteristics == null) return null;
        return mapper.readValue(this.characteristics, new TypeReference<Map<String, String>>(){});
    }

    // Helper methods for references
    public void setReferencesMap(Map<String, String> map) throws Exception {
        this.references = mapper.writeValueAsString(map);
    }

    public Map<String, String> getReferencesMap() throws Exception {
        if (this.references == null) return null;
        return mapper.readValue(this.references, new TypeReference<Map<String, String>>(){});
    }
}