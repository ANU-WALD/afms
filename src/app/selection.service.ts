import { Injectable, EventEmitter } from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {MapViewParameterService} from 'map-wald';

const MILLISECONDS_PER_DAY=24*60*60*1000;

@Injectable()
export class SelectionService {
  _year:number = 2010;
  _month:number = 9;
  _day:number = 22;
  _struct:any;

  timeStep:number=8;


  constructor(private mapView:MapViewParameterService,
              private _location: Location) {
  }

  loadFromURL(route:ActivatedRoute){
    var params = this.mapView.retrieveFromRoute(route);
    this.year = +params.yyyy||this.year;
    this.month = +params.mm||this.month;
    this.day = +params.dd||this.day;
    this._fireDateChange();
  }

  get year():number {return this._year;}
  get month():number {return this._month;}
  get day():number {return this._day;}

  set year(v:number) { this._year=v; this._buildStruct(); this._fireDateChange();}
  set month(v:number) { this._month=v; this._buildStruct(); this._fireDateChange();}
  set day(v:number) { this._day=v; this._buildStruct(); this._fireDateChange();}

  get date():any{
    if(!this._struct){
      this._buildStruct();
    }
    return this._struct;
  }

  set date(d:any){
    console.log(d);
    this._struct=d;
    this._year = d.year;
    this._month = d.month;
    this._day = d.day;
    this._fireDateChange();
  }

  leading0(n:number):string {
    if(n<10){
      return '0'+n;
    }
    return ''+n;
  }

  dateText(d:Date):string {
    return `${d.getFullYear()}-${this.leading0(d.getMonth()+1)}-${this.leading0(d.getDate())}`;
  }

  _buildStruct(){
    this._struct = {
      year:this._year,
      month:this._month,
      day:this.day
    };
  }

  _fireDateChange() {
    this.updateURL();
    this.dateChange.emit(this.dateText(this.effectiveDate()));
  }

  updateURL(){
    var params={
      yyyy:this.year,
      mm:this.month,
      dd:this.day
    };

    this.mapView.update(params);
//    var newURL=this.mapView.constructRoute(params);
//    this._location.go(newURL);
  }

  move(n:number){
    var d = new Date(this._year,this._month-1,this._day+n,12);
    this._year = d.getFullYear();
    this._month = d.getMonth()+1;
    this._day = d.getDate();
    d = this.effectiveDate();
    this._year = d.getFullYear();
    this._month = d.getMonth()+1;
    this._day = d.getDate();

    this._buildStruct();
    this._fireDateChange();
  }
  dateChange: EventEmitter<string> = new EventEmitter<string>();

  effectiveDate():Date{
    return this.mostRecentTimestep(new Date(this._year,this._month-1,this._day,12));
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
