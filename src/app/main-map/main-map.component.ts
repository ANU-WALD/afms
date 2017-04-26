import { Component, ViewChild, OnInit } from '@angular/core';
import {GoogleMapsAPIWrapper} from '@agm/core/services';
import {WMSService,WMSLayerComponent} from 'map-wald';
import {SelectionService} from '../selection.service';

const BASE_URL='http://gsky-dev.nci.org.au/ows';
//'http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {

    constructor(private _wmsService:WMSService,
                private selection:SelectionService) {
      this.selection.dateChange.subscribe((dateTxt:string)=>{
        this.dateChanged(dateTxt);
      });
      this.wmsURL = BASE_URL;
      this.wmsParameters = {
        colorscalerange:"0.0001,100",
        layers:"Fenner%3AFMC",
        time:`${this.selection.dateText()}T00%3A00%3A00.000Z`,
        styles:"",
        transparent:true,
        tiled:true,
        feature_count:101
      }
    }

    map: any;
    // google maps zoom level
    zoom: number = 4;

    wmsURL:string;
    wmsParameters:any = {};

    // initial center position for the map
    lat: number = -17.673858;
    lng: number = 120.815982;

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
