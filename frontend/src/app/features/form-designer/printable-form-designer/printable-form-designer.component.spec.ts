import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintableFormDesignerComponent } from './printable-form-designer.component';

describe('PrintableFormDesignerComponent', () => {
  let component: PrintableFormDesignerComponent;
  let fixture: ComponentFixture<PrintableFormDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintableFormDesignerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintableFormDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
