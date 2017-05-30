import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http, Response } from '@angular/http';
import { GoogleMapsAPIWrapper } from '@agm/core/services';
import { WMSService, WMSLayerComponent } from 'map-wald';
import { SelectionService } from '../selection.service';
import { VectorLayer } from '../vector-layer-selection/vector-layer-selection.component';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';

//const BASE_URL='http://gsky-dev.nci.org.au/ows';
const BASE_URL='http://gsky-test.nci.org.au/ows';
//const BASE_URL = 'http://130.56.242.21/ows';
//'http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {

  layerVariable: string;
  chartHeight:number = 0;

  constructor(private _wmsService: WMSService,
    _activatedRoute: ActivatedRoute,
    //private _csv:CSVService,
    private selection: SelectionService,
    private http: Http) {
    this.selection.loadFromURL(_activatedRoute);
    this.selection.dateChange.subscribe((dateTxt: string) => {
      this.dateChanged(dateTxt);
    });
    this.wmsURL = BASE_URL;
    this.wmsParameters = {
      //        colorscalerange:"0.0001,100",
      layers: this.layerVariable,
      time: `${this.selection.dateText()}T00%3A00%3A00.000Z`,
      styles: "",
      transparent: true,
      tiled: true,
      feature_count: 101
    }

  }

  map: any;
  // google maps zoom level
  zoom: number = 4;

  wmsURL: string;
  wmsParameters: any = {};
  wmsPalette: string = 'RdYlBu';
  wmsColourCount: number = 11;
  wmsReverse: boolean = true;
  wmsRange: Array<number> = [0, 255];
  mapUnits: string = 'units';
  mapTitle: string = 'Fuel Moisture Content';

  // initial center position for the map
  lat: number = -22.673858;
  lng: number = 129.815982;

  geoJsonObject: Object = null;
  vectorLayer:VectorLayer;
  selectedCoordinates:Array<number>;

  mapClick(clickEvent){
    this.selectedCoordinates=[clickEvent.coords.lng,clickEvent.coords.lat];
    this.chartHeight=150;
  }

  clicked(clickEvent) {
    this.selectedCoordinates=[clickEvent.latLng.lng(),clickEvent.latLng.lat()];
    this.chartHeight=150;
  }

  staticStyles:any={
      clickable: true,
      fillOpacity: 0,
      fillColor: null,//'#80F090',
      strokeWeight: 0.5,
      strokeColor: '#444'
    };

  styleFunc(feature) {
    //console.log(this.changeCount);
    console.log(feature);
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

  dateChanged(dateText: string) {
    this.wmsParameters.time = `${dateText}T00%3A00%3A00.000Z`;
    this.wmsLayer.buildMap();
  }

  ngAfterViewInit() {
  }
  theMap: any

  ngOnInit() {
  }

  layerChanged(layer) {
    this.layerVariable = layer.variable;
    this.wmsParameters.layers = this.layerVariable;
    this.mapTitle = layer.name;
    this.mapUnits = layer.units;
    this.wmsPalette = layer.palette.name;
    this.wmsColourCount = layer.palette.count;
    this.wmsReverse = layer.palette.reverse;
    this.wmsRange = layer.range;

    this.wmsLayer.buildMap();

    //    console.log(layer);
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
}
