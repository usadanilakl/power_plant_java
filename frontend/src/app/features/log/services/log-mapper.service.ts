import { Injectable } from '@angular/core';
import { CommentDto } from '../../../models/base/comment.model';
import { Column } from '../../../models/column.model';

@Injectable({
  providedIn: 'root',
})
export class LogMapperService {
  toTableColumns(
    fields: string[] = [
      'content',
      'entityType',
      'entityId',
      'commentType',
      'needsAttention',
      'createdBy',
      'dateCreated',
    ]
  ): Column[] {
    const allColumns: { [key: string]: Column } = {
      content: {
        id: 'content',
        header: 'Content',
        accessorKey: 'content',
        width: 300,
        filterable: true,
        sortable: true,
      },
      entityType: {
        id: 'entityType',
        header: 'Entity Type',
        accessorKey: 'entityType',
        width: 130,
        filterable: true,
        sortable: true,
      },
      entityId: {
        id: 'entityId',
        header: 'Entity ID',
        accessorKey: 'entityId',
        width: 100,
        filterable: true,
        sortable: true,
      },
      commentType: {
        id: 'commentType',
        header: 'Type',
        accessorKey: 'commentType.name',
        accessorFn: (item: CommentDto) => item.commentType?.name || '',
        width: 120,
        filterable: true,
        sortable: true,
      },
      needsAttention: {
        id: 'needsAttention',
        header: 'Attention',
        accessorFn: (item: CommentDto) =>
          item.needsAttention ? 'Yes' : 'No',
        width: 100,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.needsAttention
            ? { 'background-color': 'var(--error-background, #ffcdd2)' }
            : { 'background-color': '' },
      },
      isResolved: {
        id: 'isResolved',
        header: 'Resolved',
        accessorFn: (item: CommentDto) =>
          item.isResolved ? 'Yes' : 'No',
        width: 100,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isResolved
            ? { 'background-color': 'var(--success-background, #c8e6c9)' }
            : { 'background-color': '' },
      },
      createdBy: {
        id: 'createdBy',
        header: 'Author',
        accessorKey: 'createdBy',
        width: 130,
        filterable: true,
        sortable: true,
      },
      dateCreated: {
        id: 'dateCreated',
        header: 'Date',
        accessorKey: 'dateCreated',
        width: 160,
        filterable: true,
        sortable: true,
      },
    };

    return fields
      .map((fieldName) => allColumns[fieldName])
      .filter((column): column is Column => column !== undefined);
  }
}
