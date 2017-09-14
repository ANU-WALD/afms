import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {MapViewParameterService} from 'map-wald';
import {LayersService} from '../layers.service';
import {FMCLayer} from '../layer';

@Component({
  selector: 'fmc-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.scss']
})
export class LayerControlComponent implements OnInit {
  layers:Array<FMCLayer>;
  selectedLayer:FMCLayer;

  @Output() layerChanged: EventEmitter<FMCLayer> = new EventEmitter<FMCLayer>();

  constructor(private mapView:MapViewParameterService,
              private layerService:LayersService) {

    layerService.availableLayers.subscribe(available=>{
      this.layers = available;

      var params = this.mapView.current();
      if(params.layer&&params.layer!=='_'){
        this.selectedLayer=this.layers.find(l=>decodeURIComponent(l.variable)===decodeURIComponent(params.layer));
      }

      if(!this.selectedLayer){
        this.selectedLayer=this.layers[0];
      }
      this.layerChange(null);
    });
  }

  ngOnInit() {
  }

  layerChange(event){
    this.layerChanged.emit(this.selectedLayer);
    this.mapView.update({layer:this.selectedLayer.variable});
  }
}

//http://130.56.242.21/ows?&service=WMS&version=1.1.1&request=GetMap&BBOX=16123932.49458821676671504974,-4304933.43302112631499767303,16202204.01155224069952964783,-4226661.9160571051761507988&FORMAT=image/png&layers=Fenner%3AFMC%3ANonInterp&time=2010-09-14T00%3A00%3A00.000Z&styles=&transparent=true&tiled=true&feature_count=101&width=512&height=512&SRS=EPSG:3857

