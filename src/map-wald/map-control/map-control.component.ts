import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import {GoogleMapsAPIWrapper} from '@agm/core';

@Component({
  selector: 'map-control',
  template: `<div #mapControl class="map-control-content">
  <ng-content></ng-content>
</div>
`,styles: [`.map-control-content{
  background: transparent;
}
`],
})
export class MapControlComponent implements OnInit,AfterViewInit {
  @ViewChild('mapControl',{static:false}) mapControl: Component;
  @Input() position:string = 'TOP_RIGHT';

  constructor(private _el:ElementRef, public _wrapper:GoogleMapsAPIWrapper) { }

  ngOnInit() {
  }

  ngAfterViewInit(){
    this._wrapper.getNativeMap().then((m)=>{
      let content: HTMLElement = this._el.nativeElement.querySelector('.map-control-content');

      // If content of the map control is not already wrapped in a div, do it
      // now.
      if (content.nodeName !== "DIV") {
        let controlDiv: HTMLElement = document.createElement('div');
        controlDiv.appendChild(content);
        content = controlDiv;
      }

      (<any>m).controls[(<any>window).google.maps.ControlPosition[this.position]].push(content);
    });
  }

}
