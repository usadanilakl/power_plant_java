import { BaseModel, IBaseModel } from "../permits/base.model";
import { FormField } from "../inputs/form-field.model";
import { Column } from "../inputs/column.model";

export type InstrumentStatus = 'Disconnected/Removed' | 'In Progress' | 'Normal Operation';

export interface IInstrumentLogEntry extends IBaseModel {
    instrumentTagNumber: string;
    status: InstrumentStatus;
    date: Date;
    name: string;
    comment: string;
}

export class InstrumentLogEntry extends BaseModel<IInstrumentLogEntry> implements IInstrumentLogEntry {
    instrumentTagNumber: string;
    override status: InstrumentStatus;
    date: Date;
    name: string;
    comment: string;

    constructor(data: Partial<IInstrumentLogEntry> = {}) {
        super(data);
        this.instrumentTagNumber = data.instrumentTagNumber ?? '';
        this.status = data.status ?? 'Normal Operation';
        this.date = data.date ? new Date(data.date) : new Date();
        this.name = data.name ?? '';
        this.comment = data.comment ?? '';
    }

    getFormFields(): FormField[] {
        return [
            { name: 'instrumentTagNumber', label: 'Instrument Tag Number', type: 'text', initialValue: this.instrumentTagNumber },
            { 
                name: 'status', 
                label: 'Status', 
                type: 'select', 
                initialValue: this.status,
                options: [
                    { value: 'Normal Operation', label: 'Normal Operation' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Disconnected/Removed', label: 'Disconnected/Removed' }
                ]
            },
            { name: 'date', label: 'Date', type: 'date', initialValue: this.date },
            { name: 'name', label: 'Name', type: 'text', initialValue: this.name },
            { name: 'comment', label: 'Comment', type: 'textarea', initialValue: this.comment },
        ];
    }

    getTableColumns(): Column[] {
        return [
            { id: 'instrumentTagNumber', header: 'Tag Number', accessorKey: 'instrumentTagNumber' },
            { id: 'status', header: 'Status', accessorKey: 'status' },
            { 
                id: 'date', 
                header: 'Date', 
                accessorFn: (item: IInstrumentLogEntry) => new Date(item.date).toLocaleDateString() 
            },
            { id: 'name', header: 'Name', accessorKey: 'name' },
            { id: 'comment', header: 'Comment', accessorKey: 'comment' },
        ];
    }
}