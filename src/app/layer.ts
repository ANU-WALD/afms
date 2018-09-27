import { previousTimeStep, nextTimeStep } from "./selection.service";
import { UTCDate, utcDate} from 'map-wald';

export class FMCLayer {
  colours: Array<string>;
  labels: Array<string>;

  constructor(public name: string, public units: string, public icon: string, public variable_name: string, public palette: any,
              public range: Array<number>, public description: string, public timePeriod: DateRange,
              public legend: Array<any>, public wmsParams: any, public source: string, public path: string,
              public chartConfig: any, public host: string, public urlFragment: string, public indexing: any,
              public suffix: string, public timeshift:number, public precision:number) {

    this.indexing = this.indexing || {};
    // if (chartConfig) {
    //   console.log(chartConfig);
    // }
    if (legend) {
      this.colours = legend.map(e => `rgb(${e.r},${e.g},${e.b})`);
      this.labels = legend.map(e => e.label);
    }
  }

  effectiveDate(d:UTCDate):UTCDate{
    for(let i = 0; i < Math.abs(this.timeshift); i++){
      d = previousTimeStep(d);
    }
    return d;
  }

  reverseDate(d:UTCDate):UTCDate{
    for(let i = 0; i < Math.abs(this.timeshift); i++){
      d = nextTimeStep(d);
    }
    return d;
  }
}

export class DateRange {
  start: UTCDate;
  end: UTCDate;
  format: string;

  static dateFromConfig(json: any, end?: boolean): UTCDate {
    if (!json) {
      return new Date();
    }

    if ('number' === typeof json) {
      if(json<0){
        let d = new Date();
        d.setUTCDate(d.getUTCDate()+json);
        return d;
      }
      if (end) {
        return utcDate(json, 11, 31);
      }

      return utcDate(json, 0, 1);
    }

    // ? expect a string and parse out dd/mm/yyyy?
    var [yyyy, mm, dd] = json.split('/').map(elem => +elem);
    return new Date(yyyy, mm - 1, dd);
  }

  static fromJSON(json: any): DateRange {
    var result = new DateRange();
    result.start = DateRange.dateFromConfig(json.start);
    result.end = DateRange.dateFromConfig(json.end, true);
    result.format = json.format || result.format;
    return result;
  }
}

