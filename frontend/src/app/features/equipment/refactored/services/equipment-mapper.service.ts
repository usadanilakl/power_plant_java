import { Injectable } from "@angular/core";
import { EquipmentModel } from "../../../../models/equipment/equipment.model";
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

    mapToRfShape(equipment: EquipmentModel): RfShape | null {
        if (!equipment.coordinates || !equipment.originalPictureSize) {
            return null;
        }

        try {
            const coordinates = this.parseCoordinates(equipment.coordinates);
            const pictureSize = this.parsePictureSize(equipment.originalPictureSize);

            if (!coordinates || !pictureSize) {
                return null;
            }

            const shape: RfRectangleShape = {
                id: equipment.id || 0,
                type: 'rectangle',
                color: this.getShapeColor(equipment),
                originalPictureWidth: pictureSize.width,
                originalPictureHeight: pictureSize.height,
                originalWidth: pictureSize.width,
                originalHeight: pictureSize.height,
                isSelected: false,
                isBulkSelected: false,
                currentImgWidth: pictureSize.width,
                currentImgHeigth: pictureSize.height,
                scaleToCurrentImage: 1,
                x: Math.min(coordinates.startX, coordinates.endX),
                y: Math.min(coordinates.startY, coordinates.endY),
                width: coordinates.width,
                height: coordinates.height
            };

            return shape;
        } catch (error) {
            console.error('Error mapping equipment to RfShape:', error);
            return null;
        }
    }

    private parseCoordinates(coordinatesStr: string): { startX: number; startY: number; endX: number; endY: number; width: number; height: number } | null {
        try {
            const cleanedCoords = coordinatesStr.replace(/\\/g, '').replace(/^"(.*)"$/, '$1');

            let coordsObj;
            try {
                coordsObj = JSON.parse(cleanedCoords);
            } catch {
                const parts = cleanedCoords.split(',');
                coordsObj = {
                    startX: parseFloat(parts[0].split(':')[1]),
                    startY: parseFloat(parts[1].split(':')[1]),
                    endX: parseFloat(parts[2].split(':')[1]),
                    endY: parseFloat(parts[3].split(':')[1]),
                    width: parseFloat(parts[4].split(':')[1]),
                    height: parseFloat(parts[5].split(':')[1])
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

            return {
                startX,
                startY,
                endX,
                endY,
                width,
                height
            };
        } catch (error) {
            console.error('Error parsing coordinates:', error);
            return null;
        }
    }

    private parsePictureSize(pictureSizeStr: string): { width: number; height: number } | null {
        try {
            const sizeMatch = pictureSizeStr.match(/width:(\d+),height:(\d+)/);
            if (!sizeMatch) {
                throw new Error('Invalid original picture size format');
            }

            const width = Number(sizeMatch[1]);
            const height = Number(sizeMatch[2]);

            if (isNaN(width) || isNaN(height)) {
                throw new Error('Invalid original picture size values');
            }

            return { width, height };
        } catch (error) {
            console.error('Error parsing picture size:', error);
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
                height: rect.height
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
}