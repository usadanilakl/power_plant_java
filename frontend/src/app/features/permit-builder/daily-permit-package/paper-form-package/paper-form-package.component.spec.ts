import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaperFormPackageComponent } from './paper-form-package.component';

describe('PaperFormPackageComponent', () => {
  let component: PaperFormPackageComponent;
  let fixture: ComponentFixture<PaperFormPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaperFormPackageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaperFormPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
