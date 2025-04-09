import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapePropertiesComponent } from './shape-properties.component';

describe('ShapePropertiesComponent', () => {
  let component: ShapePropertiesComponent;
  let fixture: ComponentFixture<ShapePropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShapePropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShapePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
