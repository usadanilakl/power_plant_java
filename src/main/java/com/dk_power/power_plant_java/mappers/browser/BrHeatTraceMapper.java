package com.dk_power.power_plant_java.mappers.browser;

import com.dk_power.power_plant_java.dto.browser.BrHeatTrace;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.TagNumberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BrHeatTraceMapper {
    private final HeatTraceRepo heatTraceRepo;
    private final LotoPointRepo lotoPointRepo;
    private final EquipmentRepo equipmentRepo;
    private final TagNumberService tagNumberService;

    public BrHeatTrace toDto(HeatTrace entity) {
        if (entity == null) {
            return null;
        }

        BrHeatTrace dto = new BrHeatTrace();

        if (entity.getId() != null) {
            dto.setId(entity.getId());
        }

        if (entity.getTagNumber() != null) {
            dto.setTagNumber(entity.getTagNumber());
        }

        if (entity.getBreaker() != null) {
            HtBreaker br = entity.getBreaker();
            HtPanel panel = br.getPanel();
            if (panel != null) {
                if (panel.getTagNumber() != null) dto.setPanelNumber(panel.getTagNumber());
                if (panel.getLocation() != null) dto.setPanelLocation(panel.getLocation());
                if (panel.getPanelSchedule() != null) dto.setPanelSchedule(panel.getPanelSchedule().getId());
            }

            if (br.getTagNumber() != null) dto.setBreakerTagNumber(br.getTagNumber());
            if (br.getBrNumber() != null) dto.setBreaker(br.getBrNumber());
        }

        if (entity.getHtIso() != null) {
            dto.setIsometric(entity.getHtIso().getId());
        }

        if (entity.getPid() != null) {
            dto.setPids(new HashSet<>(entity.getPid().stream().map(FileObject::getId).toList()));
        }

        if (entity.getEquipmentList() != null) {
            dto.setEquipmentList(new HashSet<>(entity.getEquipmentList().stream().map(Equipment::getId).toList()));
        }

        if (dto.getTagNumber() != null) {
            String type = dto.getTagNumber().toLowerCase().contains("htt") ? "HTT" : "ENC";
            int index = dto.getTagNumber().toLowerCase().indexOf(type.toLowerCase());
            String circuit = dto.getPanelNumber().substring(index).split("-")[1];
            List<LotoPoint> lotoPoints = lotoPointRepo.findByDescriptionContainingAndDescriptionContaining(type, circuit);
            dto.setLotoPointId(lotoPoints.isEmpty() ? null : lotoPoints.getFirst().getId());

            List<Equipment> equipment = new ArrayList<>();
            if (type.equals("ENC")) {
                equipment.addAll(equipmentRepo.findByTagNumberContainingIgnoreCase(circuit));
            }

            if (entity.getTempEquipment() != null) {
                equipment.addAll(equipmentRepo.findByTagNumberContainingIgnoreCase(entity.getTempEquipment().trim()));
                String systemTagNumber = tagNumberService.getSystemTagNumber(entity.getTagNumber());
                if (systemTagNumber != null && systemTagNumber.length() > 3) {
                    equipment.addAll(equipmentRepo.findByTagNumberContainingIgnoreCase(systemTagNumber));
                }
            }

            dto.setPossiblyRelatedEquipmentList(equipment.stream().map(Equipment::getId).collect(Collectors.toSet()));
        }


        return dto;
    }

    public List<BrHeatTrace> toDtoAll(List<HeatTrace> entities) {
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }
}
