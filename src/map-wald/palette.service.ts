import { Injectable } from '@angular/core';
import {palettes} from './colorbrewer';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export type ColourSpecification = string;
export type ColourPalette = Array<ColourSpecification>;


const DEFAULT_NUM_COLOURS=3;

@Injectable()
export class PaletteService {
  namedPalettes:{[key:string]:ColourPalette} = {};

  constructor(private _http:HttpClient) {

  }

  private _source:string='';
  set source(val:string){
    this._source=val;
  }

  getPalette(name:string,reverse?:boolean,numColours?:number):Observable<ColourPalette>{
    var palette:(ColourPalette|null)=null;
    if(this.namedPalettes[name]){
      palette = this.namedPalettes[name];
    } else if(palettes[name]){
      palette = palettes[name][numColours||DEFAULT_NUM_COLOURS];
    }

    if(palette){
      if(reverse){
        return of(palette.slice().reverse());
      }
      return of(palette.slice());
    }

    return this._http.get(this._source+'/'+name+'.pal',{ responseType: 'text' }).pipe(
      map((text:string)=>this.parseNCWMSPalette(text)));
  }

  parseNCWMSPalette(txt:string):ColourPalette{
    return txt.split('\n')
      .map(ln=>ln.replace(/\#.*/g,'').trim().replace(/ +/g,' '))
      .filter(ln => ln.length)
      .map(e=> `rgb(${e.split(' ').join(',')})`);
  }

  colourIndex(val:number,min:number,max:number,count:number):number{
    let point = (val-min)/(max-min);
    let pos = Math.round(point*(count-1));
    return pos;
  }
}
