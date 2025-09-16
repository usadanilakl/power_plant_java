import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintableFormPreviewComponent } from './printable-form-preview.component';

describe('PrintableFormPreviewComponent', () => {
  let component: PrintableFormPreviewComponent;
  let fixture: ComponentFixture<PrintableFormPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintableFormPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintableFormPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
