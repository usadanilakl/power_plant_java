package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.enums.Status;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Audited
public class LotoSnapshot extends BaseAuditEntity implements Cloneable {



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loto_id", unique = false)
    private Loto loto;

    private String boxNumber;
    @Column(columnDefinition = "TEXT")
    private String locks;
    private String requestorName;
    private String workAuthority;
    private LocalDateTime requestTime;
    private LocalDateTime workAuthorityTime;
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;
    private String workScope;

    @ElementCollection
    @CollectionTable(name = "loto_snapshot_points", joinColumns = @JoinColumn(name = "loto_snapshot_id"))
    @Column(name = "loto_point_data", columnDefinition = "TEXT")
    private Set<String> lotoPointsData = new HashSet<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String lotoPointOrder;



    public Set<LotoPointIdDto> getLotoPointDtos() {
        ObjectMapper objectMapper = new ObjectMapper();
        Set<LotoPointIdDto> dtos = new HashSet<>();

        for (String jsonData : lotoPointsData) {
            try {
                LotoPointIdDto dto = objectMapper.readValue(jsonData, LotoPointIdDto.class);
                dtos.add(dto);
            } catch (JsonProcessingException e) {
                // Handle or log the error
                e.printStackTrace();
            }
        }

        return dtos;
    }

    public void setLotoPointDtos(Set<LotoPointIdDto> dtos) {
        ObjectMapper objectMapper = new ObjectMapper();
        lotoPointsData = new HashSet<>();

        for (LotoPointIdDto dto : dtos) {
            try {
                String jsonData = objectMapper.writeValueAsString(dto);
                lotoPointsData.add(jsonData);
            } catch (JsonProcessingException e) {
                // Handle or log the error
                e.printStackTrace();
            }
        }
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        LotoSnapshot cloned = (LotoSnapshot) super.clone();
        if (this.lotoPointsData != null) {
            cloned.lotoPointsData = new HashSet<>(this.lotoPointsData);
        }
        return cloned;
    }



}