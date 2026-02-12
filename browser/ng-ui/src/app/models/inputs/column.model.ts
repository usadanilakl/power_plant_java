export interface Column {
  id: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (item: any) => string;
  conditionalStyling?: (item: any, column: Column) => { [key: string]: string };
  onCellClick?: (item: any, event: MouseEvent) => void;
}