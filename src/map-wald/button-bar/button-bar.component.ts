import { Component, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';


declare var Plotly: any;

@Component({
  selector: 'button-bar',
  template: `<div class="button-bar bb-vertical">
  <ng-content></ng-content>
</div>

`,styles: [`
`]})
export class ButtonBarComponent implements AfterViewInit  {

  constructor(){

  }

  ngAfterViewInit(){

  }
}