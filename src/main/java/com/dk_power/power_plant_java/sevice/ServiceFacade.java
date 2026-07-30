package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.diagrams.DiagramConnection;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.entities.equipment.*;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.entities.rounds.RoundsReport;
import com.dk_power.power_plant_java.entities.loto.RedTagStandard;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.fire_impairment.FireImpairment;
import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.entities.inventory.InventoryUsage;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.entities.engraver.EngraverTemplate;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.entities.users.ContractorChangeReport;
import com.dk_power.power_plant_java.sevice.users.ShiftDaySyncService;
import com.dk_power.power_plant_java.sevice.users.ContractorChangeReportSyncService;
import com.dk_power.power_plant_java.sevice.angular.NgCommentService;
import com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramPlacementService;
import com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramConnectionService;
import com.dk_power.power_plant_java.sevice.angular.NgEmailCorrespondenceService;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.engraver.NgEngraverTemplateService;
import com.dk_power.power_plant_java.sevice.angular.messaging.NgConversationService;
import com.dk_power.power_plant_java.sevice.angular.messaging.NgMessageService;
import com.dk_power.power_plant_java.sevice.angular.loto.*;
import com.dk_power.power_plant_java.sevice.angular.permits.*;
import com.dk_power.power_plant_java.sevice.angular.scheduler.FlowService;
import com.dk_power.power_plant_java.sevice.angular.scheduler.TaskService;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.angular.field_list.FieldListItemSyncService;
import com.dk_power.power_plant_java.sevice.angular.inventory.InventoryItemSyncService;
import com.dk_power.power_plant_java.sevice.angular.inventory.InventoryUsageSyncService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsChemicalSyncService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsAuditRecordSyncService;
import com.dk_power.power_plant_java.sevice.fire_impairment.FireImpairmentService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.*;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.sevice.forms.FormContainerService;
import com.dk_power.power_plant_java.sevice.forms.PrintableFormService;
import com.dk_power.power_plant_java.sevice.instrumentation.InstrumentLogSyncService;
import com.dk_power.power_plant_java.sevice.instrumentation.InstrumentSyncService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProPointService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScrapeJobService;
import com.dk_power.power_plant_java.sevice.angular.rounds.NgRoundsService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgRedTagStandardService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.loto.zero_energy.ZeroEnergyService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@SuppressWarnings("rawtypes")
public class ServiceFacade {

    private final Map<String, SyncableService> serviceMap = new HashMap<>();

    public ServiceFacade(
            // Categories
            @Lazy CategoryService categoryService,
            @Lazy ValueService valueService,
            // Files
            @Lazy FileService fileService,
            @Lazy com.dk_power.power_plant_java.sevice.angular.file.NgFileConnectorService ngFileConnectorService,
            @Lazy NgEngraverTemplateService ngEngraverTemplateService,
            // Equipment
            @Lazy EquipmentService equipmentService,
            @Lazy HeatTraceService heatTraceService,
            @Lazy HighlightService highlightService,
            @Lazy ElectricalPanelService electricalPanelService,
            @Lazy EqBreakerService eqBreakerService,
            @Lazy HtPanelService htPanelService,
            @Lazy HtBreakerService htBreakerService,
            @Lazy InstrumentSyncService instrumentSyncService,
            @Lazy InstrumentLogSyncService instrumentLogSyncService,
            // LOTO
            @Lazy LotoPointService lotoPointService,
            @Lazy NgLotoService ngLotoService,
            @Lazy NgLotoStandardService ngLotoStandardService,
            @Lazy NgLotoBoxService ngLotoBoxService,
            @Lazy NgLockService ngLockService,
            @Lazy NgLotoSnapshotService ngLotoSnapshotService,
            @Lazy NgLotoStandardPendingChangeService ngLotoStandardPendingChangeService,
            @Lazy NgLotoStandardApprovalEventService ngLotoStandardApprovalEventService,
            @Lazy NgWalkdownSessionSyncService ngWalkdownSessionSyncService,
            @Lazy ZeroEnergyService zeroEnergyService,
            // Comments
            @Lazy NgCommentService ngCommentService,
            // Email Correspondence
            @Lazy NgEmailCorrespondenceService ngEmailCorrespondenceService,
            // Messaging
            @Lazy NgConversationService ngConversationService,
            @Lazy NgMessageService ngMessageService,
            // Users
            @Lazy NgUserService ngUserService,
            @Lazy ShiftDaySyncService shiftDaySyncService,
            @Lazy ContractorChangeReportSyncService contractorChangeReportSyncService,
            // Permits
            @Lazy NgSafeWorkService ngSafeWorkService,
            @Lazy NgHotWorkService ngHotWorkService,
            @Lazy NgConfinedSpaceService ngConfinedSpaceService,
            @Lazy NgWorkAreaService ngWorkAreaService,
            @Lazy WorkCategoryProfileSyncService workCategoryProfileSyncService,
            @Lazy NgWorkRequestService ngWorkRequestService,
            @Lazy NgJhaService ngJhaService,
            @Lazy NgDailyPermitPackageService ngDailyPermitPackageService,
            @Lazy NgJobLogService ngJobLogService,
            @Lazy NgEnergizedWorkPermitService ngEnergizedWorkPermitService,
            @Lazy NgExcavationPermitService ngExcavationPermitService,
            @Lazy NgVentingPermitService ngVentingPermitService,
            @Lazy WorkAreaMapShapeSyncService workAreaMapShapeSyncService,
            // Forms
            @Lazy PrintableFormService printableFormService,
            @Lazy FormContainerService formContainerService,
            // Scheduler
            @Lazy FlowService flowService,
            @Lazy TaskService taskService,
            // Diagrams
            @Lazy NgDiagramPlacementService ngDiagramPlacementService,
            @Lazy NgDiagramConnectionService ngDiagramConnectionService,
            // EtaPro (readings + log entries are @LocalOnlyEntity — not synced — so no service is wired here)
            @Lazy EtaProPointService etaProPointService,
            @Lazy EtaProScrapeJobService etaProScrapeJobService,
            // Fire Impairment
            @Lazy FireImpairmentService fireImpairmentService,
            // Field Lists
            @Lazy FieldListItemSyncService fieldListItemSyncService,
            // Inventory
            @Lazy InventoryItemSyncService inventoryItemSyncService,
            @Lazy InventoryUsageSyncService inventoryUsageSyncService,
            // SDS
            @Lazy SdsChemicalSyncService sdsChemicalSyncService,
            @Lazy SdsAuditRecordSyncService sdsAuditRecordSyncService,
            // Rounds (WebView AMS scraper)
            @Lazy NgRoundsService ngRoundsService,
            // Red Tag standards (digitized LOTO standards from Red Tag)
            @Lazy NgRedTagStandardService ngRedTagStandardService,
            // Maximo recurring-PM catalog (lead year-scan; synced so all desktops share it)
            @Lazy com.dk_power.power_plant_java.sevice.maximo.RecurringPmSyncService recurringPmSyncService,
            // Maximo ticket→asset index (hub-built SR/WO tag index; synced so all desktops can search it)
            @Lazy com.dk_power.power_plant_java.sevice.maximo.MaximoTicketAssetSyncService maximoTicketAssetSyncService,
            // Maximo electronic task forms (data-driven templates + filled submissions; synced)
            @Lazy com.dk_power.power_plant_java.sevice.maximo.MaximoFormTemplateSyncService maximoFormTemplateSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.maximo.MaximoFormSubmissionSyncService maximoFormSubmissionSyncService,
            // Physical hierarchy (Maximo-seeded plant tree; synced so all desktops share it)
            @Lazy com.dk_power.power_plant_java.sevice.physical.PhysicalObjectSyncService physicalObjectSyncService,
            // 2026-07-15 registration-gap closure — diagrams + scheduler templates + sim + etapro report + ESP (all synced)
            @Lazy com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramService ngDiagramService,
            @Lazy com.dk_power.power_plant_java.sevice.angular.scheduler.FlowTemplateService flowTemplateService,
            @Lazy com.dk_power.power_plant_java.sevice.angular.scheduler.TaskTemplateService taskTemplateService,
            @Lazy com.dk_power.power_plant_java.sevice.angular.scheduler.TaskReferenceSyncService taskReferenceSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.angular.sim_equipment.NgSimEquipmentService ngSimEquipmentService,
            @Lazy com.dk_power.power_plant_java.sevice.angular.etapro.NgEtaProReportService ngEtaProReportService,
            @Lazy com.dk_power.power_plant_java.sevice.esp.EspDeviceSyncService espDeviceSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.esp.LedStripSyncService ledStripSyncService,
            // Schedule v2 (positions, rotations, crews, assignments, events, coverage, PTO, overrides — synced)
            @Lazy com.dk_power.power_plant_java.sevice.schedule.SchedulePositionSyncService schedulePositionSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.CrewRotationSyncService crewRotationSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.CrewSyncService crewSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.CrewAssignmentSyncService crewAssignmentSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.ScheduleEventSyncService scheduleEventSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.PtoRequestSyncService ptoRequestSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.CoverageRequestSyncService coverageRequestSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.CoverageSignupSyncService coverageSignupSyncService,
            @Lazy com.dk_power.power_plant_java.sevice.schedule.ScheduleDayOverrideSyncService scheduleDayOverrideSyncService
    ) {
        // Categories
        serviceMap.put(Category.class.getSimpleName(), categoryService);
        serviceMap.put(Value.class.getSimpleName(), valueService);
        // Files
        serviceMap.put(FileObject.class.getSimpleName(), fileService);
        serviceMap.put(com.dk_power.power_plant_java.entities.files.FileConnector.class.getSimpleName(), ngFileConnectorService);
        serviceMap.put(EngraverTemplate.class.getSimpleName(), ngEngraverTemplateService);
        // Equipment
        serviceMap.put(Equipment.class.getSimpleName(), equipmentService);
        serviceMap.put(HeatTrace.class.getSimpleName(), heatTraceService);
        serviceMap.put(Highlight.class.getSimpleName(), highlightService);
        serviceMap.put(ElectricalPanel.class.getSimpleName(), electricalPanelService);
        serviceMap.put(EqBreaker.class.getSimpleName(), eqBreakerService);
        serviceMap.put(HtPanel.class.getSimpleName(), htPanelService);
        serviceMap.put(HtBreaker.class.getSimpleName(), htBreakerService);
        serviceMap.put(Instrument.class.getSimpleName(), instrumentSyncService);
        serviceMap.put(InstrumentLog.class.getSimpleName(), instrumentLogSyncService);
        // LOTO
        serviceMap.put(LotoPoint.class.getSimpleName(), lotoPointService);
        serviceMap.put(Loto.class.getSimpleName(), ngLotoService);
        serviceMap.put(LotoStandard.class.getSimpleName(), ngLotoStandardService);
        serviceMap.put(RedTagStandard.class.getSimpleName(), ngRedTagStandardService);
        serviceMap.put(LotoBox.class.getSimpleName(), ngLotoBoxService);
        serviceMap.put(Lock.class.getSimpleName(), ngLockService);
        // LOTO lifecycle-event capture — see NgLotoSnapshotService javadoc for the
        // pre-fix silent-drop bug that motivated adding these to the sync map.
        serviceMap.put(LotoSnapshot.class.getSimpleName(), ngLotoSnapshotService);
        serviceMap.put(LotoStandardPendingChange.class.getSimpleName(), ngLotoStandardPendingChangeService);
        serviceMap.put(LotoStandardApprovalEvent.class.getSimpleName(), ngLotoStandardApprovalEventService);
        serviceMap.put(WalkdownSession.class.getSimpleName(), ngWalkdownSessionSyncService);
        serviceMap.put(ZeroEnergy.class.getSimpleName(), zeroEnergyService);
        // Comments
        serviceMap.put(Comment.class.getSimpleName(), ngCommentService);
        // Email Correspondence
        serviceMap.put(EmailCorrespondence.class.getSimpleName(), ngEmailCorrespondenceService);
        // Messaging
        serviceMap.put(Conversation.class.getSimpleName(), ngConversationService);
        serviceMap.put(Message.class.getSimpleName(), ngMessageService);
        // Users
        serviceMap.put(User.class.getSimpleName(), ngUserService);
        serviceMap.put(ShiftDay.class.getSimpleName(), shiftDaySyncService);
        serviceMap.put(ContractorChangeReport.class.getSimpleName(), contractorChangeReportSyncService);
        // Permits
        serviceMap.put(SafeWork.class.getSimpleName(), ngSafeWorkService);
        serviceMap.put(WorkCategoryProfile.class.getSimpleName(), workCategoryProfileSyncService);
        serviceMap.put(HotWork.class.getSimpleName(), ngHotWorkService);
        serviceMap.put(ConfinedSpace.class.getSimpleName(), ngConfinedSpaceService);
        serviceMap.put(WorkArea.class.getSimpleName(), ngWorkAreaService);
        serviceMap.put(WorkAreaMapShape.class.getSimpleName(), workAreaMapShapeSyncService);
        serviceMap.put(WorkRequest.class.getSimpleName(), ngWorkRequestService);
        serviceMap.put(Jha.class.getSimpleName(), ngJhaService);
        serviceMap.put(DailyPermitPackage.class.getSimpleName(), ngDailyPermitPackageService);
        serviceMap.put(JobLog.class.getSimpleName(), ngJobLogService);
        serviceMap.put(EnergizedWorkPermit.class.getSimpleName(), ngEnergizedWorkPermitService);
        serviceMap.put(ExcavationPermit.class.getSimpleName(), ngExcavationPermitService);
        serviceMap.put(VentingPermit.class.getSimpleName(), ngVentingPermitService);
        // Forms
        serviceMap.put(PrintableForm.class.getSimpleName(), printableFormService);
        serviceMap.put(FormContainer.class.getSimpleName(), formContainerService);
        // Scheduler
        serviceMap.put(Flow.class.getSimpleName(), flowService);
        serviceMap.put(Task.class.getSimpleName(), taskService);
        // Diagrams
        serviceMap.put(DiagramPlacement.class.getSimpleName(), ngDiagramPlacementService);
        serviceMap.put(DiagramConnection.class.getSimpleName(), ngDiagramConnectionService);
        // EtaPro (readings + log entries are @LocalOnlyEntity — not synced in either direction)
        serviceMap.put(EtaProPoint.class.getSimpleName(), etaProPointService);
        serviceMap.put(EtaProScrapeJob.class.getSimpleName(), etaProScrapeJobService);
        // Fire Impairment
        serviceMap.put(FireImpairment.class.getSimpleName(), fireImpairmentService);
        // Field Lists
        serviceMap.put(FieldListItem.class.getSimpleName(), fieldListItemSyncService);
        // Inventory
        serviceMap.put(InventoryItem.class.getSimpleName(), inventoryItemSyncService);
        serviceMap.put(InventoryUsage.class.getSimpleName(), inventoryUsageSyncService);
        // SDS
        serviceMap.put(SdsChemical.class.getSimpleName(), sdsChemicalSyncService);
        serviceMap.put(SdsAuditRecord.class.getSimpleName(), sdsAuditRecordSyncService);
        // Rounds (WebView AMS scraper)
        serviceMap.put(RoundsReport.class.getSimpleName(), ngRoundsService);
        // Maximo recurring-PM catalog (inbound apply was dropping it — "No service found for RecurringPm")
        serviceMap.put(com.dk_power.power_plant_java.entities.maximo.RecurringPm.class.getSimpleName(), recurringPmSyncService);
        // Maximo ticket→asset index
        serviceMap.put(com.dk_power.power_plant_java.entities.maximo.MaximoTicketAsset.class.getSimpleName(), maximoTicketAssetSyncService);
        // Maximo electronic task forms
        serviceMap.put(com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate.class.getSimpleName(), maximoFormTemplateSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission.class.getSimpleName(), maximoFormSubmissionSyncService);
        // Physical hierarchy (plant tree)
        serviceMap.put(com.dk_power.power_plant_java.entities.physical.PhysicalObject.class.getSimpleName(), physicalObjectSyncService);
        // 2026-07-15 registration-gap closure — diagrams, scheduler templates, sim, etapro report, ESP
        serviceMap.put(com.dk_power.power_plant_java.entities.diagrams.Diagram.class.getSimpleName(), ngDiagramService);
        serviceMap.put(com.dk_power.power_plant_java.entities.scheduler.FlowTemplate.class.getSimpleName(), flowTemplateService);
        serviceMap.put(com.dk_power.power_plant_java.entities.scheduler.TaskTemplate.class.getSimpleName(), taskTemplateService);
        serviceMap.put(com.dk_power.power_plant_java.entities.scheduler.TaskReference.class.getSimpleName(), taskReferenceSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.sim_equipment.SimEquipment.class.getSimpleName(), ngSimEquipmentService);
        serviceMap.put(com.dk_power.power_plant_java.entities.etapro.EtaProReport.class.getSimpleName(), ngEtaProReportService);
        serviceMap.put(com.dk_power.power_plant_java.entities.esp.EspDevice.class.getSimpleName(), espDeviceSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.esp.LedStrip.class.getSimpleName(), ledStripSyncService);
        // Schedule v2
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.SchedulePosition.class.getSimpleName(), schedulePositionSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.CrewRotation.class.getSimpleName(), crewRotationSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.Crew.class.getSimpleName(), crewSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.CrewAssignment.class.getSimpleName(), crewAssignmentSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.ScheduleEvent.class.getSimpleName(), scheduleEventSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.PtoRequest.class.getSimpleName(), ptoRequestSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.CoverageRequest.class.getSimpleName(), coverageRequestSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.CoverageSignup.class.getSimpleName(), coverageSignupSyncService);
        serviceMap.put(com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride.class.getSimpleName(), scheduleDayOverrideSyncService);
    }

    public SyncableService getService(String entityClass) {
        return serviceMap.get(entityClass);
    }
}
