import { TestBed, inject } from '@angular/core/testing';

import { CsvService } from './csv.service';

let testObject1 = {'time': [1,2,3], 'lvmc_mean': [4,5,6]}

describe('CsvService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CsvService]
    });
  });

  it('should throw an error if columns are different lengths', inject([CsvService], (service: CsvService) => {

    let labels = ['a', 'b', 'c'];
    let a = [1,2,3];
    let b = [3,4];
    let c = [5,6,7];

    expect(f => service.getCsv(labels, [a,b,c])).toThrowError();
  }));

  it('should throw an error if number of columns is not equal to number of labels',
    inject([CsvService], (service: CsvService) => {

      let labels = ['a', 'b', 'c', 'd'];
      let a = [1,2,3];
      let b = [3,4,5];
      let c = [5,6,7];
      
      expect(f => service.getCsv(labels, [a,b,c])).toThrowError();

  }));

  it('should return a csv', inject([CsvService], (service: CsvService) => {
      let labels = ['a', 'b', 'c'];
      let a = [1,2,3];
      let b = [3,4,5];
      let c = [5,6,7];
    expect(service.getCsv(labels, [a,b,c])).toBe('a,b,c\n1,3,5\n2,4,6\n3,5,7');
  }));

});
