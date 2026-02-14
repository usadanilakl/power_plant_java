import {
  ConfinedSpaceDto,
  HotWorkDto,
  JhaDto,
  JobStep,
  SafeWorkDto
} from "./chunk-X3FRVHGI.js";
import {
  LotoDto
} from "./chunk-WQ4L5DDC.js";
import {
  ɵɵdefineInjectable
} from "./chunk-BPY52ML3.js";

// src/app/features/form-designer-refactored/services/entity-loader.service.ts
var EntityLoaderService = class _EntityLoaderService {
  loadEntityDto(formType) {
    switch (formType) {
      case "SafeWork":
        return new SafeWorkDto();
      case "HotWork":
        return new HotWorkDto();
      case "ConfinedSpace":
        return new ConfinedSpaceDto();
      case "Loto":
        return new LotoDto();
      case "Jha":
        return new JhaDto();
      case "JobStep":
        return new JobStep();
      case "WorkRequest":
      default:
        return null;
    }
  }
  loadEntityFields(formType) {
    const entity = this.loadEntityDto(formType);
    if (!entity)
      return [];
    switch (formType) {
      case "SafeWork":
        return SafeWorkDto.toFormFields(entity, []);
      case "HotWork":
        return HotWorkDto.toFormFields(entity, []);
      case "ConfinedSpace":
        return ConfinedSpaceDto.toFormFields(entity, []);
      case "Loto":
        return LotoDto.toFormFields(entity);
      case "Jha":
        return entity.getFormFields();
      case "JobStep":
        return entity.getFormFields();
      default:
        return [];
    }
  }
  loadEntityWithFields(formType) {
    return {
      entity: this.loadEntityDto(formType),
      fields: this.loadEntityFields(formType)
    };
  }
  getSupportedFormTypes() {
    return ["SafeWork", "HotWork", "ConfinedSpace", "Loto", "Jha", "JobStep", "WorkRequest"];
  }
  isFormTypeSupported(formType) {
    return this.getSupportedFormTypes().includes(formType);
  }
  getSampleData(formType) {
    switch (formType) {
      case "SafeWork":
        return this.getSafeWorkSample();
      case "HotWork":
        return this.getHotWorkSample();
      case "ConfinedSpace":
        return this.getConfinedSpaceSample();
      case "Loto":
        return this.getLotoSample();
      case "Jha":
        return this.getJhaSample();
      case "JobStep":
        return this.getJobStepSample();
      case "WorkRequest":
        return this.getWorkRequestSample();
      default:
        return {};
    }
  }
  getSafeWorkSample() {
    return {
      date: "2026-02-12",
      time: "07:30",
      companyPerson: "Acme Industrial / John Smith",
      location: "Boiler Room B-2",
      workScope: "Replace high-pressure steam valve on boiler feed water system. Includes isolation, draining, and reinstallation.",
      specialInstructions: "Ensure area is barricaded. Coordinate with operations before isolating steam supply.",
      requestedBy: "Mike Johnson",
      hazards: {
        highTemp: true,
        highPressure: true,
        energized: false,
        storedEnergy: true,
        eyeHazard: true,
        egressAccess: false,
        ergonomicHazard: false,
        fallingObject: false,
        highNoise: true,
        dustParticulate: false,
        combustibleDust: false,
        fireHazard: false,
        hotSurface: true,
        slippery: false,
        ventilationRequired: false,
        lightingRestrictions: false,
        chemicalExposure: false,
        liftingHazard: true,
        handTraps: false,
        heatColdStress: false,
        elevatedSurface: false,
        environmental: false,
        weatherHazards: false,
        weatherHazardDescription: "",
        other: false,
        otherDescription: ""
      },
      permits: {
        lotoRequired: true,
        lotoDescription: "LOTO-2026-0145",
        confinedSpace: false,
        confinedSpaceDescription: "",
        hotWork: true,
        hotWorkDescription: "Welding required for pipe fitting",
        ventingPurging: false,
        ventingPurgingDescription: "",
        jha: true,
        gasTesting: true,
        excavationPermit: false,
        energizedPermit: false,
        other: false,
        otherDescription: ""
      },
      ppe: {
        hardhat: true,
        safetyGlasses: true,
        hearingProtection: true,
        boots: true,
        fallProtection: false,
        gfi: false,
        respirator: false,
        dustMask: false,
        gloves: true,
        iceCleats: false,
        acidSuit: false,
        barricade: false,
        faceShield: true,
        gasMonitor: false,
        arcFlashPpe: false,
        weldingJacket: true,
        weldingShield: true,
        weldingGloves: true,
        purgingVentilation: false,
        other: false,
        otherDescription: ""
      }
    };
  }
  getHotWorkSample() {
    return {
      date: "2026-02-12",
      location: "Turbine Hall - Level 3",
      workScope: "Welding repair on auxiliary cooling water piping. Grinding and cutting of corroded section, weld new pipe section.",
      foreman: "Robert Davis",
      fireWatch: "Sarah Wilson",
      meterModel: "RKI GX-3R PRO",
      meterNum: "GM-4521",
      specialInstructions: "Maintain fire watch for 60 minutes after completion. Ensure all combustibles removed within 35ft radius.",
      isFireWatchRequired: true,
      isAirMonitoringRegisteredOnConfinedSpace: false,
      timeOfInitialTest: "06:45",
      initialTestResult: "0% LEL, 20.9% O2",
      measures: {
        areaIsClean: true,
        flammablesAreSecured: true,
        noCombustibleDustOrDebrisPresent: true,
        radiativeHeatPreventiveMeasuresAreTaken: true,
        vesselsArePurged: true,
        openingsAreCovered: true,
        ductVentilationIsSecured: true,
        lockOutIsCompleted: true,
        communicationIsEstablished: true,
        fireWatchIsAwareOfDuties: true,
        fireExtinguisherPresent: true,
        fireProtectionIsInService: true
      }
    };
  }
  getConfinedSpaceSample() {
    return {
      date: "2026-02-12",
      time: "08:00",
      space: "Condenser A - Waterbox",
      workScope: "Inspect and clean condenser tubes. Remove biofouling and scale deposits from tube sheets.",
      issuedTo: "Tom Anderson",
      duration: "8 hours",
      lotoNum: "LOTO-2026-0203",
      hotWorkNum: "",
      ventilation: true,
      blankFlanged: true,
      meterModel: "RKI GX-3R PRO",
      meterNum: "GM-3387",
      calibrated: true,
      oxygen: "20.9%",
      lel: "0%",
      hydrogenSulfide: "0 ppm",
      carbonMonoxide: "0 ppm",
      ammonia: "0 ppm",
      timeOfSample: "07:45",
      testerInitials: "JK",
      hazards: {
        oxygenDeficiency: true,
        flammableGas: false,
        combustibleDust: false,
        toxicGas: true,
        rotatingEquipment: false,
        electricalShock: false,
        entrapment: true,
        engulfment: false,
        heatStress: true,
        other: false,
        otherDescription: ""
      },
      ppe: {
        faceShield: false,
        fcfi: false,
        lovVoltageTools: false,
        explosionProofTools: false,
        nonSparkingTools: false,
        fallProtection: true,
        retrievalSystem: true,
        lifeline: true,
        personalAtmosphericMeter: true,
        tripod: true,
        other: false,
        otherDescription: ""
      },
      precautions: {
        ventilation: true,
        blankFlanged: true,
        doubleBlockAndBleed: false,
        barriers: true,
        other: false,
        otherDescription: "",
        lockOutTagOut: "LOTO-2026-0203",
        hotWorkPermit: ""
      }
    };
  }
  getLotoSample() {
    return {
      equipmentSystem: "Boiler Feed Pump #3 - Unit 2",
      lotoRequestor: "James Martinez",
      date: "2026-02-12",
      boxNumber: 42
    };
  }
  getJhaSample() {
    return {
      jobName: "Boiler Feed Pump Maintenance",
      applicability: "Unit 2 - Annual Overhaul",
      analysisBy: "David Chen",
      reviewedBy: "Lisa Park",
      approvedBy: "Mike Johnson",
      date: "2026-02-10",
      ppe: "Hard hat, safety glasses, steel-toe boots, hearing protection, gloves",
      loto: "LOTO-2026-0145 - Boiler Feed Pump #3 isolation",
      confinedSpace: "N/A",
      hazCom: "Lubricating oil, hydraulic fluid - refer to SDS binder",
      handAndPowerTools: "Torque wrench, impact driver, pipe wrenches, grinder",
      specialTools: "Bearing puller, alignment laser kit",
      jobSteps: [
        { sequence: 1, description: "Review work scope and conduct tailboard meeting", hazard: "Miscommunication", safetyMeasures: "Ensure all crew members sign on, verify roles" },
        { sequence: 2, description: "Isolate and lock out pump system", hazard: "Stored energy, unexpected startup", safetyMeasures: "Follow LOTO procedure, verify zero energy state" },
        { sequence: 3, description: "Drain pump casing and disconnect piping", hazard: "Hot fluid release, chemical exposure", safetyMeasures: "Allow cooldown, wear face shield and chemical gloves" },
        { sequence: 4, description: "Remove pump coupling and bearings", hazard: "Heavy lifting, pinch points", safetyMeasures: "Use chain hoist, tag lines, keep hands clear" },
        { sequence: 5, description: "Inspect and replace worn components", hazard: "Sharp edges, dropped objects", safetyMeasures: "Cut-resistant gloves, secure parts with wire" },
        { sequence: 6, description: "Reassemble and align pump", hazard: "Ergonomic strain, tool hazards", safetyMeasures: "Rotate tasks, use torque wrench per specs" }
      ]
    };
  }
  getJobStepSample() {
    return {
      description: "Inspect work area for hazards and set up barriers",
      hazard: "Slips, trips, falls; overhead hazards",
      safetyMeasures: "Clear debris, install barricade tape, wear hard hat"
    };
  }
  getWorkRequestSample() {
    return {
      dateOfWorkToBePerformed: "2026-02-15",
      timeOfWorkToBePerformed: "07:00",
      requestedBy: "John Smith",
      company: "Acme Industrial",
      location: "Boiler Room B-2",
      affectedEquipment: "Boiler Feed Pump #3",
      workScope: "Annual maintenance and bearing replacement on BFP-3. Includes alignment check and vibration analysis.",
      isHotWorkRequired: true,
      foreman: "Robert Davis",
      fireWatch: "Sarah Wilson",
      isLotoRequired: true,
      isConfinedSpaceEntryRequired: false,
      space: "",
      status: "Approved"
    };
  }
  static \u0275fac = function EntityLoaderService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _EntityLoaderService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _EntityLoaderService, factory: _EntityLoaderService.\u0275fac, providedIn: "root" });
};

export {
  EntityLoaderService
};
//# sourceMappingURL=chunk-KK5YVQKT.js.map
