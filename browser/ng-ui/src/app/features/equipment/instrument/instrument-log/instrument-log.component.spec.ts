import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentLogComponent } from './instrument-log.component';

describe('InstrumentLogComponent', () => {
  let component: InstrumentLogComponent;
  let fixture: ComponentFixture<InstrumentLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
