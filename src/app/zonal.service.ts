import { Injectable } from '@angular/core';
import { FMCLayer } from './layer';
import { VectorLayer } from './vector-layer-selection/vector-layer-selection.component';
import { UTCDate, InterpolationService, parseCSV, TableRow, MetadataService, OpendapService } from 'map-wald';
import { Observable, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, switchAll } from 'rxjs/operators';
import { environment } from 'environments/environment';

const ZONAL_URL='{{tds}}/dodsC/ub8/au/FMC/c6/mosaics/deciles/zonal_stats/{{vector_name}}_{{variable_name}}_{{mode}}zonal_stat.nc';
const ZONAL_URL_CSV='assets/deciles/{{vector_name}}_{{variable_name}}.csv';
export const DEFAULT_ZONAL_STATS_COVERAGE_THRESHOLD=75;
export const DEFAULT_ZONAL_STATS_COVERAGE_THRESHOLD_SINGLE_COVER=33;
export const ZONAL_AVERAGE='nc_';
export const ZONAL_RELATIVE='';

@Injectable({
  providedIn: 'root'
})
export class ZonalService {
  constructor(private _http:HttpClient,
              private _meta: MetadataService,
              private _dap:OpendapService) { }

  getForDate(layer:FMCLayer,
             polygons:VectorLayer,
             date:UTCDate,
             mode:string,
             coverageThreshold?:number,
             landcover?:number):Observable<TableRow>{
    let landcoverStr = '';
    if(landcover!==undefined){
      landcoverStr = `_${landcover}`;
    }

    if(coverageThreshold===undefined){
      coverageThreshold = landcover===undefined ?
        DEFAULT_ZONAL_STATS_COVERAGE_THRESHOLD :
        DEFAULT_ZONAL_STATS_COVERAGE_THRESHOLD_SINGLE_COVER;
    }

    const avgVar = `avg${landcoverStr}`;
    const covVar = `coverage${landcoverStr}`;

    date = layer.effectiveDate(date);

    const params = {
      tds:environment.tds_server,
      variable_name:layer.zonal,
      vector_name:polygons.zonal,
      mode:mode
    };

    const url = InterpolationService.interpolate(ZONAL_URL,params);

    const das$ = this._meta.dasForUrl(url);
    const ddx$ = this._meta.ddxForUrl(url);
    const time$ = this._meta.getTimeDimensionForURL(url);

    const result$ = forkJoin([das$,ddx$,time$]).pipe(
      map(dasAndDdx=>{
        return {
          das:dasAndDdx[0],
          ddx:dasAndDdx[1],
          time:dasAndDdx[2]
        };
      }),
      map(meta=>{
        let closest = 0
        if(meta.time&&meta.time.length){
          const dates:Date[] = meta.time;
          const deltas = dates.map(t => Math.abs(t.getTime() - date.getTime()));
          closest = deltas.indexOf(Math.min(...deltas));
        }
        const dateQuery = this._dap.dapRangeQuery(closest);
        const queryUrl = `${url}.ascii?${avgVar}${dateQuery},${covVar}${dateQuery}`;
        return this._dap.getData(queryUrl,meta.das);
      }),
      switchAll(),
      map(data=>{
        const result:any = {};
        const ids = <number[]>data.plg_id;
        const vals = <number[]>data[avgVar];
        const cov = <number[]>data[covVar];
        ids.forEach((plg_id,i)=>{
          if(cov[i]<coverageThreshold){
            result[plg_id]=NaN;
          } else {
            result[plg_id]=vals[i];
          }
        });
        return result;
      })
    );

    return result$;
  }

  getForDateCSV(layer:FMCLayer,polygons:VectorLayer,date:UTCDate):Observable<TableRow>{
    date = layer.effectiveDate(date);

    let params = {
      variable_name:layer.variable_name,
      vector_name:polygons.baseFilename()
    };
    let url = InterpolationService.interpolate(ZONAL_URL_CSV,params);

    return this._http.get(url,{
      responseType:'text'
    }).pipe(
      map(txt=>{
        return parseCSV(txt);
      }),
      map(table=>{
        return table.filter((row,i)=>{
          const rowDate:UTCDate = row.time;
          return (rowDate.getUTCFullYear()===date.getUTCFullYear()) &&
          (rowDate.getUTCMonth()===date.getUTCMonth()) &&
          (rowDate.getUTCDate()===date.getUTCDate());
        });
      }),
      map(rows=>{
        const result:any = {};
        rows.forEach(row => {
          result[row.plg_id] = (row.avg==='')?NaN:+row.avg;
        });
        return result;
      })
    );
  }
}
