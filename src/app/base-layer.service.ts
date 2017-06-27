import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

export interface BaseLayer {
  map_type_id: string;
  label: string;
}

@Injectable()
export class BaseLayerService {

  layers: Promise<BaseLayer[]>;

  constructor(private http: Http) { 
    this.layers = http.get("assets/config/google_map_base_layers.json")
                      .toPromise()
                      .then(response => response.json().base_layers as BaseLayer[]);
  }

  getLayers(): Promise<BaseLayer[]> {
    return this.layers;
  }

}
