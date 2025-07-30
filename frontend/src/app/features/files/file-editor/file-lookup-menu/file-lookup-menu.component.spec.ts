import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileLookupMenuComponent } from './file-lookup-menu.component';

describe('FileLookupMenuComponent', () => {
  let component: FileLookupMenuComponent;
  let fixture: ComponentFixture<FileLookupMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileLookupMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileLookupMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
