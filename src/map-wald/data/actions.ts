import {MappedLayer} from './mapped-layer';
import { Layer } from './catalog';

export type LayerAction = 'replace' | 'add' | string;

export type LayerFilter = (l:MappedLayer)=>boolean;

export interface LayerSelection{
  layer:Layer;
  action: LayerAction;
  filter?: LayerFilter;
}
