import { Injectable } from '@angular/core';
import { SafeWorkDto, SwHazards, SwPermits, SwPpe } from '../../../models/permits/safe-work.model';
import { HotWorkDto, HotWorkMeasures } from '../../../models/permits/hot-work.model';
import { ConfinedSpaceDto, ConfinedSpaceHazards, ConfinedSpacePpe, ConfinedSpacePrecautions } from '../../../models/permits/confined-space.model';
import { LotoDto } from '../../../models/loto/loto.model';
import { Jha, JobStep } from '../../../models/permits/jha.model';
import { EnergizedWorkPermitDto } from '../../../models/permits/energized-work-permit.model';
import { ExcavationPermitDto } from '../../../models/permits/excavation-permit.model';
import { VentingPermitDto } from '../../../models/permits/venting-permit.model';
import { FormField } from '../../../models/ui/form-field.model';

@Injectable({ providedIn: 'root' })
export class EntityLoaderService {

  loadEntityDto(formType: string): any {
    switch (formType) {
      case 'SafeWork': return new SafeWorkDto();
      case 'HotWork': return new HotWorkDto();
      case 'ConfinedSpace': return new ConfinedSpaceDto();
      case 'Loto': return new LotoDto();
      case 'Jha': return new Jha();
      case 'JobStep': return new JobStep();
      case 'EnergizedWorkPermit': return new EnergizedWorkPermitDto();
      case 'ExcavationPermit': return new ExcavationPermitDto();
      case 'VentingPermit': return new VentingPermitDto();
      case 'WorkRequest':
      default: return null;
    }
  }

  loadEntityFields(formType: string): FormField[] {
    const entity = this.loadEntityDto(formType);
    if (!entity) return [];

    switch (formType) {
      case 'SafeWork': return SafeWorkDto.toFormFields(entity as SafeWorkDto, []);
      case 'HotWork': return HotWorkDto.toFormFields(entity as HotWorkDto, []);
      case 'ConfinedSpace': return ConfinedSpaceDto.toFormFields(entity as ConfinedSpaceDto, []);
      case 'Loto': return LotoDto.toFormFields(entity as LotoDto);
      case 'Jha': return (entity as Jha).getFormFields();
      case 'JobStep': return (entity as JobStep).getFormFields();
      case 'EnergizedWorkPermit': return EnergizedWorkPermitDto.toFormFields(entity as EnergizedWorkPermitDto);
      case 'ExcavationPermit': return ExcavationPermitDto.toFormFields(entity as ExcavationPermitDto);
      case 'VentingPermit': return VentingPermitDto.toFormFields(entity as VentingPermitDto);
      default: return [];
    }
  }

  loadEntityWithFields(formType: string): { entity: any; fields: FormField[] } {
    return {
      entity: this.loadEntityDto(formType),
      fields: this.loadEntityFields(formType),
    };
  }

  getSupportedFormTypes(): string[] {
    return ['SafeWork', 'HotWork', 'ConfinedSpace', 'EnergizedWorkPermit', 'ExcavationPermit', 'VentingPermit', 'Loto', 'Jha', 'JobStep', 'WorkRequest'];
  }

  isFormTypeSupported(formType: string): boolean {
    return this.getSupportedFormTypes().includes(formType);
  }

  getSampleData(formType: string): any {
    switch (formType) {
      case 'SafeWork': return this.getSafeWorkSample();
      case 'HotWork': return this.getHotWorkSample();
      case 'ConfinedSpace': return this.getConfinedSpaceSample();
      case 'Loto': return this.getLotoSample();
      case 'Jha': return this.getJhaSample();
      case 'JobStep': return this.getJobStepSample();
      case 'EnergizedWorkPermit': return this.getEnergizedWorkSample();
      case 'ExcavationPermit': return this.getExcavationSample();
      case 'VentingPermit': return this.getVentingSample();
      case 'WorkRequest': return this.getWorkRequestSample();
      default: return {};
    }
  }

  private getSafeWorkSample(): any {
    return {
      date: '2026-02-12',
      time: '07:30',
      companyPerson: 'Acme Industrial / John Smith',
      location: 'Boiler Room B-2',
      workScope: 'Replace high-pressure steam valve on boiler feed water system. Includes isolation, draining, and reinstallation.',
      specialInstructions: 'Ensure area is barricaded. Coordinate with operations before isolating steam supply.',
      requestedBy: 'Mike Johnson',
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
        weatherHazardDescription: '',
        other: false,
        otherDescription: '',
      },
      permits: {
        lotoRequired: true,
        lotoDescription: 'LOTO-2026-0145',
        confinedSpace: false,
        confinedSpaceDescription: '',
        hotWork: true,
        hotWorkDescription: 'Welding required for pipe fitting',
        ventingPurging: false,
        ventingPurgingDescription: '',
        jha: true,
        gasTesting: true,
        excavationPermit: false,
        energizedPermit: false,
        other: false,
        otherDescription: '',
      },
      ppe: {
        hardhat: true,
        safetyGlasses: true,
        hearingProtection: true,
        boots: true,
        weldingPpe: true,
        respiratorDustMask: false,
        respiratorType: '',
        gloves: true,
        glovesType: '',
        gasMonitor: false,
        tyvekSuit: false,
        acidSuit: false,
        barricade: false,
        faceShield: true,
        arcFlashPpe: false,
        classCalRating: '',
        gfi: false,
        purgingVentilation: false,
        fallProtection: false,
        fallClearance: '',
        other: false,
        otherDescription: '',
      },
    };
  }

  private getHotWorkSample(): any {
    return {
      date: '2026-02-12',
      location: 'Turbine Hall - Level 3',
      workScope: 'Welding repair on auxiliary cooling water piping. Grinding and cutting of corroded section, weld new pipe section.',
      foreman: 'Robert Davis',
      fireWatch: 'Sarah Wilson',
      meterModel: 'RKI GX-3R PRO',
      meterNum: 'GM-4521',
      specialInstructions: 'Maintain fire watch for 60 minutes after completion. Ensure all combustibles removed within 35ft radius.',
      isFireWatchRequired: true,
      isAirMonitoringRegisteredOnConfinedSpace: false,
      timeOfInitialTest: '06:45',
      initialTestResult: '0% LEL, 20.9% O2',
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
        fireProtectionIsInService: true,
      },
    };
  }

  private getConfinedSpaceSample(): any {
    return {
      date: '2026-02-12',
      time: '08:00',
      space: 'Condenser A - Waterbox',
      workScope: 'Inspect and clean condenser tubes. Remove biofouling and scale deposits from tube sheets.',
      issuedTo: 'Tom Anderson',
      duration: '8 hours',
      lotoNum: 'LOTO-2026-0203',
      hotWorkNum: '',
      ventilation: true,
      blankFlanged: true,
      meterModel: 'RKI GX-3R PRO',
      meterNum: 'GM-3387',
      calibrated: true,
      oxygen: '20.9%',
      lel: '0%',
      hydrogenSulfide: '0 ppm',
      carbonMonoxide: '0 ppm',
      ammonia: '0 ppm',
      timeOfSample: '07:45',
      testerInitials: 'JK',
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
        otherDescription: '',
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
        otherDescription: '',
      },
      precautions: {
        ventilation: true,
        blankFlanged: true,
        doubleBlockAndBleed: false,
        barriers: true,
        other: false,
        otherDescription: '',
        lockOutTagOut: 'LOTO-2026-0203',
        hotWorkPermit: '',
      },
    };
  }

  private getLotoSample(): any {
    return {
      equipmentSystem: 'Boiler Feed Pump #3 - Unit 2',
      lotoRequestor: 'James Martinez',
      date: '2026-02-12',
      boxNumber: 42,
    };
  }

  private getJhaSample(): any {
    return {
      jobName: 'Boiler Feed Pump Maintenance',
      applicability: 'Unit 2 - Annual Overhaul',
      analysisBy: 'David Chen',
      reviewedBy: 'Lisa Park',
      approvedBy: 'Mike Johnson',
      date: '2026-02-10',
      ppe: 'Hard hat, safety glasses, steel-toe boots, hearing protection, gloves',
      loto: 'LOTO-2026-0145 - Boiler Feed Pump #3 isolation',
      confinedSpace: 'N/A',
      hazCom: 'Lubricating oil, hydraulic fluid - refer to SDS binder',
      handAndPowerTools: 'Torque wrench, impact driver, pipe wrenches, grinder',
      specialTools: 'Bearing puller, alignment laser kit',
      jobSteps: [
        { sequence: 1, description: 'Review work scope and conduct tailboard meeting', hazard: 'Miscommunication', safetyMeasures: 'Ensure all crew members sign on, verify roles' },
        { sequence: 2, description: 'Isolate and lock out pump system', hazard: 'Stored energy, unexpected startup', safetyMeasures: 'Follow LOTO procedure, verify zero energy state' },
        { sequence: 3, description: 'Drain pump casing and disconnect piping', hazard: 'Hot fluid release, chemical exposure', safetyMeasures: 'Allow cooldown, wear face shield and chemical gloves' },
        { sequence: 4, description: 'Remove pump coupling and bearings', hazard: 'Heavy lifting, pinch points', safetyMeasures: 'Use chain hoist, tag lines, keep hands clear' },
        { sequence: 5, description: 'Inspect and replace worn components', hazard: 'Sharp edges, dropped objects', safetyMeasures: 'Cut-resistant gloves, secure parts with wire' },
        { sequence: 6, description: 'Reassemble and align pump', hazard: 'Ergonomic strain, tool hazards', safetyMeasures: 'Rotate tasks, use torque wrench per specs' },
      ],
    };
  }

  private getJobStepSample(): any {
    return {
      description: 'Inspect work area for hazards and set up barriers',
      hazard: 'Slips, trips, falls; overhead hazards',
      safetyMeasures: 'Clear debris, install barricade tape, wear hard hat',
    };
  }

  private getEnergizedWorkSample(): any {
    return {
      workOrder: 'WO-2026-0312',
      circuitDescription: '480V MCC-3A, Breaker 12 - Boiler Feed Pump #2',
      workDescription: 'Replace contactor and overload relay on BFP-2 starter',
      justification: 'Pump must remain available for unit startup scheduled tomorrow',
      requester: 'Mike Johnson',
      requesterDate: '2026-02-27',
      workCanBePerformedSafely: true,
      qualifiedPersonSignature: 'David Chen',
      qualifiedPersonDate: '2026-02-27',
      plantManagerSignature: 'Lisa Park',
      plantManagerDate: '2026-02-27',
      checklist: {
        jobDescriptionComplete: true,
        jobDescription: 'Replace contactor per manufacturer specs',
        safeWorkPracticesComplete: true,
        safeWorkPractices: 'Arc flash PPE Cat 2, insulated tools',
        shockHazardAnalysisComplete: true,
        shockHazardAnalysis: '480V, 35kA available fault current',
        limitedApproachBoundary: true,
        restrictedApproachBoundary: true,
        prohibitedApproachBoundary: false,
        incidentEnergyComplete: true,
        arcFlashPpeComplete: true,
        arcFlashBoundaryComplete: true,
        flashProtectionBoundary: '4 feet',
        meansToRestrictAccessComplete: true,
        meansToRestrictAccess: 'Barricade tape and signage installed',
        preJobBriefComplete: true,
      },
    };
  }

  private getExcavationSample(): any {
    return {
      date: '2026-02-27',
      time: '07:00',
      workOrder: 'WO-2026-0298',
      supervisor: 'Robert Davis',
      jobLocation: 'East side of cooling tower basin',
      supervisorPhone: '555-0142',
      excavationDescription: 'Trench for new 6-inch cooling water supply line, 4ft deep x 3ft wide x 50ft long',
      typeOfWork: { excavation: true, boring: false, drilling: false, cutting: false, blindPenetration: false },
      locationPipingMarked: true,
      facilityName: 'Unit 1 Cooling Tower Area',
      competentPerson: 'Tom Anderson',
      soilType: 'Type B - Clay loam',
      excavationDepth: '4 ft',
      excavationWidth: '3 ft',
      protectiveSystemType: 'Sloping 1:1',
    };
  }

  private getVentingSample(): any {
    return {
      date: '2026-02-27',
      plantName: 'Voyager Power Station',
      systemName: 'Natural Gas Header B',
      requestingIndividual: 'James Martinez',
      purpose: 'Purge and vent gas header for valve replacement',
      timeCommence: '2026-02-27 06:00',
      timeConclude: '2026-02-27 14:00',
      individualIssuing: 'Mike Johnson (MJ)',
      gasType: 'Natural Gas (Methane)',
      lel: '5%',
      uel: '15%',
      calculatedVolume: '1,200 SCF',
      pressure: '45 PSIG',
      gasIndicatorModel: 'RKI GX-3R PRO',
      gasIndicatorSerial: 'GI-7823',
      calibrationDate: '2026-02-01',
      sdsProvided: true,
      sdsInitials: 'JM',
      radioChannel: 'Channel 3',
      controlRoom: 'Main Control Room',
      osmSupervisor: 'Robert Davis',
      osmDate: '2026-02-27',
    };
  }

  private getWorkRequestSample(): any {
    return {
      dateOfWorkToBePerformed: '2026-02-15',
      timeOfWorkToBePerformed: '07:00',
      requestedBy: 'John Smith',
      company: 'Acme Industrial',
      location: 'Boiler Room B-2',
      affectedEquipment: 'Boiler Feed Pump #3',
      workScope: 'Annual maintenance and bearing replacement on BFP-3. Includes alignment check and vibration analysis.',
      isHotWorkRequired: true,
      foreman: 'Robert Davis',
      fireWatch: 'Sarah Wilson',
      isLotoRequired: true,
      isConfinedSpaceEntryRequired: false,
      space: '',
      status: 'Approved',
    };
  }
}
