import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import {GoogleMapsAPIWrapper} from '@agm/core/services';

@Component({
  selector: 'app-map-control',
  templateUrl: './map-control.component.html',
  styleUrls: ['./map-control.component.scss']
})
export class MapControlComponent implements OnInit,AfterViewInit {
  @ViewChild('mapControl') mapControl: Component;
  @Input() position:string = 'TOP_RIGHT';

  constructor(private _el:ElementRef, public _wrapper:GoogleMapsAPIWrapper) { }

  ngOnInit() {
  }

  ngAfterViewInit(){
    this._wrapper.getNativeMap().then((m)=>{
      var content:Node = this._el.nativeElement.querySelector('.map-control-content');

      var controlDiv = document.createElement('div');
      controlDiv.appendChild(content);
      //controlDiv.onclick = () => { this.controlClick.next(null); };
      (<any>m).controls[(<any>window).google.maps.ControlPosition[this.position]].push(controlDiv);
    });
  }

}
