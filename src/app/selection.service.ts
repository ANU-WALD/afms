import { Injectable, EventEmitter } from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import { MapViewParameterService, TimeUtilsService } from 'map-wald';
import {DateRange} from './layer';
import {NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';

const MILLISECONDS_PER_DAY=24*60*60*1000;
export const DEFAULT_TIMESTEP=4;

@Injectable()
export class SelectionService {
  _struct:NgbDateStruct={
    day:5,
    month:5,
    year:2018
  };
  _range:DateRange;

  timeStep=DEFAULT_TIMESTEP;

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

  private goto(d:Date){
    this._struct = this.timeUtils.convertDate(d);
  }

  get range():DateRange{ return this._range; }
  set range(dr:DateRange){
    this._range = dr;
    if(this.constrain()){
      this.dateChanged();
    }
  }

  // Constrain the selected date to be within the
  // configured range (if any).
  // Returns true if the date was changed, false otherwise
  constrain(): boolean{
    if(!this.range){
      return false;
    }

    var now = this.effectiveDate();
    if(now<this.range.start){
      this.goto(nextTimeStep(this.range.start,this.timeStep));
      return true;
    }

    if(now>this.range.end){
      this.goto(mostRecentTimestep(this.range.end,this.timeStep));
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
    var d = new Date(this._struct.year,this._struct.month-1,this._struct.day+n,12);
    this._struct = this.timeUtils.convertDate(d);
    d = this.effectiveDate();
    this._struct = this.timeUtils.convertDate(d);

    this.constrain();
    this.dateChanged();
  }

  dateChange: EventEmitter<Date> = new EventEmitter<Date>();

  effectiveDate():Date{
    return mostRecentTimestep(
      new Date(this._struct.year,this._struct.month-1,this._struct.day,12),
      this.timeStep);
  }
}

export function previousTimeStep(now:Date,timestep?:number):Date{
  now = new Date(now);
  now.setDate(now.getDate()-1);
  return mostRecentTimestep(now,timestep||DEFAULT_TIMESTEP);
}

export function nextTimeStep(now:Date,timestep?:number):Date{
  timestep = timestep||DEFAULT_TIMESTEP;
  now = mostRecentTimestep(now,timestep);
  now.setDate(now.getDate()+timestep);
  return now;
}

export function mostRecentTimestep(d:Date,timestep:number):Date{
  const newT = d.getTime();
  const refT = new Date(d.getFullYear(),0,1,12).getTime();
  const deltaT = MILLISECONDS_PER_DAY/2 + newT-refT;
  const timeStepMS=(timestep*MILLISECONDS_PER_DAY);
  const offset=+Math.floor(deltaT/timeStepMS);

  return new Date(refT+offset*timeStepMS);
}
