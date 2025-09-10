import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestComponent } from './work-request.component';

describe('WorkRequestComponent', () => {
  let component: WorkRequestComponent;
  let fixture: ComponentFixture<WorkRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
