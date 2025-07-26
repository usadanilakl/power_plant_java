import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DiagramBlockDto } from '../../../models/ui/diagram-block.model';

@Component({
  selector: 'app-pyramid-graph',
  imports: [],
  template: '<svg #svgContainer></svg>',
  styleUrl: './pyramid-graph.component.css'
})
export class PyramidGraphComponent implements OnInit, AfterViewInit {
  @Input() rootBlock!: DiagramBlockDto;
  @ViewChild('svgContainer') private svgContainer!: ElementRef;

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width = 800;
  private height = 600;

  ngOnInit() {
    // Initialization will be done in ngAfterViewInit
  }

  ngAfterViewInit() {
    this.initializeD3();
  }

  private initializeD3() {
    this.svg = d3.select(this.svgContainer.nativeElement)
      .attr('width', this.width)
      .attr('height', this.height);

    const hierarchyData = d3.hierarchy(this.rootBlock);
    const treeLayout = d3.tree<DiagramBlockDto>().size([this.width, this.height - 100]);
    const treeData = treeLayout(hierarchyData);

    // Draw links
    this.svg.selectAll('line.link')
      .data(treeData.links())
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .style('stroke', '#ccc')
      .style('stroke-width', 2);

    // Create node groups
    const nodeGroups = this.svg.selectAll('g.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Draw node rectangles
    nodeGroups.append('rect')
      .attr('width', 100)
      .attr('height', 60)
      .attr('x', -50)
      .attr('y', -30)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', '#666');

    // Add node labels
    nodeGroups.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(d => d.data.name)
      .style('fill', 'white')
      .style('font-size', '12px');

    // Add action buttons
    const buttonGroup = nodeGroups.append('g')
      .attr('class', 'button-group')
      .attr('transform', 'translate(0, 40)');
    
    // Button 1
    buttonGroup.append('rect')
      .attr('class', 'button button1')
      .attr('width', 45)
      .attr('height', 20)
      .attr('x', -47)
      .attr('y', 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .style('fill', '#4CAF50');
    
    buttonGroup.append('text')
      .attr('class', 'button-text')
      .attr('x', -25)
      .attr('y', 14)
      .text('Action 1')
      .style('fill', 'white')
      .style('font-size', '8px')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none'); // This prevents the text from capturing clicks
    
    // Button 2
    buttonGroup.append('rect')
      .attr('class', 'button button2')
      .attr('width', 45)
      .attr('height', 20)
      .attr('x', 2)
      .attr('y', 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .style('fill', '#4CAF50');
    
    buttonGroup.append('text')
      .attr('class', 'button-text')
      .attr('x', 24)
      .attr('y', 14)
      .text('Action 2')
      .style('fill', 'white')
      .style('font-size', '8px')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none'); // This prevents the text from capturing clicks

    this.addInteractivity(nodeGroups);
  }

  private addInteractivity(nodeGroups: d3.Selection<SVGGElement, d3.HierarchyPointNode<DiagramBlockDto>, SVGSVGElement, unknown>) {
    nodeGroups.on('click', (event, d) => this.handleNodeClick(event, d));
  
    // Handler for button 1 (both rectangle and text)
    nodeGroups.select('.button-group')
      .selectAll('.button1, .button1 + text')
      .on('click', (event: MouseEvent, d: any) => {
        event.stopPropagation(); // Prevent event from bubbling up to the node
        const node = d as d3.HierarchyPointNode<DiagramBlockDto>;
        this.buttonAction1(node.data.id!);
        // Remove this line: this.handleNodeClick(event, node);
      });
  
    // Handler for button 2 (both rectangle and text)
    nodeGroups.select('.button-group')
      .selectAll('.button2, .button2 + text')
      .on('click', (event: MouseEvent, d: any) => {
        event.stopPropagation(); // Prevent event from bubbling up to the node
        const node = d as d3.HierarchyPointNode<DiagramBlockDto>;
        this.buttonAction2(node.data.id!);
        // Remove this line: this.handleNodeClick(event, node);
      });
  }

  private handleNodeClick(event: MouseEvent, d: d3.HierarchyPointNode<DiagramBlockDto>) {
    console.log('Clicked node:', d.data);
    // Implement opening block details, changing status, etc.
    // For example:
    // this.openNodeDetails(d.data);
    // or
    // this.toggleNodeStatus(d.data);
  }

  private buttonAction1(nodeId: string) {
    console.log(`Action 1 clicked for node ${nodeId}`);
    // Implement button-specific action here
  }
  
  private buttonAction2(nodeId: string) {
    console.log(`Action 2 clicked for node ${nodeId}`);
    // Implement button-specific action here
  }

}
