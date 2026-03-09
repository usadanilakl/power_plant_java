package com.dk_power.power_plant_java.entities.instrumentation;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

@Entity
@Table(
    name = "instrument_log",
    indexes = {
        @Index(name = "idx_instrument_log_sharepoint_id", columnList = "sharepointId"),
        @Index(name = "idx_instrument_log_local_uuid", columnList = "localUuid"),
        @Index(name = "idx_instrument_log_tag_number", columnList = "instrumentTagNumber")
    }
)
@Getter
@Setter
@Audited
@Where(clause = "deleted IS NOT TRUE")
public class InstrumentLog extends BaseAuditEntity {
    private String instrumentTagNumber;
    private String instrumentDescription;
    private String status;
    @Column(name = "log_date")
    private String date;
    @Column(name = "log_time")
    private String time;
    @Column(name = "submitter_name")
    private String name;
    @Column(length = 4000)
    private String comment;
    private String sharepointId;
    private String localUuid;
}
