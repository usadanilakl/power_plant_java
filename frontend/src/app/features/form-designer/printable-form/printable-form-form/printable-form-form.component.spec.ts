import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintableFormFormComponent } from './printable-form-form.component';

describe('PrintableFormFormComponent', () => {
  let component: PrintableFormFormComponent;
  let fixture: ComponentFixture<PrintableFormFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintableFormFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintableFormFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
