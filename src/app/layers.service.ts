import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {publishReplay,map,refCount} from 'rxjs/operators';
import {FMCLayer,DateRange} from './layer';
import { HttpClient } from '@angular/common/http';
import { CatalogHost } from 'map-wald';
import { environment } from '../environments/environment';

const TDS_URL = environment.tds_server;

interface Config {
  mask:FMCLayer;
  layers:FMCLayer[];
  contextual:FMCLayer[];
  incidents:IncidentFeeds;
}

export interface IncidentFeed{
  hide:boolean;
  url:string;
  cors:boolean;
  format:'GeoJSON'|'GeoRSS'|'KML'|'Custom';
  displayProperty:string;
  icon:{
    property:string;
    default?:string;
    translation:{
      [key:string]:'NA'|'Advice'|'WatchAct'|'Warning'
    },
    exclude?:{
      property:string,
      pattern:string
    }[]
  };
}

interface IncidentFeeds {
  [key:string]:IncidentFeed;
}

export function thredds(url?: string): CatalogHost {
  return {
    software: 'tds',
    url: url || TDS_URL
  };
}

@Injectable()
export class LayersService {
  mask:Observable<FMCLayer>;
  availableLayers:Observable<FMCLayer[]>;
  contextual:Observable<FMCLayer[]>;

  incidentFeeds:Observable<IncidentFeeds>;

  constructor(private _http:HttpClient) {
    const layerConfig$:Observable<Config> = <Observable<Config>>_http.get('assets/config/layers.json?_='+(new Date()).getTime()).pipe(
      publishReplay(),refCount());

    const newLayer = function(l:any) : FMCLayer{
      return new FMCLayer(l.name,l.shortName,l.units,l.icon,l.wms_layer,l.palette,
                          l.range,l.description,DateRange.fromJSON(l.timeperiod),
                          l.legend,l.wms_params,l.source,l.path,l.pathTimeSeries,l.chart_config,
                          l.host,l.url_fragment,l.indexing,l.suffix||'',l.timeshift||0,
                          l.timestepMultiplier||1,l.precision,l.timestepReference,
                          l.op,l.window,l.labels,l.contextual||[],l.zonal);
    }

    this.mask = layerConfig$.pipe(map(data=>newLayer(data.mask)));
    this.availableLayers = layerConfig$.pipe(map(data=>data.layers.map(newLayer)));
    this.contextual = layerConfig$.pipe(map(data=>data.contextual.map(newLayer)));
    this.incidentFeeds = layerConfig$.pipe(map(data=>data.incidents));
  }
}
