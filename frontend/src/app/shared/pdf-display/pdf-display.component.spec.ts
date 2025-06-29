import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfDisplayComponent } from './pdf-display.component';

describe('PdfDisplayComponent', () => {
  let component: PdfDisplayComponent;
  let fixture: ComponentFixture<PdfDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
