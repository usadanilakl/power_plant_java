package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.dto.physical.PlantMapEquipmentPortRefDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyAttachRequest;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyConnectionDto;
import com.dk_power.power_plant_java.dto.physical.PlantMapTopologyTerminalDto;
import com.dk_power.power_plant_java.entities.physical.PlantMapTopologyConnection;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.repository.diagrams.DiagramPlacementRepo;
import com.dk_power.power_plant_java.repository.physical.PlantMapTopologyConnectionRepo;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NgPlantMapTopologyServiceTest {

    @Mock
    private PlantMapTopologyConnectionRepo repo;
    @Mock
    private PhysicalObjectRepo physicalObjectRepo;
    @Mock
    private DiagramPlacementRepo placementRepo;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private NgPlantMapTopologyService service;

    @BeforeEach
    void setUp() {
        service = new NgPlantMapTopologyService(repo, objectMapper, physicalObjectRepo, placementRepo);
        lenient().when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void attachCreatesOneCanonicalJunctionForBothPipeEnds() {
        when(repo.findAllForUpdate()).thenReturn(List.of());
        PlantMapTopologyAttachRequest request = new PlantMapTopologyAttachRequest();
        request.setTerminal(terminal(10L, "A", 1L));
        request.setTargetTerminal(terminal(20L, "B", 1L));

        PlantMapTopologyConnectionDto result = service.attach(request);

        assertThat(result.getConnectionKey()).startsWith("junction:");
        assertThat(result.getKind()).isEqualTo("PIPE_JUNCTION");
        assertThat(result.getTerminals()).extracting(
            PlantMapTopologyTerminalDto::getPipeNodeId,
            PlantMapTopologyTerminalDto::getEnd,
            PlantMapTopologyTerminalDto::getSectionId
        ).containsExactlyInAnyOrder(
            org.assertj.core.groups.Tuple.tuple(10L, "A", 1L),
            org.assertj.core.groups.Tuple.tuple(20L, "B", 1L)
        );
    }

    @Test
    void attachAcceptsAStablePipeBodyBranchTerminal() {
        when(repo.findAllForUpdate()).thenReturn(List.of());
        PlantMapTopologyAttachRequest request = new PlantMapTopologyAttachRequest();
        request.setTerminal(terminal(10L, "A", 1L));
        request.setTargetTerminal(terminal(20L, "T:tap-42", 1L));

        PlantMapTopologyConnectionDto result = service.attach(request);

        assertThat(result.getTerminals()).extracting(PlantMapTopologyTerminalDto::getEnd)
            .containsExactlyInAnyOrder("A", "T:tap-42");
    }

    @Test
    void reconnectMovesTheEndAndSoftDeletesTheNowInvalidOldJunction() throws Exception {
        PlantMapTopologyConnection old = connection(
            "junction:old", "PIPE_JUNCTION",
            terminal(10L, "A", 1L), terminal(20L, "B", 1L)
        );
        PlantMapTopologyConnection destination = connection(
            "junction:new", "PIPE_JUNCTION",
            terminal(30L, "A", 1L), terminal(40L, "B", 1L)
        );
        when(repo.findAllForUpdate()).thenReturn(List.of(old, destination));
        PlantMapTopologyAttachRequest request = new PlantMapTopologyAttachRequest();
        request.setTerminal(terminal(10L, "A", 1L));
        request.setTargetTerminal(terminal(30L, "A", 1L));

        PlantMapTopologyConnectionDto result = service.attach(request);

        assertThat(old.getDeleted()).isTrue();
        assertThat(result.getConnectionKey()).isEqualTo("junction:new");
        assertThat(result.getTerminals()).extracting(PlantMapTopologyTerminalDto::getPipeNodeId)
            .containsExactlyInAnyOrder(10L, 30L, 40L);
    }

    @Test
    void explicitJunctionMergePreservesEveryExistingBranch() throws Exception {
        PlantMapTopologyConnection left = connection(
            "junction:left", "PIPE_JUNCTION",
            terminal(10L, "T:left-tap", 1L), terminal(11L, "A", 1L)
        );
        PlantMapTopologyConnection right = connection(
            "junction:right", "PIPE_JUNCTION",
            terminal(20L, "T:right-tap", 1L), terminal(21L, "B", 1L)
        );
        when(repo.findAllForUpdate()).thenReturn(List.of(left, right));
        PlantMapTopologyAttachRequest request = new PlantMapTopologyAttachRequest();
        request.setTerminal(terminal(20L, "T:right-tap", 1L));
        request.setTargetTerminal(terminal(10L, "T:left-tap", 1L));
        request.setMergeJunctions(true);

        PlantMapTopologyConnectionDto result = service.attach(request);

        assertThat(result.getConnectionKey()).isEqualTo("junction:left");
        assertThat(result.getTerminals()).extracting(PlantMapTopologyTerminalDto::getPipeNodeId)
            .containsExactlyInAnyOrder(10L, 11L, 20L, 21L);
        assertThat(right.getDeleted()).isTrue();
    }

    @Test
    void equipmentPortAcceptsMultiplePipeEndsAndDetachRemovesOnlyTheSelectedEnd() throws Exception {
        PlantMapTopologyConnection equipment = connection(
            "equipment:70:P1", "EQUIPMENT_PORT",
            terminal(10L, "B", 1L), terminal(20L, "A", 70L)
        );
        equipment.setEquipmentObjectId(70L);
        equipment.setEquipmentPortId("P1");
        when(repo.findAllForUpdate()).thenReturn(List.of(equipment));

        service.detach(terminal(10L, "B", 1L));

        assertThat(equipment.getDeleted()).isFalse();
        assertThat(readTerminals(equipment)).extracting(PlantMapTopologyTerminalDto::getPipeNodeId)
            .containsExactly(20L);
    }

    @Test
    void detachingTheLastEquipmentParticipantCreatesASyncableTombstone() throws Exception {
        PlantMapTopologyConnection equipment = connection(
            "equipment:70:P1", "EQUIPMENT_PORT", terminal(10L, "B", 1L)
        );
        equipment.setEquipmentObjectId(70L);
        equipment.setEquipmentPortId("P1");
        when(repo.findAllForUpdate()).thenReturn(List.of(equipment));

        service.detach(terminal(10L, "B", 1L));

        assertThat(equipment.getDeleted()).isTrue();
    }

    @Test
    void attachToEquipmentUsesItsStableIdentityInsteadOfPipeDirection() {
        when(repo.findAllForUpdate()).thenReturn(List.of());
        PlantMapEquipmentPortRefDto port = new PlantMapEquipmentPortRefDto();
        port.setObjectId(70L);
        port.setPortId(" HX-OUT-2 ");
        PlantMapTopologyAttachRequest request = new PlantMapTopologyAttachRequest();
        request.setTerminal(terminal(10L, "B", 1L));
        request.setEquipmentPort(port);

        PlantMapTopologyConnectionDto result = service.attach(request);

        assertThat(result.getConnectionKey()).isEqualTo("equipment:70:HX-OUT-2");
        assertThat(result.getEquipmentObjectId()).isEqualTo(70L);
        assertThat(result.getEquipmentPortId()).isEqualTo("HX-OUT-2");
    }

    @Test
    void getAllCoalescesOfflineDuplicateRowsWithTheSameStableKey() throws Exception {
        PlantMapTopologyConnection first = connection(
            "equipment:70:P1", "EQUIPMENT_PORT", terminal(10L, "B", 1L)
        );
        first.setEquipmentObjectId(70L);
        first.setEquipmentPortId("P1");
        PlantMapTopologyConnection second = connection(
            "equipment:70:P1", "EQUIPMENT_PORT", terminal(20L, "A", 70L)
        );
        second.setEquipmentObjectId(70L);
        second.setEquipmentPortId("P1");
        when(repo.findAll()).thenReturn(List.of(first, second));

        List<PlantMapTopologyConnectionDto> result = service.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTerminals()).extracting(PlantMapTopologyTerminalDto::getPipeNodeId)
            .containsExactlyInAnyOrder(10L, 20L);
    }

    @Test
    void deletingPipeRemovesEveryDynamicTerminalPlacementAndPhysicalSubtree() throws Exception {
        PlantMapTopologyConnection junction = connection(
            "junction:pipe", "PIPE_JUNCTION",
            terminal(10L, "A", 1L), terminal(10L, "T:branch", 1L), terminal(20L, "B", 1L)
        );
        DiagramPlacement placement = new DiagramPlacement();
        placement.setSourceEntityType("Pipe");
        placement.setSourceEntityId(10L);
        PhysicalObject pipe = new PhysicalObject(); pipe.setId(10L);
        PhysicalObject fitting = new PhysicalObject(); fitting.setId(11L);
        when(placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", 10L)).thenReturn(List.of(placement));
        when(repo.findAllForUpdate()).thenReturn(List.of(junction));
        when(physicalObjectRepo.findById(10L)).thenReturn(java.util.Optional.of(pipe));
        when(physicalObjectRepo.findByParentId(10L)).thenReturn(List.of(fitting));
        when(physicalObjectRepo.findByParentId(11L)).thenReturn(List.of());

        service.deletePipe(10L);

        assertThat(placement.getDeleted()).isTrue();
        assertThat(pipe.getDeleted()).isTrue();
        assertThat(fitting.getDeleted()).isTrue();
        assertThat(junction.getDeleted()).isTrue();
    }

    @Test
    void deletingGeneratedSegmentRemovesOnlyItsContinuationChain() {
        DiagramPlacement first = pipePlacement(10L, "run-1", "continuation-1", 100L, "port-1", 99L);
        DiagramPlacement second = pipePlacement(20L, "run-1", "continuation-1", 200L, "port-2", 99L);
        DiagramPlacement sibling = pipePlacement(30L, "run-1", "continuation-2", 300L, "port-3", 99L);
        PhysicalObject firstPipe = new PhysicalObject(); firstPipe.setId(10L);
        PhysicalObject secondPipe = new PhysicalObject(); secondPipe.setId(20L);
        when(placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", 10L)).thenReturn(List.of(first));
        when(placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", 20L)).thenReturn(List.of(second));
        when(placementRepo.findAll()).thenReturn(List.of(first, second, sibling));
        when(repo.findAllForUpdate()).thenReturn(List.of());
        when(physicalObjectRepo.findById(10L)).thenReturn(java.util.Optional.of(firstPipe));
        when(physicalObjectRepo.findById(20L)).thenReturn(java.util.Optional.of(secondPipe));
        when(physicalObjectRepo.findByParentId(10L)).thenReturn(List.of());
        when(physicalObjectRepo.findByParentId(20L)).thenReturn(List.of());

        service.deletePipe(10L);

        assertThat(first.getDeleted()).isTrue();
        assertThat(second.getDeleted()).isTrue();
        assertThat(sibling.getDeleted()).isNotEqualTo(true);
        assertThat(firstPipe.getDeleted()).isTrue();
        assertThat(secondPipe.getDeleted()).isTrue();
    }

    @Test
    void deletingOriginalPipeAlsoRemovesItsGeneratedContinuation() {
        DiagramPlacement original = new DiagramPlacement();
        original.setSourceEntityType("Pipe"); original.setSourceEntityId(99L); original.setSvgPath("{}");
        DiagramPlacement generated = pipePlacement(10L, "run-1", "continuation-1", 100L, "port-1", 99L);
        PhysicalObject originalPipe = new PhysicalObject(); originalPipe.setId(99L);
        PhysicalObject generatedPipe = new PhysicalObject(); generatedPipe.setId(10L);
        when(placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", 99L)).thenReturn(List.of(original));
        when(placementRepo.findBySourceEntityTypeAndSourceEntityId("Pipe", 10L)).thenReturn(List.of(generated));
        when(placementRepo.findAll()).thenReturn(List.of(original, generated));
        when(repo.findAllForUpdate()).thenReturn(List.of());
        when(physicalObjectRepo.findById(99L)).thenReturn(java.util.Optional.of(originalPipe));
        when(physicalObjectRepo.findById(10L)).thenReturn(java.util.Optional.of(generatedPipe));
        when(physicalObjectRepo.findByParentId(99L)).thenReturn(List.of());
        when(physicalObjectRepo.findByParentId(10L)).thenReturn(List.of());

        service.deletePipe(99L);

        assertThat(original.getDeleted()).isTrue();
        assertThat(generated.getDeleted()).isTrue();
        assertThat(originalPipe.getDeleted()).isTrue();
        assertThat(generatedPipe.getDeleted()).isTrue();
    }

    private DiagramPlacement pipePlacement(
        Long pipeId, String groupId, String continuationId, Long ownerId, String portId, Long generatedFrom
    ) {
        DiagramPlacement placement = new DiagramPlacement();
        placement.setSourceEntityType("Pipe");
        placement.setSourceEntityId(pipeId);
        placement.setSvgPath("{\"groupId\":\"" + groupId + "\",\"generatedContinuationId\":\""
            + continuationId + "\",\"generatedFromPipeNodeId\":" + generatedFrom
            + ",\"generatedByBoundaryPort\":{\"objectId\":" + ownerId
            + ",\"portId\":\"" + portId + "\"}}");
        return placement;
    }

    private PlantMapTopologyConnection connection(
        String key, String kind, PlantMapTopologyTerminalDto... terminals
    ) throws Exception {
        PlantMapTopologyConnection result = new PlantMapTopologyConnection();
        result.setConnectionKey(key);
        result.setKind(kind);
        result.setTerminalsJson(objectMapper.writeValueAsString(terminals));
        return result;
    }

    private List<PlantMapTopologyTerminalDto> readTerminals(PlantMapTopologyConnection connection) throws Exception {
        return objectMapper.readValue(
            connection.getTerminalsJson(),
            objectMapper.getTypeFactory().constructCollectionType(List.class, PlantMapTopologyTerminalDto.class)
        );
    }

    private PlantMapTopologyTerminalDto terminal(Long pipeNodeId, String end, Long sectionId) {
        PlantMapTopologyTerminalDto result = new PlantMapTopologyTerminalDto();
        result.setPipeNodeId(pipeNodeId);
        result.setEnd(end);
        result.setSectionId(sectionId);
        return result;
    }
}
