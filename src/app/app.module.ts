import { environment } from '../environments/environment';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { AgmCoreModule } from '@agm/core';

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
import { ContextualDataService } from './contextual-data.service';
import { ButtonBarComponent, MapControlComponent, MapLegendComponent, MapViewParameterService, MetadataService, OpendapService, PaletteService, TimeUtilsService, TimeseriesService, WMSLayerComponent, WMSService } from 'map-wald';

const services = [
  SelectionService,
  LayersService,
  BaseLayerService,
  ContextualDataService,
  WMSService,
  MapViewParameterService,
  TimeUtilsService,
  TimeseriesService,
  MetadataService,
  OpendapService,
  PaletteService
];
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
    SplashModalComponent,
    WMSLayerComponent,
    ButtonBarComponent,
    MapLegendComponent,
    MapControlComponent
  ],
  imports: [
    BrowserModule,
    AgmCoreModule.forRoot({
      apiKey: environment.google_maps_api_key
    }),
    FormsModule,
    HttpClientModule,
    NgbModule,//.forRoot(),
    RouterModule.forRoot(routes,{ useHash: true }),
],
  entryComponents: [AboutComponent, SplashModalComponent],
  providers: services,
  bootstrap: [AppComponent]
})
export class AppModule { }


// TODO: routeParameters!