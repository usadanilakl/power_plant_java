
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../services/backup.service';
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterMenuComponent],
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit {
  backups: string[] = [];
  newBackupName: string = '';
  selectedBackup: string = '';
  message: string = '';
  
  sharedDriveBackups: string[] = [];
  newSharedBackupName: string = '';
  selectedSharedBackup: string = '';
  sharedDriveMessage: string = '';

  constructor(private backupService: BackupService) {}

  ngOnInit() {
    this.loadBackups();
    this.loadSharedBackups();
  }

  loadBackups() {
    this.backupService.listBackups().subscribe({
      next: (backups) => this.backups = backups,
      error: (error) => this.message = 'Error loading backups: ' + error.message
    });
  }

  createBackup() {
    this.backupService.backupDatabase(this.newBackupName).subscribe({
      next: (response) => {
        this.message = response;
        this.loadBackups();
        this.newBackupName = '';
      },
      error: (error) => this.message = 'Error creating backup: ' + error.message
    });
  }

  restoreBackup() {
    if (!this.selectedBackup) {
      this.message = 'Please select a backup to restore';
      return;
    }
    this.backupService.restoreDatabase(this.selectedBackup).subscribe({
      next: (response) => this.message = response,
      error: (error) => this.message = 'Error restoring backup: ' + error.message
    });
  }

  loadSharedBackups() {
    this.backupService.listSharedBackups().subscribe({
      next: (backups) => this.sharedDriveBackups = backups,
      error: (error) => this.sharedDriveMessage = 'Error loading backups: ' + error.message
    });
  }


  restoreSharedBackup() {
    if (!this.selectedSharedBackup) {
      this.sharedDriveMessage = 'Please select a backup to restore';
      return;
    }
    this.backupService.restoreSharedDatabase(this.selectedSharedBackup).subscribe({
      next: (response) => this.sharedDriveMessage = response,
      error: (error) => this.sharedDriveMessage = 'Error restoring backup: ' + error.message
    });
  }

  
}
