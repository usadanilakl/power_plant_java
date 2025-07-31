import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilePointDiscrepanciesMenuComponent } from './file-point-discrepancies-menu.component';

describe('FilePointDiscrepanciesMenuComponent', () => {
  let component: FilePointDiscrepanciesMenuComponent;
  let fixture: ComponentFixture<FilePointDiscrepanciesMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilePointDiscrepanciesMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilePointDiscrepanciesMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
