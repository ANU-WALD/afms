import { Component, OnInit, AfterViewInit } from '@angular/core';
import {GoogleMapsAPIWrapper} from 'angular2-google-maps/core/services';
//import GoogleMaps from 'google-maps';
import {SampleService,WMSService} from 'map-wald';

const BASE_URL='http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-wms-layer',
  templateUrl: './wms-layer.component.html',
  styleUrls: ['./wms-layer.component.scss']//,
//  providers: [GoogleMapsAPIWrapper],
})
export class WMSLayerComponent implements OnInit{
    constructor(private _wmsService:WMSService,public _wrapper:GoogleMapsAPIWrapper) {
      this.name = 'This is the map';
//        console.log(wmsService.doYouLoveMaps());
      //console.log(_wrapper);
      this.url='ub8/au/treecover/250m/ANUWALD.TreeCover.AllYears.250m.nc';
    }

    map: any;
    // google maps zoom level

    overlay:any;
    zoom: number = 4;
    url:string;

    name: string;

    ngOnInit() {
       console.log('ngOnInit!');
//      var map = this._wrapper.getNativeMap();
//      console.log(map);

      this._wrapper.getNativeMap().then((theMap)=>{
        console.log(theMap);
        this.map = theMap;

        this.overlay = this._wmsService.buildImageMap(
            ()=>this.map,
            (z)=>`${BASE_URL}/wms/${this.url}?`,
            (z)=>{ return{
                colorscalerange:"0.0001,100",
                layers:"AllYears",
                time:"2016-12-31",
                styles:"boxfill/anu_wald_darkgreen",
                transparent:true,
                belowmincolor:'transparent'
              }
            },
            ()=>1.0
          );

        this.map.overlayMapTypes.push(this.overlay);
      }).catch((e)=>console.log(e));
    }

//    ngAfterViewInit(){
//       console.log('ngAfterViewInit!');
////      var map = this._wrapper.getNativeMap();
////      console.log(map);
//
//      this._wrapper.getNativeMap().then((theMap)=>{
//        console.log(theMap);
//        this.map = theMap;
//      }).catch((e)=>console.log(e));
//    }
}
