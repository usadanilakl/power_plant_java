import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentFormComponent } from './instrument-form.component';

describe('InstrumentFormComponent', () => {
  let component: InstrumentFormComponent;
  let fixture: ComponentFixture<InstrumentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
