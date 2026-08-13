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
    /**
     * Device-only flag: this instrument was created offline and is still sitting in the outbox, so
     * it exists in the local register but nowhere else yet. Never sent to the hub — the create DTO
     * is built field by field — and cleared when the queued create lands.
     */
    pendingSync?: boolean;
}

/**
 * An instrument created on this device that the hub hasn't accepted yet. Holds the exact create
 * payload so the replay is byte-for-byte what the user submitted; `localUuid` is minted before the
 * first attempt so a replay the hub already saw is recognised rather than duplicated.
 */
export interface InstrumentCreateOutboxItem {
    id?: number;
    localUuid: string;
    tagNumber: string;
    payload: IInstrument;
    createdAt: string;
    attempts: number;
    lastError?: string;
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
    pendingSync?: boolean;

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
        this.pendingSync = data.pendingSync;
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
