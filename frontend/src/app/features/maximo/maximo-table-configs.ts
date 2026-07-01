/**
 * Shared `Column[]` configs for Maximo list pages so all pages share the same
 * column ids/headers/widths/sortable flags.
 *
 * Plain accessorKey only — formatting (dates, link cells, etc.) can be added later
 * via accessorFn or column templates without changing call sites.
 */
import { Column } from '../../models/column.model';

export const WO_COLUMNS: Column[] = [
  { id: 'wonum',        header: 'WO #',        accessorKey: 'wonum',       width: 110, sortable: true, filterable: true },
  { id: 'description',  header: 'Description', accessorKey: 'description', width: 320, sortable: true, filterable: true },
  { id: 'status',       header: 'Status',      accessorKey: 'status',      width: 80,  sortable: true, filterable: true },
  { id: 'worktype',     header: 'Type',        accessorKey: 'worktype',    width: 70,  sortable: true, filterable: true },
  { id: 'assetnum',     header: 'Asset',       accessorKey: 'assetnum',    width: 130, sortable: true, filterable: true },
  { id: 'location',     header: 'Location',    accessorKey: 'location',    width: 120, sortable: true, filterable: true },
  { id: 'leadCraft',    header: 'Lead',        accessorKey: 'leadCraft',   width: 90,  sortable: true, filterable: true },
  { id: 'supervisor',   header: 'Supervisor',  accessorKey: 'supervisor',  width: 100, sortable: true, filterable: true },
  { id: 'reportdate',   header: 'Reported',     accessorKey: 'reportdate',  width: 170, sortable: true, filterable: true },
  { id: 'targetStart',  header: 'Target start', accessorKey: 'targetStart', width: 170, sortable: true, filterable: true },
  { id: 'schedstart',   header: 'Sched start',  accessorKey: 'schedstart',  width: 170, sortable: true, filterable: true },
  { id: 'priority',     header: 'Pri',          accessorKey: 'priority',    width: 50,  sortable: true, filterable: true },
];

export const SR_COLUMNS: Column[] = [
  { id: 'ticketid',    header: 'Ticket',      accessorKey: 'ticketid',    width: 90,  sortable: true, filterable: true },
  { id: 'description', header: 'Description', accessorKey: 'description', width: 320, sortable: true, filterable: true },
  { id: 'status',      header: 'Status',      accessorKey: 'status',      width: 80,  sortable: true, filterable: true },
  { id: 'assetnum',    header: 'Asset',       accessorKey: 'assetnum',    width: 130, sortable: true, filterable: true },
  { id: 'location',    header: 'Location',    accessorKey: 'location',    width: 120, sortable: true, filterable: true },
  { id: 'reportdate',  header: 'Reported',    accessorKey: 'reportdate',  width: 170, sortable: true, filterable: true },
  { id: 'reportedby',  header: 'By',          accessorKey: 'reportedby',  width: 100, sortable: true, filterable: true },
  { id: 'priority',    header: 'Pri',         accessorKey: 'priority',    width: 50,  sortable: true, filterable: true },
];

export const ASSET_COLUMNS: Column[] = [
  { id: 'assetnum',    header: 'Tag',         accessorKey: 'assetnum',    width: 140, sortable: true, filterable: true },
  { id: 'description', header: 'Description', accessorKey: 'description', width: 280, sortable: true, filterable: true },
  { id: 'siteid',      header: 'Site',        accessorKey: 'siteid',      width: 60,  sortable: true, filterable: true },
  { id: 'location',    header: 'Location',    accessorKey: 'location',    width: 130, sortable: true, filterable: true },
  { id: 'status',      header: 'Status',      accessorKey: 'status',      width: 90,  sortable: true, filterable: true },
];

export const INVENTORY_COLUMNS: Column[] = [
  { id: 'itemnum',     header: 'Item',        accessorKey: 'itemnum',     width: 140, sortable: true, filterable: true },
  { id: 'description', header: 'Description', accessorKey: 'description', width: 320, sortable: true, filterable: true },
  { id: 'issueunit',   header: 'Unit',        accessorKey: 'issueunit',   width: 70,  sortable: true },
  { id: 'curbal',      header: 'On hand',     accessorKey: 'curbal',      width: 90,  sortable: true },
];
