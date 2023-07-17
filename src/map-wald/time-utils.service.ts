import { Injectable } from '@angular/core';

export interface DateStruct {
  // ng-bootstrap
  day:number;
  month:number;
  year:number;
}

export interface UTCDate {
  getTime(): number;
  getUTCFullYear(): number;
  getUTCMonth():number;
  getUTCDate():number;

  setUTCFullYear(n: number):void;
  setUTCMonth(n:number):void;
  setUTCDate(n:number):void;
}

export function utcDate(y:number,m?:number,d?:number):UTCDate{
  return new Date(Date.UTC(y,m,d));
}

export function utcDateCopy(d:UTCDate){
  return utcDate(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
}

@Injectable()
export class TimeUtilsService {

  constructor() {

  }

  specialDates: {[key:string]:(() => Date)} = {
    yesterday: () => {
      var d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    }
  }

  convertDate(d:(UTCDate|string)):DateStruct{
    if(!d){
      d = new Date();
    }

    var date:UTCDate;
    if(typeof(d) === 'string'){
      var dateText:string = d;
      if(this.specialDates[dateText]){
        date = this.specialDates[dateText]();
      } else {
        var [year,month,day,other] = d.split('-').map(c => +c);
        date = utcDate(year,month,day);
      }
    } else {
      date = d;
    }

    return {
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear()
    };
  }

  datesEqual(lhs:DateStruct,rhs:DateStruct):boolean{
    if(!lhs || !rhs){
      return false;
    }

    return (lhs.year === rhs.year) &&
           (lhs.month === rhs.month) &&
           (lhs.day === rhs.day);

  }
}
