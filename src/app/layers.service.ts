import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import {Observable} from 'rxjs';
import {FMCLayer,DateRange} from './layer';

@Injectable()
export class LayersService {
  mask:Observable<FMCLayer>;

  availableLayers:Observable<FMCLayer[]>;

  constructor(private _http:Http) {
    var layerConfig$ = _http.get("assets/config/layers.json")
      .map(resp=>resp.json()).publishReplay().refCount();

    var newLayer = function(l:any) : FMCLayer{
      return new FMCLayer(l.name,l.units,l.icon,l.wms_layer,l.palette,
                          l.range,l.description,DateRange.fromJSON(l.timeperiod),
                          l.legend,l.wms_params,l.source,l.path,l.chart_config,
                          l.host);
    }

    this.mask = layerConfig$.map(data=>newLayer(data.mask));
    this.availableLayers = layerConfig$.map(data=>data.layers.map(newLayer));
  }
}
