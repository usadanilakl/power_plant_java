import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvisibleSearchableSelectComponent } from './invisible-searchable-select.component';

describe('InvisibleSearchableSelectComponent', () => {
  let component: InvisibleSearchableSelectComponent;
  let fixture: ComponentFixture<InvisibleSearchableSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvisibleSearchableSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvisibleSearchableSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
