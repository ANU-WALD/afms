import { Injectable } from '@angular/core';

@Injectable()
export class CsvService {

  constructor() { }

  public getCsv(labels: string[], columns: Array<number[]>): string {

    if (labels.length != columns.length) {
      throw new Error('Number of labels must be same as number of columns');
    }

    let formatted_cols = columns.map(this.convertNullToNAN);

    let zipped = this.zipColumns.apply(this, formatted_cols);

    let output = labels.join(',') + '\n';

    let data_csv = zipped.map(f => f.join(',')).join('\n');

    output = output + data_csv;

    return output

  }

  private zipColumns(...cols: any[][]): any[][] {

    let common_length: number = cols[0].length;
    for (let col of cols) {
      if (col.length != common_length) {
        throw new Error('Columns must be the same length');
      }
    }

    let output = cols[0].map((val, index) => {

      let row = [val];

      for (let col of cols.slice(1)){
        row.push(col[index]);
      }

      return row
    });

    return output;

  }

  private convertNullToNAN(column: any[]): any[]{

    let column_copy = Array.from(column);

    column_copy = column_copy.map(e => e? e: 'NAN');

    return column_copy;

  }

}
