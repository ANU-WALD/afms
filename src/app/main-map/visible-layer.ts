import {InterpolationService, CatalogHost, UTCDate} from 'map-wald';
import {FMCLayer} from '../layer';
import {environment} from '../../environments/environment';

const TDS_URL = environment.tds_server;

export class VisibleLayer {
  host:CatalogHost;
  url: string = TDS_URL;
  downloadURL: string;
  path: string;
  legendImageURL: string = null;
  opacity = 1.0;
  wmsParameters: any;

  static leading0(n: number): string {
    if (n < 10) {
      return '0' + n;
    }
    return '' + n;
  }

  applyFixed() {
    if (this.layer.wmsParams) {
      Object.assign(this.wmsParameters, this.layer.wmsParams);
    }
  }

  dateText(date: UTCDate): string {
    const fmt = this.layer.timePeriod.format || '{{year}}-{{month}}-{{day}}T00%3A00%3A00.000Z';
    return InterpolationService.interpolate(fmt, {
      year: date.getUTCFullYear(),
      month: VisibleLayer.leading0(date.getUTCMonth() + 1),
      day: VisibleLayer.leading0(date.getUTCDate())
    });
  }

  setDate(newDate: UTCDate) {
    this.updateParameters(newDate);
  }

  constructor(public layer: FMCLayer, currentDate?: UTCDate) {
    if (layer&&currentDate) {
      this.updateParameters(currentDate);
    }
  };

  updateParameters(currentDate: UTCDate) {
    currentDate = this.layer.effectiveDate(currentDate);
    this.path = InterpolationService.interpolate(this.layer.path, {
      year: currentDate.getUTCFullYear(),
      month: VisibleLayer.leading0(currentDate.getUTCMonth() + 1),
      day: VisibleLayer.leading0(currentDate.getUTCDate())
    });

    if (this.layer.source === 'tds') {
      let base = this.layer.host||TDS_URL;
      this.url = `${base}/wms/${this.path}`;

      var url = 
      `${this.path}?service=WCS&version=1.0.0&request=GetCoverage&coverage=${this.layer.variable_name}&format=GeoTIFF_Float&time=${this.dateText(currentDate)}`;
//T00:00:00Z
      this.downloadURL = `${base}/wcs/${url}`;
    }

    this.wmsParameters = {
      layers: this.layer.variable_name,
      time: this.dateText(currentDate),
      styles: '',
      transparent: true,
      tiled: true,
      feature_count: 101
    };

    if (currentDate > this.layer.timePeriod.end) {
      this.wmsParameters.time = this.dateText(this.layer.timePeriod.end);
    }

    this.applyFixed();

    if (this.layer.palette && this.layer.palette.image) {
      this.legendImageURL = this.getLegendUrl();
    }
  }

  getLegendUrl(): string {
    const p = this.wmsParameters;
    return `${this.url}?request=GetLegendGraphic&layer=${p.layers}&palette=${p.styles.split('/')[1]}\
        &colorscalerange=${this.layer.range.join(',')}&numcolorbands=${p.numcolorbands}`;
  }
}
