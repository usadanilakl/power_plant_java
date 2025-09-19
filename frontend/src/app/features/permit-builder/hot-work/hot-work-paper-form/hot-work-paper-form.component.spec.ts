import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotWorkPaperFormComponent } from './hot-work-paper-form.component';

describe('HotWorkPaperFormComponent', () => {
  let component: HotWorkPaperFormComponent;
  let fixture: ComponentFixture<HotWorkPaperFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotWorkPaperFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotWorkPaperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
