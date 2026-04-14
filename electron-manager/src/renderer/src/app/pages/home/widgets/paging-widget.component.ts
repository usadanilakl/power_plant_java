import { Component } from '@angular/core';

@Component({
  selector: 'app-paging-widget',
  standalone: true,
  template: `
    <div class="feature-card info-card">
      <div class="feature-icon"><span class="material-icons" style="color: #f97316">campaign</span></div>
      <div class="feature-info">
        <h3>Paging System</h3>
        <p class="feature-desc">PA system extension numbers</p>
      </div>
      <div class="info-items">
        <div class="info-row paging-row">
          <span>Admin Building</span>
          <span class="paging-ext">6165</span>
        </div>
        <div class="info-row paging-row">
          <span>Plant Only</span>
          <span class="paging-ext">6162</span>
        </div>
        <div class="info-row paging-row">
          <span>Admin and Plant</span>
          <span class="paging-ext">6170</span>
        </div>
        <div class="info-row paging-row">
          <span>North Gate</span>
          <span class="paging-ext">6166</span>
        </div>
        <div class="info-row paging-row">
          <span>South Gate</span>
          <span class="paging-ext">6164</span>
        </div>
        <div class="info-row paging-row">
          <span>To Open Gate/Door</span>
          <span class="paging-ext">#9</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; transition: all var(--transition-normal);
    }
    :host { flex: 1; display: flex; flex-direction: column; }
    .feature-card { flex: 1; }
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .info-card { cursor: default; }
    .info-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: none; }
    .info-items { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
    .info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); padding: 4px 0; }
    .paging-row { justify-content: space-between; padding: 6px 10px; border-radius: 6px; }
    .paging-row:hover { background-color: var(--bg-secondary); }
    .paging-ext { font-weight: 700; font-family: monospace; font-size: 14px; color: var(--text-primary); }
  `]
})
export class PagingWidgetComponent {}
