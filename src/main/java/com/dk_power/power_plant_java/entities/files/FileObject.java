package com.dk_power.power_plant_java.entities.files;


import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

import java.util.*;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
@Where(clause = "deleted IS NOT TRUE")
public class FileObject extends BaseAuditEntity implements Referenceable {

    public FileObject(String name, Value fileType, String fileLink, Value sytem, String fileNumber, Value vendor) {
        this.name = name;
        this.fileType = fileType;
        this.fileLink = fileLink;
        this.system = sytem;
        this.fileNumber = fileNumber;
        this.vendor = vendor;
    }

    public FileObject(String name) {
        this.name = name;
    }
    private String name;

    @BatchSize(size = 50)
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "file_type_id")
    private Value fileType;

    private String fileLink;
    private String baseLink = "uploads";
    private String folder;

    @BatchSize(size = 50)
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "system_id")
    private Value system;

    //@Column(length = 2000)
    private String relatedSystems;
    private String fileNumber;
    private String extension;
    private String extensions;

    @BatchSize(size = 50)
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "vendor_id")
    private Value vendor;

    @BatchSize(size = 50)
    @ManyToMany(mappedBy = "files")
    @JsonIgnore
    @JsonManagedReference
    private List<Equipment> points;

    @JsonBackReference
    @ManyToMany(mappedBy = "pid")
    private List<HeatTrace> heatTrace;

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "file")
    @JsonBackReference
    private List<Highlight> highlights;

    @Column(length = 10000)
    private String relatedTags;

    private Boolean completed;
    private String bulkEditStep = "eqTagNumber";
    private String docNum;

    private Boolean isVerified = false;

    /**
     * SHA-256 hash of the canonical source file only (the originally-uploaded file —
     * the PDF in the pdf→jpg flow, the sole uploaded file otherwise).
     * Derived files (e.g. jpg pages split from a PDF) are NOT hashed.
     *
     * Used by {@code FileObjectSyncHandler} to detect content changes when the
     * extension stays the same (e.g. an "override file" upload). Without this,
     * content-change detection degenerates to watching {@code extensions}, which
     * only catches add/remove of an extension.
     */
    private String fileHash;

    /**
     * Perceptual hash (64-bit, hex-encoded) of the file's visual content.
     * Computed at upload time for images and PDFs (using the first page's JPG).
     * Null for files without visual rendering (xlsx/docx/stl/obj/etc.).
     *
     * Two files with similar visuals will have a small Hamming distance —
     * used for "same drawing re-exported" duplicate detection where
     * {@link #fileHash} won't match because the bytes differ.
     */
    private String perceptualHash;



    public static final List<String> lightDto = List.of(
            "id", "name", "fileType", "vendor", "fileLink", "extensions", "fileNumber", "isVerified"
    );





    @Transient
    private List<String> systems;

    public String buildFileLink(){
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension;
        return fileLink;
    }
    public String buildFolder(){
        folder = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName();
        return folder;
    }
    /**
     * Build file link for a specific extension WITHOUT modifying entity state.
     * Use this when you need the path for a specific extension without changing the entity.
     */
    public String buildFileLink(String ext){
        if(fileType == null || fileType.getName()==null) return null;
        if(vendor == null || vendor.getName()==null) return null;
        // Don't modify this.extension - just compute and return the path
        return baseLink+"/"+ext+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+ext;
    }

    /**
     * Build file link for a specific extension AND update entity state.
     * Use this when you intentionally want to change the entity's extension field.
     */
    public String buildFileLinkAndSetExtension(String ext){
        if(fileType == null || fileType.getName()==null) return null;
        if(vendor == null || vendor.getName()==null) return null;
        this.extension = ext;
        fileLink = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension;
        return fileLink;
    }

    /**
     * Build folder path for a specific extension WITHOUT modifying entity state.
     * Use this when you need the folder path without changing the entity.
     */
    public String buildFolder(String ext){
        // Don't modify this.extension - just compute and return the path
        return baseLink+"/"+ext+"/"+fileType.getName()+"/"+vendor.getName();
    }

    /**
     * Build relative path from uploads root (without baseLink prefix).
     * E.g., "jpg/PID/vendor/file.jpg" â€” use with filesRootPath to get actual filesystem path.
     */
    public String buildRelativePath(String ext){
        if(fileType == null || fileType.getName()==null) return null;
        if(vendor == null || vendor.getName()==null) return null;
        return ext+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+ext;
    }

    /**
     * Build relative folder from uploads root (without baseLink prefix).
     * E.g., "jpg/PID/vendor" â€” use with filesRootPath to get actual filesystem path.
     */
    public String buildRelativeFolder(String ext){
        if(fileType == null || fileType.getName()==null) return null;
        if(vendor == null || vendor.getName()==null) return null;
        return ext+"/"+fileType.getName()+"/"+vendor.getName();
    }

    /**
     * Build folder path for a specific extension AND update entity state.
     * Use this when you intentionally want to change the entity's extension field.
     */
    public String buildFolderAndSetExtension(String ext){
        this.extension = ext;
        folder = baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName();
        return folder;
    }


    public void addPoint(Equipment entity) {
        if(points==null) points = new ArrayList<>();
        if(!points.contains(entity))points.add(entity);
    }

    public String getFileLink() {
        String ext = null;
        if(this.extensions!=null && this.extensions.contains("pdf")) ext = "pdf";
        else if(this.extensions!=null && !this.extensions.isEmpty()) ext = this.extensions.split(",")[0];
        else if(ext == null && this.extension!=null) ext = this.extension;
        return this.buildFileLink(ext);
    }

    /**
     * Returns the stored fileLink value without rebuilding it.
     * Useful when you need the actual stored path before entity changes.
     */
    public String getStoredFileLink() {
        return this.fileLink;
    }

    public String getFileNumber() {
        return fileNumber;
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

    @Override
    public String toString() {
        return "FileObject{" +
                "name='" + name + '\'' +
                ",\n\t fileType=" + fileType +
                ",\n\t fileLink='" + fileLink + '\'' +
                ",\n\t baseLink='" + baseLink + '\'' +
                ",\n\t folder='" + folder + '\'' +
                ",\n\t system=" + system +
                ",\n\t relatedSystems='" + relatedSystems + '\'' +
                ",\n\t fileNumber='" + fileNumber + '\'' +
                ",\n\t extension='" + extension + '\'' +
                ",\n\t vendor=" + vendor +
                ",\n\t points=" + points +
                ",\n\t systems=" + systems +
                "\n\tobject type=" + getObjectType() +
                '}';
    }

    public void removePoint(Equipment entity) {
        points.removeIf(e->e.getId()==entity.getId());
    }
    
    
public static String getFileNumberFromLink(String link) {
    String[] parts = link.split("[/\\\\]");
    String fileName = parts[parts.length - 1];
    int lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex != -1 ? fileName.substring(0, lastDotIndex) : fileName;
}
}
