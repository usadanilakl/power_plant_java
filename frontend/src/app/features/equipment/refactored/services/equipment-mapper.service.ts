import { inject, Injectable } from "@angular/core";
import { EquipmentDto, EquipmentModel } from "../../../../models/equipment/equipment.model";
import { RfShape, RfRectangleShape, SVGSymbolShape } from "../../../../shared/image/refactored/models/fr-shape.model";
import { PIDSymbolsService } from "../../../../shared/image/refactored/services/pid-symbols.service";

@Injectable({
    providedIn: 'root'
})
export class EquipmentMapperService{
    private pidSymbolsService = inject(PIDSymbolsService);

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

            const rotation = equipment.rotation !== undefined && equipment.rotation !== null
                ? equipment.rotation
                : (coordinates.rotation !== undefined ? coordinates.rotation : 0);

            // If equipment has a symbolId, return SVGSymbolShape
            if (equipment.symbolId && equipment.svgPath) {
                // Get original SVG viewbox dimensions from the symbol definition
                const pidSymbol = this.pidSymbolsService.getSymbolById(equipment.symbolId);
                const svgOriginalWidth = pidSymbol?.originalWidth || width;
                const svgOriginalHeight = pidSymbol?.originalHeight || height;

                const symbolShape: SVGSymbolShape = {
                    id: equipment.id || 0,
                    fileId: equipment.mainFileId || (equipment as any).mainFileObject?.id || 0,
                    type: 'svg-symbol',
                    symbolId: equipment.symbolId,
                    svgPath: equipment.svgPath,
                    color: color,
                    originalPictureWidth: pictureSize.width,
                    originalPictureHeight: pictureSize.height,
                    originalWidth: svgOriginalWidth,   // SVG viewbox dimensions for proper scaling
                    originalHeight: svgOriginalHeight,
                    isSelected: false,
                    isBulkSelected: options?.shouldHighlight || false,
                    currentImgWidth: pictureSize.width,
                    currentImgHeigth: pictureSize.height,
                    scaleToCurrentImage: 1,
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    rotation: rotation
                };
                return symbolShape;
            }

            // Default: return rectangle shape
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
                rotation: rotation
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

    /**
     * Equipment shapes are tinted by the energy state implied by their first LOTO
     * point's NORMAL position (normPos). Matching is by the Value's NAME — aliases
     * differ across the Norm/Iso Pos categories (Norm Pos uses NO/NC, Iso Pos uses
     * OPEN/CLOSED), so name is the only consistent key.
     *
     * Buckets — add new position names to the relevant group:
     *   green  = closed / isolated        red  = open & other active states
     *   yellow = automatic control        blue = unknown / unmapped / junk
     */
    private getShapeColor(equipment: EquipmentModel): string {
        const positionName = equipment.lotoPoints?.[0]?.normPos?.name;
        if (!positionName) return '#0000FF'; // Blue — no position set

        // Lowercase, then collapse any run of non-alphanumeric chars (stray
        // replacement chars / periods / double spaces in dirty data such as
        // "CLOSED�" or "�THROTTLED") to a single space, and trim — so
        // those garbled-but-recognisable names still match the right bucket.
        const name = positionName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

        switch (name) {
            // Closed / isolated
            case 'closed':
                return '#00FF00'; // Green

            // Automatic control
            case 'auto':
                return '#FFFF00'; // Yellow

            // Open and other active / non-closed states — all treated alike.
            // (off / racked out / pulled / disabled / bypass live on the Isolated
            //  Position category rather than normPos, but are listed here so the
            //  same mapping works if the colour source is ever switched to isoPos.)
            case 'open':
            case 'throttled':
            case 'on':
            case 'enabled':
            case 'inserted':
            case 'installed':
            case 'racked in':
            case 'removed':
            case 'off':
            case 'racked out':
            case 'pulled':
            case 'disabled':
            case 'bypass':
                return '#FF0000'; // Red

            default:
                return '#0000FF'; // Blue — unknown / unmapped (e.g. "no data")
        }
    }

    /**
     * Converts RfShape to coordinates string format
     * Returns string like: {startX:10,startY:20,endX:100,endY:80,width:90,height:60}
     */
    mapRfShapeToCoordinates(shape: RfShape): string {
        if (shape.type === 'rectangle' || shape.type === 'svg-symbol') {
            const rect = shape as RfRectangleShape | SVGSymbolShape;
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
        if (shape.type !== 'rectangle' && shape.type !== 'svg-symbol') return null;

        const coordinates = this.mapRfShapeToCoordinates(shape);
        if (!coordinates) return null;

        // Use originalPictureWidth/Height (actual image dimensions when shape was created)
        const pictureSize = this.formatPictureSize(shape.originalPictureWidth, shape.originalPictureHeight);

        if (shape.type === 'svg-symbol') {
            const symbol = shape as SVGSymbolShape;
            const equipment: EquipmentDto = new EquipmentDto({
                coordinates: coordinates,
                originalPictureSize: pictureSize,
                rotation: symbol.rotation || 0,
                mainFileId: shape.fileId,
                symbolId: symbol.symbolId,
                svgPath: symbol.svgPath
            });
            return equipment;
        }

        // Default: rectangle shape
        const rect = shape as RfRectangleShape;
        const equipment: EquipmentDto = new EquipmentDto({
            coordinates: coordinates,
            originalPictureSize: pictureSize,
            rotation: rect.rotation || 0,
            mainFileId: shape.fileId
        });
        return equipment;
    }
}