import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule }   from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import {AgmCoreModule} from '@agm/core';
import { MapWaldModule, MapViewParameterService } from 'map-wald';
import {SelectionService} from './selection.service';

import { MainMapComponent } from './main-map/main-map.component';
import { MapControlComponent } from './map-control/map-control.component';
import { ChartsComponent } from './charts/charts.component';
import { DateControlComponent } from './date-control/date-control.component';


export var key=null;//'WENFO_GOOGLE_MAPS_API_KEY';


let mapParameters = ['layer','vector','lat','lng','zm','dd','mm','yyyy'];
var viewMapper = new MapViewParameterService(mapParameters);

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
    MapWaldModule.forRoot({paths:mapParameters}),
    RouterModule.forRoot(viewMapper.routerPaths(MainMapComponent))
  ],
  providers: [SelectionService],
  bootstrap: [AppComponent]
})
export class AppModule { }
