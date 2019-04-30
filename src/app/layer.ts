import { UTCDate, utcDate, utcDateCopy, InterpolationService } from 'map-wald';

const MAXIMUM_DATE_SHIFT=60;

export class FMCLayer {
  colours: Array<string>;

  constructor(public name: string, public units: string, public icon: string, public variable_name: string, public palette: any,
    public range: Array<number>, public description: string, public timePeriod: DateRange,
    public legend: Array<any>, public wmsParams: any, public source: string, public path: string,
    public chartConfig: any, public host: string, public urlFragment: string, public indexing: any,
    public suffix: string, public timeshift: number, public timestep: number, public precision: number,
    public refDate: string,public op:string, public window:number, public labels:string[]) {

    this.indexing = this.indexing || {};
    // if (chartConfig) {
    //   console.log(chartConfig);
    // }
    if (legend) {
      this.colours = legend.map(e => `rgb(${e.r},${e.g},${e.b})`);
      this.labels = legend.map(e => e.label);
    }
  }

  expectedDates(yr: number): UTCDate[] {
    let ref: UTCDate;

    if (this.refDate) {
      let refComponents = InterpolationService.interpolate(this.refDate, {
        year: yr,
        month: 1,
        date: 1
      }).split('-').map(s => +s);

      ref = utcDate(refComponents[0], refComponents[1] - 1, refComponents[2]);
    } else {
      ref = utcDate(yr, 0, 1);
    }

    let d = ref;
    let result = [];
    let i = 0;
    while (d.getUTCFullYear() === yr) {
      result.push(d);

      i++;
      d = utcDateCopy(ref);
      d.setUTCDate(d.getUTCDate() + i * this.timestep);
    }

    return result;
  }

  previousTimeStep(d: UTCDate): UTCDate {
    let pr = utcDateCopy(d);
    pr.setUTCDate(pr.getUTCDate() - this.timestep);

    if (!this.refDate || (pr.getUTCFullYear() === d.getUTCFullYear())) {
      return pr;
    }

    let prevYear = this.expectedDates(pr.getUTCFullYear());
    return prevYear[prevYear.length-1];
  }

  nextTimeStep(d: UTCDate): UTCDate {
    let nx = utcDateCopy(d);
    nx.setUTCDate(nx.getUTCDate() + this.timestep);

    if (!this.refDate || (nx.getUTCFullYear() === d.getUTCFullYear())) {
      return nx;
    }

    let refComponents = InterpolationService.interpolate(this.refDate, {
      year: nx.getUTCFullYear(),
      month: nx.getUTCMonth() + 1,
      date: nx.getUTCDate()
    }).split('-').map(s => +s);

    return utcDate(refComponents[0], refComponents[1] - 1, refComponents[2]);
  }

  mostRecentTimestep(ref:UTCDate):UTCDate{
    let dates = this.expectedDates(ref.getUTCFullYear());
    dates = dates.filter(d=>this.timePeriod.contains(d));
    dates.reverse();
    return dates.find(d=>d<=ref);
  }

  effectiveDate(d: UTCDate): UTCDate {
    for (let i = 0; i < Math.abs(this.timeshift); i++) {
      d = this.previousTimeStep(d);
    }
    return d;
  }

  reverseDate(d: UTCDate): UTCDate {
    for (let i = 0; i < Math.abs(this.timeshift); i++) {
      d = this.nextTimeStep(d);
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
      if (json < MAXIMUM_DATE_SHIFT) {
        let d = new Date();
        d.setUTCDate(d.getUTCDate() + json);
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

    if(json){
      result.start = DateRange.dateFromConfig(json.start);
      result.end = DateRange.dateFromConfig(json.end, true);
      result.format = json.format || result.format;
    }

    return result;
  }

  containsYear(yr: number): boolean {
    return (yr >= this.start.getUTCFullYear()) &&
      (yr <= this.end.getUTCFullYear());
  }

  contains(d:UTCDate):boolean{
    let yr = d.getUTCFullYear();

    if((yr<this.start.getUTCFullYear())||
       (yr>this.end.getUTCFullYear())){
      return false;
    }

    if(yr<this.end.getUTCFullYear()){
      return true;
    }
    return d<=this.end;
  }
}

