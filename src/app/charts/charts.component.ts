import { Component, ElementRef, AfterViewInit,Input, OnChanges } from '@angular/core';
import { SelectionService } from '../selection.service';
import { Http } from '@angular/http';
import * as proj4 from 'proj4';
//const Plotly = require('plotly.js');
declare var Plotly:any;

let dap = require('dap-query-js');

export interface FmcTile{
  filename:string;
  year:number;
  tile:string;
}

export class GeoTransform{
  affine:Array<number>;

  constructor(points:Array<number>){
    this.affine=points;
  }

  toRowColumn(x:number,y:number):Array<number>{
    var col = Math.round((x-this.affine[0])/this.affine[1]);
    var row = Math.round((y-this.affine[3])/this.affine[5]);
    return [row,col];
  }
}

const DAP_SERVER='http://dapds00.nci.org.au/thredds/dodsC/ub8/au/FMC/sinusoidal/';
@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements AfterViewInit, OnChanges {
  @Input() coordinates:Array<number>;

  wpsRequest: string = 'http://gsky-dev.nci.org.au/ows?service=WPS&request=Execute&version=1.0.0&Identifier=geometryDrill&DataInputs=geometry%3D%7B%22type%22%3A%22FeatureCollection%22%2C%22features%22%3A%5B%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B%2035.0000%2C%2055.5000%5D%2C%5B%2035.5000%2C%2055.5000%5D%2C%5B%2035.5000%2C%2055.0000%5D%2C%5B%2035.0000%2C%2055.0000%5D%2C%5B%2035.0000%2C%2055.5000%5D%5D%5D%7D%7D%5D%7D&status=true&storeExecuteResponse=true';
  files:Array<FmcTile>;

  dasCache:{[key:string]:any}={};
  ddxCache:{[key:string]:any}={};
  geoTransforms:{[key:string]:GeoTransform}={};
  projection:proj4.Static;

  constructor(private http:Http, private _element:ElementRef,private _selection:SelectionService) {

    //defs['SR-ORG:6842']="+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs";
//    var p = Proj('EPSG:4326','PROJCS["unnamed",GEOGCS["Unknown datum based upon the custom spheroid",DATUM["Not specified (based on custom spheroid)",SPHEROID["Custom spheroid",6371007.181,0]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Sinusoidal"],PARAMETER["longitude_of_center",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["Meter",1]]')
    // TODO Read from DAS
    var def ="+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs";

    this.projection = proj4(def);
    var alice=[-23.6980,133.8807];
    this.coordinates=alice;

    http.get('assets/config/fmc_filelist.json').map(r=>r.json()).forEach(val=>{
      var fileList = val.files;
      this.files = fileList.map(fn=>{
        var elements=fn.split('.');
        return {
          filename:fn,
          year:+elements[1],
          tile:elements[2]
        };
      });

      var uniqueTiles = Array.from(new Set(this.files.map(t=>t.tile)));

      uniqueTiles.forEach(tileLoc=>{
        var tile = this.files.find(t=>t.tile===tileLoc);
        var fn = tile.filename;
        http.get(`${DAP_SERVER}${fn}.das`).map(resp=>resp.text())
          .map(dap.parseDAS).forEach((das:any)=>{
            this.dasCache[tileLoc]=das;
            var tmp = das.variables.sinusoidal;
            var geo = tmp.GeoTransform.trim().split(' ').map(s=>+s);
            this.geoTransforms[tileLoc]=new GeoTransform(geo);

            this.findTile(lng,lat);
        });

        http.get(`${DAP_SERVER}${fn}.ddx`).map(resp=>resp.text())
          .map(dap.parseDDX).forEach(ddx=>{
            this.ddxCache[tileLoc]=ddx;
            this.findTile(lng,lat);
        });
      });
    });

//    http.get(`${DAP_SERVER}${fn}.ddx`).toPromise().then(resp=>{
//      var txt = resp.text();
//      var parsed = dap.parseDDX(txt);
//      console.log('DDX',parsed);
//    });

//    this.http.get(this.wpsRequest)
//      .map((r) => r.text())
//      .subscribe((txt) => {
//        var data = (new DOMParser()).parseFromString(txt, 'text/xml');
//        //          console.log(data);
//        //          var d2:Element = data.getElementsByTagName('ExecuteResponse')[0];console.log(d2);
//        //          d2 = d2.getElementsByTagName('ProcessOutputs')[0];console.log(d2);
//        //          d2 = d2.getElementsByTagName('Output')[0];console.log(d2);
//        //          d2 = d2.getElementsByTagName('Data')[0];console.log(d2);
//        //          d2 = d2.getElementsByTagName('ComplexData')[0];
//
//        var d2 = data.getElementsByTagName('ComplexData');
//        //          console.log(d2);
//        var result = Array.prototype.slice.call(d2).map((d) => d.textContent).map(JSON.parse);
//        //          console.log(result);
//      });

   }

   ngOnChanges(event){
     if(!this.coordinates){
       return;
     }

     var tileMatch = this.findTile(this.coordinates[0],this.coordinates[1]);
     if(!tileMatch.tile){
       return;
     }

     var year = this._selection.year;

     var fn = this.files.find(f=>(f.tile===tileMatch.tile)&&(f.year===year)).filename;
     var [r,c]=tileMatch.cell;
     var url = `${DAP_SERVER}${fn}.ascii?lfmc_mean[0:1:45][${r}:1:${r}][${c}:1:${c}]`;
     this.http.get(url).map(r=>r.text())
       .map(txt=>dap.parseData(txt,this.dasCache[tileMatch.tile]))
       .map(dap.simplify)
       .forEach((data:any)=>{
         this.buildChart(data.lfmc_mean,data.time);
       })
   }

  ngAfterViewInit() {
  }

  buildChart(values:Array<number>,dates:Array<Date>){
    var node = this._element.nativeElement.querySelector('.our-chart');

    Plotly.purge(node);

    Plotly.plot( node, [
      {
        x: dates,
        y: values
      }], {
      margin: {
        t: 0,
        l:20,
        r:10,
        b:20
      },
      width:'100%'
     } );
  }

  findTile(lng:number,lat:number):{tile:string,cell:Array<number>}{
    var projected = this.projection.forward([lng,lat]);

    var candidateTiles = Object.keys(this.dasCache).map(tile=>{
      var das = this.dasCache[tile];
      var geo = this.geoTransforms[tile];
      var ddx = this.ddxCache[tile];

      if(!das||!geo||!ddx){
        return null;
      }
      var [row,col] = geo.toRowColumn(projected[0],projected[1]);

      if((row<0)||(row>=+ddx.variables.x.dimensions[0].size)||
         (col<0)||(col>=+ddx.variables.y.dimensions[0].size)){
        return null;
      }

      return {
        tile:tile,
        cell:[row,col]
      };
    }).filter(t=>t&&t.tile);

    if(candidateTiles.length>1){
      throw `Error matching coordinates to tile`;
    }
    return candidateTiles[0];
  }

}
