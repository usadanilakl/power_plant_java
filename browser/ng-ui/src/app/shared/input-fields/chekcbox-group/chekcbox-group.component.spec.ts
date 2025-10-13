import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChekcboxGroupComponent } from './chekcbox-group.component';

describe('ChekcboxGroupComponent', () => {
  let component: ChekcboxGroupComponent;
  let fixture: ComponentFixture<ChekcboxGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChekcboxGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChekcboxGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
