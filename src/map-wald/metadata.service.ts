import { Injectable } from '@angular/core';
import { MappedLayer } from './data/mapped-layer';
import { DapDDX, DapDAS, DapData } from 'dap-query-js/dist/dap-query';
import { OpendapService } from './opendap.service';
import { Bounds } from './data/bounds';

import { CatalogHost } from './data/catalog';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, publishReplay, refCount, map, switchAll, tap, shareReplay } from 'rxjs/operators';
import { UTCDate } from './time-utils.service';

export const LAT_NAMES=['latitude','lat'];
export const LNG_NAMES=['longitude','lng','lon'];
export const TIME_NAMES=['time','t','Time'];

@Injectable()
export class MetadataService {
  ddxCache:{[key:string]:Observable<DapDDX>}={}
  dasCache:{[key:string]:Observable<DapDAS>}={}

  constructor(private dap:OpendapService) {

  }

  identifyCoordinate(ddx:DapDDX,...possibleNames:Array<string>):string{
    for(let n of possibleNames){
      if(ddx.variables[n]){
        return n;
      }
    }
    return undefined;
  }

  getDDX(host:CatalogHost,file:string):Observable<DapDDX>{
    var url = this.dap.makeURL(host,file);

    return this.ddxForUrl(url);
  }

  ddxForUrl(url:string):Observable<DapDDX>{
    if(!this.ddxCache[url]){
      this.ddxCache[url] =
        this.dap.getDDX(url).pipe(publishReplay(),refCount());
    }

    return this.ddxCache[url];
}

  getDDXForLayer(ml:MappedLayer):Observable<DapDDX>{
    return this.getDDX(ml.flattenedSettings.host,ml.interpolatedFile);
  }

  getDAS(host:CatalogHost,file:string):Observable<DapDAS>{
    var url = this.dap.makeURL(host,file);
    return this.dasForUrl(url);
  }

  dasForUrl(url:string):Observable<DapDAS>{
    if(!this.dasCache[url]){
      this.dasCache[url] =
        this.dap.getDAS(url).pipe(publishReplay(),refCount());
    }

    return this.dasCache[url];
  }

  getDASForLayer(ml:MappedLayer):Observable<DapDAS>{
    return this.getDAS(ml.flattenedSettings.host,ml.interpolatedFile);
  }

  getMetadata(ml:MappedLayer):Observable<any>{
    if(ml.flattenedSettings.host.software !=='tds'){
      return of({});
    }

    return forkJoin([this.getDASForLayer(ml),this.getDDXForLayer(ml)]).pipe(
      map(meta=>{
        return {
          das: <DapDAS>meta[0],
          ddx: <DapDDX>meta[1]
        };
      }),
      map(meta=>{
        return Object.assign({},
                             meta.das.attr||{},
                             meta.ddx.variables[ml.flattenedSettings.layer||ml.flattenedSettings.variable]||{});
      }));
  }

  populateMetadata(ml:MappedLayer){
    this.getMetadata(ml).subscribe(entry=>{
      setTimeout(()=>{
        ml.retrievedMetadata = entry;
      })
    });
  }

  getGrid(host:CatalogHost,file:string):Observable<number[][]>{
    const url = this.dap.makeURL(host,file);
    return this.getGridForURL(url);
  }

  getGridForURL(url:string):Observable<number[][]>{
    const ddx$ = this.ddxForUrl(url);
    const das$ = this.dasForUrl(url);
    const res$ = <Observable<number[][]>>forkJoin([ddx$,das$]).pipe(
      map((metadata:any[])=>{
        const ddx:DapDDX = metadata[0];
        const das:DapDAS = metadata[1];

        const latCoord = this.identifyCoordinate(ddx,...LAT_NAMES);
        const lngCoord = this.identifyCoordinate(ddx,...LNG_NAMES);

        const lat$ =
          this.dap.getData(`${url}.ascii?${latCoord}`,das).pipe(
            map((dd:DapData)=><number[]>dd[latCoord]));
        const lng$ =
          this.dap.getData(`${url}.ascii?${lngCoord}`,das).pipe(
            map((dd:DapData)=><number[]>dd[lngCoord]));

        return forkJoin<number[]>(lat$,lng$);
      }),switchAll(),publishReplay(),refCount());
      return res$;
  }

  getGridForLayer(ml:MappedLayer):Observable<Array<Array<number>>>{
    return this.getGrid(ml.flattenedSettings.host,ml.interpolatedFile);
  }

  getSpatialExtent(ml:MappedLayer):Observable<Bounds>{
    return this.getGridForLayer(ml).pipe(map(([lats,lngs])=>{
      var result:Bounds = {
        east: Math.max(...lngs),
        west: Math.min(...lngs),
        north: Math.max(...lats),
        south: Math.min(...lats)
      };
      return result;
    })).pipe(publishReplay(), refCount());
  }

  getTimeDimension(host:CatalogHost,file:string):Observable<UTCDate[]>{
    const url = this.dap.makeURL(host,file);
    return this.getTimeDimensionForURL(url);
  }

  timeCache:{[key:string]:Observable<UTCDate[]>}={};

  getTimeDimensionForURL(url:string):Observable<UTCDate[]>{
    if(!this.timeCache[url]){
      const ddx$ = this.ddxForUrl(url);
      const das$ = this.dasForUrl(url);
      const res$ = <Observable<UTCDate[]>>forkJoin([ddx$,das$]).pipe(
        map((metadata:any[])=>{
          const ddx:DapDDX = metadata[0];
          const das:DapDAS = metadata[1];

          const timeCoord = this.identifyCoordinate(ddx,...TIME_NAMES);

          const time$ =
            this.dap.getData(`${url}.ascii?${timeCoord}`,das).pipe(
              map((dd:DapData)=><UTCDate[]>dd[timeCoord]));

          return time$;
        }),switchAll(),shareReplay());
      this.timeCache[url] = res$;
    }
    return this.timeCache[url];
  }
}
