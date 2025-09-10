import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfinedSpaceFormComponent } from './confined-space-form.component';

describe('ConfinedSpaceFormComponent', () => {
  let component: ConfinedSpaceFormComponent;
  let fixture: ComponentFixture<ConfinedSpaceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfinedSpaceFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfinedSpaceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
