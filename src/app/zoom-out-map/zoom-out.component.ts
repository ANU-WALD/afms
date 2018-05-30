import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'zoom-out-button',
  templateUrl: './zoom-out.component.html',
  styleUrls: ['./zoom-out.component.scss']
})
export class ZoomOutButtonComponent implements OnInit {
  @Output() zoomPress: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }

  zoomOut() {
    this.zoomPress.emit(1);
  }
}
