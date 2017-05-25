import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Http, Response } from '@angular/http';
import {MapViewParameterService} from 'map-wald';

export class VectorLayer {
  jsonFilename: string;
  name: string;
  nameField: string;

  constructor(fn: string, n: string, nf: string) {
    this.jsonFilename = fn;
    this.name = n;
    this.nameField = nf;
  }

  baseFilename():string{
    return this.jsonFilename.split('.')[0];
  }
}

@Component({
  selector: 'fmc-vector-layer-selection',
  templateUrl: './vector-layer-selection.component.html',
  styleUrls: ['./vector-layer-selection.component.scss']
})
export class VectorLayerSelectionComponent implements OnInit {
  vectorLayers: Array<VectorLayer>;

  selectedLayer:VectorLayer;

  @Output() selectedLayerChanged: EventEmitter<VectorLayer> = new EventEmitter<VectorLayer>();

  constructor(private _http:Http,
              private mapView:MapViewParameterService) {
    _http.get("assets/config/vectors.json").toPromise().then(resp=>{
      var json = resp.json();
      var layers:Array<any> = json.vector_layers;
      this.vectorLayers = layers.map(l=>new VectorLayer(l.filename,l.title,l.name_field));

      var params = this.mapView.current();
      if(params.layer&&params.layer!=='_'){
        this.selectedLayer=this.vectorLayers.find(l=>decodeURIComponent(l.baseFilename())===decodeURIComponent(params.vector));
      }

      if(!this.selectedLayer){
        this.selectedLayer=this.vectorLayers[0];
      }
      this.layerChange();
    });
  }

  ngOnInit() {
  }

  layerChange(){
    this.selectedLayerChanged.emit(this.selectedLayer);
    if(!this.selectedLayer){
      return;
    }

    this.mapView.update({vector:this.selectedLayer.baseFilename()});
  }
}
