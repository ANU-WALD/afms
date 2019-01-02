import { Injectable, getModuleFactory } from '@angular/core';
import { of, Observable, forkJoin } from 'rxjs';
import { LayersService, IncidentFeed } from './layers.service';
import { map, switchAll, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

const CORS_PROXY='https://cors-anywhere.herokuapp.com/';

function simpleJSONTranslate(event:any,coordKey:string):any{
  return {
    type:'Feature',
    geometry:{
      type:'Point',
      coordinates:(<string>event[coordKey]).split(',').map(c=>+c).reverse()
    },
    properties:event
  };
}

@Injectable({
  providedIn: 'root'
})
export class IncidentsService {
  translations={
    ACT:(json:any[])=>{
      const features = json.map(evt=>{
        let geom:any;
        if(evt.polygon.coordinates.length>1){
          let coords:number[] = evt.polygon.coordinates.map(c=>+c);
          let coordinates:number[][] = [];
          for(var i = 0; i < coords.length; i+=2){
            coordinates.push([coords[i+1],coords[i]]);
          }
          geom = {
            type:'Polygon',
            coordinates:[coordinates]
          }
        } else {
          geom = {
            type:'Point',
            coordinates:evt.point.coordinates.map(c=>+c).reverse()
          };
        }
        return {
          type:'Feature',
          geometry:geom,
          properties:evt
        };
      });
      return {
        features:features
      };
    },
    NT:(json:any)=>{
      const incidents:any[] = json.incidents;
      const features = incidents.map(entry=>simpleJSONTranslate(entry,'coordinate'));
      return {
        features:features
      };
    },
    SA:(json:any[])=>{
      const features = json.map(entry=>simpleJSONTranslate(entry,'Location'));
      return {
        type:'FeatureCollection',
        features:features
      };
    }
  }

  constructor(private layers:LayersService,
              private http:HttpClient) { }

  private get(feed:IncidentFeed,name:string):Observable<any> {
    const url = `${CORS_PROXY}${feed.url}`;

    if(feed.format==='GeoJSON'){
      const retrieval = this.http.get(url);
      return retrieval;
    }

    // if(feed.format==='GeoRSS'){
    //   return this.http.get(url,{
    //     responseType:'text'
    //   }).pipe(
    //     map(body=>{
    //       console.log(body);
    //       let doc = new DOMParser().parseFromString(body, 'text/xml');
    //       console.log(doc);
    //       return {
    //         features:[]
    //       };
    //     })
    //   );
    // }

    if(feed.format==='KML'){
      return this.http.get(url,{
        responseType:'text'
      }).pipe(
        map(body=>{
          // console.log(body);
          let doc = new DOMParser().parseFromString(body, 'text/xml');
          return this.kmlToFeatureCollection(doc);
        })
      );
    }

    if(feed.format==='Custom'&&this.translations[name]){
      return this.http.get(url).pipe(
        map(this.translations[name])
      );
    }

    return of({
      features:[]
    });
  }

  private kmlToFeatureCollection(kml:Document):any{
    const root = kml.firstElementChild.firstElementChild;
    const places = root.getElementsByTagName('Placemark');
    const features:any[] = [];
    for(var i = 0; i< places.length; i++){
      const place = places.item(i);
      const feature = {
        type:'Feature',
        geometry:null,
        properties:{
          name:place.getElementsByTagName('name').item(0).textContent,
          description:place.getElementsByTagName('description').item(0).textContent,
        }
      };
      feature.geometry = {
        type:'Point',
        coordinates:place.getElementsByTagName('Point').item(0)
                         .getElementsByTagName('coordinates').item(0)
                         .textContent.split(',').map(n=>+n)
      };
      features.push(feature);
    }

    return {
      type:'FeatureCollection',
      features:features
    };
  }

  all():Observable<any>{
    return this.layers.incidentFeeds.pipe(
      map(feeds=>{
        const keys = Object.keys(feeds);
        return forkJoin(keys.map(k=>this.get(feeds[k],k)))
      }),
      switchAll(),
      map((data:any[])=>{
        return {
          type:'FeatureCollection',
          features:[].concat(...data.map(d=>d.features))
        };
      })
    );
  }
}
