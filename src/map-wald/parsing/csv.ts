
export interface TableRow{
  [key:string]:any;
}

export interface CsvParserOptions {
  headerRows?:number;
  columns?: string[];
}

export function parseCSV(txt:string,options?:CsvParserOptions):TableRow[]{
  const lines = txt.split('\n');
  const headerLength = options?
    options.headerRows || (options.columns ? 0 : 1) : 1;
  const headerLines = lines.slice(0,headerLength);
  const bodyLines = lines.slice(headerLength);

  let columns = options&&options.columns;
  if(!columns){
    const header = headerLines[0];
    columns = header.split(',');
  }

  return bodyLines.filter(ln=>ln.length).map(ln=>{
    let data = ln.split(',');

    let result:TableRow = {};
    data.forEach((val,i)=>{
      result[columns[i]] = parseVal(val);
    });
    return result;
  });
}

function parseVal(val:string):any{

  // Try date...
  let components = val.split('-');
  if(components.length===3){
    let dateComponents = components.map(c=>+c);
    if(!dateComponents.some(isNaN)){
      return new Date(Date.UTC(dateComponents[0],dateComponents[1]-1,dateComponents[2]));
    }
  }

  if(val===''){
    return val;
  }

  // Try numeric
  let numeric:number = +val;
  if(!isNaN(numeric)){
    return numeric;
  }

  return val;
}
