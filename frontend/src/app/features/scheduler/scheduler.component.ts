import { Component, OnInit } from '@angular/core';
import { DiagramBlockDto } from '../../models/ui/diagram-block.model';
import { PyramidGraphComponent } from "../../shared/diagrams/pyramid-graph/pyramid-graph.component";

@Component({
  selector: 'app-scheduler',
  imports: [PyramidGraphComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.css'
})
export class SchedulerComponent implements OnInit {
  diagramData!: DiagramBlockDto;

  ngOnInit() {
    // Initialize the diagram data
    this.diagramData = {
      id: '1',
      name: 'Root',
      type: 'root',
      status: 'active',
      content: 'Root content',
      children: [
        {
          id: '2',
          name: 'Child 1',
          type: 'child',
          status: 'active',
          content: 'Child 1 content',
          children: [
            {
              id: '4',
              name: 'Grandchild 1',
              type: 'grandchild',
              status: 'active',
              content: 'Grandchild 1 content'
            }
          ]
        },
        {
          id: '3',
          name: 'Child 2',
          type: 'child',
          status: 'inactive',
          content: 'Child 2 content'
        }
      ]
    };
  }

}
