package com.dk_power.power_plant_java.entities.files;

import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Value;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Getter
@Setter
@Inheritance(strategy = InheritanceType.JOINED)
@com.dk_power.power_plant_java.sevice.sync.LocalOnlyEntity(reason = "vestigial JOINED-inheritance root with no subclasses and no rows; real file entity is FileObject")
public class BaseFile extends BaseAuditEntity implements Referenceable {

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "file_type_id")
    private Value fileType;

    private String fileLink;
    private String baseLink = "files";
    private String folder;

    private String relatedSystems;
    private String fileNumbers;
    private String extensions;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "vendor_id")
    private Value vendor;

    private Boolean isVerified = false;

    @Transient
    private Set<Path> revisions = new HashSet<>();


    public static final List<String> lightDto = List.of(
            "id", "name", "fileType", "vendor", "fileLink", "extensions", "fileNumbers", "isVerified"
    );



    public String buildFileLink(String extension){
        fileLink = baseLink+"/"+fileType.getName()+"/"+fileNumbers+"."+extension;
        return fileLink;
    }
    public String buildFolder(){
        folder = baseLink+"/"+fileType.getName();
        return folder;
    }



    public void setRelatedSystems(String system) {
        if (system == null) return;

        // Clean up the input: keep only letters, numbers, spaces, dashes, and commas
        String cleanedSystem = system.replaceAll("[^a-zA-Z0-9\\s,-]", "").trim();

        if (relatedSystems == null || relatedSystems.isEmpty()) {
            relatedSystems = cleanedSystem;
        } else {
            Set<String> systems = new HashSet<>(Arrays.asList(relatedSystems.split(",")));
            systems.addAll(Arrays.asList(cleanedSystem.split(",")));

            // Remove empty strings, trim each system, and remove any remaining whitespace
            systems = systems.stream()
                    .filter(s -> !s.trim().isEmpty())
                    .map(s -> s.trim().replaceAll("\\s+", " "))
                    .collect(Collectors.toSet());

            relatedSystems = String.join(",", systems);
        }
    }

    public void addExtension(String extension) {
        if(extensions==null) extensions = extension;
        else {
            Set<String> exts = new HashSet<>(Arrays.asList(extensions.split(",")));
            exts.add(extension);
            extensions = String.join(",", exts);
        }
    }

    public void removeExtension(String extension) {
        if(extensions!=null){
            Set<String> exts = new HashSet<>(Arrays.asList(extensions.split(",")));
            exts.remove(extension);
            extensions = String.join(",", exts);
        }
    }

    public List<String> getExtensionsArray() {
        if(this.extensions!=null)return Arrays.asList(extensions.split(","));
        return Collections.emptyList();
    }

    public void setFileNumbers(List<String> fileNumberArray) {
        if (fileNumberArray != null && !fileNumberArray.isEmpty()) {
            String joinedFileNumber = fileNumberArray.stream()
                    .map(part -> part.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("\\s+", "-"))
                    .collect(Collectors.joining("__SEP__"));

            // Optionally limit the length
            if (joinedFileNumber.length() > 255) {  // adjust max length as needed
                joinedFileNumber = joinedFileNumber.substring(0, 255);
            }
            this.fileNumbers = joinedFileNumber;
        }
        throw new IllegalArgumentException("File numbers cannot be null or empty");
    }

    public List<String> getFileNumbersArray() {
        return this.fileNumbers != null ? new ArrayList<>(Arrays.asList(this.fileNumbers.split("__SEP__"))) : new ArrayList<>();
    }

    @Override
    public String toString() {
        return "BaseFile{" +
                "name='" + super.getName() + '\'' +
                ",\n\t fileType=" + fileType +
                ",\n\t fileLink='" + fileLink + '\'' +
                ",\n\t baseLink='" + baseLink + '\'' +
                ",\n\t folder='" + folder + '\'' +
                ",\n\t relatedSystems='" + relatedSystems + '\'' +
                ",\n\t fileNumber='" + fileNumbers + '\'' +
                ",\n\t extension='" + extensions + '\'' +
                ",\n\t vendor=" + vendor +
                ",\n\t systems=" + relatedSystems +
                "\n\tobject type=" + getObjectType() +
                '}';
    }

}
