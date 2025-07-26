import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import cytoscape from 'cytoscape';
import { DiagramBlockDto } from '../../../models/ui/diagram-block.model';
const dagre = require('cytoscape-dagre');

// Define Dagre-specific options
interface DagreOptions {
  rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSep?: number;
  rankSep?: number;
  // Add other Dagre-specific options as needed
}

// Register the dagre layout
cytoscape.use(dagre);

@Component({
  selector: 'app-pyramid',
  standalone: true,
  template: '<div #cyContainer style="width: 100%; height: 600px;"></div>',
  styleUrls: ['./pyramid.component.css']
})
export class PyramidComponent implements OnInit {
  @Input() rootBlock!: DiagramBlockDto;
  @ViewChild('cyContainer') private cyContainer!: ElementRef;

  private cy: cytoscape.Core | undefined;

  ngOnInit() {
    // Cytoscape initialization will be done in ngAfterViewInit
  }

  ngAfterViewInit() {
    this.initializeCytoscape();
  }

  private initializeCytoscape() {
    const elements = this.createElements(this.rootBlock);

    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 'label',
            'height': 'label',
            'padding': '10px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 50,
        rankSep: 100
      } as cytoscape.LayoutOptions & DagreOptions
    });

    // Add interactivity
    this.addInteractivity();
  }

  private createElements(block: DiagramBlockDto): cytoscape.ElementDefinition[] {
    const elements: cytoscape.ElementDefinition[] = [];

    const addBlockAndChildren = (b: DiagramBlockDto, parentId?: string) => {
      elements.push({
        data: {
          id: b.id!,
          label: b.name!,
          type: b.type,
          status: b.status,
          content: b.content
        }
      });

      if (parentId) {
        elements.push({
          data: {
            source: parentId,
            target: b.id!
          }
        });
      }

      if (b.children) {
        b.children.forEach(child => addBlockAndChildren(child, b.id!));
      }
    };

    addBlockAndChildren(block);
    return elements;
  }

  private addInteractivity() {
    if (!this.cy) return;

    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      console.log('Clicked node:', node.data());
      // Here you can implement opening block details, changing status, etc.
    });

    this.cy.on('dragfree', 'node', (evt) => {
      const node = evt.target;
      console.log('Node dragged:', node.data());
      // Here you can implement logic for updating relationships
    });

    // Add more event handlers as needed
  }
}