import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvisibleSearchableMultiSelectComponent } from './invisible-searchable-multi-select.component';

describe('InvisibleSearchableMultiSelectComponent', () => {
  let component: InvisibleSearchableMultiSelectComponent;
  let fixture: ComponentFixture<InvisibleSearchableMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvisibleSearchableMultiSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvisibleSearchableMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
