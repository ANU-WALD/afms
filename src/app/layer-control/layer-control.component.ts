import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'fmc-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.scss']
})
export class LayerControlComponent implements OnInit {
  layers:Array<FMCLayer>=[
    new FMCLayer('Fuel Moisture Content','%','fa-tint','Fenner%3AFMC',{
      name:'RdYlBu',
      count:11,
      reverse:false
    },[0,255]),
    new FMCLayer('Flammability','units','fa-fire','unknown',{
      name:'RdYlBu',
      count:11,
      reverse:false
    },[]),
    new FMCLayer('Uncertainty','%','fa-percent','Fenner%3AFMC%3AUncertainty',{
      name:'RdYlBu',
      count:11,
      reverse:true
    },[0,90])
  ];

  selectedLayer:FMCLayer;

  @Output() layerChanged: EventEmitter<FMCLayer> = new EventEmitter<FMCLayer>();

  constructor() {
  }

  ngOnInit() {
    this.selectedLayer=this.layers[0];
    this.layerChanged.emit(this.selectedLayer);
  }

  layerChange(event){
    this.layerChanged.emit(this.selectedLayer);
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
