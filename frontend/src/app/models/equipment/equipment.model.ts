import { ValueDto } from '../value.model';
import { LotoPointDto } from '../loto/loto-point.model';
import { RectangleShape } from '../shape.model';
import { BaseDto, BaseModel } from '../base/base.model';

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
  lotoPoints: Set<LotoPointDto>;
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
  lotoPoints: Set<LotoPointDto>;
  isUpdated: string;
  conflictStatus: string;
  isVerified: boolean;

  constructor(data: Partial<EquipmentModel> = {}) {
    super();
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
    this.lotoPoints = data.lotoPoints || new Set<LotoPointDto>();
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
      lotoPoints: Array.from(this.lotoPoints || []).map(point => point ? point.toJson() : null).filter(Boolean),
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
      lotoPoints: new Set(Array.isArray(json.lotoPoints) 
        ? json.lotoPoints.map((point: any) => LotoPointDto.fromJson(point))
        : []),
      isUpdated: json.isUpdated || '',
      conflictStatus: json.conflictStatus || '',
      isVerified: json.isVerified || false
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
        type: 'rectangle',
        color: this.getShapeColor(),
        originalPictureWidth: originalWidth,
        originalPictureHeight: originalHeight,
        isSelected: false,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width,
        height
      };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      // Return a default shape or handle the error as appropriate for your application
      return {
        type: 'rectangle',
        color: '#FF0000',
        originalPictureWidth: 0,
        originalPictureHeight: 0,
        isSelected: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }
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
    // Example: position based on loto points
    if (this.lotoPoints.size > 0) {
      const firstLotoPoint = Array.from(this.lotoPoints)[0];
      return firstLotoPoint.normPos.name;
    }
    return '';
  }

  // You can add methods here for any equipment-specific operations
}