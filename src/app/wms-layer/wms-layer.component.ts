import { Component, OnInit, AfterViewInit } from '@angular/core';
import {GoogleMapsAPIWrapper} from 'angular2-google-maps/core/services';
//import GoogleMaps from 'google-maps';
import {SampleService,WMSService} from 'map-wald';
import {SelectionService} from '../selection.service';

const BASE_URL='http://gsky-dev.nci.org.au';
//'http://dapds00.nci.org.au/thredds';

@Component({
  selector: 'app-wms-layer',
  templateUrl: './wms-layer.component.html',
  styleUrls: ['./wms-layer.component.scss']//,
//  providers: [GoogleMapsAPIWrapper],
})
export class WMSLayerComponent implements OnInit{
    constructor(private _wmsService:WMSService,
                public _wrapper:GoogleMapsAPIWrapper,
                private selection:SelectionService) {
      this.name = 'This is the map';
//        console.log(wmsService.doYouLoveMaps());
      //console.log(_wrapper);
//      this.url='ub8/au/treecover/250m/ANUWALD.TreeCover.AllYears.250m.nc';
      this.url='ows';

      this.selection.dateChange.subscribe((dateTxt:string)=>{
        this.buildMap(dateTxt);
      });
    }
/*
/ows?time=2010-09-22T00%3A00%3A00.000Z&srs=EPSG%3A3857&transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&feature_count=101&service=WMS&version=1.1.1&request=GetMap&layers=Fenner%3AFMC&bbox=15028131.257091936%2C-3757032.814272985%2C16280475.528516259%2C-2504688.542848654&width=256&height=256

*/

    map: any;
    // google maps zoom level

    overlay:any;
    zoom: number = 4;
    url:string;

    name: string;

    leading0(n:number):string {
      if(n<10){
        return '0'+n;
      }
      return ''+n;
    }

    buildMap(dateText:string){
      this._wrapper.getNativeMap().then((theMap)=>{
        console.log(dateText);
        this.map = theMap;

        this.overlay = this._wmsService.buildImageMap(
            ()=>this.map,
            (z)=>`${BASE_URL}/${this.url}?`,
            (z)=>{
              var date_text=`${this.selection.year}-${this.leading0(this.selection.month)}-${this.leading0(this.selection.day)}`;
              return{
                colorscalerange:"0.0001,100",
                layers:"Fenner%3AFMC",
                time:`${date_text}T00%3A00%3A00.000Z`,
                styles:"",
                transparent:true,
                tiled:true,
                feature_count:101
              }
            },
            ()=>1.0
          );

        this.map.overlayMapTypes.removeAt(0);
        this.map.overlayMapTypes.push(this.overlay);
//        this.map.overlayMapTypes.push(this.overlay);
      }).catch((e)=>console.log(e));


    }
    ngOnInit() {
       console.log('ngOnInit!');
//      var map = this._wrapper.getNativeMap();
//      console.log(map);

      this._wrapper.getNativeMap().then((theMap)=>{
        console.log(theMap);
        this.map = theMap;

        this.overlay = this._wmsService.buildImageMap(
            ()=>this.map,
            (z)=>`${BASE_URL}/${this.url}?`,
            (z)=>{
              var date_text=`${this.selection.year}-${this.leading0(this.selection.month)}-${this.leading0(this.selection.day)}`;
              return{
                colorscalerange:"0.0001,100",
                layers:"Fenner%3AFMC",
                time:`${date_text}T00%3A00%3A00.000Z`,
                styles:"",
                transparent:true,
                tiled:true,
                feature_count:101
              }
            },
            ()=>1.0
          );

/* /ows?time=2010-09-22T00%3A00%3A00.000Z
        &srs=EPSG%3A3857
        &transparent=true
        &format=image%2Fpng
        &exceptions=application%2Fvnd.ogc.se_xml
        &styles=
        &tiled=true
        &feature_count=101
        &service=WMS
        &version=1.1.1
        &request=GetMap
        &layers=Fenner%3AFMC
        &bbox=15028131.257091936%2C-3757032.814272985%2C16280475.528516259%2C-2504688.542848654
        &width=256&height=256
*/

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
