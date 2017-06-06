
export const customMatchers:any = {
  toMatchDate:function(util,customEqualityMatches){
    return {
      compare: (actual:Date,expected:Date)=>{
        var result={
          pass:false,
          message:''
        };
        result.pass = expected && actual &&
          (expected.getFullYear()===actual.getFullYear()) &&
          (expected.getMonth()===actual.getMonth()) &&
          (expected.getDate()===actual.getDate());
        if(!result.pass){
          result.message=`Expected ${expected.toDateString()}, but got ${actual.toDateString()}`;
        }
        return result;
      }
    }
  }
}
