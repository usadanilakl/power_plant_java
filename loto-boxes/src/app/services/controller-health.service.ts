import { Injectable, signal } from '@angular/core';
import { interval } from 'rxjs';
import { WLEDService } from './wled.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ControllerHealthService {
  controllerStatus = signal<Map<number, boolean>>(new Map());

  constructor(
    private wledService: WLEDService,
    private logger: LoggerService
  ) {
    this.startPolling();
  }

  startPolling(): void {
    // Poll every 30 seconds
    interval(30000).subscribe(() => {
      this.pollAllControllers();
    });

    // Initial poll
    this.pollAllControllers();
  }

  pollAllControllers(): void {
    const controllers = this.wledService.getControllers();
    controllers.forEach(controller => {
      this.wledService.ping(controller.id).subscribe(online => {
        const status = this.controllerStatus();
        const wasOnline = status.get(controller.id);

        if (wasOnline !== online) {
          if (online) {
            this.logger.success(`Controller ${controller.id} came online`);
          } else {
            this.logger.error(`Controller ${controller.id} went offline`);
          }
        }

        status.set(controller.id, online);
        this.controllerStatus.set(new Map(status));
      });
    });
  }

  isControllerOnline(controllerId: number): boolean {
    return this.controllerStatus().get(controllerId) || false;
  }
}