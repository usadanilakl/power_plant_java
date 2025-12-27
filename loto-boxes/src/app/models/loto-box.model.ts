/**
 * LOTO Box Status Enum
 */
export enum LotoBoxStatus {
  BUILDING = 'building',
  TEST = 'test',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

/**
 * RGB Color Interface
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Status to Color Mapping
 */
export const STATUS_COLORS: Record<LotoBoxStatus, RGBColor> = {
  [LotoBoxStatus.BUILDING]: { r: 0, g: 255, b: 0 },    // Green
  [LotoBoxStatus.TEST]: { r: 255, g: 255, b: 0 },      // Yellow
  [LotoBoxStatus.ACTIVE]: { r: 255, g: 0, b: 0 },      // Red
  [LotoBoxStatus.CLOSED]: { r: 0, g: 0, b: 32 }        // Dark Blue
};

/**
 * LOTO Box Model
 */
export interface LotoBox {
  number: number;           // Box number (1-72)
  strip: number;            // LED strip number (0-5)
  rangeStart: number;       // Starting LED index on strip
  rangeEnd: number;         // Ending LED index on strip
  r: number;                // Red value (0-255)
  g: number;                // Green value (0-255)
  b: number;                // Blue value (0-255)
  brightness: number;       // Brightness (0-255)
  status?: LotoBoxStatus;   // Current status
  online?: boolean;         // Controller reachable
  pendingSync?: boolean;    // Has queued updates
  lastUpdated?: Date;       // Last update timestamp
}

/**
 * Box Update Request
 */
export interface BoxUpdateRequest {
  boxNumber: number;
  r: number;
  g: number;
  b: number;
  brightness: number;
  status?: LotoBoxStatus;
}

/**
 * Bulk Update Request
 */
export interface BulkUpdateRequest {
  boxNumbers: number[];
  r: number;
  g: number;
  b: number;
  brightness: number;
  status?: LotoBoxStatus;
}
