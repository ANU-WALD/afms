import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchAll } from 'rxjs/operators';
import { MetadataService, OpendapService, InterpolationService, TimeseriesService } from 'map-wald';
import { LayersService } from './layers.service';
import { MainMapComponent } from './main-map/main-map.component';
import { DapDDX, DapDAS } from 'dap-query-js/dist/dap-query';
import { LatLng } from './latlng';

@Injectable({
  providedIn: 'root'
})
export class ContextualDataService {

  constructor(private layers: LayersService,
              private ts: TimeseriesService,
              private dap: OpendapService,
              private metadata:MetadataService) { }

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
        const host = MainMapComponent.thredds(m.host);
        const landCoverYear = Math.max(
          m.timePeriod.start.getUTCFullYear(),
          Math.min(year, m.timePeriod.end.getUTCFullYear())
        );
        const file = InterpolationService.interpolate(m.path, {
          year: landCoverYear
        })
        var url = this.dap.makeURL(host, file);
        return url;
      }),
      map(maskURL => {
        const ddx$ = this.metadata.ddxForUrl(maskURL);
        const das$ = this.metadata.dasForUrl(maskURL);
        const grid$ = this.metadata.getGridForURL(maskURL);
        return forkJoin(ddx$, das$, grid$, of(maskURL))
      }),
      switchAll(),
      map(meta => {
        return {
          ddx: <DapDDX>meta[0],
          das: <DapDAS>meta[1],
          grid: <number[][]>meta[2],
          url: <string>meta[3]
        };
      }),
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
}
