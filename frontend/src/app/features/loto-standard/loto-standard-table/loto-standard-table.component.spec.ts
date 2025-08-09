import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoStandardTableComponent } from './loto-standard-table.component';

describe('LotoStandardTableComponent', () => {
  let component: LotoStandardTableComponent;
  let fixture: ComponentFixture<LotoStandardTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoStandardTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoStandardTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
