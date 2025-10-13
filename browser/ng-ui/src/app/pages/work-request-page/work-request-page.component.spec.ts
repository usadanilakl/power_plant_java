import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestPageComponent } from './work-request-page.component';

describe('WorkRequestPageComponent', () => {
  let component: WorkRequestPageComponent;
  let fixture: ComponentFixture<WorkRequestPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkRequestPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
