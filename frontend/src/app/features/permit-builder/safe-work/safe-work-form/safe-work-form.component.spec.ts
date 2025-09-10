import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeWorkFormComponent } from './safe-work-form.component';

describe('SafeWorkFormComponent', () => {
  let component: SafeWorkFormComponent;
  let fixture: ComponentFixture<SafeWorkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeWorkFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafeWorkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
