// TODO: All plot generating code should be pulled out into a service (e.g.,
// plotly.service)
import { Component, ElementRef, AfterViewInit,Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ProjectionService } from 'map-wald';
import { SelectionService } from '../selection.service';
import { TimeseriesService } from '../timeseries.service';
import { Http } from '@angular/http';
import { LatLng } from '../latlng';
import { GeoTransform } from './geotransform';
import { CsvService } from '../csv.service';
//import * as proj4 from 'proj4';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import * as Plotly from 'plotly.js/dist/plotly-basic';
import * as FileSaver from 'file-saver';

const CHART_YEARS = 4;
const ALICE = [-23.6980,133.8807];

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  providers: [CsvService],
})

export class ChartsComponent implements AfterViewInit, OnChanges {
  @Input() coordinates:LatLng;
  @Input() year: number;

  fullTimeSeries = null;
  havePlot:boolean=false;

  constructor(private timeseries:TimeseriesService,
              private http:Http,
              private csv_service: CsvService,
              private _element:ElementRef,
              private _selection:SelectionService) {

    this.coordinates={
      lat:ALICE[0],
      lng:ALICE[1]
    };

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

  setFullTimeSeries(data: any[]) {
    // TODO: make this more generic - currently only works with the FMC data

    let data_copy = Array.from(data);

    data_copy.reverse();

    let fullTimeSeries = {labels: [], columns: [] };

    let time = [];
    let lfmc_mean = [];

    fullTimeSeries.labels = ['date', 'lfmc_mean'];

    for (let series of data_copy){
      time = time.concat(series.time);
      lfmc_mean = lfmc_mean.concat(series.lfmc_mean);
    }

    time = time.map(t => t.toISOString());

    fullTimeSeries.columns =[time, lfmc_mean];

    this.fullTimeSeries = fullTimeSeries;

  }

  updateChart(yearCount: number){
    var selectedYear = this.year;
    var dataSeries = [];

    for (var i = 0; i < CHART_YEARS; i++) {
      var year = selectedYear - i;
      var observable = this.timeseries.getTimeSeries(this.coordinates, year);

      var newDataSeries = {
        year: year,
        observable: observable
      }

      dataSeries.push(newDataSeries);

    }

    var observables = dataSeries.map(s=>s.observable);

    Observable.forkJoin(observables)
      .subscribe((data:any)=>{

      this.setFullTimeSeries(data);

      var traces = [];
      for (let index in data) {
        let dataset = data[index];

        // Set all datasets to the same year so that they are overlayed with
        // each other rather than shown sequentially
        let chartTimestamps: Date[] = dataset.time.map(d => {
          let modifiedDate = new Date(d);
          modifiedDate.setFullYear(selectedYear);
          return modifiedDate;
        });

        var color=+index?'rgb(229,242,248)':'rgb(85,115,181)';
        var trace = {
          x: chartTimestamps,
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

    },
    (error)=>{
      console.log(error);
    });
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

  downloadData() {

    // TODO: set the filename to something more meaningful!

    if (this.fullTimeSeries) {

      let output = new Blob(
        [this.csv_service.getCsv(this.fullTimeSeries.labels, this.fullTimeSeries.columns)], 
        {type: "text/plain;charset=utf-8"});
      FileSaver.saveAs(output, "data.csv");

    }

  }

}
