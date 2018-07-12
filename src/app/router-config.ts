import {MapViewParameterService} from 'map-wald';
import { MainMapComponent } from './main-map/main-map.component';

export const routeParameters = ['base_layer', 'layer','vector','lat','lng','zm','dd','mm','yyyy','coords'];
MapViewParameterService.parameterNames=routeParameters;

var viewMapper = new MapViewParameterService();
var paths:Array<string> = viewMapper.routerPaths();
export let routes:Array<any> = [];
for(var p of paths){
  routes.push({path:p,component:MainMapComponent});
}
//export let routes = viewMapper.routerPaths(MainMapComponent);
