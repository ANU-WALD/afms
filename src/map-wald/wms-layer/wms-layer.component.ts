import { Component, OnInit, AfterViewInit, Input,
         OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import {GoogleMapsAPIWrapper} from '@agm/core';
import {WMSService} from '../wms.service';

@Component({
  selector: 'wms-layer',
  template:'',
})
export class WMSLayerComponent implements OnInit, OnDestroy{
  @Input() url: string;
  @Input() params:any;
  @Input() opacity:number=1.0;
  @Input() position:number=0;

  constructor(private _wmsService:WMSService,
              public _wrapper:GoogleMapsAPIWrapper) {}
  map: any;
  overlay:any;
  zoom: number = 4;

  private building:boolean=false;
  buildMap(){
    if(this.building)
      return;
    this.building=true;

    this._wrapper.getNativeMap().then((theMap)=>{
      this.building=false;
      this.map = theMap;
      this.overlay = this._wmsService.buildImageMap(
          ()=>this.map,
          (z)=>this.url+'?',
          (z)=>this.params,
          ()=>this.opacity
        );

      if(this.map.overlayMapTypes.length>this.position){
        this.map.overlayMapTypes.removeAt(this.position);
        this.map.overlayMapTypes.insertAt(this.position,this.overlay);
      } else {
        while(this.map.overlayMapTypes.length<=this.position){
          // Temporarily add replicate layers.
          // These should be replaced by other wms-layer components
          this.map.overlayMapTypes.push(this.overlay);
        }
      }
    }).catch((e)=>console.log(e));
  }

  ngOnInit() {
    if(this.url){
      this.buildMap();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.url){
      this.buildMap();
    }
    // let currentOpacity: number = changes.opacity.currentValue;
    // let previousOpacity: number = changes.opacity.previousValue;

    // if (currentOpacity !== previousOpacity) {
    //   console.log('building a map off my own bat');
    //   this.buildMap();
    // }
  }

  ngOnDestroy(): void {
    this._wrapper.getNativeMap().then((theMap)=>{
      if(this.map.overlayMapTypes.length>this.position){
        this.map.overlayMapTypes.removeAt(this.position);
      }
    });
  }
}
