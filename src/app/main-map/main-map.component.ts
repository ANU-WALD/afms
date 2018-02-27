import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http, Response } from '@angular/http';
import { GoogleMapsAPIWrapper } from '@agm/core/services';
import { WMSService, WMSLayerComponent, MapViewParameterService, 
         InterpolationService, TimeseriesService, CatalogHost } from 'map-wald';
import { SelectionService } from '../selection.service';
import { VectorLayer } from '../vector-layer-selection/vector-layer-selection.component';
import { LatLng } from '../latlng';
import { LatLng as GoogleLatLng } from '@agm/core';
import { BaseLayer } from '../base-layer.service';
//import { TimeseriesService } from "../timeseries.service";
import { LayersService } from '../layers.service';
import { environment } from '../../environments/environment'
import { FMCLayer, DateRange } from "../layer";

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';

const BASE_URL=environment.gsky_server;
const TDS_URL=environment.tds_server;

class ValueMarker{
  loc:LatLng;
  value:string;
  open:boolean;
}

export class VisibleLayer{
  url:string = BASE_URL;
  path:string;
  legendImageURL:string = null;
  opacity:number=1.0;
  wmsParameters:any;

  applyFixed(){
    if(this.layer.wmsParams){
      Object.assign(this.wmsParameters,this.layer.wmsParams);
    }
  }

  leading0(n:number):string {
    if(n<10){
      return '0'+n;
    }
    return ''+n;
  }

  dateText(date:Date):string{
    var fmt = this.layer.timePeriod.format || "{{year}}-{{month}}-{{day}}T00%3A00%3A00.000Z";
    return InterpolationService.interpolate(fmt,{
      year:date.getFullYear(),
      month:this.leading0(date.getMonth()+1),
      day:this.leading0(date.getDate())
    });
  }

  setDate(newDate:Date){
    this.updateParameters(newDate);
  }

  constructor(public layer:FMCLayer,currentDate:Date){
    if(layer){
      this.updateParameters(currentDate);
    }
  };

  updateParameters(currentDate:Date){
    this.path = InterpolationService.interpolate(this.layer.path,{
      year:currentDate.getFullYear(),
      month:this.leading0(currentDate.getMonth()+1),
      day:this.leading0(currentDate.getDate())
    });
    
    if(this.layer.source==='tds'){
      this.url = `${this.layer.host||TDS_URL}/wms/${this.path}`;
    }

    this.wmsParameters = {
      layers: this.layer.variable,
      time: this.dateText(currentDate),
      styles: "",
      transparent: true,
      tiled: true,
      feature_count: 101
    };

    if(currentDate>this.layer.timePeriod.end){
      this.wmsParameters.time = this.dateText(this.layer.timePeriod.end);
    }

    this.applyFixed();

    if(this.layer.palette && this.layer.palette.image){
      var p = this.wmsParameters;
      this.legendImageURL = 
        `${this.url}?request=GetLegendGraphic&layer=${p.layers}&palette=${p.styles.split('/')[1]}&colorscalerange=${this.layer.range.join(',')}&numcolorbands=${p.numcolorbands}`;
    }
  }
}

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {
  layerHost:CatalogHost;
  showMask:boolean;
  maskLayer:VisibleLayer;
  mainLayer:VisibleLayer;

  baseLayer: BaseLayer;
  testMapType: string = null;
  chartIsCollapsed: boolean = true;
  chartRange: Array<number> = null;

  constructor(private _wmsService: WMSService,
    _activatedRoute: ActivatedRoute,
    private selection: SelectionService,
    private mapView:MapViewParameterService,
    private http: Http,
    private timeseries:TimeseriesService,
    private layers:LayersService) {

    this.mainLayer = new VisibleLayer(null,null);

    this.layers.mask.subscribe(mask=>{
      this.showMask=true;
      this.maskLayer = new VisibleLayer(mask,this.selection.effectiveDate());
      this.maskLayer.opacity = 0.7;
    });

    this.layers.availableLayers.subscribe(available=>{
      this.selection.loadFromURL(_activatedRoute);
      this.selection.dateChange.subscribe((newDate: Date) => {
        this.dateChanged(newDate);
      });
    });

    var view = mapView.current();

    var coords = decodeURIComponent(view.coords)
    if(coords&&(coords!=='_')){
      var coordArray = coords.split(',').map(s=>+s).filter(isNaN);
      if(coordArray.length===2){
        this.selectLocation(this.constrain({
          lat:coordArray[0],
          lng:coordArray[1]
        }));
      }
    }

    if(!((view.lat==='_')||(view.lng==='_')||(view.zm==='_'))){
      if(!isNaN(view.lat)||!isNaN(view.lng)){
        var ll = this.constrain(<LatLng>view);

        this.lat=ll.lat;
        this.lng=ll.lng;
        this.zoom=+view.zm;
      }
    }
  }

  thredds(url?:string):CatalogHost{
    return {
      software:'tds',
      url:url||TDS_URL
    };
  }

  constrain(ll:LatLng){
    return{
      lat:Math.min(-7,Math.max(-45,+ll.lat)),
      lng:Math.min(170,Math.max(110,+ll.lng))
    };
  }

  map: any;
  // google maps zoom level
  zoom: number = 4;

  // initial center position for the map
  lat: number = -22.673858;
  lng: number = 129.815982;

  geoJsonObject: Object = null;
  vectorLayer:VectorLayer;
  selectedCoordinates:LatLng;
  marker:ValueMarker=null;
  currentYearDataForLocation:any;

  dateRange = new DateRange();

  mapClick(clickEvent){
    this.selectLocation({
      lng:clickEvent.coords.lng,
      lat:clickEvent.coords.lat
    });
    this.chartIsCollapsed = false;
  }

  clicked(clickEvent) {
    this.selectLocation({
      lng:clickEvent.latLng.lng(),
      lat:clickEvent.latLng.lat()
    });
    this.chartIsCollapsed = false;
  }

  moveAndZoom(coords:LatLng){
    this.selectLocation(coords);
    this.moved(coords);
    this.moved(12);

    // Zoom
  }

  moved(event){
    if(event.lat){
      this.lat=event.lat;
      this.lng=event.lng;
//      this.mapView.update({lat:event.lat.toFixed(2),lng:event.lng.toFixed(2)});
    } else {
      this.zoom = event;
//      this.mapView.update({zm:event});
    }
    this.mapView.update({
      lat:this.lat.toFixed(2),
      lng:this.lng.toFixed(2),
      zm:this.zoom
    });
  }

  selectLocation(coords:LatLng){
    this.marker ={
      loc:coords,
      value:null,
      open:true
    };
    this.updateTimeSeries();

    this.selectedCoordinates=coords;
    this.mapView.update({coords:`${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`});
  }

  updateTimeSeries(){
    var coords = this.marker.loc;
    if(this.currentYearDataForLocation&&(this.currentYearDataForLocation.coords===coords)&&
       (this.currentYearDataForLocation.year===this.selection.year)){
      this.updateMarker();
      return;
    }

    var year = this.selection.year;
    var fn = this.mainLayer.path;
    if(!fn){
      return;
    }

    this.timeseries.getTimeseries(this.layerHost,fn,this.mainLayer.layer.variable,coords)//,year)
      .subscribe(dapData=>{
        if((year!==this.selection.year)||(coords!==this.marker.loc)){
          return; // Reject the data
        }
        this.currentYearDataForLocation=dapData;
        this.currentYearDataForLocation.year = year;
        this.currentYearDataForLocation.coords = coords;
        this.updateMarker();
      },
      error=>{
        console.log(error);
      });
  }

  updateMarker(){
    var now = this.selection.effectiveDate();
    var deltas = this.currentYearDataForLocation.dates.map(t=>Math.abs(t.getTime()-now.getTime()));
    var closest = deltas.indexOf(Math.min(...deltas));
    var val = this.currentYearDataForLocation.values[closest];
    if (val === null || isNaN(val)) {
      val='-';
    } else {
      val = val.toFixed(3);
    }
    this.marker.value=val;
  }

  staticStyles:any={
      clickable: true,
      fillOpacity: 0,
      fillColor: null,//'#80F090',
      strokeWeight: 1.0,
      strokeColor: '#444'
    };

  styleFunc(feature) {
    return {
      clickable: true,
      fillOpacity: 0,
      fillColor: null,//'#80F090',
      strokeWeight: 0.5,
      strokeColor: '#444'
    };
  }

  @ViewChild('mapDiv') mapDiv: Component;
  @ViewChild('wms') wmsLayer: WMSLayerComponent;

  dateChanged(newDate: Date) {
    this.mainLayer.setDate(newDate);
  }

  ngAfterViewInit() {
  }

  ngOnInit() {
  }

  layerChanged(layer:FMCLayer) {
    var opacity = this.mainLayer.opacity;
    this.mainLayer = new VisibleLayer(layer,this.selection.effectiveDate());
    this.mainLayer.opacity = opacity;

    this.dateRange = layer.timePeriod;
    this.selection.range = this.dateRange;
    this.layerHost = this.thredds(layer.host);
  }

  changeCount:number =0;
  vectorLayerChanged(layer:VectorLayer){
    this.changeCount++;
    var component = this;
    this.geoJsonObject=null;
    this.vectorLayer=layer;
    this.http.get(`assets/selection_layers/${layer.jsonFilename}`)
      .map((r) => r.json())
      .subscribe((data) => {
        component.geoJsonObject = data;
      });
  }

  baseLayerChanged(layer: BaseLayer){
    this.baseLayer = layer;
  }

  opacityChanged(opacity: number){
    this.mainLayer.opacity = opacity;
  }

  downloadBtnClicked() {

  }
}
