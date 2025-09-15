import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintableFormPageComponent } from './printable-form-page.component';

describe('PrintableFormPageComponent', () => {
  let component: PrintableFormPageComponent;
  let fixture: ComponentFixture<PrintableFormPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintableFormPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintableFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
