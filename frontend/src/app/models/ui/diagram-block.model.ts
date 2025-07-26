export interface DiagramBlock {
    id: string | null;
    type: string | null;
    status: string | null;
    name: string | null;
    content: string | null;
    children?: DiagramBlock[] | null;
}

export class DiagramBlockDto implements DiagramBlock {
    id: string | null;
    type: string | null;
    status: string | null;
    name: string | null;
    content: string | null;
    children?: DiagramBlockDto[] | null;

    constructor(data: Partial<DiagramBlock> = {}) {
        this.id = data.id?? null;
        this.type = data.type?? null;
        this.status = data.status?? null;
        this.name = data.name?? null;
        this.content = data.content?? null;
        this.children = data.children?.map(item => new DiagramBlockDto(item))?? null;
    }
}