import { TestBed } from '@angular/core/testing';

import { ZonalService } from './zonal.service';

describe('ZonalService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ZonalService = TestBed.get(ZonalService);
    expect(service).toBeTruthy();
  });
});
