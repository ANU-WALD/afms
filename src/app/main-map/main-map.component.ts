import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';
import {CatalogHost, MapViewParameterService, TimeseriesService, WMSLayerComponent, WMSService} from 'map-wald';
import {SelectionService} from '../selection.service';
import {VectorLayer} from '../vector-layer-selection/vector-layer-selection.component';
import {LatLng} from '../latlng';
import {BaseLayer} from '../base-layer.service';
import {LayersService} from '../layers.service';
import {environment} from '../../environments/environment';
import {DateRange, FMCLayer} from '../layer';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/forkJoin';
import {VisibleLayer} from './visible-layer';

const TDS_URL = environment.tds_server;

class ValueMarker {
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
  layerHost: CatalogHost;
  showMask: boolean;
  maskLayer: VisibleLayer;
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
              private layers: LayersService) {


    this.mainLayer = new VisibleLayer(null, null);

    this.layers.availableLayers.subscribe(() => {
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
    this.moved(12);

    // Zoom
  }

  moved(event) {
    if (event.lat) {
      this.lat = event.lat;
      this.lng = event.lng;
    } else {
      this.zoom = event;
    }
    this.mapView.update({
      lat: this.lat.toFixed(2),
      lng: this.lng.toFixed(2),
      zm: this.zoom
    });
  }

  selectLocation(coords: LatLng) {
    this.marker = {
      loc: coords,
      value: null,
      open: true
    };
    this.updateTimeSeries();

    this.selectedCoordinates = coords;
    this.mapView.update({coords: `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`});
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

    this.timeseries.getTimeseries(this.layerHost, fn, this.mainLayer.layer.variable, coords)// ,year)
      .subscribe(dapData => {
          if ((year !== this.selection.year) || (coords !== this.marker.loc)) {
            return; // Reject the data
          }
          this.currentYearDataForLocation = dapData;
          this.currentYearDataForLocation.year = year;
          this.currentYearDataForLocation.coords = coords;
          this.updateMarker();
        },
        error => {
          console.log(error);
        });
  }

  updateMarker() {
    const now = this.selection.effectiveDate();
    const deltas = this.currentYearDataForLocation.dates.map(t => Math.abs(t.getTime() - now.getTime()));
    const closest = deltas.indexOf(Math.min(...deltas));
    let currentValue = this.currentYearDataForLocation.values[closest];
    if (currentValue === null || isNaN(currentValue)) {
      currentValue = '-';
    } else {
      currentValue = currentValue.toFixed(3);
    }
    this.marker.value = currentValue;
  }


  setDate(newDate: Date) {
    this.mainLayer.setDate(newDate);
  }

  ngOnInit() {
  }

  layerChanged(layer: FMCLayer) {
    const opacity = this.mainLayer.opacity;
    this.mainLayer = new VisibleLayer(layer, this.selection.effectiveDate());
    this.mainLayer.opacity = opacity;

    this.dateRange = layer.timePeriod;
    this.selection.range = this.dateRange;
    this.layerHost = MainMapComponent.thredds(layer.host);
  }


  vectorLayerChanged(layer: VectorLayer) {
    this.geoJsonObject = null;
    this.vectorLayer = layer;
    this.http.get(`assets/selection_layers/${layer.jsonFilename}`)
      .map((r) => r.json())
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
