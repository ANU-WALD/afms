import { Component, OnInit, Output, EventEmitter } from '@angular/core';

export class VectorLayer {
  jsonFilename: string;
  name: string;
  nameField: string;

  constructor(fn: string, n: string, nf: string) {
    this.jsonFilename = fn;
    this.name = n;
    this.nameField = nf;
  }
}

@Component({
  selector: 'fmc-vector-layer-selection',
  templateUrl: './vector-layer-selection.component.html',
  styleUrls: ['./vector-layer-selection.component.scss']
})
export class VectorLayerSelectionComponent implements OnInit {
  vectorLayers: Array<VectorLayer> = [
    new VectorLayer('states4326.json', 'States and Territories', 'STATE_NAME'),
    new VectorLayer('DefenceTA.json', 'Defence Training Areas', 'PR_NAME')
  ];

  selectedLayer:VectorLayer;

  @Output() selectedLayerChanged: EventEmitter<VectorLayer> = new EventEmitter<VectorLayer>();

  constructor() {
  }

  ngOnInit() {
    this.selectedLayer=this.vectorLayers[0];
    this.selectedLayerChanged.emit(this.selectedLayer);
  }

  layerChange(){
    this.selectedLayerChanged.emit(this.selectedLayer);
  }
}
