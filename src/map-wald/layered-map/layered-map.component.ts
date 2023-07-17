import { Component, Input, ViewChild, AfterViewInit, OnChanges, SimpleChanges,
         Output, EventEmitter, ViewChildren, QueryList, NgZone } from '@angular/core';
import { MappedLayer, Bounds } from '../data';
import { LayerSelection } from '../data';
import { StaticDataService } from '../static-data.service';
import { MetadataService } from '../metadata.service';
import { DataMouseEvent, LatLng, AgmMap, AgmInfoWindow} from '@agm/core';
import { Feature, Point, GeometryObject } from 'geojson';

 interface MapTypeControlOptions {
  /** IDs of map types to show in the control. */
  mapTypeIds?: string[];
  /**
   * Position id. Used to specify the position of the control on the map.
   * The default position is TOP_RIGHT.
   */
  position?: ControlPosition;
  /** Style id. Used to select what style of map type control to display. */
  style?: any;
}

declare enum ControlPosition {
  RIGHT_BOTTOM = 0,
  TOP_LEFT = 1,
  TOP_CENTER = 2,
  TOP_RIGHT = 3,
  LEFT_CENTER = 4,
  LEFT_TOP = 5,
  LEFT_BOTTOM = 6,
  RIGHT_TOP = 7,
  RIGHT_CENTER = 8,
  BOTTOM_RIGHT = 9,
  BOTTOM_LEFT = 10,
  BOTTOM_CENTER = 11
}

export interface SimpleMarker {
  loc:LatLng;
  value:string;
  open:boolean;
  iconUrl:string;
  html?:string;
}

@Component({
  selector: 'layered-map',
  template: `<agm-map #theMap
[(latitude)]="lat"
[(longitude)]="lng"
[(zoom)]="zoom"
(zoomChange)="zoomChanged()"
[disableDefaultUI]="false"
[zoomControl]="false"
[mapTypeId]="mapTypeId"
[mapTypeControl]="showMapType"
[mapTypeControlOptions]="mapTypeOptions"
[streetViewControl]="streetViewControl"
scaleControl="true"
[fitBounds]="_bounds"
(mapClick)="mapClick($event)">

<agm-marker *ngFor="let marker of markers"
            [longitude]="marker.loc.lng"
            [latitude]="marker.loc.lat"
            [iconUrl]="marker.iconUrl">
  <agm-info-window #infoWindows [disableAutoPan]="true">
    <strong>{{marker.value}}</strong>
    <span *ngIf="marker.html" [innerHTML]="marker.html"></span>
  </agm-info-window>
</agm-marker>

<ng-container *ngFor="let mp of layers.slice()|reverse; let i = index" [ngSwitch]="mp.layerType">
  <wms-layer *ngSwitchCase="'wms'"
    [url]="mp.url"
    [params]="mp.wmsParameters"
    [opacity]="mp.opacity"
    [position]="mp.options.position">
  </wms-layer>
  <agm-data-layer *ngSwitchCase="'vector'"
                [geoJson]="mp.staticData"
                [style]="mp._styleFunc"
                (layerClick)="clicked($event)"
                >
  </agm-data-layer>

  <ng-container *ngSwitchCase="'circle'">
    <agm-circle *ngFor="let f of mp.staticData.features; let j=index"
                [latitude]="f.geometry.coordinates[1]"
                [longitude]="f.geometry.coordinates[0]"
                [radius]="10000000/(zoom*zoom*zoom*zoom)"
                [fillColor]="mp.flattenedSettings?.styles?.fillColor||'black'"
                [fillOpacity]="mp.flattenedSettings?.styles?.fillOpacity||1"
                [strokeColor]="mp.flattenedSettings?.styles?.strokeColor||'black'"
                [strokeOpacity]="mp.flattenedSettings?.styles?.strokeOpacity||1"
                [strokePosition]="0"
                [strokeWeight]="(f===selectedFeature)?3:(mp.flattenedSettings?.styles?.strokeWeight||0.5)"
                (circleClick)="circleClicked(mp,f)"
                >
    </agm-circle>
  </ng-container>

  <!--
  -->
</ng-container>

<!-- for map controls -->
<map-control position="TOP_CENTER">
    <ng-content select=".map-control.top-center"></ng-content>
</map-control>

<map-control position="TOP_LEFT">
    <ng-content select=".map-control.top-left"></ng-content>
</map-control>

<map-control position="TOP_RIGHT">
    <ng-content select=".map-control.top-right"></ng-content>
</map-control>

<map-control position="LEFT_TOP">
    <ng-content select=".map-control.left-top"></ng-content>
</map-control>

<map-control position="RIGHT_TOP">
    <ng-content select=".map-control.right-top"></ng-content>
</map-control>

<map-control position="LEFT_CENTER">
    <ng-content select=".map-control.left-center"></ng-content>
</map-control>

<map-control position="RIGHT_CENTER">
    <ng-content select=".map-control.right-center"></ng-content>
</map-control>

<map-control position="LEFT_BOTTOM">
    <ng-content select=".map-control.left-bottom"></ng-content>
</map-control>

<map-control position="RIGHT_BOTTOM">
    <ng-content select=".map-control.right-bottom"></ng-content>
</map-control>

<map-control position="BOTTOM_CENTER">
    <ng-content select=".map-control.bottom-center"></ng-content>
</map-control>

<map-control position="BOTTOM_LEFT">
    <ng-content select=".map-control.bottom-left"></ng-content>
</map-control>

<map-control position="BOTTOM_RIGHT">
    <ng-content select=".map-control.bottom-right"></ng-content>
</map-control>

</agm-map>

`,styles: []})
export class LayeredMapComponent implements AfterViewInit, OnChanges {
  @Input() layers: Array<MappedLayer> = [];
  @Input() markers:Array<SimpleMarker> = [];
  @Input() mapTypeId:string='roadmap';

  @Output() layersChange = new EventEmitter<Array<MappedLayer>>();
  @Output() featureSelected = new EventEmitter<{feature:Feature<GeometryObject>,layer?:MappedLayer}>();
  @Output() pointSelected = new EventEmitter<LatLng>();
  @Input() mapTypePosition:number = ControlPosition.BOTTOM_LEFT
  @Input() streetViewControl = true;

  @ViewChild(AgmMap,{static:false}) theMap:AgmMap;
  @ViewChildren('infoWindows') infoWindows:QueryList<AgmInfoWindow>;

  selectedFeature:any = null;
  // google maps zoom level
  @Input() zoom: number = 4;
  @Input() showMapType = true;
  mapTypeOptions: MapTypeControlOptions={
    position:ControlPosition.BOTTOM_LEFT
  };

  // initial center position for the map
  @Input() lat: number = -22.673858;
  @Input() lng: number = 129.815982;
  @Input() bounds:Bounds;
  _bounds:Bounds;

  constructor(private _zone:NgZone,
              private staticData:StaticDataService,
              private metadata:MetadataService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if zoom in changes...
    if(changes.mapTypePosition){
      if(this.mapTypePosition===null){
        this.showMapType = false;
      }
      this.mapTypeOptions = {
        position:this.mapTypePosition
      };
    }

    if(changes.layers){
      this.setLayerPositions();
    }

    if(changes.markers&&this.markers){
      // deal with existing info windows?
      if(this.infoWindows){
          this.infoWindows.forEach((w,i)=>{
          this._zone.runOutsideAngular(()=>w.close());
        });
      }

      setTimeout(()=>{
        // Check and open relevant info windows...
        this.infoWindows.forEach((w,i)=>{
          let m = this.markers[i];
          if(m.open){
            this._zone.runOutsideAngular(()=>w.open());
          } else {
            this._zone.runOutsideAngular(()=>w.close());
          }
        });
      });
    }

    if(changes.bounds){
      setTimeout(()=>this._bounds=this.bounds);
    }
  }

  ngAfterViewInit() {
  }

  layersChanged(changes: Array<MappedLayer>) {
  }

  layerAdded(selection: LayerSelection) {
    var ex = this.layers.find(l => l.layer === selection.layer);
    if (ex) {
      return;
    }

    var mapped = new MappedLayer();
    mapped.layer = selection.layer;

    mapped.layerType = 'wms';
    mapped.options.legend = true;

    if(selection.layer.options.vectors){
      this.staticData.get(selection.layer.options.host,selection.layer.options.filepath).subscribe(
        (data:any)=>{
          mapped.staticData=data;
          this.activateLayer(mapped,selection);
        });
    } else {
      this.activateLayer(mapped, selection);
    }
  }

  private activateLayer(mapped: MappedLayer, selection: LayerSelection) {
    mapped.update();
    if (selection.action === 'replace') {
      if(selection.filter){
        this.layers = this.layers.filter(ml=>!selection.filter(ml));
      } else {
        this.layers = [];
      }
    }
    this.layers = [mapped].concat(this.layers);
    this.setLayerPositions();
    this.layersChange.emit(this.layers);
  }

  setLayerPositions(){
    let ix=0;
    for(var i=this.layers.length-1;i>=0;i--){
      if(this.layers[i].layerType==='wms'){
        this.layers[i].options.position=ix;
        ix++;
      }
    }
  }
  extractFeature(f:any) : Feature<Point>{
    var geo = f.getGeometry();
    geo = {
      type:'Point',
      coordinates:geo.get(0)
    }

    var props:{[key:string]:any} = {};
    f.forEachProperty((val:any,prop:string)=>props[prop]=val);

    return {
      type:'Feature',
      geometry:geo,
      properties:props
    };
  }

  clicked(event:DataMouseEvent){
    var feature = this.extractFeature(event.feature);
    this.selectedFeature = feature;
    this.featureSelected.emit({feature:feature});
  }

  circleClicked(ml:MappedLayer,feature:any){
    this.selectedFeature = feature;
    this.featureSelected.emit({feature:feature,layer:ml});
  }

  mapClick(event:any){
    var coords:LatLng = event.coords;
    this.pointSelected.emit(coords);
  }

  zoomToBounds(bounds:Bounds){
    this._bounds = bounds;
  }

  zoomChanged(){
    this.layers = this.layers.slice();
  }
}
