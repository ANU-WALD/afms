import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplashModalComponent } from './splash-modal.component';

describe('SplashModalComponent', () => {
  let component: SplashModalComponent;
  let fixture: ComponentFixture<SplashModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplashModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplashModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
