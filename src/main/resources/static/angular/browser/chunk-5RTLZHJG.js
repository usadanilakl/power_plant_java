import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  OverlayModule,
  ValueDto
} from "./chunk-C3MIWPDE.js";
import {
  FormContainerDto,
  PrintableFormDto
} from "./chunk-GLQJSYC5.js";
import {
  BaseDto,
  CheckboxControlValueAccessor,
  CommonModule,
  DefaultValueAccessor,
  ElementRef,
  EventEmitter,
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
  NgForOf,
  NgIf,
  NgModel,
  NgStyle,
  NumberValueAccessor,
  Observable,
  ReactiveFormsModule,
  Validators,
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
} from "./chunk-AVNJ6D7Z.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/models/permits/safe-work.model.ts
var SwHazards = class {
  highTemp = false;
  highPressure = false;
  energized = false;
  storedEnergy = false;
  eyeHazard = false;
  egressAccess = false;
  ergonomicHazard = false;
  fallingObject = false;
  highNoise = false;
  dustParticulate = false;
  combustibleDust = false;
  fireHazard = false;
  hotSurface = false;
  slippery = false;
  ventilationRequired = false;
  lightingRestrictions = false;
  chemicalExposure = false;
  liftingHazard = false;
  handTraps = false;
  heatColdStress = false;
  elevatedSurface = false;
  environmental = false;
  weatherHazards = false;
  weatherHazardDescription = "";
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var SwPermits = class {
  lotoRequired = false;
  lotoDescription = "";
  confinedSpace = false;
  confinedSpaceDescription = "";
  hotWork = false;
  hotWorkDescription = "";
  ventingPurging = false;
  ventingPurgingDescription = "";
  jha = true;
  gasTesting = false;
  excavationPermit = false;
  energizedPermit = false;
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var SwPpe = class {
  hardhat = true;
  safetyGlasses = true;
  hearingProtection = true;
  boots = true;
  fallProtection = false;
  gfi = false;
  respirator = false;
  dustMask = false;
  gloves = true;
  iceCleats = false;
  acidSuit = false;
  barricade = false;
  faceShield = false;
  gasMonitor = false;
  arcFlashPpe = false;
  weldingJacket = false;
  weldingShield = false;
  weldingGloves = false;
  purgingVentilation = false;
  other = false;
  otherDescription = "";
  dummyCheckbox = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var SafeWorkDto = class _SafeWorkDto extends BaseDto {
  date;
  time;
  companyPerson;
  location;
  workScope;
  specialInstructions;
  requestedBy;
  hazards;
  permits;
  ppe;
  permitStatus;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.companyPerson = data.companyPerson ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.requestedBy = data.requestedBy ?? null;
    this.hazards = data.hazards ?? new SwHazards();
    this.permits = data.permits ?? new SwPermits();
    this.ppe = data.ppe ?? new SwPpe();
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      companyPerson: this.companyPerson,
      location: this.location,
      workScope: this.workScope,
      specialInstructions: this.specialInstructions,
      requestedBy: this.requestedBy,
      hazards: this.hazards,
      permits: this.permits,
      ppe: this.ppe,
      permitStatus: this.permitStatus?.toJson() ?? null
    });
  }
  static fromJson(json) {
    return new _SafeWorkDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date || null,
      time: json.time || null,
      companyPerson: json.companyPerson || null,
      location: json.location || null,
      workScope: json.workScope || null,
      specialInstructions: json.specialInstructions || null,
      requestedBy: json.requestedBy || null,
      hazards: json.hazards || new SwHazards(),
      permits: json.permits || new SwPermits(),
      ppe: json.ppe || new SwPpe(),
      permitStatus: ValueDto.fromJson(json.permitStatus)
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "date",
      "time",
      "companyPerson",
      "location",
      "workScope",
      "specialInstructions",
      "requestedBy",
      "isVerified",
      "name",
      "objectType",
      ...Object.keys(_SafeWorkDto.getHazardFields(null)),
      ...Object.keys(_SafeWorkDto.getPermitFields(null)),
      ...Object.keys(_SafeWorkDto.getPpeFields(null))
    ].includes(key);
  }
  static toFormFields(dto, locationOptions, fields = [
    "date",
    "time",
    "companyPerson",
    "location",
    "workScope",
    "specialInstructions",
    "requestedBy",
    ...Object.keys(_SafeWorkDto.getHazardFields(null)),
    ...Object.keys(_SafeWorkDto.getPermitFields(null)),
    ...Object.keys(_SafeWorkDto.getPpeFields(null))
  ]) {
    const ppeFields = _SafeWorkDto.getPpeFields(dto.ppe);
    const permitFields = _SafeWorkDto.getPermitFields(dto.permits);
    const hazardFields = _SafeWorkDto.getHazardFields(dto.hazards);
    const allFields = __spreadValues(__spreadValues(__spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: {
        name: "time",
        label: "Time",
        type: "time",
        validators: [Validators.required],
        initialValue: dto.time ?? (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5)
      },
      companyPerson: {
        name: "companyPerson",
        label: "Company Person",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.companyPerson
      },
      location: {
        name: "location",
        label: "Location",
        type: "text",
        // type: 'multi-select',
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      workScope: {
        name: "workScope",
        label: "Work Scope",
        type: "textarea",
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      specialInstructions: {
        name: "specialInstructions",
        label: "Special Instructions",
        type: "textarea",
        initialValue: dto.specialInstructions
      },
      requestedBy: {
        name: "requestedBy",
        label: "Requested By",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.requestedBy
      },
      isVerified: {
        name: "isVerified",
        label: "Is Verified",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isVerified?.toString()
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType }
    }, ppeFields), permitFields), hazardFields);
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["date", "time", "companyPerson", "location", "workScope", "requestedBy"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      companyPerson: { id: "companyPerson", header: "Company Person", accessorKey: "companyPerson" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      specialInstructions: { id: "specialInstructions", header: "Special Instructions", accessorKey: "specialInstructions" },
      requestedBy: { id: "requestedBy", header: "Requested By", accessorKey: "requestedBy" },
      hazards: {
        id: "hazards",
        header: "Hazards",
        accessorFn: (item) => item.hazards ? "Yes" : "No"
      },
      permits: {
        id: "permits",
        header: "Permits",
        accessorFn: (item) => item.permits ? "Yes" : "No"
      },
      ppe: {
        id: "ppe",
        header: "PPE",
        accessorFn: (item) => item.ppe ? "Yes" : "No"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      permitStatus: {
        id: "permitStatus",
        header: "Status",
        accessorFn: (item) => item.permitStatus?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static generatePermitFromRequest(request) {
    return new _SafeWorkDto({
      // date: request.dateOfWorkToBePerformed?.split("T")[0],
      date: request.dateOfWorkToBePerformed?.split("T")[0] ?? null,
      time: request.timeOfWorkToBePerformed,
      companyPerson: request.company + "/" + request.requestedBy,
      location: request.location,
      workScope: request.workScope,
      requestedBy: request.requestedBy
    });
  }
  static formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static getHazardOptions(hazards) {
    if (!hazards)
      return [];
    const hazardKeys = Object.keys(hazards);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: hazards[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPpeOptions(ppe) {
    if (!ppe)
      return [];
    const hazardKeys = Object.keys(ppe);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: ppe[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPermitOptions(permits) {
    if (!permits)
      return [];
    const hazardKeys = Object.keys(permits);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: permits[key]
        // The boolean value (true/false)
      };
    });
  }
  static getHazardFields(hazardsDto) {
    const hazards = hazardsDto || new SwHazards();
    const group = { label: "Hazards", orientation: "horizontal" };
    return {
      "hazards.highTemp": { name: "hazards.highTemp", label: "High Temp", type: "checkbox", initialValue: hazards.highTemp, group },
      "hazards.highPressure": { name: "hazards.highPressure", label: "High Pressure", type: "checkbox", initialValue: hazards.highPressure, group },
      "hazards.energized": { name: "hazards.energized", label: "Energized", type: "checkbox", initialValue: hazards.energized, group },
      "hazards.storedEnergy": { name: "hazards.storedEnergy", label: "Stored Energy", type: "checkbox", initialValue: hazards.storedEnergy, group },
      "hazards.eyeHazard": { name: "hazards.eyeHazard", label: "Eye Hazard", type: "checkbox", initialValue: hazards.eyeHazard, group },
      "hazards.egressAccess": { name: "hazards.egressAccess", label: "Egress/Access", type: "checkbox", initialValue: hazards.egressAccess, group },
      "hazards.ergonomicHazard": { name: "hazards.ergonomicHazard", label: "Ergonomic Hazard", type: "checkbox", initialValue: hazards.ergonomicHazard, group },
      "hazards.fallingObject": { name: "hazards.fallingObject", label: "Falling Object", type: "checkbox", initialValue: hazards.fallingObject, group },
      "hazards.highNoise": { name: "hazards.highNoise", label: "High Noise", type: "checkbox", initialValue: hazards.highNoise, group },
      "hazards.dustParticulate": { name: "hazards.dustParticulate", label: "Dust/Particulate", type: "checkbox", initialValue: hazards.dustParticulate, group },
      "hazards.combustibleDust": { name: "hazards.combustibleDust", label: "Combustible Dust", type: "checkbox", initialValue: hazards.combustibleDust, group },
      "hazards.fireHazard": { name: "hazards.fireHazard", label: "Fire Hazard", type: "checkbox", initialValue: hazards.fireHazard, group },
      "hazards.hotSurface": { name: "hazards.hotSurface", label: "Hot Surface", type: "checkbox", initialValue: hazards.hotSurface, group },
      "hazards.slippery": { name: "hazards.slippery", label: "Slippery", type: "checkbox", initialValue: hazards.slippery, group },
      "hazards.ventilationRequired": { name: "hazards.ventilationRequired", label: "Ventilation Required", type: "checkbox", initialValue: hazards.ventilationRequired, group },
      "hazards.lightingRestrictions": { name: "hazards.lightingRestrictions", label: "Lighting Restrictions", type: "checkbox", initialValue: hazards.lightingRestrictions, group },
      "hazards.chemicalExposure": { name: "hazards.chemicalExposure", label: "Chemical Exposure", type: "checkbox", initialValue: hazards.chemicalExposure, group },
      "hazards.liftingHazard": { name: "hazards.liftingHazard", label: "Lifting Hazard", type: "checkbox", initialValue: hazards.liftingHazard, group },
      "hazards.handTraps": { name: "hazards.handTraps", label: "Hand Traps", type: "checkbox", initialValue: hazards.handTraps, group },
      "hazards.heatColdStress": { name: "hazards.heatColdStress", label: "Heat/Cold Stress", type: "checkbox", initialValue: hazards.heatColdStress, group },
      "hazards.elevatedSurface": { name: "hazards.elevatedSurface", label: "Elevated Surface", type: "checkbox", initialValue: hazards.elevatedSurface, group },
      "hazards.environmental": { name: "hazards.environmental", label: "Environmental", type: "checkbox", initialValue: hazards.environmental, group },
      "hazards.other": { name: "hazards.other", label: "Other", type: "checkbox", initialValue: hazards.other, group },
      "hazards.otherDescription": { name: "hazards.otherDescription", label: "Other Description", type: "text", initialValue: hazards.otherDescription, group }
    };
  }
  static getPermitFields(permitsDto) {
    const permits = permitsDto || new SwPermits();
    const group = { label: "Permits", orientation: "horizontal" };
    return {
      "permits.lotoRequired": { name: "permits.lotoRequired", label: "LOTO Required", type: "checkbox", initialValue: permits.lotoRequired, group },
      "permits.lotoDescription": { name: "permits.lotoDescription", label: "LOTO Description", type: "text", initialValue: permits.lotoDescription, group },
      "permits.confinedSpace": { name: "permits.confinedSpace", label: "Confined Space", type: "checkbox", initialValue: permits.confinedSpace, group },
      "permits.confinedSpaceDescription": { name: "permits.confinedSpaceDescription", label: "Confined Space Description", type: "text", initialValue: permits.confinedSpaceDescription, group },
      "permits.hotWork": { name: "permits.hotWork", label: "Hot Work", type: "checkbox", initialValue: permits.hotWork, group },
      "permits.hotWorkDescription": { name: "permits.hotWorkDescription", label: "Hot Work Description", type: "text", initialValue: permits.hotWorkDescription, group },
      "permits.ventingPurging": { name: "permits.ventingPurging", label: "Venting/Purging", type: "checkbox", initialValue: permits.ventingPurging, group },
      "permits.ventingPurgingDescription": { name: "permits.ventingPurgingDescription", label: "Venting/Purging Description", type: "text", initialValue: permits.ventingPurgingDescription, group },
      "permits.jha": { name: "permits.jha", label: "JHA", type: "checkbox", initialValue: permits.jha, group },
      "permits.gasTesting": { name: "permits.gasTesting", label: "Gas Testing", type: "checkbox", initialValue: permits.gasTesting, group },
      "permits.excavationPermit": { name: "permits.excavationPermit", label: "Excavation Permit", type: "checkbox", initialValue: permits.excavationPermit, group },
      "permits.energizedPermit": { name: "permits.energizedPermit", label: "Energized Permit", type: "checkbox", initialValue: permits.energizedPermit, group },
      "permits.other": { name: "permits.other", label: "Other", type: "checkbox", initialValue: permits.other, group },
      "permits.otherDescription": { name: "permits.otherDescription", label: "Other Description", type: "text", initialValue: permits.otherDescription, group }
    };
  }
  static getPpeFields(ppeDto) {
    const ppe = ppeDto || new SwPpe();
    const group = { label: "PPE", orientation: "horizontal" };
    return {
      "ppe.hardhat": { name: "ppe.hardhat", label: "Hardhat", type: "checkbox", initialValue: ppe.hardhat, group },
      "ppe.safetyGlasses": { name: "ppe.safetyGlasses", label: "Safety Glasses", type: "checkbox", initialValue: ppe.safetyGlasses, group },
      "ppe.hearingProtection": { name: "ppe.hearingProtection", label: "Hearing Protection", type: "checkbox", initialValue: ppe.hearingProtection, group },
      "ppe.boots": { name: "ppe.boots", label: "Boots", type: "checkbox", initialValue: ppe.boots, group },
      "ppe.fallProtection": { name: "ppe.fallProtection", label: "Fall Protection", type: "checkbox", initialValue: ppe.fallProtection, group },
      "ppe.gfi": { name: "ppe.gfi", label: "GFI", type: "checkbox", initialValue: ppe.gfi, group },
      "ppe.respirator": { name: "ppe.respirator", label: "Respirator", type: "checkbox", initialValue: ppe.respirator, group },
      "ppe.dustMask": { name: "ppe.dustMask", label: "Dust Mask", type: "checkbox", initialValue: ppe.dustMask, group },
      "ppe.gloves": { name: "ppe.gloves", label: "Gloves", type: "checkbox", initialValue: ppe.gloves, group },
      "ppe.iceCleats": { name: "ppe.iceCleats", label: "Ice Cleats", type: "checkbox", initialValue: ppe.iceCleats, group },
      "ppe.acidSuit": { name: "ppe.acidSuit", label: "Acid Suit", type: "checkbox", initialValue: ppe.acidSuit, group },
      "ppe.barricade": { name: "ppe.barricade", label: "Barricade", type: "checkbox", initialValue: ppe.barricade, group },
      "ppe.faceShield": { name: "ppe.faceShield", label: "Face Shield", type: "checkbox", initialValue: ppe.faceShield, group },
      "ppe.gasMonitor": { name: "ppe.gasMonitor", label: "Gas Monitor", type: "checkbox", initialValue: ppe.gasMonitor, group },
      "ppe.arcFlashPpe": { name: "ppe.arcFlashPpe", label: "Arc Flash PPE", type: "checkbox", initialValue: ppe.arcFlashPpe, group },
      "ppe.weldingJacket": { name: "ppe.weldingJacket", label: "Welding Jacket", type: "checkbox", initialValue: ppe.weldingJacket, group },
      "ppe.weldingShield": { name: "ppe.weldingShield", label: "Welding Shield", type: "checkbox", initialValue: ppe.weldingShield, group },
      "ppe.weldingGloves": { name: "ppe.weldingGloves", label: "Welding Gloves", type: "checkbox", initialValue: ppe.weldingGloves, group },
      "ppe.purgingVentilation": { name: "ppe.purgingVentilation", label: "Purging Ventilation", type: "checkbox", initialValue: ppe.purgingVentilation, group },
      "ppe.other": { name: "ppe.other", label: "Other", type: "checkbox", initialValue: ppe.other, group },
      "ppe.otherDescription": { name: "ppe.otherDescription", label: "Other Description", type: "text", initialValue: ppe.otherDescription, group }
    };
  }
};

// src/app/models/permits/hot-work.model.ts
var HotWorkMeasures = class {
  areaIsClean = true;
  flammablesAreSecured = true;
  noCombustibleDustOrDebrisPresent = true;
  radiativeHeatPreventiveMeasuresAreTaken = true;
  vesselsArePurged = true;
  openingsAreCovered = true;
  ductVentilationIsSecured = true;
  lockOutIsCompleted = true;
  communicationIsEstablished = true;
  fireWatchIsAwareOfDuties = true;
  fireExtinguisherPresent = true;
  fireProtectionIsInService = true;
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var HotWorkDto = class _HotWorkDto extends BaseDto {
  date;
  location;
  workScope;
  foreman;
  fireWatch;
  meterModel;
  meterNum;
  specialInstructions;
  measures;
  isAirMonitoringRegisteredOnConfinedSpace;
  timeOfInitialTest;
  isFireWatchRequired;
  initialTestResult;
  permitStatus;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.foreman = data.foreman ?? null;
    this.fireWatch = data.fireWatch ?? null;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.measures = data.measures ?? new HotWorkMeasures();
    this.isAirMonitoringRegisteredOnConfinedSpace = data.isAirMonitoringRegisteredOnConfinedSpace ?? false;
    this.timeOfInitialTest = data.timeOfInitialTest ?? "";
    this.isFireWatchRequired = data.isFireWatchRequired ?? true;
    this.initialTestResult = data.initialTestResult ?? "";
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      location: this.location,
      workScope: this.workScope,
      foreman: this.foreman,
      fireWatch: this.fireWatch,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      specialInstructions: this.specialInstructions,
      measures: this.measures,
      permitStatus: this.permitStatus?.toJson() ?? null
    });
  }
  static fromJson(json) {
    return new _HotWorkDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date || null,
      location: json.location || null,
      workScope: json.workScope || null,
      foreman: json.foreman || null,
      fireWatch: json.fireWatch || null,
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      specialInstructions: json.specialInstructions || null,
      measures: json.measures || new HotWorkMeasures(),
      permitStatus: ValueDto.fromJson(json.permitStatus)
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "date",
      "location",
      "workScope",
      "foreman",
      "fireWatch",
      "meterModel",
      "meterNum",
      "specialInstructions",
      "measures",
      "isVerified",
      "name",
      "objectType"
    ].includes(key);
  }
  static toFormFields(dto, locationOptions, fields = [
    "date",
    "location",
    "workScope",
    "foreman",
    "fireWatch",
    "meterModel",
    "meterNum",
    "specialInstructions",
    ...Object.keys(_HotWorkDto.getMeasureFields(null))
  ]) {
    const measureFields = _HotWorkDto.getMeasureFields(dto.measures);
    const allFields = __spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      location: {
        name: "location",
        label: "Location",
        type: "text",
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      workScope: {
        name: "workScope",
        label: "Work Scope",
        type: "textarea",
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      foreman: {
        name: "foreman",
        label: "Foreman",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.foreman
      },
      fireWatch: {
        name: "fireWatch",
        label: "Fire Watch",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.fireWatch
      },
      meterModel: {
        name: "meterModel",
        label: "Meter Model",
        type: "text",
        initialValue: dto.meterModel
      },
      meterNum: {
        name: "meterNum",
        label: "Meter Number",
        type: "text",
        initialValue: dto.meterNum
      },
      specialInstructions: {
        name: "specialInstructions",
        label: "Special Instructions",
        type: "textarea",
        initialValue: dto.specialInstructions
      },
      name: { name: "name", label: "Name", type: "text", initialValue: dto.name },
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType },
      isAirMonitoringRegisteredOnConfinedSpace: {
        name: "isAirMonitoringRegisteredOnConfinedSpace",
        label: "Air Monitoring Registered on Confined Space",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isAirMonitoringRegisteredOnConfinedSpace?.toString()
      },
      isFireWatchRequired: {
        name: "isFireWatchRequired",
        label: "Fire Watch Required",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isFireWatchRequired?.toString()
      },
      timeOfInitialTest: {
        name: "timeOfInitialTest",
        label: "Time of Initial Test",
        type: "time",
        initialValue: dto.timeOfInitialTest
      },
      initialTestResult: {
        name: "initialTestResult",
        label: "Initial Test Result",
        type: "text",
        initialValue: dto.initialTestResult
      }
    }, measureFields);
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["date", "location", "workScope", "foreman", "fireWatch"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      location: { id: "location", header: "Location", accessorKey: "location" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      foreman: { id: "foreman", header: "Foreman", accessorKey: "foreman" },
      fireWatch: { id: "fireWatch", header: "Fire Watch", accessorKey: "fireWatch" },
      meterModel: { id: "meterModel", header: "Meter Model", accessorKey: "meterModel" },
      meterNum: { id: "meterNum", header: "Meter Number", accessorKey: "meterNum" },
      specialInstructions: { id: "specialInstructions", header: "Special Instructions", accessorKey: "specialInstructions" },
      measures: {
        id: "measures",
        header: "Safety Measures",
        accessorFn: (item) => item.measures ? "Yes" : "No"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      isAirMonitoringRegisteredOnConfinedSpace: {
        id: "isAirMonitoringRegisteredOnConfinedSpace",
        header: "Air Mon. on CS",
        accessorFn: (item) => item.isAirMonitoringRegisteredOnConfinedSpace ? "Yes" : "No"
      },
      isFireWatchRequired: {
        id: "isFireWatchRequired",
        header: "Fire Watch Req.",
        accessorFn: (item) => item.isFireWatchRequired ? "Yes" : "No"
      },
      timeOfInitialTest: {
        id: "timeOfInitialTest",
        header: "Initial Test Time",
        accessorKey: "timeOfInitialTest"
      },
      initialTestResult: {
        id: "initialTestResult",
        header: "Initial Test Result",
        accessorKey: "initialTestResult"
      },
      permitStatus: {
        id: "permitStatus",
        header: "Status",
        accessorFn: (item) => item.permitStatus?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static generatePermitFromRequest(request) {
    return new _HotWorkDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0],
      foreman: request.requestedBy,
      location: request.location,
      workScope: request.workScope,
      fireWatch: request.fireWatch
    });
  }
  static formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static getHwMeasuresOptions(measures) {
    if (!measures)
      return [];
    const hazardKeys = Object.keys(measures);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: measures[key]
        // The boolean value (true/false)
      };
    });
  }
  static getMeasureFields(measuresDto) {
    const measures = measuresDto || new HotWorkMeasures();
    const group = { label: "Safety Measures", orientation: "vertical" };
    return {
      "measures.areaIsClean": { name: "measures.areaIsClean", label: "Area is Clean", type: "checkbox", initialValue: measures.areaIsClean, group },
      "measures.flammablesAreSecured": { name: "measures.flammablesAreSecured", label: "Flammables are Secured", type: "checkbox", initialValue: measures.flammablesAreSecured, group },
      "measures.noCombustibleDustOrDebrisPresent": { name: "measures.noCombustibleDustOrDebrisPresent", label: "No Combustible Dust/Debris", type: "checkbox", initialValue: measures.noCombustibleDustOrDebrisPresent, group },
      "measures.radiativeHeatPreventiveMeasuresAreTaken": { name: "measures.radiativeHeatPreventiveMeasuresAreTaken", label: "Radiative Heat Prevention Taken", type: "checkbox", initialValue: measures.radiativeHeatPreventiveMeasuresAreTaken, group },
      "measures.vesselsArePurged": { name: "measures.vesselsArePurged", label: "Vessels are Purged", type: "checkbox", initialValue: measures.vesselsArePurged, group },
      "measures.openingsAreCovered": { name: "measures.openingsAreCovered", label: "Openings are Covered", type: "checkbox", initialValue: measures.openingsAreCovered, group },
      "measures.ductVentilationIsSecured": { name: "measures.ductVentilationIsSecured", label: "Duct Ventilation Secured", type: "checkbox", initialValue: measures.ductVentilationIsSecured, group },
      "measures.lockOutIsCompleted": { name: "measures.lockOutIsCompleted", label: "Lock-Out Completed", type: "checkbox", initialValue: measures.lockOutIsCompleted, group },
      "measures.communicationIsEstablished": { name: "measures.communicationIsEstablished", label: "Communication Established", type: "checkbox", initialValue: measures.communicationIsEstablished, group },
      "measures.fireWatchIsAwareOfDuties": { name: "measures.fireWatchIsAwareOfDuties", label: "Fire Watch Aware of Duties", type: "checkbox", initialValue: measures.fireWatchIsAwareOfDuties, group },
      "measures.fireExtinguisherPresent": { name: "measures.fireExtinguisherPresent", label: "Fire Extinguisher Present", type: "checkbox", initialValue: measures.fireExtinguisherPresent, group },
      "measures.fireProtectionIsInService": { name: "measures.fireProtectionIsInService", label: "Fire Protection in Service", type: "checkbox", initialValue: measures.fireProtectionIsInService, group }
    };
  }
};

// src/app/models/permits/confined-space.model.ts
var ConfinedSpaceHazards = class {
  oxygenDeficiency = false;
  flammableGas = false;
  combustibleDust = false;
  toxicGas = false;
  rotatingEquipment = false;
  electricalShock = false;
  entrapment = false;
  engulfment = false;
  heatStress = false;
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ConfinedSpacePpe = class {
  faceShield = false;
  fcfi = false;
  lovVoltageTools = false;
  explosionProofTools = false;
  nonSparkingTools = false;
  fallProtection = false;
  retrievalSystem = false;
  lifeline = false;
  personalAtmosphericMeter = true;
  tripod = false;
  other = false;
  otherDescription = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ConfinedSpacePrecautions = class {
  ventilation = false;
  blankFlanged = false;
  doubleBlockAndBleed = false;
  barriers = false;
  other = false;
  otherDescription = "";
  lockOutTagOut = "";
  hotWorkPermit = "";
  constructor(data = {}) {
    Object.assign(this, data);
  }
};
var ConfinedSpaceDto = class _ConfinedSpaceDto extends BaseDto {
  date;
  time;
  space;
  workScope;
  issuedTo;
  duration;
  lotoNum;
  hotWorkNum;
  ventilation;
  blankFlanged;
  meterModel;
  meterNum;
  calibrated;
  oxygen;
  lel;
  hydrogenSulfide;
  carbonMonoxide;
  ammonia;
  timeOfSample;
  testerInitials;
  hazards;
  ppe;
  precautions;
  permitStatus;
  constructor(data = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.space = data.space ?? null;
    this.workScope = data.workScope ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.duration = data.duration ?? "12 hours";
    this.lotoNum = data.lotoNum ?? null;
    this.hotWorkNum = data.hotWorkNum ?? null;
    this.ventilation = data.ventilation ?? false;
    this.blankFlanged = data.blankFlanged ?? false;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.calibrated = data.calibrated ?? true;
    this.oxygen = data?.oxygen ?? null;
    this.lel = data?.lel ?? null;
    this.hydrogenSulfide = data?.hydrogenSulfide ?? null;
    this.carbonMonoxide = data?.carbonMonoxide ?? null;
    this.ammonia = data?.ammonia ?? null;
    this.timeOfSample = data?.timeOfSample ?? null;
    this.testerInitials = data?.testerInitials ?? null;
    this.hazards = data.hazards ?? new ConfinedSpaceHazards();
    this.ppe = data.ppe ?? new ConfinedSpacePpe();
    this.precautions = data.precautions ?? new ConfinedSpacePrecautions();
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      date: this.date,
      time: this.time,
      space: this.space,
      workScope: this.workScope,
      issuedTo: this.issuedTo,
      duration: this.duration,
      lotoNum: this.lotoNum,
      hotWorkNum: this.hotWorkNum,
      ventilation: this.ventilation,
      blankFlanged: this.blankFlanged,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      calibrated: this.calibrated,
      oxygen: this.oxygen,
      lel: this.lel,
      hydrogenSulfide: this.hydrogenSulfide,
      carbonMonoxide: this.carbonMonoxide,
      ammonia: this.ammonia,
      hazards: this.hazards,
      ppe: this.ppe,
      precautions: this.precautions,
      permitStatus: this.permitStatus?.toJson() ?? null
    });
  }
  static fromJson(json) {
    return new _ConfinedSpaceDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      date: json.date || null,
      time: json.time || null,
      space: json.space || null,
      workScope: json.workScope || null,
      issuedTo: json.issuedTo || null,
      duration: json.duration || null,
      lotoNum: json.lotoNum || null,
      hotWorkNum: json.hotWorkNum || null,
      ventilation: json.ventilation || false,
      blankFlanged: json.blankFlanged || false,
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      calibrated: json.calibrated || false,
      oxygen: json.oxygen || null,
      lel: json.lel || null,
      hydrogenSulfide: json.hydrogenSulfide || null,
      carbonMonoxide: json.carbonMonoxide || null,
      ammonia: json.ammonia || null,
      hazards: json.hazards || new ConfinedSpaceHazards(),
      ppe: json.ppe || new ConfinedSpacePpe(),
      precautions: json.precautions || new ConfinedSpacePrecautions(),
      permitStatus: ValueDto.fromJson(json.permitStatus)
    }));
  }
  static isValidKey(key) {
    return [
      "id",
      "date",
      "time",
      "space",
      "workScope",
      "issuedTo",
      "duration",
      "lotoNum",
      "hotWorkNum",
      "ventilation",
      "blankFlanged",
      "meterModel",
      "meterNum",
      "calibrated",
      "hazards",
      "isVerified",
      "name",
      "objectType",
      "ppe",
      "precautions"
    ].includes(key);
  }
  static toFormFields(dto, spaceOptions, fields = [
    "date",
    "time",
    "space",
    "workScope",
    "issuedTo",
    "duration",
    "meterModel",
    "meterNum",
    "calibrated",
    ...Object.keys(_ConfinedSpaceDto.getHazardFields(null)),
    ...Object.keys(_ConfinedSpaceDto.getPpeFields(null)),
    ...Object.keys(_ConfinedSpaceDto.getPrecautionFields(null))
  ]) {
    const hazardFields = _ConfinedSpaceDto.getHazardFields(dto.hazards);
    const ppeFields = _ConfinedSpaceDto.getPpeFields(dto.ppe);
    const precautionFields = _ConfinedSpaceDto.getPrecautionFields(dto.precautions);
    const allFields = __spreadValues(__spreadValues(__spreadValues({
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      date: {
        name: "date",
        label: "Date",
        type: "date",
        validators: [Validators.required],
        initialValue: dto.date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      time: {
        name: "time",
        label: "Time",
        type: "time",
        validators: [Validators.required],
        initialValue: dto.time ?? (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5)
      },
      space: {
        name: "space",
        label: "Confined Space",
        type: "text",
        options: spaceOptions,
        validators: [Validators.required],
        initialValue: dto.space
      },
      workScope: {
        name: "workScope",
        label: "Work Scope",
        type: "textarea",
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      issuedTo: {
        name: "issuedTo",
        label: "Issued To",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.issuedTo
      },
      duration: {
        name: "duration",
        label: "Duration",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.duration
      },
      meterModel: {
        name: "meterModel",
        label: "Meter Model",
        type: "text",
        initialValue: dto.meterModel
      },
      meterNum: {
        name: "meterNum",
        label: "Meter Number",
        type: "text",
        initialValue: dto.meterNum
      },
      calibrated: {
        name: "calibrated",
        label: "Calibrated",
        type: "checkbox",
        initialValue: dto.calibrated
      },
      oxygen: { name: "oxygen", label: "Oxygen", type: "text", initialValue: dto.oxygen },
      lel: { name: "lel", label: "LEL", type: "text", initialValue: dto.lel },
      hydrogenSulfide: { name: "hydrogenSulfide", label: "H2S", type: "text", initialValue: dto.hydrogenSulfide },
      carbonMonoxide: { name: "carbonMonoxide", label: "CO", type: "text", initialValue: dto.carbonMonoxide },
      ammonia: { name: "ammonia", label: "Ammonia", type: "text", initialValue: dto.ammonia },
      timeOfSample: { name: "timeOfSample", label: "Time of Sample", type: "time", initialValue: dto.timeOfSample },
      testerInitials: { name: "testerInitials", label: "Tester Initials", type: "text", initialValue: dto.testerInitials }
    }, hazardFields), ppeFields), precautionFields);
    return fields.map((fieldName) => allFields[fieldName]);
  }
  static toTableColumns(fields = ["date", "time", "space", "workScope", "issuedTo", "duration"]) {
    const allColumns = {
      id: { id: "id", header: "ID", accessorKey: "id" },
      date: { id: "date", header: "Date", accessorKey: "date" },
      time: { id: "time", header: "Time", accessorKey: "time" },
      space: { id: "space", header: "Confined Space", accessorKey: "space" },
      workScope: { id: "workScope", header: "Work Scope", accessorKey: "workScope" },
      issuedTo: { id: "issuedTo", header: "Issued To", accessorKey: "issuedTo" },
      duration: { id: "duration", header: "Duration", accessorKey: "duration" },
      lotoNum: { id: "lotoNum", header: "LOTO Number", accessorKey: "lotoNum" },
      hotWorkNum: { id: "hotWorkNum", header: "Hot Work Number", accessorKey: "hotWorkNum" },
      ventilation: {
        id: "ventilation",
        header: "Ventilation",
        accessorFn: (item) => item.ventilation ? "Yes" : "No"
      },
      blankFlanged: {
        id: "blankFlanged",
        header: "Blank Flanged",
        accessorFn: (item) => item.blankFlanged ? "Yes" : "No"
      },
      meterModel: { id: "meterModel", header: "Meter Model", accessorKey: "meterModel" },
      meterNum: { id: "meterNum", header: "Meter Number", accessorKey: "meterNum" },
      calibrated: {
        id: "calibrated",
        header: "Calibrated",
        accessorFn: (item) => item.calibrated ? "Yes" : "No"
      },
      oxygen: { id: "oxygen", header: "Oxygen", accessorKey: "oxygen" },
      lel: { id: "lel", header: "LEL", accessorKey: "lel" },
      hydrogenSulfide: { id: "hydrogenSulfide", header: "H2S", accessorKey: "hydrogenSulfide" },
      carbonMonoxide: { id: "carbonMonoxide", header: "CO", accessorKey: "carbonMonoxide" },
      ammonia: { id: "ammonia", header: "Ammonia", accessorKey: "ammonia" },
      timeOfSample: { id: "timeOfSample", header: "Time of Sample", accessorKey: "timeOfSample" },
      testerInitials: { id: "testerInitials", header: "Tester Initials", accessorKey: "testerInitials" },
      hazards: {
        id: "hazards",
        header: "Hazards",
        accessorFn: (item) => {
          if (!item.hazards)
            return "None";
          const activeHazards = Object.entries(item.hazards).filter(([_, value]) => value).map(([key, _]) => key.replace(/([A-Z])/g, " $1").trim());
          return activeHazards.length > 0 ? activeHazards.join(", ") : "None";
        }
      },
      ppe: {
        id: "ppe",
        header: "PPE",
        accessorFn: (item) => {
          if (!item.ppe)
            return "None";
          const activePpe = Object.entries(item.ppe).filter(([_, value]) => value).map(([key, _]) => _ConfinedSpaceDto.formatLabel(key));
          return activePpe.length > 0 ? activePpe.join(", ") : "None";
        }
      },
      precautions: {
        id: "precautions",
        header: "Precautions",
        accessorFn: (item) => {
          if (!item.precautions)
            return "None";
          const activePrecautions = Object.entries(item.precautions).filter(([_, value]) => value).map(([key, _]) => _ConfinedSpaceDto.formatLabel(key));
          return activePrecautions.length > 0 ? activePrecautions.join(", ") : "None";
        }
      },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      objectType: { id: "objectType", header: "Object Type", accessorKey: "objectType" },
      permitStatus: {
        id: "permitStatus",
        header: "Status",
        accessorFn: (item) => item.permitStatus?.name || ""
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static generatePermitFromRequest(request) {
    return new _ConfinedSpaceDto({
      date: request.dateOfWorkToBePerformed?.split("T")[0],
      issuedTo: request.requestedBy,
      space: request.space,
      workScope: request.workScope
    });
  }
  static formatLabel(key) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  static getHazardOptions(hazards) {
    if (!hazards)
      return [];
    const hazardKeys = Object.keys(hazards);
    return hazardKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'highTemp' -> 'High Temp'
        key,
        value: hazards[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPpeOptions(ppe) {
    if (!ppe)
      return [];
    const ppeKeys = Object.keys(ppe);
    return ppeKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        // 'safetyGlasses' -> 'Safety Glasses'
        key,
        value: ppe[key]
        // The boolean value (true/false)
      };
    });
  }
  static getPrecautionOptions(precautions) {
    if (!precautions)
      return [];
    const precautionKeys = Object.keys(precautions);
    return precautionKeys.map((key) => {
      return {
        label: this.formatLabel(key),
        key,
        value: precautions[key]
      };
    });
  }
  static getHazardFields(hazardsDto) {
    const hazards = hazardsDto || new ConfinedSpaceHazards();
    const group = { label: "Hazards", orientation: "horizontal" };
    return {
      "hazards.oxygenDeficiency": {
        name: "hazards.oxygenDeficiency",
        label: "Oxygen Deficiency",
        type: "checkbox",
        initialValue: hazards.oxygenDeficiency,
        group
      },
      "hazards.flammableGas": { name: "hazards.flammableGas", label: "Flammable Gas", type: "checkbox", initialValue: hazards.flammableGas, group },
      "hazards.combustibleDust": { name: "hazards.combustibleDust", label: "Combustible Dust", type: "checkbox", initialValue: hazards.combustibleDust, group },
      "hazards.toxicGas": { name: "hazards.toxicGas", label: "Toxic Gas", type: "checkbox", initialValue: hazards.toxicGas, group },
      "hazards.rotatingEquipment": { name: "hazards.rotatingEquipment", label: "Rotating Equipment", type: "checkbox", initialValue: hazards.rotatingEquipment, group },
      "hazards.electricalShock": { name: "hazards.electricalShock", label: "Electrical Shock", type: "checkbox", initialValue: hazards.electricalShock, group },
      "hazards.entrapment": { name: "hazards.entrapment", label: "Entrapment", type: "checkbox", initialValue: hazards.entrapment, group },
      "hazards.engulfment": { name: "hazards.engulfment", label: "Engulfment", type: "checkbox", initialValue: hazards.engulfment, group },
      "hazards.heatStress": { name: "hazards.heatStress", label: "Heat Stress", type: "checkbox", initialValue: hazards.heatStress, group },
      "hazards.other": { name: "hazards.other", label: "Other", type: "checkbox", initialValue: hazards.other, group },
      "hazards.otherDescription": { name: "hazards.otherDescription", label: "Other Description", type: "text", initialValue: hazards.otherDescription, group }
    };
  }
  static getPpeFields(ppeDto) {
    const ppe = ppeDto || new ConfinedSpacePpe();
    const group = { label: "PPE", orientation: "horizontal" };
    return {
      "ppe.faceShield": { name: "ppe.faceShield", label: "Face Shield", type: "checkbox", initialValue: ppe.faceShield, group },
      "ppe.fcfi": { name: "ppe.fcfi", label: "FCFI", type: "checkbox", initialValue: ppe.fcfi, group },
      "ppe.lovVoltageTools": { name: "ppe.lovVoltageTools", label: "Low Voltage Tools", type: "checkbox", initialValue: ppe.lovVoltageTools, group },
      "ppe.explosionProofTools": { name: "ppe.explosionProofTools", label: "Explosion Proof Tools", type: "checkbox", initialValue: ppe.explosionProofTools, group },
      "ppe.nonSparkingTools": { name: "ppe.nonSparkingTools", label: "Non-Sparking Tools", type: "checkbox", initialValue: ppe.nonSparkingTools, group },
      "ppe.fallProtection": { name: "ppe.fallProtection", label: "Fall Protection", type: "checkbox", initialValue: ppe.fallProtection, group },
      "ppe.retrievalSystem": { name: "ppe.retrievalSystem", label: "Retrieval System", type: "checkbox", initialValue: ppe.retrievalSystem, group },
      "ppe.lifeline": { name: "ppe.lifeline", label: "Lifeline", type: "checkbox", initialValue: ppe.lifeline, group },
      "ppe.personalAtmosphericMeter": { name: "ppe.personalAtmosphericMeter", label: "Personal Atmospheric Meter", type: "checkbox", initialValue: ppe.personalAtmosphericMeter, group },
      "ppe.tripod": { name: "ppe.tripod", label: "Tripod", type: "checkbox", initialValue: ppe.tripod, group },
      "ppe.other": { name: "ppe.other", label: "Other", type: "checkbox", initialValue: ppe.other, group },
      "ppe.otherDescription": { name: "ppe.otherDescription", label: "Other Description", type: "text", initialValue: ppe.otherDescription, group }
    };
  }
  static getPrecautionFields(precautionsDto) {
    const precautions = precautionsDto || new ConfinedSpacePrecautions();
    const group = { label: "Precautions", orientation: "horizontal" };
    return {
      "precautions.ventilation": { name: "precautions.ventilation", label: "Ventilation", type: "checkbox", initialValue: precautions.ventilation, group },
      "precautions.blankFlanged": { name: "precautions.blankFlanged", label: "Blank/Flanged", type: "checkbox", initialValue: precautions.blankFlanged, group },
      "precautions.doubleBlockAndBleed": { name: "precautions.doubleBlockAndBleed", label: "Double Block and Bleed", type: "checkbox", initialValue: precautions.doubleBlockAndBleed, group },
      "precautions.barriers": { name: "precautions.barriers", label: "Barriers", type: "checkbox", initialValue: precautions.barriers, group },
      "precautions.other": { name: "precautions.other", label: "Other", type: "checkbox", initialValue: precautions.other, group },
      "precautions.otherDescription": { name: "precautions.otherDescription", label: "Other Description", type: "text", initialValue: precautions.otherDescription, group },
      "precautions.lockOutTagOut": { name: "precautions.lockOutTagOut", label: "Lock Out/Tag Out", type: "text", initialValue: precautions.lockOutTagOut, group },
      "precautions.hotWorkPermit": { name: "precautions.hotWorkPermit", label: "Hot Work Permit", type: "text", initialValue: precautions.hotWorkPermit, group }
    };
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
  SafeWorkDto,
  HotWorkDto,
  ConfinedSpaceDto,
  InvisibleInputFieldComponent,
  RadioCheckboxesComponent,
  InvisibleSearchableSelectComponent,
  CheckboxXComponent,
  InvisibleSearchableMultiSelectComponent,
  NestedFormInputComponent,
  JobStep,
  JhaDto
};
//# sourceMappingURL=chunk-5RTLZHJG.js.map
