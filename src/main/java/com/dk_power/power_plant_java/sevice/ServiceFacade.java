package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.diagrams.DiagramConnection;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.entities.equipment.*;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
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
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.*;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.sevice.forms.FormContainerService;
import com.dk_power.power_plant_java.sevice.forms.PrintableFormService;
import com.dk_power.power_plant_java.sevice.instrumentation.InstrumentLogSyncService;
import com.dk_power.power_plant_java.sevice.instrumentation.InstrumentSyncService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProPointService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProReadingService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScrapeJobService;
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
            // Permits
            @Lazy NgSafeWorkService ngSafeWorkService,
            @Lazy NgHotWorkService ngHotWorkService,
            @Lazy NgConfinedSpaceService ngConfinedSpaceService,
            @Lazy NgWorkAreaService ngWorkAreaService,
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
            // EtaPro
            @Lazy EtaProPointService etaProPointService,
            @Lazy EtaProReadingService etaProReadingService,
            @Lazy EtaProScrapeJobService etaProScrapeJobService
    ) {
        // Categories
        serviceMap.put(Category.class.getSimpleName(), categoryService);
        serviceMap.put(Value.class.getSimpleName(), valueService);
        // Files
        serviceMap.put(FileObject.class.getSimpleName(), fileService);
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
        serviceMap.put(LotoBox.class.getSimpleName(), ngLotoBoxService);
        serviceMap.put(Lock.class.getSimpleName(), ngLockService);
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
        // Permits
        serviceMap.put(SafeWork.class.getSimpleName(), ngSafeWorkService);
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
        // EtaPro
        serviceMap.put(EtaProPoint.class.getSimpleName(), etaProPointService);
        serviceMap.put(EtaProReading.class.getSimpleName(), etaProReadingService);
        serviceMap.put(EtaProScrapeJob.class.getSimpleName(), etaProScrapeJobService);
    }

    public SyncableService getService(String entityClass) {
        return serviceMap.get(entityClass);
    }
}
