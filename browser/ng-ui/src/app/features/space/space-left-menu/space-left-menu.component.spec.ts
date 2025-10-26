import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceLeftMenuComponent } from './space-left-menu.component';

describe('SpaceLeftMenuComponent', () => {
  let component: SpaceLeftMenuComponent;
  let fixture: ComponentFixture<SpaceLeftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpaceLeftMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpaceLeftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
