import { Component, DestroyRef, inject, Input, OnInit, signal, Signal, computed } from '@angular/core';
import { WorkRequestTableComponent } from "./work-request-table/work-request-table.component";


@Component({
  selector: 'app-work-request',
  imports: [WorkRequestTableComponent],
  templateUrl: './work-request.component.html',
  styleUrl: './work-request.component.css'
})
export class WorkRequestComponent implements OnInit {


  constructor() { }
  
  ngOnInit(): void {
    // Implement your initialization logic here
  }
}
