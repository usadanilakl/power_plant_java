export interface IJhaTransfer{
    requestSharepointId: number;
    workScope: string;
    dateOfWork: Date;
}

export class JhaTransfer implements IJhaTransfer {
    requestSharepointId: number;
    workScope: string;
    dateOfWork: Date;
    constructor(data: Partial<IJhaTransfer> = {}) {
        this.requestSharepointId = data.requestSharepointId?? 0;
        this.workScope = data.workScope?? '';
        this.dateOfWork = data.dateOfWork?? new Date();
    }
}