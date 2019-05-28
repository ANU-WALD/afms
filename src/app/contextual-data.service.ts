import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchAll, tap } from 'rxjs/operators';
import { MetadataService, OpendapService, InterpolationService, TimeseriesService, UTCDate } from 'map-wald';
import { LayersService, thredds } from './layers.service';
import { MainMapComponent } from './main-map/main-map.component';
import { DapDDX, DapDAS } from 'dap-query-js/dist/dap-query';
import { LatLng } from './latlng';
import { FMCLayer } from './layer';

export interface ContextualInfo{
  [key:string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ContextualDataService {

  constructor(private layers: LayersService,
              private ts: TimeseriesService,
              private dap: OpendapService,
              private metadata:MetadataService) { }

  private effectiveYear(year:number,layer:FMCLayer):number{
    if(!layer.timePeriod){
      return year;
    }

    return Math.max(
      layer.timePeriod.start.getUTCFullYear(),
      Math.min(year, layer.timePeriod.end.getUTCFullYear())
    );
  }

  private getAllMetadata(url,time:boolean):Observable<any>{
    const ddx$ = this.metadata.ddxForUrl(url);
    const das$ = this.metadata.dasForUrl(url);
    const grid$ = this.metadata.getGridForURL(url);
    const time$ = time? this.metadata.getTimeDimensionForURL(url) : of([])
    return forkJoin(ddx$, das$, grid$, time$, of(url)).pipe(
      map(meta => {
        return {
          ddx: <DapDDX>meta[0],
          das: <DapDAS>meta[1],
          grid: <number[][]>meta[2],
          time: <Date[]>meta[3],
          url: <string>meta[4]
        };
      })
    );
  }

  landcover(year:number,pt:LatLng):Observable<string>{
    const variable='quality_mask';
    const lookup = {
      0:'Masked',
      1:'Grass',
      2:'Shrub',
      3:'Forest'
    }
    return this.layers.mask.pipe(
      map(m => {
        const host = thredds(m.host);
        const landCoverYear = this.effectiveYear(year,m);
        const file = InterpolationService.interpolate(m.path, {
          year: landCoverYear
        })
        var url = this.dap.makeURL(host, file);
        return url;
      }),
      map(maskURL => this.getAllMetadata(maskURL,false)),
      switchAll(),
      map(meta => {
        const lats: number[] = (<number[][]>meta.grid)[0];
        const lngs: number[] = (<number[][]>meta.grid)[1];
        const latIndex = this.ts.indexInDimension(pt.lat, lats);
        const lngIndex = this.ts.indexInDimension(pt.lng, lngs);
        const query = `${this.ts.dapRangeQuery(0)}${this.ts.dapRangeQuery(latIndex)}${this.ts.dapRangeQuery(lngIndex)}`;
        return this.dap.getData(`${meta.url}.ascii?${variable}${query}`, meta.das);
      }),
      switchAll(),
      map((data) => {
        return lookup[<number>data[variable]];
      })
    );
  }

  private rangeQuery(c:number,window:number,values:number[]):string{
    const indexMin = this.ts.indexInDimension(c-window, values);
    const indexMax = this.ts.indexInDimension(c+window, values);
    const range = [indexMin,indexMax].sort()
    return this.ts.dapRangeQuery(range[0],range[1]);
  }

  private getContextualLayer(l:FMCLayer,date:UTCDate,pt:LatLng):Observable<any[]>{
    const host = thredds(l.host);
    date = l.effectiveDate(date);
    const year = this.effectiveYear(date.getUTCFullYear(),l);
    const file = InterpolationService.interpolate(l.path, {
      year: year,
      month: date.getUTCMonth()+1,
      date: date.getUTCDate()
    });
    var url = this.dap.makeURL(host, file);
    return this.getAllMetadata(url,l.timestep!==undefined).pipe(
      // tap(d=>console.log(d)),
      map(meta=>{
        const lats: number[] = (<number[][]>meta.grid)[0];
        const lngs: number[] = (<number[][]>meta.grid)[1];
        const window = l.window || 0.0;

        const latQuery = this.rangeQuery(pt.lat,window,lats);
        const lngQuery = this.rangeQuery(pt.lng,window,lngs);
        let closest = 0
        if(meta.time&&meta.time.length){
          const dates:Date[] = meta.time;
          const deltas = dates.map(t => Math.abs(t.getTime() - date.getTime()));
          closest = deltas.indexOf(Math.min(...deltas));

        }
        const dateQuery = this.ts.dapRangeQuery(closest)
        const dims:string[] = meta.ddx.variables[l.variable_name].dimensions.map(dim=>dim.name);
        const queries = {
          time:dateQuery,
          longitude:lngQuery,
          latitude:latQuery
        };

        const query = dims.map(d=>queries[d]).join('');
        return this.dap.getData(`${meta.url}.ascii?${l.variable_name}${query}`, meta.das);
      }),
      switchAll(),
      // tap(d=>console.log(d)),
      map(d=>d[l.variable_name]),
      map(d=>{
        if((<any>d).length && d[0].length){
          let values:number[] = [].concat(...<any>d);
          let valid = values.filter(v=>!isNaN(v));
          switch(l.op){
            case 'mean':
              if(!valid.length){
                return NaN;
              }
              const sum = valid.reduce((l,r)=>l+r)
              return sum/valid.length
          }
        }
        return +d;
      }),
      map(d=>[l.name,`${d.toFixed()}${l.units}`])
    );

  }

  contextualData(layer:FMCLayer,date:UTCDate,pt:LatLng):Observable<ContextualInfo>{
    const additionalContext = layer.contextual||[];

    const additionalLayers = this.layers.availableLayers.pipe(
      map(layers=>layers.filter(lyr=>additionalContext.indexOf(lyr.name)>=0)));

    return forkJoin(this.layers.contextual,additionalLayers).pipe(
      map(combined=>(<FMCLayer[]>[]).concat(...combined)),
      map(layers=>{
        return forkJoin(layers.map(l=>this.getContextualLayer(l,date,pt)));
      }),
      switchAll(),
      map(data=>{
        let result:ContextualInfo = {};
        data.forEach(d=>{
          result[d[0]] = d[1];
        });
        return result;
      })
    );
  }
}
