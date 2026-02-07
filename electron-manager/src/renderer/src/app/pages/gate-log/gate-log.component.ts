import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GateLogPerson {
  name: string;
  company: string;
  checkIn: string;
  checkOut?: string;
  location: string;
}

@Component({
  selector: 'app-gate-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Gate Log</h1>
        <div class="actions">
          <button class="btn btn-secondary" (click)="refresh()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Summary card -->
      <div class="summary-row">
        <div class="summary-card">
          <span class="summary-number">{{ people.length }}</span>
          <span class="summary-label">People on Site</span>
        </div>
        <div class="summary-card">
          <span class="summary-number">{{ uniqueCompanies }}</span>
          <span class="summary-label">Companies</span>
        </div>
        <div class="summary-card">
          <span class="summary-number">{{ lastUpdate || '--' }}</span>
          <span class="summary-label">Last Updated</span>
        </div>
      </div>

      <div class="notice" *ngIf="!configured">
        <span class="notice-icon">&#x2139;</span>
        <div>
          <strong>Not Configured</strong>
          <p>Gate Log requires OnLocation API credentials to be configured.
             This will connect to the site gate system to track personnel on site.</p>
        </div>
      </div>

      <!-- People table -->
      <div class="table-container" *ngIf="configured && people.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let person of people">
              <td>{{ person.name }}</td>
              <td>{{ person.company }}</td>
              <td>{{ person.checkIn }}</td>
              <td>{{ person.checkOut || '--' }}</td>
              <td>{{ person.location }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .summary-number {
      font-size: 28px;
      font-weight: 700;
      color: var(--accent-primary);
    }

    .summary-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      color: var(--text-secondary);
    }

    .notice-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .notice strong {
      color: var(--accent-primary);
      display: block;
      margin-bottom: 4px;
    }

    .notice p {
      font-size: 13px;
      margin: 0;
    }

    .table-container {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
    }

    .data-table td {
      padding: 10px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover td {
      background-color: rgba(255, 255, 255, 0.02);
    }
  `]
})
export class GateLogComponent {
  people: GateLogPerson[] = [];
  loading = false;
  configured = false; // Will be true once OnLocation API is configured
  lastUpdate = '';

  get uniqueCompanies(): number {
    return new Set(this.people.map(p => p.company)).size;
  }

  async refresh(): Promise<void> {
    this.loading = true;
    // TODO: Call IPC to fetch gate log data from OnLocation
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
}
