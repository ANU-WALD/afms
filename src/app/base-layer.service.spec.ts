import { TestBed, inject } from '@angular/core/testing';

import { BaseLayerService } from './base-layer.service';

describe('BaseLayerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaseLayerService]
    });
  });

  it('should ...', inject([BaseLayerService], (service: BaseLayerService) => {
    expect(service).toBeTruthy();
  }));
});
