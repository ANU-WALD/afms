import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http, Response } from '@angular/http';
import {MapViewParameterService} from 'map-wald';

@Component({
  selector: 'fmc-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.scss']
})
export class LayerControlComponent implements OnInit {
  layers:Array<FMCLayer>;

  selectedLayer:FMCLayer;

  @Output() layerChanged: EventEmitter<FMCLayer> = new EventEmitter<FMCLayer>();

  constructor(private _http:Http,
              private mapView:MapViewParameterService) {
    _http.get("assets/config/layers.json").toPromise().then(resp=>{
      var json = resp.json();
      var layers:Array<any> = json.layers;
      this.layers = layers.map(l=>new FMCLayer(l.name,l.units,l.icon,l.wms_layer,l.palette,l.range));

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

class FMCLayer{
  icon:string;
  name:string;
  variable:string;
  palette:any;
  range:Array<number>;
  units:string;

  constructor(name:string,units:string,icon:string,variable:string,palette:any,range:Array<number>){
    this.name=name;
    this.units=units;
    this.icon=icon;
    this.variable=variable;
    this.palette=palette;
    this.range=range;
  }
}
