import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VectorLayerSelectionComponent } from './vector-layer-selection.component';

describe('VectorLayerSelectionComponent', () => {
  let component: VectorLayerSelectionComponent;
  let fixture: ComponentFixture<VectorLayerSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VectorLayerSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VectorLayerSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
