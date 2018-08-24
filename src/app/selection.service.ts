import { Injectable, EventEmitter } from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import { MapViewParameterService, TimeUtilsService } from 'map-wald';
import {DateRange} from "./layer";
import {NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';

const MILLISECONDS_PER_DAY=24*60*60*1000;

@Injectable()
export class SelectionService {
  _struct:NgbDateStruct={
    day:29,
    month:5,
    year:2018
  };
  _range:DateRange;

  timeStep:number=4;


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
      this.goto(this.range.start);
      return true;
    }

    if(now>this.range.end){
      this.goto(this.range.end);
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
    return this.mostRecentTimestep(new Date(this._struct.year,this._struct.month-1,this._struct.day,12));
  }

  previousTimeStep(now:Date):Date{
    now.setDate(now.getDate()-1);
    return this.mostRecentTimestep(now);
  }

  mostRecentTimestep(d:Date):Date{
    var newT = d.getTime();
    var refT = new Date(d.getFullYear(),0,1,12).getTime();
    var deltaT = MILLISECONDS_PER_DAY/2 + newT-refT;
    var timeStep=(this.timeStep*MILLISECONDS_PER_DAY);
    var offset=+Math.floor(deltaT/timeStep);

    return new Date(refT+offset*timeStep);
  }
}
