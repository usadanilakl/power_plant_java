import { BaseModel, IBaseModel } from "../permits/base.model";
import { FormField } from "../inputs/form-field.model";
import { Column } from "../inputs/column.model";
import { IAttachment } from "../permits/attachment.model";

export type InstrumentStatus = 'Disconnected/Removed' | 'In Progress' | 'Normal Operation';

export interface IInstrumentLogEntry extends IBaseModel {
    localUuid?: string;
    instrumentTagNumber: string;
    instrumentDescription: string;
    status: InstrumentStatus;
    date: Date;
    time: string;
    name: string;
    comment: string;
    attachments: IAttachment[];
}

/**
 * A log captured on this device that the hub hasn't accepted yet (offline, or every submission
 * route failed). Held in IndexedDB and retried; `localUuid` is minted before the first attempt so
 * replays dedup server-side rather than creating duplicate log rows.
 */
export interface InstrumentLogOutboxItem {
    id?: number;
    localUuid: string;
    instrumentTagNumber: string;
    entry: IInstrumentLogEntry;
    createdAt: string;
    attempts: number;
    lastError?: string;
}

export class InstrumentLogEntry extends BaseModel<IInstrumentLogEntry> implements IInstrumentLogEntry {
    localUuid?: string;
    instrumentTagNumber: string;
    instrumentDescription: string;
    override status: InstrumentStatus;
    date: Date;
    time: string;
    name: string;
    comment: string;
    attachments: IAttachment[];

    constructor(data: Partial<IInstrumentLogEntry> = {}) {
        super(data);
        this.localUuid = data.localUuid;
        this.instrumentTagNumber = data.instrumentTagNumber ?? '';
        this.instrumentDescription = data.instrumentDescription?? '';

        this.status = data.status ?? 'Normal Operation';
        this.date = data.date ? new Date(data.date) : new Date();
        this.time = data.time?? new Date().toTimeString().slice(0, 5);;
        this.name = data.name ?? '';
        this.comment = data.comment ?? '';
        this.attachments = data.attachments ?? [];
    }

    /**
     * Mobile-first field order: the two things the tech is actually there to record — status and a
     * comment — come first and are reachable without scrolling; identity and timestamps sit below,
     * pre-filled. Tag and description are deliberately absent: the log screen renders them in its
     * header, and `ReactiveFormComponent` merges the submitted value over the entity, so they still
     * travel with the submission.
     */
    getFormFields(): FormField[] {
        return [
            {
                name: 'status',
                label: 'Status',
                // radio-group, not a select: three big tap targets beat a native picker in gloves.
                type: 'radio-group',
                initialValue: this.status,
                options: [
                    { value: 'Normal Operation', label: 'Normal Operation' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Disconnected/Removed', label: 'Disconnected / Removed' }
                ]
            },
            { name: 'comment', label: 'Comment', type: 'textarea', initialValue: this.comment, placeholder: 'Add any notes or observations' },
            { name: 'files', label: 'Photos / attachments', type: 'file', accept: 'image/*,.pdf,.doc,.docx', multiple: true,
              initialValue: this.attachments.filter(a => a.type !== 'signature') },
            { name: 'name', label: 'Name', type: 'text', initialValue: this.name, placeholder: 'Your name', group: { label: 'Logged by', orientation: 'horizontal' } },
            { name: 'date', label: 'Date', type: 'date', initialValue: this.date, validators: [], group: { label: 'Logged by', orientation: 'horizontal' } },
            { name: 'time', label: 'Time', type: 'time', initialValue: this.time, group: { label: 'Logged by', orientation: 'horizontal' } },
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
            { id: 'time', header: 'Time', accessorKey: 'time' },
            { id: 'name', header: 'Name', accessorKey: 'name' },
            { id: 'comment', header: 'Comment', accessorKey: 'comment' },
        ];
    }
}
