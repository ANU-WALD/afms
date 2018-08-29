import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {publishReplay,map,refCount} from 'rxjs/operators';
import {FMCLayer,DateRange} from './layer';
import { HttpClient } from '@angular/common/http';

interface Config {
  mask:FMCLayer,
  layers:FMCLayer[]
}

@Injectable()
export class LayersService {
  mask:Observable<FMCLayer>;

  availableLayers:Observable<FMCLayer[]>;

  constructor(private _http:HttpClient) {
    var layerConfig$:Observable<Config> = <Observable<Config>>_http.get("assets/config/layers.json").pipe(
      publishReplay(),refCount());

    var newLayer = function(l:any) : FMCLayer{
      return new FMCLayer(l.name,l.units,l.icon,l.wms_layer,l.palette,
                          l.range,l.description,DateRange.fromJSON(l.timeperiod),
                          l.legend,l.wms_params,l.source,l.path,l.chart_config,
                          l.host,l.url_fragment,l.indexing,l.suffix||'');
    }

    this.mask = layerConfig$.pipe(map(data=>newLayer(data.mask)));
    this.availableLayers = layerConfig$.pipe(map(data=>data.layers.map(newLayer)));
  }
}
