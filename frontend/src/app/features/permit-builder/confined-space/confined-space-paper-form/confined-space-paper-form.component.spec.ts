import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfinedSpacePaperFormComponent } from './confined-space-paper-form.component';

describe('ConfinedSpacePaperFormComponent', () => {
  let component: ConfinedSpacePaperFormComponent;
  let fixture: ComponentFixture<ConfinedSpacePaperFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfinedSpacePaperFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfinedSpacePaperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
