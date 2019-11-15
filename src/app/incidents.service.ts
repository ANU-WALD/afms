import { Injectable } from '@angular/core';
import { of, Observable, forkJoin } from 'rxjs';
import { LayersService, IncidentFeed } from './layers.service';
import { map, switchAll, tap, catchError } from 'rxjs/operators';
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
          const coords:number[] = evt.polygon.coordinates.map(c=>+c);
          const coordinates:number[][] = [];
          for(let i = 0; i < coords.length; i+=2){
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
    let url = `${feed.cors?'':CORS_PROXY}${feed.url}`;
    if(url.indexOf('?')<0){
      url += '?';
    } else {
      url += '&'
    }
    url += `_time=${(new Date()).getTime()}`;

    if(feed.hide){
      return of({
        features:[]
      });
    }

    if(feed.format==='GeoJSON'){
      const retrieval = this.http.get(url);
      return retrieval.pipe(tap((coll:any)=>{
        const features:any[] = coll.features;
        features.forEach(f=>{
          if(f.geometry.type==='Point'){
            f.geometry.coordinates = (<any[]>f.geometry.coordinates).map(c=>+c);
          }
        });
      }));
    }

    if(feed.format==='GeoRSS'){
      return this.http.get(url,{
        responseType:'text'
      }).pipe(
        map(body=>{
          let doc = new DOMParser().parseFromString(body, 'text/xml');
          return this.geoRSSToFeatureCollection(doc);
        })
      );
    }

    if(feed.format==='KML'){
      return this.http.get(url,{
        responseType:'text'
      }).pipe(
        map(body=>{
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

  private geoRSSToFeatureCollection(feed:Document):any{
    const entries = feed.getElementsByTagName('entry');
    const features:any[] = [];
    for(let i = 0; i< entries.length; i++){
      const entry = entries.item(i);
      const feature = {
        type:'Feature',
        geometry:null,
        properties:{
          name:entry.getElementsByTagName('title').item(0).textContent,
          description:entry.getElementsByTagName('content').item(0).textContent,
          category:entry.getElementsByTagName('category').item(0).attributes.getNamedItem('term').value
        }
      };
      const coords = entry
                    .getElementsByTagName('georss:point')
                    .item(0)
                    .textContent
                    .split(' ')
                    .map(c=>+c)
                    .reverse();

      feature.geometry = {
        type:'Point',
        coordinates: coords
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
        const obs$ = keys.map(k=>this.get(feeds[k],k).pipe(
          catchError(err=>{
            return of({
              features:[]
            });
          }),
          tap(feed=>{
            const icon = feeds[k].icon;
            feed.features.forEach(f=>{
              f.properties._display = f.properties[feeds[k].displayProperty];
              if(icon&&icon.property){
                const val = f.properties[icon.property];
                if(icon.translation){
                  f.properties._style = icon.translation[val] || 'NA';
                } else {
                  f.properties._style = val;
                }

                if(icon.exclude){
                  const exclude = icon.exclude.some(excl=>{
                    let prop:string = f.properties[excl.property]||'';
                    return !!prop.match(excl.pattern);
                  });
                  if(exclude){
                    f.properties._style = 'NA';
                  }
                }

              } else {
                f.properties._style = 'NA';
              }
            });
          }),
          map(feed=>{
           feed.features = feed.features.filter(f=>f.properties._style!=='NA')
            return feed;
          })
        ));
        return forkJoin(obs$)
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
