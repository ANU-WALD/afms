import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { BaseLayerService } from '../base-layer.service'
import { MapViewParameterService } from '../../map-wald';
import { BaseLayer } from '../../map-wald';

@Component({
  selector: 'fmc-base-layer-selection',
  templateUrl: './base-layer-selection.component.html',
  styleUrls: ['./base-layer-selection.component.scss'],
  providers: [  ],
})
export class BaseLayerSelectionComponent implements OnInit {

  @Output() baseLayerChanged: EventEmitter<BaseLayer> = new EventEmitter<BaseLayer>();

  selectedLayer: BaseLayer;
  layers: BaseLayer[];

  constructor(private baseLayerService: BaseLayerService,
    private mapView: MapViewParameterService) { }

  ngOnInit() {
    this.baseLayerService.getLayers()
      .then(layers => {
        this.layers = layers;

        var params = this.mapView.current();
        if(params.base_layer && params.base_layer!=='_'){
          this.selectedLayer = this.layers.find(l => decodeURIComponent(
            l.map_type_id) === decodeURIComponent(params.base_layer));
        }

        if (!this.selectedLayer) {
          this.selectedLayer = layers[0];
        }
        if (this.selectedLayer) {
          this.baseLayerChanged.emit(this.selectedLayer);
        }
      }
    );
  }

  layerChange() {
    console.log("Map base layer changed to " + this.selectedLayer.map_type_id);
    this.mapView.update({base_layer: this.selectedLayer.map_type_id});
    this.baseLayerChanged.emit(this.selectedLayer);
  }

}
