import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  OverlayModule,
  WorkAreaDto
} from "./chunk-3YEG6ZAP.js";
import {
  FormContainerDto,
  PrintableFormDto
} from "./chunk-52YAMMEI.js";
import {
  BaseDto,
  CheckboxControlValueAccessor,
  DefaultValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormControlDirective,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControlStatus,
  NgControlStatusGroup,
  NgModel,
  NumberValueAccessor,
  ReactiveFormsModule,
  Validators
} from "./chunk-HH6S5SLA.js";
import {
  CommonModule,
  ElementRef,
  EventEmitter,
  NgForOf,
  NgIf,
  NgStyle,
  Observable,
  computed,
  forwardRef,
  inject,
  input,
  of,
  output,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-LMIOZ4NA.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/models/permits/energized-work-permit.model.ts
var EnergizedWorkChecklist = class {
  // Section 2 text fields
  jobDescription = "";
  safeWorkPractices = "";
  shockHazardAnalysis = "";
  flashProtectionBoundary = "";
  meansToRestrictAccess = "";
  // Item 3 sub-items (shock hazard boundaries) - text values
  limitedApproachBoundary = "";
  restrictedApproachBoundary = "";
  prohibitedApproachBoundary = "";
  // Item 4 sub-items (flash protection) - text values
  incidentEnergy = "";
  arcFlashPpe = "";
  arcFlashBoundary = "";
  // Checkboxes
  jobDescriptionComplete = false;
  safeWorkPracticesComplete = false;
  shockHazardAnalysisComplete = false;
  limitedApproachBoundaryComplete = false;
  restrictedApproachBoundaryComplete = false;
  prohibitedApproachBoundaryComplete = false;
  incidentEnergyComplete = false;
  arcFlashPpeComplete = false;
  arcFlashBoundaryComplete = false;
  meansToRestrictAccessComplete = false;
  preJobBriefComplete = false;
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var EnergizedWorkPermitDto = class _EnergizedWorkPermitDto extends BaseDto {
  date;
  time;
  location;
  issuedTo;
  workScope;
  redTagNum;
  permitNumber;
  workArea;
  workOrder;
  circuitDescription;
  workDescription;
  justification;
  requester;
  requesterDate;
  qualifiedPersonSignature;
  qualifiedPersonDate;
  plantManagerSignature;
  plantManagerDate;
  workCanBePerformedSafely;
  checklist;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.workOrder = data.workOrder ?? null;
    this.circuitDescription = data.circuitDescription ?? null;
    this.workDescription = data.workDescription ?? null;
    this.justification = data.justification ?? null;
    this.requester = data.requester ?? null;
    this.requesterDate = data.requesterDate ?? null;
    this.qualifiedPersonSignature = data.qualifiedPersonSignature ?? null;
    this.qualifiedPersonDate = data.qualifiedPersonDate ?? null;
    this.plantManagerSignature = data.plantManagerSignature ?? null;
    this.plantManagerDate = data.plantManagerDate ?? null;
    this.workCanBePerformedSafely = data.workCanBePerformedSafely ?? false;
    this.checklist = data.checklist ? new EnergizedWorkChecklist(data.checklist) : null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      location: this.location,
      issuedTo: this.issuedTo,
      workScope: this.workScope,
      redTagNum: this.redTagNum,
      permitNumber: this.permitNumber,
      workArea: this.workArea,
      workOrder: this.workOrder,
      circuitDescription: this.circuitDescription,
      workDescription: this.workDescription,
      justification: this.justification,
      requester: this.requester,
      requesterDate: this.requesterDate,
      qualifiedPersonSignature: this.qualifiedPersonSignature,
      qualifiedPersonDate: this.qualifiedPersonDate,
      plantManagerSignature: this.plantManagerSignature,
      plantManagerDate: this.plantManagerDate,
      workCanBePerformedSafely: this.workCanBePerformedSafely,
      checklist: this.checklist
    });
  }
  static fromJson(json) {
    if (!json)
      return new _EnergizedWorkPermitDto();
    return new _EnergizedWorkPermitDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      workOrder: json.workOrder,
      circuitDescription: json.circuitDescription,
      workDescription: json.workDescription,
      justification: json.justification,
      requester: json.requester,
      requesterDate: json.requesterDate,
      qualifiedPersonSignature: json.qualifiedPersonSignature,
      qualifiedPersonDate: json.qualifiedPersonDate,
      plantManagerSignature: json.plantManagerSignature,
      plantManagerDate: json.plantManagerDate,
      workCanBePerformedSafely: json.workCanBePerformedSafely ?? false,
      checklist: json.checklist ? new EnergizedWorkChecklist(json.checklist) : null
    }));
  }
  static getChecklistFields(checklistDto) {
    const checklist = checklistDto || new EnergizedWorkChecklist();
    const group = { label: "Energized Work Checklist", orientation: "vertical" };
    return {
      // 1. Job description
      "checklist.jobDescription": { name: "checklist.jobDescription", label: "Job Description", type: "text", initialValue: checklist.jobDescription, group },
      "checklist.jobDescriptionComplete": { name: "checklist.jobDescriptionComplete", label: "Job Description Complete", type: "checkbox", initialValue: checklist.jobDescriptionComplete, group },
      // 2. Safe work practices
      "checklist.safeWorkPractices": { name: "checklist.safeWorkPractices", label: "Safe Work Practices", type: "text", initialValue: checklist.safeWorkPractices, group },
      "checklist.safeWorkPracticesComplete": { name: "checklist.safeWorkPracticesComplete", label: "Safe Work Practices Complete", type: "checkbox", initialValue: checklist.safeWorkPracticesComplete, group },
      // 3. Shock hazard analysis
      "checklist.shockHazardAnalysis": { name: "checklist.shockHazardAnalysis", label: "Shock Hazard Analysis", type: "text", initialValue: checklist.shockHazardAnalysis, group },
      "checklist.shockHazardAnalysisComplete": { name: "checklist.shockHazardAnalysisComplete", label: "Shock Hazard Analysis Complete", type: "checkbox", initialValue: checklist.shockHazardAnalysisComplete, group },
      "checklist.limitedApproachBoundary": { name: "checklist.limitedApproachBoundary", label: "Limited Approach Boundary", type: "text", initialValue: checklist.limitedApproachBoundary, group },
      "checklist.limitedApproachBoundaryComplete": { name: "checklist.limitedApproachBoundaryComplete", label: "Limited Approach Boundary Complete", type: "checkbox", initialValue: checklist.limitedApproachBoundaryComplete, group },
      "checklist.restrictedApproachBoundary": { name: "checklist.restrictedApproachBoundary", label: "Restricted Approach Boundary", type: "text", initialValue: checklist.restrictedApproachBoundary, group },
      "checklist.restrictedApproachBoundaryComplete": { name: "checklist.restrictedApproachBoundaryComplete", label: "Restricted Approach Boundary Complete", type: "checkbox", initialValue: checklist.restrictedApproachBoundaryComplete, group },
      "checklist.prohibitedApproachBoundary": { name: "checklist.prohibitedApproachBoundary", label: "Prohibited Approach Boundary", type: "text", initialValue: checklist.prohibitedApproachBoundary, group },
      "checklist.prohibitedApproachBoundaryComplete": { name: "checklist.prohibitedApproachBoundaryComplete", label: "Prohibited Approach Boundary Complete", type: "checkbox", initialValue: checklist.prohibitedApproachBoundaryComplete, group },
      // 4. Flash protection boundary
      "checklist.flashProtectionBoundary": { name: "checklist.flashProtectionBoundary", label: "Flash Protection Boundary", type: "text", initialValue: checklist.flashProtectionBoundary, group },
      "checklist.incidentEnergy": { name: "checklist.incidentEnergy", label: "Incident Energy / Arc Flash PPE Category", type: "text", initialValue: checklist.incidentEnergy, group },
      "checklist.incidentEnergyComplete": { name: "checklist.incidentEnergyComplete", label: "Incident Energy Complete", type: "checkbox", initialValue: checklist.incidentEnergyComplete, group },
      "checklist.arcFlashPpe": { name: "checklist.arcFlashPpe", label: "Arc Flash PPE", type: "text", initialValue: checklist.arcFlashPpe, group },
      "checklist.arcFlashPpeComplete": { name: "checklist.arcFlashPpeComplete", label: "Arc Flash PPE Complete", type: "checkbox", initialValue: checklist.arcFlashPpeComplete, group },
      "checklist.arcFlashBoundary": { name: "checklist.arcFlashBoundary", label: "Arc Flash Boundary", type: "text", initialValue: checklist.arcFlashBoundary, group },
      "checklist.arcFlashBoundaryComplete": { name: "checklist.arcFlashBoundaryComplete", label: "Arc Flash Boundary Complete", type: "checkbox", initialValue: checklist.arcFlashBoundaryComplete, group },
      // 5. Means to restrict access
      "checklist.meansToRestrictAccess": { name: "checklist.meansToRestrictAccess", label: "Means to Restrict Access", type: "text", initialValue: checklist.meansToRestrictAccess, group },
      "checklist.meansToRestrictAccessComplete": { name: "checklist.meansToRestrictAccessComplete", label: "Means to Restrict Access Complete", type: "checkbox", initialValue: checklist.meansToRestrictAccessComplete, group },
      // 6. Pre-Job Brief
      "checklist.preJobBriefComplete": { name: "checklist.preJobBriefComplete", label: "Pre-Job Brief Complete", type: "checkbox", initialValue: checklist.preJobBriefComplete, group }
    };
  }
  static toFormFields(dto, fields = [
    "workArea",
    "date",
    "workOrder",
    "circuitDescription",
    "workDescription",
    "justification",
    "requester",
    "requesterDate",
    ...Object.keys(_EnergizedWorkPermitDto.getChecklistFields(null)),
    "workCanBePerformedSafely",
    "qualifiedPersonSignature",
    "qualifiedPersonDate",
    "plantManagerSignature",
    "plantManagerDate"
  ]) {
    const checklistFields = _EnergizedWorkPermitDto.getChecklistFields(dto.checklist);
    const allFields = __spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      workArea: {
        name: "workArea",
        label: "Work Area",
        type: "work-area-select",
        initialValue: dto.workArea?.id ?? null,
        context: { viewMode: "map", fallbackText: dto.location }
      },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: { name: "time", label: "Time", type: "time", initialValue: dto.time },
      location: { name: "location", label: "Location", type: "text", initialValue: dto.location },
      issuedTo: { name: "issuedTo", label: "Issued To", type: "text", initialValue: dto.issuedTo },
      workScope: { name: "workScope", label: "Work Scope", type: "textarea", initialValue: dto.workScope },
      redTagNum: { name: "redTagNum", label: "Red Tag #", type: "text", initialValue: dto.redTagNum },
      permitNumber: { name: "permitNumber", label: "Permit Number", type: "text", readonly: true, initialValue: dto.permitNumber },
      workOrder: { name: "workOrder", label: "Work Order", type: "text", initialValue: dto.workOrder },
      circuitDescription: { name: "circuitDescription", label: "Circuit Description", type: "textarea", initialValue: dto.circuitDescription },
      workDescription: { name: "workDescription", label: "Work Description", type: "textarea", initialValue: dto.workDescription },
      justification: { name: "justification", label: "Justification", type: "textarea", initialValue: dto.justification },
      requester: { name: "requester", label: "Requester", type: "text", initialValue: dto.requester },
      requesterDate: { name: "requesterDate", label: "Requester Date", type: "date", initialValue: dto.requesterDate },
      qualifiedPersonSignature: { name: "qualifiedPersonSignature", label: "Qualified Person Signature", type: "text", initialValue: dto.qualifiedPersonSignature },
      qualifiedPersonDate: { name: "qualifiedPersonDate", label: "Qualified Person Date", type: "date", initialValue: dto.qualifiedPersonDate },
      plantManagerSignature: { name: "plantManagerSignature", label: "Plant Manager Signature", type: "text", initialValue: dto.plantManagerSignature },
      plantManagerDate: { name: "plantManagerDate", label: "Plant Manager Date", type: "date", initialValue: dto.plantManagerDate },
      workCanBePerformedSafely: {
        name: "workCanBePerformedSafely",
        label: "Work Can Be Performed Safely",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.workCanBePerformedSafely?.toString()
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType }
    }, checklistFields);
    return fields.map((f) => allFields[f]).filter((f) => f !== void 0);
  }
  static toTableColumns(fields = ["permitNumber", "date", "location", "workOrder", "requester", "workCanBePerformedSafely"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      name: { id: "name", header: "Name", accessorKey: "name" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      issuedTo: { id: "issuedTo", header: "Issued To", accessorKey: "issuedTo" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      permitNumber: { id: "permitNumber", header: "Permit #", accessorKey: "permitNumber" },
      workOrder: { id: "workOrder", header: "Work Order", accessorKey: "workOrder" },
      circuitDescription: { id: "circuitDescription", header: "Circuit Description", accessorKey: "circuitDescription" },
      workDescription: { id: "workDescription", header: "Work Description", accessorKey: "workDescription" },
      justification: { id: "justification", header: "Justification", accessorKey: "justification" },
      requester: { id: "requester", header: "Requester", accessorKey: "requester" },
      requesterDate: { id: "requesterDate", header: "Requester Date", accessorKey: "requesterDate" },
      qualifiedPersonSignature: { id: "qualifiedPersonSignature", header: "Qualified Person", accessorKey: "qualifiedPersonSignature" },
      qualifiedPersonDate: { id: "qualifiedPersonDate", header: "Qualified Person Date", accessorKey: "qualifiedPersonDate" },
      plantManagerSignature: { id: "plantManagerSignature", header: "Plant Manager", accessorKey: "plantManagerSignature" },
      plantManagerDate: { id: "plantManagerDate", header: "Plant Manager Date", accessorKey: "plantManagerDate" },
      workCanBePerformedSafely: {
        id: "workCanBePerformedSafely",
        header: "Safe to Perform",
        accessorFn: (item) => item.workCanBePerformedSafely ? "Yes" : "No"
      },
      checklist: {
        id: "checklist",
        header: "Checklist",
        accessorFn: (item) => item.checklist ? "Complete" : "N/A"
      }
    };
    return fields.map((f) => allColumns[f]).filter((c) => c !== void 0);
  }
  static generatePermitFromRequest(request) {
    return new _EnergizedWorkPermitDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0] ?? null,
      location: request.location,
      workScope: request.workScope,
      workDescription: request.workScope,
      requester: request.requestedBy,
      requesterDate: request.dateOfWorkToBePerformed?.split("T")[0] ?? null
    });
  }
  static isValidKey(key) {
    return [
      "id",
      "name",
      "objectType",
      "isVerified",
      "date",
      "time",
      "location",
      "issuedTo",
      "workScope",
      "redTagNum",
      "permitNumber",
      "workArea",
      "workOrder",
      "circuitDescription",
      "workDescription",
      "justification",
      "requester",
      "requesterDate",
      "qualifiedPersonSignature",
      "qualifiedPersonDate",
      "plantManagerSignature",
      "plantManagerDate",
      "workCanBePerformedSafely",
      "checklist"
    ].includes(key);
  }
};

// src/app/models/permits/excavation-permit.model.ts
var ExcavationTypeOfWork = class {
  excavation = false;
  boring = false;
  drilling = false;
  cutting = false;
  blindPenetration = false;
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ExcavationChecklist = class {
  // General Info
  lessThan4Ft = "";
  caveInPotential = "";
  deeperThan4Ft = "";
  slopingUsed = "";
  // Jobsite Inspection
  dailyInspection = "";
  competentPersonAuthority = "";
  surfaceEncumbrances = "";
  looseRockProtection = "";
  hardHats = "";
  spoilsSetBack = "";
  adequateBarriers = "";
  standAwayFromVehicles = "";
  warningSystem = "";
  noSuspendedLoads = "";
  // Utilities
  utilitiesMarked = "";
  handDigging = "";
  utilitiesProtected = "";
  // Access/Egress
  egressDistance = "";
  laddersExtend = "";
  // Wet Conditions
  precautionsForWater = "";
  diversionDitches = "";
  inspectionAfterRain = "";
  // Hazardous Atmosphere
  atmosphereTested = "";
  oxygenDeficiency = "";
  lowOxygen = "";
  combustibleGas = "";
  emergencyEquipment = "";
  ventilationProvided = "";
  attendantProvided = "";
  atmosphericMonitoring = "";
  safetyEquipment = "";
  evacuationWarning = "";
  // Support Systems
  supportSystemDesigned = "";
  materialsGoodCondition = "";
  membersSecured = "";
  timberedExcavations = "";
  backfillProgression = "";
  removalFromBottom = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ExcavationPermitDto = class _ExcavationPermitDto extends BaseDto {
  date;
  time;
  location;
  issuedTo;
  workScope;
  redTagNum;
  permitNumber;
  workArea;
  supervisor;
  jobLocation;
  supervisorPhone;
  excavationDescription;
  workOrder;
  typeOfWork;
  locationPipingMarked;
  supervisorApprovalDate;
  supervisorApprovalTime;
  permitClosedDate;
  permitClosedTime;
  jobStatusComplete;
  inspectionsJson;
  supervisorFieldInspectionName;
  supervisorFieldInspectionDate;
  supervisorFieldInspectionTime;
  facilityName;
  competentPerson;
  soilType;
  excavationDepth;
  excavationWidth;
  protectiveSystemType;
  checklist;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.supervisor = data.supervisor ?? null;
    this.jobLocation = data.jobLocation ?? null;
    this.supervisorPhone = data.supervisorPhone ?? null;
    this.excavationDescription = data.excavationDescription ?? null;
    this.workOrder = data.workOrder ?? null;
    this.typeOfWork = data.typeOfWork ? new ExcavationTypeOfWork(data.typeOfWork) : null;
    this.locationPipingMarked = data.locationPipingMarked ?? false;
    this.supervisorApprovalDate = data.supervisorApprovalDate ?? null;
    this.supervisorApprovalTime = data.supervisorApprovalTime ?? null;
    this.permitClosedDate = data.permitClosedDate ?? null;
    this.permitClosedTime = data.permitClosedTime ?? null;
    this.jobStatusComplete = data.jobStatusComplete ?? false;
    this.inspectionsJson = data.inspectionsJson ?? [];
    this.supervisorFieldInspectionName = data.supervisorFieldInspectionName ?? null;
    this.supervisorFieldInspectionDate = data.supervisorFieldInspectionDate ?? null;
    this.supervisorFieldInspectionTime = data.supervisorFieldInspectionTime ?? null;
    this.facilityName = data.facilityName ?? null;
    this.competentPerson = data.competentPerson ?? null;
    this.soilType = data.soilType ?? null;
    this.excavationDepth = data.excavationDepth ?? null;
    this.excavationWidth = data.excavationWidth ?? null;
    this.protectiveSystemType = data.protectiveSystemType ?? null;
    this.checklist = data.checklist ? new ExcavationChecklist(data.checklist) : null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      location: this.location,
      issuedTo: this.issuedTo,
      workScope: this.workScope,
      redTagNum: this.redTagNum,
      permitNumber: this.permitNumber,
      workArea: this.workArea,
      supervisor: this.supervisor,
      jobLocation: this.jobLocation,
      supervisorPhone: this.supervisorPhone,
      excavationDescription: this.excavationDescription,
      workOrder: this.workOrder,
      typeOfWork: this.typeOfWork,
      locationPipingMarked: this.locationPipingMarked,
      supervisorApprovalDate: this.supervisorApprovalDate,
      supervisorApprovalTime: this.supervisorApprovalTime,
      permitClosedDate: this.permitClosedDate,
      permitClosedTime: this.permitClosedTime,
      jobStatusComplete: this.jobStatusComplete,
      inspectionsJson: this.inspectionsJson ? JSON.stringify(this.inspectionsJson) : null,
      supervisorFieldInspectionName: this.supervisorFieldInspectionName,
      supervisorFieldInspectionDate: this.supervisorFieldInspectionDate,
      supervisorFieldInspectionTime: this.supervisorFieldInspectionTime,
      facilityName: this.facilityName,
      competentPerson: this.competentPerson,
      soilType: this.soilType,
      excavationDepth: this.excavationDepth,
      excavationWidth: this.excavationWidth,
      protectiveSystemType: this.protectiveSystemType,
      checklist: this.checklist
    });
  }
  static fromJson(json) {
    if (!json)
      return new _ExcavationPermitDto();
    return new _ExcavationPermitDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      supervisor: json.supervisor,
      jobLocation: json.jobLocation,
      supervisorPhone: json.supervisorPhone,
      excavationDescription: json.excavationDescription,
      workOrder: json.workOrder,
      typeOfWork: json.typeOfWork ? new ExcavationTypeOfWork(json.typeOfWork) : null,
      locationPipingMarked: json.locationPipingMarked ?? false,
      supervisorApprovalDate: json.supervisorApprovalDate,
      supervisorApprovalTime: json.supervisorApprovalTime,
      permitClosedDate: json.permitClosedDate,
      permitClosedTime: json.permitClosedTime,
      jobStatusComplete: json.jobStatusComplete ?? false,
      inspectionsJson: json.inspectionsJson ? typeof json.inspectionsJson === "string" ? JSON.parse(json.inspectionsJson) : json.inspectionsJson : [],
      supervisorFieldInspectionName: json.supervisorFieldInspectionName,
      supervisorFieldInspectionDate: json.supervisorFieldInspectionDate,
      supervisorFieldInspectionTime: json.supervisorFieldInspectionTime,
      facilityName: json.facilityName,
      competentPerson: json.competentPerson,
      soilType: json.soilType,
      excavationDepth: json.excavationDepth,
      excavationWidth: json.excavationWidth,
      protectiveSystemType: json.protectiveSystemType,
      checklist: json.checklist ? new ExcavationChecklist(json.checklist) : null
    }));
  }
  static getTypeOfWorkFields(typeOfWorkDto) {
    const typeOfWork = typeOfWorkDto || new ExcavationTypeOfWork();
    const group = { label: "Type of Work", orientation: "horizontal" };
    return {
      "typeOfWork.excavation": { name: "typeOfWork.excavation", label: "Excavation", type: "checkbox", initialValue: typeOfWork.excavation, group },
      "typeOfWork.boring": { name: "typeOfWork.boring", label: "Boring", type: "checkbox", initialValue: typeOfWork.boring, group },
      "typeOfWork.drilling": { name: "typeOfWork.drilling", label: "Drilling", type: "checkbox", initialValue: typeOfWork.drilling, group },
      "typeOfWork.cutting": { name: "typeOfWork.cutting", label: "Cutting", type: "checkbox", initialValue: typeOfWork.cutting, group },
      "typeOfWork.blindPenetration": { name: "typeOfWork.blindPenetration", label: "Blind Penetration", type: "checkbox", initialValue: typeOfWork.blindPenetration, group }
    };
  }
  static getChecklistFields(checklistDto) {
    const checklist = checklistDto || new ExcavationChecklist();
    const yesNoNaOptions = [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "na", label: "N/A" }
    ];
    const generalGroup = { label: "General Info", orientation: "vertical" };
    const jobsiteGroup = { label: "Jobsite Inspection", orientation: "vertical" };
    const utilitiesGroup = { label: "Utilities", orientation: "vertical" };
    const egressGroup = { label: "Access/Egress", orientation: "vertical" };
    const wetGroup = { label: "Wet Conditions", orientation: "vertical" };
    const hazAtmoGroup = { label: "Hazardous Atmosphere", orientation: "vertical" };
    const supportGroup = { label: "Support Systems", orientation: "vertical" };
    return {
      // General Info
      "checklist.lessThan4Ft": { name: "checklist.lessThan4Ft", label: "Less Than 4 Ft", type: "select", options: yesNoNaOptions, initialValue: checklist.lessThan4Ft, group: generalGroup },
      "checklist.caveInPotential": { name: "checklist.caveInPotential", label: "Cave-In Potential", type: "select", options: yesNoNaOptions, initialValue: checklist.caveInPotential, group: generalGroup },
      "checklist.deeperThan4Ft": { name: "checklist.deeperThan4Ft", label: "Deeper Than 4 Ft", type: "select", options: yesNoNaOptions, initialValue: checklist.deeperThan4Ft, group: generalGroup },
      "checklist.slopingUsed": { name: "checklist.slopingUsed", label: "Sloping Used", type: "select", options: yesNoNaOptions, initialValue: checklist.slopingUsed, group: generalGroup },
      // Jobsite Inspection
      "checklist.dailyInspection": { name: "checklist.dailyInspection", label: "Daily Inspection", type: "select", options: yesNoNaOptions, initialValue: checklist.dailyInspection, group: jobsiteGroup },
      "checklist.competentPersonAuthority": { name: "checklist.competentPersonAuthority", label: "Competent Person Authority", type: "select", options: yesNoNaOptions, initialValue: checklist.competentPersonAuthority, group: jobsiteGroup },
      "checklist.surfaceEncumbrances": { name: "checklist.surfaceEncumbrances", label: "Surface Encumbrances", type: "select", options: yesNoNaOptions, initialValue: checklist.surfaceEncumbrances, group: jobsiteGroup },
      "checklist.looseRockProtection": { name: "checklist.looseRockProtection", label: "Loose Rock Protection", type: "select", options: yesNoNaOptions, initialValue: checklist.looseRockProtection, group: jobsiteGroup },
      "checklist.hardHats": { name: "checklist.hardHats", label: "Hard Hats", type: "select", options: yesNoNaOptions, initialValue: checklist.hardHats, group: jobsiteGroup },
      "checklist.spoilsSetBack": { name: "checklist.spoilsSetBack", label: "Spoils Set Back", type: "select", options: yesNoNaOptions, initialValue: checklist.spoilsSetBack, group: jobsiteGroup },
      "checklist.adequateBarriers": { name: "checklist.adequateBarriers", label: "Adequate Barriers", type: "select", options: yesNoNaOptions, initialValue: checklist.adequateBarriers, group: jobsiteGroup },
      "checklist.standAwayFromVehicles": { name: "checklist.standAwayFromVehicles", label: "Stand Away From Vehicles", type: "select", options: yesNoNaOptions, initialValue: checklist.standAwayFromVehicles, group: jobsiteGroup },
      "checklist.warningSystem": { name: "checklist.warningSystem", label: "Warning System", type: "select", options: yesNoNaOptions, initialValue: checklist.warningSystem, group: jobsiteGroup },
      "checklist.noSuspendedLoads": { name: "checklist.noSuspendedLoads", label: "No Suspended Loads", type: "select", options: yesNoNaOptions, initialValue: checklist.noSuspendedLoads, group: jobsiteGroup },
      // Utilities
      "checklist.utilitiesMarked": { name: "checklist.utilitiesMarked", label: "Utilities Marked", type: "select", options: yesNoNaOptions, initialValue: checklist.utilitiesMarked, group: utilitiesGroup },
      "checklist.handDigging": { name: "checklist.handDigging", label: "Hand Digging", type: "select", options: yesNoNaOptions, initialValue: checklist.handDigging, group: utilitiesGroup },
      "checklist.utilitiesProtected": { name: "checklist.utilitiesProtected", label: "Utilities Protected", type: "select", options: yesNoNaOptions, initialValue: checklist.utilitiesProtected, group: utilitiesGroup },
      // Access/Egress
      "checklist.egressDistance": { name: "checklist.egressDistance", label: "Egress Distance", type: "select", options: yesNoNaOptions, initialValue: checklist.egressDistance, group: egressGroup },
      "checklist.laddersExtend": { name: "checklist.laddersExtend", label: "Ladders Extend", type: "select", options: yesNoNaOptions, initialValue: checklist.laddersExtend, group: egressGroup },
      // Wet Conditions
      "checklist.precautionsForWater": { name: "checklist.precautionsForWater", label: "Precautions for Water", type: "select", options: yesNoNaOptions, initialValue: checklist.precautionsForWater, group: wetGroup },
      "checklist.diversionDitches": { name: "checklist.diversionDitches", label: "Diversion Ditches", type: "select", options: yesNoNaOptions, initialValue: checklist.diversionDitches, group: wetGroup },
      "checklist.inspectionAfterRain": { name: "checklist.inspectionAfterRain", label: "Inspection After Rain", type: "select", options: yesNoNaOptions, initialValue: checklist.inspectionAfterRain, group: wetGroup },
      // Hazardous Atmosphere
      "checklist.atmosphereTested": { name: "checklist.atmosphereTested", label: "Atmosphere Tested", type: "select", options: yesNoNaOptions, initialValue: checklist.atmosphereTested, group: hazAtmoGroup },
      "checklist.oxygenDeficiency": { name: "checklist.oxygenDeficiency", label: "Oxygen Deficiency", type: "select", options: yesNoNaOptions, initialValue: checklist.oxygenDeficiency, group: hazAtmoGroup },
      "checklist.lowOxygen": { name: "checklist.lowOxygen", label: "Low Oxygen", type: "select", options: yesNoNaOptions, initialValue: checklist.lowOxygen, group: hazAtmoGroup },
      "checklist.combustibleGas": { name: "checklist.combustibleGas", label: "Combustible Gas", type: "select", options: yesNoNaOptions, initialValue: checklist.combustibleGas, group: hazAtmoGroup },
      "checklist.emergencyEquipment": { name: "checklist.emergencyEquipment", label: "Emergency Equipment", type: "select", options: yesNoNaOptions, initialValue: checklist.emergencyEquipment, group: hazAtmoGroup },
      "checklist.ventilationProvided": { name: "checklist.ventilationProvided", label: "Ventilation Provided", type: "select", options: yesNoNaOptions, initialValue: checklist.ventilationProvided, group: hazAtmoGroup },
      "checklist.attendantProvided": { name: "checklist.attendantProvided", label: "Attendant Provided", type: "select", options: yesNoNaOptions, initialValue: checklist.attendantProvided, group: hazAtmoGroup },
      "checklist.atmosphericMonitoring": { name: "checklist.atmosphericMonitoring", label: "Atmospheric Monitoring", type: "select", options: yesNoNaOptions, initialValue: checklist.atmosphericMonitoring, group: hazAtmoGroup },
      "checklist.safetyEquipment": { name: "checklist.safetyEquipment", label: "Safety Equipment", type: "select", options: yesNoNaOptions, initialValue: checklist.safetyEquipment, group: hazAtmoGroup },
      "checklist.evacuationWarning": { name: "checklist.evacuationWarning", label: "Evacuation Warning", type: "select", options: yesNoNaOptions, initialValue: checklist.evacuationWarning, group: hazAtmoGroup },
      // Support Systems
      "checklist.supportSystemDesigned": { name: "checklist.supportSystemDesigned", label: "Support System Designed", type: "select", options: yesNoNaOptions, initialValue: checklist.supportSystemDesigned, group: supportGroup },
      "checklist.materialsGoodCondition": { name: "checklist.materialsGoodCondition", label: "Materials Good Condition", type: "select", options: yesNoNaOptions, initialValue: checklist.materialsGoodCondition, group: supportGroup },
      "checklist.membersSecured": { name: "checklist.membersSecured", label: "Members Secured", type: "select", options: yesNoNaOptions, initialValue: checklist.membersSecured, group: supportGroup },
      "checklist.timberedExcavations": { name: "checklist.timberedExcavations", label: "Timbered Excavations", type: "select", options: yesNoNaOptions, initialValue: checklist.timberedExcavations, group: supportGroup },
      "checklist.backfillProgression": { name: "checklist.backfillProgression", label: "Backfill Progression", type: "select", options: yesNoNaOptions, initialValue: checklist.backfillProgression, group: supportGroup },
      "checklist.removalFromBottom": { name: "checklist.removalFromBottom", label: "Removal From Bottom", type: "select", options: yesNoNaOptions, initialValue: checklist.removalFromBottom, group: supportGroup }
    };
  }
  static toFormFields(dto, fields = [
    "workArea",
    "date",
    "time",
    "workOrder",
    "supervisor",
    "jobLocation",
    "supervisorPhone",
    "excavationDescription",
    "locationPipingMarked",
    ...Object.keys(_ExcavationPermitDto.getTypeOfWorkFields(null)),
    "inspectionsJson",
    "facilityName",
    "competentPerson",
    "soilType",
    "excavationDepth",
    "excavationWidth",
    "protectiveSystemType",
    ...Object.keys(_ExcavationPermitDto.getChecklistFields(null))
  ]) {
    const typeOfWorkFields = _ExcavationPermitDto.getTypeOfWorkFields(dto.typeOfWork);
    const checklistFields = _ExcavationPermitDto.getChecklistFields(dto.checklist);
    const allFields = __spreadValues(__spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      workArea: {
        name: "workArea",
        label: "Work Area",
        type: "work-area-select",
        initialValue: dto.workArea?.id ?? null,
        context: { viewMode: "map", fallbackText: dto.location }
      },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: { name: "time", label: "Time", type: "time", initialValue: dto.time },
      location: { name: "location", label: "Location", type: "text", initialValue: dto.location },
      issuedTo: { name: "issuedTo", label: "Issued To", type: "text", initialValue: dto.issuedTo },
      workScope: { name: "workScope", label: "Work Scope", type: "textarea", initialValue: dto.workScope },
      redTagNum: { name: "redTagNum", label: "Red Tag #", type: "text", initialValue: dto.redTagNum },
      permitNumber: { name: "permitNumber", label: "Permit Number", type: "text", readonly: true, initialValue: dto.permitNumber },
      supervisor: { name: "supervisor", label: "Supervisor", type: "text", validators: [Validators.required], initialValue: dto.supervisor },
      jobLocation: { name: "jobLocation", label: "Job Location", type: "text", validators: [Validators.required], initialValue: dto.jobLocation },
      supervisorPhone: { name: "supervisorPhone", label: "Supervisor Phone", type: "text", initialValue: dto.supervisorPhone },
      excavationDescription: { name: "excavationDescription", label: "Excavation Description", type: "textarea", initialValue: dto.excavationDescription },
      workOrder: { name: "workOrder", label: "Work Order", type: "text", initialValue: dto.workOrder },
      locationPipingMarked: {
        name: "locationPipingMarked",
        label: "Location/Piping Marked",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.locationPipingMarked?.toString()
      },
      supervisorApprovalDate: { name: "supervisorApprovalDate", label: "Supervisor Approval Date", type: "date", initialValue: dto.supervisorApprovalDate },
      supervisorApprovalTime: { name: "supervisorApprovalTime", label: "Supervisor Approval Time", type: "time", initialValue: dto.supervisorApprovalTime },
      permitClosedDate: { name: "permitClosedDate", label: "Permit Closed Date", type: "date", initialValue: dto.permitClosedDate },
      permitClosedTime: { name: "permitClosedTime", label: "Permit Closed Time", type: "time", initialValue: dto.permitClosedTime },
      jobStatusComplete: {
        name: "jobStatusComplete",
        label: "Job Status Complete",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.jobStatusComplete?.toString()
      },
      supervisorFieldInspectionName: { name: "supervisorFieldInspectionName", label: "Field Inspection Name", type: "text", initialValue: dto.supervisorFieldInspectionName },
      supervisorFieldInspectionDate: { name: "supervisorFieldInspectionDate", label: "Field Inspection Date", type: "date", initialValue: dto.supervisorFieldInspectionDate },
      supervisorFieldInspectionTime: { name: "supervisorFieldInspectionTime", label: "Field Inspection Time", type: "time", initialValue: dto.supervisorFieldInspectionTime },
      facilityName: { name: "facilityName", label: "Facility Name", type: "text", initialValue: dto.facilityName },
      competentPerson: { name: "competentPerson", label: "Competent Person", type: "text", initialValue: dto.competentPerson },
      soilType: { name: "soilType", label: "Soil Type", type: "text", initialValue: dto.soilType },
      excavationDepth: { name: "excavationDepth", label: "Excavation Depth", type: "text", initialValue: dto.excavationDepth },
      excavationWidth: { name: "excavationWidth", label: "Excavation Width", type: "text", initialValue: dto.excavationWidth },
      protectiveSystemType: { name: "protectiveSystemType", label: "Protective System Type", type: "text", initialValue: dto.protectiveSystemType },
      inspectionsJson: {
        name: "inspectionsJson",
        label: "Site Inspections",
        type: "form-array",
        initialValue: dto.inspectionsJson || [],
        fields: [
          { name: "date", label: "Date", type: "date" },
          { name: "time", label: "Time", type: "text" },
          { name: "inspector", label: "Inspector", type: "text" },
          { name: "comments", label: "Comments", type: "text" }
        ]
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType }
    }, typeOfWorkFields), checklistFields);
    return fields.map((f) => allFields[f]).filter((f) => f !== void 0);
  }
  static toTableColumns(fields = ["permitNumber", "date", "supervisor", "jobLocation", "excavationDescription"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      name: { id: "name", header: "Name", accessorKey: "name" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      issuedTo: { id: "issuedTo", header: "Issued To", accessorKey: "issuedTo" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      permitNumber: { id: "permitNumber", header: "Permit #", accessorKey: "permitNumber" },
      supervisor: { id: "supervisor", header: "Supervisor", accessorKey: "supervisor" },
      jobLocation: { id: "jobLocation", header: "Job Location", accessorKey: "jobLocation" },
      supervisorPhone: { id: "supervisorPhone", header: "Supervisor Phone", accessorKey: "supervisorPhone" },
      excavationDescription: { id: "excavationDescription", header: "Description", accessorKey: "excavationDescription" },
      workOrder: { id: "workOrder", header: "Work Order", accessorKey: "workOrder" },
      typeOfWork: {
        id: "typeOfWork",
        header: "Type of Work",
        accessorFn: (item) => {
          if (!item.typeOfWork)
            return "";
          const types = [];
          if (item.typeOfWork.excavation)
            types.push("Excavation");
          if (item.typeOfWork.boring)
            types.push("Boring");
          if (item.typeOfWork.drilling)
            types.push("Drilling");
          if (item.typeOfWork.cutting)
            types.push("Cutting");
          if (item.typeOfWork.blindPenetration)
            types.push("Blind Penetration");
          return types.join(", ");
        }
      },
      locationPipingMarked: {
        id: "locationPipingMarked",
        header: "Piping Marked",
        accessorFn: (item) => item.locationPipingMarked ? "Yes" : "No"
      },
      jobStatusComplete: {
        id: "jobStatusComplete",
        header: "Job Complete",
        accessorFn: (item) => item.jobStatusComplete ? "Yes" : "No"
      },
      facilityName: { id: "facilityName", header: "Facility", accessorKey: "facilityName" },
      competentPerson: { id: "competentPerson", header: "Competent Person", accessorKey: "competentPerson" },
      soilType: { id: "soilType", header: "Soil Type", accessorKey: "soilType" },
      excavationDepth: { id: "excavationDepth", header: "Depth", accessorKey: "excavationDepth" },
      excavationWidth: { id: "excavationWidth", header: "Width", accessorKey: "excavationWidth" },
      protectiveSystemType: { id: "protectiveSystemType", header: "Protective System", accessorKey: "protectiveSystemType" },
      checklist: {
        id: "checklist",
        header: "Checklist",
        accessorFn: (item) => item.checklist ? "Complete" : "N/A"
      }
    };
    return fields.map((f) => allColumns[f]).filter((c) => c !== void 0);
  }
  static generatePermitFromRequest(request) {
    return new _ExcavationPermitDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0] ?? null,
      jobLocation: request.location,
      excavationDescription: request.workScope,
      supervisor: request.foreman || null
    });
  }
  static isValidKey(key) {
    return [
      "id",
      "name",
      "objectType",
      "isVerified",
      "date",
      "time",
      "location",
      "issuedTo",
      "workScope",
      "redTagNum",
      "permitNumber",
      "workArea",
      "supervisor",
      "jobLocation",
      "supervisorPhone",
      "excavationDescription",
      "workOrder",
      "typeOfWork",
      "locationPipingMarked",
      "supervisorApprovalDate",
      "supervisorApprovalTime",
      "permitClosedDate",
      "permitClosedTime",
      "jobStatusComplete",
      "inspectionsJson",
      "supervisorFieldInspectionName",
      "supervisorFieldInspectionDate",
      "supervisorFieldInspectionTime",
      "facilityName",
      "competentPerson",
      "soilType",
      "excavationDepth",
      "excavationWidth",
      "protectiveSystemType",
      "checklist"
    ].includes(key);
  }
};

// src/app/models/permits/venting-permit.model.ts
var VentingChecklist = class {
  personnelReadProcedure = false;
  personnelReadProcedureInitials = "";
  barricadeInPlace = false;
  barricadeInPlaceInitials = "";
  firefightingEquipment = false;
  firefightingEquipmentInitials = "";
  sparkProhibited = false;
  sparkProhibitedInitials = "";
  groundingStrapsInstalled = false;
  groundingStrapsInstalledInitials = "";
  combustibleGasIndicatorInPlace = false;
  combustibleGasIndicatorInPlaceInitials = "";
  reachedLessThan10PercentLEL = false;
  reachedLelInitials = "";
  indicatedPercentage = "";
  nonSparkingToolsUsed = false;
  nonSparkingToolsInitials = "";
  deviationsUnderstood = false;
  deviationsUnderstoodInitials = "";
  personnelNames = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var VentingPermitDto = class _VentingPermitDto extends BaseDto {
  date;
  time;
  location;
  issuedTo;
  workScope;
  redTagNum;
  permitNumber;
  workArea;
  plantName;
  systemName;
  requestingIndividual;
  purpose;
  timeCommence;
  timeConclude;
  individualIssuing;
  gasType;
  lel;
  uel;
  calculatedVolume;
  pressure;
  gasIndicatorModel;
  gasIndicatorSerial;
  calibrationDate;
  sdsProvided;
  sdsInitials;
  generalArrangementProvided;
  generalArrangementInitials;
  hazardousClassificationDrawing;
  hazardousClassificationInitials;
  pidWithValves;
  pidInitials;
  drawingNumbers;
  stackDescription;
  equipmentToBeDeenergized;
  lotoDescription;
  radioChannel;
  controlRoom;
  osmSupervisor;
  osmDate;
  plantManager;
  plantManagerDate;
  divisionDirector;
  divisionDirectorDate;
  checklist;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.plantName = data.plantName ?? null;
    this.systemName = data.systemName ?? null;
    this.requestingIndividual = data.requestingIndividual ?? null;
    this.purpose = data.purpose ?? null;
    this.timeCommence = data.timeCommence ?? null;
    this.timeConclude = data.timeConclude ?? null;
    this.individualIssuing = data.individualIssuing ?? null;
    this.gasType = data.gasType ?? null;
    this.lel = data.lel ?? null;
    this.uel = data.uel ?? null;
    this.calculatedVolume = data.calculatedVolume ?? null;
    this.pressure = data.pressure ?? null;
    this.gasIndicatorModel = data.gasIndicatorModel ?? null;
    this.gasIndicatorSerial = data.gasIndicatorSerial ?? null;
    this.calibrationDate = data.calibrationDate ?? null;
    this.sdsProvided = data.sdsProvided ?? false;
    this.sdsInitials = data.sdsInitials ?? null;
    this.generalArrangementProvided = data.generalArrangementProvided ?? false;
    this.generalArrangementInitials = data.generalArrangementInitials ?? null;
    this.hazardousClassificationDrawing = data.hazardousClassificationDrawing ?? false;
    this.hazardousClassificationInitials = data.hazardousClassificationInitials ?? null;
    this.pidWithValves = data.pidWithValves ?? false;
    this.pidInitials = data.pidInitials ?? null;
    this.drawingNumbers = data.drawingNumbers ?? null;
    this.stackDescription = data.stackDescription ?? null;
    this.equipmentToBeDeenergized = data.equipmentToBeDeenergized ?? null;
    this.lotoDescription = data.lotoDescription ?? null;
    this.radioChannel = data.radioChannel ?? null;
    this.controlRoom = data.controlRoom ?? null;
    this.osmSupervisor = data.osmSupervisor ?? null;
    this.osmDate = data.osmDate ?? null;
    this.plantManager = data.plantManager ?? null;
    this.plantManagerDate = data.plantManagerDate ?? null;
    this.divisionDirector = data.divisionDirector ?? null;
    this.divisionDirectorDate = data.divisionDirectorDate ?? null;
    this.checklist = data.checklist ? new VentingChecklist(data.checklist) : null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      location: this.location,
      issuedTo: this.issuedTo,
      workScope: this.workScope,
      redTagNum: this.redTagNum,
      permitNumber: this.permitNumber,
      workArea: this.workArea,
      plantName: this.plantName,
      systemName: this.systemName,
      requestingIndividual: this.requestingIndividual,
      purpose: this.purpose,
      timeCommence: this.timeCommence,
      timeConclude: this.timeConclude,
      individualIssuing: this.individualIssuing,
      gasType: this.gasType,
      lel: this.lel,
      uel: this.uel,
      calculatedVolume: this.calculatedVolume,
      pressure: this.pressure,
      gasIndicatorModel: this.gasIndicatorModel,
      gasIndicatorSerial: this.gasIndicatorSerial,
      calibrationDate: this.calibrationDate,
      sdsProvided: this.sdsProvided,
      sdsInitials: this.sdsInitials,
      generalArrangementProvided: this.generalArrangementProvided,
      generalArrangementInitials: this.generalArrangementInitials,
      hazardousClassificationDrawing: this.hazardousClassificationDrawing,
      hazardousClassificationInitials: this.hazardousClassificationInitials,
      pidWithValves: this.pidWithValves,
      pidInitials: this.pidInitials,
      drawingNumbers: this.drawingNumbers,
      stackDescription: this.stackDescription,
      equipmentToBeDeenergized: this.equipmentToBeDeenergized,
      lotoDescription: this.lotoDescription,
      radioChannel: this.radioChannel,
      controlRoom: this.controlRoom,
      osmSupervisor: this.osmSupervisor,
      osmDate: this.osmDate,
      plantManager: this.plantManager,
      plantManagerDate: this.plantManagerDate,
      divisionDirector: this.divisionDirector,
      divisionDirectorDate: this.divisionDirectorDate,
      checklist: this.checklist
    });
  }
  static fromJson(json) {
    if (!json)
      return new _VentingPermitDto();
    return new _VentingPermitDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      plantName: json.plantName,
      systemName: json.systemName,
      requestingIndividual: json.requestingIndividual,
      purpose: json.purpose,
      timeCommence: json.timeCommence,
      timeConclude: json.timeConclude,
      individualIssuing: json.individualIssuing,
      gasType: json.gasType,
      lel: json.lel,
      uel: json.uel,
      calculatedVolume: json.calculatedVolume,
      pressure: json.pressure,
      gasIndicatorModel: json.gasIndicatorModel,
      gasIndicatorSerial: json.gasIndicatorSerial,
      calibrationDate: json.calibrationDate,
      sdsProvided: json.sdsProvided ?? false,
      sdsInitials: json.sdsInitials,
      generalArrangementProvided: json.generalArrangementProvided ?? false,
      generalArrangementInitials: json.generalArrangementInitials,
      hazardousClassificationDrawing: json.hazardousClassificationDrawing ?? false,
      hazardousClassificationInitials: json.hazardousClassificationInitials,
      pidWithValves: json.pidWithValves ?? false,
      pidInitials: json.pidInitials,
      drawingNumbers: json.drawingNumbers,
      stackDescription: json.stackDescription,
      equipmentToBeDeenergized: json.equipmentToBeDeenergized,
      lotoDescription: json.lotoDescription,
      radioChannel: json.radioChannel,
      controlRoom: json.controlRoom,
      osmSupervisor: json.osmSupervisor,
      osmDate: json.osmDate,
      plantManager: json.plantManager,
      plantManagerDate: json.plantManagerDate,
      divisionDirector: json.divisionDirector,
      divisionDirectorDate: json.divisionDirectorDate,
      checklist: json.checklist ? new VentingChecklist(json.checklist) : null
    }));
  }
  static getDocumentationFields(dto) {
    const group = { label: "Documentation Provided", orientation: "vertical" };
    return {
      "sdsProvided": { name: "sdsProvided", label: "SDS Provided", type: "checkbox", initialValue: dto.sdsProvided, group },
      "sdsInitials": { name: "sdsInitials", label: "SDS Initials", type: "text", initialValue: dto.sdsInitials, showWhen: { field: "sdsProvided", value: true } },
      "generalArrangementProvided": { name: "generalArrangementProvided", label: "General Arrangement Provided", type: "checkbox", initialValue: dto.generalArrangementProvided, group },
      "generalArrangementInitials": { name: "generalArrangementInitials", label: "General Arrangement Initials", type: "text", initialValue: dto.generalArrangementInitials, showWhen: { field: "generalArrangementProvided", value: true } },
      "hazardousClassificationDrawing": { name: "hazardousClassificationDrawing", label: "Hazardous Classification Drawing", type: "checkbox", initialValue: dto.hazardousClassificationDrawing, group },
      "hazardousClassificationInitials": { name: "hazardousClassificationInitials", label: "Hazardous Classification Initials", type: "text", initialValue: dto.hazardousClassificationInitials, showWhen: { field: "hazardousClassificationDrawing", value: true } },
      "pidWithValves": { name: "pidWithValves", label: "P&ID with Valves", type: "checkbox", initialValue: dto.pidWithValves, group },
      "pidInitials": { name: "pidInitials", label: "P&ID Initials", type: "text", initialValue: dto.pidInitials, showWhen: { field: "pidWithValves", value: true } }
    };
  }
  static getChecklistFields(checklistDto) {
    const checklist = checklistDto || new VentingChecklist();
    const group = { label: "Venting Checklist", orientation: "vertical" };
    return {
      "checklist.personnelReadProcedure": { name: "checklist.personnelReadProcedure", label: "Personnel Read Procedure", type: "checkbox", initialValue: checklist.personnelReadProcedure, group },
      "checklist.personnelReadProcedureInitials": { name: "checklist.personnelReadProcedureInitials", label: "Initials", type: "text", initialValue: checklist.personnelReadProcedureInitials },
      "checklist.barricadeInPlace": { name: "checklist.barricadeInPlace", label: "Barricade in Place", type: "checkbox", initialValue: checklist.barricadeInPlace, group },
      "checklist.barricadeInPlaceInitials": { name: "checklist.barricadeInPlaceInitials", label: "Initials", type: "text", initialValue: checklist.barricadeInPlaceInitials },
      "checklist.firefightingEquipment": { name: "checklist.firefightingEquipment", label: "Firefighting Equipment", type: "checkbox", initialValue: checklist.firefightingEquipment, group },
      "checklist.firefightingEquipmentInitials": { name: "checklist.firefightingEquipmentInitials", label: "Initials", type: "text", initialValue: checklist.firefightingEquipmentInitials },
      "checklist.sparkProhibited": { name: "checklist.sparkProhibited", label: "Spark Prohibited", type: "checkbox", initialValue: checklist.sparkProhibited, group },
      "checklist.sparkProhibitedInitials": { name: "checklist.sparkProhibitedInitials", label: "Initials", type: "text", initialValue: checklist.sparkProhibitedInitials },
      "checklist.groundingStrapsInstalled": { name: "checklist.groundingStrapsInstalled", label: "Grounding Straps Installed", type: "checkbox", initialValue: checklist.groundingStrapsInstalled, group },
      "checklist.groundingStrapsInstalledInitials": { name: "checklist.groundingStrapsInstalledInitials", label: "Initials", type: "text", initialValue: checklist.groundingStrapsInstalledInitials },
      "checklist.combustibleGasIndicatorInPlace": { name: "checklist.combustibleGasIndicatorInPlace", label: "Combustible Gas Indicator in Place", type: "checkbox", initialValue: checklist.combustibleGasIndicatorInPlace, group },
      "checklist.combustibleGasIndicatorInPlaceInitials": { name: "checklist.combustibleGasIndicatorInPlaceInitials", label: "Initials", type: "text", initialValue: checklist.combustibleGasIndicatorInPlaceInitials },
      "checklist.reachedLessThan10PercentLEL": { name: "checklist.reachedLessThan10PercentLEL", label: "Reached < 10% LEL", type: "checkbox", initialValue: checklist.reachedLessThan10PercentLEL, group },
      "checklist.reachedLelInitials": { name: "checklist.reachedLelInitials", label: "Initials", type: "text", initialValue: checklist.reachedLelInitials },
      "checklist.indicatedPercentage": { name: "checklist.indicatedPercentage", label: "Indicated Percentage", type: "text", initialValue: checklist.indicatedPercentage },
      "checklist.nonSparkingToolsUsed": { name: "checklist.nonSparkingToolsUsed", label: "Non-Sparking Tools Used", type: "checkbox", initialValue: checklist.nonSparkingToolsUsed, group },
      "checklist.nonSparkingToolsInitials": { name: "checklist.nonSparkingToolsInitials", label: "Initials", type: "text", initialValue: checklist.nonSparkingToolsInitials },
      "checklist.deviationsUnderstood": { name: "checklist.deviationsUnderstood", label: "Deviations Understood", type: "checkbox", initialValue: checklist.deviationsUnderstood, group },
      "checklist.deviationsUnderstoodInitials": { name: "checklist.deviationsUnderstoodInitials", label: "Initials", type: "text", initialValue: checklist.deviationsUnderstoodInitials },
      "checklist.personnelNames": { name: "checklist.personnelNames", label: "Personnel Names", type: "textarea", initialValue: checklist.personnelNames }
    };
  }
  static toFormFields(dto, fields = [
    "workArea",
    "date",
    "plantName",
    "systemName",
    "requestingIndividual",
    "purpose",
    "timeCommence",
    "timeConclude",
    "gasType",
    "lel",
    "uel",
    "calculatedVolume",
    "pressure",
    "gasIndicatorModel",
    "gasIndicatorSerial",
    "calibrationDate",
    "stackDescription",
    "equipmentToBeDeenergized",
    "lotoDescription",
    "radioChannel",
    "controlRoom",
    ...Object.keys(_VentingPermitDto.getDocumentationFields(new _VentingPermitDto())),
    ...Object.keys(_VentingPermitDto.getChecklistFields(null))
  ]) {
    const documentationFields = _VentingPermitDto.getDocumentationFields(dto);
    const checklistFields = _VentingPermitDto.getChecklistFields(dto.checklist);
    const allFields = __spreadValues(__spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      workArea: {
        name: "workArea",
        label: "Work Area",
        type: "work-area-select",
        initialValue: dto.workArea?.id ?? null,
        context: { viewMode: "map", fallbackText: dto.location }
      },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: { name: "time", label: "Time", type: "time", initialValue: dto.time },
      location: { name: "location", label: "Location", type: "text", initialValue: dto.location },
      issuedTo: { name: "issuedTo", label: "Issued To", type: "text", initialValue: dto.issuedTo },
      workScope: { name: "workScope", label: "Work Scope", type: "textarea", initialValue: dto.workScope },
      redTagNum: { name: "redTagNum", label: "Red Tag #", type: "text", initialValue: dto.redTagNum },
      permitNumber: { name: "permitNumber", label: "Permit Number", type: "text", readonly: true, initialValue: dto.permitNumber },
      plantName: { name: "plantName", label: "Plant Name", type: "text", initialValue: dto.plantName },
      systemName: { name: "systemName", label: "System Name", type: "text", validators: [Validators.required], initialValue: dto.systemName },
      requestingIndividual: { name: "requestingIndividual", label: "Requesting Individual", type: "text", validators: [Validators.required], initialValue: dto.requestingIndividual },
      purpose: { name: "purpose", label: "Purpose", type: "textarea", validators: [Validators.required], initialValue: dto.purpose },
      timeCommence: { name: "timeCommence", label: "Time Commence", type: "time", initialValue: dto.timeCommence },
      timeConclude: { name: "timeConclude", label: "Time Conclude", type: "time", initialValue: dto.timeConclude },
      individualIssuing: { name: "individualIssuing", label: "Individual Issuing", type: "text", initialValue: dto.individualIssuing },
      gasType: { name: "gasType", label: "Gas Type", type: "text", initialValue: dto.gasType },
      lel: { name: "lel", label: "LEL", type: "text", initialValue: dto.lel },
      uel: { name: "uel", label: "UEL", type: "text", initialValue: dto.uel },
      calculatedVolume: { name: "calculatedVolume", label: "Calculated Volume", type: "text", initialValue: dto.calculatedVolume },
      pressure: { name: "pressure", label: "Pressure", type: "text", initialValue: dto.pressure },
      gasIndicatorModel: { name: "gasIndicatorModel", label: "Gas Indicator Model", type: "text", initialValue: dto.gasIndicatorModel },
      gasIndicatorSerial: { name: "gasIndicatorSerial", label: "Gas Indicator Serial", type: "text", initialValue: dto.gasIndicatorSerial },
      calibrationDate: { name: "calibrationDate", label: "Calibration Date", type: "date", initialValue: dto.calibrationDate },
      drawingNumbers: { name: "drawingNumbers", label: "Drawing Numbers", type: "text", initialValue: dto.drawingNumbers },
      stackDescription: { name: "stackDescription", label: "Stack Description", type: "textarea", initialValue: dto.stackDescription },
      equipmentToBeDeenergized: { name: "equipmentToBeDeenergized", label: "Equipment to be De-energized", type: "textarea", initialValue: dto.equipmentToBeDeenergized },
      lotoDescription: { name: "lotoDescription", label: "LOTO Description", type: "textarea", initialValue: dto.lotoDescription },
      radioChannel: { name: "radioChannel", label: "Radio Channel", type: "text", initialValue: dto.radioChannel },
      controlRoom: { name: "controlRoom", label: "Control Room", type: "text", initialValue: dto.controlRoom },
      osmSupervisor: { name: "osmSupervisor", label: "OSM/Supervisor", type: "text", initialValue: dto.osmSupervisor },
      osmDate: { name: "osmDate", label: "OSM Date", type: "date", initialValue: dto.osmDate },
      plantManager: { name: "plantManager", label: "Plant Manager", type: "text", initialValue: dto.plantManager },
      plantManagerDate: { name: "plantManagerDate", label: "Plant Manager Date", type: "date", initialValue: dto.plantManagerDate },
      divisionDirector: { name: "divisionDirector", label: "Division Director", type: "text", initialValue: dto.divisionDirector },
      divisionDirectorDate: { name: "divisionDirectorDate", label: "Division Director Date", type: "date", initialValue: dto.divisionDirectorDate },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType }
    }, documentationFields), checklistFields);
    return fields.map((f) => allFields[f]).filter((f) => f !== void 0);
  }
  static toTableColumns(fields = ["permitNumber", "date", "systemName", "requestingIndividual", "purpose"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      name: { id: "name", header: "Name", accessorKey: "name" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      issuedTo: { id: "issuedTo", header: "Issued To", accessorKey: "issuedTo" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      permitNumber: { id: "permitNumber", header: "Permit #", accessorKey: "permitNumber" },
      plantName: { id: "plantName", header: "Plant Name", accessorKey: "plantName" },
      systemName: { id: "systemName", header: "System Name", accessorKey: "systemName" },
      requestingIndividual: { id: "requestingIndividual", header: "Requester", accessorKey: "requestingIndividual" },
      purpose: { id: "purpose", header: "Purpose", accessorKey: "purpose" },
      timeCommence: { id: "timeCommence", header: "Commence", accessorKey: "timeCommence" },
      timeConclude: { id: "timeConclude", header: "Conclude", accessorKey: "timeConclude" },
      individualIssuing: { id: "individualIssuing", header: "Issued By", accessorKey: "individualIssuing" },
      gasType: { id: "gasType", header: "Gas Type", accessorKey: "gasType" },
      lel: { id: "lel", header: "LEL", accessorKey: "lel" },
      uel: { id: "uel", header: "UEL", accessorKey: "uel" },
      calculatedVolume: { id: "calculatedVolume", header: "Volume", accessorKey: "calculatedVolume" },
      pressure: { id: "pressure", header: "Pressure", accessorKey: "pressure" },
      gasIndicatorModel: { id: "gasIndicatorModel", header: "Indicator Model", accessorKey: "gasIndicatorModel" },
      gasIndicatorSerial: { id: "gasIndicatorSerial", header: "Indicator Serial", accessorKey: "gasIndicatorSerial" },
      calibrationDate: { id: "calibrationDate", header: "Calibration Date", accessorKey: "calibrationDate" },
      sdsProvided: {
        id: "sdsProvided",
        header: "SDS",
        accessorFn: (item) => item.sdsProvided ? "Yes" : "No"
      },
      generalArrangementProvided: {
        id: "generalArrangementProvided",
        header: "Gen. Arrangement",
        accessorFn: (item) => item.generalArrangementProvided ? "Yes" : "No"
      },
      hazardousClassificationDrawing: {
        id: "hazardousClassificationDrawing",
        header: "Haz. Classification",
        accessorFn: (item) => item.hazardousClassificationDrawing ? "Yes" : "No"
      },
      pidWithValves: {
        id: "pidWithValves",
        header: "P&ID",
        accessorFn: (item) => item.pidWithValves ? "Yes" : "No"
      },
      stackDescription: { id: "stackDescription", header: "Stack Description", accessorKey: "stackDescription" },
      equipmentToBeDeenergized: { id: "equipmentToBeDeenergized", header: "Equipment De-energized", accessorKey: "equipmentToBeDeenergized" },
      lotoDescription: { id: "lotoDescription", header: "LOTO", accessorKey: "lotoDescription" },
      radioChannel: { id: "radioChannel", header: "Radio Channel", accessorKey: "radioChannel" },
      controlRoom: { id: "controlRoom", header: "Control Room", accessorKey: "controlRoom" },
      osmSupervisor: { id: "osmSupervisor", header: "OSM/Supervisor", accessorKey: "osmSupervisor" },
      osmDate: { id: "osmDate", header: "OSM Date", accessorKey: "osmDate" },
      plantManager: { id: "plantManager", header: "Plant Manager", accessorKey: "plantManager" },
      plantManagerDate: { id: "plantManagerDate", header: "PM Date", accessorKey: "plantManagerDate" },
      divisionDirector: { id: "divisionDirector", header: "Division Director", accessorKey: "divisionDirector" },
      divisionDirectorDate: { id: "divisionDirectorDate", header: "DD Date", accessorKey: "divisionDirectorDate" },
      checklist: {
        id: "checklist",
        header: "Checklist",
        accessorFn: (item) => item.checklist ? "Complete" : "N/A"
      }
    };
    return fields.map((f) => allColumns[f]).filter((c) => c !== void 0);
  }
  static generatePermitFromRequest(request) {
    return new _VentingPermitDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0] ?? null,
      location: request.location,
      workScope: request.workScope,
      requestingIndividual: request.requestedBy
    });
  }
  static isValidKey(key) {
    return [
      "id",
      "name",
      "objectType",
      "isVerified",
      "date",
      "time",
      "location",
      "issuedTo",
      "workScope",
      "redTagNum",
      "permitNumber",
      "workArea",
      "plantName",
      "systemName",
      "requestingIndividual",
      "purpose",
      "timeCommence",
      "timeConclude",
      "individualIssuing",
      "gasType",
      "lel",
      "uel",
      "calculatedVolume",
      "pressure",
      "gasIndicatorModel",
      "gasIndicatorSerial",
      "calibrationDate",
      "sdsProvided",
      "sdsInitials",
      "generalArrangementProvided",
      "generalArrangementInitials",
      "hazardousClassificationDrawing",
      "hazardousClassificationInitials",
      "pidWithValves",
      "pidInitials",
      "drawingNumbers",
      "stackDescription",
      "equipmentToBeDeenergized",
      "lotoDescription",
      "radioChannel",
      "controlRoom",
      "osmSupervisor",
      "osmDate",
      "plantManager",
      "plantManagerDate",
      "divisionDirector",
      "divisionDirectorDate",
      "checklist"
    ].includes(key);
  }
};

// src/app/features/form-designer-refactored/inputs/invisible-input-field/invisible-input-field.component.ts
var _c0 = ["fileInput"];
var _c1 = ["dateInput"];
var _c2 = ["timeInput"];
var _c3 = ["textInput"];
function InvisibleInputFieldComponent_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 7, 0);
    \u0275\u0275listener("change", function InvisibleInputFieldComponent_Case_1_Template_input_change_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onFileChange($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span", 8);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.fileName || ctx_r1.value);
  }
}
function InvisibleInputFieldComponent_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "input", 9, 1);
    \u0275\u0275listener("change", function InvisibleInputFieldComponent_Case_2_Template_input_change_2_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onValueChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.value);
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.value);
  }
}
function InvisibleInputFieldComponent_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "input", 10, 2);
    \u0275\u0275listener("change", function InvisibleInputFieldComponent_Case_3_Template_input_change_2_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onValueChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.value);
    \u0275\u0275advance();
    \u0275\u0275property("value", ctx_r1.value);
  }
}
function InvisibleInputFieldComponent_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 11);
    \u0275\u0275twoWayListener("ngModelChange", function InvisibleInputFieldComponent_Case_4_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.value, $event) || (ctx_r1.value = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("input", function InvisibleInputFieldComponent_Case_4_Template_input_input_0_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onValueChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.value);
  }
}
function InvisibleInputFieldComponent_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "textarea", 12, 3);
    \u0275\u0275twoWayListener("ngModelChange", function InvisibleInputFieldComponent_Case_5_Template_textarea_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.value, $event) || (ctx_r1.value = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("input", function InvisibleInputFieldComponent_Case_5_Template_textarea_input_0_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onValueChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.value);
  }
}
function InvisibleInputFieldComponent_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 12, 3);
    \u0275\u0275twoWayListener("ngModelChange", function InvisibleInputFieldComponent_Case_6_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.value, $event) || (ctx_r1.value = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("input", function InvisibleInputFieldComponent_Case_6_Template_input_input_0_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onValueChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.value);
  }
}
function InvisibleInputFieldComponent_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "input", 12, 3);
    \u0275\u0275twoWayListener("ngModelChange", function InvisibleInputFieldComponent_Case_7_Template_input_ngModelChange_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.value, $event) || (ctx_r1.value = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("input", function InvisibleInputFieldComponent_Case_7_Template_input_input_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onValueChange($event));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.value);
  }
}
var InvisibleInputFieldComponent = class _InvisibleInputFieldComponent {
  type = "text";
  valueChange = new EventEmitter();
  fileInput;
  dateInput;
  timeInput;
  textInputRef;
  value = "";
  fileName = "";
  onChange = () => {
  };
  onTouched = () => {
  };
  initialFontSize = 16;
  minFontSize = 8;
  ngAfterViewInit() {
    this.captureInitialFontSize();
    this.adjustFontSize();
  }
  ngOnChanges(changes) {
    if (changes["value"]) {
      this.adjustFontSize();
    }
  }
  captureInitialFontSize() {
    if (this.textInputRef) {
      const computedStyle = window.getComputedStyle(this.textInputRef.nativeElement);
      this.initialFontSize = parseFloat(computedStyle.fontSize);
    }
  }
  adjustFontSize() {
    if (this.type !== "text" && this.type !== "textarea")
      return;
    const el = this.textInputRef?.nativeElement;
    if (!el)
      return;
    el.style.fontSize = `${this.initialFontSize}px`;
    while ((el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) && parseFloat(el.style.fontSize) > this.minFontSize) {
      const currentSize = parseFloat(el.style.fontSize);
      el.style.fontSize = `${currentSize - 1}px`;
    }
  }
  writeValue(value) {
    this.value = value;
    setTimeout(() => this.adjustFontSize(), 0);
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  onValueChange(event) {
    const target = event.target;
    this.value = target.value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
    this.adjustFontSize();
  }
  onFileChange(event) {
    const target = event.target;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.fileName = file.name;
      this.value = file;
      this.onChange(this.value);
      this.valueChange.emit(this.value);
    }
    this.onTouched();
  }
  triggerFileDialog() {
    if (this.type === "file" && this.fileInput) {
      this.fileInput.nativeElement.click();
    } else if (this.type === "date" && this.dateInput) {
      try {
        this.dateInput.nativeElement.showPicker();
      } catch {
        this.dateInput.nativeElement.click();
      }
    } else if (this.type === "time" && this.timeInput) {
      try {
        this.timeInput.nativeElement.showPicker();
      } catch {
        this.timeInput.nativeElement.click();
      }
    }
  }
  static \u0275fac = function InvisibleInputFieldComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InvisibleInputFieldComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _InvisibleInputFieldComponent, selectors: [["app-invisible-input-field"]], viewQuery: function InvisibleInputFieldComponent_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c0, 5);
      \u0275\u0275viewQuery(_c1, 5);
      \u0275\u0275viewQuery(_c2, 5);
      \u0275\u0275viewQuery(_c3, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.fileInput = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.dateInput = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.timeInput = _t.first);
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.textInputRef = _t.first);
    }
  }, hostAttrs: ["data-version", "v2"], inputs: { type: "type" }, outputs: { valueChange: "valueChange" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _InvisibleInputFieldComponent),
      multi: true
    }
  ]), \u0275\u0275NgOnChangesFeature], decls: 8, vars: 1, consts: [["fileInput", ""], ["dateInput", ""], ["timeInput", ""], ["textInput", ""], [1, "invisible-input-container", 3, "click"], ["type", "number", 1, "invisible-input", 3, "ngModel"], [1, "invisible-input", 3, "ngModel"], ["type", "file", 1, "hidden-input", 3, "change"], [1, "display-value"], ["type", "date", 1, "hidden-input", 3, "change", "value"], ["type", "time", 1, "hidden-input", 3, "change", "value"], ["type", "number", 1, "invisible-input", 3, "ngModelChange", "input", "ngModel"], [1, "invisible-input", 3, "ngModelChange", "input", "ngModel"]], template: function InvisibleInputFieldComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 4);
      \u0275\u0275listener("click", function InvisibleInputFieldComponent_Template_div_click_0_listener() {
        return ctx.triggerFileDialog();
      });
      \u0275\u0275template(1, InvisibleInputFieldComponent_Case_1_Template, 4, 1)(2, InvisibleInputFieldComponent_Case_2_Template, 4, 2)(3, InvisibleInputFieldComponent_Case_3_Template, 4, 2)(4, InvisibleInputFieldComponent_Case_4_Template, 1, 1, "input", 5)(5, InvisibleInputFieldComponent_Case_5_Template, 2, 1, "textarea", 6)(6, InvisibleInputFieldComponent_Case_6_Template, 2, 1, "input", 6)(7, InvisibleInputFieldComponent_Case_7_Template, 2, 1, "input", 6);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      let tmp_0_0;
      \u0275\u0275advance();
      \u0275\u0275conditional((tmp_0_0 = ctx.type) === "file" ? 1 : tmp_0_0 === "date" ? 2 : tmp_0_0 === "time" ? 3 : tmp_0_0 === "number" ? 4 : tmp_0_0 === "textarea" ? 5 : tmp_0_0 === "text" ? 6 : 7);
    }
  }, dependencies: [CommonModule, FormsModule, DefaultValueAccessor, NumberValueAccessor, NgControlStatus, NgModel, ReactiveFormsModule], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n.invisible-input-container[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  display: flex;\n  align-items: center;\n  cursor: text;\n  position: relative;\n  box-sizing: border-box;\n}\n.invisible-input[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  border: none;\n  background-color: transparent;\n  outline: none;\n  padding: 2px 4px;\n  margin: 0;\n  font-family: inherit;\n  font-size: inherit;\n  color: inherit;\n  caret-color: black;\n  cursor: text;\n  resize: none;\n  overflow: hidden;\n  overflow-wrap: break-word;\n  word-break: break-all;\n  box-sizing: border-box;\n}\n.invisible-input[_ngcontent-%COMP%]:focus {\n  background-color: rgba(66, 133, 244, 0.06);\n  outline: 1px solid rgba(66, 133, 244, 0.3);\n}\n.hidden-input[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 0;\n  height: 0;\n  opacity: 0;\n  pointer-events: none;\n}\n.display-value[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: flex;\n  align-items: center;\n}\n/*# sourceMappingURL=invisible-input-field.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(InvisibleInputFieldComponent, { className: "InvisibleInputFieldComponent", filePath: "src/app/features/form-designer-refactored/inputs/invisible-input-field/invisible-input-field.component.ts", lineNumber: 20 });
})();

// src/app/features/form-designer-refactored/inputs/radio-checkboxes/radio-checkboxes.component.ts
function RadioCheckboxesComponent_label_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label")(1, "input", 2);
    \u0275\u0275listener("change", function RadioCheckboxesComponent_label_1_Template_input_change_1_listener() {
      const option_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.selectOption(option_r2));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "span", 3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("name", ctx_r2.name())("value", option_r2)("checked", ctx_r2.value === option_r2)("disabled", ctx_r2.disabled);
  }
}
var RadioCheckboxesComponent = class _RadioCheckboxesComponent {
  options = input([true, false]);
  name = input("square-radio-group");
  value;
  disabled = false;
  onChange = (value) => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    this.value = value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  selectOption(option) {
    if (!this.disabled) {
      this.value = option;
      this.onChange(this.value);
      this.onTouched();
    }
  }
  static \u0275fac = function RadioCheckboxesComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RadioCheckboxesComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RadioCheckboxesComponent, selectors: [["app-radio-checkboxes"]], hostAttrs: ["data-version", "v2"], inputs: { options: [1, "options"], name: [1, "name"] }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _RadioCheckboxesComponent),
      multi: true
    }
  ])], decls: 2, vars: 1, consts: [[1, "square-radio-group"], [4, "ngFor", "ngForOf"], ["type", "radio", 3, "change", "name", "value", "checked", "disabled"], [1, "custom-square"]], template: function RadioCheckboxesComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, RadioCheckboxesComponent_label_1_Template, 3, 4, "label", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("ngForOf", ctx.options());
    }
  }, dependencies: [FormsModule, NgForOf], styles: ['\n\n.square-radio-group[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  align-items: center;\n}\n.square-radio-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  position: relative;\n  cursor: pointer;\n  display: inline-block;\n  width: 18px;\n  height: 18px;\n  vertical-align: top;\n}\n.square-radio-group[_ngcontent-%COMP%]   input[type=radio][_ngcontent-%COMP%] {\n  position: absolute;\n  opacity: 0;\n  cursor: pointer;\n  height: 0;\n  width: 0;\n}\n.custom-square[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 18px;\n  width: 18px;\n  background-color: #eee;\n  border: 1px solid #000000;\n  box-sizing: border-box;\n}\n.square-radio-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%]:hover   .custom-square[_ngcontent-%COMP%] {\n  background-color: #ddd;\n}\n.square-radio-group[_ngcontent-%COMP%]   input[type=radio][_ngcontent-%COMP%]:checked    ~ .custom-square[_ngcontent-%COMP%] {\n  background-color: #e0e0e0;\n  border-color: #000000;\n}\n.custom-square[_ngcontent-%COMP%]::after {\n  content: "X";\n  position: absolute;\n  display: none;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  font-size: 12px;\n  font-weight: bold;\n  color: #333;\n}\n.square-radio-group[_ngcontent-%COMP%]   input[type=radio][_ngcontent-%COMP%]:checked    ~ .custom-square[_ngcontent-%COMP%]::after {\n  display: block;\n}\n/*# sourceMappingURL=radio-checkboxes.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RadioCheckboxesComponent, { className: "RadioCheckboxesComponent", filePath: "src/app/features/form-designer-refactored/inputs/radio-checkboxes/radio-checkboxes.component.ts", lineNumber: 20 });
})();

// src/app/features/form-designer-refactored/inputs/invisible-searchable-select/invisible-searchable-select.component.ts
function InvisibleSearchableSelectComponent_ng_template_5_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13);
    \u0275\u0275listener("click", function InvisibleSearchableSelectComponent_ng_template_5_div_4_Template_div_click_0_listener($event) {
      const option_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.selectOption(option_r5, $event));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const option_r5 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", option_r5.label, " ");
  }
}
function InvisibleSearchableSelectComponent_ng_template_5_div_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275text(1, " No options found ");
    \u0275\u0275elementEnd();
  }
}
function InvisibleSearchableSelectComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "input", 6);
    \u0275\u0275listener("input", function InvisibleSearchableSelectComponent_ng_template_5_Template_input_input_2_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSearch($event));
    })("click", function InvisibleSearchableSelectComponent_ng_template_5_Template_input_click_2_listener($event) {
      \u0275\u0275restoreView(_r2);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 7);
    \u0275\u0275template(4, InvisibleSearchableSelectComponent_ng_template_5_div_4_Template, 2, 1, "div", 8)(5, InvisibleSearchableSelectComponent_ng_template_5_div_5_Template, 2, 0, "div", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 10)(7, "button", 11);
    \u0275\u0275listener("click", function InvisibleSearchableSelectComponent_ng_template_5_Template_button_click_7_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAddNewOption($event));
    });
    \u0275\u0275text(8, "Add New");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 12);
    \u0275\u0275listener("click", function InvisibleSearchableSelectComponent_ng_template_5_Template_button_click_9_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onEditOption($event));
    });
    \u0275\u0275text(10, "Edit Selected");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r2.filteredOptions);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.filteredOptions.length === 0);
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", !ctx_r2.value);
  }
}
var InvisibleSearchableSelectComponent = class _InvisibleSearchableSelectComponent {
  elementRef;
  label = "";
  disabled = false;
  set options(value) {
    this.optionsSubscription?.unsubscribe();
    if (value instanceof Observable) {
      this.optionsSubscription = value.subscribe((opts) => {
        this._options = opts;
        this.filteredOptions = opts;
        this.updateSelectedOption();
      });
    } else {
      this._options = value || [];
      this.filteredOptions = value || [];
      this.updateSelectedOption();
    }
  }
  addNew = new EventEmitter();
  edit = new EventEmitter();
  value = null;
  _options = [];
  filteredOptions = [];
  selectedOption = null;
  optionsSubscription;
  isOpen = false;
  positions = [
    { originX: "start", originY: "bottom", overlayX: "start", overlayY: "top", offsetY: 5 },
    { originX: "start", originY: "top", overlayX: "start", overlayY: "bottom", offsetY: -5 }
  ];
  onChange = (value) => {
  };
  onTouched = () => {
  };
  constructor(elementRef) {
    this.elementRef = elementRef;
  }
  ngOnDestroy() {
    this.optionsSubscription?.unsubscribe();
  }
  updateSelectedOption() {
    if (this.value && this._options.length > 0) {
      this.selectedOption = this._options.find((opt) => opt.value === this.value) || null;
    } else {
      this.selectedOption = null;
    }
  }
  onSearch(event) {
    const term = event.target.value.toLowerCase();
    this.filteredOptions = this._options.filter((o) => o.label.toLowerCase().includes(term));
  }
  writeValue(value) {
    this.value = value;
    this.updateSelectedOption();
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  toggleDropdown(event) {
    event.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen)
        this.filteredOptions = this._options;
    }
  }
  closeDropdown() {
    this.isOpen = false;
    this.onTouched();
  }
  selectOption(option, event) {
    event.stopPropagation();
    this.value = option.value;
    this.selectedOption = option;
    this.onChange(this.value);
    this.closeDropdown();
  }
  onAddNewOption(event) {
    event.stopPropagation();
    this.addNew.emit();
    this.closeDropdown();
  }
  onEditOption(event) {
    event.stopPropagation();
    if (this.value)
      this.edit.emit(this.value);
    this.closeDropdown();
  }
  static \u0275fac = function InvisibleSearchableSelectComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InvisibleSearchableSelectComponent)(\u0275\u0275directiveInject(ElementRef));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _InvisibleSearchableSelectComponent, selectors: [["app-invisible-searchable-select"]], hostAttrs: ["data-version", "v2"], inputs: { label: "label", disabled: "disabled", options: "options" }, outputs: { addNew: "addNew", edit: "edit" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _InvisibleSearchableSelectComponent),
      multi: true
    }
  ])], decls: 6, vars: 4, consts: [["trigger", "cdkOverlayOrigin"], ["cdkOverlayOrigin", "", 1, "invisible-select-container"], [1, "select-display", 3, "click"], ["cdkConnectedOverlay", "", 3, "overlayOutsideClick", "detach", "cdkConnectedOverlayOrigin", "cdkConnectedOverlayOpen", "cdkConnectedOverlayPositions"], [1, "options-container"], [1, "search-bar"], ["type", "text", "placeholder", "Search...", 3, "input", "click"], [1, "options-list"], ["class", "option", 3, "click", 4, "ngFor", "ngForOf"], ["class", "option disabled", 4, "ngIf"], [1, "actions"], [3, "click"], [3, "click", "disabled"], [1, "option", 3, "click"], [1, "option", "disabled"]], template: function InvisibleSearchableSelectComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1, 0)(2, "div", 2);
      \u0275\u0275listener("click", function InvisibleSearchableSelectComponent_Template_div_click_2_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.toggleDropdown($event));
      });
      \u0275\u0275elementStart(3, "span");
      \u0275\u0275text(4);
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(5, InvisibleSearchableSelectComponent_ng_template_5_Template, 11, 3, "ng-template", 3);
      \u0275\u0275listener("overlayOutsideClick", function InvisibleSearchableSelectComponent_Template_ng_template_overlayOutsideClick_5_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeDropdown());
      })("detach", function InvisibleSearchableSelectComponent_Template_ng_template_detach_5_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeDropdown());
      });
    }
    if (rf & 2) {
      const trigger_r6 = \u0275\u0275reference(1);
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate((ctx.selectedOption == null ? null : ctx.selectedOption.label) || ctx.label);
      \u0275\u0275advance();
      \u0275\u0275property("cdkConnectedOverlayOrigin", trigger_r6)("cdkConnectedOverlayOpen", ctx.isOpen)("cdkConnectedOverlayPositions", ctx.positions);
    }
  }, dependencies: [CommonModule, NgForOf, NgIf, OverlayModule, CdkConnectedOverlay, CdkOverlayOrigin], styles: ["\n\n.invisible-select-container[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n}\n.select-display[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  display: flex;\n  align-items: center;\n  cursor: pointer;\n  min-height: 20px;\n  box-sizing: border-box;\n}\n.select-display[_ngcontent-%COMP%]:hover {\n  background-color: rgba(0, 0, 0, 0.05);\n}\n.options-container[_ngcontent-%COMP%] {\n  background-color: #fff;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n  max-height: 250px;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  min-width: 180px;\n}\n.search-bar[_ngcontent-%COMP%] {\n  padding: 8px;\n  border-bottom: 1px solid #eee;\n}\n.search-bar[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 6px;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  box-sizing: border-box;\n}\n.options-list[_ngcontent-%COMP%] {\n  overflow-y: auto;\n  flex-grow: 1;\n}\n.option[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  cursor: pointer;\n}\n.option[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n}\n.option.disabled[_ngcontent-%COMP%] {\n  color: #999;\n  cursor: default;\n}\n.actions[_ngcontent-%COMP%] {\n  padding: 8px;\n  border-top: 1px solid #eee;\n  display: flex;\n  gap: 8px;\n}\n.actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  flex-grow: 1;\n  padding: 6px;\n  border: 1px solid #ccc;\n  background-color: #f9f9f9;\n  border-radius: 4px;\n  cursor: pointer;\n}\n.actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  background-color: #e9e9e9;\n}\n.actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n/*# sourceMappingURL=invisible-searchable-select.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(InvisibleSearchableSelectComponent, { className: "InvisibleSearchableSelectComponent", filePath: "src/app/features/form-designer-refactored/inputs/invisible-searchable-select/invisible-searchable-select.component.ts", lineNumber: 23 });
})();

// src/app/features/form-designer-refactored/inputs/checkbox-x/checkbox-x.component.ts
var CheckboxXComponent = class _CheckboxXComponent {
  label = "";
  id = "";
  value = false;
  disabled = false;
  onChange = () => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    this.value = !!value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  toggle(newValue) {
    if (!this.disabled) {
      this.value = newValue;
      this.onChange(this.value);
      this.onTouched();
    }
  }
  static \u0275fac = function CheckboxXComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CheckboxXComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CheckboxXComponent, selectors: [["app-checkbox-x"]], inputs: { label: "label", id: "id" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _CheckboxXComponent),
      multi: true
    }
  ])], decls: 4, vars: 5, consts: [[1, "square-checkbox-container", 3, "for"], ["type", "checkbox", 3, "ngModelChange", "blur", "id", "ngModel", "disabled"], [1, "custom-square"]], template: function CheckboxXComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "label", 0)(1, "input", 1);
      \u0275\u0275listener("ngModelChange", function CheckboxXComponent_Template_input_ngModelChange_1_listener($event) {
        return ctx.toggle($event);
      })("blur", function CheckboxXComponent_Template_input_blur_1_listener() {
        return ctx.onTouched();
      });
      \u0275\u0275elementEnd();
      \u0275\u0275element(2, "span", 2);
      \u0275\u0275text(3);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275property("for", ctx.id);
      \u0275\u0275advance();
      \u0275\u0275property("id", ctx.id)("ngModel", ctx.value)("disabled", ctx.disabled);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.label, "\n");
    }
  }, dependencies: [CommonModule, FormsModule, CheckboxControlValueAccessor, NgControlStatus, NgModel, ReactiveFormsModule], styles: ['\n\n.square-checkbox-container[_ngcontent-%COMP%] {\n  display: inline-block;\n  position: relative;\n  cursor: pointer;\n  width: 18px;\n  height: 18px;\n  -webkit-user-select: none;\n  user-select: none;\n  vertical-align: top;\n}\n.square-checkbox-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  position: absolute;\n  opacity: 0;\n  cursor: pointer;\n  height: 0;\n  width: 0;\n}\n.custom-square[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 18px;\n  width: 18px;\n  background-color: #eee;\n  border: 1px solid #000000;\n  box-sizing: border-box;\n  transition: background-color 0.2s, border-color 0.2s;\n}\n.square-checkbox-container[_ngcontent-%COMP%]:hover   .custom-square[_ngcontent-%COMP%] {\n  background-color: #ddd;\n}\n.square-checkbox-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:checked    ~ .custom-square[_ngcontent-%COMP%] {\n  background-color: #e0e0e0;\n  border-color: #000000;\n}\n.custom-square[_ngcontent-%COMP%]::after {\n  content: "X";\n  position: absolute;\n  display: none;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  font-size: 12px;\n  font-weight: bold;\n  color: #333;\n}\n.square-checkbox-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:checked    ~ .custom-square[_ngcontent-%COMP%]::after {\n  display: block;\n}\n.square-checkbox-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:disabled    ~ .custom-square[_ngcontent-%COMP%] {\n  background-color: #fafafa;\n  border-color: #e0e0e0;\n  cursor: not-allowed;\n}\n.square-checkbox-container[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:disabled:checked    ~ .custom-square[_ngcontent-%COMP%]::after {\n  color: #aaa;\n}\n/*# sourceMappingURL=checkbox-x.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CheckboxXComponent, { className: "CheckboxXComponent", filePath: "src/app/features/form-designer-refactored/inputs/checkbox-x/checkbox-x.component.ts", lineNumber: 19 });
})();

// src/app/features/form-designer-refactored/inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component.ts
var _forTrack0 = ($index, $item) => $item.value;
function InvisibleSearchableMultiSelectComponent_ng_template_5_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "li", 13);
    \u0275\u0275listener("click", function InvisibleSearchableMultiSelectComponent_ng_template_5_For_5_Template_li_click_0_listener($event) {
      const option_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleOption(option_r5, $event));
    });
    \u0275\u0275elementStart(1, "span", 14);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const option_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("selected", ctx_r2.isSelected(option_r5));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(option_r5.label);
  }
}
function InvisibleSearchableMultiSelectComponent_ng_template_5_ForEmpty_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 10);
    \u0275\u0275text(1, "No options found");
    \u0275\u0275elementEnd();
  }
}
function InvisibleSearchableMultiSelectComponent_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5);
    \u0275\u0275listener("click", function InvisibleSearchableMultiSelectComponent_ng_template_5_Template_div_click_0_listener($event) {
      \u0275\u0275restoreView(_r2);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(1, "div", 6)(2, "input", 7);
    \u0275\u0275listener("input", function InvisibleSearchableMultiSelectComponent_ng_template_5_Template_input_input_2_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onSearch($event));
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "ul", 8);
    \u0275\u0275repeaterCreate(4, InvisibleSearchableMultiSelectComponent_ng_template_5_For_5_Template, 3, 3, "li", 9, _forTrack0, false, InvisibleSearchableMultiSelectComponent_ng_template_5_ForEmpty_6_Template, 2, 0, "li", 10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 11)(8, "button", 12);
    \u0275\u0275listener("click", function InvisibleSearchableMultiSelectComponent_ng_template_5_Template_button_click_8_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onAddNewOption($event));
    });
    \u0275\u0275text(9, "Add New");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 12);
    \u0275\u0275listener("click", function InvisibleSearchableMultiSelectComponent_ng_template_5_Template_button_click_10_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onEditOption($event));
    });
    \u0275\u0275text(11, "Edit");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r2.filteredAndSortedOptions);
  }
}
var InvisibleSearchableMultiSelectComponent = class _InvisibleSearchableMultiSelectComponent {
  elementRef;
  label = "";
  disabled = false;
  set options(value) {
    this.optionsSubscription?.unsubscribe();
    const options$ = value instanceof Observable ? value : of(value);
    this.optionsSubscription = options$.subscribe((opts) => {
      this._options = opts || [];
      this.filterAndSortOptions();
    });
  }
  addNew = new EventEmitter();
  edit = new EventEmitter();
  values = [];
  _options = [];
  filteredAndSortedOptions = [];
  optionsSubscription;
  isOpen = false;
  positions = [
    { originX: "start", originY: "bottom", overlayX: "start", overlayY: "top", offsetY: 5 },
    { originX: "start", originY: "top", overlayX: "start", overlayY: "bottom", offsetY: -5 }
  ];
  onChange = (value) => {
  };
  onTouched = () => {
  };
  constructor(elementRef) {
    this.elementRef = elementRef;
  }
  ngOnDestroy() {
    this.optionsSubscription?.unsubscribe();
  }
  get displayValue() {
    if (!this.values || this.values.length === 0)
      return "";
    return this._options.filter((opt) => this.values.includes(opt.value)).map((opt) => opt.label).join(", ");
  }
  onSearch(event) {
    const term = event.target.value.toLowerCase();
    this.filterAndSortOptions(term);
  }
  filterAndSortOptions(searchTerm = "") {
    let filtered = this._options;
    if (searchTerm) {
      filtered = this._options.filter((o) => o.label.toLowerCase().includes(searchTerm));
    }
    this.filteredAndSortedOptions = filtered.sort((a, b) => {
      const aS = this.values.includes(a.value);
      const bS = this.values.includes(b.value);
      if (aS && !bS)
        return -1;
      if (!aS && bS)
        return 1;
      return 0;
    });
  }
  writeValue(values) {
    this.values = Array.isArray(values) ? values : [];
    this.filterAndSortOptions();
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  toggleDropdown(event) {
    event.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen)
        this.filterAndSortOptions();
    }
  }
  closeDropdown() {
    this.isOpen = false;
    this.onTouched();
  }
  toggleOption(option, event) {
    event.stopPropagation();
    const index = this.values.indexOf(option.value);
    if (index > -1) {
      this.values.splice(index, 1);
    } else {
      this.values.push(option.value);
    }
    this.onChange([...this.values]);
    this.filterAndSortOptions();
  }
  isSelected(option) {
    return this.values.includes(option.value);
  }
  onAddNewOption(event) {
    event.stopPropagation();
    this.addNew.emit();
    this.closeDropdown();
  }
  onEditOption(event) {
    event.stopPropagation();
    this.edit.emit();
    this.closeDropdown();
  }
  static \u0275fac = function InvisibleSearchableMultiSelectComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _InvisibleSearchableMultiSelectComponent)(\u0275\u0275directiveInject(ElementRef));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _InvisibleSearchableMultiSelectComponent, selectors: [["app-invisible-searchable-multi-select"]], inputs: { label: "label", disabled: "disabled", options: "options" }, outputs: { addNew: "addNew", edit: "edit" }, features: [\u0275\u0275ProvidersFeature([
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _InvisibleSearchableMultiSelectComponent),
      multi: true
    }
  ])], decls: 6, vars: 8, consts: [["trigger", "cdkOverlayOrigin"], ["cdkOverlayOrigin", "", 1, "invisible-multi-select-container", 3, "click"], [1, "display-area"], [1, "display-value"], ["cdkConnectedOverlay", "", 3, "overlayOutsideClick", "cdkConnectedOverlayOrigin", "cdkConnectedOverlayOpen", "cdkConnectedOverlayPositions"], [1, "dropdown-panel", 3, "click"], [1, "search-container"], ["type", "text", "placeholder", "Search...", "autofocus", "", 1, "search-input", 3, "input"], [1, "options-list"], [1, "option-item", 3, "selected"], [1, "no-options"], [1, "dropdown-actions"], ["type", "button", 1, "action-button", 3, "click"], [1, "option-item", 3, "click"], [1, "option-label"]], template: function InvisibleSearchableMultiSelectComponent_Template(rf, ctx) {
    if (rf & 1) {
      const _r1 = \u0275\u0275getCurrentView();
      \u0275\u0275elementStart(0, "div", 1, 0);
      \u0275\u0275listener("click", function InvisibleSearchableMultiSelectComponent_Template_div_click_0_listener($event) {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.toggleDropdown($event));
      });
      \u0275\u0275elementStart(2, "div", 2)(3, "span", 3);
      \u0275\u0275text(4);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(5, InvisibleSearchableMultiSelectComponent_ng_template_5_Template, 12, 1, "ng-template", 4);
      \u0275\u0275listener("overlayOutsideClick", function InvisibleSearchableMultiSelectComponent_Template_ng_template_overlayOutsideClick_5_listener() {
        \u0275\u0275restoreView(_r1);
        return \u0275\u0275resetView(ctx.closeDropdown());
      });
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      const trigger_r6 = \u0275\u0275reference(1);
      \u0275\u0275advance(2);
      \u0275\u0275classProp("disabled", ctx.disabled)("placeholder", !ctx.displayValue);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.displayValue || " ", " ");
      \u0275\u0275advance();
      \u0275\u0275property("cdkConnectedOverlayOrigin", trigger_r6)("cdkConnectedOverlayOpen", ctx.isOpen)("cdkConnectedOverlayPositions", ctx.positions);
    }
  }, dependencies: [CommonModule, OverlayModule, CdkConnectedOverlay, CdkOverlayOrigin], styles: ["\n\n[_nghost-%COMP%] {\n  display: block;\n  width: 100%;\n  font-family: inherit;\n}\n.invisible-multi-select-container[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  cursor: pointer;\n}\n.display-area[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  min-height: 30px;\n  padding: 4px 8px;\n  border: 1px solid transparent;\n  border-radius: 4px;\n  box-sizing: border-box;\n  transition: background-color 0.2s, border-color 0.2s;\n}\n.display-area[_ngcontent-%COMP%]:hover {\n  background-color: #f9f9f9;\n  border-color: #e0e0e0;\n}\n.display-area.disabled[_ngcontent-%COMP%] {\n  background-color: #f5f5f5;\n  color: #aaa;\n  cursor: not-allowed;\n}\n.display-area.placeholder[_ngcontent-%COMP%]   .display-value[_ngcontent-%COMP%] {\n  color: #999;\n  font-style: italic;\n}\n.display-value[_ngcontent-%COMP%] {\n  flex-grow: 1;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  padding-right: 8px;\n}\n.dropdown-panel[_ngcontent-%COMP%] {\n  background-color: white;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);\n  z-index: 1050;\n  min-width: 250px;\n  max-height: 300px;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n.search-container[_ngcontent-%COMP%] {\n  padding: 8px;\n  border-bottom: 1px solid #e0e0e0;\n}\n.search-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 8px;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  box-sizing: border-box;\n  font-size: 14px;\n}\n.options-list[_ngcontent-%COMP%] {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  overflow-y: auto;\n  flex-grow: 1;\n}\n.option-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  padding: 8px 12px;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  border-radius: 4px;\n  margin: 2px 0;\n}\n.option-item[_ngcontent-%COMP%]:hover {\n  background-color: #f0f0f0;\n}\n.option-item.selected[_ngcontent-%COMP%] {\n  background-color: #e0e0e0;\n  font-weight: 500;\n}\n.option-item.selected[_ngcontent-%COMP%]:hover {\n  background-color: #d5d5d5;\n}\n.option-label[_ngcontent-%COMP%] {\n  flex-grow: 1;\n  font-size: 14px;\n}\n.no-options[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  color: #999;\n  font-style: italic;\n}\n.dropdown-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-around;\n  padding: 8px;\n  border-top: 1px solid #e0e0e0;\n  background-color: #f9f9f9;\n}\n.action-button[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: #007bff;\n  cursor: pointer;\n  padding: 6px 10px;\n  font-size: 14px;\n  border-radius: 4px;\n  transition: background-color 0.2s;\n}\n.action-button[_ngcontent-%COMP%]:hover {\n  background-color: #e0e0e0;\n}\n/*# sourceMappingURL=invisible-searchable-multi-select.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(InvisibleSearchableMultiSelectComponent, { className: "InvisibleSearchableMultiSelectComponent", filePath: "src/app/features/form-designer-refactored/inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component.ts", lineNumber: 22 });
})();

// src/app/features/form-designer-refactored/inputs/nested-form-input/nested-form-input.component.ts
var _c02 = () => [];
var _forTrack02 = ($index, $item) => $item.id;
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 18);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("type", "text")("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 18);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("type", "textarea")("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 19);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 20);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 21);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-searchable-select", 22);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name))("options", ctx_r3.asFormField(container_r5.content).options || \u0275\u0275pureFunction0(4, _c02));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-searchable-multi-select", 22);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name))("options", ctx_r3.asFormField(container_r5.content).options || \u0275\u0275pureFunction0(4, _c02));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-checkbox-x", 23);
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext(2);
    const container_r5 = ctx_r6.$implicit;
    const $index_r8 = ctx_r6.$index;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name))("id", ctx_r3.asFormField(container_r5.content).name + "_" + $index_r8);
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-radio-checkboxes", 15);
  }
  if (rf & 2) {
    const ctx_r6 = \u0275\u0275nextContext(2);
    const container_r5 = ctx_r6.$implicit;
    const $index_r8 = ctx_r6.$index;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name))("name", ctx_r3.asFormField(container_r5.content).name + "_" + $index_r8)("options", ctx_r3.asFormField(container_r5.content).options || \u0275\u0275pureFunction0(3, _c02));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 24);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-invisible-input-field", 25);
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext(2).$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275styleMap(ctx_r3.asFormField(container_r5.content).style);
    \u0275\u0275property("formControl", ctx_r3.getFormControl(ctx_r3.asFormGroup(formGroup_r6), ctx_r3.asFormField(container_r5.content).name));
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275template(0, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_0_Template, 1, 4, "app-invisible-input-field", 9)(1, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_1_Template, 1, 4, "app-invisible-input-field", 9)(2, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_2_Template, 1, 3, "app-invisible-input-field", 10)(3, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_3_Template, 1, 3, "app-invisible-input-field", 11)(4, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_4_Template, 1, 3, "app-invisible-input-field", 12)(5, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_5_Template, 1, 5, "app-invisible-searchable-select", 13)(6, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_6_Template, 1, 5, "app-invisible-searchable-multi-select", 13)(7, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_7_Template, 1, 4, "app-checkbox-x", 14)(8, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_8_Template, 1, 4, "app-radio-checkboxes", 15)(9, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_9_Template, 1, 3, "app-invisible-input-field", 16)(10, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Case_10_Template, 1, 3, "app-invisible-input-field", 17);
  }
  if (rf & 2) {
    let tmp_22_0;
    const container_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275conditional((tmp_22_0 = ctx_r3.asFormField(container_r5.content).type) === "text" ? 0 : tmp_22_0 === "textarea" ? 1 : tmp_22_0 === "number" ? 2 : tmp_22_0 === "date" ? 3 : tmp_22_0 === "time" ? 4 : tmp_22_0 === "select" ? 5 : tmp_22_0 === "multi-select" ? 6 : tmp_22_0 === "checkbox" ? 7 : tmp_22_0 === "radio" ? 8 : tmp_22_0 === "file" ? 9 : 10);
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const container_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngStyle", ctx_r3.getContentStyles(container_r5));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", container_r5.content, " ");
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_23_0;
    const container_r5 = \u0275\u0275nextContext().$implicit;
    const formGroup_r6 = \u0275\u0275nextContext().$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngStyle", ctx_r3.getContentStyles(container_r5));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", (tmp_23_0 = ctx_r3.asFormGroup(formGroup_r6).get(container_r5.content)) == null ? null : tmp_23_0.value, " ");
  }
}
function NestedFormInputComponent_Conditional_1_For_1_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7);
    \u0275\u0275template(1, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_1_Template, 11, 1)(2, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_2_Template, 2, 2, "div", 8)(3, NestedFormInputComponent_Conditional_1_For_1_For_5_Conditional_3_Template, 2, 2, "div", 8);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const container_r5 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(3);
    \u0275\u0275property("ngStyle", ctx_r3.getContainerStyles(container_r5));
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r3.isFormField(container_r5.content) ? 1 : container_r5.contentType === "text" ? 2 : container_r5.contentType === "variable" ? 3 : -1);
  }
}
function NestedFormInputComponent_Conditional_1_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "button", 5);
    \u0275\u0275listener("click", function NestedFormInputComponent_Conditional_1_For_1_Template_button_click_1_listener() {
      const $index_r3 = \u0275\u0275restoreView(_r2).$index;
      const ctx_r3 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r3.removeItem($index_r3));
    });
    \u0275\u0275text(2, "X");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 6);
    \u0275\u0275repeaterCreate(4, NestedFormInputComponent_Conditional_1_For_1_For_5_Template, 4, 2, "div", 7, _forTrack02);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const formGroup_r6 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext(2);
    \u0275\u0275property("formGroup", ctx_r3.asFormGroup(formGroup_r6));
    \u0275\u0275advance(3);
    \u0275\u0275styleProp("width", ctx_r3.getSheetSize().width * ctx_r3.pixelsPerInch, "px")("height", ctx_r3.getSheetSize().height * ctx_r3.pixelsPerInch, "px");
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.getContainers());
  }
}
function NestedFormInputComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275repeaterCreate(0, NestedFormInputComponent_Conditional_1_For_1_Template, 6, 5, "div", 2, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementStart(2, "div", 3)(3, "button", 4);
    \u0275\u0275listener("click", function NestedFormInputComponent_Conditional_1_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.addItem());
    });
    \u0275\u0275text(4, "Add New Item");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r3.getFormGroupsForCurrentContainer());
  }
}
function NestedFormInputComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "p");
    \u0275\u0275text(2, "No items yet");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 4);
    \u0275\u0275listener("click", function NestedFormInputComponent_Conditional_2_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r9);
      const ctx_r3 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r3.addItem());
    });
    \u0275\u0275text(4, "Add First Item");
    \u0275\u0275elementEnd()();
  }
}
var NestedFormInputComponent = class _NestedFormInputComponent {
  formField = input();
  formArray = input(new FormArray([]));
  arrayIndexRange = input();
  fieldName = "";
  itemAdded = output();
  itemRemoved = output();
  formTemplate = computed(() => {
    const field = this.formField();
    if (!field)
      return null;
    if (field.nestedForm)
      return field.nestedForm;
    if (field.fields && field.fields.length > 0) {
      return this.buildTemplateFromFields(field.fields);
    }
    return null;
  });
  fb = inject(FormBuilder);
  pixelsPerInch = 96;
  ngOnInit() {
  }
  getFormGroupsForCurrentContainer() {
    const range = this.arrayIndexRange();
    if (range) {
      return this.formArray().controls.slice(range.start, range.end);
    }
    return this.formArray().controls;
  }
  addItem() {
    const nextSequence = this.formArray().length + 1;
    const newGroup = this.createFormGroup({ sequence: nextSequence });
    if (!newGroup.get("sequence")) {
      newGroup.addControl("sequence", new FormControl(nextSequence));
    }
    this.formArray().push(newGroup);
    this.itemAdded.emit(newGroup);
  }
  removeItem(index) {
    const startIndex = this.arrayIndexRange()?.start ?? 0;
    const actualIndex = startIndex + index;
    if (actualIndex < 0 || actualIndex >= this.formArray().length)
      return;
    this.itemRemoved.emit({ index: actualIndex, fieldName: this.fieldName });
  }
  getSheetSize() {
    return this.formTemplate()?.size || { width: 8.5, height: 11 };
  }
  getContainers() {
    return this.formTemplate()?.formContainers || [];
  }
  getAllFormFields() {
    const template = this.formTemplate();
    if (!template) {
      return this.formField()?.fields || [];
    }
    return (template.formContainers || []).filter((c) => c.contentType === "formField" && this.isFormField(c.content)).map((c) => c.content);
  }
  buildTemplateFromFields(fields) {
    const rowHeight = 30;
    const gap = 5;
    const containers = [];
    let yOffset = 0;
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const height = field.type === "textarea" ? rowHeight * 2 : rowHeight;
      containers.push(new FormContainerDto({
        id: -(i + 1),
        contentType: "formField",
        content: field,
        position: { x: 0, y: yOffset },
        size: { width: 8.5 * this.pixelsPerInch - 20, height },
        pageNumber: 1,
        style: { border: "1px solid #ccc" }
      }));
      yOffset += height + gap;
    }
    const totalHeight = yOffset / this.pixelsPerInch + 0.2;
    return new PrintableFormDto({
      formContainers: containers,
      size: { width: 8.5, height: Math.max(0.5, totalHeight) }
    });
  }
  createFormGroup(data = {}) {
    const group = {};
    const fields = this.getAllFormFields();
    fields.forEach((field) => {
      if (field && field.name) {
        let value = this.getNestedValue(data, field.name);
        if (field.type === "file") {
          value = null;
        } else if (field.type === "checkbox-group" || field.type === "multi-select") {
          value = value || [];
        } else if (field.type === "select" && typeof value === "object" && value !== null) {
          value = value.id;
        }
        this.setNestedControl(group, field.name, new FormControl(value || null, field.validators || []));
      }
    });
    return this.fb.group(this.convertToFormGroup(group));
  }
  convertToFormGroup(obj) {
    const result = {};
    for (const key in obj) {
      if (obj[key] instanceof FormControl || obj[key] instanceof FormArray || obj[key] instanceof FormGroup) {
        result[key] = obj[key];
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        result[key] = this.fb.group(this.convertToFormGroup(obj[key]));
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
  setNestedControl(group, path, control) {
    const parts = path.split(".");
    let current = group;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]])
        current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = control;
  }
  getFormControl(formGroup, path) {
    const control = formGroup.get(path);
    if (!control) {
      const parts = path.split(".");
      let current = formGroup;
      for (let i = 0; i < parts.length - 1; i++) {
        let next = current.get(parts[i]);
        if (!next) {
          const newGroup = this.fb.group({});
          current.addControl(parts[i], newGroup);
          next = newGroup;
        }
        current = next;
      }
      const finalKey = parts[parts.length - 1];
      const newControl = new FormControl(null);
      current.addControl(finalKey, newControl);
      return newControl;
    }
    return control;
  }
  getNestedValue(obj, path) {
    if (!obj || !path)
      return void 0;
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  }
  getContainerStyles(container) {
    const styles = __spreadProps(__spreadValues({}, container.style), {
      position: "absolute",
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`
    });
    if (this.isFormField(container.content) && container.content.style) {
      Object.assign(styles, container.content.style);
    }
    return styles;
  }
  getContentStyles(container) {
    if (!container.contentStyle)
      return {};
    const styles = __spreadValues({}, container.contentStyle);
    if (styles.fontSize && typeof styles.fontSize === "number") {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }
  isFormField(content) {
    return content && typeof content === "object" && "type" in content && "name" in content;
  }
  asFormField(content) {
    return content;
  }
  asFormGroup(control) {
    return control;
  }
  ngOnDestroy() {
  }
  static \u0275fac = function NestedFormInputComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NestedFormInputComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NestedFormInputComponent, selectors: [["app-nested-form-input"]], inputs: { formField: [1, "formField"], formArray: [1, "formArray"], arrayIndexRange: [1, "arrayIndexRange"], fieldName: "fieldName" }, outputs: { itemAdded: "itemAdded", itemRemoved: "itemRemoved" }, decls: 3, vars: 1, consts: [[1, "nested-form-array-container"], [1, "empty-state"], [1, "form-item-wrapper", 3, "formGroup"], [1, "add-item-section"], ["type", "button", 1, "add-button", 3, "click"], ["type", "button", 1, "remove-button", 3, "click"], [1, "form-sheet"], [1, "form-container", 3, "ngStyle"], [1, "content-display", 3, "ngStyle"], [3, "type", "formControl", "style"], ["type", "number", 3, "formControl", "style"], ["type", "date", 3, "formControl", "style"], ["type", "time", 3, "formControl", "style"], [3, "formControl", "options", "style"], [3, "formControl", "id", "style"], [3, "formControl", "name", "options"], ["type", "file", 3, "formControl", "style"], [3, "formControl", "style"], [3, "type", "formControl"], ["type", "number", 3, "formControl"], ["type", "date", 3, "formControl"], ["type", "time", 3, "formControl"], [3, "formControl", "options"], [3, "formControl", "id"], ["type", "file", 3, "formControl"], [3, "formControl"]], template: function NestedFormInputComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, NestedFormInputComponent_Conditional_1_Template, 5, 0)(2, NestedFormInputComponent_Conditional_2_Template, 5, 0, "div", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.formArray().length > 0 ? 1 : 2);
    }
  }, dependencies: [
    CommonModule,
    NgStyle,
    ReactiveFormsModule,
    NgControlStatus,
    NgControlStatusGroup,
    FormControlDirective,
    FormGroupDirective,
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    InvisibleSearchableMultiSelectComponent,
    CheckboxXComponent,
    RadioCheckboxesComponent
  ], styles: ["\n\n.nested-form-array-container[_ngcontent-%COMP%] {\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n.form-sheet[_ngcontent-%COMP%] {\n  position: relative;\n  background-color: white;\n  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\n  overflow: hidden;\n}\n.form-item-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  width: 100%;\n  display: flex;\n  justify-content: center;\n  margin-bottom: 4px;\n}\n.remove-button[_ngcontent-%COMP%] {\n  position: absolute;\n  top: -8px;\n  right: -8px;\n  z-index: 100;\n  background-color: rgba(231, 76, 60, 0.9);\n  color: white;\n  border: none;\n  border-radius: 50%;\n  width: 22px;\n  height: 22px;\n  line-height: 22px;\n  text-align: center;\n  font-weight: bold;\n  font-size: 12px;\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity 0.2s ease, background-color 0.2s ease;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);\n}\n.form-item-wrapper[_ngcontent-%COMP%]:hover   .remove-button[_ngcontent-%COMP%] {\n  opacity: 1;\n  background-color: rgba(192, 57, 43, 1);\n}\n.add-item-section[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n}\n.add-button[_ngcontent-%COMP%] {\n  padding: 10px 20px;\n  background-color: #2ecc71;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.3s;\n}\n.add-button[_ngcontent-%COMP%]:hover {\n  background-color: #27ae60;\n}\n.form-container[_ngcontent-%COMP%] {\n  position: absolute;\n}\n.content-display[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n/*# sourceMappingURL=nested-form-input.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NestedFormInputComponent, { className: "NestedFormInputComponent", filePath: "src/app/features/form-designer-refactored/inputs/nested-form-input/nested-form-input.component.ts", lineNumber: 28 });
})();

// src/app/models/permits/jha.model.ts
var JobStep = class {
  sequence;
  description;
  hazard;
  safetyMeasures;
  constructor(data = {}) {
    this.sequence = data.sequence ?? 0;
    this.description = data.description ?? "";
    this.hazard = data.hazard ?? "";
    this.safetyMeasures = data.safetyMeasures ?? "";
  }
  getFormFields() {
    return [
      { name: "description", label: "Description", type: "textarea" },
      { name: "hazard", label: "Hazard", type: "textarea" },
      { name: "safetyMeasures", label: "Safety Measure", type: "textarea" }
    ];
  }
};
var JhaDto = class _JhaDto extends BaseDto {
  jobName;
  applicability;
  analysisBy;
  reviewedBy;
  approvedBy;
  date;
  ppe;
  loto;
  confinedSpace;
  hazCom;
  handAndPowerTools;
  specialTools;
  jobSteps;
  sharepointId;
  localUuid;
  workRequestSharepointId;
  workRequestId;
  status;
  attachmentCount;
  timeSubmitted;
  submitterName;
  submitterEmail;
  submitterPhone;
  submitterCompany;
  constructor(data = {}) {
    super(data);
    this.jobName = data.jobName ?? null;
    this.applicability = data.applicability ?? null;
    this.analysisBy = data.analysisBy ?? null;
    this.reviewedBy = data.reviewedBy ?? null;
    this.approvedBy = data.approvedBy ?? null;
    this.date = data.date ?? null;
    this.ppe = data.ppe ?? null;
    this.loto = data.loto ?? null;
    this.confinedSpace = data.confinedSpace ?? null;
    this.hazCom = data.hazCom ?? null;
    this.handAndPowerTools = data.handAndPowerTools ?? null;
    this.specialTools = data.specialTools ?? null;
    this.jobSteps = data.jobSteps ?? null;
    this.sharepointId = data.sharepointId ?? null;
    this.localUuid = data.localUuid ?? null;
    this.workRequestSharepointId = data.workRequestSharepointId ?? null;
    this.workRequestId = data.workRequestId ?? null;
    this.status = data.status ?? null;
    this.attachmentCount = data.attachmentCount ?? null;
    this.timeSubmitted = data.timeSubmitted ?? null;
    this.submitterName = data.submitterName ?? null;
    this.submitterEmail = data.submitterEmail ?? null;
    this.submitterPhone = data.submitterPhone ?? null;
    this.submitterCompany = data.submitterCompany ?? null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      jobName: this.jobName,
      applicability: this.applicability,
      analysisBy: this.analysisBy,
      reviewedBy: this.reviewedBy,
      approvedBy: this.approvedBy,
      date: this.date,
      ppe: this.ppe,
      loto: this.loto,
      confinedSpace: this.confinedSpace,
      hazCom: this.hazCom,
      handAndPowerTools: this.handAndPowerTools,
      specialTools: this.specialTools,
      jobSteps: this.jobSteps,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
      workRequestSharepointId: this.workRequestSharepointId,
      workRequestId: this.workRequestId,
      status: this.status,
      attachmentCount: this.attachmentCount,
      timeSubmitted: this.timeSubmitted,
      submitterName: this.submitterName,
      submitterEmail: this.submitterEmail,
      submitterPhone: this.submitterPhone,
      submitterCompany: this.submitterCompany
    });
  }
  static fromJson(json) {
    if (!json)
      return new _JhaDto();
    return new _JhaDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      jobName: json.jobName || null,
      applicability: json.applicability || null,
      analysisBy: json.analysisBy || null,
      reviewedBy: json.reviewedBy || null,
      approvedBy: json.approvedBy || null,
      date: json.date || null,
      ppe: json.ppe || null,
      loto: json.loto || null,
      confinedSpace: json.confinedSpace || null,
      hazCom: json.hazCom || null,
      handAndPowerTools: json.handAndPowerTools || null,
      specialTools: json.specialTools || null,
      jobSteps: json.jobSteps || null,
      sharepointId: json.sharepointId || null,
      localUuid: json.localUuid || null,
      workRequestSharepointId: json.workRequestSharepointId || null,
      workRequestId: json.workRequestId ?? null,
      status: json.status || null,
      attachmentCount: json.attachmentCount ?? null,
      timeSubmitted: json.timeSubmitted || null,
      submitterName: json.submitterName || null,
      submitterEmail: json.submitterEmail || null,
      submitterPhone: json.submitterPhone || null,
      submitterCompany: json.submitterCompany || null
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "jobName",
      "applicability",
      "analysisBy",
      "reviewedBy",
      "approvedBy",
      "date",
      "ppe",
      "loto",
      "confinedSpace",
      "hazCom",
      "handAndPowerTools",
      "specialTools",
      "jobSteps",
      "sharepointId",
      "localUuid",
      "workRequestSharepointId",
      "workRequestId",
      "status",
      "attachmentCount",
      "timeSubmitted",
      "submitterName",
      "submitterEmail",
      "submitterPhone",
      "submitterCompany",
      "isVerified",
      "name",
      "objectType"
    ].includes(key);
  }
  getFormFields() {
    return [
      { name: "jobName", label: "Job Name/Title", type: "text", initialValue: this.jobName },
      { name: "applicability", label: "Applicability", type: "text", initialValue: this.applicability },
      { name: "analysisBy", label: "Analysis By", type: "text", initialValue: this.analysisBy },
      { name: "reviewedBy", label: "Reviewed By", type: "text", initialValue: this.reviewedBy },
      { name: "approvedBy", label: "Approved By", type: "text", initialValue: this.approvedBy },
      { name: "date", label: "Date", type: "date", initialValue: this.date },
      { name: "ppe", label: "PPE", type: "textarea", initialValue: this.ppe },
      { name: "loto", label: "LOTO", type: "textarea", initialValue: this.loto },
      { name: "confinedSpace", label: "Confined Space", type: "textarea", initialValue: this.confinedSpace },
      { name: "hazCom", label: "HazCom", type: "textarea", initialValue: this.hazCom },
      { name: "handAndPowerTools", label: "Hand and Power Tools", type: "textarea", initialValue: this.handAndPowerTools },
      { name: "specialTools", label: "Special Tools", type: "textarea", initialValue: this.specialTools }
    ];
  }
};

export {
  EnergizedWorkPermitDto,
  ExcavationPermitDto,
  VentingPermitDto,
  InvisibleInputFieldComponent,
  RadioCheckboxesComponent,
  InvisibleSearchableSelectComponent,
  CheckboxXComponent,
  InvisibleSearchableMultiSelectComponent,
  NestedFormInputComponent,
  JobStep,
  JhaDto
};
//# sourceMappingURL=chunk-XSJQK2C3.js.map
