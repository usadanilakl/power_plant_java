import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolPaletteComponent } from './symbol-palette.component';

describe('SymbolPaletteComponent', () => {
  let component: SymbolPaletteComponent;
  let fixture: ComponentFixture<SymbolPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolPaletteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymbolPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
