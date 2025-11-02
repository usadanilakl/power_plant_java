import { BaseModel, IBaseModel } from '../permits/base.model';
import { FormField } from '../inputs/form-field.model';
import { Column } from '../inputs/column.model';
import { InstrumentLogEntry } from './instrument-log.model';

export interface IInstrument extends IBaseModel {
    tagNumber: string;
    description: string;
    vendor: string;
    location: string;
    type: string;
}

export class Instrument extends BaseModel<IInstrument> implements IInstrument {
    tagNumber: string;
    description: string;
    vendor: string;
    location: string;
    type: string;

    constructor(data: Partial<IInstrument> = {}) {
        super(data);
        this.tagNumber = data.tagNumber ?? '';
        this.description = data.description ?? '';
        this.vendor = data.vendor ?? '';
        this.location = data.location ?? '';
        this.type = data.type ?? '';
    }

    getFormFields(): FormField[] {
        return [
            { name: 'tagNumber', label: 'Tag Number', type: 'text', initialValue: this.tagNumber },
            { name: 'description', label: 'Description', type: 'textarea', initialValue: this.description },
            { name: 'vendor', label: 'Vendor', type: 'text', initialValue: this.vendor },
            { name: 'location', label: 'Location', type: 'text', initialValue: this.location },
            { name: 'type', label: 'Type', type: 'text', initialValue: this.type },
        ];
    }

    getTableColumns(): Column[] {
        return [
            { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
            { id: 'description', header: 'Description', accessorKey: 'description' },
            { id: 'vendor', header: 'Vendor', accessorKey: 'vendor' },
            { id: 'location', header: 'Location', accessorKey: 'location' },
            { id: 'type', header: 'Type', accessorKey: 'type' },
            { id: 'status', header: 'Status', accessorKey: 'status' },
            {
                id: 'updatedAt',
                header: 'Last Updated',
                accessorFn: (item: IInstrument) => new Date(item.updatedAt).toLocaleDateString()
            },
        ];
    }


    toLogEntry(): InstrumentLogEntry {
        return new InstrumentLogEntry({
            instrumentTagNumber: this.tagNumber,
            instrumentDescription: this.description,
            date: new Date(),
        });
    }
}