
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagNumberService } from '../../../services/tag-number.service';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { ClipboardService } from '../../../services/util/clipboard.service';

@Component({
  selector: 'app-tag-number-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tag-number-generator.component.html',
  styleUrls: ['./tag-number-generator.component.css']
})
export class TagNumberGeneratorComponent {
  unit: string = '';
  equipmentType: string = '';
  system: string = '';
  generatedTagNumber: string | null = null;
  errorMessage: string | null = null;

  constructor(private tagNumberService: TagNumberService, private clipboardService: ClipboardService) {}

  onSubmit() {
    const tagNumberData = {
      unit: this.unit,
      eqType: this.equipmentType,
      system: this.system
    };

    this.tagNumberService.createTagNumber(tagNumberData).subscribe(
      (response: SpringApiResponse<string>) => {
        this.generatedTagNumber = response.responseData;
        this.clipboardService.setClipboardData(response.responseData);
        this.errorMessage = null;
      },
      (error) => {
        this.errorMessage = 'Error generating tag number. Please try again.';
        this.generatedTagNumber = null;
        console.error('Error:', error);
      }
    );
  }
}
