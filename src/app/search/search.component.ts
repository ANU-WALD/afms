import { Component, OnInit, Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {GeocodingService} from 'map-wald';
import {LatLng} from '../latlng';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/combineAll';

const states = ['Alabama', 'Alaska', 'American Samoa', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'District Of Columbia', 'Federated States Of Micronesia', 'Florida', 'Georgia',
  'Guam', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Marshall Islands', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Northern Mariana Islands', 'Ohio', 'Oklahoma', 'Oregon', 'Palau', 'Pennsylvania', 'Puerto Rico', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virgin Islands', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

@Component({
  selector: 'fmc-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  address:any;
  @Output() coordinatesSelected: EventEmitter<LatLng> = new EventEmitter<LatLng>();

  constructor(private _geocoder:GeocodingService) { }

  ngOnInit() {
  }

  formatter = (result: any) => result.formatted_address;

  search = (term:Observable<string>) => {
    return term
      .debounceTime(200)
      .distinctUntilChanged()
      .filter(term=>term.length>2)
      .concatMap((r)=>{
        var possibleLatLon = r.split(/[,\/]/);
        if(possibleLatLon.length===2){
          console.log(possibleLatLon);
          var [lat,lng] = possibleLatLon.map(s=>+s.trim());
          if((lat<-7)&&(lat>-45)&&(lng>110)&&(lng<170)){
            console.log('Good coords');
            return Observable.of([{
              formatted_address:r,
              coords:[lng,lat]
            }]);
          }
        }
        return this._geocoder.geocode(r);
      })
      .map(res=>{
        console.log(res);
        return res;
      });
  }
//      .map(term => term.length < 2 ? []
//        : states.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10));

    maybe(accessor){
      var source:any = this;
      accessor.split('.').forEach(a=>{
        if(source){
          source = source[a];
        }
      });
      return source;
    }

  gotoLocation(){
    var coords:Array<number> = this.maybe('address.coords');

    if(!coords){
      var loc = this.maybe('address.geometry.location');
      if(loc){
        coords = [loc.lng(),loc.lat()];
      }
    }

    if(coords){
      console.log('GOTO:', coords);
      this.coordinatesSelected.emit({
        lng:coords[0],
        lat:coords[1]
      });
    }
  }
}
