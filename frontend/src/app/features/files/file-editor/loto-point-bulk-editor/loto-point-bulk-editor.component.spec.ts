import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotoPointBulkEditorComponent } from './loto-point-bulk-editor.component';

describe('LotoPointBulkEditorComponent', () => {
  let component: LotoPointBulkEditorComponent;
  let fixture: ComponentFixture<LotoPointBulkEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotoPointBulkEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotoPointBulkEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
