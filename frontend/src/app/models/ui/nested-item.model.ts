export interface NestedItem {
  id: string | number;
  name: string;
  subtitle?: string;  // Secondary text shown below name for leaf items
  values?: NestedItem[];
  isExpanded?: boolean;
  objectType: string;
  color: string;
  isClicked?: boolean;
  isLastClicked?: boolean;
}

export class NestedItemImpl implements NestedItem {
  id: string | number;
  name: string;
  subtitle?: string;
  values?: NestedItem[];
  isExpanded: boolean;
  objectType: string;
  color: string;
  isClicked: boolean;
  isLastClicked: boolean;

  constructor(data: Partial<NestedItem> = {}) {
    this.id = data.id ?? '';
    this.name = data.name ?? '';
    this.subtitle = data.subtitle;
    this.values = data.values?.map(item => new NestedItemImpl(item)) ?? [];
    this.isExpanded = data.isExpanded ?? false;
    this.objectType = data.objectType?? '';
    this.color = data.color?? '';
    this.isClicked = data.isClicked?? false;
    this.isLastClicked = data.isLastClicked?? false;
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