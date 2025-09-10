import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeWorkComponent } from './safe-work.component';

describe('SafeWorkComponent', () => {
  let component: SafeWorkComponent;
  let fixture: ComponentFixture<SafeWorkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeWorkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafeWorkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
