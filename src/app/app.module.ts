import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import {AgmCoreModule} from 'angular2-google-maps/core/core-module';
import { SampleModule } from 'map-wald';

import { MainMapComponent } from './main-map/main-map.component';
import { WMSLayerComponent } from './wms-layer/wms-layer.component';
import { MapControlComponent } from './map-control/map-control.component';
import { ChartsComponent } from './charts/charts.component';

@NgModule({
  declarations: [
    AppComponent,
    MainMapComponent,
    WMSLayerComponent,
    MapControlComponent,
    ChartsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AgmCoreModule.forRoot(),
    SampleModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
