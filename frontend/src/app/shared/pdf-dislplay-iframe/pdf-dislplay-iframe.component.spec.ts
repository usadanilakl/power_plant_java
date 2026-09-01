import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfDisplayIframeComponent } from './pdf-dislplay-iframe.component';

describe('PdfDisplayIframeComponent', () => {
  let component: PdfDisplayIframeComponent;
  let fixture: ComponentFixture<PdfDisplayIframeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfDisplayIframeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfDisplayIframeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
