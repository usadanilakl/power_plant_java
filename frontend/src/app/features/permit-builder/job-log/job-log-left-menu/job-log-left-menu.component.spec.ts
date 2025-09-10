import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobLogLeftMenuComponent } from './job-log-left-menu.component';

describe('JobLogLeftMenuComponent', () => {
  let component: JobLogLeftMenuComponent;
  let fixture: ComponentFixture<JobLogLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobLogLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobLogLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
