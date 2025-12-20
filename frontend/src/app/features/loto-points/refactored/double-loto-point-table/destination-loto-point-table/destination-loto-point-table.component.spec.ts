import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestinationLotoPointTableComponent } from './destination-loto-point-table.component';

describe('DestinationLotoPointTableComponent', () => {
  let component: DestinationLotoPointTableComponent;
  let fixture: ComponentFixture<DestinationLotoPointTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestinationLotoPointTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestinationLotoPointTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
