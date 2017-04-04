import { Component, ViewChild, OnInit } from '@angular/core';
import {GoogleMapsAPIWrapper} from 'angular2-google-maps/core/services';
//import GoogleMaps from 'google-maps';
import {SampleService,WMSService} from 'map-wald';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit {

    constructor(private _wmsService:WMSService) {
      this.name = 'This is the map';
//        console.log(wmsService.doYouLoveMaps());
//      console.log(_wrapper);
    }

    map: any;
    // google maps zoom level
    zoom: number = 4;

    // initial center position for the map
    lat: number = -17.673858;
    lng: number = 120.815982;
    name: string;

    @ViewChild('mapDiv') mapDiv: Component;
    ngAfterViewInit() {
//      console.log(this.mapDiv);
//
//      var map = this._wrapper.getNativeMap();
//      console.log(map);
//
//      map.then((theMap:any)=>{
//        console.log(theMap);
//        this.map = theMap;
//      });

        //      this.theMap = new GoogleMaps.Map(this.mapDiv, {
        //          center: { lat: -28.0, lng: 22.0 },
        //          zoom: 6
        //      });

    }
    theMap: any

  ngOnInit() {
  }

}
