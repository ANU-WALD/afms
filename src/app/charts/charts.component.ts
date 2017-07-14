import { Component, ElementRef, AfterViewInit,Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ProjectionService } from 'map-wald';
import { SelectionService } from '../selection.service';
import { TimeseriesService } from '../timeseries.service';
import { Http } from '@angular/http';
import { LatLng } from '../latlng';
import { GeoTransform } from './geotransform'
//import * as proj4 from 'proj4';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import * as Plotly from 'plotly.js/dist/plotly-basic';

const CHART_YEARS = 4;

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements AfterViewInit, OnChanges {
  @Input() coordinates:LatLng;
  @Input() year: number;

  havePlot:boolean=false;
  wpsRequest: string = 'http://gsky-dev.nci.org.au/ows?service=WPS&request=Execute&version=1.0.0&Identifier=geometryDrill&DataInputs=geometry%3D%7B%22type%22%3A%22FeatureCollection%22%2C%22features%22%3A%5B%7B%22type%22%3A%22Feature%22%2C%22geometry%22%3A%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B%2035.0000%2C%2055.5000%5D%2C%5B%2035.5000%2C%2055.5000%5D%2C%5B%2035.5000%2C%2055.0000%5D%2C%5B%2035.0000%2C%2055.0000%5D%2C%5B%2035.0000%2C%2055.5000%5D%5D%5D%7D%7D%5D%7D&status=true&storeExecuteResponse=true';

  constructor(private timeseries:TimeseriesService,
              private http:Http,
              private _element:ElementRef,
              private _selection:SelectionService) {

    //defs['SR-ORG:6842']="+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371007.181 +b=6371007.181 +units=m +no_defs";
    //    var p = Proj('EPSG:4326','PROJCS["unnamed",GEOGCS["Unknown datum based upon the custom spheroid",DATUM["Not specified (based on custom spheroid)",SPHEROID["Custom spheroid",6371007.181,0]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Sinusoidal"],PARAMETER["longitude_of_center",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["Meter",1]]')
    // TODO Read from DAS
    var alice=[-23.6980,133.8807];
    this.coordinates={
      lat:alice[0],
      lng:alice[1]
    };

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

    var component=this;
    window.onresize = function(e) {
      component.resizePlot();
    };

  }

  ngOnChanges(event){
    if(!this.coordinates){
      return;
    }

    this.updateChart(CHART_YEARS);
  }

  updateChart(yearCount: number){
    var selectedYear = this.year;
    var dataSeries = [];

    for (var i = 0; i < CHART_YEARS; i++) {
      var year = selectedYear - i;
      var observable = this.timeseries.getTimeSeries(this.coordinates,year);

      var newDataSeries = {
        year: year,
        observable: observable
      }

      dataSeries.push(newDataSeries);

    }

    var observables = dataSeries.map(s=>s.observable);

    Observable.forkJoin(observables).forEach((data:any)=>{

      var traces = [];
      for (let index in data) {
        var dataset = data[index];

        // Set all datasets to the same year so that they are overlayed with
        // each other rather than shown sequentially
        dataset.time = dataset.time.map(d=>new Date(d.setFullYear(selectedYear)));

        var color=+index?'rgb(229,242,248)':'rgb(85,115,181)';
        var trace = {
          x: dataset.time,
          y: dataset.lfmc_mean,
          name: dataSeries[index].year.toString(),
          mode: 'lines+markers',
          connectgaps: true,

          marker:{
            size:+index?4:6,
            color:color
          },
          line:{
            color:color
          }
        };

        traces.push(trace);

      }

      traces.reverse();
      this.buildChart(traces);

    })

  }

  ngAfterViewInit() {
  }

  buildChart(series:Array<any>){
    var node = this._element.nativeElement.querySelector('.our-chart');
    var width:number=this._element.nativeElement.clientWidth;
    var height:number=this._element.nativeElement.clientHeight;

    //if(!width){ // TODO: HACK
    //  setTimeout(()=>this.buildChart(series),500);
    //}

    Plotly.purge(node);

    Plotly.plot( node, series, {
      margin: {
        t:30,
        l:45,
        r:10,
        b:20
      },
      xaxis:{
        tickformat:'%d/%b',
      },
      yaxis:{
        hoverformat:'.2f',
        title:'%'
      },
      height:height,
      width:width,
      title:`Fuel Moisture Content (%) at ${this.coordinates.lat.toFixed(3)},${this.coordinates.lng.toFixed(3)}`,
      showlegend:false
    },
    {
      displaylogo: false,
      modeBarButtonsToRemove: ['hoverCompareCartesian','hoverClosestCartesian',
        'lasso2d','select2d', 'toggleSpikelines']
    } );
    this.havePlot=true;
  }

  resizePlot(){
    if(!this.havePlot){
      return;
    }
    var node = this._element.nativeElement.querySelector('.our-chart');

    Plotly.Plots.resize(node);
  }

}
