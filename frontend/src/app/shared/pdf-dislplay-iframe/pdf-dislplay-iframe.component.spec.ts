import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfDislplayIframeComponent } from './pdf-dislplay-iframe.component';

describe('PdfDislplayIframeComponent', () => {
  let component: PdfDislplayIframeComponent;
  let fixture: ComponentFixture<PdfDislplayIframeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfDislplayIframeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfDislplayIframeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
