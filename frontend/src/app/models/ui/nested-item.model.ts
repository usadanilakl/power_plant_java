export interface NestedItem {
  id: string | number;
  name: string;
  values?: NestedItem[];
  isExpanded?: boolean;
  objectType: string;
}

export class NestedItemImpl implements NestedItem {
  id: string | number;
  name: string;
  values?: NestedItem[];
  isExpanded: boolean;
  objectType: string;

  constructor(data: Partial<NestedItem> = {}) {
    this.id = data.id ?? '';
    this.name = data.name ?? '';
    this.values = data.values?.map(item => new NestedItemImpl(item)) ?? [];
    this.isExpanded = data.isExpanded ?? false;
    this.objectType = data.objectType?? '';
  }

  addChild(child: NestedItem): void {
    if (!this.values) {
      this.values = [];
    }
    this.values.push(new NestedItemImpl(child));
  }

  removeChild(childId: string | number): void {
    if (this.values) {
      this.values = this.values.filter(child => child.id !== childId);
    }
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }
}