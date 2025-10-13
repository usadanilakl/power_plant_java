import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestTableComponent } from './work-request-table.component';

describe('WorkRequestTableComponent', () => {
  let component: WorkRequestTableComponent;
  let fixture: ComponentFixture<WorkRequestTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkRequestTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkRequestTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
