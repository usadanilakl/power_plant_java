export interface Column {
  id: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (item: any) => string;
}