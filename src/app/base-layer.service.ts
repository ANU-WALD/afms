import { Injectable } from '@angular/core';
import { BaseLayer } from 'map-wald-visual';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class BaseLayerService {

  layers: Promise<BaseLayer[]>;

  constructor(private http: HttpClient) {
    this.layers = http.get('assets/config/google_map_base_layers.json')
                      .toPromise()
                      .then((response:any) => response.base_layers as BaseLayer[]);
  }

  getLayers(): Promise<BaseLayer[]> {
    return this.layers;
  }

}
