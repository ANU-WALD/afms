import { Injectable } from '@angular/core';
import {MapsAPILoader} from '@agm/core';
import {Observable, from} from 'rxjs';

declare var google:any;

export interface GeocodingResult {
  formatted_address:string;
  coords: number[]
}

@Injectable()
export class GeocodingService {
  constructor(private _api:MapsAPILoader){

  }

  geocode(address:string,bnds?:any):Observable<GeocodingResult[]>{
    var promise = new Promise<GeocodingResult[]>((resolve,reject)=>{
      this._api.load().then(()=>{
        const SUCCESS_STATUSES = [
          google.maps.GeocoderStatus.OK,
          google.maps.GeocoderStatus.ZERO_RESULTS
        ];
        var service = new google.maps.Geocoder();
        service.geocode({
          address:address,
          componentRestrictions: {
            country: 'AU'
          },
          region:'AU'
        },(results:GeocodingResult[],status:any)=>{
          if(SUCCESS_STATUSES.indexOf(status)<0){
            reject();
          } else {
            resolve(results.filter(function(r:any){
              return r.formatted_address!=='Australia';
            }));
          }
        });
      });
    });

    return from(promise);
  }
}
