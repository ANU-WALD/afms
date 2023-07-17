import { Injectable } from '@angular/core';
//const proj4 = require('proj4');
//const Proj = proj4.Proj;
//const defs = proj4.defs;
//proj4.InterfaceProjection;
//const InterfaceCoordinates = proj4.InterfaceCoordinates;
//const TemplateCoordinates = proj4.TemplateCoordinates;

//const proj4 = require('proj4').default;
import * as proj4 from 'proj4';
const D2R = Math.PI/180;
const TILE_SIZE=256;
const TILE_WIDTH=TILE_SIZE;
const TILE_HEIGHT=TILE_SIZE;

@Injectable()
export class WMSService {
  constructor() {
    this.webMercator = ((<any>proj4).default || proj4).Proj('EPSG:3857');
    //this.webMercator = proj4.Proj(proj4.defs('EPSG:3857'));
  }

  public webMercator: any;

  public pointToWebMercator(pt:any):{x:number,y:number}{
    var ptRadians = {x:pt.lng()*D2R,y:pt.lat()*D2R};
    var ptWM = this.webMercator.forward({x:ptRadians.x,y:ptRadians.y});
    return ptWM;
  };

  public computeTileBounds(map:any,coord:any,zoom:number):string{
    var proj = map.getProjection();
    var zfactor = Math.pow(2, zoom);
    var xScale = TILE_WIDTH/zfactor;
    var yScale = TILE_HEIGHT/zfactor;

    var topLeftLatLng = proj.fromPointToLatLng({x:coord.x * xScale, y:coord.y * yScale});
    var bottomRightLatLng = proj.fromPointToLatLng({x:(coord.x + 1) * xScale, y:(coord.y + 1) * yScale});

    var topLeftWebMercator = this.pointToWebMercator(topLeftLatLng);
    var bottomRightWebMercator = this.pointToWebMercator(bottomRightLatLng);

    if(topLeftWebMercator.x > bottomRightWebMercator.x){
      if(topLeftLatLng.lng()===180.0){
        topLeftWebMercator.x = -topLeftWebMercator.x;
      } else {
        bottomRightWebMercator.x = -bottomRightWebMercator.x;
      }
    }
    var bbox = [topLeftWebMercator.x,bottomRightWebMercator.y,bottomRightWebMercator.x,topLeftWebMercator.y];
    var bboxTxt = bbox.map((n)=>n.toFixed(20).replace(/\.?0+$/,"")); // Avoid e notation on small numbers
    return bboxTxt.join(',');
  };

  public buildImageMap(getMap:()=>any,
                       getURL:(zoom:number)=>string,
                       getOptions?:(zoom:number)=>any,
                       getOpacity?:()=>number):any{
    var me = this;
    return new (<any>window).google.maps.ImageMapType({
      getTileUrl: function(coord:any,zoom:number):string{
        var theMap = getMap();
        if(!theMap){
          return '';
        }


        var bbox = me.computeTileBounds(theMap,coord,zoom);

        var url = getURL(zoom) + '&service=WMS&version=1.1.1&request=GetMap';
        url += "&BBOX=" + bbox;      // set bounding box
        url += "&FORMAT=image/png" ; //WMS format

        var layerParams = getOptions?getOptions(zoom):{};
        layerParams.width = TILE_WIDTH;
        layerParams.height = TILE_HEIGHT;
        for(var key in layerParams){
          url += '&'+key+'='+layerParams[key];
        }
        url += "&SRS=EPSG:3857";     //set Web Mercator
        return url;
      },
      tileSize:new (<any>window).google.maps.Size(TILE_SIZE,TILE_SIZE),
      isPng:true,
      opacity:getOpacity?getOpacity():1.0
    });
  };

}
