import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';
import {CatalogHost, MapViewParameterService, TimeseriesService, WMSLayerComponent,
        WMSService, InterpolationService, OpendapService, MetadataService,
        UTCDate} from 'map-wald';
import {SelectionService} from '../selection.service';
import {VectorLayer} from '../vector-layer-selection/vector-layer-selection.component';
import {LatLng} from '../latlng';
import {BaseLayer} from '../base-layer.service';
import {LayersService} from '../layers.service';
import {environment} from '../../environments/environment';
import {DateRange, FMCLayer} from '../layer';
import {map, tap, switchAll} from 'rxjs/operators';
import { DapDAS, DapDDX } from 'dap-query-js/dist/dap-query';

import {VisibleLayer} from './visible-layer';
import { forkJoin, of } from 'rxjs';

const TDS_URL = environment.tds_server;

class ValueMarker {
  label: string;
  loc: LatLng;
  value: string;
  open: boolean;
}

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {
  @ViewChild('mapDiv') mapDiv: Component;
  @ViewChild('wms') wmsLayer: WMSLayerComponent;
  mainLayer: VisibleLayer;

  baseLayer: BaseLayer;
  chartIsCollapsed = true;

  map: any;
  // google maps zoom level
  zoom = 4;

  // initial center position for the map
  lat: number = -22.673858;
  lng = 129.815982;

  geoJsonObject: Object = null;
  vectorLayer: VectorLayer;
  selectedCoordinates: LatLng;
  marker: ValueMarker = null;
  currentYearDataForLocation: any;

  dateRange = new DateRange();

  staticStyles: any = {
    clickable: true,
    fillOpacity: 0,
    fillColor: null, // '#80F090',
    strokeWeight: 1.0,
    strokeColor: '#444'
  };

  static constrainCoords(ll: LatLng) {
    return {
      lat: Math.min(-7, Math.max(-45, +ll.lat)),
      lng: Math.min(170, Math.max(110, +ll.lng))
    };
  }

  static thredds(url?: string): CatalogHost {
    return {
      software: 'tds',
      url: url || TDS_URL
    };
  }

  constructor(private _wmsService: WMSService,
              _activatedRoute: ActivatedRoute,
              private selection: SelectionService,
              private mapView: MapViewParameterService,
              private http: Http,
              private timeseries: TimeseriesService,
              private layers: LayersService,
              private metadata:MetadataService,
              private dap:OpendapService) {


    this.mainLayer = new VisibleLayer(null, null);

    this.layers.availableLayers.subscribe(layers => {
      this.layerChanged(layers[0]);
      this.selection.loadFromURL(_activatedRoute);
      this.selection.dateChange.subscribe((newDate: Date) => {
        this.setDate(newDate);
      });
    });

    const view = mapView.current();

    const coords = decodeURIComponent(view.coords);
    if (coords && (coords !== '_')) {
      const coordArray = coords.split(',').map(s => +s).filter(isNaN);
      if (coordArray.length === 2) {
        this.selectLocation(MainMapComponent.constrainCoords({
          lat: coordArray[0],
          lng: coordArray[1]
        }));
      }
    }

    if (!((view.lat === '_') || (view.lng === '_') || (view.zm === '_'))) {
      if (!isNaN(view.lat) || !isNaN(view.lng)) {
        const ll = MainMapComponent.constrainCoords(<LatLng>view);

        this.lat = ll.lat;
        this.lng = ll.lng;
        this.zoom = +view.zm;
      }
    }
  }

  mapClick(clickEvent) {
    this.selectLocation({
      lng: clickEvent.coords.lng,
      lat: clickEvent.coords.lat
    });
    this.chartIsCollapsed = false;
  }

  clicked(clickEvent) {
    this.selectLocation({
      lng: clickEvent.latLng.lng(),
      lat: clickEvent.latLng.lat()
    });
    this.chartIsCollapsed = false;
  }

  moveAndZoom(coords: LatLng) {
    this.selectLocation(coords);
    this.moved(coords);
    this.zoomed(12);

    // Zoom
  }

  private moving:any = null;
  moved(event) {
    clearTimeout(this.moving);
    this.moving = setTimeout(()=>{
      this.lat = event.lat;
      this.lng = event.lng;
      this.moving=null;
      this.mapView.update({
        lat: this.lat.toFixed(2),
        lng: this.lng.toFixed(2),
        zm: this.zoom
      });
    },500);
  }

  private zooming:any = null;
  zoomed(zm:number){
    clearTimeout(this.zooming);
    this.zooming = setTimeout(()=>{
      this.zoom = zm;
      this.zooming=null;
      this.mapView.update({
        lat: this.lat.toFixed(2),
        lng: this.lng.toFixed(2),
        zm: this.zoom
      });
    },500);
  }

  selectLocation(coords: LatLng) {
    this.marker = {
      label: '-',
      loc: coords,
      value: null,
      open: true
    };
    this.updateLandcover();
    this.updateTimeSeries();

    this.selectedCoordinates = coords;
    this.mapView.update({coords: `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`});
  }

  updateLandcover(){
    const variables = [
      'forest',
      'grass',
      'shrub'
    ];
    this.layers.mask.pipe(
      map(m=>{
        const host = MainMapComponent.thredds(m.host);
        const year = Math.max(
          m.timePeriod.start.getUTCFullYear(),
          Math.min(this.selection.year,m.timePeriod.end.getUTCFullYear())
        );
        const file = InterpolationService.interpolate(m.path,{
          year:year
        })
        var url = this.dap.makeURL(host,file);
        return url;
      }),
      map(maskURL=>{
        const ddx$ = this.metadata.ddxForUrl(maskURL);
        const das$ = this.metadata.dasForUrl(maskURL);
        const grid$ = this.metadata.getGridForURL(maskURL);
        return forkJoin(ddx$,das$,grid$,of(maskURL))
      }),
      switchAll(),
      map(meta=>{
        return {
          ddx:<DapDDX>meta[0],
          das:<DapDAS>meta[1],
          grid:<number[][]>meta[2],
          url:<string>meta[3]
        };
      }),
      map(meta=>{
        const lats:number[] = (<number[][]>meta.grid)[0];
        const lngs:number[] = (<number[][]>meta.grid)[1];
        const pt = this.marker.loc;
        const latIndex = this.timeseries.indexInDimension(pt.lat,lats);
        const lngIndex = this.timeseries.indexInDimension(pt.lng,lngs);
        const query = `${this.timeseries.dapRangeQuery(latIndex)}${this.timeseries.dapRangeQuery(lngIndex)}`;
        return forkJoin(variables.map(v=>{
          return this.dap.getData(`${meta.url}.ascii?${v}${query}`,meta.das);
        }));
      }),
      switchAll()
    ).subscribe((data)=>{
      this.marker.label = 'Masked';
      for(let i = 0; i < variables.length; i++){
        if(data[i][variables[i]]){
          this.marker.label = variables[i][0].toUpperCase()+variables[i].slice(1);
        }
      }
    });
  }

  reloadMarkerData(){
    this.currentYearDataForLocation=null;
    if(!this.marker){
      return;
    }
    this.marker = Object.assign({},this.marker);
    this.marker.label=null;
    this.marker.value=null;
    this.updateTimeSeries();
    this.updateLandcover();
  }

  updateTimeSeries() {
    const coords = this.marker.loc;
    if (this.currentYearDataForLocation && (this.currentYearDataForLocation.coords === coords) &&
      (this.currentYearDataForLocation.year === this.selection.year)) {
      this.updateMarker();
      return;
    }

    const year = this.selection.year;
    const fn = this.mainLayer.path;
    if (!fn) {
      return;
    }

    this.timeseries.getTimeseries(this.mainLayer.host, fn, 
                                  this.mainLayer.layer.variable_name, 
                                  coords, 
                                  this.mainLayer.layer.indexing)// ,year)
      .subscribe(dapData => {
          if ((year !== this.selection.year) || (coords !== this.marker.loc)) {
            return; // Reject the data
          }
          this.currentYearDataForLocation = dapData;
          this.currentYearDataForLocation.dates = 
            this.currentYearDataForLocation.dates.map((d:Date)=>this.mainLayer.layer.reverseDate(d));
          this.currentYearDataForLocation.year = year;
          this.currentYearDataForLocation.coords = coords;
          this.updateMarker();
        },
        error => {
          console.log(error);
        });
  }

  updateMarker() {
    const now = <Date>this.selection.effectiveDate();
    const deltas = this.currentYearDataForLocation.dates.map(t => Math.abs(t.getTime() - now.getTime()));
    const closest = deltas.indexOf(Math.min(...deltas));
    let currentValue = this.currentYearDataForLocation.values[closest];
    if (currentValue === null || isNaN(currentValue)) {
      currentValue = '-';
    } else {
      currentValue = currentValue.toFixed(this.mainLayer.layer.precision);
    }
    this.marker.value = currentValue;
  }


  setDate(newDate: Date) {
    this.mainLayer.setDate(newDate);
    this.reloadMarkerData();
  }

  ngOnInit() {
  }

  layerChanged(layer: FMCLayer) {
    const opacity = this.mainLayer.opacity;
    let date:UTCDate;
    if(this.selection.year===0){
      date = layer.previousTimeStep(layer.previousTimeStep(layer.previousTimeStep(layer.timePeriod.end)));
      // TODO Find latest available!
    }
    this.mainLayer = new VisibleLayer(layer);
    this.mainLayer.opacity = opacity;
    this.mainLayer.host = MainMapComponent.thredds(layer.host);
    this.selection.currentLayer = this.mainLayer;
    this.dateRange = layer.timePeriod;
    if(date){
      this.selection.date = {
        year:date.getUTCFullYear(),
        month:date.getUTCMonth()+1,
        day:date.getUTCDate()
      };
    }
    this.mainLayer.setDate(this.selection.effectiveDate());

    this.reloadMarkerData();
  }


  vectorLayerChanged(layer: VectorLayer) {
    this.geoJsonObject = null;
    this.vectorLayer = layer;
    this.http.get(`assets/selection_layers/${layer.jsonFilename}`).pipe(
      map((r) => r.json()))
      .subscribe((data) => {
        this.geoJsonObject = data;
      });
  }

  setBaseLayer(layer: BaseLayer) {
    this.baseLayer = layer;
  }

  setOpacity(opacity: number) {
    this.mainLayer.opacity = opacity;
  }

}
