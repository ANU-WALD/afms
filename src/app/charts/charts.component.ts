import { Component, ElementRef, AfterViewInit } from '@angular/core';

//const Plotly = require('plotly.js');
declare var Plotly:any;

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements AfterViewInit {

  constructor(private _element:ElementRef) { }

  ngAfterViewInit() {
    var node = this._element.nativeElement.querySelector('.our-chart');

    Plotly.plot( node, [
      {
        x: [1, 2, 3, 4, 5],
        y: [1, 2, 4, 8, 16]
      }], {
      margin: {
        t: 0,
        l:20,
        r:10,
        b:20
      }
     } );
  }
}
