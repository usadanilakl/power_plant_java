import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfinedSpaceSideMenuComponent } from './confined-space-side-menu.component';

describe('ConfinedSpaceSideMenuComponent', () => {
  let component: ConfinedSpaceSideMenuComponent;
  let fixture: ComponentFixture<ConfinedSpaceSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfinedSpaceSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfinedSpaceSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
