import { environment } from '../environments/environment'

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { AgmCoreModule } from '@agm/core';
import { MapWaldModule } from 'map-wald';

import { SelectionService } from './selection.service';
import { LayersService } from './layers.service';
import { MainMapComponent } from './main-map/main-map.component';
import { LayerControlComponent } from './layer-control/layer-control.component';
import { ChartsComponent } from './charts/charts.component';
import { DateControlComponent } from './date-control/date-control.component';
import { routes, routeParameters } from './router-config';
import { VectorLayerSelectionComponent } from './vector-layer-selection/vector-layer-selection.component';
import { SearchComponent } from './search/search.component';
import { BaseLayerSelectionComponent } from './base-layer-selection/base-layer-selection.component';
import { LayerOpacitySelectorComponent } from './layer-opacity-selector/layer-opacity-selector.component';
import { AboutComponent } from './about/about.component';
import { SplashModalComponent } from './splash-modal/splash-modal.component';
import { BaseLayerService } from './base-layer.service';

@NgModule({
  declarations: [
    AppComponent,
    MainMapComponent,
    ChartsComponent,
    DateControlComponent,
    LayerControlComponent,
    VectorLayerSelectionComponent,
    SearchComponent,
    BaseLayerSelectionComponent,
    LayerOpacitySelectorComponent,
    AboutComponent,
    SplashModalComponent
  ],
  imports: [
    BrowserModule,
    AgmCoreModule.forRoot({
      apiKey: environment.google_maps_api_key
    }),
    FormsModule,
    HttpModule, // old
    HttpClientModule, // new
    NgbModule.forRoot(),
    RouterModule.forRoot(routes,{ useHash: true }),
    MapWaldModule.forRoot({paths:routeParameters})
],
  entryComponents: [AboutComponent, SplashModalComponent],
  providers: [SelectionService,LayersService,BaseLayerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
