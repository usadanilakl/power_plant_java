import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarTool } from '../models/interactive-image-config.model';

export interface ToolbarToolDefinition {
  id: ToolbarTool;
  label: string;
  icon: string;
  tooltip: string;
  group: 'drawing' | 'editing' | 'view' | 'shape-ops';
  isActive?: () => boolean;
}

@Component({
  selector: 'app-unified-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-toolbar.component.html',
  styleUrl: './unified-toolbar.component.css',
})
export class UnifiedToolbarComponent {
  // Inputs
  enabledTools = input<ToolbarTool[]>([]);
  activeTool = input<ToolbarTool | null>(null);
  position = input<'top' | 'bottom' | 'left' | 'right'>('top');
  showSymbolPalette = input<boolean>(false);

  // Outputs
  toolClicked = output<ToolbarTool>();
  symbolPaletteToggled = output<void>();

  // Toolbar tool definitions with icons and keyboard shortcuts
  private allTools: ToolbarToolDefinition[] = [
    // Drawing Tools
    {
      id: 'select',
      label: 'Select',
      icon: '🖱️',
      tooltip: 'Select and manipulate shapes\nKeyboard: V or Esc',
      group: 'drawing',
    },
    {
      id: 'draw-rectangle',
      label: 'Rectangle',
      icon: '▭',
      tooltip: 'Draw rectangle\nKeyboard: R\nRight-click to draw',
      group: 'drawing',
    },
    {
      id: 'place-symbol',
      label: 'Symbol',
      icon: '⭐',
      tooltip: 'Place symbol from palette\nKeyboard: S\nRight-click to place',
      group: 'drawing',
    },

    // Shape Operations
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      tooltip: 'Delete selected shapes\nKeyboard: Delete or Backspace',
      group: 'shape-ops',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '📋',
      tooltip: 'Duplicate selected shapes\nKeyboard: Ctrl+D\n\nTip: Use Ctrl+C, Ctrl+V for copy/paste',
      group: 'shape-ops',
    },
    {
      id: 'bring-to-front',
      label: 'To Front',
      icon: '⬆️',
      tooltip: 'Bring selected shape to front\nKeyboard: Ctrl+]',
      group: 'shape-ops',
    },
    {
      id: 'send-to-back',
      label: 'To Back',
      icon: '⬇️',
      tooltip: 'Send selected shape to back\nKeyboard: Ctrl+[',
      group: 'shape-ops',
    },

    // View Tools
    {
      id: 'zoom-in',
      label: 'Zoom In',
      icon: '🔍+',
      tooltip: 'Zoom in\nKeyboard: + or =\nMouse: Scroll up',
      group: 'view',
    },
    {
      id: 'zoom-out',
      label: 'Zoom Out',
      icon: '🔍−',
      tooltip: 'Zoom out\nKeyboard: - or _\nMouse: Scroll down',
      group: 'view',
    },
    {
      id: 'zoom-fit',
      label: 'Fit',
      icon: '⛶',
      tooltip: 'Fit to screen\nKeyboard: F or 0',
      group: 'view',
    },
    {
      id: 'reset-view',
      label: 'Reset',
      icon: '↺',
      tooltip: 'Reset zoom and pan\nKeyboard: Ctrl+0',
      group: 'view',
    },
    {
      id: 'toggle-symbols',
      label: 'Symbols',
      icon: '📚',
      tooltip: 'Toggle symbol palette\nKeyboard: P',
      group: 'editing',
    },
  ];

  // Computed: filter tools based on enabled list
  visibleTools = computed(() => {
    const enabled = this.enabledTools();
    if (!enabled || enabled.length === 0) {
      return this.allTools; // Show all if none specified
    }
    return this.allTools.filter((tool) => enabled.includes(tool.id));
  });

  // Group tools for organized display
  toolGroups = computed(() => {
    const tools = this.visibleTools();
    return {
      drawing: tools.filter((t) => t.group === 'drawing'),
      shapeOps: tools.filter((t) => t.group === 'shape-ops'),
      view: tools.filter((t) => t.group === 'view'),
      editing: tools.filter((t) => t.group === 'editing'),
    };
  });

  onToolClick(toolId: ToolbarTool): void {
    if (toolId === 'toggle-symbols') {
      this.symbolPaletteToggled.emit();
    } else {
      this.toolClicked.emit(toolId);
    }
  }

  isToolActive(toolId: ToolbarTool): boolean {
    return this.activeTool() === toolId;
  }
}
