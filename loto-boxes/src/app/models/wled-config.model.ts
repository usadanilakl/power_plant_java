/**
 * WLED Hardware Configuration
 */
export interface WLEDHardwareConfig {
  cfg: {
    hw: {
      led: {
        cnt: number;                    // Total LED count
        ins: WLEDStripInput[];          // Input configurations
      };
    };
  };
}

/**
 * WLED Strip Input Configuration
 */
export interface WLEDStripInput {
  pin: number[];      // GPIO pin(s)
  len: number;        // LED count for this strip
}

/**
 * WLED State Update
 */
export interface WLEDStateUpdate {
  on?: boolean;                 // Power on/off
  bri?: number;                 // Brightness (0-255)
  transition?: number;          // Transition time in ms
  seg?: WLEDSegment[] | WLEDIndividualLEDControl;  // Segments or individual LED control
}

/**
 * WLED Individual LED Control
 * Used to bypass segment limit by controlling individual LEDs
 */
export interface WLEDIndividualLEDControl {
  i: (number | string)[];       // Array of [index, "RRGGBB", index, "RRGGBB", ...]
}

/**
 * WLED Segment
 */
export interface WLEDSegment {
  id: number;                   // Segment ID
  start: number;                // First LED index
  stop: number;                 // Last LED index + 1 (exclusive)
  col: number[][];              // Array of [R, G, B] arrays
  bri?: number;                 // Segment brightness override
}

/**
 * WLED Controller Info
 */
export interface WLEDControllerInfo {
  id: number;                   // Controller ID (1-2)
  ip: string;                   // IP address
  name: string;                 // Controller name
  strips: number[];             // Strip numbers (0-2 for controller 1, 3-5 for controller 2)
  online: boolean;              // Reachability status
  lastPing?: Date;              // Last successful ping
  responseTime?: number;        // Response time in ms
}

/**
 * ESP Device Configuration
 */
export interface ESPDeviceConfig {
  id: number;
  name: string;
  ipAddress: string;
  isActive: boolean;
  description?: string;
  strips: LEDStripConfig[];
}

/**
 * LED Strip Configuration
 */
export interface LEDStripConfig {
  id?: number;
  espDeviceId: number;
  stripNumber: number;          // 0, 1, 2 per ESP
  gpioPin: number;              // GPIO pin number
  totalLeds: number;            // Total LEDs on this strip
  description?: string;

  // WLED Configuration
  ledType: string;              // WS281x, SK6812, etc.
  milliampsPerLed: number;      // Current per LED
  colorOrder: string;           // GRB, RGB, BRG, etc.
  startLed: number;             // Start LED index
  reversed: boolean;            // Reverse LED order
  skipFirstLeds: number;        // Skip first N LEDs
  offRefreshRate: number;       // Off refresh rate (ms)
}
