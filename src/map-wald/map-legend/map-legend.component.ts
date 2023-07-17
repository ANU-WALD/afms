import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { PaletteService } from '../palette.service';

@Component({
  selector: 'map-legend',
  template: `<div class="map-legend panel panel-group">
<ng-template #tooltipContent>
  <span [innerHtml]=helpText></span>
</ng-template>
<strong>{{title}} <span *ngIf="mapUnits" [innerHTML]="'('+mapUnits+')'"></span>
        <span *ngIf="helpText"
              [ngbTooltip]="tooltipContent"
              [placement]="tooltipPlacement"
              container="body">
          <i class="fa fa-info-circle"></i>
        </span>
</strong>

  <div *ngIf="!imageURL">
    <div style="display:table;line-height:15px">
      <div style="display:table-row;padding:0;"
          *ngFor="let colour of colours; let i=index">
        <div class="legend-colour">
          <i class="legend-entry" [ngStyle]="{background:colour}"></i>
        </div>
        <div class="legend-label">
          <span [innerHTML]="generatedLabels[i]"></span>
        </div>
      </div>
    </div>
  </div>

  <div *ngIf="imageURL">
    <img [src]="imageURL">
  </div>
  <p *ngIf="attributionLink">Source: <a [href]="attributionLink">{{attribution || 'details'}}</a></p>
  <p *ngIf="attribution&&!attributionLink">Source: {{attribution}}</p>
</div>
`,styles: [`
.map-legend{
  display:block;
  background: white;
}

.legend-colour{
  display:table-cell;
  padding:0px;
}

.legend-label{
  display:table-cell;
  padding:0px 4px 2px 2px;
  font-size:10px;
  vertical-align:middle;
}

.legend-entry {
  float: left;
  width: 15px !important;
  height: 15px !important;
}
`]})
export class MapLegendComponent implements OnInit {
  @Input() imageURL: string
  @Input() colours: Array<string> = ['red', 'white', 'blue'];
  @Input() labels: Array<string> = [];//['-','-','-'];
  @Input() title: string = 'the title';
  @Input() mapUnits :string = '';
  @Input() helpText:string='No comment';
  @Input() tooltipPlacement:string='right';
  @Input() attribution: string;
  @Input() attributionLink: string;

  generatedLabels: string[] = [];
  _cbPalette:string
  _cbCount:number;
  _cbReverse:boolean;
  _cbRange:Array<number>;

  @Input() set cbPalette(cbp:string){
    this._cbPalette = cbp;
    this.generatePalette();
  }

  get cbPalette():string{return this._cbPalette;}

  @Input() set cbCount(cbc:number){
    this._cbCount=cbc;
    this.generatePalette();
  }

  get cbCount():number{return this._cbCount;}

  @Input() set cbReverse(cbr:boolean){
    this._cbReverse=cbr;
    this.generatePalette();
  }

  get cbReverse():boolean{return this._cbReverse;}

  @Input() set cbRange(cbr:Array<number>){
    this._cbRange = cbr;
    this.generatePalette();
  }

  get cbRange():Array<number>{return this._cbRange;}

  generateLabels(count:number):Array<string>|null{
    if(!this._cbRange||!count){
      return null;
    }

    var delta = (this._cbRange[1]-this._cbRange[0])/(count);
    var result = [];
    var lower=this._cbRange[0];
    let  decimalPlaces = Math.max(0,2-(+Math.log10(this._cbRange[1]-this._cbRange[0]).toFixed()));
    decimalPlaces = Math.min(decimalPlaces,10);
    var upper;
    for(let i=1;i<(count);i++){
      upper = this._cbRange[0]+i*delta;
      result.push(`${this.formatValue(lower,decimalPlaces)}-${this.formatValue(upper,decimalPlaces)}`);
      lower = upper;
    }
    result.push('&ge;'+this.formatValue(upper,decimalPlaces));
    result.reverse();
    return result;
  }

  generatePalette(){
    if(!this._cbPalette||!this._cbCount){
      return;
    }

    this._palettes.getPalette(this._cbPalette,this._cbReverse,this._cbCount)
      .subscribe(palette=>{
        this.colours = palette.slice().reverse();
        this.generatedLabels = this.labels || this.generateLabels(this.colours.length) || palette;
    });
  }

  formatValue = function(val:number,decimalPlaces:number):string{
    if(!val){
      if(val===0){
        return '0';
      }
      return '-';
    }
    // Add thousand's separator. Source: http://stackoverflow.com/a/2901298
    var parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if(decimalPlaces===0){
      return parts[0];
    }

    if((decimalPlaces!==null) &&(decimalPlaces!==undefined) && (parts.length===2)){
      parts[1] = parts[1].substr(0,decimalPlaces);
      parts[1] = parts[1].replace(/0+$/, '');
    }
    return parts.join('.');
  };

  constructor(private _palettes:PaletteService) { }

  ngOnInit() { }

}
