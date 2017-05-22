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
const BASE_URL = 'http://130.56.242.21/ows';
//'http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {

  layerVariable: string;

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

    this.http.get(this.wpsRequest)
      .map((r) => r.text())
      .subscribe((txt) => {
        var data = (new DOMParser()).parseFromString(txt, 'text/xml');
        //          console.log(data);
        //          var d2:Element = data.getElementsByTagName('ExecuteResponse')[0];console.log(d2);
        //          d2 = d2.getElementsByTagName('ProcessOutputs')[0];console.log(d2);
        //          d2 = d2.getElementsByTagName('Output')[0];console.log(d2);
        //          d2 = d2.getElementsByTagName('Data')[0];console.log(d2);
        //          d2 = d2.getElementsByTagName('ComplexData')[0];

        var d2 = data.getElementsByTagName('ComplexData');
        //          console.log(d2);
        var result = Array.prototype.slice.call(d2).map((d) => d.textContent).map(JSON.parse);
        //          console.log(result);
      });
  }

  wpsRequest: string = 'http://gsky-dev.nci.org.au/ows?service=WPS&request=Execute&version=1.0.0&Identifier=geometryDrill&DataInputs=geometry%3D%7B%22type%22%3A%22FeatureCollection%22%2C%22features%22%3A%5B%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B%2035.0000%2C%2055.5000%5D%2C%5B%2035.5000%2C%2055.5000%5D%2C%5B%2035.5000%2C%2055.0000%5D%2C%5B%2035.0000%2C%2055.0000%5D%2C%5B%2035.0000%2C%2055.5000%5D%5D%5D%7D%7D%5D%7D&status=true&storeExecuteResponse=true';
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

  clicked(clickEvent) {
    console.log(clickEvent.feature.getProperty('PR_NAME'));
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
    this.http.get(`assets/selection_layers/${layer.jsonFilename}`)
      .map((r) => r.json())
      .subscribe((data) => {
        component.geoJsonObject = data;
      });
  }
}
