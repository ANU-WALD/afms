export class GeoTransform{
  affine:Array<number>;

  constructor(points:Array<number>){
    this.affine=points;
  }

  toRowColumn(x:number,y:number):Array<number>{
    var col = (x-this.affine[0])/this.affine[1];
    var row = (y-this.affine[3])/this.affine[5];
    return [row,col];
//    return [Math.floor(row),Math.floor(col)];
  }
}
