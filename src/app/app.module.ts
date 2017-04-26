import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import {AgmCoreModule} from '@agm/core';
import { MapWaldModule } from 'map-wald';
import {SelectionService} from './selection.service';

import { MainMapComponent } from './main-map/main-map.component';
import { MapControlComponent } from './map-control/map-control.component';
import { ChartsComponent } from './charts/charts.component';
import { DateControlComponent } from './date-control/date-control.component';

var key='WENFO_GOOGLE_MAPS_API_KEY';

@NgModule({
  declarations: [
    AppComponent,
    MainMapComponent,
    MapControlComponent,
    ChartsComponent,
    DateControlComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: key
    }),
    MapWaldModule.forRoot()
  ],
  providers: [SelectionService],
  bootstrap: [AppComponent]
})
export class AppModule { }
