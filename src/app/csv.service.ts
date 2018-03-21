import {Injectable} from '@angular/core';

@Injectable()
export class CsvService {

  constructor() {
  }

  public getCsv(labels: string[], columns: Array<number[]>): string {

    if (labels.length !== columns.length) {
      throw new Error('Number of labels must be same as number of columns');
    }

    const formatted_cols = columns.map(this.convertNullToNAN);
    const zipped = this.zipColumns.apply(this, formatted_cols);
    const header = labels.join(',') + '\n';
    const data_csv = zipped.map(f => f.join(',')).join('\n');

    return header + data_csv;
  }

  private zipColumns(...cols: any[][]): any[][] {

    const common_length: number = cols[0].length;
    for (let col of cols) {
      if (col.length !== common_length) {
        throw new Error('Columns must be the same length');
      }
    }

    const output = cols[0].map((val, index) => {
      const row = [val];
      for (const col of cols.slice(1)) {
        row.push(col[index]);
      }

      return row;
    });

    return output;
  }

  private convertNullToNAN(column: any[]): any[] {
    return column.map(e => e ? e : 'NA');
  }

}
