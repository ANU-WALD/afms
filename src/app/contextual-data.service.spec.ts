import { TestBed } from '@angular/core/testing';

import { ContextualDataService } from './contextual-data.service';

describe('ContextualDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ContextualDataService = TestBed.get(ContextualDataService);
    expect(service).toBeTruthy();
  });
});
