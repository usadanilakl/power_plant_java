
import { Component, OnInit, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import cytoscape from 'cytoscape';
import { DiagramBlockDto } from '../../../models/ui/diagram-block.model';
import dagre from 'cytoscape-dagre';

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
export class PyramidComponent implements OnInit, AfterViewInit {
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
            'shape': 'round-rectangle',
            'corner-radius': '5px',
            'background-color': '#666',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'width': '100px',
            'height': '60px',
            'padding': '5px'
          }
        },
        {
          selector: 'node[id $= "-btn1"], node[id $= "-btn2"]',
          style: {
            'shape': 'round-rectangle',
            'corner-radius': '3px',
            'background-color': '#4CAF50',
            'color': 'white',
            'text-valign': 'center',
            'text-halign': 'center',
            'height': '20px',
            'width': '45px',
            'font-size': '8px',
            'label': 'data(label)',
            'text-margin-y': 0,
            'padding': '2px'
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
        },
        {
          selector: 'node:parent',
          style: {
            'compound-sizing-wrt-labels': 'include',
            'text-valign': 'top',
            'text-halign': 'center',
            'padding': '20px'
          }
        }
      ],
      layout: { name: 'preset' }, // We'll position nodes manually
      zoomingEnabled: true,
      userZoomingEnabled: true,
      panningEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    // Apply custom pyramid layout
    this.createPyramidLayout(this.cy.nodes(), this.cy.width(), this.cy.height());

    this.addInteractivity();

    // Fit the viewport to the graph
    this.cy.fit();
  }

  private createElements(block: DiagramBlockDto): cytoscape.ElementDefinition[] {
    const elements: cytoscape.ElementDefinition[] = [];

    const addBlockAndChildren = (b: DiagramBlockDto, parentId?: string) => {
      const nodeId = b.id!;
      elements.push({
        data: {
          id: nodeId,
          label: b.name!,
          type: b.type,
          status: b.status,
          content: b.content
        }
      });

      // Add button nodes
      elements.push({
        data: { id: `${nodeId}-btn1`, parent: nodeId, label: 'Action 1' },
        position: { x: -20, y: 20 }
      });
      elements.push({
        data: { id: `${nodeId}-btn2`, parent: nodeId, label: 'Action 2' },
        position: { x: 20, y: 20 }
      });

      if (parentId) {
        elements.push({
          data: {
            source: parentId,
            target: nodeId
          }
        });
      }

      if (b.children) {
        b.children.forEach(child => addBlockAndChildren(child, nodeId));
      }
    };

    addBlockAndChildren(block);
    return elements;
  }

  private createPyramidLayout(nodes: cytoscape.NodeCollection, width: number, height: number) {
    const levels = this.getLevels(nodes);
    const levelHeight = height / levels.length;
  
    levels.forEach((level, i) => {
      const levelWidth = width * ((levels.length - i) / levels.length);
      const startX = (width - levelWidth) / 2;
      const y = i * levelHeight + levelHeight / 2;
  
      level.forEach((node, j) => {
        const x = startX + (j + 1) * levelWidth / (level.length + 1);
        node.position({ x, y });
  
        // Position button nodes
        const btn1 = node.outgoers(`[id = "${node.id()}-btn1"]`);
        const btn2 = node.outgoers(`[id = "${node.id()}-btn2"]`);
        if (btn1.length > 0) btn1.position({ x: x - 25, y: y + 30 });
        if (btn2.length > 0) btn2.position({ x: x + 25, y: y + 30 });
      });
    });
  }

  private getLevels(nodes: cytoscape.NodeCollection): cytoscape.NodeCollection[] {
    const levels: cytoscape.NodeCollection[] = [];
    let currentLevel = nodes.roots();
  
    while (currentLevel.nonempty()) {
      levels.push(currentLevel);
      currentLevel = currentLevel.children().filter(node => 
        !node.isChild() && node.children('[id $= "-btn1"], [id $= "-btn2"]').empty()
      );
    }
  
    return levels;
  }

  private addInteractivity() {
    if (!this.cy) return;

    this.cy.on('tap', 'node[id $= "-btn1"]', (evt) => {
      const node = evt.target;
      const parentId = node.parent().id();
      this.buttonAction1(parentId);
    });

    this.cy.on('tap', 'node[id $= "-btn2"]', (evt) => {
      const node = evt.target;
      const parentId = node.parent().id();
      this.buttonAction2(parentId);
    });

    this.cy.on('tap', 'node:parent', (evt) => {
      const node = evt.target;
      console.log('Clicked node:', node.data());
      // Here you can implement opening block details, changing status, etc.
    });

    // Add more event handlers as needed
  }

  private buttonAction1(nodeId: string) {
    console.log(`Action 1 clicked for node ${nodeId}`);
    // Implement your action here
  }

  private buttonAction2(nodeId: string) {
    console.log(`Action 2 clicked for node ${nodeId}`);
    // Implement your action here
  }
}

// import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
// import cytoscape from 'cytoscape';
// import { DiagramBlockDto } from '../../../models/ui/diagram-block.model';
// import dagre from 'cytoscape-dagre';

// // Define Dagre-specific options
// interface DagreOptions {
//   rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
//   nodeSep?: number;
//   rankSep?: number;
//   // Add other Dagre-specific options as needed
// }

// // Register the dagre layout
// cytoscape.use(dagre);

// @Component({
//   selector: 'app-pyramid',
//   standalone: true,
//   template: '<div #cyContainer style="width: 100%; height: 600px;"></div>',
//   styleUrls: ['./pyramid.component.css']
// })
// export class PyramidComponent implements OnInit {
//   @Input() rootBlock!: DiagramBlockDto;
//   @ViewChild('cyContainer') private cyContainer!: ElementRef;

//   private cy: cytoscape.Core | undefined;

//   ngOnInit() {
//     // Cytoscape initialization will be done in ngAfterViewInit
//   }

//   ngAfterViewInit() {
//     this.initializeCytoscape();
//   }

//   private initializeCytoscape() {
//     const elements = this.createElements(this.rootBlock);

//     this.cy = cytoscape({
//       container: this.cyContainer.nativeElement,
//       elements: elements,
//       style: [
//         {
//           selector: 'node',
//           style: {
//             'shape': 'round-rectangle',
//             'corner-radius': '5px',
//             'background-color': '#666',
//             'label': 'data(label)',
//             'text-valign': 'center',
//             'text-halign': 'center',
//             'text-wrap': 'wrap',
//             'text-max-width': '100px',
//             'padding': '20px'
//           }
//         },
//         {
//           selector: 'node[id $= "-btn1"], node[id $= "-btn2"]',
//           style: {
//             'shape': 'round-rectangle',
//             'corner-radius': '3px',
//             'background-color': '#4CAF50',
//             'color': 'white',
//             'text-valign': 'center',
//             'text-halign': 'center',
//             'height': '20px',
//             'width': '60px',
//             'font-size': '10px',
//             'label': 'data(label)',
//             'text-margin-y': 0,
//             'padding': '2px'
//           }
//         },
//         {
//           selector: 'edge',
//           style: {
//             'width': 3,
//             'line-color': '#ccc',
//             'target-arrow-color': '#ccc',
//             'target-arrow-shape': 'triangle',
//             'curve-style': 'bezier'
//           }
//         },
//         {
//           selector: 'node:parent',
//           style: {
//             'compound-sizing-wrt-labels': 'include',
//             'text-valign': 'top',
//             'text-halign': 'center',
//             'padding': '30px'
//           }
//         },
//         {
//           selector: '$node > node',
//           style: {
//             'text-margin-y': -5
//           }
//         }
//       ],
//       layout: {
//         name: 'dagre',
//         rankDir: 'TB',
//         nodeSep: 50,
//         edgeSep: 50,
//         rankSep: 150,
//         padding: 10
//       } as cytoscape.LayoutOptions & DagreOptions,
//       zoomingEnabled: true,
//       userZoomingEnabled: true,
//       panningEnabled: true,
//       userPanningEnabled: true,
//       boxSelectionEnabled: false
//     });

//     this.addInteractivity();
//   }

//   private createElements(block: DiagramBlockDto): cytoscape.ElementDefinition[] {
//     const elements: cytoscape.ElementDefinition[] = [];
  
//     const addBlockAndChildren = (b: DiagramBlockDto, parentId?: string) => {
//       const nodeId = b.id!;
//       elements.push({
//         data: {
//           id: nodeId,
//           label: b.name!,
//           type: b.type,
//           status: b.status,
//           content: b.content
//         }
//       });
  
//       // Add button nodes
//       elements.push({
//         data: { id: `${nodeId}-btn1`, parent: nodeId, label: 'Action 1' }
//       });
//       elements.push({
//         data: { id: `${nodeId}-btn2`, parent: nodeId, label: 'Action 2' }
//       });
  
//       if (parentId) {
//         elements.push({
//           data: {
//             source: parentId,
//             target: nodeId
//           }
//         });
//       }
  
//       if (b.children) {
//         b.children.forEach(child => addBlockAndChildren(child, nodeId));
//       }
//     };
  
//     addBlockAndChildren(block);
//     return elements;
//   }

//   private addInteractivity() {
//     if (!this.cy) return;
  
//     this.cy.on('tap', 'node[id $= "-btn1"]', (evt) => {
//       const node = evt.target;
//       const parentId = node.parent().id();
//       this.buttonAction1(parentId);
//     });
  
//     this.cy.on('tap', 'node[id $= "-btn2"]', (evt) => {
//       const node = evt.target;
//       const parentId = node.parent().id();
//       this.buttonAction2(parentId);
//     });
  
//     this.cy.on('tap', 'node:parent', (evt) => {
//       const node = evt.target;
//       console.log('Clicked node:', node.data());
//       // Here you can implement opening block details, changing status, etc.
//     });
  
//     // Add more event handlers as needed
//   }

  
//   private buttonAction1(nodeId: string) {
//     console.log(`Action 1 clicked for node ${nodeId}`);
//     // Implement your action here
//   }
  
//   private buttonAction2(nodeId: string) {
//     console.log(`Action 2 clicked for node ${nodeId}`);
//     // Implement your action here
//   }
// }