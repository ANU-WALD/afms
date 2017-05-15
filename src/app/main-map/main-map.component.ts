import { Component, ViewChild, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { Http, Response } from '@angular/http';
import {GoogleMapsAPIWrapper} from '@agm/core/services';
import {CSVService,WMSService,WMSLayerComponent} from 'map-wald';
import {SelectionService} from '../selection.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';

const BASE_URL='http://gsky-dev.nci.org.au/ows';
//'http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {

    constructor(private _wmsService:WMSService,
                _activatedRoute: ActivatedRoute,
                private _csv:CSVService,
                private selection:SelectionService,
                private http:Http) {
      this.selection.loadFromURL(_activatedRoute);
      this.selection.dateChange.subscribe((dateTxt:string)=>{
        this.dateChanged(dateTxt);
      });
      this.wmsURL = BASE_URL;
      this.wmsParameters = {
//        colorscalerange:"0.0001,100",
        layers:"Fenner%3AFMC",
        time:`${this.selection.dateText()}T00%3A00%3A00.000Z`,
        styles:"",
        transparent:true,
        tiled:true,
        feature_count:101
      }
      var component = this;
      this.http.get('assets/selection_layers/HR_Regions_river_region.json')
        .map((r)=>r.json())
        .subscribe((data)=>{
          component.geoJsonObject=data;
        });
    }

    map: any;
    // google maps zoom level
    zoom: number = 4;

    wmsURL:string;
    wmsParameters:any = {};
    wmsPalette:string='RdYlBu';
    wmsColourCount:number=11;
    wmsReverse:boolean=true;
    wmsRange:Array<number>=[0,255];
    mapUnits:string='units';
    mapTitle:string='Fuel Moisture Content';

    // initial center position for the map
    lat: number = -17.673858;
    lng: number = 120.815982;

    geoJsonObject:Object=null;

    clicked(clickEvent) {
//      console.log(clickEvent);
    }

    styleFunc(feature) {
     return ({
       clickable: true,
       fillOpacity:0,
       fillColor: null,//'#80F090',
       strokeWeight: 0.5,
       strokeColor:'#444'
     });
    }

    @ViewChild('mapDiv') mapDiv: Component;
    @ViewChild('wms') wmsLayer: WMSLayerComponent;

    dateChanged(dateText:string){
      this.wmsParameters.time=`${dateText}T00%3A00%3A00.000Z`;
      this.wmsLayer.buildMap();
    }

    ngAfterViewInit() {
    }
    theMap: any

  ngOnInit() {
  }

}
