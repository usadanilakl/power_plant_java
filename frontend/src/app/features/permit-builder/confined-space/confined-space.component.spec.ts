import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfinedSpaceComponent } from './confined-space.component';

describe('ConfinedSpaceComponent', () => {
  let component: ConfinedSpaceComponent;
  let fixture: ComponentFixture<ConfinedSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfinedSpaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfinedSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
