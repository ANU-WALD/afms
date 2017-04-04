import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import {GoogleMapsAPIWrapper} from 'angular2-google-maps/core/services';

@Component({
  selector: 'app-map-control',
  templateUrl: './map-control.component.html',
  styleUrls: ['./map-control.component.scss']
})
export class MapControlComponent implements OnInit,AfterViewInit {
  @ViewChild('mapControl') mapControl: Component;

  constructor(private _el:ElementRef, public _wrapper:GoogleMapsAPIWrapper) { }

  ngOnInit() {
  }

  ngAfterViewInit(){
    this._wrapper.getNativeMap().then((m)=>{
      var content:Node = this._el.nativeElement.querySelector('.map-control-content');

      console.log(content);
      console.log(this._wrapper);
      console.log(m);
      var controlDiv = document.createElement('div');
      controlDiv.appendChild(content);
      //controlDiv.onclick = () => { this.controlClick.next(null); };
      (<any>m).controls[(<any>window).google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
    });
  }

}
