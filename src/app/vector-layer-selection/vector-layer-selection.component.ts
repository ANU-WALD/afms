import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {MapViewParameterService} from 'map-wald';
import { HttpClient } from '@angular/common/http';

export class VectorLayer {
  constructor(public jsonFilename: string, public name: string, public nameField: string,
              public idField:string, public zonal: boolean) {
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

  constructor(_http:HttpClient,
              private mapView:MapViewParameterService) {
    _http.get('assets/config/vectors.json?='+((new Date()).getTime())).toPromise().then(resp=>{
      const json:any = resp;
      const layers:Array<any> = json.vector_layers;
      this.vectorLayers = layers.map(l=>new VectorLayer(l.filename,l.title,l.name_field,l.id_field,l.zonal));

      const params = this.mapView.current();
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
