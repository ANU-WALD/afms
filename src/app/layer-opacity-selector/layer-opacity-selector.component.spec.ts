import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerOpacitySelectorComponent } from './layer-opacity-selector.component';

describe('LayerOpacitySelectorComponent', () => {
  let component: LayerOpacitySelectorComponent;
  let fixture: ComponentFixture<LayerOpacitySelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayerOpacitySelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerOpacitySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
