import { TestBed, inject } from '@angular/core/testing';

import { TimeseriesService } from './timeseries.service';

describe('TimeseriesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimeseriesService]
    });
  });

  it('should ...', inject([TimeseriesService], (service: TimeseriesService) => {
    expect(service).toBeTruthy();
  }));
});
