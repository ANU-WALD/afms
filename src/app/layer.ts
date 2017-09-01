
export class FMCLayer{
  colours: Array<string>;
  labels: Array<string>;

  constructor(public name:string,public  units:string,public icon:string,public variable:string,public palette:any,
              public range:Array<number>,public description:string,public timePeriod:DateRange,
              public legend:Array<any>,public wmsParams:any){
    if(legend){
      this.colours = legend.map(e=>`rgb(${e.r},${e.g},${e.b})`);
      this.labels = legend.map(e=>e.label);
    }
  }
}

export class DateRange{
  start:Date;
  end:Date;
  format:string;

  static dateFromConfig(json:any,end?:boolean):Date{
    if(!json){
      return new Date();
    }

    if('number' === typeof json){
      if(end){
        return new Date(json,11,31);
      }

      return new Date(json,0,1);
    }

    // ? expect a string and parse out dd/mm/yyyy?
    var [yyyy,mm,dd] = json.split('/').map(elem=>+elem);
    return new Date(yyyy,mm-1,dd);
  }

  static fromJSON(json:any):DateRange{
    var result = new DateRange();
    result.start = DateRange.dateFromConfig(json.start);
    result.end = DateRange.dateFromConfig(json.end,true);
    result.format = json.format || result.format;
    return result;
  }
}
