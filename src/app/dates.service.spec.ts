import { TestBed, inject } from '@angular/core/testing';

import { DatesService } from './dates.service';

describe('DatesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatesService]
    });
  });

  it('should be created', inject([DatesService], (service: DatesService) => {
    expect(service).toBeTruthy();
  }));
});
