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
      this.layers = layers.map(l=>new FMCLayer(l.name,l.units,l.icon,l.wms_layer,l.palette,
                                               l.range,l.description,DateRange.fromJSON(l.timeperiod),
                                               l.wms_params));

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

export class FMCLayer{

  constructor(public name:string,public  units:string,public icon:string,public variable:string,public palette:any,
              public range:Array<number>,public description:string,public timePeriod:DateRange,
              public wmsParams:any){
  }
}

export class DateRange{
  start:Date;
  end:Date;

  static dateFromConfig(json:any,end?:boolean):Date{
    if(!json){
      return new Date();
    }

    if('number' === typeof json){
      if(end){
        return new Date(json,11,31);
      }

      return new Date(json,0,1);
    }

    // ? expect a string and parse out dd/mm/yyyy?
    var [yyyy,mm,dd] = json.split('/').map(elem=>+elem);
    return new Date(yyyy,mm-1,dd);
  }

  static fromJSON(json:any):DateRange{
    var result = new DateRange();
    result.start = DateRange.dateFromConfig(json.start);
    result.end = DateRange.dateFromConfig(json.end,true);
    return result;
  }
}


//http://130.56.242.21/ows?&service=WMS&version=1.1.1&request=GetMap&BBOX=16123932.49458821676671504974,-4304933.43302112631499767303,16202204.01155224069952964783,-4226661.9160571051761507988&FORMAT=image/png&layers=Fenner%3AFMC%3ANonInterp&time=2010-09-14T00%3A00%3A00.000Z&styles=&transparent=true&tiled=true&feature_count=101&width=512&height=512&SRS=EPSG:3857

