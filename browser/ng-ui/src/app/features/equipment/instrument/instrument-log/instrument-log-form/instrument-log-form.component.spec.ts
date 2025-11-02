import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentLogFormComponent } from './instrument-log-form.component';

describe('InstrumentLogFormComponent', () => {
  let component: InstrumentLogFormComponent;
  let fixture: ComponentFixture<InstrumentLogFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentLogFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentLogFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
