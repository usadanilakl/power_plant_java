
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupService } from '../../services/backup.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit {
  backups: string[] = [];
  newBackupName: string = '';
  selectedBackup: string = '';
  message: string = '';

  constructor(private backupService: BackupService) {}

  ngOnInit() {
    this.loadBackups();
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
}
