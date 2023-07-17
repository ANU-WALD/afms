import { Component, Input, ViewChild, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { LayeredMapComponent } from '../../layered-map/layered-map.component';

export interface BaseLayer {
  map_type_id: string;
  label: string;
  icon?: string;
}

declare var Plotly: any;

@Component({
  selector: 'cycle-base-map',
  template: `<button class="btn btn-secondary btn-sm" (click)="toggleBaseLayer()" [ngbTooltip]="tooltip"
                     placement="right">
  <i class="fa" [ngClass]="baseLayer?.label==='Road Map'?'fa-road':'fa-globe'"></i>
</button>`,styles: []})
export class CycleBaseMapComponent implements AfterViewInit, OnChanges  {
  @Input() map:LayeredMapComponent;
  @Input() maxZoom:number = 32;
  @Input() baseLayers:BaseLayer[] = [
    {
      map_type_id : 'roadmap',
      label : 'Road Map'
    },
    {
      map_type_id : 'satellite',
      label : 'Satellite'
    }
  ]
  @Input() baseLayer:BaseLayer;
  @Input() tooltip = 'Toggle base layer';

  constructor(){

  }

  ngAfterViewInit(){

  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.baseLayers && !this.baseLayer){
      this.baseLayer = this.baseLayers[0];
    }
  }

  toggleBaseLayer(){
    if(!this.map){
      return;
    }

    let current = this.baseLayers.findIndex(l=>l.map_type_id===this.baseLayer.map_type_id);
    let next = (current+1)%this.baseLayers.length;
    this.baseLayer = this.baseLayers[next];

    this.map.mapTypeId = this.baseLayer ?
                                this.baseLayer.map_type_id:
                                null;
  }
}
