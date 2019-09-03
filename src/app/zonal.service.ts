import { Injectable } from '@angular/core';
import { FMCLayer } from './layer';
import { VectorLayer } from './vector-layer-selection/vector-layer-selection.component';
import { UTCDate, InterpolationService, parseCSV, TableRow } from 'map-wald';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

const ZONAL_URL='assets/deciles/{{vector_name}}_{{variable_name}}.csv';

@Injectable({
  providedIn: 'root'
})
export class ZonalService {
  constructor(private _http:HttpClient) { }

  getForDate(layer:FMCLayer,polygons:VectorLayer,date:UTCDate):Observable<TableRow>{
    date = layer.effectiveDate(date);

    let params = {
      variable_name:layer.variable_name,
      vector_name:polygons.baseFilename()
    };
    let url = InterpolationService.interpolate(ZONAL_URL,params);

    return this._http.get(url,{
      responseType:'text'
    }).pipe(
      map(txt=>{
        return parseCSV(txt);
      }),
      map(table=>{
        return table.filter((row,i)=>{
          let rowDate:UTCDate = row.time;
          return (rowDate.getUTCFullYear()===date.getUTCFullYear()) &&
          (rowDate.getUTCMonth()===date.getUTCMonth()) &&
          (rowDate.getUTCDate()===date.getUTCDate());
        });
      }),
      map(rows=>{
        let result:any = {};
        rows.forEach(row => {
          result[row.plg_id] = row.avg;
        });
        return result;
      })
    );
  }
}
