import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';

export type InstrumentLogFieldName = keyof InstrumentLogModel;

export interface InstrumentLogModel extends BaseModel {
  instrumentTagNumber: string | null;
  instrumentDescription: string | null;
  status: string | null;
  date: string | null;
  time: string | null;
  submitterName: string | null;
  comment: string | null;
  sharepointId: string | null;
  localUuid: string | null;
}

export class InstrumentLogDto extends BaseDto implements InstrumentLogModel {
  instrumentTagNumber: string | null;
  instrumentDescription: string | null;
  status: string | null;
  date: string | null;
  time: string | null;
  submitterName: string | null;
  comment: string | null;
  sharepointId: string | null;
  localUuid: string | null;

  constructor(data: Partial<InstrumentLogModel> = {}) {
    super(data);
    this.instrumentTagNumber = data.instrumentTagNumber ?? null;
    this.instrumentDescription = data.instrumentDescription ?? null;
    this.status = data.status ?? null;
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.submitterName = data.submitterName ?? null;
    this.comment = data.comment ?? null;
    this.sharepointId = data.sharepointId ?? null;
    this.localUuid = data.localUuid ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      instrumentTagNumber: this.instrumentTagNumber,
      instrumentDescription: this.instrumentDescription,
      status: this.status,
      date: this.date,
      time: this.time,
      submitterName: this.submitterName,
      comment: this.comment,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
    };
  }

  static override fromJson(json: any): InstrumentLogDto {
    return new InstrumentLogDto({
      ...super.fromJson(json),
      instrumentTagNumber: json.instrumentTagNumber || null,
      instrumentDescription: json.instrumentDescription || null,
      status: json.status || null,
      date: json.date || null,
      time: json.time || null,
      submitterName: json.name || json.submitterName || null,
      comment: json.comment || null,
      sharepointId: json.sharepointId || null,
      localUuid: json.localUuid || null,
    });
  }

  static toTableColumns(fields: InstrumentLogFieldName[] = ['date', 'time', 'instrumentTagNumber', 'status', 'submitterName', 'comment']): Column[] {
    const allColumns: { [key in InstrumentLogFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      instrumentTagNumber: { id: 'instrumentTagNumber', header: 'Tag Number', accessorKey: 'instrumentTagNumber' },
      instrumentDescription: { id: 'instrumentDescription', header: 'Description', accessorKey: 'instrumentDescription' },
      status: {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        conditionalStyling: (item: any, column: Column) => {
          if (item.status === 'Normal Operation') return { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' };
          if (item.status === 'In Progress') return { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' };
          if (item.status === 'Disconnected/Removed') return { 'background-color': 'var(--status-not-processed)', 'color': 'var(--primary-text)' };
          return { 'background-color': '', 'color': '' };
        }
      },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      submitterName: { id: 'submitterName', header: 'Name', accessorKey: 'submitterName' },
      comment: { id: 'comment', header: 'Comment', accessorKey: 'comment' },
      sharepointId: { id: 'sharepointId', header: 'SP ID', accessorKey: 'sharepointId' },
      localUuid: { id: 'localUuid', header: 'UUID', accessorKey: 'localUuid' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      isVerified: { id: 'isVerified', header: 'Verified', accessorKey: 'isVerified' },
    };
    return fields.map(fieldName => allColumns[fieldName]);
  }
}
