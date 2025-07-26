import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulerPageComponent } from './scheduler-page.component';

describe('SchedulerPageComponent', () => {
  let component: SchedulerPageComponent;
  let fixture: ComponentFixture<SchedulerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulerPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchedulerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
