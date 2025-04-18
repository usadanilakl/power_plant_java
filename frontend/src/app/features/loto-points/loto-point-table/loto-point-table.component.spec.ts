import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointTableComponent } from './loto-point-table.component';

describe('LotoPointTableComponent', () => {
  let component: LotoPointTableComponent;
  let fixture: ComponentFixture<LotoPointTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
