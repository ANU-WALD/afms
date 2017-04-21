import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class SelectionService {

  constructor() { }

  _year:number = 2010;
  _month:number = 9;
  _day:number = 22;

  get year():number {return this._year;}
  get month():number {return this._month;}
  get day():number {return this._day;}

  set year(v:number) { this._year=v; this._fireDateChange();}
  set month(v:number) { this._month=v; this._fireDateChange();}
  set day(v:number) { this._day=v; this._fireDateChange();}

  _fireDateChange() {
    var txt = `${this._year}-${this._month}-${this.day}`;
    this.dateChange.emit(txt);
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
