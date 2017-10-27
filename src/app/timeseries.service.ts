import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import { ProjectionService } from 'map-wald/index';
import { GeoTransform } from 'app/charts/geotransform';
import { LatLng } from 'app/latlng';

import 'rxjs/add/observable/from';
import 'rxjs/add/operator/publishReplay';

import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/mergeMap';

const dap = require('dap-query-js');

const DAP_SERVER = 'http://dapds00.nci.org.au/thredds/dodsC/ub8/au/FMC/';

export interface FmcTile {
  dataSet: string;
  filename: string;
  year: number;
  tile: string;
}

export interface TileCell {
  tile: string;
  cell: Array<number>;
}


@Injectable()
export class TimeseriesService {
  projection: any;
  dasCache: {[key: string]: any} = {};
  ddxCache: {[key: string]: any} = {};
  geoTransforms: {[key: string]: GeoTransform} = {};
  files: Observable<FmcTile[]>;
  das$: Observable<Array<[FmcTile, any]>>;
  ddx$: Observable<Array<[FmcTile, any]>>;
  geoTransforms$: Observable<Array<[string, GeoTransform]>>;

  getMetaData(tile: FmcTile, metaType: string, parser: (string) => any): Observable<[FmcTile, string]> {

    return this.http.get(`${DAP_SERVER}${tile.filename}.${metaType}`)
                                .map(resp => resp.text())
                                .map(parser)
                                .map(metadata => [tile, metadata]);
  }


  getAllMetadata(metaType: string, parser: (string) => any): Observable<[FmcTile, string][]> {

    return this.files.flatMap(files => {

      return Observable.from(files.map(tile => { return this.getMetaData(tile, metaType, parser); }))
        .mergeAll()
        .toArray();

    });

  }

  private parseFileList(fileObject: any): Array<FmcTile> {

    const fileList = fileObject.files;
    return fileList.map(fullFn => {

      const [dir, fn] = fullFn.split('/');

      let elements: Array<string>;
      if (dir === 'sinusoidal') {
        elements = fn.split('.');
      } else {
        elements = fn.split('_');
        elements[2] = elements[2].split('.')[0];
      }

      return {
        filename: fullFn,
        dataSet: dir,
        year: +elements[1],
        tile: elements[2]
      };
    });

  }

  constructor(private http: Http, ps: ProjectionService) {
    const proj4 = ps.proj4();
    const def = '+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs';

    this.projection = proj4(def);

    this.files = http.get('assets/config/fmc_filelist.json')
      .map(r => r.json())
      .map(this.parseFileList)
      .publishReplay(1)
      .refCount();

    this.das$ = this.files
      .flatMap(files => this.getAllMetadata('das', dap.parseDAS))
      .publishReplay(1)
      .refCount();

    this.ddx$ = this.files
      .flatMap(files => this.getAllMetadata('ddx', dap.parseDDX))
      .publishReplay(1)
      .refCount();

    // Subscribing to these observables now forces them to resolve. Otherwise
    // they are lazy, and won't resolve until they are subscribed to later on.
    this.files.subscribe(() => console.log('FMC Filelist retrieved'));
    this.das$.subscribe(() => console.log('das metadata retrieved'));
    this.ddx$.subscribe(() => console.log('ddx metadata retrieved'));

    this.geoTransforms$ = this.das$.map(allDAS => {
      const uniqueTiles = Array.from(new Set(allDAS.map(([t, das]) => t.tile)));

      const dasForUniqueTiles = uniqueTiles.map(tileID => {
        return allDAS.find(([t, das]) => t.tile === tileID);
      });

      return dasForUniqueTiles.map((x) => {
        const [tile, das] = x;
        const tmp = das.variables.sinusoidal;
        const geo = tmp.GeoTransform.trim().split(' ').map(s => +s);
        return [tile.tile, new GeoTransform(geo)];
      });
    }).publishReplay().refCount();

  }

  findTile(ll: LatLng): Observable<TileCell> {
    const projected = this.projection.forward([ll.lng, ll.lat]);

    return Observable.forkJoin(this.das$, this.geoTransforms$, this.ddx$)
    .map(([allDAS, allGeo, allDDX]) => {
      return Observable.from(allGeo.map(([tileID, geotransform], i) => {
        let [row, col] = geotransform.toRowColumn(projected[0], projected[1]);
        col -= 0.5; // FIXME: Insert comment - why are we making this adjustment?
        const ddx = this._match({tile: tileID}, allDDX);

        if ((row < 0) || (Math.floor(row) >= +ddx.variables.x.dimensions[0].size) ||
          (col < 0) || (Math.floor(col) >= +ddx.variables.y.dimensions[0].size)) {
          return null;
        }

        //          console.log('MATCH: '+tileID,row,col);
        return {
          tile: tileID,
          cell: [Math.floor(row), Math.floor(col)]
        };
      }));
    }).switch().first(tc => tc !== null);
  }
/*
  findTile(ll: LatLng): Observable<TileCell> {
    const projected = this.projection.forward([ll.lng, ll.lat]);

    return Observable.forkJoin(this.das$, this.geoTransforms$, this.ddx$)
      .map(([allDAS, allGeo, allDDX]) => {
        return Observable.from(allGeo.map(([tileID, geotransform], i) => {
          let [row, col] = geotransform.toRowColumn(projected[0], projected[1]);
          col -= 0.5; // FIXME: Insert comment - why are we making this adjustment?
          const ddx = this._match({tile: tileID}, allDDX);

          // Check if bounds are within this tile
          if ((row < 0) || (Math.floor(row) >= +ddx.variables.x.dimensions[0].size) ||
            (col < 0) || (Math.floor(col) >= +ddx.variables.y.dimensions[0].size)) {
            return null;
          }

          return {
            tile: tileID,
            cell: [Math.floor(row), Math.floor(col)]
          };
        }));
      }).switch().first(tc => tc! == null);
  }*/

  _match(search: any, pairs: Array<[FmcTile, any]>): any {
    const result = pairs.find(([t, o]) => {
      for (const k in search) {
        if (search[k] !== t[k]) {
          return false;
        }
      }
      return true;
    });

    if (result) {
      return result[1];
    }
    return undefined;
  }

  getTimeSeries(point: LatLng, year: number): Observable<any> {

    return Observable.forkJoin(this.findTile(point), this.files, this.das$, this.ddx$)
      .map(([tileMatch, files, allDAS, allDDX]) => {
        const tile = tileMatch.tile;
        const cell = tileMatch.cell;
        const matchCriteria = {year: year, tile: tile};
        const das = this._match(matchCriteria, allDAS);
        const ddx = this._match(matchCriteria, allDDX);
        const tileFile = files.find(f => (f.tile === tile) && (f.year === year));

        if (!tileFile) {
          return Observable.throw(new Error(`No time series data at ${tile} in ${year}`));
        }
        const nTimeSteps = +(ddx.variables.time.dimensions[0].size);
        const filename = tileFile.filename;
        const [r, c] = cell;
        const variable = 'lvmc_mean';
        const  url = `${DAP_SERVER}${filename}.ascii?${variable}[0:1:${nTimeSteps - 1}][${r}:1:${r}][${c}:1:${c}]`;
        return this.http.get(url).map(res => res.text())
          .map(txt => dap.parseData(txt, das))
          .map(dap.simplify);
      }).switch();
  }
}
