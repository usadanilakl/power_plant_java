import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFileTableComponent } from './new-file-table.component';

describe('NewFileTableComponent', () => {
  let component: NewFileTableComponent;
  let fixture: ComponentFixture<NewFileTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewFileTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewFileTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
