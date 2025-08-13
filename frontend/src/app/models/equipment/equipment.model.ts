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
  tagNumber: string | null | undefined;
  description: string | null | undefined;
  specificLocation: string | null | undefined;
  eqType: ValueDto | null | undefined;
  files: string[] | null | undefined;
  vendor: ValueDto | null | undefined;
  location: ValueDto | null | undefined
  system: ValueDto | null | undefined;
  coordinates: string | null | undefined;
  originalPictureSize: string | null | undefined;
  mainFile: string | null | undefined;
  mainFileId: number | null | undefined;
  lotoPoints: LotoPointDto[] | null | undefined;
  isUpdated: string | null | undefined;
  conflictStatus: string | null | undefined;
}

export class EquipmentDto extends BaseDto implements EquipmentModel {
  tagNumber: string | null | undefined;
  description: string | null | undefined;
  specificLocation: string | null | undefined;
  eqType: ValueDto | null | undefined;
  files: string[] | null | undefined;
  vendor: ValueDto | null | undefined;
  location: ValueDto | null | undefined;
  system: ValueDto | null | undefined;
  coordinates: string | null | undefined;
  originalPictureSize: string | null | undefined;
  mainFile: string | null | undefined;
  mainFileId: number | null | undefined;
  lotoPoints: LotoPointDto[] | null | undefined;
  isUpdated: string | null | undefined;
  conflictStatus: string | null | undefined;

  constructor(data: Partial<EquipmentModel> = {}) {
    super(data);
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.specificLocation = data.specificLocation ?? null;
    // this.eqType = data.eqType ?? null;
    this.eqType = super.setNestedObjectById(data.eqType,new ValueDto());
    this.files = data.files ?? [];
    // this.vendor = data.vendor ?? null;
    this.vendor = super.setNestedObjectById(data.vendor,new ValueDto());
    this.location = super.setNestedObjectById(data.location,new ValueDto());
    this.system = super.setNestedObjectById(data.system,new ValueDto());
    this.coordinates = data.coordinates ?? null;
    this.originalPictureSize = data.originalPictureSize ?? null;
    this.mainFile = data.mainFile ?? null;
    this.mainFileId = data.mainFileId ?? null;
    this.lotoPoints = data.lotoPoints ?? [];
    this.isUpdated = data.isUpdated ?? null;
    this.conflictStatus = data.conflictStatus ?? null;
  }

  // Serialization method
  override toJson(): any {
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
      mainFile: this.mainFile || null,
      mainFileId: this.mainFileId || null,
      lotoPoints: this.lotoPoints?.map(point => point ? point.toJson() : null).filter(Boolean),
      isUpdated: this.isUpdated || null,
      conflictStatus: this.conflictStatus || null,
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): EquipmentDto {
    if (!json) {
      console.warn('Received null or undefined json in EquipmentDto.fromJson');
      return new EquipmentDto();
    }

    return new EquipmentDto({
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
      mainFile: json.mainFile || null,
      mainFileId: json.mainFileId || null,
      lotoPoints: json.lotoPoints ? json.lotoPoints.map((point: any) => LotoPointDto.fromJson(point)) : null,
      isUpdated: json.isUpdated || null,
      conflictStatus: json.conflictStatus || null,
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
      mainFileId: this.mainFileId,
      lotoPointIds: this.lotoPoints?.map(point => point.id) || null,
      isUpdated: this.isUpdated,
      conflictStatus: this.conflictStatus,
      isVerified: this.isVerified
    });
  }

  toShapeObject(): RectangleShape | null {
    try {
      // Remove any backslashes and outer quotes if present
      const cleanedCoords = this.coordinates?.replace(/\\/g, '').replace(/^"(.*)"$/, '$1');

      if(!cleanedCoords) return null;
  
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
  
      const sizeMatch = this.originalPictureSize?.match(/width:(\d+),height:(\d+)/);
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
    .replace(/\\/g, '')
    .replace(/"(\w+)":/g, '$1:');
      
    const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;

  const newEq = new EquipmentDto({
    coordinates: coordinates,
    originalPictureSize: originalPictureSize,
  });

  
    return newEq;
  }

  setCoordinatesFromShape(shape: RectangleShape): EquipmentDto {
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
      .replace(/\\/g, '')
      .replace(/"(\w+)":/g, '$1:');
        
      const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;

      this.coordinates = coordinates;
      this.originalPictureSize = originalPictureSize;

      return this;
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
      mainFileId: { name: 'mainFileId', label: 'Main File ID', type: 'text', initialValue: dto.mainFileId },
      lotoPoints: { name: 'lotoPoints', label: 'LOTO Points', type: 'multi-select', initialValue: dto.lotoPoints?.map(point => point.id) || null },
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
        initialValue: dto.isVerified?.toString() 
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType }
    };
  
    return fields.map(fieldName => allFields[fieldName]);
  }

  applyPresetValue(equipment: EquipmentDto): EquipmentDto {
    console.log('Applying preset value:', equipment);
    Object.keys(equipment).forEach(key => {
      if (EquipmentDto.isValidKey(key)) {
        const value = equipment[key];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // For nested objects like ValueDto
            if (value.id) {
              (this[key] as any) = value;
            }
          } else {
            (this[key] as any) = value;
          }
        }
      }
    });
    return this;
  }

    
}