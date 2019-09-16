import { Injectable, EventEmitter } from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import { MapViewParameterService, TimeUtilsService, UTCDate, utcDateCopy } from 'map-wald';
import {DateRange} from './layer';
import {NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import { VisibleLayer } from './main-map/visible-layer';

// const OFFSET_HOURS=12;
// const MILLISECONDS_PER_DAY=24*60*60*1000;
// export const DEFAULT_TIMESTEP=4;

@Injectable()
export class SelectionService {
  private _struct:NgbDateStruct={
    day:0,
    month:0,
    year:0
  };
  _layer:VisibleLayer;

  // timeStep=DEFAULT_TIMESTEP;

  constructor(private mapView:MapViewParameterService,
              private timeUtils:TimeUtilsService,
              private _location: Location) {
  }

  loadFromURL(route:ActivatedRoute){
    var params = this.mapView.retrieveFromRoute(route);
    this._struct = {
      day:+params.dd||this.day,
      month:+params.mm||this.month,
      year:+params.yyyy||this.year
    }
    this.dateChanged(false);
  }

  get year():number {return this._struct.year;}
  get month():number {return this._struct.month;}
  get day():number {return this._struct.day;}

  get date():NgbDateStruct{
    return this._struct;
  }

  set date(d:NgbDateStruct){
    this._struct=d;
    this.constrain();
    this.dateChanged();
  }

  private goto(d:UTCDate){
    this._struct = this.timeUtils.convertDate(d);
  }

  get currentLayer(): VisibleLayer{ return this._layer; }
  set currentLayer(l:VisibleLayer){ this._layer = l; }

  get range(): DateRange{
    return this._layer && this._layer.layer && this._layer.layer.timePeriod;
  }

  // Constrain the selected date to be within the
  // configured range (if any).
  // Returns true if the date was changed, false otherwise
  constrain(): boolean{
    if(!this.currentLayer){
      return false;
    }

    var now = this.effectiveDate();
    if(now<this.range.start){
      this.goto(this.currentLayer.layer.nextTimeStep(this.range.start));
      return true;
    }

    if(now>this.range.end){
      this.goto(this.currentLayer.layer.mostRecentTimestep(this.range.end));
      return true;
    }

    return false;
  }

  private dateChanged(triggerURLUpdate:boolean=true) {
    if(triggerURLUpdate){
      this.updateURL();
    }
    this.dateChange.emit(this.effectiveDate());
  }

  updateURL(){
    var params={
      yyyy:this.year,
      mm:this.month,
      dd:this.day
    };

    this.mapView.update(params);
  }

  move(n:number){
    var d:UTCDate = new Date(this._struct.year,this._struct.month-1,this._struct.day+n,12);
    this._struct = this.timeUtils.convertDate(d);
    d = this.effectiveDate();
    this._struct = this.timeUtils.convertDate(d);

    this.constrain();
    this.dateChanged();
  }

  dateChange: EventEmitter<UTCDate> = new EventEmitter<UTCDate>();

  effectiveDate():UTCDate{
    const current = new Date(Date.UTC(this._struct.year,this._struct.month-1,this._struct.day));
    return this.currentLayer.layer.mostRecentTimestep(current) || current;
  }
}

// export function previousTimeStep(now:UTCDate,timestep?:number):UTCDate{
//   now = utcDateCopy(now);
//   now.setUTCDate(now.getUTCDate()-1);
//   return mostRecentTimestep(now,timestep||DEFAULT_TIMESTEP);
// }

// export function nextTimeStep(now:UTCDate,timestep?:number):UTCDate{
//   timestep = timestep||DEFAULT_TIMESTEP;
//   now = mostRecentTimestep(now,timestep);
//   now.setUTCDate(now.getUTCDate()+timestep);
//   return now;
// }

// export function mostRecentTimestep(d:UTCDate,timestep:number):UTCDate{
//   const newT = (<Date>d).getTime();
//   const refT = new Date(Date.UTC(d.getUTCFullYear(),0,1)).getTime();
//   const deltaT = MILLISECONDS_PER_DAY/2 + newT-refT;
//   const timeStepMS=(timestep*MILLISECONDS_PER_DAY);
//   const offset=+Math.floor(deltaT/timeStepMS);

//   return new Date(refT+offset*timeStepMS);
// }
