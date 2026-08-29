package com.dk_power.power_plant_java.controller.angular.physical;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyAttachRequest;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyAuditDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyConnectionDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyTerminalDto;
import com.dk_power.power_plant_java.sevice.physical.NgPlantMapTopologyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/plant-map-topology")
@RequiredArgsConstructor
public class NgPlantMapTopologyController {
    private final NgPlantMapTopologyService service;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<PlantMapTopologyConnectionDto>>> getAll() {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(service.getAll(), "Plant Map topology retrieved successfully", LocalDateTime.now()));
    }

    @PostMapping("/attach")
    public ResponseEntity<NgApiResponse<PlantMapTopologyConnectionDto>> attach(
        @RequestBody PlantMapTopologyAttachRequest request
    ) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(service.attach(request), "Pipe end connected successfully", LocalDateTime.now()));
    }

    @PostMapping("/detach")
    public ResponseEntity<NgApiResponse<Void>> detach(@RequestBody PlantMapTopologyTerminalDto terminal) {
        service.detach(terminal);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(null, "Pipe end disconnected successfully", LocalDateTime.now()));
    }

    @DeleteMapping("/connection/{connectionKey}")
    public ResponseEntity<NgApiResponse<Void>> disconnect(@PathVariable String connectionKey) {
        service.disconnect(connectionKey);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(null, "Junction disconnected successfully", LocalDateTime.now()));
    }

    @DeleteMapping("/equipment/{objectId}/{portId}")
    public ResponseEntity<NgApiResponse<Void>> deleteEquipmentPort(
        @PathVariable Long objectId,
        @PathVariable String portId
    ) {
        service.deleteEquipmentPort(objectId, portId);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(null, "Equipment connector removed successfully", LocalDateTime.now()));
    }

    @DeleteMapping("/pipe/{pipeNodeId}")
    public ResponseEntity<NgApiResponse<Void>> deletePipe(@PathVariable Long pipeNodeId) {
        service.deletePipe(pipeNodeId);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(null, "Pipe and its topology removed successfully", LocalDateTime.now()));
    }

    @PostMapping("/audit-orphans")
    public ResponseEntity<NgApiResponse<PlantMapTopologyAuditDto>> auditOrphans() {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(service.auditOrphans(), "Plant Map topology audit complete", LocalDateTime.now()));
    }
}
