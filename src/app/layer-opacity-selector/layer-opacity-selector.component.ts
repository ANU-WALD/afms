import { Component, OnInit, EventEmitter, Output } from '@angular/core';

class OpacityOption {
  label: string;
  opacityValue: number;

  constructor(label: string, opacityValue: number) {
    this.label = label;
    this.opacityValue = opacityValue;
  }
}

@Component({
  selector: 'fmc-layer-opacity-selector',
  templateUrl: './layer-opacity-selector.component.html',
  styleUrls: ['./layer-opacity-selector.component.scss']
})
export class LayerOpacitySelectorComponent implements OnInit {

  @Output() opacityChanged: EventEmitter<number> = new EventEmitter<number>();

  selectedOpacity: OpacityOption;
  opacities: OpacityOption[];

  constructor() { }

  ngOnInit() {
    this.opacities = [new OpacityOption('Opaque', 1.0), 
                      new OpacityOption('Transparent', 0.6)];
    this.selectedOpacity = this.opacities[0];
  }

  opacityChange() {
    console.log('Layer opacity selection changed to ' + this.selectedOpacity.label + 
      '(' + this.selectedOpacity.opacityValue + ')');
    this.opacityChanged.emit(this.selectedOpacity.opacityValue);
  }

}
