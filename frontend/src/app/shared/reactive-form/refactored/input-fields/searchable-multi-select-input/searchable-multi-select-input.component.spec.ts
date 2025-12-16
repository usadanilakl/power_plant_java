import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableMultiSelectInputComponent } from './searchable-multi-select-input.component';

describe('SearchableMultiSelectInputComponent', () => {
  let component: SearchableMultiSelectInputComponent;
  let fixture: ComponentFixture<SearchableMultiSelectInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableMultiSelectInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchableMultiSelectInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
