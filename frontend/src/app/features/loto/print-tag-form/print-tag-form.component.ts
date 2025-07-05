import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoService } from '../../../services/loto/loto.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-print-tag-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './print-tag-form.component.html',
  styleUrl: './print-tag-form.component.css'
})
export class PrintTagFormComponent implements OnInit {
  @Input() lotoPoint: LotoPointDto | null = null;

  tagNumber: string = '';
  description: string = '';
  specificLocation: string = '';

  constructor(private lotoService: LotoService, private http: HttpClient) {}

  ngOnInit() {
    if (this.lotoPoint) {
      this.tagNumber = this.lotoPoint.tagNumber || '';
      this.description = this.lotoPoint.description || '';
      this.specificLocation = this.lotoPoint.specificLocation || '';
    }
  }

  onSubmit() {
    if (!this.lotoPoint) {
      console.error('No LOTO point provided');
      return;
    }

    const tagData = {
      id: this.lotoPoint.id,
      tagNumber: this.tagNumber,
      description: this.description,
      specificLocation: this.specificLocation
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post('http://localhost:8082/ng/loto-points/tagging', tagData, { headers: headers })
      .subscribe(
        response => {
          // Handle success (e.g., show a success message)
        },
        error => {
          console.error('Error submitting tag data', error);
          // Handle error (e.g., show an error message)
        }
      );
  }

  printTag() {
    const url = `http://localhost:8082/print/tag/${encodeURIComponent(this.tagNumber)}/${encodeURIComponent(this.description)}`;
    window.open(url, '_blank');
  }
}