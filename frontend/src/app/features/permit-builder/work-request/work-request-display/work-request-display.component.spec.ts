import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestDisplayComponent } from './work-request-display.component';

describe('WorkRequestDisplayComponent', () => {
  let component: WorkRequestDisplayComponent;
  let fixture: ComponentFixture<WorkRequestDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkRequestDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkRequestDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
