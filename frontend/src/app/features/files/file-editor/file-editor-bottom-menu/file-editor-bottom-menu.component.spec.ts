import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileEditorBottomMenuComponent } from './file-editor-bottom-menu.component';

describe('FileEditorBottomMenuComponent', () => {
  let component: FileEditorBottomMenuComponent;
  let fixture: ComponentFixture<FileEditorBottomMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileEditorBottomMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileEditorBottomMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
