import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChekcboxXComponent } from './chekcbox-x.component';

describe('ChekcboxXComponent', () => {
  let component: ChekcboxXComponent;
  let fixture: ComponentFixture<ChekcboxXComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChekcboxXComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChekcboxXComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
