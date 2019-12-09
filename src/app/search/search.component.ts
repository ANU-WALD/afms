import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {Observable, of} from 'rxjs';
import {GeocodingResult,GeocodingService} from 'map-wald-visual';
import {LatLng} from '../latlng';
import { debounceTime, distinctUntilChanged, filter, concatMap, tap } from 'rxjs/operators';


@Component({
  selector: 'fmc-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  address: any;
  @Output() coordinatesSelected: EventEmitter<LatLng> = new EventEmitter<LatLng>();

  constructor(private _geocoder: GeocodingService) {
  }

  ngOnInit() {
  }

  getFormattedAddress(result: any): string {
    return result.formatted_address;
  }

  // TODO: Change this to a method. Keep getting errors when I try to do it so leaving it as an arrow function for now.
  search = (term: Observable<string>) => {
    return this.searchInner(term);
  }

  searchInner(term: Observable<string>): Observable<GeocodingResult[]> {
    return term.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter(t => t.length > 2),
      concatMap((r) => {
        const possibleLatLon = r.split(/[,\/ ]+/);
        if (possibleLatLon.length === 2) {
          const [lat, lng] = possibleLatLon.map(s => +s.trim());
          if ((lat < -7) && (lat > -45) && (lng > 110) && (lng < 170)) {
            return of([{
              formatted_address: r,
              coords: [lng, lat]
            }]);
          }
        }

        return this._geocoder.geocode(r);
      }));
  }

  maybe(accessor: string) {
    let source: any = this;
    accessor.split('.').forEach(a => {
      if (source) {
        source = source[a];
      }
    });
    return source;
  }

  gotoLocation() {
    let coords: Array<number> = this.maybe('address.coords');

    if (!coords) {
      const loc = this.maybe('address.geometry.location');
      if (loc) {
        coords = [loc.lng(), loc.lat()];
      }
    }

    if (coords) {
      this.coordinatesSelected.emit({
        lng: coords[0],
        lat: coords[1]
      });
    }
  }
}
