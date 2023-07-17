
// @dynamic
export class InterpolationService{
  static templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g;
  private static isDefined(val:any){
    return val!==undefined && val!==null;
  }

  public static interpolate(expr: string, params?: any): string {
    if(typeof expr !== 'string' || !params) {
      return expr;
    }

    return expr.replace(InterpolationService.templateMatcher, (substring: string, b: string) => {
      let r = InterpolationService.getValue(params, b);
      return InterpolationService.isDefined(r) ? r : substring;
    });
  }

  static getValue(target: any, key: string): string {
    let keys = key.split('.');
    key = '';
    do {
      key += keys.shift();
      if(InterpolationService.isDefined(target) && InterpolationService.isDefined(target[key]) && (typeof target[key] === 'object' || !keys.length)) {
        target = target[key];
        key = '';
      } else if(!keys.length) {
        target = undefined;
      } else {
        key += '.';
      }
    } while(keys.length);

    return target;
  }
}
