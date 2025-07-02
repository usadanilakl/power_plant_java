import { ValueDto } from '../value.model';
import { LotoPointDto } from '../loto/loto-point.model';
import { RectangleShape } from '../shape.model';
import { BaseDto, BaseModel } from '../base/base.model';
import { ValidatorFn, Validators } from '@angular/forms';
import { Option } from '../option.model';
import { EquipmentIdDto } from './equipment-id.model';

export type EquipmentFieldName = keyof EquipmentModel;

export interface EquipmentFormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multi-select';
  validators?: ValidatorFn[];
  options?: { value: string; label: string }[];
  initialValue?: any;
}

export interface EquipmentModel extends BaseModel  {
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqType: ValueDto;
  files: string[];
  vendor: ValueDto;
  location: ValueDto;
  system: ValueDto;
  coordinates: string;
  originalPictureSize: string;
  mainFile: string;
  lotoPoints: LotoPointDto[];
  isUpdated: string;
  conflictStatus: string;
  isVerified: boolean;
}

export class EquipmentDto extends BaseDto implements EquipmentModel {
  tagNumber: string;
  description: string;
  specificLocation: string;
  eqType: ValueDto;
  files: string[];
  vendor: ValueDto;
  location: ValueDto;
  system: ValueDto;
  coordinates: string;
  originalPictureSize: string;
  mainFile: string;
  lotoPoints: LotoPointDto[];
  isUpdated: string;
  conflictStatus: string;
  isVerified: boolean;

  constructor(data: Partial<EquipmentModel> = {}) {
    super(data);
    this.tagNumber = data.tagNumber || '';
    this.description = data.description || '';
    this.specificLocation = data.specificLocation || '';
    this.eqType = data.eqType || new ValueDto();
    this.files = data.files || [];
    this.vendor = data.vendor || new ValueDto();
    this.location = data.location || new ValueDto();
    this.system = data.system || new ValueDto();
    this.coordinates = data.coordinates || '';
    this.originalPictureSize = data.originalPictureSize || '';
    this.mainFile = data.mainFile || '';
    this.lotoPoints = data.lotoPoints || [];
    this.isUpdated = data.isUpdated || '';
    this.conflictStatus = data.conflictStatus || '';
    this.isVerified = data.isVerified || false;
  }

  // Serialization method
  override toJson(): any {
    return {
      tagNumber: this.tagNumber || '',
      description: this.description || '',
      specificLocation: this.specificLocation || '',
      eqType: this.eqType ? this.eqType.toJson() : null,
      files: Array.isArray(this.files) ? this.files : [],
      vendor: this.vendor ? this.vendor.toJson() : null,
      location: this.location ? this.location.toJson() : null,
      system: this.system ? this.system.toJson() : null,
      coordinates: this.coordinates || '',
      originalPictureSize: this.originalPictureSize || '',
      mainFile: this.mainFile || '',
      lotoPoints: this.lotoPoints.map(point => point ? point.toJson() : null).filter(Boolean),
      isUpdated: this.isUpdated || '',
      conflictStatus: this.conflictStatus || '',
      isVerified: this.isVerified || false
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): EquipmentDto {
    if (!json) {
      console.warn('Received null or undefined json in EquipmentDto.fromJson');
      return new EquipmentDto();
    }

    return new EquipmentDto({
      tagNumber: json.tagNumber || '',
      description: json.description || '',
      specificLocation: json.specificLocation || '',
      eqType: json.eqType ? ValueDto.fromJson(json.eqType) : new ValueDto(),
      files: Array.isArray(json.files) ? json.files : [],
      vendor: json.vendor ? ValueDto.fromJson(json.vendor) : new ValueDto(),
      location: json.location ? ValueDto.fromJson(json.location) : new ValueDto(),
      system: json.system ? ValueDto.fromJson(json.system) : new ValueDto(),
      coordinates: json.coordinates || '',
      originalPictureSize: json.originalPictureSize || '',
      mainFile: json.mainFile || '',
      lotoPoints: json.lotoPoints ? json.lotoPoints.map((point: any) => LotoPointDto.fromJson(point)) : [],
      isUpdated: json.isUpdated || '',
      conflictStatus: json.conflictStatus || '',
      isVerified: json.isVerified || false
    });
  }

  

  toIdModel(): EquipmentIdDto {
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
      mainFile: this.mainFile,
      lotoPointIds: this.lotoPoints.map(point => point.id),
      isUpdated: this.isUpdated,
      conflictStatus: this.conflictStatus,
      isVerified: this.isVerified
    });
  }

  toShapeObject(): RectangleShape {
    try {
      // Remove any backslashes and outer quotes if present
      const cleanedCoords = this.coordinates.replace(/\\/g, '').replace(/^"(.*)"$/, '$1');
  
      // Try parsing as JSON, if it fails, split by commas
      let coordsObj;
      try {
        coordsObj = JSON.parse(cleanedCoords);
      } catch {
        const parts = cleanedCoords.split(',');
        coordsObj = {
          startX: parts[0].split(':')[1],
          startY: parts[1].split(':')[1],
          endX: parts[2].split(':')[1],
          endY: parts[3].split(':')[1],
          width: parts[4].split(':')[1],
          height: parts[5].split(':')[1]
        };
      }
  
      const startX = Number(coordsObj.startX);
      const startY = Number(coordsObj.startY);
      const endX = Number(coordsObj.endX);
      const endY = Number(coordsObj.endY);
  
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        throw new Error('Invalid coordinate values');
      }
  
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
  
      const sizeMatch = this.originalPictureSize.match(/width:(\d+),height:(\d+)/);
      if (!sizeMatch) {
        throw new Error('Invalid original picture size format');
      }
      
      const originalWidth = Number(sizeMatch[1]);
      const originalHeight = Number(sizeMatch[2]);
      
      if (isNaN(originalWidth) || isNaN(originalHeight)) {
        throw new Error('Invalid original picture size values');
      }
  
      return {
        id: this.id,
        type: 'rectangle',
        color: this.getShapeColor(),
        originalPictureWidth: originalWidth,
        originalPictureHeight: originalHeight,
        isSelected: false,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width,
        height,
        scaleToCurrentImage: 1,
        currentImgHeigth: 1,
        currentImgWidth: 1
      };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      // Return a default shape or handle the error as appropriate for your application
      return {
        id: this.id,
        type: 'rectangle',
        color: '#FF0000',
        originalPictureWidth: 0,
        originalPictureHeight: 0,
        isSelected: false,
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

  static createEquipmentFromShape(shape: RectangleShape): EquipmentDto {
    if (shape.type !== 'rectangle') {
      throw new Error('Only rectangle shapes are supported for equipment');
    }
  
    const coordinates = JSON.stringify({
      startX: shape.x,
      startY: shape.y,
      endX: shape.x + shape.width,
      endY: shape.y + shape.height,
      width: shape.width,
      height: shape.height
    })
    .replace(/^"|"$/g, '')
    .replace(/\\/g, '');  
  
    const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;
  
    return new EquipmentDto({
      id: shape.id,
      tagNumber: `EQ-${shape.id}`, // Generate a default tag number
      description: `Equipment ${shape.id}`, // Generate a default description
      specificLocation: '',
      eqType: new ValueDto(),
      files: [],
      vendor: new ValueDto(),
      location: new ValueDto(),
      system: new ValueDto(),
      coordinates: coordinates,
      originalPictureSize: originalPictureSize,
      mainFile: '',
      lotoPoints: [],
      isUpdated: '',
      conflictStatus: '',
      isVerified: false,
      name: `Equipment ${shape.id}`,
      objectType: 'Equipment'
    });
  }
  private getShapeColor(): string {
    // Example: color based on equipment type
    switch (this.getNormalLotoPosition().toLowerCase().trim()) {
      case 'open':
        return '#FF0000'; // Red
      case 'closed':
        return '#00FF00'; // Green
      case 'auto':
        return '#FFFF00'; // Yellow
      default:
        return '#0000FF'; // Blue as default
    }
  }

  private getNormalLotoPosition(): string {
    if (this.lotoPoints && this.lotoPoints.length > 0) {
      const firstLotoPoint = this.lotoPoints[0];
      if (firstLotoPoint && firstLotoPoint.normPos && firstLotoPoint.normPos.name) {
        return firstLotoPoint.normPos.name;
      }
    }
    return '';
  }

    static isValidKey(key: string): key is keyof EquipmentModel {
      const validKeys: (keyof EquipmentModel)[] = [
        'id', 'tagNumber', 'description', 'specificLocation', 'eqType',
        'files', 'vendor', 'location', 'system', 'coordinates',
        'originalPictureSize', 'mainFile', 'lotoPoints', 'isUpdated',
        'conflictStatus', 'isVerified'
      ];
      return validKeys.includes(key as keyof EquipmentModel);
    }

  static toFormFields(
    dto: EquipmentDto,
    eqTypeOptions: Option[],
    vendorOptions: Option[],
    locationOptions: Option[],
    systemOptions: Option[],
    fields: EquipmentFieldName[] = ['tagNumber', 'description', 'specificLocation', 'eqType', 'vendor', 'location', 'system']
  ): EquipmentFormField[] {
    const allFields: { [key in EquipmentFieldName]: EquipmentFormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      tagNumber: { name: 'tagNumber', label: 'Tag Number', type: 'text', validators: [Validators.required], initialValue: dto.tagNumber },
      description: { name: 'description', label: 'Description', type: 'text', validators: [Validators.required], initialValue: dto.description },
      specificLocation: { name: 'specificLocation', label: 'Specific Location', type: 'text', initialValue: dto.specificLocation },
      eqType: {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: eqTypeOptions,
        initialValue: dto.eqType?.id || null
      },
      files: { name: 'files', label: 'Files', type: 'multi-select', initialValue: dto.files },
      vendor: {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: vendorOptions,
        initialValue: dto.vendor?.id || null
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: locationOptions,
        initialValue: dto.location?.id || null
      },
      system: {
        name: 'system',
        label: 'System',
        type: 'select',
        options: systemOptions,
        initialValue: dto.system?.id || null
      },
      coordinates: { name: 'coordinates', label: 'Coordinates', type: 'text', initialValue: dto.coordinates },
      originalPictureSize: { name: 'originalPictureSize', label: 'Original Picture Size', type: 'text', initialValue: dto.originalPictureSize },
      mainFile: { name: 'mainFile', label: 'Main File', type: 'text', initialValue: dto.mainFile },
      lotoPoints: { name: 'lotoPoints', label: 'LOTO Points', type: 'multi-select', initialValue: dto.lotoPoints.map(point => point.id) },
      isUpdated: { name: 'isUpdated', label: 'Is Updated', type: 'text', initialValue: dto.isUpdated },
      conflictStatus: { name: 'conflictStatus', label: 'Conflict Status', type: 'text', initialValue: dto.conflictStatus },
      isVerified: { 
        name: 'isVerified', 
        label: 'Is Verified', 
        type: 'select', 
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ], 
        initialValue: dto.isVerified.toString() 
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType }
    };
  
    return fields.map(fieldName => allFields[fieldName]);
  }

  // static override removeDefaultValues(equipment: EquipmentDto): Partial<EquipmentModel> {
  //   const result: Partial<EquipmentModel> = {};
  
  //   // Helper function to check if a value is "empty"
  //   const isEmpty = (value: any): boolean => {
  //     if (value === null || value === undefined) return true;
  //     if (typeof value === 'string' && value.trim() === '') return true;
  //     if (Array.isArray(value) && value.length === 0) return true;
  //     if (typeof value === 'object') {
  //       if ('id' in value && value.id !== 0) return false;
  //     }
  //     return false;
  //   };
  
  //   // Check each property and add to result if not empty
  //   if (!isEmpty(equipment.id) && equipment.id !== 0) result.id = equipment.id;
  //   if (!isEmpty(equipment.tagNumber)) result.tagNumber = equipment.tagNumber;
  //   if (!isEmpty(equipment.description)) result.description = equipment.description;
  //   if (!isEmpty(equipment.specificLocation)) result.specificLocation = equipment.specificLocation;
  //   if (!isEmpty(equipment.eqType) && !isEmpty(equipment.eqType.id)) result.eqType = equipment.eqType;
  //   if (!isEmpty(equipment.files)) result.files = equipment.files;
  //   if (!isEmpty(equipment.vendor) && !isEmpty(equipment.vendor.id)) result.vendor = equipment.vendor;
  //   if (!isEmpty(equipment.location) && !isEmpty(equipment.location.id)) result.location = equipment.location;
  //   if (!isEmpty(equipment.system) && !isEmpty(equipment.system.id)) result.system = equipment.system;
  //   if (!isEmpty(equipment.coordinates)) result.coordinates = equipment.coordinates;
  //   if (!isEmpty(equipment.originalPictureSize)) result.originalPictureSize = equipment.originalPictureSize;
  //   if (!isEmpty(equipment.mainFile)) result.mainFile = equipment.mainFile;
  //   if (!isEmpty(equipment.lotoPoints)) result.lotoPoints = equipment.lotoPoints;
  //   if (!isEmpty(equipment.isUpdated)) result.isUpdated = equipment.isUpdated;
  //   if (!isEmpty(equipment.conflictStatus)) result.conflictStatus = equipment.conflictStatus;
  //   if (equipment.isVerified !== false) result.isVerified = equipment.isVerified;
  //   if (!isEmpty(equipment.name)) result.name = equipment.name;
  //   if (!isEmpty(equipment.objectType)) result.objectType = equipment.objectType;
  
  //   return result;
  // }
    
}