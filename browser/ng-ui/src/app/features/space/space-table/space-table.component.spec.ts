import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceTableComponent } from './space-table.component';

describe('SpaceTableComponent', () => {
  let component: SpaceTableComponent;
  let fixture: ComponentFixture<SpaceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpaceTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpaceTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
