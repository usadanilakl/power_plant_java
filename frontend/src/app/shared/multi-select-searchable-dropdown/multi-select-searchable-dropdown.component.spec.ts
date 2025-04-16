import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectSearchableDropdownComponent } from './multi-select-searchable-dropdown.component';

describe('MultiSelectSearchableDropdownComponent', () => {
  let component: MultiSelectSearchableDropdownComponent;
  let fixture: ComponentFixture<MultiSelectSearchableDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectSearchableDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiSelectSearchableDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
