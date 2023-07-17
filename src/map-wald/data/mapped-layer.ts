import { Layer } from './catalog';
import { InterpolationService } from '../interpolation.service';

export type MappedLayerTypes = 'wms' | 'vector' | 'circle';

export interface MappedLayerOptions {
  legend?: boolean;
  publication?: number;
  date?: Date,

  [key: string]: any;
}

const PUBLICATION_PRIORITY_ORDER = [
  'annual',
  'monthly',
  'daily'
];

const MAKE_DOWNLOAD_URL:{[key:string]:(a:string,s:string,ml:MappedLayer)=>string} = {
  tds:(host:string,fn:string)=>{
    let components = fn.split('/');
    components.pop();
    return `${host}/catalog/${components.join('/')}/catalog.html`;
  },
  static:(host:string,fn:string,ml:MappedLayer)=>{
    return ml.layer.options.downloadPath || `${host}${fn}`;
  }
}

export const WMS_PARAMETER_NAMES:{[key:string]:Array<string>} = {
  tds: [
    'layers',
    'styles',
    'colorscalerange',
    'abovemaxcolor',
    'belowmincolor',
    'time',
    'transparent',
    'logscale'
  ],
  geoserver: [
    'transparent',
    'layers'
  ],
  esri: [
    'layers',
    'styles',
    'transparent'
  ]
};

export const WMS_URL_FORMAT:{[key:string]:string} = {
  tds:'/wms/',
  geoserver:'/wms/',
  esri:'/'
};

export const INTERPOLATED_PARAMETERS = [
  'styles',
  'layers'
];

export class MappedLayer {
  constructor(data?:any){
    Object.assign(this,data||{});
    if(this.layerType===undefined){
      this.layerType = this.wmsParameters?'wms':undefined;
    }
  }

  title:string;

  layer: Layer;
  options: MappedLayerOptions = {
    date: new Date(2016, 0, 1) // Set to most recent available date
  };

  legendURL:string;
  layerType: MappedLayerTypes;
  retrievedMetadata: {[key:string]:any} = {};

  interpolatedFile:string;
  interpolatedDownloadURL:string;
  url: string;
  wmsParameters: any = {};
  flattenedSettings: any = {};
  staticData:any;
  opacity = 1.0;

  _styleFunc: (f:any)=>void;

  description():string{
    return this.layer.description ||
      (this.retrievedMetadata &&
       this.retrievedMetadata[this.layer.descriptionField||'long_name']);
  }

  leading0(n: number): string {
    if (n < 10) {
      return '0' + n;
    }
    return '' + n;
  }

  defaultPublication():number{
    const priorityPublication = PUBLICATION_PRIORITY_ORDER.find(
      pp=>this.layer.publications.findIndex(lp=>(lp.timestep===pp)||(lp.label===pp))>=0);
    if(priorityPublication){
      return this.layer.publications.findIndex(p=>(p.label===priorityPublication)||(p.timestep===priorityPublication));
    }
    return this.layer.publications.findIndex(p => !p.skip);
  }

  update() {
    this.options.publication = (this.options.publication === undefined) ?
      this.defaultPublication() :
      this.options.publication;

    const publication = this.layer.publications[this.options.publication];

    const host = publication.options.host || {};
    const baseURL = host.url;

    const software = host.software || 'tds';

    this.interpolatedFile = (publication.options.filepath || '')
    const mapParams = Object.assign({},
      this.layer,
      publication.options,
      publication.options.mapOptions || {},
      this.options.date ? {
        decade: decadeText(this.options.date),
        year: this.options.date.getFullYear(),
        month: this.leading0(this.options.date.getMonth() + 1),
        day: this.leading0(this.options.date.getDate()),
      } : {},
      this.options,
      this.options.tags || {});

    if (mapParams.timeFormat) {
      mapParams['time'] = InterpolationService.interpolate(mapParams.timeFormat, mapParams);
    }
    mapParams.layers = mapParams.layers || mapParams.layer || mapParams.variable;
    INTERPOLATED_PARAMETERS.forEach(p=>{
      if(mapParams[p]){
        mapParams[p] = InterpolationService.interpolate(mapParams[p],mapParams);
      }
    });
    this.interpolatedFile = InterpolationService.interpolate(this.interpolatedFile, mapParams);
    this.url = baseURL + WMS_URL_FORMAT[software] + this.interpolatedFile;
    if(MAKE_DOWNLOAD_URL[software]){
      this.interpolatedDownloadURL=MAKE_DOWNLOAD_URL[software](host.downloadLink||baseURL,this.interpolatedFile,this);
    } else {
      this.interpolatedDownloadURL=host.downloadLink||null;
    }

    if(this.layer.options.legend==='wms'){
      this.legendURL = this.url + '?service=WMS&request=GetLegendGraphic&format=image/png';
      this.legendURL += `&layer=${InterpolationService.interpolate(mapParams.layers,mapParams)}`;
      this.legendURL += '&version=1.1.1';
      this.options.legend=true;
    } else {
      this.legendURL=null;
    }

    if (mapParams.vectors) {
      this.wmsParameters = null;
      this.layerType = 'vector';
      let styles = mapParams.styles || {};
      this._styleFunc = (f:any)=>{
        return styles;
      }

      if(mapParams.vectors==='point' && mapParams.styles){
        this.layerType = 'circle';
      }
    } else {
      this.layerType = 'wms';
      this.wmsParameters = {};
      WMS_PARAMETER_NAMES[software].forEach(param => {
        if (mapParams[param]) {
          this.wmsParameters[param] = mapParams[param];
        }
      });
    }
    this.flattenedSettings = mapParams;

    if(mapParams.titleFormat){
      this.title = InterpolationService.interpolate(mapParams.titleFormat,mapParams)
    } else {
      this.title = this.layer.name;
    }
  }
}

function decadeText(d: Date): string {
  let decade = d.getFullYear().toString().slice(0, 3);
  return `${decade}0-${decade}9`;
}
