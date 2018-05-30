import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'zoom-in-button',
  templateUrl: './zoom-in.component.html',
  styleUrls: ['./zoom-in.component.scss']
})
export class ZoomInButtonComponent implements OnInit {
  @Output() zoomPress: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }

  zoomIn() {
    this.zoomPress.emit(1);
  }
}
