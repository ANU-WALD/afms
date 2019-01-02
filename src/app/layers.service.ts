import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {publishReplay,map,refCount} from 'rxjs/operators';
import {FMCLayer,DateRange} from './layer';
import { HttpClient } from '@angular/common/http';

interface Config {
  mask:FMCLayer;
  layers:FMCLayer[];
  incidents:IncidentFeeds;
}

export interface IncidentFeed{
  url:string;
  format:'GeoJSON'|'GeoRSS'|'KML'|'Custom';
  displayProperty:string;
  icon:{
    property:string;
    translation:{
      [key:string]:'NA'|'Advice'|'WatchAct'|'Warning'
    }
  };
}

interface IncidentFeeds {
  [key:string]:IncidentFeed;
}

@Injectable()
export class LayersService {
  mask:Observable<FMCLayer>;

  availableLayers:Observable<FMCLayer[]>;

  incidentFeeds:Observable<IncidentFeeds>;

  constructor(private _http:HttpClient) {
    var layerConfig$:Observable<Config> = <Observable<Config>>_http.get("assets/config/layers.json").pipe(
      publishReplay(),refCount());

    var newLayer = function(l:any) : FMCLayer{
      return new FMCLayer(l.name,l.units,l.icon,l.wms_layer,l.palette,
                          l.range,l.description,DateRange.fromJSON(l.timeperiod),
                          l.legend,l.wms_params,l.source,l.path,l.chart_config,
                          l.host,l.url_fragment,l.indexing,l.suffix||'',l.timeshift||0,
                          l.timestepMultiplier||1,l.precision,l.timestepReference);
    }

    this.mask = layerConfig$.pipe(map(data=>newLayer(data.mask)));
    this.availableLayers = layerConfig$.pipe(map(data=>data.layers.map(newLayer)));
    this.incidentFeeds = layerConfig$.pipe(map(data=>data.incidents));
  }
}
