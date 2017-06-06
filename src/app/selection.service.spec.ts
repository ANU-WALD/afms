/// <reference path="../testing/custom.matchers.d.ts"/>

import {Location} from '@angular/common';
import { TestBed, inject } from '@angular/core/testing';
import { SelectionService } from './selection.service';
import {MapViewParameterService} from 'map-wald';
import {customMatchers} from '../testing/custom.matchers';

describe('SelectionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SelectionService,MapViewParameterService,
      {
        provide:Location,
        useValue:{}
      }]
    });

    jasmine.addMatchers(customMatchers);
  });

  it('should find most recent date', inject([SelectionService], (service: SelectionService) => {
    expect(service.mostRecentTimestep(new Date(2012,0,5))).toMatchDate(new Date(2012,0,1));
    expect(service.mostRecentTimestep(new Date(2012,0,17))).toMatchDate(new Date(2012,0,17));
    expect(service.mostRecentTimestep(new Date(2012,0,16))).toMatchDate(new Date(2012,0,9));
  }));

  it('should find the previous date', inject([SelectionService], (service: SelectionService) => {
    expect(service.previousTimeStep(new Date(2012,0,17))).toMatchDate(new Date(2012,0,9));
    expect(service.previousTimeStep(new Date(2012,0,1))).toMatchDate(new Date(2011,11,27));
  }));

});
