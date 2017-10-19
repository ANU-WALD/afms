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
  dataSet:string;
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
  das$:Observable<Array<[FmcTile,any]>>;
  ddx$:Observable<Array<[FmcTile,any]>>;
  geoTransforms$:Observable<Array<[string,GeoTransform]>>;

  getAllMetadata(paths$:Observable<FmcTile[]>,metaType:string,parser:(string)=>any){
    return (paths$.map(entries=>{
      return Observable.from(entries.map(tile=>{
        return <Observable<[FmcTile,any]>>this.http.get(`${DAP_SERVER}${tile.filename}.${metaType}`)
          .map(resp=>resp.text())
          .map(parser)
          .map(metadata=>[tile,metadata]);
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
        var elements:Array<string>;
        if(dir==='sinusoidal'){
          elements = fn.split('.');
        } else {
          elements = fn.split('_')
          elements[2] = elements[2].split('.')[0];
        }

        return {
          filename:fullFn,
          dataSet:dir,
          year:+elements[1],
          tile:elements[2]
        };  
      })
    }).publishReplay().refCount();

    var uniqueTiles$ = this.files$.map(allFiles=>{
      return Array.from(new Set(allFiles.map(t=>`${t.tile}-${t.dataSet}`)));
    });

    var pathsToTiles$ = Observable.forkJoin(this.files$,uniqueTiles$).map(([files,uniqueTiles])=>{
      return uniqueTiles.map(tileIDandDataset=>{
        var [tileID, dataSet] = tileIDandDataset.split('-');
        var tile = files.find(t=>t.tile===tileID);
        return [tileID,dataSet,tile.filename];
      });
    });

    this.das$ = this.getAllMetadata(this.files$,'das',dap.parseDAS);

    this.geoTransforms$ = this.das$.map(allDAS=>{
//      var justSinusoidal = allDAS.filter(([tile,das])=>tile.dataSet==='sinusoidal');
      var uniqueTiles = Array.from(new Set(allDAS.map(([t,das])=>t.tile)));
      var dasForUniqueTiles = uniqueTiles.map(tileID=>{
        return allDAS.find(([t,das])=>t.tile===tileID);
      })
      return dasForUniqueTiles.map((x)=>{
        var [tile,das] = x;
        var tmp = das.variables.sinusoidal;
        var geo = tmp.GeoTransform.trim().split(' ').map(s=>+s);
        return [tile.tile,new GeoTransform(geo)];
      });
    }).publishReplay().refCount();

    // var pathToAllTiles$ = this.files$.map(files=>{
    //   return files.map(file=>{
    //     return [
    //       file.tile,
    //       file.dataSet,
    //       file.filename
    //     ];
    //   });
    // });
    this.ddx$ = this.getAllMetadata(this.files$,'ddx',dap.parseDDX);
  }

  findTile(ll:LatLng):Observable<TileCell>{
    var projected = this.projection.forward([ll.lng,ll.lat]);

    return Observable.forkJoin(this.das$,this.geoTransforms$,this.ddx$)
      .map(([allDAS,allGeo,allDDX])=>{
        return Observable.from(allGeo.map(([tileID,geotransform],i)=>{
          var [row,col] = geotransform.toRowColumn(projected[0],projected[1]);
          col -= 0.5;
          var ddx = this._match({tile:tileID},allDDX);

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

  _match(search:any,pairs:Array<[FmcTile,any]>):any{
    var result = pairs.find(([t,o])=>{
      for(var k in search){
        if(search[k]!==t[k]){
          return false;
        }
      }
      return true;
    });
    
    if(result){
      return result[1];
    }
    return undefined;
  }

  getTimeSeries(point:LatLng,year:number):Observable<any>{
    return Observable.forkJoin(this.findTile(point),this.files$,this.das$,this.ddx$)
      .map(([tileMatch,files,allDAS,allDDX])=>{
        var tile = tileMatch.tile;
        var cell = tileMatch.cell;
        var matchCriteria = {year:year,tile:tile};
        var das = this._match(matchCriteria,allDAS);
        var ddx = this._match(matchCriteria,allDDX);
        var tileFile = files.find(f=>(f.tile===tile)&&(f.year===year));

        if(!tileFile){
          return Observable.throw(new Error(`No time series data at ${tile} in ${year}`));
        }
        // console.log(das);
        // console.log(ddx);
        var nTimeSteps = +(ddx.variables.time.dimensions[0].size);
        //console.log(ddx.variables.time.dimensions,nTimeSteps);
        var filename = tileFile.filename;
        var [r,c] = cell;
        var variable='lvmc_mean';
        //variable =  filename.split('/')[1].split('_')[0].toLowerCase() + '_mean';
        var url = `${DAP_SERVER}${filename}.ascii?${variable}[0:1:${nTimeSteps-1}][${r}:1:${r}][${c}:1:${c}]`;
        return this.http.get(url).map(r=>r.text())
          .map(txt=>dap.parseData(txt,das))
          .map(dap.simplify)
      }).switch();
  }
}
