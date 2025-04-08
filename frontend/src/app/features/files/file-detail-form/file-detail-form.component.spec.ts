import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileDetailFormComponent } from './file-detail-form.component';

describe('FileDetailFormComponent', () => {
  let component: FileDetailFormComponent;
  let fixture: ComponentFixture<FileDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileDetailFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
