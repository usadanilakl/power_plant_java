package com.dk_power.power_plant_java.dto.categories;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A Value that shares a {@code name} with a canonical Value in a target Category
 * but lives outside that Category (either uncategorized or in a different one).
 *
 * <p>Entities still point at the orphan via ManyToOne FKs; the orphan is invisible
 * to the dropdown loader (which only returns Values in the matched Category), so
 * the dropdown shows empty for those entities until the orphan is merged into the
 * canonical.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrphanValueDto {

    /** The misplaced Value still referenced by entities. */
    private ValueDto orphan;

    /** The canonical Value in the target Category that orphans should merge into. */
    private ValueDto canonical;

    /** Number of entity rows that currently reference the orphan. */
    private long referenceCount;
}
