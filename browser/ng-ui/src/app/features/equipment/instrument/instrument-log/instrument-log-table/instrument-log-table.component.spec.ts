import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentLogTableComponent } from './instrument-log-table.component';

describe('InstrumentLogTableComponent', () => {
  let component: InstrumentLogTableComponent;
  let fixture: ComponentFixture<InstrumentLogTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentLogTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentLogTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
