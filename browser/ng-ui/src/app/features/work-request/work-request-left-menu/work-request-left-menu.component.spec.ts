import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkRequestLeftMenuComponent } from './work-request-left-menu.component';

describe('WorkRequestLeftMenuComponent', () => {
  let component: WorkRequestLeftMenuComponent;
  let fixture: ComponentFixture<WorkRequestLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkRequestLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkRequestLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
