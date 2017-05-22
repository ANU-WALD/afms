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
import { LayerControlComponent } from './layer-control/layer-control.component';
import { ChartsComponent } from './charts/charts.component';
import { DateControlComponent } from './date-control/date-control.component';
import {routes,routeParameters} from './router-config';

//export var key=null;//'WENFO_GOOGLE_MAPS_API_KEY';

@NgModule({
  declarations: [
    AppComponent,
    MainMapComponent,
    ChartsComponent,
    DateControlComponent,
    LayerControlComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: key
    }),
    MapWaldModule.forRoot({paths:routeParameters}),
    RouterModule.forRoot(routes,{ useHash: true })
  ],
  providers: [SelectionService],
  bootstrap: [AppComponent]
})
export class AppModule { }
