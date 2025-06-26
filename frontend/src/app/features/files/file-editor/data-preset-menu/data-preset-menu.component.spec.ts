import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataPresetMenuComponent } from './data-preset-menu.component';

describe('DataPresetMenuComponent', () => {
  let component: DataPresetMenuComponent;
  let fixture: ComponentFixture<DataPresetMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataPresetMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataPresetMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
