import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseLayerSelectionComponent } from './base-layer-selection.component';

describe('BaseLayerSelectionComponent', () => {
  let component: BaseLayerSelectionComponent;
  let fixture: ComponentFixture<BaseLayerSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BaseLayerSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseLayerSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
