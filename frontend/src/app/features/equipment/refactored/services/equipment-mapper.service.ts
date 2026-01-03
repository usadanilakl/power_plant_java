import { Injectable } from "@angular/core";
import { EquipmentDto, EquipmentModel } from "../../../../models/equipment/equipment.model";
import { RfShape, RfRectangleShape } from "../../../../shared/image/refactored/models/fr-shape.model";

@Injectable({
    providedIn: 'root'
})
export class EquipmentMapperService{

    mapAllToRfShapes(equipment: EquipmentModel[]): RfShape[] {
        return equipment
            .map(eq => this.mapToRfShape(eq))
            .filter((shape): shape is RfShape => shape !== null);
    }

    mapToRfShape(equipment: EquipmentModel, options?: {
        shouldHighlight?: boolean;
        highlightColor?: string;
        defaultColor?: string;
    }): RfShape | null {
        if (!equipment.coordinates || !equipment.originalPictureSize) {
            return null;
        }

        try {
            const coordinates = this.parseCoordinates(equipment.coordinates);
            const pictureSize = this.parsePictureSize(equipment.originalPictureSize);

            if (!coordinates || !pictureSize) {
                return null;
            }

            // Validate coordinates - all must be non-zero
            if (!coordinates.startX || !coordinates.startY || !coordinates.endX || !coordinates.endY) {
                console.warn('[mapToRfShape] Invalid coordinates:', {
                    equipmentId: equipment.id,
                    rawCoordinates: equipment.coordinates,
                    parsed: coordinates
                });
                return null;
            }

            // Validate picture size
            if (!pictureSize.width || !pictureSize.height) {
                console.warn('[mapToRfShape] Invalid picture size:', {
                    equipmentId: equipment.id,
                    rawSize: equipment.originalPictureSize,
                    parsed: pictureSize
                });
                return null;
            }

            // Calculate x, y, width, height from start/end coordinates
            const x = Math.min(coordinates.startX, coordinates.endX);
            const y = Math.min(coordinates.startY, coordinates.endY);
            const width = coordinates.width;
            const height = coordinates.height;

            // Validate that width and height are non-zero
            if (width === 0 || height === 0) {
                console.warn('[mapToRfShape] Zero width or height:', {
                    equipmentId: equipment.id,
                    width,
                    height,
                    coordinates
                });
                return null;
            }

            // Determine color
            let color: string;
            if (options?.shouldHighlight) {
                color = options.highlightColor || '#ff0000';
            } else if (options?.defaultColor) {
                color = options.defaultColor;
            } else {
                color = this.getShapeColor(equipment);
            }

            const shape: RfRectangleShape = {
                id: equipment.id || 0,
                fileId: equipment.mainFileId || (equipment as any).mainFileObject?.id || 0,
                type: 'rectangle',
                color: color,
                originalPictureWidth: pictureSize.width,
                originalPictureHeight: pictureSize.height,
                originalWidth: pictureSize.width,  // Use picture size, not shape dimensions
                originalHeight: pictureSize.height,  // Use picture size, not shape dimensions
                isSelected: false,
                isBulkSelected: options?.shouldHighlight || false,
                currentImgWidth: pictureSize.width,
                currentImgHeigth: pictureSize.height,
                scaleToCurrentImage: 1,
                x: x,
                y: y,
                width: width,
                height: height,
                rotation: equipment.rotation !== undefined && equipment.rotation !== null
                    ? equipment.rotation
                    : (coordinates.rotation !== undefined ? coordinates.rotation : 0)
            };

            return shape;
        } catch (error) {
            console.error('Error mapping equipment to RfShape:', error);
            return null;
        }
    }

    private parseCoordinates(coordinatesStr: string): { startX: number; startY: number; endX: number; endY: number; width: number; height: number; rotation?: number } | null {
        try {
            if (!coordinatesStr) {
                return null;
            }

            // Remove backslashes, quotes, and curly braces for flexible parsing
            const cleanedCoords = coordinatesStr
                .replace(/\\/g, '')
                .replace(/^"(.*)"$/, '$1')
                .replace(/[{}]/g, '')
                .trim();

            let coordsObj: any = {};

            // Try JSON parse first
            try {
                const jsonStr = cleanedCoords.startsWith('{') ? cleanedCoords : `{${cleanedCoords}}`;
                coordsObj = JSON.parse(jsonStr);
            } catch {
                // Fall back to key:value parsing (case-insensitive)
                const parts = cleanedCoords.split(',');
                parts.forEach(part => {
                    const [key, value] = part.split(':');
                    if (key && value) {
                        const normalizedKey = key.trim().toLowerCase();
                        const parsedValue = parseFloat(value.trim());
                        if (!isNaN(parsedValue)) {
                            coordsObj[normalizedKey] = parsedValue;
                        }
                    }
                });
            }

            // Normalize keys to lowercase for consistent access
            const normalizedObj: any = {};
            for (const key in coordsObj) {
                normalizedObj[key.toLowerCase()] = coordsObj[key];
            }

            const startX = Number(normalizedObj.startx);
            const startY = Number(normalizedObj.starty);
            const endX = Number(normalizedObj.endx);
            const endY = Number(normalizedObj.endy);

            if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
                console.warn('Invalid coordinate values:', { coordinatesStr, normalizedObj });
                return null;
            }

            // ALWAYS calculate width and height from endX/endY - startX/startY
            // Don't trust stored width/height values as they may be incorrect
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);

            return {
                startX,
                startY,
                endX,
                endY,
                width,
                height,
                rotation: normalizedObj.rotation !== undefined ? Number(normalizedObj.rotation) : undefined
            };
        } catch (error) {
            console.error('Error parsing coordinates:', { coordinatesStr, error });
            return null;
        }
    }

    private parsePictureSize(pictureSizeStr: string): { width: number; height: number } | null {
        try {
            if (!pictureSizeStr) {
                return null;
            }

            // Remove curly braces if present for flexible parsing
            const cleanedString = pictureSizeStr.replace(/[{}]/g, '').trim();

            // Try regex match first (faster for standard format)
            const sizeMatch = cleanedString.match(/width:(\d+(?:\.\d+)?),\s*height:(\d+(?:\.\d+)?)/i);
            if (sizeMatch) {
                const width = Number(sizeMatch[1]);
                const height = Number(sizeMatch[2]);

                if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                    return { width, height };
                }
            }

            // Fall back to key:value parsing (case-insensitive)
            const parts = cleanedString.split(',');
            const size: any = {};

            parts.forEach(part => {
                const [key, value] = part.split(':');
                if (key && value) {
                    const normalizedKey = key.trim().toLowerCase();
                    const parsedValue = parseFloat(value.trim());
                    if (!isNaN(parsedValue)) {
                        size[normalizedKey] = parsedValue;
                    }
                }
            });

            const width = size.width;
            const height = size.height;

            if (width && height && !isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                return { width, height };
            }

            console.warn('Invalid picture size format:', pictureSizeStr);
            return null;
        } catch (error) {
            console.error('Error parsing picture size:', { pictureSizeStr, error });
            return null;
        }
    }

    private getShapeColor(equipment: EquipmentModel): string {
        // Determine color based on LOTO position or other equipment properties
        if (equipment.lotoPoints && equipment.lotoPoints.length > 0) {
            const firstLotoPoint = equipment.lotoPoints[0];
            if (firstLotoPoint?.normPos?.name) {
                switch (firstLotoPoint.normPos.name.toLowerCase().trim()) {
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
        }
        return '#0000FF'; // Blue as default
    }

    /**
     * Converts RfShape to coordinates string format
     * Returns string like: {startX:10,startY:20,endX:100,endY:80,width:90,height:60}
     */
    mapRfShapeToCoordinates(shape: RfShape): string {
        if (shape.type === 'rectangle') {
            const rect = shape as RfRectangleShape;
            const startX = rect.x;
            const startY = rect.y;
            const endX = rect.x + rect.width;
            const endY = rect.y + rect.height;

            return JSON.stringify({
                startX,
                startY,
                endX,
                endY,
                width: rect.width,
                height: rect.height,
                rotation: rect.rotation || 0
            });
        }
        // For other shape types, we'll need to add support as needed
        // For now, return empty object
        return '{}';
    }

    /**
     * Formats picture size from shape dimensions
     * Returns string like: width:1920,height:1080
     */
    formatPictureSize(width: number, height: number): string {
        return `width:${width},height:${height}`;
    }

    shapeToEquipment(shape: RfShape): EquipmentDto | null {
        if(shape.type !== 'rectangle') return null;
        const coordinates = this.mapRfShapeToCoordinates(shape);
        if(!coordinates) return null;
        const pictureSize = this.formatPictureSize(shape.originalWidth, shape.originalHeight);
        const rect = shape as RfRectangleShape;
        const equipment: EquipmentDto = new EquipmentDto({
            coordinates: coordinates,
            originalPictureSize: pictureSize,
            rotation: rect.rotation || 0,
            mainFileId: shape.fileId
        })
        return equipment;
    }
}