import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep, WizardContextFrame, WizardEntityData } from '../wizard-stack.types';

interface ReviewItem {
  label: string;
  value: string;
  icon?: string;
}

interface ReviewSection {
  title: string;
  icon: string;
  items: ReviewItem[];
  cssClass?: string;
}

@Component({
  selector: 'app-wizard-review-step',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="review-container">
      @for (section of reviewSections(); track section.title) {
        <div class="review-section" [class]="section.cssClass || ''">
          <h4 class="section-title">
            @if (section.icon) {
              <mat-icon>{{ section.icon }}</mat-icon>
            }
            {{ section.title }}
          </h4>
          <div class="section-content">
            @for (item of section.items; track item.label) {
              <div class="review-item">
                <span class="item-label">{{ item.label }}</span>
                <span class="item-value" [class.empty]="!item.value">
                  {{ item.value || 'Not set' }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      @if (reviewSections().length === 0) {
        <div class="empty-review">
          <mat-icon>preview</mat-icon>
          <p>No data to review yet.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .review-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .review-section {
      background: #f9f9f9;
      border-radius: 8px;
      overflow: hidden;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 12px 16px;
      background: #f0f0f0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .section-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .section-content {
      padding: 8px 0;
    }

    /* Limit height for long LOTO points lists */
    .loto-points-section .section-content {
      max-height: 250px;
      overflow-y: auto;
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 16px;
      border-bottom: 1px solid #eee;
    }

    .review-item:last-child {
      border-bottom: none;
    }

    .item-label {
      color: #666;
      font-size: 13px;
    }

    .item-value {
      font-weight: 500;
      color: #333;
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }

    .item-value.empty {
      color: #999;
      font-style: italic;
      font-weight: normal;
    }

    .empty-review {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .empty-review mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }
  `],
})
export class WizardReviewStepComponent {
  step = input.required<WizardStep>();
  frame = input.required<WizardContextFrame>();

  reviewSections = computed(() => {
    const frameData = this.frame();
    if (!frameData) return [];

    const sections: ReviewSection[] = [];
    const entityData = frameData.entityData;

    // LOTO Standard section
    if (entityData.lotoStandard) {
      const std = entityData.lotoStandard;
      sections.push({
        title: 'LOTO Standard',
        icon: 'playlist_add',
        items: [
          { label: 'Name', value: std.name || '' },
          { label: 'Description', value: std.description || '' },
          { label: 'Build Counterpart', value: std.buildCounterpart ? 'Yes' : 'No' },
          ...(std.buildCounterpart ? [{ label: 'Counterpart Name', value: std.counterpartName || '' }] : []),
          { label: 'LOTO Points', value: std.lotoPoints?.length ? `${std.lotoPoints.length} point(s)` : 'None added' },
        ],
      });

      // List LOTO points if any
      if (std.lotoPoints && std.lotoPoints.length > 0) {
        sections.push({
          title: 'Included LOTO Points',
          icon: 'location_on',
          cssClass: 'loto-points-section',
          items: std.lotoPoints.map((p: any, i: number) => ({
            label: `Point ${i + 1}`,
            value: p.tagNumber || p.description || `ID: ${p.id}`,
          })),
        });
      }
    }

    // LOTO Point section
    if (entityData.lotoPoint) {
      const lp = entityData.lotoPoint;
      sections.push({
        title: 'LOTO Point',
        icon: 'location_on',
        items: [
          { label: 'Tag Number', value: lp.tagNumber || '' },
          { label: 'Unit', value: lp.unit || '' },
          { label: 'Description', value: lp.description || '' },
          { label: 'Specific Location', value: lp.specificLocation || '' },
          { label: 'Equipment Type', value: this.getValueName(lp.eqType) },
          { label: 'Location', value: this.getValueName(lp.location) },
          { label: 'Normal Position', value: this.getValueName(lp.normPos) },
          { label: 'Isolated Position', value: this.getValueName(lp.isoPos) },
        ],
      });
    }

    // File section
    if (entityData.file) {
      const f = entityData.file;
      sections.push({
        title: 'File',
        icon: 'insert_drive_file',
        items: [
          { label: 'Name', value: f.name || '' },
          { label: 'File Type', value: (f as any).fileType || '' },
          { label: 'File Number', value: (f as any).fileNumber || '' },
        ],
      });
    }

    // Value section
    if (entityData.value) {
      const v = entityData.value;
      sections.push({
        title: 'New Value',
        icon: 'add_circle',
        items: [
          { label: 'Name', value: v.name || '' },
          { label: 'Alias', value: v.alias || '' },
          { label: 'Category', value: v.categoryName || '' },
        ],
      });
    }

    // Zero Energy section
    if (entityData.zeroEnergy) {
      const ze = entityData.zeroEnergy;
      sections.push({
        title: 'Zero Energy',
        icon: 'energy_savings_leaf',
        items: [
          { label: 'Template', value: ze.zeroEnergyTemplate?.name || '' },
          { label: 'Method', value: ze.method || '' },
          { label: 'Reference Equipment', value: ze.templateEquipment?.length ? `${ze.templateEquipment.length} item(s)` : 'None' },
        ],
      });
    }

    return sections;
  });

  private getValueName(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.name || val.label || '';
  }
}
