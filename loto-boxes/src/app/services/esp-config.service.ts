import { Injectable } from '@angular/core';
import { WLEDService } from './wled.service';
import { WLEDHardwareConfig } from '../models/wled-config.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspConfigService {
  constructor(private wledService: WLEDService) {}

  /**
   * Configure Controller 1 (strips 0, 1, 2)
   * Pins: 4, 12, 16
   * Lengths: 240, 237, 237
   */
  configureController1(): Observable<any> {
    const config: WLEDHardwareConfig = {
      cfg: {
        hw: {
          led: {
            cnt: 714, // 240 + 237 + 237
            ins: [
              { pin: [4], len: 240 },
              { pin: [12], len: 237 },
              { pin: [16], len: 237 }
            ]
          }
        }
      }
    };
    return this.wledService.configureHardware(1, config);
  }

  /**
   * Configure Controller 2 (strips 3, 4, 5)
   * Pins: 4, 12, 16
   * Lengths: 245, 245, 260
   */
  configureController2(): Observable<any> {
    const config: WLEDHardwareConfig = {
      cfg: {
        hw: {
          led: {
            cnt: 750, // 245 + 245 + 260
            ins: [
              { pin: [4], len: 245 },
              { pin: [12], len: 245 },
              { pin: [16], len: 260 }
            ]
          }
        }
      }
    };
    return this.wledService.configureHardware(2, config);
  }
}