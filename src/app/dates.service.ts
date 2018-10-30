import { Injectable } from '@angular/core';
import { VisibleLayer } from './main-map/visible-layer';
import { Observable, forkJoin } from 'rxjs';
import { UTCDate, MetadataService, InterpolationService } from 'map-wald';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DatesService {

  constructor(private metadata:MetadataService) { }

  availableDates(layer:VisibleLayer,year:number):Observable<UTCDate[]>{
    let fn = InterpolationService.interpolate(layer.layer.path, {
      year: year
    });

    let res$ = this.metadata.getTimeDimension(layer.host,fn);

    if(!layer.layer.timeshift){
      return res$;
    }

    if(layer.layer.timePeriod.containsYear(year-1)){
      fn = InterpolationService.interpolate(layer.layer.path, {
        year: year-1
      });
      let prev$ = this.metadata.getTimeDimension(layer.host,fn);
      res$ = forkJoin([prev$,res$]).pipe(
        map(years=>years[0].concat(years[1]))
      );
    }

    return res$.pipe(
        map(dates=>{
          return dates.map(d=>{
            let res = new Date(d);
            res.setUTCDate(d.getUTCDate()-layer.layer.timeshift*layer.layer.timestep);
            return res;
          });
        }),
        map(dates=>dates.filter((d,i)=>(i>=Math.abs(layer.layer.timeshift))&&(d.getUTCFullYear()===year)))
    );
  }
}
