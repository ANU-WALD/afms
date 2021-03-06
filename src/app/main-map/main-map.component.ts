import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  MapViewParameterService, TimeseriesService,
  WMSService, OpendapService, MetadataService,
  UTCDate, Bounds, PaletteService, ColourPalette
} from 'map-wald';
import { BaseLayer, WMSLayerComponent } from 'map-wald-visual';
import { SelectionService } from '../selection.service';
import { VectorLayer } from '../vector-layer-selection/vector-layer-selection.component';
import { LatLng } from '../latlng';
import { BaseLayerService } from '../base-layer.service';
import { LayersService, thredds } from '../layers.service';
import { DateRange, FMCLayer } from '../layer';

import { VisibleLayer } from './visible-layer';
import { IncidentsService } from 'app/incidents.service';
import { ContextualDataService } from 'app/contextual-data.service';
import { ZonalService, DEFAULT_ZONAL_STATS_COVERAGE_THRESHOLD } from 'app/zonal.service';
import { forkJoin, Subscription, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AgmMap, AgmInfoWindow } from '@agm/core';
import { DatesService } from 'app/dates.service';
import { tap, catchError } from 'rxjs/operators';
import { ZONAL_RELATIVE, ZONAL_AVERAGE } from 'app/zonal.service';

class ValueMarker {
  label: string;
  loc: LatLng;
  value: string;
  open: boolean;
  context: string[];
}

const DECILE_LABELS = [
  'Very much above',
  '',
  'Above average',
  '',
  'Average',
  '',
  'Below average',
  '',
  'Very much below'
];

const DECILE_RANGE = [
  0.5,
  9.5
];

const DECILE_COUNT = [
  9
];

const DECILE_FOOTER = `condition in comparison to the observations for a given month in the
 previous years (2001-year before current)`;

 const NO_DATA_LEVEL = 150;
 const NO_DATA_FILL = `rgb(${NO_DATA_LEVEL},${NO_DATA_LEVEL},${NO_DATA_LEVEL})`;

 @Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {
  @ViewChild('theMap', {static: false}) theMap: AgmMap;
  @ViewChild('mapDiv', { static: false }) mapDiv: Component;
  @ViewChild('wms', { static: false }) wmsLayer: WMSLayerComponent;
  @ViewChild('markerInfoWindow', { static: false}) markerInfoWindow: AgmInfoWindow;
  mainLayer: VisibleLayer;

  MODE_GRID=0;
  MODE_AREAL_AVERAGE=1;
  MODE_AREAL_RELATIVE=2;

  currentConditions = true;
  showWindows = true;
  showIncidents = true;

  baseLayer: BaseLayer;
  chartIsCollapsed = true;

  map: any;
  // google maps zoom level
  minZoom = 3;
  maxZoom = 16;
  zoom = 4;

  zonal=0;
  zonalFilter=-1;
  zonalThreshold=undefined;
  zonalAvailable=false;
  zonalValues:any;
  zonalPalette:ColourPalette;

  // initial center position for the map
  lat: number = -22.673858;
  lng = 129.815982;
  fullExtent: Bounds = {
    east: 160,
    north: -10,
    south: -45,
    west: 110
  };
  bounds: Bounds|boolean = false;

  incidentsData: any = null;
  incidentLng: number;
  incidentLat: number;
  showIncidentDetails = false;
  incidentContent: string = null;

  geoJsonObject: Object = null;
  vectorLayer: VectorLayer;
  selectedCoordinates: LatLng;
  marker: ValueMarker = null;
  currentYearDataForLocation: any;
  loading = false;

  dateRange = new DateRange();

  staticStyles: any = {
    clickable: true,
    fillOpacity: 0,
    fillColor: null, // '#80F090',
    strokeWeight: 1.0,
    strokeColor: '#444'
  };

  dynamicStyles: any = {
    clickable: true,
    fillOpacity: 1,
    strokeWeight: 1.0,
    strokeColor: '#444'
  };

  vectorStyles = this.staticStyles;

  tsSubscription:Subscription;
  landcoverSubscription:Subscription;
  contextualSubscription:Subscription;

  legendLabels: string[];
  legendRange: number[];
  legendFooter = '';

  static constrainCoords(ll: LatLng) {
    return {
      lat: Math.min(-7, Math.max(-45, +ll.lat)),
      lng: Math.min(170, Math.max(110, +ll.lng))
    };
  }

  constructor(private _wmsService: WMSService,
    _activatedRoute: ActivatedRoute,
    private selection: SelectionService,
    private mapView: MapViewParameterService,
    private http: HttpClient,
    private timeseries: TimeseriesService,
    private layers: LayersService,
    private metadata: MetadataService,
    private dap: OpendapService,
    private incidents: IncidentsService,
    private baseLayerService: BaseLayerService,
    private contextualData:ContextualDataService,
    private zonalService:ZonalService,
    private palettes:PaletteService,
    private datesService:DatesService) {

    this.zoomToFit();

    this.mainLayer = new VisibleLayer(null, null);

    this.layers.availableLayers.subscribe(overlayLayers => {
      this.layerChanged(overlayLayers[0]);
      this.selection.loadFromURL(_activatedRoute);
      this.selection.dateChange.subscribe((newDate: Date) => {
        this.setDate(newDate);
      });
    });

    const view = mapView.current();

    // const coords = decodeURIComponent(view.coords);
    // if (coords && (coords !== '_')) {
    //   const coordArray = coords.split(',').map(s => +s).filter(n=>!isNaN(n));
    //   if (coordArray.length === 2) {
    //     this.selectLocation(MainMapComponent.constrainCoords({
    //       lat: coordArray[0],
    //       lng: coordArray[1]
    //     }));
    //   }
    // }

    if (!((view.lat === '_') || (view.lng === '_') || (view.zm === '_'))) {
      if (!isNaN(view.lat) || !isNaN(view.lng)) {
        const ll = MainMapComponent.constrainCoords(<LatLng>view);

        this.lat = ll.lat;
        this.lng = ll.lng;
        this.zoom = +view.zm;
        this.constrainZoom();
        this.bounds = false;
      }
    }

    this.incidents.all().subscribe(data => {
      this.incidentsData = data;
    });

    this.baseLayerService.getLayers()
      .then(baseLayers => {
        const params = this.mapView.current();
        if (params.base_layer && params.base_layer !== '_') {
          this.baseLayer = baseLayers.find(l => decodeURIComponent(
            l.map_type_id) === decodeURIComponent(params.base_layer));
        }

        if (!this.baseLayer) {
          this.baseLayer = baseLayers[0];
        }
      });
  }

  zoomIn() {
    this.zoom += 1;
    this.constrainZoom();
  }

  zoomOut() {
    this.zoom -= 1;
    this.constrainZoom()
  }

  zoomToFit() {
    this.bounds = Object.assign({}, this.fullExtent);
  }

  constrainZoom() {
    this.zoom = Math.max(this.zoom, this.minZoom);
    this.zoom = Math.min(this.zoom, this.maxZoom);
  }

  toggleTransparency() {
    this.mainLayer.opacity -= 0.4;
    if (this.mainLayer.opacity < 0) {
      this.mainLayer.opacity = 1.0;
    }

    if(this.zonal){
      this.updateZonal();
    }
  }

  toggleBaseLayer() {
    this.baseLayerService.getLayers().then(layers => {
      this.baseLayer = layers.filter(l => l !== this.baseLayer)[0];
      this.mapView.update({ base_layer: this.baseLayer.map_type_id });
    });
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

  private moving: any = null;
  moved(event) {
    clearTimeout(this.moving);
    this.moving = setTimeout(() => {
      this.lat = event.lat;
      this.lng = event.lng;
      this.moving = null;
      this.mapView.update({
        lat: this.lat.toFixed(2),
        lng: this.lng.toFixed(2),
        zm: this.zoom
      });
    }, 500);
  }

  private zooming: any = null;
  zoomed(zm: number) {
    clearTimeout(this.zooming);
    this.zooming = setTimeout(() => {
      this.zoom = zm;
      this.constrainZoom();
      this.zooming = null;
      this.mapView.update({
        lat: this.lat.toFixed(2),
        lng: this.lng.toFixed(2),
        zm: this.zoom
      });
    }, 500);
  }

  selectLocation(coords: LatLng) {
    this.marker = {
      label: '-',
      loc: coords,
      value: null,
      open: true,
      context: []
    };
    this.updateContextualData();
    this.updateTimeSeries();

    this.selectedCoordinates = coords;
    this.mapView.update({ coords: `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}` });
    setTimeout(()=>{
      this.markerInfoWindow.open();
    });
  }

  updateContextualData(){
    this.marker.context = [];

    if(this.landcoverSubscription){
      this.landcoverSubscription.unsubscribe();
    }
    if(this.contextualSubscription){
      this.contextualSubscription.unsubscribe();
    }

    this.landcoverSubscription = this.contextualData.landcover(this.selection.year,this.marker.loc).subscribe(lc => {
      this.marker.context.unshift(`Land cover: ${lc}`);
      this.landcoverSubscription = null;
    });

    this.contextualSubscription = this.contextualData.contextualData(
      this.mainLayer.layer,
      this.selection.effectiveDate(),
      this.marker.loc).subscribe(data=>{

      this.marker.context = this.marker.context.concat(Object.keys(data).map(k=>`${k}: ${data[k]}`));
      this.contextualSubscription = null;
    });
  }

  reloadMarkerData() {
    this.currentYearDataForLocation = null;
    if (!this.marker) {
      return;
    }
    this.marker = Object.assign({}, this.marker);
    this.marker.label = null;
    this.marker.value = null;
    this.updateTimeSeries();
    this.updateContextualData();
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

    if(this.tsSubscription){
      this.tsSubscription.unsubscribe();
    }

    this.tsSubscription = this.timeseries.getTimeseries(this.mainLayer.host, fn,
      this.mainLayer.layer.variable_name,
      coords,
      this.mainLayer.layer.indexing)// ,year)
      .subscribe(dapData => {
        if ((year !== this.selection.year) || (coords !== this.marker.loc)) {
          return; // Reject the data
        }
        this.currentYearDataForLocation = dapData;
        this.currentYearDataForLocation.dates =
          this.currentYearDataForLocation.dates.map((d: Date) => this.mainLayer.layer.reverseDate(d));
        this.currentYearDataForLocation.year = year;
        this.currentYearDataForLocation.coords = coords;
        this.updateMarker();
        this.tsSubscription = null;
      },
      error => {
        console.log(error);
        this.tsSubscription = null;
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
    this.marker.label = this.mainLayer.layer.name;
    this.marker.value = currentValue;
  }


  setDate(newDate: Date) {
    this.mainLayer.setDate(newDate);
    this.reloadMarkerData();
    const timeDiff = (new Date()).getTime() - newDate.getTime();
    const timeDiffDays = timeDiff / (1000 * 60 * 60 * 24);
    this.currentConditions = timeDiffDays < 31;

    if(this.zonal){
      this.updateZonal();
    }
  }

  ngOnInit() {
  }

  layerChanged(layer: FMCLayer) {
    const opacity = this.mainLayer.opacity;
    this.mainLayer = new VisibleLayer(layer);
    this.mainLayer.opacity = opacity;
    this.mainLayer.host = thredds(layer.host);

    let date: UTCDate;
    let dateInit$:Observable<any>;
    if (this.selection.year === 0) {
      const endYear = layer.timePeriod.end.getUTCFullYear();

      // const TIMESTEP_GRACE = 0;
      // date = layer.mostRecentTimestep(layer.timePeriod.end);
      // for(let i=0;i<TIMESTEP_GRACE;i++){
      //   date = layer.previousTimeStep(date);
      // }
      dateInit$ = this.datesService.availableDates(this.mainLayer,endYear).pipe(
        catchError(err=>this.datesService.availableDates(this.mainLayer,endYear-1)),
        tap(dates=>{
          // Select last...
          date = dates[dates.length-1]
        })
      );
    } else {
      dateInit$ = of(null);
    }

    this.selection.currentLayer = this.mainLayer;
    dateInit$.subscribe(_=>{
      this.selection.constrain();

      this.dateRange = layer.timePeriod;
      if (date) {
        this.selection.date = {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate()
        };
      }
      this.mainLayer.setDate(this.selection.effectiveDate());

      this.reloadMarkerData();
      this.assessZonal();
      this.updateLegend();
    });
  }

  vectorLayerChanged(layer: VectorLayer) {
    this.geoJsonObject = null;
    this.vectorLayer = layer;
    this.http.get(`assets/selection_layers/${layer.jsonFilename}`
    ).subscribe((data) => {
        this.geoJsonObject = data;
        this.assessZonal();
    });
  }

  assessZonal() {
    const prev = this.zonalAvailable;
    this.zonalAvailable = (this.mainLayer&&this.mainLayer.layer.zonal) &&
                          (this.vectorLayer&&!!this.vectorLayer.zonal);
    this.zonal = this.zonalAvailable? this.zonal : this.MODE_GRID;
    if(this.zonal){
      this.updateZonal();
    } else {
      this.vectorStyles = this.staticStyles;
    }

    if(prev!==this.zonalAvailable){
      this.theMap.triggerResize(false);
    }
  }

  setBaseLayer(layer: BaseLayer) {
    this.baseLayer = layer;
  }

  setOpacity(opacity: number) {
    this.mainLayer.opacity = opacity;
  }

  incidentClicked(incident: any) {
    let tmp = incident.feature.getGeometry();
    let geo;
    if (tmp.getLength) {
//      geo = tmp.getAt(0).get();
      this.clicked(incident);
      return;
    } else {
      geo = tmp.get();
    }
    this.incidentLat = geo.lat();
    this.incidentLng = geo.lng();
    this.showIncidentDetails = false;
    this.incidentContent = incident.feature.getProperty('_display');
    setTimeout(() => {
      this.showIncidentDetails = true;
    });
  }

  incidentStyle(incident: any) {
    const colours = {
      NA: 'aaaaaa',
      Warning: 'FF0000',
      WatchAct: 'f4f442',
      Advice: 'ef3cf2'
    }
    const colour = colours[incident.getProperty('_style')] || colours.Advice;
    //const icon = `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${colour}`;
    const icon = 'assets/FireIconSmall.png';
    return {
      icon: icon
    };
  }

  zonalChanged(){
    this.vectorStyles = this.staticStyles;

    this.updateLegend();
    if(this.zonal){
      this.updateZonal();
    }

    this.theMap.triggerResize(false);
  }

  private updateLegend() {
    if(this.zonal === this.MODE_AREAL_RELATIVE){
      this.legendRange =  DECILE_RANGE
      this.legendLabels = DECILE_LABELS
    } else {
      this.legendRange = this.mainLayer.layer.range;
      this.legendLabels = this.mainLayer.layer.labels;
    }

    this.updateLegendText();
  }

  updateZonal(){
    this.loading = true;
    let values$ = this.zonalService.getForDate(this.mainLayer.layer,
      this.vectorLayer,
      this.selection.effectiveDate(),
      (this.zonal===this.MODE_AREAL_AVERAGE)?ZONAL_AVERAGE:ZONAL_RELATIVE,
      this.zonalThreshold,
      (this.zonalFilter>0)?this.zonalFilter:undefined);

    let colours$ = this.palettes.getPalette(this.mainLayer.layer.palette.name,
      this.mainLayer.layer.palette.reverse,
      this.mainLayer.layer.palette.count);

    forkJoin(values$,colours$).subscribe(resp=>{
      this.loading = false;
      let data = resp[0];
      let colours = resp[1];

      this.zonalValues = data;
      this.zonalPalette = colours;

      if(!Object.keys(data).length){
        this.zonal = this.MODE_GRID;
      }

      if(this.zonal){
        this.vectorStyles = (f)=>this.zonalStyles(f);
      } else {
        this.vectorStyles = this.staticStyles;
      }

      this.updateLegendText();

      if(this.showIncidents){
        this.showIncidents=false;
        setTimeout(()=>{
          this.showIncidents=true;
        });
      }
    });
  }

  private updateLegendText() {
    this.legendFooter = (this.zonal === this.MODE_AREAL_RELATIVE) ?
      `<strong> ${this.mainLayer.layer.shortName} ${DECILE_FOOTER}</strong><br>` :
      '';
  }

  zonalStyles(f:any){
    let id = f.getProperty(this.vectorLayer.idField);
    if(!isNaN(+id)){
      id = +id;
    }
    const zonalValue = this.zonalValues[id]

    const result = Object.assign({},this.dynamicStyles);
    result.fillOpacity = this.mainLayer.opacity;

    if(isNaN(zonalValue)){
      result.fillOpacity = this.mainLayer.opacity * 0.5;
      result.fillColor = NO_DATA_FILL;
    } else {
      let range = this.legendRange;

      let colourIndex = this.palettes.colourIndex(zonalValue,
        range[0],range[1],this.zonalPalette.length);
      if(this.mainLayer.layer.wmsParams.abovemaxcolor === 'extend') {
        colourIndex = Math.min(colourIndex,this.zonalPalette.length-1);
      }
      result.fillColor = this.zonalPalette[colourIndex];
    }
    return result;
  }
}

