import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NestedFormItemComponent } from './nested-form-item.component';

describe('NestedFormItemComponent', () => {
  let component: NestedFormItemComponent;
  let fixture: ComponentFixture<NestedFormItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NestedFormItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NestedFormItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
