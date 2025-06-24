import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileBulkEditorMenuComponent } from './file-bulk-editor-menu.component';

describe('FileBulkEditorMenuComponent', () => {
  let component: FileBulkEditorMenuComponent;
  let fixture: ComponentFixture<FileBulkEditorMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileBulkEditorMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileBulkEditorMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
