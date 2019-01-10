// TODO: All plot generating code should be pulled out into a service (e.g., plotly.service)
import {Component, ElementRef, AfterViewInit, Input, OnChanges, OnInit} from '@angular/core';
import {Observable, forkJoin} from 'rxjs';
import {CatalogHost, InterpolationService, TimeSeries, UTCDate} from 'map-wald';
import {SelectionService} from '../selection.service';
import {TimeseriesService} from 'map-wald';
import {Http} from '@angular/http';
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

  constructor(private timeseries: TimeseriesService,
              private http: Http,
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
  }

  ngOnChanges(event) {
    if (!this.coordinates) {
      return;
    }

    this.updateChart(this.getChartRange());
  }

  private getChartRange(): number {
    return Math.min(CHART_YEARS, this.year - this.layer.layer.timePeriod.start.getUTCFullYear())
  }

  setFullTimeSeries(data: any[]) {
    // TODO: make this more generic - currently only works with the FMC data

    const data_copy = Array.from(data);

    data_copy.reverse();

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

  updateChart(yearCount: number) {
    const selectedYear = this.year;
    const dataSeries: {year:number,observable:Observable<TimeSeries>}[] = [];

    this.havePlot = false;
    this.hasBeenLoaded = true;

    Plotly.purge(this.node);


    const host = this.layer.host;
    const baseFn = this.layer.layer.path;
    const variable = this.layer.layer.variable_name;

    for (let i = 0; i <= yearCount; i++) {
      const year = selectedYear - i;
      const fn = InterpolationService.interpolate(baseFn, {
        year: year
      });
      const observable = this.timeseries.getTimeseries(host, fn, variable, this.coordinates, this.layer.layer.indexing);

      const newDataSeries = {
        year: year,
        observable: observable
      };

      dataSeries.push(newDataSeries);
    }

    const observables = dataSeries.map(s => s.observable);

    forkJoin(observables)
      .subscribe((data) => {

          this.setFullTimeSeries(data);

          const traces = [];
          for (let index=0;index<data.length;index++) {
            const dataset = data[index];

            // Set all datasets to the same year so that they are overlayed with
            // each other rather than shown sequentially

            const chartTimestamps: UTCDate[] = dataset.dates.map(d => {
              const yearOffset = selectedYear-d.getFullYear();
              const modifiedDate = this.layer.layer.reverseDate(d);
              modifiedDate.setUTCFullYear(modifiedDate.getUTCFullYear()+yearOffset);
              return modifiedDate;
            });

            const color = +index ? 'rgb(198,219,239)' : 'rgb(33,113,181)';
            const trace = {
              x: chartTimestamps,
              y: dataset.values,
              name: dataSeries[index].year.toString(),
              mode: 'lines+markers',
              connectgaps: true,

              marker: {
                size: +index ? 4 : 6,
                color: color
              },
              line: {
                color: color
              }
            };

            traces.push(trace);

          }

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
        showlegend: false
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

