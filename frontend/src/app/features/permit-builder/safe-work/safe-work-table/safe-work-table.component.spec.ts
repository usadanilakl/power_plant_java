import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeWorkTableComponent } from './safe-work-table.component';

describe('SafeWorkTableComponent', () => {
  let component: SafeWorkTableComponent;
  let fixture: ComponentFixture<SafeWorkTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeWorkTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafeWorkTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
