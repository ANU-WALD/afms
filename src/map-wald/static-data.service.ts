import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CatalogHost } from './data/catalog';
import { Observable } from 'rxjs';
import { publishReplay, refCount } from 'rxjs/operators';

@Injectable()
export class StaticDataService {
  cache:{[key:string]:Observable<any>}={};

  constructor(private http:HttpClient) {

  }

  get(host:CatalogHost,path:string):Observable<any>{
    var url = `${host.url}${path}`;
    if(!this.cache[url]){
      let uniqueUrl = url;
      if(uniqueUrl.indexOf('?')<0){
        uniqueUrl += '?';
      } else {
        uniqueUrl += '&'
      }
      uniqueUrl += `time=${new Date().getTime()}`;

      this.cache[url] = this.http.get(uniqueUrl).pipe(
        publishReplay(),refCount());
    }

    return this.cache[url];
  }
}
