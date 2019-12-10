// TODO: All plot generating code should be pulled out into a service (e.g., plotly.service)
import {Component, ElementRef, AfterViewInit, Input, OnChanges, OnInit} from '@angular/core';
import {Observable, forkJoin, Subscription} from 'rxjs';
import {CatalogHost, InterpolationService, TimeSeries, UTCDate} from 'map-wald';
import {SelectionService} from '../selection.service';
import {TimeseriesService} from 'map-wald';
import {LatLng} from '../latlng';
import {CsvService} from '../csv.service';
import * as Plotly from 'plotly.js/dist/plotly-basic';
import * as FileSaver from 'file-saver';
import {VisibleLayer} from 'app/main-map/visible-layer';

const CHART_YEARS = 4;
const ALICE = [-23.6980, 133.8807];

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  providers: [CsvService],
})

export class ChartsComponent implements AfterViewInit, OnChanges, OnInit {
  @Input() coordinates: LatLng;
  @Input() year: number;
  @Input() layer: VisibleLayer;

  fullTimeSeries = null;
  havePlot = false;
  node: HTMLElement;
  hasBeenLoaded = false;
  private dataSubscription: Subscription;

  constructor(private timeseries: TimeseriesService,
              private csv_service: CsvService,
              private _element: ElementRef) {

    this.coordinates = {
      lat: ALICE[0],
      lng: ALICE[1]
    };

    const component = this;
    window.onresize = function (e) {
      component.resizePlot();
    };

  }

  ngOnInit() {
    this.node = this._element.nativeElement.querySelector('.our-chart');
    if(this.hasBeenLoaded){
      this.updateChart();
    }
  }

  ngOnChanges(event) {
    if (!this.coordinates) {
      return;
    }

    this.updateChart();
  }

  // TODO used for downloads, but won't currently keep things in correct order!
  setFullTimeSeries(data: TimeSeries[]) {
    // TODO: make this more generic - currently only works with the FMC data

    const data_copy = Array.from(data);

    data_copy.sort((a,b)=>a.dates[0].getUTCFullYear()-b.dates[0].getUTCFullYear());
    // data_copy.reverse();

    const fullTimeSeries = {labels: [], columns: []};

    let time = [];
    let data_variable = [];

    fullTimeSeries.labels = ['date', this.layer.layer.variable_name];

    for (const series of data_copy) {
      time = time.concat(series.dates);
      data_variable = data_variable.concat(series.values);
    }

    time = time.map(t => t.toISOString());

    fullTimeSeries.columns = [time, data_variable];

    this.fullTimeSeries = fullTimeSeries;

  }

  updateChart() {
    const selectedYear = this.year;
    const dataSeries: {year:number,observable:Observable<TimeSeries>}[] = [];

    this.havePlot = false;
    this.hasBeenLoaded = true;

    if(!this.node){
      return;
    }

    Plotly.purge(this.node);

    if(this.dataSubscription){
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }

    const host = this.layer.host;
    const baseFn = this.layer.layer.pathTimeSeries;
    const variable = this.layer.layer.variable_name;

    let timePeriod = this.layer.layer.timePeriod;
    let startYear = timePeriod.start.getUTCFullYear();
    let endYear = timePeriod.end.getUTCFullYear();

    for (let yr = startYear; yr <= endYear; yr++) {
      const fn = InterpolationService.interpolate(baseFn, {
        year: yr
      });
      const observable = this.timeseries.getTimeseries(host, fn, variable, this.coordinates, this.layer.layer.indexing);

      const newDataSeries = {
        year: yr,
        observable: observable
      };

      if(yr===selectedYear){
        dataSeries.unshift(newDataSeries);
      } else {
        dataSeries.push(newDataSeries);
      }
    }

    const observables = dataSeries.map(s => s.observable);

    this.dataSubscription = forkJoin(observables)
      .subscribe((data) => {
          this.dataSubscription = null;
          this.setFullTimeSeries(data);
          const chartTimestamps: UTCDate[] = data[1].dates;

          const values = chartTimestamps.map((_,i)=>data.map(ts=>ts.values[i]).filter(v=>!isNaN(v)));
          const minimums = values.map(vals=>Math.min(...vals));
          const maximums = values.map(vals=>Math.max(...vals));
          const medians = values.map(vals=>{
            const sorted = vals.slice().sort();
            if(sorted.length%2){
              return sorted[(sorted.length-1)/2];
            }
            const idx = sorted.length/2;
            return (sorted[idx] + sorted[idx-1])/2;
          });

          const findYears = function(valuesToMatch:number[]) {
            return valuesToMatch.map((v,i)=>{
              return data[data.findIndex(ts=>ts.values[i]===v)].dates[i].getFullYear();
            });
          };
          const minYears = findYears(minimums);
          const maxYears = findYears(maximums);

          const mainColour = 'rgb(33,113,181)';
          const traces = [
            {
              x: chartTimestamps,
              y: data[0].values,
              name: ''+selectedYear,
              mode: 'lines+markers',
              connectgaps: true,
              fillcolor:'rgb(198,219,239)',
              marker: {
                size: 6,
                color: mainColour
              },
              line: {
                color: mainColour
              }
            },
            {
              x: chartTimestamps,
              y: medians,
              name: 'median',
              mode: 'lines',
              connectgaps: true,
              fillcolor:'rgb(229,229,254)',
              marker: {
                size: 6,
                color: mainColour
              },
              line: {
                color: mainColour,
                dash:'dash'
              }
            },
            {
              x: chartTimestamps,
              y: minimums,
              text:minYears,
              name: 'Lowest in record',
              mode:'lines',
              type:'scatter',
              fill:'tozeroy',
              fillcolor:'white',
              hoverinfo: 'y+text',
              // showlegend:true,
              line: {
                color: 'rgb(131,163,131)'
              }
              // hoverinfo:'skip'
            },
            {
              x: chartTimestamps,
              y: maximums,
              text:maxYears,
              name: 'Highest in record',
              mode:'lines',
              type:'scatter',
              fill:'tozeroy',
              fillcolor:'rgb(198,219,239)',
              hoverinfo: 'y+text',
              line: {
                color: 'rgb(131,163,131)'
              }
              // hoverinfo:'skip'
            }
          ];

          traces.reverse();
          this.buildChart(traces);

        },
        (error) => {
          console.log(error);
        });
  }


  ngAfterViewInit() {
  }

  buildChart(series: Array<any>) {
    const width: number = this._element.nativeElement.clientWidth;
    const height: number = this._element.nativeElement.clientHeight;

    let y_axis_title: number;
    const custom = this.layer.layer.chartConfig;
    let yRange: Array<number>;

    if (custom && custom.yaxis) {
      y_axis_title = custom.yaxis.title;
      if (custom.yaxis.fixed) {
        yRange = this.layer.layer.range;
      }
    }

    Plotly.plot(this.node, series, {
        margin: {
          t: 30,
          l: 45,
          r: 10,
          b: 20
        },
        xaxis: {
          tickformat: '%d/%b',
        },
        yaxis: {
          hoverformat: '.2f',
          title: y_axis_title ? y_axis_title : '%',
          fixedrange: true,
          range: yRange
        },
        height: height,
        width: width,
        title: `${this.layer.layer.name} (${this.layer.layer.units}) at ${this.coordinates.lat.toFixed(3)},${this.coordinates.lng.toFixed(3)}`,
        showlegend: true
      },
      {
        displaylogo: false,
        modeBarButtonsToRemove: ['hoverCompareCartesian', 'hoverClosestCartesian',
          'lasso2d', 'select2d', 'toggleSpikelines']
      });
    this.havePlot = true;
  }

  resizePlot() {
    if (!this.havePlot) {
      return;
    }

    Plotly.Plots.resize(this.node);
  }

  downloadData() {

    if (this.fullTimeSeries) {


      const filename_lat = this.coordinates.lat.toFixed(6).replace('.', '_');
      const filename_lng = this.coordinates.lng.toFixed(6).replace('.', '_');
      const variable_name = this.layer.layer.variable_name;

      const fileName = `${variable_name}_${this.year - CHART_YEARS}_${this.year}_${filename_lat}_${filename_lng}.csv`;

      const output = new Blob(
        [this.csv_service.getCsv(this.fullTimeSeries.labels, this.fullTimeSeries.columns)],
        {type: 'text/plain;charset=utf-8'});
      FileSaver.saveAs(output, fileName);

    }

  }
}

