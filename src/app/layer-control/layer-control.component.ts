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
      this.layers = available.filter(l=>!l.hide);

      var params = this.mapView.current();
      if(params.layer&&params.layer!=='_'){
        this.selectedLayer=this.layers.find(l=>decodeURIComponent(l.urlFragment||l.variable_name)===decodeURIComponent(params.layer));
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
    this.mapView.update({layer:this.selectedLayer.urlFragment||this.selectedLayer.variable_name});
  }
}

