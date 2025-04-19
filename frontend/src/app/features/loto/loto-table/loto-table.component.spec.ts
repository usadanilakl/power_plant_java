import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoTableComponent } from './loto-table.component';

describe('LotoTableComponent', () => {
  let component: LotoTableComponent;
  let fixture: ComponentFixture<LotoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
