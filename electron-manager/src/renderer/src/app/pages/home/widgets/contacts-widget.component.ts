import { Component } from '@angular/core';

@Component({
  selector: 'app-contacts-widget',
  standalone: true,
  template: `
    <div class="feature-card info-card">
      <div class="feature-icon"><span class="material-icons" style="color: #10b981">contacts</span></div>
      <div class="feature-info">
        <h3>Contacts</h3>
        <p class="feature-desc">Plant contact information</p>
      </div>
      <div class="info-items">
        <div class="info-row">
          <span class="material-icons info-icon">location_on</span>
          <span>24650 South Brandon Road, Elwood, IL 60421</span>
        </div>
        <div class="info-row">
          <span class="material-icons info-icon">phone</span>
          <span class="info-label">Control Room:</span>
          <span>(779) 242-6148, (779) 242-6151</span>
        </div>
        <div class="info-row">
          <span class="material-icons info-icon">smartphone</span>
          <span class="info-label">Cell:</span>
          <span>(815) 839-3330</span>
        </div>
        <div class="info-row">
          <span class="material-icons info-icon">settings_input_antenna</span>
          <span class="info-label">Radio:</span>
          <span>Channel 1 (JPWR-1)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; transition: all var(--transition-normal); overflow-y: auto;
    }
    :host { display: block; height: 100%; }
    .feature-card { height: 100%; box-sizing: border-box; }
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .info-card { cursor: default; }
    .info-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: none; }
    .info-items { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
    .info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); padding: 4px 0; }
    .info-icon { font-size: 16px; color: var(--text-muted); flex-shrink: 0; }
    .info-label { font-weight: 600; color: var(--text-primary); white-space: nowrap; }
  `]
})
export class ContactsWidgetComponent {}
