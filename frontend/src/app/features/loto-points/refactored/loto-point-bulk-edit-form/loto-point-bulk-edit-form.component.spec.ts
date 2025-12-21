import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointBulkEditFormComponent } from './loto-point-bulk-edit-form.component';

describe('LotoPointBulkEditFormComponent', () => {
  let component: LotoPointBulkEditFormComponent;
  let fixture: ComponentFixture<LotoPointBulkEditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointBulkEditFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointBulkEditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
