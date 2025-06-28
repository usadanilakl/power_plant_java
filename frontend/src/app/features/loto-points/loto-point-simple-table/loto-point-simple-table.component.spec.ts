import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointSimpleTableComponent } from './loto-point-simple-table.component';

describe('LotoPointSimpleTableComponent', () => {
  let component: LotoPointSimpleTableComponent;
  let fixture: ComponentFixture<LotoPointSimpleTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointSimpleTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointSimpleTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
