import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentDescriptionComponent } from './equipment-description.component';

describe('EquipmentDescriptionComponent', () => {
  let component: EquipmentDescriptionComponent;
  let fixture: ComponentFixture<EquipmentDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentDescriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
