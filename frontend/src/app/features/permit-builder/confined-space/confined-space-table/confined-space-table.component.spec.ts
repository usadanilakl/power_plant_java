import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfinedSpaceTableComponent } from './confined-space-table.component';

describe('ConfinedSpaceTableComponent', () => {
  let component: ConfinedSpaceTableComponent;
  let fixture: ComponentFixture<ConfinedSpaceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfinedSpaceTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfinedSpaceTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
