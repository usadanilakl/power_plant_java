import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pjm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 class="page-title">PJM Monitoring</h1>

      <!-- LMP Price display -->
      <div class="price-panel">
        <div class="price-header">
          <span class="price-label">Current LMP</span>
          <span class="price-unit">$/MWh</span>
        </div>
        <div class="price-value">{{ lmpPrice || '--' }}</div>
        <span class="price-updated">{{ lastUpdate || 'Not connected' }}</span>
      </div>

      <!-- Info cards -->
      <div class="info-row">
        <div class="info-card">
          <span class="info-label">Pricing Node</span>
          <span class="info-value">JPOWER (ComEd)</span>
        </div>
        <div class="info-card">
          <span class="info-label">Zone</span>
          <span class="info-value">ComEd</span>
        </div>
        <div class="info-card">
          <span class="info-label">Update Interval</span>
          <span class="info-value">5 min</span>
        </div>
      </div>

      <div class="notice">
        <span class="notice-icon">&#x2139;</span>
        <div>
          <strong>Setup Required</strong>
          <p>PJM monitoring will connect to the PJM Data Miner API or use WebView automation
             to scrape real-time LMP pricing data. Configure credentials in Settings to enable
             live data feed.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

    .price-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      margin-bottom: 20px;
    }

    .price-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .price-label {
      font-size: 14px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .price-unit {
      font-size: 12px;
      color: var(--text-muted);
    }

    .price-value {
      font-size: 56px;
      font-weight: 700;
      color: var(--accent-success);
    }

    .price-updated {
      font-size: 12px;
      color: var(--text-muted);
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .info-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
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
  `]
})
export class PjmComponent {
  lmpPrice: string | null = null;
  lastUpdate = '';
}
