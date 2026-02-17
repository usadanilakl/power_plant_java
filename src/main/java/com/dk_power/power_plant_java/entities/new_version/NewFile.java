package com.dk_power.power_plant_java.entities.new_version;

import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@Getter
@Setter
@Entity
@Where(clause = "deleted IS NOT TRUE")

public class NewFile extends NewBaseEntity{
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "file_type_id")
    Value fileType;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "vendor_id")
    Value vendor;
    String vendorNumber;

    String systems;
    String primaryFileNumber;
    String fileNumbers;

    String extension;
    String filePath;

    public Path buildFilePath() {
        String fileTypeName = Optional.ofNullable(fileType)
                .map(Value::getName)
                .orElse("unknown");

        String safeExtension = Optional.ofNullable(extension)
                .orElse("unknown");

        String safePrimaryFileNumber = Optional.ofNullable(primaryFileNumber)
                .orElse("unknown");

        return Paths.get(fileTypeName, safeExtension, safePrimaryFileNumber + "." + safeExtension);
    }

    public Path buildFolderPath() {
        String fileTypeName = Optional.ofNullable(fileType)
                .map(Value::getName)
                .orElse("unknown");

        String safeExtension = Optional.ofNullable(extension)
                .orElse("unknown");

        return Paths.get(fileTypeName);
    }

}
