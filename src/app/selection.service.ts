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
    this.dateChange.emit(this.dateText());
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
