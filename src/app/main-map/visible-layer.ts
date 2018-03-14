import {InterpolationService} from 'map-wald/src/interpolation.service';
import {FMCLayer} from '../layer';
import {environment} from '../../environments/environment';

const TDS_URL = environment.tds_server;

export class VisibleLayer {
  url: string = TDS_URL;
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

  dateText(date: Date): string {
    const fmt = this.layer.timePeriod.format || '{{year}}-{{month}}-{{day}}T00%3A00%3A00.000Z';
    return InterpolationService.interpolate(fmt, {
      year: date.getFullYear(),
      month: VisibleLayer.leading0(date.getMonth() + 1),
      day: VisibleLayer.leading0(date.getDate())
    });
  }

  setDate(newDate: Date) {
    this.updateParameters(newDate);
  }

  constructor(public layer: FMCLayer, currentDate: Date) {
    if (layer) {
      this.updateParameters(currentDate);
    }
  };

  updateParameters(currentDate: Date) {
    this.path = InterpolationService.interpolate(this.layer.path, {
      year: currentDate.getFullYear(),
      month: VisibleLayer.leading0(currentDate.getMonth() + 1),
      day: VisibleLayer.leading0(currentDate.getDate())
    });

    if (this.layer.source === 'tds') {
      this.url = `${this.layer.host || TDS_URL}/wms/${this.path}`;
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
