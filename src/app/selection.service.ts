import { Injectable, EventEmitter } from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {MapViewParameterService} from 'map-wald';

@Injectable()
export class SelectionService {
  _year:number = 2010;
  _month:number = 9;
  _day:number = 22;

  constructor(private mapView:MapViewParameterService,
              private _location: Location) {
  }

  loadFromURL(route:ActivatedRoute){
    var params = this.mapView.retrieveFromRoute(route);
    this.year = +params.yyyy||this.year;
    this.month = +params.mm||this.month;
    this.day = +params.dd||this.day;
  }

  get year():number {return this._year;}
  get month():number {return this._month;}
  get day():number {return this._day;}

  set year(v:number) { this._year=v; this._fireDateChange();}
  set month(v:number) { this._month=v; this._fireDateChange();}
  set day(v:number) { this._day=v; this._fireDateChange();}

  leading0(n:number):string {
    if(n<10){
      return '0'+n;
    }
    return ''+n;
  }

  dateText():string {
    return `${this._year}-${this.leading0(this._month)}-${this.leading0(this.day)}`;
  }

  _fireDateChange() {
    this.updateURL();
    this.dateChange.emit(this.dateText());
  }

  updateURL(){
    var params={
      yyyy:this.year,
      mm:this.month,
      dd:this.day
    };

    var newURL=this.mapView.constructRoute(params);
    this._location.go(newURL);
  }
  move(n:number){
    var d = new Date(this._year,this._month-1,this._day+n);
    this._year = d.getFullYear();
    this._month = d.getMonth()+1;
    this._day = d.getDate();
    this._fireDateChange();
  }
  dateChange: EventEmitter<string> = new EventEmitter<string>();


}
