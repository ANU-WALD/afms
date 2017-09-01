import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import { ProjectionService } from "map-wald/index";
import { GeoTransform } from "app/charts/geotransform";
import { LatLng } from "app/latlng";

import 'rxjs/add/observable/from';
import 'rxjs/add/operator/publishReplay';

import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/first';

let dap = require('dap-query-js');

const DAP_SERVER='http://dapds00.nci.org.au/thredds/dodsC/ub8/au/FMC/';

export interface FmcTile{
  filename:string;
  year:number;
  tile:string;
}

export interface TileCell{
  tile: string;
  cell: Array<number>;
}


@Injectable()
export class TimeseriesService {
  projection:any;
  dasCache:{[key:string]:any}={};
  ddxCache:{[key:string]:any}={};
  geoTransforms:{[key:string]:GeoTransform}={};
  files$:Observable<Array<FmcTile>>;
  das$:Observable<Array<[string,any]>>;
  ddx$:Observable<Array<[string,any]>>;
  geoTransforms$:Observable<Array<[string,GeoTransform]>>;

  getAllMetadata(paths$:Observable<string[][]>,metaType:string,parser:(string)=>any){
    return (paths$.map(entries=>{
      return Observable.from(entries.map(([tileID,fn])=>{
        return <Observable<[string,any]>>this.http.get(`${DAP_SERVER}${fn}.${metaType}`)
          .map(resp=>resp.text())
          .map(parser)
          .map(das=>[tileID,das]);
      })).mergeAll();
    }))
      .switch()
      .toArray()
      .publishReplay()
      .refCount();
  }

  constructor(private http:Http, ps:ProjectionService) {
    var proj4 = ps.proj4();
    var def ="+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs";

    this.projection = proj4(def);

    this.files$ = http.get('assets/config/fmc_filelist.json').map(r=>r.json()).map(val=>{
      var fileList = val.files;
      return fileList.map(fullFn=>{
        var [dir,fn] = fullFn.split('/');
        var splitChar='_'
        if(dir==='sinusoidal'){
          splitChar='.';
        }

        var elements=fn.split(splitChar);
        return {
          filename:fullFn,
          dataSet:dir,
          year:+elements[1],
          tile:elements[2]
        };  
      })
    }).publishReplay().refCount();

    var uniqueTiles$ = this.files$.map(allFiles=>Array.from(new Set(allFiles.map(t=>t.tile))));

    var pathsToTiles$ = Observable.forkJoin(this.files$,uniqueTiles$).map(([files,uniqueTiles])=>{
      return uniqueTiles.map(tileID=>{
        var tile = files.find(t=>t.tile===tileID);
        return [tileID,tile.filename];
      });
    });

    this.das$ = this.getAllMetadata(pathsToTiles$,'das',dap.parseDAS);

    this.geoTransforms$ = this.das$.map(allDAS=>{
      return allDAS.map((x)=>{
        var [tileID,das] = x;
        var tmp = das.variables.sinusoidal;
        var geo = tmp.GeoTransform.trim().split(' ').map(s=>+s);
        return [tileID,new GeoTransform(geo)];
      });
    }).publishReplay().refCount();

    this.ddx$ = this.getAllMetadata(pathsToTiles$,'ddx',dap.parseDDX);
  }

  findTile(ll:LatLng):Observable<TileCell>{
    var projected = this.projection.forward([ll.lng,ll.lat]);

    return Observable.forkJoin(this.das$,this.geoTransforms$,this.ddx$)
      .map(([allDAS,allGeo,allDDX])=>{
        return Observable.from(allGeo.map(([tileID,geotransform],i)=>{
          var [row,col] = geotransform.toRowColumn(projected[0],projected[1]);
          col -= 0.5;
          var ddx = allDDX[i][1];

          if((row<0)||(Math.floor(row)>=+ddx.variables.x.dimensions[0].size)||
            (col<0)||(Math.floor(col)>=+ddx.variables.y.dimensions[0].size)){
            return null;
          }

//          console.log('MATCH: '+tileID,row,col);
          return {
            tile:tileID,
            cell:[Math.floor(row),Math.floor(col)]
          };
        }));
      }).switch().first(tc=>tc!==null);
  }

  _match(key:string,pairs:Array<[string,any]>):any{
    return pairs.find(([k,o])=>key===k)[1];
  }

  getTimeSeries(point:LatLng,year:number):Observable<any>{
    return Observable.forkJoin(this.findTile(point),this.files$,this.das$)
      .map(([tileMatch,files,allDAS])=>{
        var tile = tileMatch.tile;
        var cell = tileMatch.cell;
        var das = this._match(tile,allDAS);
        var tileFile = files.find(f=>(f.tile===tile)&&(f.year===year));

        if(!tileFile){
          return Observable.throw(new Error('No time series data'));
        }
        var filename = tileFile.filename;
        var [r,c] = cell;
        var url = `${DAP_SERVER}${filename}.ascii?lfmc_mean[0:1:45][${r}:1:${r}][${c}:1:${c}]`;
        return this.http.get(url).map(r=>r.text())
          .map(txt=>dap.parseData(txt,das))
          .map(dap.simplify)
      }).switch();
  }
}
