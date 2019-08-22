import { TestBed, inject } from '@angular/core/testing';

import { IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IncidentsService]
    });
  });

  it('should be created', inject([IncidentsService], (service: IncidentsService) => {
    expect(service).toBeTruthy();
  }));
});
