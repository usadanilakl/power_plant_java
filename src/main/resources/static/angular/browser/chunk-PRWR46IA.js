import {
  BaseDto,
  Validators
} from "./chunk-HH6S5SLA.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-TXDUYLVM.js";

// src/app/models/category.model.ts
var CategoryDto = class _CategoryDto {
  id;
  name;
  alias;
  constructor(data = {}) {
    this.id = data.id || 0;
    this.name = data.name || "";
    this.alias = data.alias || "";
  }
  // Serialization method
  toJson() {
    return {
      id: this.id,
      name: this.name,
      alias: this.alias
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    return new _CategoryDto({
      id: json.id,
      name: json.name,
      alias: json.alias
    });
  }
};

// src/app/models/value.model.ts
var ValueDto = class _ValueDto {
  id;
  name;
  alias;
  category;
  constructor(data = {}) {
    this.id = data.id || 0;
    this.name = data.name || "";
    this.alias = data.alias || "";
    this.category = data.category || new CategoryDto({ id: 0, name: "", alias: "" });
  }
  toOption() {
    return { value: this.id, label: this.name };
  }
  // Serialization method
  toJson() {
    return {
      id: this.id,
      name: this.name,
      category: this.category
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json)
      return new _ValueDto();
    return new _ValueDto({
      id: json.id ?? 0,
      // Use nullish coalescing to provide a default value
      name: json.name || "",
      category: json.category ? CategoryDto.fromJson(json.category) : new CategoryDto()
    });
  }
};

// src/app/models/user.model.ts
var UserDto = class _UserDto {
  id;
  name;
  username;
  firstName;
  lastName;
  email;
  role;
  isActive;
  windowsUsername;
  permissionLevel;
  constructor(data = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? "";
    this.username = data.username ?? "";
    this.firstName = data.firstName ?? "";
    this.lastName = data.lastName ?? "";
    this.email = data.email ?? "";
    this.role = data.role ?? "";
    this.isActive = data.isActive ?? true;
    this.windowsUsername = data.windowsUsername ?? "";
    this.permissionLevel = data.permissionLevel ?? "";
  }
  toJson() {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      windowsUsername: this.windowsUsername,
      permissionLevel: this.permissionLevel
    };
  }
  static fromJson(json) {
    if (!json)
      return new _UserDto();
    return new _UserDto({
      id: json.id ?? 0,
      name: json.name ?? "",
      username: json.username ?? "",
      firstName: json.firstName ?? "",
      lastName: json.lastName ?? "",
      email: json.email ?? "",
      role: json.role ?? "",
      isActive: json.isActive ?? true,
      windowsUsername: json.windowsUsername ?? "",
      permissionLevel: json.permissionLevel ?? ""
    });
  }
};

// src/app/models/base/base-permit-id.model.ts
var BasePermitIdDto = class _BasePermitIdDto extends BaseDto {
  workScope;
  system;
  equipment;
  requestor;
  controlAuthority;
  permitType;
  docNum;
  permitStatus;
  temp;
  constructor(data = {}) {
    super(data);
    this.workScope = data.workScope || "";
    this.system = data.system || 0;
    this.equipment = data.equipment || [];
    this.requestor = data.requestor || 0;
    this.controlAuthority = data.controlAuthority || 0;
    this.permitType = data.permitType || 0;
    this.docNum = data.docNum || 0;
    this.permitStatus = data.permitStatus || 0;
    this.temp = data.temp || false;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      workScope: this.workScope,
      system: this.system,
      equipment: this.equipment,
      requestor: this.requestor,
      controlAuthority: this.controlAuthority,
      permitType: this.permitType,
      docNum: this.docNum,
      permitStatus: this.permitStatus,
      temp: this.temp
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in BasePermitIdDto.fromJson");
      return new _BasePermitIdDto();
    }
    return new _BasePermitIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      workScope: json.workScope || "",
      system: json.system || 0,
      equipment: json.equipment || [],
      requestor: json.requestor || 0,
      controlAuthority: json.controlAuthority || 0,
      permitType: json.permitType || 0,
      docNum: json.docNum || 0,
      permitStatus: json.permitStatus || 0,
      temp: json.temp || false
    }));
  }
};

// src/app/models/base/base-permit.model.ts
var BasePermitDto = class _BasePermitDto extends BaseDto {
  workScope;
  system;
  equipment;
  requestor;
  controlAuthority;
  permitType;
  docNum;
  permitStatus;
  temp;
  constructor(data = {}) {
    super(data);
    this.workScope = data.workScope || "";
    this.system = data.system || new ValueDto();
    this.equipment = data.equipment || [];
    this.requestor = data.requestor || new UserDto();
    this.controlAuthority = data.controlAuthority || new UserDto();
    this.permitType = data.permitType || new ValueDto();
    this.docNum = data.docNum || 0;
    this.permitStatus = data.permitStatus || new ValueDto();
    this.temp = data.temp || false;
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      workScope: this.workScope ?? "",
      system: this.system?.toJson() ?? null,
      equipment: this.equipment?.map((eq) => eq?.toJson() ?? null).filter(Boolean) ?? [],
      requestor: new UserDto(this.requestor)?.toJson() ?? null,
      controlAuthority: new UserDto(this.controlAuthority)?.toJson() ?? null,
      permitType: this.permitType?.toJson() ?? null,
      docNum: this.docNum ?? 0,
      permitStatus: new ValueDto(this.permitStatus)?.toJson() ?? null,
      temp: this.temp ?? false
    });
  }
  // Override fromJson method
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in BasePermitDto.fromJson");
      return new _BasePermitDto();
    }
    return new _BasePermitDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      workScope: json.workScope || "",
      system: ValueDto.fromJson(json.system),
      equipment: (json.equipment || []).map((eq) => EquipmentDto.fromJson(eq)),
      requestor: UserDto.fromJson(json.requestor),
      controlAuthority: UserDto.fromJson(json.controlAuthority),
      permitType: ValueDto.fromJson(json.permitType),
      docNum: json.docNum || 0,
      permitStatus: ValueDto.fromJson(json.permitStatus),
      temp: json.temp || false
    }));
  }
  toIdModel() {
    return new BasePermitIdDto(__spreadProps(__spreadValues({}, this.toJson()), {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      system: this.system.id,
      equipment: this.equipment.map((eq) => eq.id),
      requestor: this.requestor.id,
      controlAuthority: this.controlAuthority.id,
      permitType: this.permitType.id,
      permitStatus: this.permitStatus.id
    }));
  }
};

// src/app/models/loto/lock.model.ts
var LockDto = class _LockDto extends BaseDto {
  number;
  loto;
  lotoAccessoryStatus;
  constructor(data = {}) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = data.loto ?? new LotoDto();
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ?? new ValueDto();
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      number: this.number,
      loto: this.loto.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson()
    });
  }
  // Override fromJson method
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LockDto.fromJson");
      return new _LockDto();
    }
    return new _LockDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      number: json.number ?? 0,
      loto: LotoDto.fromJson(json.loto),
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus)
    }));
  }
};

// src/app/models/loto/loto-box.model.ts
var LotoBoxDto = class _LotoBoxDto extends BasePermitDto {
  number;
  loto;
  lotoAccessoryStatus;
  ledStripId;
  rangeStart;
  rangeEnd;
  description;
  // LED status fields
  r;
  g;
  b;
  brightness;
  strip;
  manualOverride;
  constructor(data = {}, isNested = false) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = isNested ? null : data.loto ? new LotoDto(__spreadProps(__spreadValues({}, data.loto), { lotoBox: null })) : null;
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ? new ValueDto(data.lotoAccessoryStatus) : new ValueDto();
    this.ledStripId = data.ledStripId ?? null;
    this.rangeStart = data.rangeStart ?? null;
    this.rangeEnd = data.rangeEnd ?? null;
    this.description = data.description ?? "";
    this.r = data.r;
    this.g = data.g;
    this.b = data.b;
    this.brightness = data.brightness;
    this.strip = data.strip;
    this.manualOverride = data.manualOverride ?? false;
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      number: this.number,
      loto: this.loto?.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson(),
      ledStripId: this.ledStripId,
      rangeStart: this.rangeStart,
      rangeEnd: this.rangeEnd,
      description: this.description
    });
  }
  // Override fromJson method
  static fromJson(json, isNested = false) {
    if (!json) {
      console.warn("Received null or undefined json in LotoBoxDto.fromJson");
      return new _LotoBoxDto();
    }
    return new _LotoBoxDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      number: json.number,
      loto: isNested ? null : json.loto ? LotoDto.fromJson(__spreadProps(__spreadValues({}, json.loto), { lotoBox: null })) : null,
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus),
      ledStripId: json.ledStripId,
      rangeStart: json.rangeStart,
      rangeEnd: json.rangeEnd,
      description: json.description,
      r: json.r,
      g: json.g,
      b: json.b,
      brightness: json.brightness,
      strip: json.strip,
      manualOverride: json.manualOverride
    }), isNested);
  }
};

// src/app/models/loto/loto-id.model.ts
var LotoIdDto = class _LotoIdDto extends BasePermitIdDto {
  lotoPoints;
  locks;
  lotoBox;
  boxNumber;
  equipmentSystem;
  lotoRequestor;
  date;
  constructor(data = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints || [];
    this.locks = data.locks || [];
    this.lotoBox = data.lotoBox || null;
    this.boxNumber = data.boxNumber || null;
    this.equipmentSystem = data.equipmentSystem || "";
    this.lotoRequestor = data.lotoRequestor || "";
    this.date = data.date || "";
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      lotoPoints: this.lotoPoints,
      locks: this.locks,
      lotoBox: this.lotoBox,
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoIdDto.fromJson");
      return new _LotoIdDto();
    }
    return new _LotoIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      lotoPoints: json.lotoPoints || [],
      locks: json.locks || [],
      lotoBox: json.lotoBox || null,
      boxNumber: json.boxNumber || null,
      equipmentSystem: json.equipmentSystem || "",
      lotoRequestor: json.lotoRequestor || "",
      date: json.date || ""
    }));
  }
};

// src/app/models/loto/loto.model.ts
var LotoDto = class _LotoDto extends BasePermitDto {
  lotoPoints;
  locks;
  lotoBox;
  boxNumber;
  equipmentSystem;
  lotoRequestor;
  date;
  constructor(data = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints?.map((point) => new LotoPointDto(point)) ?? [];
    this.locks = data.locks?.map((lock) => new LockDto(lock)) ?? [];
    this.lotoBox = data.lotoBox ? new LotoBoxDto(data.lotoBox, true) : null;
    this.boxNumber = data.boxNumber || null;
    this.equipmentSystem = data.equipmentSystem || "";
    this.lotoRequestor = data.lotoRequestor || "";
    this.date = data.date || "";
  }
  // Override toJson method
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      lotoPoints: this.lotoPoints.map((point) => point.toJson()),
      locks: this.locks.map((lock) => lock.toJson()),
      lotoBox: this.lotoBox?.toJson(),
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    });
  }
  // Override fromJson method
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoDto.fromJson");
      return new _LotoDto();
    }
    return new _LotoDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      lotoPoints: json.lotoPoints?.map((pointJson) => LotoPointDto.fromJson(pointJson)) || null,
      locks: (json.locks ?? []).map((lock) => LockDto.fromJson(lock)),
      lotoBox: json.lotoBox ? LotoBoxDto.fromJson(json.lotoBox, true) : null,
      boxNumber: json.boxNumber,
      equipmentSystem: json.equipmentSystem,
      lotoRequestor: json.lotoRequestor,
      date: json.date
    }));
  }
  toIdModel() {
    const baseIdModel = super.toIdModel();
    return new LotoIdDto(__spreadProps(__spreadValues({}, baseIdModel), {
      lotoPoints: this.lotoPoints.map((point) => point.id),
      locks: this.locks.map((lock) => lock.id),
      lotoBox: this.lotoBox ? this.lotoBox.id : null,
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    }));
  }
  static toTableColumns() {
    return [
      { id: "id", header: "ID", accessorKey: "id" },
      { id: "name", header: "LOTO Number", accessorKey: "name" },
      { id: "equipmentSystem", header: "Equipment/System", accessorKey: "equipmentSystem" },
      { id: "lotoRequestor", header: "Requestor", accessorKey: "lotoRequestor" },
      { id: "date", header: "Date", accessorKey: "date" },
      { id: "boxNumber", header: "Box #", accessorKey: "boxNumber" }
    ];
  }
  static toFormFields(dto) {
    const fields = [
      {
        name: "equipmentSystem",
        label: "Equipment System",
        type: "text",
        initialValue: dto.equipmentSystem,
        validators: [Validators.required]
      },
      {
        name: "lotoRequestor",
        label: "LOTO Requestor",
        type: "text",
        initialValue: dto.lotoRequestor,
        validators: [Validators.required]
      },
      {
        name: "date",
        label: "Date",
        type: "date",
        initialValue: dto.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        validators: [Validators.required]
      },
      {
        name: "boxNumber",
        label: "Box Number",
        type: "number",
        initialValue: dto.boxNumber?.toString() || ""
      },
      {
        name: "lotoBox",
        label: "LOTO Box",
        type: "select",
        initialValue: dto.lotoBox?.id,
        options: dto.lotoBox ? [{ value: dto.lotoBox.id, label: `Box #${dto.lotoBox.number}` }] : []
      },
      {
        name: "isVerified",
        label: "Is Verified",
        type: "select",
        initialValue: (dto.isVerified ?? false).toString(),
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ]
      },
      {
        name: "locks",
        label: "Locks",
        type: "multi-select",
        initialValue: (dto.locks ?? []).map((l) => l.id),
        options: (dto.locks ?? []).map((l) => ({ value: l.id, label: `Lock #${l.number}` }))
      },
      {
        name: "lotoPoints",
        label: "Tags and Locks",
        type: "form-array",
        initialValue: dto.lotoPoints ?? [],
        fields: [
          { name: "tagNumber", label: "Tag #", type: "text" },
          { name: "description", label: "EID to be Tagged/Locked", type: "text" },
          { name: "specificLocation", label: "Location", type: "text" },
          { name: "isoPos", label: "LOTO Position", type: "text" },
          { name: "normPos", label: "Released Position", type: "text" },
          { name: "hungBy", label: "Hung By", type: "text" },
          { name: "verifiedBy", label: "Verified By", type: "text" },
          { name: "zeroEnergyMethod", label: "Zero Energy Verification", type: "textarea" }
        ]
      }
    ];
    return fields;
  }
};

// src/app/models/loto/loto-point-id.model.ts
var LotoPointIdDto = class _LotoPointIdDto extends BaseDto {
  unit;
  tagged;
  tagNumber;
  description;
  isoPos;
  normPos;
  isoPosId;
  normPosId;
  specificLocation;
  standard;
  generalLocation;
  equipmentIdList;
  normalPosition;
  isolatedPosition;
  characteristicsJson;
  equipmentList;
  oldId;
  isUpdated;
  fileIds;
  conflictStatus;
  lotos;
  lotoIds;
  zeroEnergyMethod;
  zeroEnergy;
  location;
  eqType;
  counterpartId;
  isLabeled;
  isLockable;
  isProcessed;
  processingStatus;
  constructor(data = {}) {
    super(data);
    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.isoPos = data.isoPos ?? null;
    this.normPos = data.normPos ?? null;
    this.isoPosId = data.isoPosId ?? null;
    this.normPosId = data.normPosId ?? null;
    this.specificLocation = data.specificLocation ?? null;
    this.standard = data.standard ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.normalPosition = data.normalPosition ?? null;
    this.isolatedPosition = data.isolatedPosition ?? null;
    this.characteristicsJson = data.characteristicsJson ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.oldId = data.oldId ?? null;
    this.isUpdated = data.isUpdated ?? null;
    this.fileIds = data.fileIds ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.lotos = data.lotos ?? null;
    this.lotoIds = data.lotoIds ?? null;
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;
    this.zeroEnergy = data.zeroEnergy ?? null;
    this.location = data.location ?? null;
    this.eqType = data.eqType ?? null;
    this.counterpartId = data.counterpartId ?? null;
    this.isLabeled = data.isLabeled ?? null;
    this.isLockable = data.isLockable ?? null;
    this.isProcessed = data.isProcessed ?? null;
    this.processingStatus = data.processingStatus ?? null;
  }
  // export class LotoPointIdDto extends BaseDto {
  //   unit: string;
  //   tagged: string;
  //   tagNumber: string;
  //   description: string;
  //   isoPos: number | null;
  //   normPosId: number | null;
  //   specificLocation: string;
  //   standard: string;
  //   generalLocation: string;
  //   equipmentIdList: number[];
  //   normalPosition: string;
  //   isolatedPosition: string;
  //   oldId: string;
  //   isUpdated: number;
  //   fileIds: string;
  //   conflictStatus: string;
  //   lotoIds: number[];
  //   constructor(data: Partial<LotoPointIdDto> = {}) {
  //     super(data);
  //     this.unit = data.unit || '';
  //     this.tagged = data.tagged || '';
  //     this.tagNumber = data.tagNumber || '';
  //     this.description = data.description || '';
  //     this.isoPos = data.isoPos || null;
  //     this.normPosId = data.normPosId || null;
  //     this.specificLocation = data.specificLocation || '';
  //     this.standard = data.standard || '';
  //     this.generalLocation = data.generalLocation || '';
  //     this.equipmentIdList = data.equipmentIdList || [];
  //     this.normalPosition = data.normalPosition || '';
  //     this.isolatedPosition = data.isolatedPosition || '';
  //     this.oldId = data.oldId || '';
  //     this.objectType = data.objectType || '';
  //     this.isUpdated = data.isUpdated || 0;
  //     this.fileIds = data.fileIds || '';
  //     this.conflictStatus = data.conflictStatus || '';
  //     this.lotoIds = data.lotoIds || [];
  //   }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      unit: this.unit,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos,
      normPos: this.normPos,
      isoPosId: this.isoPosId,
      normPosId: this.normPosId,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: this.equipmentIdList,
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      characteristicsJson: this.characteristicsJson,
      equipmentList: this.equipmentList,
      oldId: this.oldId,
      isUpdated: this.isUpdated,
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotos: this.lotos,
      lotoIds: this.lotoIds,
      zeroEnergyMethod: this.zeroEnergyMethod,
      zeroEnergy: this.zeroEnergy,
      location: this.location,
      eqType: this.eqType,
      counterpartId: this.counterpartId,
      isLabeled: this.isLabeled,
      isLockable: this.isLockable,
      isProcessed: this.isProcessed,
      processingStatus: this.processingStatus
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoPointIdDto.fromJson");
      return new _LotoPointIdDto();
    }
    return new _LotoPointIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      unit: json.unit,
      tagged: json.tagged,
      tagNumber: json.tagNumber,
      description: json.description,
      isoPos: json.isoPos,
      normPos: json.normPos,
      isoPosId: json.isoPosId,
      normPosId: json.normPosId,
      specificLocation: json.specificLocation,
      standard: json.standard,
      generalLocation: json.generalLocation,
      equipmentIdList: json.equipmentIdList || [],
      normalPosition: json.normalPosition,
      isolatedPosition: json.isolatedPosition,
      characteristicsJson: json.characteristicsJson || null,
      equipmentList: json.equipmentList || [],
      oldId: json.oldId,
      isUpdated: json.isUpdated,
      fileIds: json.fileIds || "",
      conflictStatus: json.conflictStatus,
      lotos: json.lotos || [],
      lotoIds: json.lotoIds || [],
      zeroEnergyMethod: json.zeroEnergyMethod,
      zeroEnergy: json.zeroEnergy,
      location: json.location,
      eqType: json.eqType,
      counterpartId: json.counterpartId,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      processingStatus: json.processingStatus ?? null
    }));
  }
};

// src/app/models/loto/zero-energy.model.ts
var ZeroEnergyDto = class extends BaseDto {
  method = "";
  zeroEnergyTemplate = new ValueDto();
  templateEquipment = [];
  templateEquipmentIds = [];
  constructor(data = {}) {
    super(data);
    this.method = data.method ?? "";
    this.zeroEnergyTemplate = this.toValueDto(data.zeroEnergyTemplate);
    this.templateEquipment = this.toEquipmentDtos(data.templateEquipment);
    this.templateEquipmentIds = data.templateEquipmentIds ?? [];
  }
  toValueDto(data) {
    if (data instanceof ValueDto)
      return data;
    if (typeof data === "number")
      return new ValueDto({ id: data });
    return data instanceof ValueDto ? data : new ValueDto(data ?? {});
  }
  toEquipmentDtos(data) {
    return Array.isArray(data) ? data.map((item) => item instanceof EquipmentDto ? item : new EquipmentDto(item)) : [];
  }
};

// src/app/models/loto/loto-point.model.ts
var LotoPointDto = class _LotoPointDto extends BaseDto {
  unit;
  tagged;
  tagNumber;
  description;
  isoPos;
  normPos;
  specificLocation;
  standard;
  generalLocation;
  equipmentIdList;
  normalPosition;
  isolatedPosition;
  fluid;
  characteristicsJson;
  equipmentList;
  oldId;
  isUpdated;
  fileIds;
  conflictStatus;
  lotos;
  zeroEnergyMethod;
  zeroEnergy;
  relatedLotoPointIds;
  location;
  eqType;
  counterpartId;
  isLabeled;
  isLockable;
  isProcessed;
  processingStatus;
  constructor(data = {}) {
    super(data);
    this.unit = data.unit ?? null;
    this.tagged = data.tagged ?? null;
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.isoPos = super.setNestedObjectById(data.isoPos, new ValueDto());
    this.normPos = super.setNestedObjectById(data.normPos, new ValueDto());
    this.specificLocation = data.specificLocation ?? null;
    this.standard = data.standard ?? null;
    this.generalLocation = data.generalLocation ?? null;
    this.equipmentIdList = data.equipmentIdList ?? null;
    this.normalPosition = data.normalPosition ?? null;
    this.isolatedPosition = data.isolatedPosition ?? null;
    this.fluid = data.fluid ?? null;
    this.characteristicsJson = data.characteristicsJson ?? null;
    this.equipmentList = data.equipmentList ?? null;
    this.oldId = data.oldId ?? null;
    this.isUpdated = data.isUpdated ?? null;
    this.fileIds = data.fileIds ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.lotos = data.lotos ?? null;
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? null;
    if (data.zeroEnergy) {
      this.zeroEnergy = new ZeroEnergyDto(data.zeroEnergy);
    } else {
      this.zeroEnergy = null;
    }
    this.relatedLotoPointIds = data.relatedLotoPointIds ?? null;
    this.location = super.setNestedObjectById(data.location, new ValueDto());
    this.eqType = super.setNestedObjectById(data.eqType, new ValueDto());
    this.counterpartId = data.counterpartId ?? null;
    this.isLabeled = data.isLabeled ?? null;
    this.isLockable = data.isLockable ?? null;
    this.isProcessed = data.isProcessed ?? null;
    this.processingStatus = super.setNestedObjectById(data.processingStatus, new ValueDto());
  }
  // Serialization method
  toJson() {
    return {
      id: this.id || 0,
      unit: this.unit || "",
      isVerified: this.isVerified || false,
      tagged: this.tagged || "",
      tagNumber: this.tagNumber || "",
      description: this.description || "",
      isoPos: this.isoPos?.toJson() || null,
      normPos: this.normPos?.toJson() || null,
      specificLocation: this.specificLocation || "",
      standard: this.standard || "",
      generalLocation: this.generalLocation || "",
      equipmentIdList: this.equipmentIdList || [],
      normalPosition: this.normalPosition || "",
      isolatedPosition: this.isolatedPosition || "",
      fluid: this.fluid || "",
      characteristicsJson: this.characteristicsJson || null,
      equipmentList: this.equipmentList ? Array.from(this.equipmentList).filter((equipment) => equipment != null).map((equipment) => equipment.toJson()) : [],
      oldId: this.oldId || "",
      objectType: this.objectType || "",
      isUpdated: this.isUpdated || 0,
      fileIds: this.fileIds || "",
      conflictStatus: this.conflictStatus || "",
      lotos: this.lotos?.map((loto) => loto.toJson()),
      zeroEnergyMethod: this.zeroEnergyMethod || null,
      zeroEnergy: this.zeroEnergy || null,
      relatedLotoPointIds: this.relatedLotoPointIds || [],
      location: this.location?.toJson() || null,
      eqType: this.eqType?.toJson() || null,
      counterpartId: this.counterpartId || null,
      isLabeled: this.isLabeled ?? false,
      isLockable: this.isLockable ?? false,
      isProcessed: this.isProcessed ?? false,
      processingStatus: this.processingStatus?.toJson() || null
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in LotoPointDto.fromJson");
      return new _LotoPointDto();
    }
    return new _LotoPointDto({
      id: json.id || 0,
      unit: json.unit || "",
      isVerified: json.isVerified || false,
      tagged: json.tagged || "",
      tagNumber: json.tagNumber || "",
      description: json.description || "",
      isoPos: json.isoPos ? ValueDto.fromJson(json.isoPos) : new ValueDto(),
      normPos: json.normPos ? ValueDto.fromJson(json.normPos) : new ValueDto(),
      specificLocation: json.specificLocation || "",
      standard: json.standard || "",
      generalLocation: json.generalLocation || "",
      equipmentIdList: Array.isArray(json.equipmentIdList) ? json.equipmentIdList : [],
      normalPosition: json.normalPosition || "",
      isolatedPosition: json.isolatedPosition || "",
      fluid: json.fluid || "",
      characteristicsJson: json.characteristicsJson || null,
      equipmentList: json.equipmentList ? json.equipmentList.filter((equipment) => equipment != null).map((equipment) => {
        try {
          return EquipmentDto.fromJson(equipment);
        } catch (error) {
          console.warn("Error parsing EquipmentDto:", error);
          return null;
        }
      }).filter((equipment) => equipment !== null) : [],
      oldId: json.oldId || "",
      objectType: json.objectType || "",
      isUpdated: json.isUpdated || 0,
      fileIds: json.fileIds || "",
      conflictStatus: json.conflictStatus || "",
      lotos: Array.isArray(json.lotos) ? json.lotos.map((lotoJson) => LotoDto.fromJson(lotoJson)) : [],
      zeroEnergyMethod: json.zeroEnergyMethod || null,
      zeroEnergy: json.zeroEnergy ? {
        id: json.zeroEnergy.id || 0,
        name: json.zeroEnergy.name || "",
        objectType: json.zeroEnergy.objectType || "",
        isVerified: json.zeroEnergy.isVerified || false,
        method: json.zeroEnergy.method || "",
        zeroEnergyTemplate: json.zeroEnergy.zeroEnergyTemplate ? ValueDto.fromJson(json.zeroEnergy.zeroEnergyTemplate) : new ValueDto(),
        templateEquipment: Array.isArray(json.zeroEnergy.templateEquipment) ? json.zeroEnergy.templateEquipment.filter((equipment) => equipment != null).map((equipment) => {
          try {
            return EquipmentDto.fromJson(equipment);
          } catch (error) {
            console.warn("Error parsing ZeroEnergy EquipmentDto:", error);
            return null;
          }
        }).filter((equipment) => equipment !== null) : [],
        templateEquipmentIds: Array.isArray(json.zeroEnergy.templateEquipmentIds) ? json.zeroEnergy.templateEquipmentIds : []
      } : null,
      relatedLotoPointIds: Array.isArray(json.relatedLotoPointIds) ? json.relatedLotoPointIds : [],
      location: json.location ? ValueDto.fromJson(json.location) : new ValueDto(),
      eqType: json.eqType ? ValueDto.fromJson(json.eqType) : new ValueDto(),
      counterpartId: json.counterpartId || null,
      isLabeled: json.isLabeled ?? false,
      isLockable: json.isLockable ?? false,
      isProcessed: json.isProcessed ?? false,
      processingStatus: json.processingStatus ? ValueDto.fromJson(json.processingStatus) : null
    });
  }
  static toFormFields(dto, isoPosOptions, normPosOptions, fields = [
    "tagNumber",
    "description",
    "unit",
    "tagged",
    "isoPos",
    "normPos",
    "specificLocation",
    "standard",
    "generalLocation",
    "isVerified",
    "zeroEnergyMethod"
  ]) {
    const allFields = {
      tagNumber: {
        name: "tagNumber",
        label: "Tag Number",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.tagNumber
      },
      description: {
        name: "description",
        label: "Description",
        type: "text",
        validators: [Validators.required],
        initialValue: dto.description
      },
      unit: {
        name: "unit",
        label: "Unit",
        type: "text",
        initialValue: dto.unit
      },
      tagged: {
        name: "tagged",
        label: "Tagged",
        type: "text",
        initialValue: dto.tagged
      },
      isoPos: {
        name: "isoPos",
        label: "Isolated Position",
        type: "select",
        options: isoPosOptions,
        initialValue: dto.isoPos?.id || null
      },
      normPos: {
        name: "normPos",
        label: "Normal Position",
        type: "select",
        options: normPosOptions,
        initialValue: dto.normPos?.id || null
      },
      specificLocation: {
        name: "specificLocation",
        label: "Specific Location",
        type: "text",
        initialValue: dto.specificLocation
      },
      standard: {
        name: "standard",
        label: "Standard",
        type: "text",
        initialValue: dto.standard
      },
      generalLocation: {
        name: "generalLocation",
        label: "General Location",
        type: "text",
        initialValue: dto.generalLocation
      },
      // Add other fields here...
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      equipmentIdList: {
        name: "equipmentIdList",
        label: "Equipment IDs",
        type: "multi-select",
        initialValue: dto.equipmentIdList
      },
      normalPosition: {
        name: "normalPosition",
        label: "Normal Position",
        type: "text",
        initialValue: dto.normalPosition
      },
      isolatedPosition: {
        name: "isolatedPosition",
        label: "Isolated Position",
        type: "text",
        initialValue: dto.isolatedPosition
      },
      fluid: {
        name: "fluid",
        label: "Fluid",
        type: "text",
        initialValue: dto.fluid
      },
      characteristicsJson: {
        name: "characteristicsJson",
        label: "Characteristics",
        type: "text",
        initialValue: dto.characteristicsJson
      },
      oldId: {
        name: "oldId",
        label: "Old ID",
        type: "text",
        initialValue: dto.oldId
      },
      objectType: {
        name: "objectType",
        label: "Object Type",
        type: "text",
        initialValue: dto.objectType
      },
      isUpdated: {
        name: "isUpdated",
        label: "Is Updated",
        type: "text",
        initialValue: dto.isUpdated
      },
      fileIds: {
        name: "fileIds",
        label: "File IDs",
        type: "text",
        initialValue: dto.fileIds
      },
      conflictStatus: {
        name: "conflictStatus",
        label: "Conflict Status",
        type: "text",
        initialValue: dto.conflictStatus
      },
      equipmentList: {
        name: "equipmentList",
        label: "Equipment List",
        type: "text"
      },
      lotos: { name: "lotos", label: "Lotos", type: "text" },
      name: {
        name: "name",
        label: "Name",
        type: "text",
        initialValue: dto.name
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
      zeroEnergyMethod: {
        name: "zeroEnergyMethod",
        label: "Zero Energy Method",
        type: "text",
        initialValue: dto.zeroEnergyMethod
      },
      zeroEnergy: {
        name: "zeroEnergy",
        label: "Zero Energy",
        type: "text",
        initialValue: dto.zeroEnergy
      },
      relatedLotoPointIds: {
        name: "relatedLotoPointIds",
        label: "Related LOTO Point IDs",
        type: "multi-select",
        initialValue: dto.relatedLotoPointIds
      },
      location: {
        name: "location",
        label: "Location",
        type: "select",
        options: [],
        initialValue: dto.location?.id || null
      },
      eqType: {
        name: "eqType",
        label: "Equipment Type",
        type: "select",
        options: [],
        initialValue: dto.eqType?.id || null
      },
      counterpartId: {
        name: "counterpartId",
        label: "Counterpart ID",
        type: "text",
        initialValue: dto.counterpartId?.toString() || null
      },
      isLabeled: {
        name: "isLabeled",
        label: "Labeled",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isLabeled?.toString()
      },
      isLockable: {
        name: "isLockable",
        label: "Lockable",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isLockable?.toString()
      },
      isProcessed: {
        name: "isProcessed",
        label: "Processed",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ],
        initialValue: dto.isProcessed?.toString()
      },
      processingStatus: {
        name: "processingStatus",
        label: "Processing Status",
        type: "select",
        options: [],
        initialValue: dto.processingStatus?.id || null
      }
    };
    return fields.map((fieldName) => allFields[fieldName]);
  }
  // Add this method to the LotoPointDto class
  static toTableColumns(fields = [
    "unit",
    "tagNumber",
    "description",
    "specificLocation",
    "tagged",
    "lotos",
    "isoPos",
    "normPos"
  ]) {
    const allColumns = {
      unit: { id: "unit", header: "Unit", accessorKey: "unit" },
      tagNumber: {
        id: "tagNumber",
        header: "Tag Number",
        accessorKey: "tagNumber"
      },
      description: {
        id: "description",
        header: "Description",
        accessorKey: "description"
      },
      specificLocation: {
        id: "specificLocation",
        header: "Specific Location",
        accessorKey: "specificLocation"
      },
      tagged: { id: "tagged", header: "Tagging Status", accessorKey: "tagged" },
      lotos: {
        id: "lotos",
        header: "LOTOs",
        accessorFn: (item) => {
          if (Array.isArray(item.lotos)) {
            return item.lotos.map((loto) => loto.workScope).join(", ");
          }
          return "";
        }
      },
      isoPos: { id: "isoPos", header: "ISO Pos", accessorKey: "isoPos.name" },
      normPos: {
        id: "normPos",
        header: "Norm Pos",
        accessorKey: "normPos.name"
      },
      id: { id: "id", header: "ID", accessorKey: "id" },
      standard: { id: "standard", header: "Standard", accessorKey: "standard" },
      generalLocation: {
        id: "generalLocation",
        header: "General Location",
        accessorKey: "generalLocation"
      },
      equipmentIdList: {
        id: "equipmentIdList",
        header: "Equipment IDs",
        accessorKey: "equipmentIdList"
      },
      normalPosition: {
        id: "normalPosition",
        header: "Normal Position",
        accessorKey: "normalPosition"
      },
      isolatedPosition: {
        id: "isolatedPosition",
        header: "Isolated Position",
        accessorKey: "isolatedPosition"
      },
      fluid: {
        id: "fluid",
        header: "Fluid",
        accessorKey: "fluid"
      },
      characteristicsJson: {
        id: "characteristicsJson",
        header: "Characteristics",
        accessorKey: "characteristicsJson"
      },
      oldId: { id: "oldId", header: "Old ID", accessorKey: "oldId" },
      objectType: {
        id: "objectType",
        header: "Object Type",
        accessorKey: "objectType"
      },
      isUpdated: {
        id: "isUpdated",
        header: "Is Updated",
        accessorKey: "isUpdated"
      },
      fileIds: { id: "fileIds", header: "File IDs", accessorKey: "fileIds" },
      conflictStatus: {
        id: "conflictStatus",
        header: "Conflict Status",
        accessorKey: "conflictStatus"
      },
      equipmentList: {
        id: "equipmentList",
        header: "Equipment List",
        accessorKey: "equipmentList"
      },
      name: { id: "name", header: "Name", accessorKey: "name" },
      isVerified: {
        id: "isVerified",
        header: "Verified",
        accessorFn: (item) => item.isVerified ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isVerified ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      zeroEnergyMethod: {
        id: "zeroEnergyMethod",
        header: "Zero Energy Method",
        accessorKey: "zeroEnergyMethod"
      },
      zeroEnergy: {
        id: "zeroEnergy",
        header: "Zero Energy",
        accessorKey: "zeroEnergy.method"
      },
      relatedLotoPointIds: {
        id: "relatedLotoPointIds",
        header: "Related LOTO Point IDs",
        accessorKey: "relatedLotoPointIds"
      },
      location: {
        id: "location",
        header: "Location",
        accessorKey: "location.name"
      },
      eqType: {
        id: "eqType",
        header: "Equipment Type",
        accessorKey: "eqType.name"
      },
      counterpartId: {
        id: "counterpartId",
        header: "Counterpart ID",
        accessorKey: "counterpartId"
      },
      isLabeled: {
        id: "isLabeled",
        header: "Labeled",
        accessorFn: (item) => item.isLabeled ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isLabeled ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      isLockable: {
        id: "isLockable",
        header: "Lockable",
        accessorFn: (item) => item.isLockable ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isLockable ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      isProcessed: {
        id: "isProcessed",
        header: "Processed",
        accessorFn: (item) => item.isProcessed ? "Yes" : "No",
        conditionalStyling: (item, column) => item.isProcessed ? { "background-color": "#90EE90" } : { "background-color": "#FFCCCB" }
      },
      processingStatus: {
        id: "processingStatus",
        header: "Status",
        accessorKey: "processingStatus.name"
      }
    };
    return fields.map((fieldName) => allColumns[fieldName]);
  }
  static isValidKey(key) {
    const validKeys = [
      "id",
      "unit",
      "tagged",
      "tagNumber",
      "description",
      "isoPos",
      "normPos",
      "specificLocation",
      "standard",
      "generalLocation",
      "equipmentIdList",
      "normalPosition",
      "isolatedPosition",
      "fluid",
      "characteristicsJson",
      "equipmentList",
      "oldId",
      "objectType",
      "isUpdated",
      "fileIds",
      "conflictStatus",
      "lotos",
      "isVerified",
      "zeroEnergyMethod",
      "counterpartId",
      "isLabeled",
      "isLockable",
      "isProcessed",
      "processingStatus"
    ];
    return validKeys.includes(key);
  }
  toIdModel() {
    const equipmentIds = this.equipmentList?.map((equipment) => equipment.id) || null;
    return new LotoPointIdDto({
      id: this.id,
      unit: this.unit,
      isVerified: this.isVerified,
      tagged: this.tagged,
      tagNumber: this.tagNumber,
      description: this.description,
      isoPos: this.isoPos?.id || null,
      isoPosId: this.isoPos?.id || null,
      normPos: this.normPos?.id || null,
      normPosId: this.normPos?.id || null,
      specificLocation: this.specificLocation,
      standard: this.standard,
      generalLocation: this.generalLocation,
      equipmentIdList: equipmentIds,
      equipmentList: equipmentIds,
      // Both fields should have the same IDs
      normalPosition: this.normalPosition,
      isolatedPosition: this.isolatedPosition,
      characteristicsJson: this.characteristicsJson,
      oldId: this.oldId,
      objectType: this.objectType,
      isUpdated: this.isUpdated,
      // fileIds: this.fileIds.split(',').map(id => id.trim()).filter(id => id !== ''),
      fileIds: this.fileIds,
      conflictStatus: this.conflictStatus,
      lotos: this.lotos?.map((loto) => loto.id) || null,
      lotoIds: this.lotos?.map((loto) => loto.id) || null,
      // Both fields should have the same IDs
      zeroEnergyMethod: this.zeroEnergyMethod,
      zeroEnergy: this.zeroEnergy ? {
        id: this.zeroEnergy.id || null,
        zeroEnergyTemplateId: typeof this.zeroEnergy.zeroEnergyTemplate === "number" ? this.zeroEnergy.zeroEnergyTemplate : this.zeroEnergy.zeroEnergyTemplate?.id || null,
        templateEquipmentIds: this.zeroEnergy.templateEquipment?.map((eq) => eq.id).filter((id) => id != null) || [],
        editShared: this.zeroEnergy.editShared || false
      } : null,
      location: this.location?.id || null,
      eqType: this.eqType?.id || null,
      counterpartId: this.counterpartId || null,
      processingStatus: this.processingStatus?.id || null
    });
  }
  toOption() {
    const label = this.tagNumber && this.description ? `${this.tagNumber} - ${this.description}` : this.tagNumber || this.description || "No Tag Number or Description";
    return {
      value: this.id,
      label
    };
  }
  applyPresetValue(equipment) {
    Object.keys(equipment).forEach((key) => {
      if (_LotoPointDto.isValidKey(key)) {
        const value = equipment[key];
        if (value !== null && value !== void 0 && value !== "") {
          if (typeof value === "object" && !Array.isArray(value)) {
            if (value.id) {
              this[key] = value;
            }
          } else {
            this[key] = value;
          }
        }
      }
    });
    return this;
  }
};

// src/app/models/equipment/equipment-id.model.ts
var EquipmentIdDto = class _EquipmentIdDto extends BaseDto {
  tagNumber;
  description;
  specificLocation;
  eqTypeId;
  files;
  vendorId;
  locationId;
  systemId;
  coordinates;
  originalPictureSize;
  rotation;
  mainFile;
  mainFileId;
  lotoPointIds;
  isUpdated;
  conflictStatus;
  // Symbol fields for PID markup shapes
  symbolId;
  svgPath;
  constructor(data = {}) {
    super(data);
    this.tagNumber = data.tagNumber || null;
    this.description = data.description || null;
    this.specificLocation = data.specificLocation || null;
    this.eqTypeId = data.eqTypeId || null;
    this.files = data.files || null;
    this.vendorId = data.vendorId || null;
    this.locationId = data.locationId || null;
    this.systemId = data.systemId || null;
    this.coordinates = data.coordinates || null;
    this.originalPictureSize = data.originalPictureSize || null;
    this.rotation = data.rotation || null;
    this.mainFile = data.mainFile || null;
    this.mainFileId = data.mainFileId || null;
    this.lotoPointIds = data.lotoPointIds || null;
    this.isUpdated = data.isUpdated || null;
    this.conflictStatus = data.conflictStatus || null;
    this.symbolId = data.symbolId || null;
    this.svgPath = data.svgPath || null;
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      tagNumber: this.tagNumber || null,
      description: this.description || null,
      specificLocation: this.specificLocation || null,
      eqTypeId: this.eqTypeId || null,
      files: this.files || null,
      vendorId: this.vendorId || null,
      locationId: this.locationId || null,
      systemId: this.systemId || null,
      coordinates: this.coordinates || null,
      originalPictureSize: this.originalPictureSize || null,
      rotation: this.rotation || null,
      mainFile: this.mainFile || null,
      mainFileId: this.mainFileId || null,
      lotoPointIds: this.lotoPointIds || null,
      isUpdated: this.isUpdated || null,
      conflictStatus: this.conflictStatus || null,
      symbolId: this.symbolId || null,
      svgPath: this.svgPath || null
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in EquipmentIdDto.fromJson");
      return new _EquipmentIdDto();
    }
    return new _EquipmentIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      tagNumber: json.tagNumber || null,
      description: json.description || null,
      specificLocation: json.specificLocation || null,
      eqTypeId: json.eqTypeId || null,
      files: json.files || null,
      vendorId: json.vendorId || null,
      locationId: json.locationId || null,
      systemId: json.systemId || null,
      coordinates: json.coordinates || null,
      originalPictureSize: json.originalPictureSize || null,
      rotation: json.rotation || null,
      mainFile: json.mainFile || null,
      mainFileId: json.mainFileId || null,
      lotoPointIds: json.lotoPointIds || null,
      isUpdated: json.isUpdated || null,
      conflictStatus: json.conflictStatus || null,
      symbolId: json.symbolId || null,
      svgPath: json.svgPath || null
    }));
  }
};

// src/app/models/file/file-id.model.ts
var FileIdDto = class _FileIdDto extends BaseDto {
  fileType;
  fileLink;
  baseLink;
  folder;
  system;
  relatedSystems;
  fileNumber;
  vendor;
  points;
  extension;
  extensions;
  bulkEditStep;
  docNum;
  constructor(data = {}) {
    super(data);
    this.fileType = data.fileType || 0;
    this.fileLink = data.fileLink || "";
    this.baseLink = data.baseLink || "";
    this.folder = data.folder || "";
    this.system = data.system || 0;
    this.relatedSystems = data.relatedSystems || [];
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor || 0;
    this.points = data.points || [];
    this.objectType = data.objectType || "";
    this.extension = data.extension || "";
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || "";
    this.docNum = data.docNum || "";
  }
  toJson() {
    return __spreadProps(__spreadValues({}, super.toJson()), {
      fileType: this.fileType,
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: this.system,
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: this.vendor,
      points: this.points,
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum
    });
  }
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in FileIdDto.fromJson");
      return new _FileIdDto();
    }
    return new _FileIdDto(__spreadProps(__spreadValues({}, super.fromJson(json)), {
      fileType: json.fileType,
      fileLink: json.fileLink,
      baseLink: json.baseLink,
      folder: json.folder,
      system: json.system,
      relatedSystems: json.relatedSystems,
      fileNumber: json.fileNumber,
      vendor: json.vendor,
      points: json.points || [],
      extension: json.extension,
      extensions: json.extensions,
      bulkEditStep: json.bulkEditStep,
      docNum: json.docNum
    }));
  }
};

// src/app/models/file/file.model.ts
var FileDto = class _FileDto extends BaseDto {
  fileType;
  fileLink;
  baseLink;
  folder;
  system;
  relatedSystems;
  fileNumber;
  vendor;
  points;
  extension;
  extensions;
  bulkEditStep;
  docNum;
  constructor(data = {}) {
    super(data);
    this.id = data.id || 0;
    this.name = data.name || "";
    this.fileType = data.fileType || new ValueDto({ id: 0, name: "" });
    this.fileLink = data.fileLink || "";
    this.baseLink = data.baseLink || "";
    this.folder = data.folder || "";
    this.system = data.system || new ValueDto({ id: 0, name: "" });
    this.relatedSystems = data.relatedSystems || [];
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor || new ValueDto({ id: 0, name: "" });
    this.points = data.points || [];
    this.objectType = data.objectType || "";
    this.extension = data.extension || "";
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || "";
    this.docNum = data.docNum || "";
    this.isVerified = data.isVerified || false;
  }
  // Serialization method
  toJson() {
    return {
      id: this.id,
      name: this.name,
      fileType: this.fileType,
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: this.system,
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: this.vendor,
      points: this.points,
      objectType: this.objectType,
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum,
      isVerified: this.isVerified
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    return new _FileDto({
      id: json.id,
      name: json.name,
      fileType: json.fileType,
      fileLink: json.fileLink,
      baseLink: json.baseLink,
      folder: json.folder,
      system: json.system,
      relatedSystems: json.relatedSystems,
      fileNumber: json.fileNumber,
      vendor: json.vendor,
      points: json.points,
      objectType: json.objectType,
      extension: json.extension,
      extensions: json.extensions,
      bulkEditStep: json.bulkEditStep,
      docNum: json.docNum,
      isVerified: json.isVerified
    });
  }
  toIdModel() {
    const extractId = (value) => {
      if (value == null)
        return 0;
      if (typeof value === "number")
        return value;
      if (typeof value === "object" && value.id != null)
        return value.id;
      return 0;
    };
    return new FileIdDto({
      id: this.id,
      name: this.name,
      fileType: extractId(this.fileType),
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: extractId(this.system),
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: extractId(this.vendor),
      points: this.points?.map((point) => typeof point === "number" ? point : point.id) || [],
      objectType: this.objectType,
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum,
      isVerified: this.isVerified
    });
  }
};

// src/app/models/equipment/equipment.model.ts
var EquipmentDto = class _EquipmentDto extends BaseDto {
  tagNumber;
  description;
  specificLocation;
  eqType;
  files;
  vendor;
  location;
  system;
  coordinates;
  originalPictureSize;
  rotation;
  mainFile;
  mainFileId;
  lotoPoints;
  isUpdated;
  conflictStatus;
  mainFileObject;
  // Symbol fields for PID markup shapes
  symbolId;
  svgPath;
  constructor(data = {}) {
    super(data);
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.specificLocation = data.specificLocation ?? null;
    this.eqType = super.setNestedObjectById(data.eqType, new ValueDto());
    this.files = data.files ?? [];
    this.vendor = super.setNestedObjectById(data.vendor, new ValueDto());
    this.location = super.setNestedObjectById(data.location, new ValueDto());
    this.system = super.setNestedObjectById(data.system, new ValueDto());
    this.coordinates = data.coordinates ?? null;
    this.originalPictureSize = data.originalPictureSize ?? null;
    this.rotation = data.rotation ?? null;
    this.mainFile = data.mainFile ?? null;
    this.mainFileId = data.mainFileId ?? null;
    this.lotoPoints = data.lotoPoints ?? [];
    this.isUpdated = data.isUpdated ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
    this.mainFileObject = data.mainFileObject ?? null;
    this.symbolId = data.symbolId ?? null;
    this.svgPath = data.svgPath ?? null;
  }
  // Serialization method
  toJson() {
    return {
      tagNumber: this.tagNumber || null,
      description: this.description || null,
      specificLocation: this.specificLocation || null,
      eqType: this.eqType ? this.eqType.toJson() : null,
      files: Array.isArray(this.files) ? this.files : null,
      vendor: this.vendor ? this.vendor.toJson() : null,
      location: this.location ? this.location.toJson() : null,
      system: this.system ? this.system.toJson() : null,
      coordinates: this.coordinates || null,
      originalPictureSize: this.originalPictureSize || null,
      rotation: this.rotation || null,
      mainFile: this.mainFile || null,
      mainFileId: this.mainFileId || null,
      lotoPoints: this.lotoPoints?.map((point) => point ? point.toJson() : null).filter(Boolean),
      isUpdated: this.isUpdated || null,
      conflictStatus: this.conflictStatus || null,
      symbolId: this.symbolId || null,
      svgPath: this.svgPath || null
    };
  }
  // Deserialization method (static)
  static fromJson(json) {
    if (!json) {
      console.warn("Received null or undefined json in EquipmentDto.fromJson");
      return new _EquipmentDto();
    }
    return new _EquipmentDto({
      id: json.id || 0,
      tagNumber: json.tagNumber || null,
      description: json.description || null,
      specificLocation: json.specificLocation || null,
      eqType: json.eqType ? ValueDto.fromJson(json.eqType) : null,
      files: Array.isArray(json.files) ? json.files : [],
      vendor: json.vendor ? ValueDto.fromJson(json.vendor) : null,
      location: json.location ? ValueDto.fromJson(json.location) : null,
      system: json.system ? ValueDto.fromJson(json.system) : null,
      coordinates: json.coordinates || null,
      originalPictureSize: json.originalPictureSize || null,
      rotation: json.rotation || null,
      mainFile: json.mainFile || null,
      mainFileId: json.mainFileId || null,
      lotoPoints: json.lotoPoints ? json.lotoPoints.map((point) => LotoPointDto.fromJson(point)) : null,
      isUpdated: json.isUpdated || null,
      conflictStatus: json.conflictStatus || null,
      mainFileObject: json.mainFileObject ? FileDto.fromJson(json.mainFileObject) : null,
      symbolId: json.symbolId || null,
      svgPath: json.svgPath || null
    });
  }
  toIdModel() {
    return new EquipmentIdDto({
      id: this.id,
      tagNumber: this.tagNumber,
      description: this.description,
      specificLocation: this.specificLocation,
      eqTypeId: this.eqType?.id || 0,
      files: this.files,
      vendorId: this.vendor?.id || 0,
      locationId: this.location?.id || 0,
      systemId: this.system?.id || 0,
      coordinates: this.coordinates,
      originalPictureSize: this.originalPictureSize,
      rotation: this.rotation,
      mainFile: this.mainFile,
      mainFileId: this.mainFileId ?? this.mainFileObject?.id,
      lotoPointIds: this.lotoPoints?.map((point) => point.id) || null,
      isUpdated: this.isUpdated,
      conflictStatus: this.conflictStatus,
      isVerified: this.isVerified,
      symbolId: this.symbolId,
      svgPath: this.svgPath
    });
  }
  toShapeObject() {
    try {
      const cleanedCoords = this.coordinates?.replace(/\\/g, "").replace(/^"(.*)"$/, "$1");
      if (!cleanedCoords)
        return null;
      let coordsObj;
      try {
        coordsObj = JSON.parse(cleanedCoords);
      } catch {
        const parts = cleanedCoords.split(",");
        coordsObj = {
          startX: parts[0].split(":")[1],
          startY: parts[1].split(":")[1],
          endX: parts[2].split(":")[1],
          endY: parts[3].split(":")[1],
          width: parts[4].split(":")[1],
          height: parts[5].split(":")[1]
        };
      }
      const startX = Number(coordsObj.startX);
      const startY = Number(coordsObj.startY);
      const endX = Number(coordsObj.endX);
      const endY = Number(coordsObj.endY);
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        throw new Error("Invalid coordinate values");
      }
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      const sizeMatch = this.originalPictureSize?.match(/width:(\d+),height:(\d+)/);
      if (!sizeMatch) {
        throw new Error("Invalid original picture size format");
      }
      const originalWidth = Number(sizeMatch[1]);
      const originalHeight = Number(sizeMatch[2]);
      if (isNaN(originalWidth) || isNaN(originalHeight)) {
        throw new Error("Invalid original picture size values");
      }
      return {
        id: this.id,
        type: "rectangle",
        color: this.getShapeColor(),
        originalPictureWidth: originalWidth,
        originalPictureHeight: originalHeight,
        isSelected: false,
        isSecondarySelected: false,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width,
        height,
        scaleToCurrentImage: 1,
        currentImgHeigth: 1,
        currentImgWidth: 1
      };
    } catch (error) {
      console.error("Error parsing coordinates:", error);
      return {
        id: this.id,
        type: "rectangle",
        color: "#FF0000",
        originalPictureWidth: 0,
        originalPictureHeight: 0,
        isSelected: false,
        isSecondarySelected: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scaleToCurrentImage: 0,
        currentImgHeigth: 0,
        currentImgWidth: 0
      };
    }
  }
  static createEquipmentFromShape(shape) {
    if (shape.type !== "rectangle") {
      throw new Error("Only rectangle shapes are supported for equipment");
    }
    const coordinates = JSON.stringify({
      startX: shape.x,
      startY: shape.y,
      endX: shape.x + shape.width,
      endY: shape.y + shape.height,
      width: shape.width,
      height: shape.height
    }).replace(/^"|"$/g, "").replace(/\\/g, "").replace(/"(\w+)":/g, "$1:");
    const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;
    const newEq = new _EquipmentDto({
      coordinates,
      originalPictureSize
    });
    return newEq;
  }
  setCoordinatesFromShape(shape) {
    if (shape.type !== "rectangle") {
      throw new Error("Only rectangle shapes are supported for equipment");
    }
    const coordinates = JSON.stringify({
      startX: shape.x,
      startY: shape.y,
      endX: shape.x + shape.width,
      endY: shape.y + shape.height,
      width: shape.width,
      height: shape.height
    }).replace(/^"|"$/g, "").replace(/\\/g, "").replace(/"(\w+)":/g, "$1:");
    const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;
    this.coordinates = coordinates;
    this.originalPictureSize = originalPictureSize;
    return this;
  }
  getShapeColor() {
    switch (this.getNormalLotoPosition().toLowerCase().trim()) {
      case "open":
        return "#FF0000";
      // Red
      case "closed":
        return "#00FF00";
      // Green
      case "auto":
        return "#FFFF00";
      // Yellow
      default:
        return "#0000FF";
    }
  }
  getNormalLotoPosition() {
    if (this.lotoPoints && this.lotoPoints.length > 0) {
      const firstLotoPoint = this.lotoPoints[0];
      if (firstLotoPoint && firstLotoPoint.normPos && firstLotoPoint.normPos.name) {
        return firstLotoPoint.normPos.name;
      }
    }
    return "";
  }
  static isValidKey(key) {
    const validKeys = [
      "id",
      "tagNumber",
      "description",
      "specificLocation",
      "eqType",
      "files",
      "vendor",
      "location",
      "system",
      "coordinates",
      "originalPictureSize",
      "mainFile",
      "lotoPoints",
      "isUpdated",
      "conflictStatus",
      "isVerified"
    ];
    return validKeys.includes(key);
  }
  static toFormFields(dto, eqTypeOptions, vendorOptions, locationOptions, systemOptions, fields = ["tagNumber", "description", "specificLocation", "eqType", "vendor", "location", "system"]) {
    const allFields = {
      id: { name: "id", label: "ID", type: "text", initialValue: dto.id },
      tagNumber: { name: "tagNumber", label: "Tag Number", type: "text", validators: [Validators.required], initialValue: dto.tagNumber },
      description: { name: "description", label: "Description", type: "text", validators: [Validators.required], initialValue: dto.description },
      specificLocation: { name: "specificLocation", label: "Specific Location", type: "text", initialValue: dto.specificLocation },
      eqType: {
        name: "eqType",
        label: "Equipment Type",
        type: "select",
        options: eqTypeOptions,
        initialValue: dto.eqType?.id || null
      },
      files: { name: "files", label: "Files", type: "multi-select", initialValue: dto.files },
      vendor: {
        name: "vendor",
        label: "Vendor",
        type: "select",
        options: vendorOptions,
        initialValue: dto.vendor?.id || null
      },
      location: {
        name: "location",
        label: "Location",
        type: "select",
        options: locationOptions,
        initialValue: dto.location?.id || null
      },
      system: {
        name: "system",
        label: "System",
        type: "select",
        options: systemOptions,
        initialValue: dto.system?.id || null
      },
      coordinates: { name: "coordinates", label: "Coordinates", type: "text", initialValue: dto.coordinates },
      originalPictureSize: { name: "originalPictureSize", label: "Original Picture Size", type: "text", initialValue: dto.originalPictureSize },
      rotation: { name: "rotation", label: "Rotation", type: "text", initialValue: dto.rotation },
      mainFile: { name: "mainFile", label: "Main File", type: "text", initialValue: dto.mainFile },
      mainFileId: { name: "mainFileId", label: "Main File ID", type: "text", initialValue: dto.mainFileId },
      lotoPoints: { name: "lotoPoints", label: "LOTO Points", type: "multi-select", initialValue: dto.lotoPoints?.map((point) => point.id) || null },
      isUpdated: { name: "isUpdated", label: "Is Updated", type: "text", initialValue: dto.isUpdated },
      conflictStatus: { name: "conflictStatus", label: "Conflict Status", type: "text", initialValue: dto.conflictStatus },
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
      objectType: { name: "objectType", label: "Object Type", type: "text", initialValue: dto.objectType },
      mainFileObject: { name: "mainFileObject", label: "Main File", type: "text", initialValue: dto.mainFile },
      symbolId: { name: "symbolId", label: "Symbol ID", type: "text", initialValue: dto.symbolId },
      svgPath: { name: "svgPath", label: "SVG Path", type: "text", initialValue: dto.svgPath }
    };
    return fields.map((fieldName) => allFields[fieldName]);
  }
  applyPresetValue(equipment) {
    Object.keys(equipment).forEach((key) => {
      if (_EquipmentDto.isValidKey(key)) {
        const value = equipment[key];
        if (value !== null && value !== void 0 && value !== "") {
          if (typeof value === "object" && !Array.isArray(value)) {
            if (value.id) {
              this[key] = value;
            }
          } else {
            this[key] = value;
          }
        }
      }
    });
    return this;
  }
};

export {
  ValueDto,
  FileDto,
  EquipmentDto,
  UserDto,
  LockDto,
  LotoBoxDto,
  LotoDto,
  LotoPointIdDto,
  ZeroEnergyDto,
  LotoPointDto
};
//# sourceMappingURL=chunk-PRWR46IA.js.map
