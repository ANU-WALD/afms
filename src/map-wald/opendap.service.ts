import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { parseData, parseDAS,parseDDX,
  simplify, DapData, DapDAS, DapDDX, DapVariableDataArray } from 'dap-query-js/dist/dap-query';
import { CatalogHost } from './data/catalog';
import { map, switchMap } from 'rxjs/operators';
import { Observable,forkJoin } from 'rxjs';

@Injectable()
export class OpendapService {

  constructor(private http:HttpClient) {

  }

  makeURL(host:CatalogHost,filepath:string):string{
    return host.url + '/dodsC/' + filepath;
  }

  get(url:string):Observable<string>{
    return this.http.get(url,{ responseType: 'text' })
  }

  getData(queryUrl:string,das:DapDAS):Observable<DapData>{
    return this.get(queryUrl).pipe(
      map((txt:string)=>simplify(parseData(txt,das))));
  }

  getDAS(url:string):Observable<DapDAS>{
    return this.get(url+'.das').pipe(
      map(parseDAS));
  }

  getDDX(url:string):Observable<DapDDX>{
    return this.get(url+'.ddx').pipe(
      map(parseDDX));
  }

  getExtent(url:string):Observable<number[]>{
    console.log(url);
    return forkJoin([
      this.getDAS(url),
      this.getDDX(url)
    ]).pipe(switchMap(([theDAS,theDDX])=>{
      var das:DapDAS = <DapDAS>theDAS;
      return forkJoin([
        this.getData(url+'.ascii?latitude',das),
        this.getData(url+'.ascii?longitude',das)
      ])}),
      map((ll:DapData[])=>{
        var lats = <DapVariableDataArray>ll[0].latitude;
        var lons = <DapVariableDataArray>ll[1].longitude;
        return [<number>lats[0],<number>lats[lats.length-1],
                <number>lons[0],<number>lons[lons.length-1]];
      }));
  }

  dapRangeQuery(from:number,to?:number,step?:number):string{
    step = step || 1;
    if(to===undefined){
      to = from;
    }
    return '['+from+':'+step+':'+to+']';
  }
}
