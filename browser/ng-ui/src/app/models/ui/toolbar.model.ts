export interface ToolbarItem {
  id: string; // A unique identifier for the action, e.g., 'draw-rectangle'
  label: string;
  icon?: string; // Optional: for an icon-based button
  tooltip?: string; // Optional: for hover text
  isActive?: () => boolean; // A function to dynamically determine if the button is active
  action?: () => void; // The function to execute on click
}