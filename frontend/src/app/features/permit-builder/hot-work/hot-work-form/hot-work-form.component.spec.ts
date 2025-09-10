import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotWorkFormComponent } from './hot-work-form.component';

describe('HotWorkFormComponent', () => {
  let component: HotWorkFormComponent;
  let fixture: ComponentFixture<HotWorkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotWorkFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotWorkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
