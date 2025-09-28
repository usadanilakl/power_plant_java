import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartFormComponent } from './smart-form.component';

describe('SmartFormComponent', () => {
  let component: SmartFormComponent;
  let fixture: ComponentFixture<SmartFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
