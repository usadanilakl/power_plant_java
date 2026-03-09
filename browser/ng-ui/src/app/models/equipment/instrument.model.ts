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
    currentStatus?: string;
    lastUpdatedDate?: string;
    lastUpdatedTime?: string;
    lastUpdatedBy?: string;
    lastComment?: string;
    sharepointId?: string;
    localUuid?: string;
}

export class Instrument extends BaseModel<IInstrument> implements IInstrument {
    tagNumber: string;
    description: string;
    vendor: string;
    location: string;
    type: string;
    currentStatus?: string;
    lastUpdatedDate?: string;
    lastUpdatedTime?: string;
    lastUpdatedBy?: string;
    lastComment?: string;
    sharepointId?: string;
    localUuid?: string;

    constructor(data: Partial<IInstrument> = {}) {
        super(data);
        this.tagNumber = data.tagNumber ?? '';
        this.description = data.description ?? '';
        this.vendor = data.vendor ?? '';
        this.location = data.location ?? '';
        this.type = data.type ?? '';
        this.currentStatus = data.currentStatus;
        this.lastUpdatedDate = data.lastUpdatedDate;
        this.lastUpdatedTime = data.lastUpdatedTime;
        this.lastUpdatedBy = data.lastUpdatedBy;
        this.lastComment = data.lastComment;
        this.sharepointId = data.sharepointId;
        this.localUuid = data.localUuid;
    }

    getFormFields(): FormField[] {
        return [
            { name: 'tagNumber', label: 'Tag Number', type: 'text', initialValue: this.tagNumber, placeholder: 'e.g. PT-101' },
            { name: 'description', label: 'Description', type: 'textarea', initialValue: this.description, placeholder: 'Instrument description' },
            { name: 'vendor', label: 'Vendor', type: 'text', initialValue: this.vendor, placeholder: 'Manufacturer name' },
            { name: 'location', label: 'Location', type: 'text', initialValue: this.location, placeholder: 'e.g. Turbine Hall' },
            { name: 'type', label: 'Type', type: 'text', initialValue: this.type, placeholder: 'e.g. Pressure Transmitter' },
        ];
    }

    getTableColumns(): Column[] {
        return [
            { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
            { id: 'description', header: 'Description', accessorKey: 'description' },
            { id: 'vendor', header: 'Vendor', accessorKey: 'vendor' },
            { id: 'location', header: 'Location', accessorKey: 'location' },
            { id: 'type', header: 'Type', accessorKey: 'type' },
            { id: 'currentStatus', header: 'Status', accessorKey: 'currentStatus' },
            { id: 'lastUpdatedBy', header: 'Updated By', accessorKey: 'lastUpdatedBy' },
            { id: 'lastUpdatedDate', header: 'Last Updated', accessorKey: 'lastUpdatedDate' },
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
