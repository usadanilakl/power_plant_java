import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../../services/electron.service';

@Component({
  selector: 'app-external-links-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feature-card" [class.compact]="isCompact">

      <!-- COMPACT (1x1): icon grid -->
      <ng-container *ngIf="isCompact">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #3b82f6">open_in_new</span>
          <h3>Links</h3>
        </div>
        <div class="icon-grid" *ngIf="!editMode">
          <button class="icon-link" *ngFor="let link of links" (click)="openLink(link.key)" [title]="link.label">
            <span class="material-icons">{{ link.icon }}</span>
          </button>
        </div>
      </ng-container>

      <!-- STANDARD (2x1+): full list -->
      <ng-container *ngIf="!isCompact">
        <div class="feature-icon"><span class="material-icons" style="color: #3b82f6">open_in_new</span></div>
        <div class="feature-info">
          <h3>External Links</h3>
          <p class="feature-desc">SharePoint, Maximo, and other tools</p>
        </div>
        <div class="ext-links" *ngIf="!editMode">
          <a class="ext-link" *ngFor="let link of links" (click)="openLink(link.key)">
            <span class="material-icons ext-link-icon">{{ link.icon }}</span>
            <span>{{ link.label }}</span>
            <span class="material-icons ext-arrow">open_in_new</span>
          </a>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 10px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; transition: all var(--transition-normal);
      overflow-y: auto; height: 100%; box-sizing: border-box;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    :host { display: block; height: 100%; }

    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .icon-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .icon-link {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: var(--bg-secondary); color: var(--text-muted); cursor: pointer;
      transition: all 150ms;
    }
    .icon-link:hover { background: var(--accent-primary); color: #fff; }
    .icon-link .material-icons { font-size: 16px; }

    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .ext-links { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
    .ext-link {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 6px; font-size: 13px;
      color: var(--text-secondary); text-decoration: none; cursor: pointer;
      transition: background-color 150ms;
    }
    .ext-link:hover { background-color: var(--bg-secondary); color: var(--text-primary); }
    .ext-link-icon { font-size: 18px; color: var(--text-muted); }
    .ext-arrow { font-size: 14px; color: var(--text-muted); margin-left: auto; opacity: 0; transition: opacity 150ms; }
    .ext-link:hover .ext-arrow { opacity: 1; }
  `]
})
export class ExternalLinksWidgetComponent {
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;

  readonly links = [
    { key: 'toi', label: 'TOI', icon: 'description' },
    { key: 'work-requests', label: 'Work Requests', icon: 'table_chart' },
    { key: 'maximo', label: 'Maximo', icon: 'engineering' },
    { key: 'permits', label: 'Permits', icon: 'security' },
    { key: 'turnover-sheet', label: 'Turn Over Sheet', icon: 'swap_horiz' },
    { key: 'emergency-contacts', label: 'Emergency Contacts', icon: 'contact_phone' },
  ];

  private readonly externalUrls: Record<string, string> = {
    'toi': 'https://jpowerusa.sharepoint.com/sites/JG/External/Forms/AllItems.aspx?id=%2Fsites%2FJG%2FExternal%2F60%20%2D%20Operations%2F60%2E11%20TIO%2DTMOD&viewid=88b99ea1%2D77a0%2D4798%2Dbc16%2D64e9eec8fa6a',
    'work-requests': 'https://jpowerusa.sharepoint.com/sites/JG/Lists/Work%20Requests/AllItems.aspx?env=WebViewList',
    'maximo': '',
    'permits': 'https://jpowerusa.sharepoint.com/sites/JG/SitePages/Confined-Spaces.aspx',
    'turnover-sheet': 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7B0645E9F2-2CEB-4351-901C-D70C70FF775A%7D&file=Turnover%20With%20Gads(right%20click-open-open%20in%20app%20f9%20to%20refresh)new2%20-%20Copy.xlsm&action=default&mobileredirect=true',
    'emergency-contacts': 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BE445C5F4-C235-45F7-8D29-F0613E875FA0%7D&file=EMERGENCY%20CONTACT%20LIST%20-%20EDITED%2011_2024.xlsx&action=default&mobileredirect=true'
  };

  constructor(private electronService: ElectronService) {}

  get isCompact(): boolean { return this.cols === 1 && this.rows === 1; }

  openLink(key: string): void {
    const url = this.externalUrls[key];
    if (url) this.electronService.openExternal(url);
  }
}
