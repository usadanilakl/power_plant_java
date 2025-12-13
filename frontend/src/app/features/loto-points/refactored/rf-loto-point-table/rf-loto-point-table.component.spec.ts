import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfLotoPointTableComponent } from './rf-loto-point-table.component';

describe('RfLotoPointTableComponent', () => {
  let component: RfLotoPointTableComponent;
  let fixture: ComponentFixture<RfLotoPointTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfLotoPointTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RfLotoPointTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
