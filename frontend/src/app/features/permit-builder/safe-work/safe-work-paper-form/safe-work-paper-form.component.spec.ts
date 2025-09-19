import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeWorkPaperFormComponent } from './safe-work-paper-form.component';

describe('SafeWorkPaperFormComponent', () => {
  let component: SafeWorkPaperFormComponent;
  let fixture: ComponentFixture<SafeWorkPaperFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeWorkPaperFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafeWorkPaperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
