import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintableFormSideMenuComponent } from './printable-form-side-menu.component';

describe('PrintableFormSideMenuComponent', () => {
  let component: PrintableFormSideMenuComponent;
  let fixture: ComponentFixture<PrintableFormSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintableFormSideMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintableFormSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
