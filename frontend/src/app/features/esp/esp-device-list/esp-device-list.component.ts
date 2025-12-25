import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EspDeviceDto } from '../../../models/esp/esp-device.model';
import { EspDeviceService } from './esp-device.service';

@Component({
  selector: 'app-esp-device-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './esp-device-list.component.html',
  styleUrl: './esp-device-list.component.css'
})
export class EspDeviceListComponent implements OnInit {
  private espDeviceService = inject(EspDeviceService);

  devices = signal<EspDeviceDto[]>([]);
  isLoading = signal<boolean>(false);
  statusMessage = signal<string>('');
  selectedDevice = signal<EspDeviceDto | null>(null);
  deviceStatuses = signal<Map<number, { reachable: boolean; checking: boolean }>>(new Map());

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.isLoading.set(true);
    this.espDeviceService.getAllEspDevices().subscribe({
      next: (response) => {
        const devices = response.responseData.map(device => EspDeviceDto.fromJson(device));
        this.devices.set(devices);
        this.isLoading.set(false);
        this.statusMessage.set(`Loaded ${devices.length} ESP devices`);

        // Check connection status for all devices
        devices.forEach(device => this.checkDeviceConnection(device));
      },
      error: (error) => {
        console.error('Error loading ESP devices:', error);
        this.isLoading.set(false);
        this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
      }
    });
  }

  checkDeviceConnection(device: EspDeviceDto) {
    if (!device.id) return;

    const statusMap = new Map(this.deviceStatuses());
    statusMap.set(device.id, { reachable: false, checking: true });
    this.deviceStatuses.set(statusMap);

    this.espDeviceService.checkConnection(device.id).subscribe({
      next: (response) => {
        const statusMap = new Map(this.deviceStatuses());
        statusMap.set(device.id!, { reachable: response.responseData, checking: false });
        this.deviceStatuses.set(statusMap);
      },
      error: (error) => {
        const statusMap = new Map(this.deviceStatuses());
        statusMap.set(device.id!, { reachable: false, checking: false });
        this.deviceStatuses.set(statusMap);
      }
    });
  }

  initializeDevice(device: EspDeviceDto) {
    if (!device.id) return;

    this.statusMessage.set(`Initializing ${device.name}...`);
    this.espDeviceService.initializeEspDevice(device.id).subscribe({
      next: (response) => {
        this.statusMessage.set(response.message);
      },
      error: (error) => {
        this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
      }
    });
  }

  turnOffLeds(device: EspDeviceDto) {
    if (!device.id) return;

    this.statusMessage.set(`Turning off LEDs on ${device.name}...`);
    this.espDeviceService.turnOffAllLeds(device.id).subscribe({
      next: (response) => {
        this.statusMessage.set(response.message);
      },
      error: (error) => {
        this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
      }
    });
  }

  initializeAllDevices() {
    this.statusMessage.set('Initializing all ESP devices...');
    this.espDeviceService.initializeAllEspDevices().subscribe({
      next: (response) => {
        this.statusMessage.set(response.message);
        this.loadDevices();
      },
      error: (error) => {
        this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
      }
    });
  }

  toggleActive(device: EspDeviceDto) {
    if (!device.id) return;

    device.isActive = !device.isActive;
    this.espDeviceService.updateEspDevice(device.id, device).subscribe({
      next: (response) => {
        this.statusMessage.set(response.message);
        this.loadDevices();
      },
      error: (error) => {
        device.isActive = !device.isActive; // Revert on error
        this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
      }
    });
  }

  getDeviceStatus(deviceId: number | undefined): { reachable: boolean; checking: boolean } {
    if (!deviceId) return { reachable: false, checking: false };
    return this.deviceStatuses().get(deviceId) || { reachable: false, checking: false };
  }

  selectDevice(device: EspDeviceDto) {
    this.selectedDevice.set(device);
  }
}
